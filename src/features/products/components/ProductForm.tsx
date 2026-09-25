import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { FormSection } from '@/components/common/FormSection'
import { FormSwitchField } from '@/components/common/FormSwitchField'
import { LayeredImagesInput } from '@/components/common/LayeredImagesInput'
import { LoadingButton } from '@/components/common/LoadingButton'
import { ModalBody, ModalFooter } from '@/components/common/Modal'
import { Button } from '@/components/ui/button'
import { DialogClose } from '@/components/ui/dialog'
import { FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Textarea } from '@/components/ui/textarea'
import { ProductCategoryCombobox } from '@/features/productCategories/components/ProductCategoryCombobox'
import { StoreCombobox } from '@/features/stores/components/StoreCombobox'
import { useStoreName } from '@/features/stores/hooks/useStoreName'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { applyServerErrors } from '@/lib/form'
import type { ImageSaveProgress, ImageSaveStatus } from '@/lib/layered-images'
import { NO_CATEGORY, PRODUCT_IMAGE_TYPES } from '../products.constants'
import { productSchema, type ProductFormValues } from '../products.schemas'
import type { Product } from '../products.types'
import { getProductFormDefaults } from '../products.utils'
import { ProductOptionFields } from './ProductOptionFields'
import { ProductSaveConfirmDialog } from './ProductSaveConfirmDialog'

interface ProductFormProps {
  /** The product being edited. Omit to create a new one. */
  product?: Product
  submitLabel: string
  /**
   * Saves the product, then its photos, reporting each photo's status through `onImageProgress`.
   * Reject (e.g. with RTK Query's `.unwrap()`) when the product itself fails to save, so the form
   * can show the API's errors.
   */
  onSubmit: (values: ProductFormValues, onImageProgress: (key: string, status: ImageSaveStatus) => void) => Promise<unknown>
  /** True while a save is running, so the dialog can refuse to close. */
  onSavingChange: (isSaving: boolean) => void
}

/**
 * Save first validates, then asks for confirmation with a list of the changes, then saves the
 * product and its photos one request at a time. Nothing can be edited or cancelled until it's done.
 */
