import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { toastInlineApiError } from '@/services/api/apiErrorMiddleware'
import { ADDRESS_LABELS } from '../account.constants'
import type { AddressAction } from '../account.types'
import { formatAddress } from '../account.utils'
import { useDeleteAddressMutation, useSetDefaultAddressMutation } from '../accountApi'

interface AddressActionDialogsProps {
  /** Kept after closing so the dialog's text doesn't blank out during its exit animation. */
  action: AddressAction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The confirmation step for making an address the default and for deleting one. */
export function AddressActionDialogs({ action, open, onOpenChange }: AddressActionDialogsProps) {
  const [setDefault, { isLoading: isSettingDefault }] = useSetDefaultAddressMutation()
  const [deleteAddress, { isLoading: isDeleting }] = useDeleteAddressMutation()

  const address = action?.address
  const label = address ? ADDRESS_LABELS[address.label] : ''

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
        open={open && action?.type === 'default'}
        onOpenChange={onOpenChange}
        title={`Make ${label} your default?`}
        description="It's used first when you check out. You can still pick another address for any order."
        confirmLabel="Make default"
        isLoading={isSettingDefault}
        onConfirm={() => address && void run(() => setDefault(address.id).unwrap(), `${label} is now your default address.`)}
      >
        {address && <p className="text-sm font-medium">{formatAddress(address)}</p>}
      </ConfirmDialog>

      <ConfirmDialog
        open={open && action?.type === 'delete'}
        onOpenChange={onOpenChange}
        title={`Delete this ${label.toLowerCase()} address?`}
        description={
          address?.is_default
            ? "It's your default, so your newest other address becomes the default. This can't be undone."
            : "This can't be undone."
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={() => address && void run(() => deleteAddress(address.id).unwrap(), 'The address was deleted.')}
      >
        {address && <p className="text-sm font-medium">{formatAddress(address)}</p>}
      </ConfirmDialog>
    </>
  )
}
