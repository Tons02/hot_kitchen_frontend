import { HouseIcon, PackageIcon, StoreIcon, UserRoundIcon, type LucideIcon } from 'lucide-react'
import { ROUTES } from '@/routes/paths'

export interface CustomerNavItem {
  title: string
  to: string
  icon: LucideIcon
  /** Active only on this exact path (Home would otherwise match every shop page). */
  end?: boolean
}

/** The customer site's primary navigation: the header links on desktop, the bottom bar on phones. */
export const customerNavigation: CustomerNavItem[] = [
  { title: 'Home', to: ROUTES.home, icon: HouseIcon, end: true },
  { title: 'Stores', to: ROUTES.shopStores, icon: StoreIcon },
  { title: 'Orders', to: ROUTES.shopOrders, icon: PackageIcon },
  { title: 'Account', to: ROUTES.shopAccount, icon: UserRoundIcon },
]