export function ProductForm({ product, submitLabel, onSubmit, onSavingChange }: ProductFormProps) {
  const isEditing = product !== undefined
  const form = useForm<ProductFormValues>({
    resolver: yupResolver(productSchema),
    defaultValues: getProductFormDefaults(product),
  })
  const { control } = form
  const { errors } = form.formState
  const storeId = useWatch({ control, name: 'store_id' })

  const [pendingValues, setPendingValues] = useState<ProductFormValues | null>(null)
  // The confirmation names the chosen store, loaded by id rather than from the whole store list.
  const pendingStoreName = useStoreName(pendingValues?.store_id ?? '')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [progress, setProgress] = useState<ImageSaveProgress>({})

  // Closing or reloading the tab mid-save would leave the photos half updated.
  useEffect(() => {
    if (!isSaving) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isSaving])

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const save = useSingleFlight(async (values: ProductFormValues) => {
    setIsSaving(true)
    onSavingChange(true)
    setProgress({})
    try {
      await onSubmit(values, (key, status) => setProgress((current) => ({ ...current, [key]: status })))
    } catch (error) {
      applyServerErrors(error, form.setError)
    } finally {
      setIsSaving(false)
      onSavingChange(false)
    }
  })

  const imageStatuses = Object.values(progress)
  const savingLabel =
    imageStatuses.length === 0
      ? 'Saving product details…'
      : `Saving photos: ${imageStatuses.filter((status) => status === 'done').length} of ${imageStatuses.length} done`

  return (
    // Fills the dialog: the fields scroll, the footer stays put.
    <form
      onSubmit={form.handleSubmit((values) => {
        setPendingValues(values)
        setIsConfirmOpen(true)
      })}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* Disables every field at once while saving. */}
      <fieldset disabled={isSaving} className="contents">
        <ModalBody className="flex flex-col gap-6">
          <FormErrorAlert title="Couldn't save this product" message={errors.root?.server?.message} />

          <FormSection title="Photos" description="The first photo is the product's cover on the menu.">
            <FormField
              control={control}
              name="images"
              label="Photos"
              optional
              description="PNG, JPG or WebP, up to 10 MB each. Drag to reorder. Changes are saved when you save the product."
              render={(field) => (
                <LayeredImagesInput
                  {...field}
                  accept={PRODUCT_IMAGE_TYPES.join(',')}
                  itemLabel="photo"
                  progress={progress}
                />
              )}
            />
          </FormSection>

          <FieldSeparator />

          <FormSection title="Details">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={control}
                name="store_id"
                label="Store"
                render={({ onChange, ...field }) => (
                  <StoreCombobox
                    {...field}
                    // Categories belong to a store, so a new store starts without one.
                    onChange={(value) => {
                      onChange(value)
                      form.setValue('category_id', NO_CATEGORY)
                    }}
                  />
                )}
              />
              <FormField
                control={control}
                name="category_id"
                label="Category"
                description={!storeId ? 'Pick a store first.' : undefined}
                render={(field) => (
                  <ProductCategoryCombobox
                    {...field}
                    storeId={storeId}
                    noneOption={{ value: NO_CATEGORY, label: 'No category' }}
                    // A product can point at a category that has since been archived; saving keeps it.
                    fallbackLabel={product?.category?.name ?? 'Current category (archived)'}
                  />
                )}
              />
              <FormField
                control={control}
                name="name"
                label="Name"
                render={(field) => <Input {...field} placeholder="Classic Burger" />}
              />
              <FormField
                control={control}
                name="sku"
                label="SKU"
                optional
                description="Unique within the store."
                render={(field) => <Input {...field} autoCapitalize="characters" spellCheck={false} />}
              />
            </div>
            <FormField
              control={control}
              name="description"
              label="Description"
              optional
              render={(field) => <Textarea {...field} rows={3} placeholder="Quarter-pound beef patty with cheese." />}
            />
          </FormSection>

          <FieldSeparator />

          <FormSection title="Price and preparation">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={control}
                name="base_price"
                label="Base price"
                description="What customers pay when there are no variations. A chosen variation's price replaces it."
                render={(field) => (
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>₱</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput {...field} inputMode="decimal" placeholder="0.00" />
                  </InputGroup>
                )}
              />
              <FormField
                control={control}
                name="preparation_time"
                label="Preparation time"
                optional
                render={(field) => (
                  <InputGroup>
                    <InputGroupInput {...field} inputMode="numeric" placeholder="15" />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>minutes</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                )}
              />
            </div>
          </FormSection>

          <FieldSeparator />

          <FormSection title="On the menu">
            <FormSwitchField
              control={control}
              name="is_available"
              label="Available"
              description="Customers can order it. Turn off when it runs out."
            />
            <FormSwitchField
              control={control}
              name="is_featured"
              label="Featured"
              description="Highlighted at the top of the store's menu."
            />
          </FormSection>

          <FieldSeparator />

          <FormSection
            title="Variations"
            description="Sizes or versions, e.g. Regular and Large. When a customer picks one, they pay its price instead of the base price."
          >
            <ProductOptionFields control={control} name="variations" markNewRows={isEditing} disabled={isSaving} />
          </FormSection>

          <FieldSeparator />

          <FormSection
            title="Add-ons"
            description="Extras customers can add, e.g. Extra Cheese. Their price is added on top of the product or variation price."
          >
            <ProductOptionFields control={control} name="add_ons" markNewRows={isEditing} disabled={isSaving} />
          </FormSection>
        </ModalBody>
      </fieldset>

      <ModalFooter className="items-center">
        {isSaving && (
          <p role="status" className="mr-auto text-sm text-muted-foreground sm:self-center">
            {savingLabel}
          </p>
        )}
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </DialogClose>
        <LoadingButton type="submit" isLoading={isSaving} className="ml-2">
          {submitLabel}
        </LoadingButton>
      </ModalFooter>

      <ProductSaveConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        product={product}
        pending={pendingValues}
        getStoreLabel={() => pendingStoreName ?? 'the selected store'}
        onConfirm={() => {
          setIsConfirmOpen(false)
          if (pendingValues) void save(pendingValues)
        }}
      />
    </form>
  )
}
