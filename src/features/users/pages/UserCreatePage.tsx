import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { ROUTES } from '@/routes/paths'
import { UserForm } from '../components/UserForm'
import type { UserPayload } from '../users.types'
import { getFullName } from '../users.utils'
import { useCreateUserMutation } from '../usersApi'

export default function UserCreatePage() {
  const navigate = useNavigate()
  const [createUser] = useCreateUserMutation()

  const handleSubmit = async (payload: UserPayload) => {
    const user = await createUser(payload).unwrap()
    toast.success(`${getFullName(user)} was added.`)
    navigate(ROUTES.users)
  }

  return (
    <>
      <PageHeader
        title="Add user"
        description="Create a staff account. They'll get an email with their sign-in details."
      />
      <UserForm submitLabel="Create user" onSubmit={handleSubmit} />
    </>
  )
}
