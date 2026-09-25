import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Controller, useFieldArray, useWatch, type Control } from 'react-hook-form'
import { FormField } from '@/components/common/FormField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { ProductFormValues } from '../products.schemas'
import { EMPTY_ADD_ON, EMPTY_VARIATION, formatPriceDifference } from '../products.utils'

type OptionListName = 'variations' | 'add_ons'

interface ProductOptionFieldsProps {
  control: Control<ProductFormValues>
  name: OptionListName
  /** Marks rows that aren't saved yet. Only useful when editing, where saved and new rows mix. */
  markNewRows?: boolean
  disabled?: boolean
}

const COPY: Record<OptionListName, { item: string; add: string; empty: string; namePlaceholder: string }> = {
  variations: {
    item: 'Variation',
    add: 'Add variation',
    empty: 'No variations. Customers pay the base price.',
    namePlaceholder: 'Regular',
  },
  add_ons: {
    item: 'Add-on',
    add: 'Add add-on',
    empty: 'No add-ons.',
    namePlaceholder: 'Extra Cheese',
  },
}

/** Editable rows of variations (sizes, with their own price and SKU) or add-ons (extras). */
export function ProductOptionFields({ control, name, markNewRows = false, disabled }: ProductOptionFieldsProps) {
  const { fields, append, remove } = useFieldArray({ control, name })
  const copy = COPY[name]

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.empty}</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {fields.map((field, index) => {
            const switchId = `${name}.${index}.is_available`
            return (
              <li key={field.id} className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {copy.item} {index + 1}
                  </span>
                  {markNewRows && !field.record_id && <Badge>New</Badge>}
                  <Controller
                    control={control}
                    name={`${name}.${index}.is_available`}
                    render={({ field: availability }) => (
                      <div className="flex items-center gap-2">
                        <Switch
                          id={switchId}
                          ref={availability.ref}
                          checked={availability.value}
                          onCheckedChange={availability.onChange}
                          onBlur={availability.onBlur}
                          disabled={disabled}
                        />
                        <Label htmlFor={switchId} className="text-muted-foreground">
                          {availability.value ? 'Available' : 'Unavailable'}
                        </Label>
                      </div>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="ml-auto text-destructive hover:text-destructive"
                    aria-label={`Remove ${copy.item.toLowerCase()} ${index + 1}`}
                    disabled={disabled}
                    onClick={() => remove(index)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={control}
                    name={`${name}.${index}.name`}
                    label="Name"
                    render={(input) => <Input {...input} placeholder={copy.namePlaceholder} />}
                  />
                  <FormField
                    control={control}
                    name={`${name}.${index}.price`}
                    label="Price"
                    description={
                      name === 'variations' ? (
                        <VariationPriceHint control={control} index={index} />
                      ) : (
                        'Added on top of the price.'
                      )
                    }
                    render={(input) => (
                      <InputGroup>
                        <InputGroupAddon>
                          <InputGroupText>₱</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput {...input} inputMode="decimal" placeholder="0.00" />
                      </InputGroup>
                    )}
                  />
                  {name === 'variations' && (
                    <FormField
                      control={control}
                      name={`variations.${index}.sku`}
                      label="SKU"
                      optional
                      render={(input) => <Input {...input} autoCapitalize="characters" spellCheck={false} />}
                    />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        className="self-start"
        disabled={disabled}
        onClick={() => append(name === 'variations' ? { ...EMPTY_VARIATION } : { ...EMPTY_ADD_ON })}
      >
        <PlusIcon />
        {copy.add}
      </Button>
    </div>
  )
}

/** Reminds that a variation's price replaces the base price, and shows the difference as you type. */
function VariationPriceHint({ control, index }: { control: Control<ProductFormValues>; index: number }) {
  const [price, basePrice] = useWatch({ control, name: [`variations.${index}.price`, 'base_price'] })
  const difference = price && basePrice ? formatPriceDifference(price, basePrice) : null
  return <>Replaces the base price.{difference && ` ${difference}.`}</>
}
