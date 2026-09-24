import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useSingleFlight } from '@/hooks/use-single-flight'
import { toastInlineApiError } from '@/services/api/apiErrorMiddleware'
import type { StoreAction } from '../stores.types'
import { useArchiveStoreMutation, useRestoreStoreMutation } from '../storesApi'

interface StoreActionDialogsProps {
  /** Kept after closing so the dialog's text doesn't blank out during its exit animation. */
  action: StoreAction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The confirmation step for archiving and restoring stores. */
export function StoreActionDialogs({ action, open, onOpenChange }: StoreActionDialogsProps) {
  const [archiveStore, { isLoading: isArchiving }] = useArchiveStoreMutation()
  const [restoreStore, { isLoading: isRestoring }] = useRestoreStoreMutation()

  const store = action?.store
  const name = store?.name ?? ''

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
        description="It moves to Archived and stops appearing in store pickers. You can restore it from the Archived tab."
        confirmLabel="Archive"
        variant="destructive"
        isLoading={isArchiving}
        onConfirm={() => store && void run(() => archiveStore(store.id).unwrap(), `${name} was archived.`)}
      />

      <ConfirmDialog
        open={open && action?.type === 'restore'}
        onOpenChange={onOpenChange}
        title={`Restore ${name}?`}
        description="It returns to the store list and can be picked for staff again."
        confirmLabel="Restore"
        isLoading={isRestoring}
        onConfirm={() => store && void run(() => restoreStore(store.id).unwrap(), `${name} was restored.`)}
      />
    </>
  )
}
