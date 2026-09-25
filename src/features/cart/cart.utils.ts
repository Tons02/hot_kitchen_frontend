import type { Product } from '@/features/products/products.types'
import { normalizeApiError } from '@/services/api/apiError'
import type { PendingCartItem } from './cart.types'

/*
 * The item a signed-out customer chose, kept in sessionStorage while they sign in (it only needs to
 * survive the trip to the login page and back, in this tab). Storage can be unavailable, so every
 * access is guarded; the customer then simply taps Add again.
 */
const PENDING_KEY = 'hot-kitchen.pending-cart-item'

export function savePendingCartItem(item: PendingCartItem): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(item))
  } catch {
    // Not kept; the customer adds it again after signing in.
  }
}

/** Reads and forgets the pending item, so it's added at most once. */
export function takePendingCartItem(): PendingCartItem | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    sessionStorage.removeItem(PENDING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingCartItem
    return typeof parsed?.request?.product_id === 'number' ? parsed : null
  } catch {
    return null
  }
}

/** A product needs the options dialog when there's a variation to choose or add-ons to offer. */
export function needsOptions(product: Pick<Product, 'variations' | 'add_ons'>): boolean {
  const hasVariations = (product.variations ?? []).some((variation) => variation.is_available)
  const hasAddOns = (product.add_ons ?? []).some((addOn) => addOn.is_available)
  return hasVariations || hasAddOns
}

/**
 * The API refuses to mix stores in one cart with this 422. There's no error code, so it's recognised
 * by its message; the customer is then asked whether to start a new cart.
 */
export function isOtherStoreError(error: unknown): boolean {
  const { status, message } = normalizeApiError(error)
  return status === 422 && /another store/i.test(message)
}
