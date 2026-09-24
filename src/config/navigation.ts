import { LayoutDashboardIcon, StoreIcon, UsersIcon, type LucideIcon } from 'lucide-react'
import type { Role } from '@/features/users/users.types'
import { ROUTES } from '@/routes/paths'

export interface NavItem {
  title: string
  to: string
  icon: LucideIcon
  /** Roles that see this item. Omit to show it to every signed-in user. UI only; the API enforces access. */
  roles?: readonly Role[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

/** Who can open User Management. Shared by the sidebar item and the route guard. */
export const USER_MANAGEMENT_ROLES: readonly Role[] = ['admin']

/** Who can open Store Management. Shared by the sidebar item and the route guard. */
export const STORE_MANAGEMENT_ROLES: readonly Role[] = ['admin']

/** Sidebar navigation. Add an entry here when a feature adds a top-level page. */
export const navigation: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboardIcon }],
  },
  {
    label: 'Management',
    items: [{ title: 'Users', to: ROUTES.users, icon: UsersIcon, roles: USER_MANAGEMENT_ROLES }],
  },
  {
    label: 'Store Management',
    items: [{ title: 'Stores', to: ROUTES.stores, icon: StoreIcon, roles: STORE_MANAGEMENT_ROLES }],
  },
]
