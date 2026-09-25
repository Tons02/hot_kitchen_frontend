import { TriangleAlertIcon } from 'lucide-react'
import { ChangeList } from '@/components/common/ChangeList'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { VoucherFormValues } from '../storeVouchers.schemas'
import type { Voucher } from '../storeVouchers.types'
import { describeVoucherChanges, summarizeVoucher } from '../storeVouchers.utils'

interface VoucherSaveConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The voucher being edited; omit when creating. */
  voucher?: Voucher
  /** Null while there's nothing to confirm (the dialog keeps its last text while closing). */
  pending: VoucherFormValues | null
  storeName: string
  isLoading: boolean
  onConfirm: () => void
}

/**
 * The last check before a voucher is saved, since vouchers change what customers pay. A new voucher is
 * shown in full; an edit shows exactly what changes, old → new.
 */
export function VoucherSaveConfirmDialog({
  open,
  onOpenChange,
  voucher,
  pending,
  storeName,
  isLoading,
  onConfirm,
}: VoucherSaveConfirmDialogProps) {
  const isEditing = voucher !== undefined
  const summary = pending ? summarizeVoucher(pending) : []
  const changes = pending && voucher ? describeVoucherChanges(voucher, pending) : []
  const disables = Boolean(voucher?.is_active && pending && !pending.is_active)

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Save changes to this voucher?' : 'Create this voucher?'}
      description={
        isEditing
          ? changes.length === 0
            ? 'Nothing changed. Saving keeps the voucher as it is.'
            : `${changes.length} setting${changes.length === 1 ? '' : 's'} will change for ${voucher.code}.`
          : `Customers of ${storeName} can use it as soon as it's active and within its dates.`
      }
      confirmLabel={isEditing ? 'Yes, save changes' : 'Yes, create voucher'}
      isLoading={isLoading}
      onConfirm={onConfirm}
    >
      {isEditing ? (
        changes.length > 0 && <ChangeList changes={changes} />
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          {summary.map((line) => (
            <div key={line.label} className="contents">
              <dt className="text-muted-foreground">{line.label}</dt>
              <dd className="font-medium break-words">{line.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {voucher && voucher.used_count > 0 && changes.length > 0 && (
        <Alert>
          <TriangleAlertIcon />
          <AlertDescription>
            It has been used {voucher.used_count} time{voucher.used_count === 1 ? '' : 's'}. Changes apply to future
            orders only; past orders keep the discount they got.
          </AlertDescription>
        </Alert>
      )}
      {disables && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>Customers won't be able to use it until it's enabled again.</AlertDescription>
        </Alert>
      )}
    </ConfirmDialog>
  )
}
