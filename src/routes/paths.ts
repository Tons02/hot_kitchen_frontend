import type { Location, To } from 'react-router'

/** Every route path in one place. Link and navigate with these instead of string literals. */
export const ROUTES = {
  root: '/',
  login: '/login',
  dashboard: '/dashboard',
  users: '/users',
} as const

/** Location state set by `ProtectedRoute` when it bounces a signed-out user to the login page. */
export interface RedirectLocationState {
  from?: Pick<Location, 'pathname' | 'search' | 'hash'>
}

/** Where to send a user after signing in: the page they were bounced from, or the dashboard. */
export function getPostLoginRedirect(locationState: unknown): To {
  const from = (locationState as RedirectLocationState | null)?.from

  if (from && typeof from.pathname === 'string' && from.pathname !== ROUTES.login) {
    return { pathname: from.pathname, search: from.search, hash: from.hash }
  }

  return ROUTES.dashboard
}
