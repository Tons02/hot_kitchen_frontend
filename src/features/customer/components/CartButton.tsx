import { ShoppingBagIcon } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { selectIsAuthenticated } from '@/features/auth/authSlice'
import { CartPanel } from '@/features/cart/components/CartPanel'
import { useGetCartQuery } from '@/features/cart/cartApi'
import { useAddToCart } from '@/features/cart/hooks/useAddToCart'

/** The header's cart button with the live item count. Opens the cart panel (also from toasts and the phone pill). */
export function CartButton() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated })
  const { isCartOpen, setCartOpen } = useAddToCart()
  const itemCount = isAuthenticated ? (cart?.summary.item_count ?? 0) : 0
  const label = itemCount === 1 ? '1 item in cart' : `${itemCount} items in cart`

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative rounded-full" aria-label={`Cart, ${label}`}>
          <ShoppingBagIcon />
          <span className="hidden sm:inline">Cart</span>
          {itemCount > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 h-5 min-w-5 rounded-full px-1 tabular-nums">{itemCount}</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <CartPanel />
      </SheetContent>
    </Sheet>
  )
}
