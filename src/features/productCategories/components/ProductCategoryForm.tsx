import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormErrorAlert } from '@/components/common/FormErrorAlert'
import { FormField } from '@/components/common/FormField'
import { LoadingButton } from '@/components/common/LoadingButton'
import { ModalBody, ModalFooter } from '@/components/common/Modal'
import { Button } from '@/components/ui/button'
import { DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StoreCombobox } from '@/features/stores/components/StoreCombobox'
import { useStoreName } from '@/features/stores/hooks/useStoreName'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { applyServerErrors } from '@/lib/form'
import { productCategorySchema, type ProductCategoryFormValues } from '../productCategories.schemas'
import type { ProductCategory, ProductCategoryPayload } from '../productCategories.types'
import { getProductCategoryFormDefaults, toProductCategoryPayload } from '../productCategories.utils'
import { ProductCategoryImageInput } from './ProductCategoryImageInput'
import { ProductCategorySaveConfirmDialog } from './ProductCategorySaveConfirmDialog'

interface ProductCategoryFormProps {
  /** The category being edited. Omit to create a new one. */
  category?: ProductCategory
  submitLabel: string
  /** Saves the category. Reject (e.g. with RTK Query's `.unwrap()`) so the form can show the API's errors. */
  onSubmit: (payload: ProductCategoryPayload) => Promise<unknown>
}

/** Save first validates, then asks for confirmation with a list of the changes, then saves. */
export function ProductCategoryForm({ category, submitLabel, onSubmit }: ProductCategoryFormProps) {
  const form = useForm<ProductCategoryFormValues>({
    resolver: yupResolver(productCategorySchema),
    defaultValues: getProductCategoryFormDefaults(category),
  })
  const { control } = form
  const { errors } = form.formState

  const [pendingValues, setPendingValues] = useState<ProductCategoryFormValues | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  // The confirmation names the chosen store, loaded by id rather than from the whole store list.
  const pendingStoreName = useStoreName(pendingValues?.store_id ?? '')

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const save = useSingleFlight(async (values: ProductCategoryFormValues) => {
    setIsSaving(true)
    try {
      // On success the parent closes the whole dialog.
      await onSubmit(toProductCategoryPayload(values))
    } catch (error) {
      // Back to the form, where the API's errors show on the fields they belong to.
      setIsConfirmOpen(false)
      applyServerErrors(error, form.setError)
    } finally {
      setIsSaving(false)
    }
  })

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
      <ModalBody className="flex flex-col gap-5">
        <FormErrorAlert title="Couldn't save this category" message={errors.root?.server?.message} />

        <FormField
          control={control}
          name="image"
          label="Image"
          optional
          description="PNG, JPG or WebP, up to 10 MB. Shown on the menu next to the category name."
          render={(field) => <ProductCategoryImageInput {...field} currentUrl={category?.image_url} />}
        />
        <FormField
          control={control}
          name="store_id"
          label="Store"
          description="Categories belong to one store. Names must be unique within it."
          render={(field) => <StoreCombobox {...field} />}
        />
        <FormField
          control={control}
          name="name"
          label="Name"
          render={(field) => <Input {...field} placeholder="Burgers" />}
        />
        <FormField
          control={control}
          name="description"
          label="Description"
          optional
          render={(field) => <Textarea {...field} rows={3} placeholder="Flame-grilled burgers and sandwiches." />}
        />
      </ModalBody>

      <ModalFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </DialogClose>
        <LoadingButton type="submit" isLoading={isSaving} className="ml-2">
          {submitLabel}
        </LoadingButton>
      </ModalFooter>

      <ProductCategorySaveConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        category={category}
        pending={pendingValues}
        getStoreLabel={() => pendingStoreName ?? 'the selected store'}
        isLoading={isSaving}
        onConfirm={() => pendingValues && void save(pendingValues)}
      />
    </form>
  )
}
