import { ShoppingBagIcon } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/authSlice'
import { useGetCartQuery } from '@/features/cart/cartApi'
import { useAddToCart } from '@/features/cart/hooks/useAddToCart'
import { formatPeso } from '@/lib/money'

/**
 * While the cart has items: a full-width bar above the bottom navigation on phones, a pill in the
 * bottom-right corner on wider screens. The cart stays one tap away wherever the customer scrolled.
 */
export function CartFloatingButton() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated })
  const { isCartOpen, setCartOpen } = useAddToCart()
  const count = cart?.summary.item_count ?? 0

  if (!isAuthenticated || count === 0 || isCartOpen) return null

  return (
    <button
      type="button"
      onClick={() => setCartOpen(true)}
      className="fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between gap-3 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-lg transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:inset-x-auto md:right-6 md:bottom-6 md:gap-6 md:hover:-translate-y-0.5 motion-reduce:transition-none"
    >
      <span className="flex items-center gap-2 font-medium">
        <ShoppingBagIcon className="size-5" aria-hidden="true" />
        {count} item{count === 1 ? '' : 's'}
      </span>
      <span className="font-semibold tabular-nums">View cart · {formatPeso(cart?.summary.total ?? 0)}</span>
    </button>
  )
}
