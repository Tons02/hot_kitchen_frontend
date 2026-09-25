import { createContext } from 'react'
import type { Product } from '@/features/products/products.types'

export interface AddToCartContextValue {
  /**
   * Starts adding a product: asks for options when it has any, sends a signed-out customer to sign in
   * (and adds it once they're back), and handles a cart from another store.
   */
  requestAdd: (product: Product) => void
  isCartOpen: boolean
  setCartOpen: (open: boolean) => void
}

export const AddToCartContext = createContext<AddToCartContextValue | null>(null)
