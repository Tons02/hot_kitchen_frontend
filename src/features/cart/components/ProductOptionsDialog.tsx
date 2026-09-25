import { yupResolver } from '@hookform/resolvers/yup'
import { CheckIcon } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { FormField } from '@/components/common/FormField'
import { LoadingButton } from '@/components/common/LoadingButton'
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { QuantityStepper } from '@/components/common/QuantityStepper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose } from '@/components/ui/dialog'
import { FieldError } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ProductThumbnail } from '@/features/products/components/ProductThumbnail'
import type { Product } from '@/features/products/products.types'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { formatPeso } from '@/lib/money'
import { cn } from '@/lib/utils'
import { cartItemOptionsSchema, MAX_LINE_QUANTITY, type CartItemOptionsValues } from '../cart.schemas'
import type { AddCartItemRequest } from '../cart.types'

interface ProductOptionsDialogProps {
  /** Kept after closing so the content doesn't blank out during the exit animation. */
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Adds the configured item. Resolves once it's handled (added, or sent to sign in). */
  onSubmit: (request: AddCartItemRequest) => Promise<void>
}

/** Choose a variation, add-ons, quantity and notes before adding a product to the cart. */
export function ProductOptionsDialog({ product, open, onOpenChange, onSubmit }: ProductOptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-lg">
        {/* Keyed so each product starts with fresh choices. */}
        {product && <ProductOptionsForm key={product.id} product={product} onSubmit={onSubmit} />}
      </ModalContent>
    </Dialog>
  )
}

function ProductOptionsForm({ product, onSubmit }: { product: Product; onSubmit: ProductOptionsDialogProps['onSubmit'] }) {
  const variations = (product.variations ?? []).filter((variation) => variation.is_available)
  const addOns = (product.add_ons ?? []).filter((addOn) => addOn.is_available)

  const form = useForm<CartItemOptionsValues>({
    resolver: yupResolver(cartItemOptionsSchema),
    defaultValues: { variation_id: '', add_on_ids: [], quantity: 1, notes: '' },
    context: { requiresVariation: variations.length > 0 },
  })
  const { control } = form
  const { isSubmitting, errors } = form.formState
  const [variationId, addOnIds, quantity] = useWatch({ control, name: ['variation_id', 'add_on_ids', 'quantity'] })

  // The chosen variation's price replaces the base price; add-ons add on top, per item.
  const variation = variations.find((item) => String(item.id) === variationId)
  const unitPrice = Number(variation?.price ?? product.base_price)
  const addOnsPrice = addOns
    .filter((addOn) => addOnIds.includes(String(addOn.id)))
    .reduce((sum, addOn) => sum + Number(addOn.price), 0)
  const total = (unitPrice + addOnsPrice) * quantity

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const submit = useSingleFlight(async (values: CartItemOptionsValues) => {
    await onSubmit({
      product_id: product.id,
      variation_id: values.variation_id ? Number(values.variation_id) : null,
      quantity: values.quantity,
      notes: values.notes || null,
      add_ons: values.add_on_ids.map((id) => ({ add_on_id: Number(id), quantity: 1 })),
    })
  })

  return (
    <>
      <ModalHeader title={product.name} description={product.description ?? undefined} />
      <form onSubmit={form.handleSubmit(submit)} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <ProductThumbnail product={product} size="lg" />
            <span className="text-sm text-muted-foreground">
              {variations.length > 0 ? 'Choose a size to see its price.' : formatPeso(product.base_price)}
            </span>
          </div>

          {variations.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">
                Choose one <span className="font-normal text-muted-foreground">(required)</span>
              </legend>
              <div role="radiogroup" aria-label="Variation" className="flex flex-col gap-2">
                {variations.map((item) => {
                  const isChosen = String(item.id) === variationId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={isChosen}
                      onClick={() => form.setValue('variation_id', String(item.id), { shouldValidate: true })}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                        'hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                        isChosen && 'border-primary bg-primary/5',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'flex size-4 items-center justify-center rounded-full border',
                            isChosen && 'border-primary bg-primary text-primary-foreground',
                          )}
                        >
                          {isChosen && <CheckIcon className="size-3" />}
                        </span>
                        {item.name}
                      </span>
                      <span className="font-medium tabular-nums">{formatPeso(item.price)}</span>
                    </button>
                  )
                })}
              </div>
              <FieldError errors={[errors.variation_id]} />
            </fieldset>
          )}

          {addOns.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">
                Add-ons <span className="font-normal text-muted-foreground">(optional)</span>
              </legend>
              <ul className="flex flex-col gap-2">
                {addOns.map((addOn) => {
                  const id = `add-on-${addOn.id}`
                  const isChecked = addOnIds.includes(String(addOn.id))
                  return (
                    <li key={addOn.id} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                      <span className="flex items-center gap-2">
                        <Checkbox
                          id={id}
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            form.setValue(
                              'add_on_ids',
                              checked === true
                                ? [...addOnIds, String(addOn.id)]
                                : addOnIds.filter((value) => value !== String(addOn.id)),
                            )
                          }
                        />
                        <Label htmlFor={id} className="font-normal">
                          {addOn.name}
                        </Label>
                      </span>
                      <span className="text-sm text-muted-foreground tabular-nums">+{formatPeso(addOn.price)}</span>
                    </li>
                  )
                })}
              </ul>
            </fieldset>
          )}

          <FormField
            control={control}
            name="notes"
            label="Notes for the kitchen"
            optional
            render={(field) => <Textarea {...field} rows={2} maxLength={255} placeholder="e.g. No onions, please." />}
          />
        </ModalBody>

        <ModalFooter className="flex-row items-center justify-between gap-3">
          <QuantityStepper
            value={quantity}
            onChange={(next) => form.setValue('quantity', next)}
            max={MAX_LINE_QUANTITY}
            label={product.name}
          />
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="hidden sm:inline-flex" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <LoadingButton type="submit" isLoading={isSubmitting} className="rounded-full">
              Add · {formatPeso(total)}
            </LoadingButton>
          </div>
        </ModalFooter>
      </form>
    </>
  )
}
