import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { selectCurrentUser, selectIsAuthenticated } from '@/features/auth/authSlice'
import { getPostLoginRedirect } from './paths'

/** For guest-only pages such as login. Signed-in users are sent on: back where they were, or home. */
export function PublicRoute({ children }: { children?: ReactNode }) {
  const location = useLocation()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectCurrentUser)

  if (isAuthenticated) {
    return <Navigate to={getPostLoginRedirect(location.state, user?.role)} replace />
  }

  return children ?? <Outlet />
}
