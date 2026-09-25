import { toast } from 'sonner'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { ModalContent, ModalHeader } from '@/components/common/Modal'
import { Dialog } from '@/components/ui/dialog'
import type { VoucherPayload } from '../storeVouchers.types'
import {
  useCreateStoreVoucherMutation,
  useGetStoreVoucherQuery,
  useUpdateStoreVoucherMutation,
} from '../storeVouchersApi'
import { VoucherForm } from './VoucherForm'

export type VoucherFormTarget = { mode: 'create' } | { mode: 'edit'; voucherId: number }

interface VoucherFormDialogProps {
  storeId: number
  storeName: string
  /** Kept after closing so the content doesn't blank out during the exit animation. */
  target: VoucherFormTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VoucherFormDialog({ storeId, storeName, target, open, onOpenChange }: VoucherFormDialogProps) {
  const close = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-2xl">
        {target?.mode === 'create' && <CreateVoucherContent storeId={storeId} storeName={storeName} onDone={close} />}
        {/* Keyed so switching vouchers starts a fresh form. */}
        {target?.mode === 'edit' && (
          <EditVoucherContent
            key={target.voucherId}
            storeId={storeId}
            storeName={storeName}
            voucherId={target.voucherId}
            onDone={close}
          />
        )}
      </ModalContent>
    </Dialog>
  )
}

interface ContentProps {
  storeId: number
  storeName: string
  onDone: () => void
}

function CreateVoucherContent({ storeId, storeName, onDone }: ContentProps) {
  const [createVoucher] = useCreateStoreVoucherMutation()

  const handleSubmit = async (payload: VoucherPayload) => {
    const voucher = await createVoucher({ storeId, payload }).unwrap()
    toast.success(`Voucher ${voucher.code} was created.`)
    onDone()
  }

  return (
    <>
      <ModalHeader title="Add voucher" description={`A discount code for ${storeName}.`} />
      <VoucherForm storeId={storeId} storeName={storeName} submitLabel="Create voucher" onSubmit={handleSubmit} />
    </>
  )
}

function EditVoucherContent({ storeId, storeName, voucherId, onDone }: ContentProps & { voucherId: number }) {
  // Always load fresh: it may have been used, which locks its code, since the list loaded.
  const { data: voucher, isLoading, error, refetch } = useGetStoreVoucherQuery(
    { storeId, voucherId },
    { refetchOnMountOrArgChange: true },
  )
  const [updateVoucher] = useUpdateStoreVoucherMutation()

  if (isLoading) {
    return (
      <>
        <ModalHeader title="Edit voucher" description="Loading its settings." />
        <LoadingState label="Loading voucher…" className="min-h-64" />
      </>
    )
  }

  if (error || !voucher) {
    return (
      <>
        <ModalHeader title="Edit voucher" description="Its settings couldn't be loaded." />
        <ErrorState title="Couldn't load this voucher" error={error} onRetry={refetch} className="min-h-64" />
      </>
    )
  }

  const handleSubmit = async (payload: VoucherPayload) => {
    const updated = await updateVoucher({ storeId, voucherId, payload }).unwrap()
    toast.success(`Changes to ${updated.code} were saved.`)
    onDone()
  }

  return (
    <>
      <ModalHeader title={`Edit ${voucher.code}`} description={voucher.name} />
      <VoucherForm
        storeId={storeId}
        storeName={storeName}
        voucher={voucher}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
    </>
  )
}
