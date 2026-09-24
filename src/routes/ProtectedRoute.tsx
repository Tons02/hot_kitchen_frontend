import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import type { Role } from '@/features/users/users.types'
import { hasRole } from '@/features/auth/auth.utils'
import { selectCurrentUser, selectIsAuthenticated } from '@/features/auth/authSlice'
import { ForbiddenPage } from './ForbiddenPage'
import { ROUTES, type RedirectLocationState } from './paths'

interface ProtectedRouteProps {
  /** Limits the route to these roles. This only shapes the UI; the API enforces real access control. */
  allowedRoles?: readonly Role[]
  /** Defaults to the matched child route. */
  children?: ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const location = useLocation()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectCurrentUser)

  if (!isAuthenticated) {
    const state: RedirectLocationState = { from: location }
    return <Navigate to={ROUTES.login} state={state} replace />
  }

  if (allowedRoles && !hasRole(user, allowedRoles)) {
    return <ForbiddenPage />
  }

  return children ?? <Outlet />
}
