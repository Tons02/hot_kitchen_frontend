import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/authSlice'
import { getPostLoginRedirect } from './paths'

/** For guest-only pages such as login. Signed-in users are sent on to the app. */
export function PublicRoute({ children }: { children?: ReactNode }) {
  const location = useLocation()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  if (isAuthenticated) {
    return <Navigate to={getPostLoginRedirect(location.state)} replace />
  }

  return children ?? <Outlet />
}
