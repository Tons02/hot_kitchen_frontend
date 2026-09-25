import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { toastInlineApiError } from '@/services/api/apiErrorMiddleware'
import type { VoucherAction } from '../storeVouchers.types'
import { useArchiveStoreVoucherMutation, useToggleStoreVoucherMutation } from '../storeVouchersApi'

interface VoucherActionDialogsProps {
  storeId: number
  /** Kept after closing so the dialog's text doesn't blank out during its exit animation. */
  action: VoucherAction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The confirmation step for enabling, disabling, archiving and restoring vouchers. */
export function VoucherActionDialogs({ storeId, action, open, onOpenChange }: VoucherActionDialogsProps) {
  const [toggleVoucher, { isLoading: isToggling }] = useToggleStoreVoucherMutation()
  const [archiveVoucher, { isLoading: isArchiving }] = useArchiveStoreVoucherMutation()

  const voucher = action?.voucher
  const code = voucher?.code ?? ''
  const ref = voucher ? { storeId, voucherId: voucher.id } : null

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

  const isDisabling = voucher?.is_active ?? false

  return (
    <>
      <ConfirmDialog
        open={open && action?.type === 'toggle'}
        onOpenChange={onOpenChange}
        title={isDisabling ? `Disable ${code}?` : `Enable ${code}?`}
        description={
          isDisabling
            ? "Customers can't use it until you enable it again. Its settings and history stay as they are."
            : 'Customers can use it again whenever it is within its dates and usage limits.'
        }
        confirmLabel={isDisabling ? 'Disable' : 'Enable'}
        variant={isDisabling ? 'destructive' : 'default'}
        isLoading={isToggling}
        onConfirm={() =>
          ref && void run(() => toggleVoucher(ref).unwrap(), `${code} was ${isDisabling ? 'disabled' : 'enabled'}.`)
        }
      />

      <ConfirmDialog
        open={open && action?.type === 'archive'}
        onOpenChange={onOpenChange}
        title={`Archive ${code}?`}
        description="Customers can't use it any more and it moves to the Archived tab. Its usage history is kept, and you can restore it."
        confirmLabel="Archive"
        variant="destructive"
        isLoading={isArchiving}
        onConfirm={() => ref && void run(() => archiveVoucher(ref).unwrap(), `${code} was archived.`)}
      />

      <ConfirmDialog
        open={open && action?.type === 'restore'}
        onOpenChange={onOpenChange}
        title={`Restore ${code}?`}
        description="It comes back with its previous settings. Customers can use it again if it's enabled and within its dates."
        confirmLabel="Restore"
        isLoading={isArchiving}
        onConfirm={() => ref && void run(() => archiveVoucher(ref).unwrap(), `${code} was restored.`)}
      />
    </>
  )
}
