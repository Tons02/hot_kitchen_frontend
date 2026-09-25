import { toast } from 'sonner'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { ModalContent, ModalHeader } from '@/components/common/Modal'
import { Dialog } from '@/components/ui/dialog'
import type { ProductCategoryPayload } from '../productCategories.types'
import {
  useCreateProductCategoryMutation,
  useGetProductCategoryQuery,
  useUpdateProductCategoryMutation,
} from '../productCategoriesApi'
import { ProductCategoryForm } from './ProductCategoryForm'

export type ProductCategoryFormTarget = { mode: 'create' } | { mode: 'edit'; categoryId: number }

interface ProductCategoryFormDialogProps {
  /** Kept after closing so the content doesn't blank out during the exit animation. */
  target: ProductCategoryFormTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductCategoryFormDialog({ target, open, onOpenChange }: ProductCategoryFormDialogProps) {
  const close = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-xl">
        {target?.mode === 'create' && <CreateCategoryContent onDone={close} />}
        {/* Keyed so switching categories starts a fresh form. */}
        {target?.mode === 'edit' && (
          <EditCategoryContent key={target.categoryId} categoryId={target.categoryId} onDone={close} />
        )}
      </ModalContent>
    </Dialog>
  )
}

function CreateCategoryContent({ onDone }: { onDone: () => void }) {
  const [createCategory] = useCreateProductCategoryMutation()

  const handleSubmit = async (payload: ProductCategoryPayload) => {
    const category = await createCategory(payload).unwrap()
    toast.success(`${category.name} was added.`)
    onDone()
  }

  return (
    <>
      <ModalHeader title="Add product category" description="Group a store's products on its menu, e.g. Burgers or Drinks." />
      <ProductCategoryForm submitLabel="Create category" onSubmit={handleSubmit} />
    </>
  )
}

function EditCategoryContent({ categoryId, onDone }: { categoryId: number; onDone: () => void }) {
  // Always load fresh, so the form never starts from an outdated copy.
  const { data: category, isLoading, error, refetch } = useGetProductCategoryQuery(categoryId, {
    refetchOnMountOrArgChange: true,
  })
  const [updateCategory] = useUpdateProductCategoryMutation()

  if (isLoading) {
    return (
      <>
        <ModalHeader title="Edit product category" description="Loading its details." />
        <LoadingState label="Loading category…" className="min-h-64" />
      </>
    )
  }

  if (error || !category) {
    return (
      <>
        <ModalHeader title="Edit product category" description="Its details couldn't be loaded." />
        <ErrorState title="Couldn't load this category" error={error} onRetry={refetch} className="min-h-64" />
      </>
    )
  }

  const handleSubmit = async (payload: ProductCategoryPayload) => {
    const updated = await updateCategory({ id: category.id, payload }).unwrap()
    toast.success(`Changes to ${updated.name} were saved.`)
    onDone()
  }

  return (
    <>
      <ModalHeader title={`Edit ${category.name}`} description="Changes show on the store's menu once saved." />
      <ProductCategoryForm category={category} submitLabel="Save changes" onSubmit={handleSubmit} />
    </>
  )
}
