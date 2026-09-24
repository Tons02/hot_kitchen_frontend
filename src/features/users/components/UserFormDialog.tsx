import { toast } from 'sonner'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { ModalContent, ModalHeader } from '@/components/common/Modal'
import { Dialog } from '@/components/ui/dialog'
import type { UserPayload } from '../users.types'
import { getFullName, getRoleLabel } from '../users.utils'
import { useCreateUserMutation, useGetUserQuery, useUpdateUserMutation } from '../usersApi'
import { UserForm } from './UserForm'

export type UserFormTarget = { mode: 'create' } | { mode: 'edit'; userId: number }

interface UserFormDialogProps {
  /** Kept after closing so the content doesn't blank out during the exit animation. */
  target: UserFormTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserFormDialog({ target, open, onOpenChange }: UserFormDialogProps) {
  const close = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-3xl">
        {target?.mode === 'create' && <CreateUserContent onDone={close} />}
        {/* Keyed so switching users starts a fresh form. */}
        {target?.mode === 'edit' && <EditUserContent key={target.userId} userId={target.userId} onDone={close} />}
      </ModalContent>
    </Dialog>
  )
}

function CreateUserContent({ onDone }: { onDone: () => void }) {
  const [createUser] = useCreateUserMutation()

  const handleSubmit = async (payload: UserPayload) => {
    const user = await createUser(payload).unwrap()
    toast.success(`${getFullName(user)} was added.`)
    onDone()
  }

  return (
    <>
      <ModalHeader title="Add user" description="Create a staff account. They'll get an email with their sign-in details." />
      <UserForm submitLabel="Create user" onSubmit={handleSubmit} />
    </>
  )
}

function EditUserContent({ userId, onDone }: { userId: number; onDone: () => void }) {
  // Always refetch: picture and license links are signed and expire after a few minutes.
  const { data: user, isLoading, error, refetch } = useGetUserQuery(userId, { refetchOnMountOrArgChange: true })
  const [updateUser] = useUpdateUserMutation()

  if (isLoading) {
    return (
      <>
        <ModalHeader title="Edit user" description="Loading their details." />
        <LoadingState label="Loading user…" className="min-h-64" />
      </>
    )
  }

  if (error || !user) {
    return (
      <>
        <ModalHeader title="Edit user" description="Their details couldn't be loaded." />
        <ErrorState title="Couldn't load this user" error={error} onRetry={refetch} className="min-h-64" />
      </>
    )
  }

  const handleSubmit = async (payload: UserPayload) => {
    const updated = await updateUser({ id: user.id, payload }).unwrap()
    toast.success(`Changes to ${getFullName(updated)} were saved.`)
    onDone()
  }

  const assignment = user.store ? `${getRoleLabel(user.role)} at ${user.store.name}` : getRoleLabel(user.role)

  return (
    <>
      <ModalHeader title={`Edit ${getFullName(user)}`} description={assignment} />
      <UserForm user={user} submitLabel="Save changes" onSubmit={handleSubmit} />
    </>
  )
}
