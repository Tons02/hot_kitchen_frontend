import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { ProductCategoryFormValues } from '../productCategories.schemas'
import type { ProductCategory } from '../productCategories.types'

interface ProductCategorySaveConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The category being edited; omit when creating. */
  category?: ProductCategory
  /** Null while there's nothing to confirm (the dialog keeps its last text while closing). */
  pending: ProductCategoryFormValues | null
  /** Turns a store id into its name for the summary. */
  getStoreLabel: (storeId: string) => string
  isLoading: boolean
  onConfirm: () => void
}

/** What saving will do, one line per change. */
function describeChanges(
  pending: ProductCategoryFormValues,
  category: ProductCategory | undefined,
  getStoreLabel: (storeId: string) => string,
): string[] {
  if (!category) {
    return [
      `Create "${pending.name}" in ${getStoreLabel(pending.store_id)}`,
      pending.description ? 'Add its description' : '',
      pending.image ? 'Upload its image' : '',
    ].filter(Boolean)
  }

  return [
    pending.name !== category.name ? `Rename "${category.name}" to "${pending.name}"` : '',
    pending.store_id !== String(category.store_id) ? `Move it to ${getStoreLabel(pending.store_id)}` : '',
    pending.description !== (category.description ?? '')
      ? pending.description
        ? 'Update the description'
        : 'Remove the description'
      : '',
    pending.image ? (category.image_url ? 'Replace the image' : 'Upload an image') : '',
  ].filter(Boolean)
}

/** The last check before saving. */
export function ProductCategorySaveConfirmDialog({
  open,
  onOpenChange,
  category,
  pending,
  getStoreLabel,
  isLoading,
  onConfirm,
}: ProductCategorySaveConfirmDialogProps) {
  const isEditing = category !== undefined
  const changes = pending ? describeChanges(pending, category, getStoreLabel) : []

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Save these changes?' : 'Create this category?'}
      description={
        isEditing && changes.length === 0
          ? 'Nothing changed. Saving keeps the category as it is.'
          : 'Check that everything is correct before saving.'
      }
      confirmLabel={isEditing ? 'Yes, save changes' : 'Yes, create category'}
      isLoading={isLoading}
      onConfirm={onConfirm}
    >
      {changes.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {changes.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>
      )}
    </ConfirmDialog>
  )
}
