import { KeyRoundIcon, LayoutDashboardIcon, LogOutIcon, UserRoundIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { toast } from 'sonner'
import { useAppSelector } from '@/app/hooks'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChangePasswordDialog } from '@/features/account/components/ChangePasswordDialog'
import { useLogoutMutation } from '@/features/auth/authApi'
import { selectCurrentUser } from '@/features/auth/authSlice'
import { getFullName } from '@/features/users/users.utils'
import { ROUTES, type RedirectLocationState } from '@/routes/paths'

/** "Sign in" for guests; for signed-in users, their avatar with Account and Sign out. */
export function CustomerAccountMenu() {
  const user = useAppSelector(selectCurrentUser)
  const location = useLocation()
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)

  if (!user) {
    // Remembers this page, so signing in brings the customer straight back.
    const state: RedirectLocationState = { from: location }
    return (
      <Button asChild className="rounded-full">
        <Link to={ROUTES.login} state={state}>
          Sign in
        </Link>
      </Button>
    )
  }

  const handleLogout = async () => {
    // Always resolves: the endpoint clears the local session even if the request fails.
    await logout()
    toast.success('You have been signed out.')
  }

  return (
    <>
      {/* Non-modal so the dialog it opens gets focus cleanly once the menu closes. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label={`Account menu for ${getFullName(user)}`}
          >
            <UserAvatar user={user} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="grid font-normal">
            <span className="truncate font-medium">{getFullName(user)}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to={ROUTES.shopAccount}>
              <UserRoundIcon />
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsPasswordOpen(true)}>
            <KeyRoundIcon />
            Change password
          </DropdownMenuItem>
          {/* Staff share the same sign-in, so they get a way back to the admin. */}
          {user.role !== 'customer' && (
            <DropdownMenuItem asChild>
              <Link to={ROUTES.dashboard}>
                <LayoutDashboardIcon />
                Staff dashboard
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={isLoggingOut} onSelect={() => void handleLogout()}>
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangePasswordDialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen} />
    </>
  )
}
