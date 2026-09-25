import { useAppSelector } from '@/app/hooks'
import { selectCurrentUser } from '@/features/auth/authSlice'
import { isStoreBoundRole } from '@/features/users/users.utils'

/**
 * The signed-in user's store when they work at one (store managers and other store-bound roles), else
 * null (admins, who work across stores). Store-bound users only ever see their own store's pages
 * (inventory, vouchers).
 * This only shapes the UI; the API enforces access.
 */
export function useOwnStoreId(): number | null {
  const user = useAppSelector(selectCurrentUser)
  if (!user || !isStoreBoundRole(user.role) || !user.store_id) return null
  return user.store_id
}
