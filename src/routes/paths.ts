import type { Location, To } from 'react-router'
import type { Role } from '@/features/users/users.types'

/** Every route path in one place. Link and navigate with these instead of string literals. */
export const ROUTES = {
  /** One sign-in for customers and staff. */
  login: '/login',
  /** Customer sign-up. */
  register: '/register',

  /** The customer-facing site, at the root. Public except Orders and Account. */
  home: '/',
  shopStores: '/stores',
  /** One store's storefront: its menu and ordering. */
  shopStore: (storeId: number | string) => `/stores/${storeId}`,
  shopOrders: '/orders',
  shopAccount: '/account',

  /** The staff admin, under /admin. */
  admin: '/admin',
  dashboard: '/admin/dashboard',
  users: '/admin/users',
  stores: '/admin/stores',
  storeOperatingHours: '/admin/store-operating-hours',
  storeInventory: '/admin/store-inventory',
  storeInventoryDetail: (storeId: number | string) => `/admin/store-inventory/${storeId}`,
  storeVouchers: '/admin/store-vouchers',
  storeVouchersDetail: (storeId: number | string) => `/admin/store-vouchers/${storeId}`,
  productCategories: '/admin/product-categories',
  products: '/admin/products',
} as const

/** Location state set by `ProtectedRoute` when it bounces a signed-out user to the login page. */
export interface RedirectLocationState {
  from?: Pick<Location, 'pathname' | 'search' | 'hash'>
}

/** Where a user lands after signing in when they didn't come from another page. */
export function getHomeForRole(role: Role | undefined): To {
  return role === 'customer' ? ROUTES.home : ROUTES.dashboard
}

/**
 * Where to send a user after signing in: the page they were bounced from, else their home (the shop
 * for customers, the dashboard for staff). The one place that decides this.
 */
export function getPostLoginRedirect(locationState: unknown, role: Role | undefined): To {
  const from = (locationState as RedirectLocationState | null)?.from

  if (from && typeof from.pathname === 'string' && from.pathname !== ROUTES.login && from.pathname !== ROUTES.register) {
    return { pathname: from.pathname, search: from.search, hash: from.hash }
  }

  return getHomeForRole(role)
}
