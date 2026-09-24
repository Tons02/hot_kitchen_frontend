import { DocumentTitle } from '@/components/common/DocumentTitle'
import { LoginForm } from '../components/LoginForm'

export default function LoginPage() {
  return (
    <>
      <DocumentTitle title="Sign in" />
      <LoginForm />
    </>
  )
}
