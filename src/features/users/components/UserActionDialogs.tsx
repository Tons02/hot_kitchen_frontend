import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { toastInlineApiError } from '@/services/api/apiErrorMiddleware'
import type { UserAction } from '../users.types'
import { getFullName } from '../users.utils'
import { useActivateUserMutation, useArchiveUserMutation } from '../usersApi'
import { DeactivateUserDialog } from './DeactivateUserDialog'

interface UserActionDialogsProps {
  /** Kept after closing so the dialog's text doesn't blank out during its exit animation. */
  action: UserAction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The confirmation step for every row action on the users table. */
export function UserActionDialogs({ action, open, onOpenChange }: UserActionDialogsProps) {
  const [activateUser, { isLoading: isActivating }] = useActivateUserMutation()
  const [archiveUser, { isLoading: isArchiving }] = useArchiveUserMutation()

  const user = action?.user
  const name = user ? getFullName(user) : ''

  const run = async (mutation: () => Promise<unknown>, successMessage: string) => {
    try {
      await mutation()
      toast.success(successMessage)
      onOpenChange(false)
    } catch (error) {
      toastInlineApiError(error)
    }
  }

  return (
    <>
      <DeactivateUserDialog
        user={action?.type === 'deactivate' ? user : undefined}
        open={open && action?.type === 'deactivate'}
        onOpenChange={onOpenChange}
      />

      <ConfirmDialog
        open={open && action?.type === 'activate'}
        onOpenChange={onOpenChange}
        title={`Reactivate ${name}?`}
        description="Their account returns to active and the deactivation reason is cleared."
        confirmLabel="Reactivate"
        isLoading={isActivating}
        onConfirm={() => user && void run(() => activateUser(user.id).unwrap(), `${name} was reactivated.`)}
      />

      <ConfirmDialog
        open={open && action?.type === 'archive'}
        onOpenChange={onOpenChange}
        title={`Archive ${name}?`}
        description="They'll be removed from the user list and moved to Archived. There's no way to restore an archived user from the app yet."
        confirmLabel="Archive"
        variant="destructive"
        isLoading={isArchiving}
        onConfirm={() => user && void run(() => archiveUser(user.id).unwrap(), `${name} was archived.`)}
      />
    </>
  )
}
