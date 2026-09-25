import { KeyRoundIcon, LogOutIcon, PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAppSelector } from '@/app/hooks'
import { DocumentTitle } from '@/components/common/DocumentTitle'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AddressesSection } from '@/features/account/components/AddressesSection'
import { ChangePasswordDialog } from '@/features/account/components/ChangePasswordDialog'
import { EditProfileDialog } from '@/features/account/components/EditProfileDialog'
import { useLogoutMutation } from '@/features/auth/authApi'
import { selectCurrentUser } from '@/features/auth/authSlice'
import { getFullName } from '@/features/users/users.utils'
import { SectionHeading } from '../components/SectionHeading'

/** The signed-in customer's profile, sign-in security and saved delivery addresses. */
export default function CustomerAccountPage() {
  const user = useAppSelector(selectCurrentUser)
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)

  // The route guard only renders this for signed-in users.
  if (!user) return null

  const handleLogout = async () => {
    // Always resolves: the endpoint clears the local session even if the request fails.
    await logout()
    toast.success('You have been signed out.')
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12">
      <DocumentTitle title="Account" />
      <SectionHeading title="Account" description="Your profile, sign-in and delivery addresses." />

      <Card className="flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <UserAvatar user={user} size="lg" />
        <div className="grid min-w-0 flex-1 leading-tight">
          <span className="truncate font-heading text-lg font-semibold">{getFullName(user)}</span>
          <span className="truncate text-sm text-muted-foreground">{user.email}</span>
          <span className="truncate text-sm text-muted-foreground tabular-nums">{user.mobile_number}</span>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => setIsProfileOpen(true)}>
          <PencilIcon />
          Edit information
        </Button>
      </Card>

      <section aria-labelledby="security-heading" className="flex flex-col gap-4">
        <h2 id="security-heading" className="font-heading text-xl font-semibold">
          Sign-in and security
        </h2>
        <Card className="flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-0.5">
            <span className="font-medium">Password</span>
            <span className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.username}</span>. Changing it signs out
              your other devices.
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setIsPasswordOpen(true)}>
              <KeyRoundIcon />
              Change password
            </Button>
            <Button variant="ghost" className="rounded-full" disabled={isLoggingOut} onClick={() => void handleLogout()}>
              <LogOutIcon />
              Sign out
            </Button>
          </div>
        </Card>
      </section>

      <AddressesSection />

      <EditProfileDialog user={user} open={isProfileOpen} onOpenChange={setIsProfileOpen} />
      <ChangePasswordDialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen} />
    </div>
  )
}
