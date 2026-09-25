import {
  ClockIcon,
  LayoutDashboardIcon,
  PackageIcon,
  ShapesIcon,
  StoreIcon,
  TicketPercentIcon,
  UsersIcon,
  UtensilsIcon,
  type LucideIcon,
} from 'lucide-react'
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

/**
 * Who can open Store Inventory. Store managers see only their own store's inventory (see
 * useOwnStoreId); admins pick any store. Shared by the sidebar item and the route guard.
 */
export const STORE_INVENTORY_ROLES: readonly Role[] = ['admin', 'store_manager']

/**
 * Who can open Store Vouchers. Store managers see only their own store's vouchers (see useOwnStoreId);
 * admins pick any store. Shared by the sidebar item and the route guard.
 */
export const STORE_VOUCHER_ROLES: readonly Role[] = ['admin', 'store_manager']

/** Who can open Product Management. Shared by the sidebar items and the route guards. */
export const PRODUCT_MANAGEMENT_ROLES: readonly Role[] = ['admin']

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
    items: [
      { title: 'Stores', to: ROUTES.stores, icon: StoreIcon, roles: STORE_MANAGEMENT_ROLES },
      {
        title: 'Store Operating Hours',
        to: ROUTES.storeOperatingHours,
        icon: ClockIcon,
        roles: STORE_MANAGEMENT_ROLES,
      },
      { title: 'Store Inventory', to: ROUTES.storeInventory, icon: PackageIcon, roles: STORE_INVENTORY_ROLES },
      { title: 'Store Vouchers', to: ROUTES.storeVouchers, icon: TicketPercentIcon, roles: STORE_VOUCHER_ROLES },
    ],
  },
  {
    label: 'Product Management',
    items: [
      { title: 'Products', to: ROUTES.products, icon: UtensilsIcon, roles: PRODUCT_MANAGEMENT_ROLES },
      {
        title: 'Product Categories',
        to: ROUTES.productCategories,
        icon: ShapesIcon,
        roles: PRODUCT_MANAGEMENT_ROLES,
      },
    ],
  },
]
