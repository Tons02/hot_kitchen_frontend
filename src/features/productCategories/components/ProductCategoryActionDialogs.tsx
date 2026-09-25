import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { toastInlineApiError } from '@/services/api/apiErrorMiddleware'
import type { ProductCategoryAction } from '../productCategories.types'
import { useArchiveProductCategoryMutation, useRestoreProductCategoryMutation } from '../productCategoriesApi'

interface ProductCategoryActionDialogsProps {
  /** Kept after closing so the dialog's text doesn't blank out during its exit animation. */
  action: ProductCategoryAction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The confirmation step for archiving and restoring categories. */
export function ProductCategoryActionDialogs({ action, open, onOpenChange }: ProductCategoryActionDialogsProps) {
  const [archiveCategory, { isLoading: isArchiving }] = useArchiveProductCategoryMutation()
  const [restoreCategory, { isLoading: isRestoring }] = useRestoreProductCategoryMutation()

  const category = action?.category
  const name = category?.name ?? ''

  // Ignores a second click that lands before the button has re-rendered as disabled.
  const run = useSingleFlight(async (mutation: () => Promise<unknown>, successMessage: string) => {
    try {
      await mutation()
      toast.success(successMessage)
      onOpenChange(false)
    } catch (error) {
      toastInlineApiError(error)
    }
  })

  return (
    <>
      <ConfirmDialog
        open={open && action?.type === 'archive'}
        onOpenChange={onOpenChange}
        title={`Archive ${name}?`}
        description="It moves to Archived and stops showing on the store's menu. You can restore it from the Archived tab."
        confirmLabel="Archive"
        variant="destructive"
        isLoading={isArchiving}
        onConfirm={() => category && void run(() => archiveCategory(category.id).unwrap(), `${name} was archived.`)}
      />

      <ConfirmDialog
        open={open && action?.type === 'restore'}
        onOpenChange={onOpenChange}
        title={`Restore ${name}?`}
        description="It returns to the category list and shows on the store's menu again."
        confirmLabel="Restore"
        isLoading={isRestoring}
        onConfirm={() => category && void run(() => restoreCategory(category.id).unwrap(), `${name} was restored.`)}
      />
    </>
  )
}
