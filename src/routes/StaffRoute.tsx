import { Navigate, Outlet } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { selectCurrentUser } from '@/features/auth/authSlice'
import { ROUTES } from './paths'
import { ProtectedRoute } from './ProtectedRoute'

/**
 * The staff admin's guard: signed-out users go to the staff login, and customers, who share the same
 * sign-in, go to the shop's home instead of an admin page they can't use. The API enforces real access.
 */
export function StaffRoute() {
  const user = useAppSelector(selectCurrentUser)
  if (user?.role === 'customer') return <Navigate to={ROUTES.home} replace />
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  )
}
