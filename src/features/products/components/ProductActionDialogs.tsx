import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { toastInlineApiError } from '@/services/api/apiErrorMiddleware'
import type { ProductAction } from '../products.types'
import { useArchiveProductMutation, useRestoreProductMutation } from '../productsApi'

interface ProductActionDialogsProps {
  /** Kept after closing so the dialog's text doesn't blank out during its exit animation. */
  action: ProductAction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The confirmation step for archiving and restoring products. */
export function ProductActionDialogs({ action, open, onOpenChange }: ProductActionDialogsProps) {
  const [archiveProduct, { isLoading: isArchiving }] = useArchiveProductMutation()
  const [restoreProduct, { isLoading: isRestoring }] = useRestoreProductMutation()

  const product = action?.product
  const name = product?.name ?? ''

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
        description="It moves to Archived and disappears from the store's menu. You can restore it from the Archived tab."
        confirmLabel="Archive"
        variant="destructive"
        isLoading={isArchiving}
        onConfirm={() => product && void run(() => archiveProduct(product.id).unwrap(), `${name} was archived.`)}
      />

      <ConfirmDialog
        open={open && action?.type === 'restore'}
        onOpenChange={onOpenChange}
        title={`Restore ${name}?`}
        description="It returns to the product list and shows on the store's menu again."
        confirmLabel="Restore"
        isLoading={isRestoring}
        onConfirm={() => product && void run(() => restoreProduct(product.id).unwrap(), `${name} was restored.`)}
      />
    </>
  )
}
