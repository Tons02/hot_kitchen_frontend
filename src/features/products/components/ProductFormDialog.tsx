import { useState } from 'react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { ModalContent, ModalHeader } from '@/components/common/Modal'
import { Dialog } from '@/components/ui/dialog'
import type { ImageSaveStatus, RunImageStepsResult } from '@/lib/layered-images'
import { isInlineApiError, normalizeApiError } from '@/services/api/apiError'
import { useSaveProductImages } from '../hooks/useSaveProductImages'
import type { ProductFormValues } from '../products.schemas'
import { toProductPayload } from '../products.utils'
import { useCreateProductMutation, useGetProductQuery, useUpdateProductMutation } from '../productsApi'
import { ProductForm } from './ProductForm'

export type ProductFormTarget = { mode: 'create' } | { mode: 'edit'; productId: number }

type ImageProgressHandler = (key: string, status: ImageSaveStatus) => void

interface ProductFormDialogProps {
  /** Kept after closing so the content doesn't blank out during the exit animation. */
  target: ProductFormTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Toasts the outcome once the product itself saved: all done, or stopped part-way through the photos. */
function toastSaveResult(productName: string, successMessage: string, result: RunImageStepsResult) {
  if (result.ok) {
    toast.success(successMessage)
    return
  }
  // Network and server errors were already toasted by the global error middleware.
  const error = normalizeApiError(result.error)
  const reason = isInlineApiError(error) ? `${error.message} ` : ''
  toast.error(`${productName} was saved, but not all photo changes were.`, {
    description: `${reason}${result.completed} of ${result.total} photo changes went through. Open the product to check its photos.`,
  })
}

export function ProductFormDialog({ target, open, onOpenChange }: ProductFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const close = () => onOpenChange(false)

  return (
    // Refuses to close mid-save (Esc, the X, clicking outside), which would hide the progress.
    <Dialog open={open} onOpenChange={(next) => (next || !isSaving) && onOpenChange(next)}>
      <ModalContent className="sm:max-w-3xl" showCloseButton={!isSaving}>
        {target?.mode === 'create' && <CreateProductContent onDone={close} onSavingChange={setIsSaving} />}
        {/* Keyed so switching products starts a fresh form. */}
        {target?.mode === 'edit' && (
          <EditProductContent key={target.productId} productId={target.productId} onDone={close} onSavingChange={setIsSaving} />
        )}
      </ModalContent>
    </Dialog>
  )
}

interface ContentProps {
  onDone: () => void
  onSavingChange: (isSaving: boolean) => void
}

function CreateProductContent({ onDone, onSavingChange }: ContentProps) {
  const [createProduct] = useCreateProductMutation()
  const saveImages = useSaveProductImages()

  const handleSubmit = async (values: ProductFormValues, onImageProgress: ImageProgressHandler) => {
    // Rejects on validation errors, which the form shows inline. Nothing else has run yet.
    const product = await createProduct(toProductPayload(values)).unwrap()
    const result = await saveImages(product.id, [], values.images, onImageProgress)
    toastSaveResult(product.name, `${product.name} was added.`, result)
    onDone()
  }

  return (
    <>
      <ModalHeader title="Add product" description="Add a menu item to a store, with its sizes and extras." />
      <ProductForm submitLabel="Create product" onSubmit={handleSubmit} onSavingChange={onSavingChange} />
    </>
  )
}

function EditProductContent({ productId, onDone, onSavingChange }: ContentProps & { productId: number }) {
  // Always load fresh, so the form never starts from an outdated copy.
  const { data: product, isLoading, error, refetch } = useGetProductQuery(productId, { refetchOnMountOrArgChange: true })
  const [updateProduct] = useUpdateProductMutation()
  const saveImages = useSaveProductImages()

  if (isLoading) {
    return (
      <>
        <ModalHeader title="Edit product" description="Loading its details." />
        <LoadingState label="Loading product…" className="min-h-64" />
      </>
    )
  }

  if (error || !product) {
    return (
      <>
        <ModalHeader title="Edit product" description="Its details couldn't be loaded." />
        <ErrorState title="Couldn't load this product" error={error} onRetry={refetch} className="min-h-64" />
      </>
    )
  }

  const handleSubmit = async (values: ProductFormValues, onImageProgress: ImageProgressHandler) => {
    // Details first: if they fail validation, no photo has been touched yet.
    const updated = await updateProduct({ id: product.id, payload: toProductPayload(values) }).unwrap()
    const result = await saveImages(product.id, product.images ?? [], values.images, onImageProgress)
    toastSaveResult(updated.name, `Changes to ${updated.name} were saved.`, result)
    onDone()
  }

  return (
    <>
      <ModalHeader title={`Edit ${product.name}`} description={product.sku ? `SKU ${product.sku}` : undefined} />
      <ProductForm product={product} submitLabel="Save changes" onSubmit={handleSubmit} onSavingChange={onSavingChange} />
    </>
  )
}
