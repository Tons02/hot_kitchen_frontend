import { DocumentTitle } from '@/components/common/DocumentTitle'
import { AuthBrandPanel } from '../components/AuthBrandPanel'
import { RegisterForm } from '../components/RegisterForm'

/**
 * Customer sign-up, inside the shop's shell (header, footer, phone navigation). On desktop the brand
 * panel from the sign-in page sits beside the form and stays in view while the form scrolls.
 * Staff accounts are still created by an admin in User Management.
 */
export default function RegisterPage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl items-start gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-2">
      <DocumentTitle title="Create account" />
      {/* Below the sticky header (4rem) with a little breathing room. */}
      <AuthBrandPanel className="sticky top-24 h-[calc(100svh-8rem)] min-h-120 rounded-3xl" />
      <div className="mx-auto w-full max-w-lg">
        <RegisterForm />
      </div>
    </div>
  )
}
