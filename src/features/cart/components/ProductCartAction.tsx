import { PlusIcon } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { QuantityStepper } from '@/components/common/QuantityStepper'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { selectIsAuthenticated } from '@/features/auth/authSlice'
import type { Product } from '@/features/products/products.types'
import { toastInlineApiError } from '@/services/api/apiErrorMiddleware'
import { MAX_LINE_QUANTITY } from '../cart.schemas'
import { needsOptions } from '../cart.utils'
import { useGetCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from '../cartApi'
import { useAddToCart } from '../hooks/useAddToCart'

interface ProductCartActionProps {
  product: Product
  /** e.g. the store is unavailable. Unavailable products are disabled regardless. */
  disabled?: boolean
}

/**
 * A product card's cart control. Before it's in the cart: Add. After: a − / + stepper for simple
 * products (down to 0 removes it), or Add with the count for products with options, since each
 * combination of options is its own cart line.
 */
export function ProductCartAction({ product, disabled = false }: ProductCartActionProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated })
  const { requestAdd } = useAddToCart()
  const [updateItem, { isLoading: isUpdating }] = useUpdateCartItemMutation()
  const [removeItem, { isLoading: isRemoving }] = useRemoveCartItemMutation()

  // Only this store's cart counts; a cart from another store holds none of its lines.
  const lines = cart?.store?.id === product.store_id ? cart.items.filter((line) => line.product.id === product.id) : []
  const inCart = lines.reduce((sum, line) => sum + line.quantity, 0)
  const hasOptions = needsOptions(product)
  const isUnavailable = !product.is_available

  if (isUnavailable || disabled) {
    return (
      <Button size="sm" className="rounded-full" disabled aria-label={`${product.name} is unavailable`}>
        <PlusIcon />
        <span className="hidden sm:inline">Add</span>
      </Button>
    )
  }

  // A simple product has a single line: step its quantity in place.
  const [simpleLine] = lines
  if (!hasOptions && simpleLine && lines.length === 1) {
    const change = async (quantity: number) => {
      try {
        if (quantity === 0) await removeItem(simpleLine.id).unwrap()
        else await updateItem({ itemId: simpleLine.id, quantity }).unwrap()
      } catch (error) {
        // e.g. "Only 2 left in stock."
        toastInlineApiError(error)
      }
    }
    return (
      <QuantityStepper
        size="sm"
        value={simpleLine.quantity}
        min={0}
        max={MAX_LINE_QUANTITY}
        label={product.name}
        disabled={isUpdating || isRemoving}
        onChange={(quantity) => void change(quantity)}
      />
    )
  }

  return (
    <Button
      size="sm"
      className="relative rounded-full"
      onClick={() => requestAdd(product)}
      aria-label={inCart > 0 ? `Add another ${product.name}, ${inCart} in cart` : `Add ${product.name}`}
    >
      <PlusIcon />
      <span className="hidden sm:inline">Add</span>
      {inCart > 0 && (
        <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 min-w-5 rounded-full px-1 tabular-nums">
          {inCart}
        </Badge>
      )}
    </Button>
  )
}
