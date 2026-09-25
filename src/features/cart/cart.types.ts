import type { DiscountType } from '@/features/storeVouchers/storeVouchers.types'

/** One line of the cart, priced live by the API (CartResource::line). Money is decimal strings. */
export interface CartLine {
  id: number
  product: { id: number; name: string; slug: string; image_url: string | null }
  variation: { id: number; name: string } | null
  add_ons: { id: number; name: string; price: string; quantity: number }[]
  notes: string | null
  quantity: number
  unit_price: string
  original_unit_price: string
  on_promotion: boolean
  add_ons_total: string
  line_total: string
  /** Why the line can't be ordered right now (unavailable, out of stock), else null. */
  issue: string | null
}

/** Mirrors the API's CartResource. A customer without a cart gets the same shape with `id: null`. */
export interface Cart {
  id: number | null
  /** A cart holds one store's items; adding from another store needs `replace_cart`. */
  store: { id: number; code: string; name: string } | null
  items: CartLine[]
  voucher: {
    id: number
    code: string
    name: string
    discount_type: DiscountType
    /** Why the applied voucher doesn't apply to the cart as it is now, else null. */
    error: string | null
  } | null
  notes: string | null
  summary: {
    item_count: number
    subtotal: string
    discount: string
    free_delivery: boolean
    total: string
  }
  /** True when a line is unavailable or out of stock: checkout must wait until it's fixed. */
  has_issues: boolean
  expires_at: string | null
  updated_at: string | null
}

/** `POST /cart/items` (CartItemRequest). Adding the same thing again raises that line's quantity. */
export interface AddCartItemRequest {
  product_id: number
  variation_id: number | null
  /** 1–99. */
  quantity: number
  notes: string | null
  add_ons: { add_on_id: number; quantity: number }[]
  /** Start a new cart at this product's store, clearing the current one. */
  replace_cart?: boolean
}

/** `PATCH /cart/items/{item}`. Send only what changes. */
export interface UpdateCartItemRequest {
  itemId: number
  quantity?: number
  notes?: string | null
}

/**
 * An item a signed-out customer chose, kept while they sign in so it can be added right after.
 * `productName` is only for the messages.
 */
export interface PendingCartItem {
  request: AddCartItemRequest
  productName: string
}
