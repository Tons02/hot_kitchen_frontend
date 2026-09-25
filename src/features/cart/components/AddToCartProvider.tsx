import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAppSelector } from '@/app/hooks'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { selectIsAuthenticated } from '@/features/auth/authSlice'
import type { Product } from '@/features/products/products.types'
import { ROUTES, type RedirectLocationState } from '@/routes/paths'
import { toastInlineApiError } from '@/services/api/apiErrorMiddleware'
import { AddToCartContext } from '../addToCartContext'
import type { PendingCartItem } from '../cart.types'
import { isOtherStoreError, needsOptions, savePendingCartItem, takePendingCartItem } from '../cart.utils'
import { useAddCartItemMutation, useGetCartQuery } from '../cartApi'
import { ProductOptionsDialog } from './ProductOptionsDialog'

type AddOutcome = 'added' | 'sign-in' | 'other-store' | 'failed'

/**
 * The customer site's add-to-cart flow, shared by every Add button:
 * 1. products with a variation or add-ons open the options dialog first
 * 2. signed-out customers are sent to sign in, and the item is added as soon as they're back
 * 3. a cart from another store asks before starting a new one (a cart holds one store's items)
 */
export function AddToCartProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const navigate = useNavigate()
  const location = useLocation()
  const [addCartItem] = useAddCartItemMutation()
  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated })

  const [isCartOpen, setCartOpen] = useState(false)
  const [optionsProduct, setOptionsProduct] = useState<Product | null>(null)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [conflict, setConflict] = useState<PendingCartItem | null>(null)
  const [isConflictOpen, setIsConflictOpen] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)

  const add = useCallback(
    async (pending: PendingCartItem): Promise<AddOutcome> => {
      if (!isAuthenticated) {
        // Kept for the trip to the login page; added right after sign-in (see the effect below).
        savePendingCartItem(pending)
        toast.info(`Sign in to add ${pending.productName} to your cart.`, {
          description: "We'll add it as soon as you're signed in.",
        })
        const state: RedirectLocationState = { from: location }
        navigate(ROUTES.login, { state })
        return 'sign-in'
      }

      try {
        await addCartItem(pending.request).unwrap()
        toast.success(`${pending.productName} was added to your cart.`, {
          action: { label: 'View cart', onClick: () => setCartOpen(true) },
        })
        return 'added'
      } catch (error) {
        if (isOtherStoreError(error)) {
          setConflict(pending)
          setIsConflictOpen(true)
          return 'other-store'
        }
        // e.g. "Only 2 left in stock." Network and server errors are toasted globally.
        toastInlineApiError(error)
        return 'failed'
      }
    },
    [isAuthenticated, location, navigate, addCartItem],
  )

  // Back from signing in with an item waiting: add it now. Taking it also forgets it, so it's added once.
  // This syncs with sessionStorage (outside React); `add` only sets state after its request resolves.
  useEffect(() => {
    if (!isAuthenticated) return
    const pending = takePendingCartItem()
    // oxlint-disable-next-line react/set-state-in-effect
    if (pending) void add(pending)
  }, [isAuthenticated, add])

  const requestAdd = useCallback(
    (product: Product) => {
      if (needsOptions(product)) {
        setOptionsProduct(product)
        setIsOptionsOpen(true)
        return
      }
      void add({
        productName: product.name,
        request: { product_id: product.id, variation_id: null, quantity: 1, notes: null, add_ons: [] },
      })
    },
    [add],
  )

  const replaceCart = async () => {
    if (!conflict) return
    setIsReplacing(true)
    try {
      await addCartItem({ ...conflict.request, replace_cart: true }).unwrap()
      setIsConflictOpen(false)
      toast.success(`Started a new cart with ${conflict.productName}.`, {
        action: { label: 'View cart', onClick: () => setCartOpen(true) },
      })
    } catch (error) {
      toastInlineApiError(error)
    } finally {
      setIsReplacing(false)
    }
  }

  const value = useMemo(() => ({ requestAdd, isCartOpen, setCartOpen }), [requestAdd, isCartOpen])

  return (
    <AddToCartContext.Provider value={value}>
      {children}

      <ProductOptionsDialog
        product={optionsProduct}
        open={isOptionsOpen}
        onOpenChange={setIsOptionsOpen}
        onSubmit={async (request) => {
          const outcome = await add({ request, productName: optionsProduct?.name ?? 'The item' })
          // Stays open on failure (e.g. too few in stock) so the quantity can be changed.
          if (outcome !== 'failed') setIsOptionsOpen(false)
        }}
      />

      <ConfirmDialog
        open={isConflictOpen}
        onOpenChange={setIsConflictOpen}
        title="Start a new cart?"
        description={`Your cart has items from ${cart?.store?.name ?? 'another store'}. A cart holds one store's items, so adding ${conflict?.productName ?? 'this'} will remove them.`}
        confirmLabel="Start a new cart"
        cancelLabel="Keep my cart"
        variant="destructive"
        isLoading={isReplacing}
        onConfirm={() => void replaceCart()}
      />
    </AddToCartContext.Provider>
  )
}
