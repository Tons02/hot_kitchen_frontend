import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { LoginForm } from '../components/LoginForm'

/** The one sign-in page for customers and staff. */
export default function LoginPage() {
  return (
    <AuthSplitLayout title="Sign in">
      <LoginForm />
    </AuthSplitLayout>
  )
}
