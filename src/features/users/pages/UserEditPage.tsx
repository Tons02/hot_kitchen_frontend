import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { NotFoundPage } from '@/routes/NotFoundPage'
import { ROUTES } from '@/routes/paths'
import { UserForm } from '../components/UserForm'
import type { UserPayload } from '../users.types'
import { getFullName, getRoleLabel } from '../users.utils'
import { useGetUserQuery, useUpdateUserMutation } from '../usersApi'

export default function UserEditPage() {
  const navigate = useNavigate()
  const userId = Number(useParams().userId)
  const isValidId = Number.isInteger(userId) && userId > 0

  // Refetch on every visit: picture and license links are signed and expire after a few minutes.
  const { data: user, isLoading, error, refetch } = useGetUserQuery(userId, {
    skip: !isValidId,
    refetchOnMountOrArgChange: true,
  })
  const [updateUser] = useUpdateUserMutation()

  if (!isValidId) return <NotFoundPage />
  if (isLoading) return <LoadingState label="Loading user…" />
  if (error || !user) return <ErrorState title="Couldn't load this user" error={error} onRetry={refetch} />

  const handleSubmit = async (payload: UserPayload) => {
    const updated = await updateUser({ id: user.id, payload }).unwrap()
    toast.success(`Changes to ${getFullName(updated)} were saved.`)
    navigate(ROUTES.users)
  }

  const assignment = user.store ? `${getRoleLabel(user.role)} at ${user.store.name}` : getRoleLabel(user.role)

  return (
    <>
      <PageHeader title={`Edit ${getFullName(user)}`} description={assignment} />
      <UserForm key={user.id} user={user} submitLabel="Save changes" onSubmit={handleSubmit} />
    </>
  )
}
