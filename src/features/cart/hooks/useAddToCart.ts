import { useContext } from 'react'
import { AddToCartContext, type AddToCartContextValue } from '../addToCartContext'

/** The customer site's add-to-cart flow and cart panel. Only inside AddToCartProvider (CustomerLayout). */
export function useAddToCart(): AddToCartContextValue {
  const context = useContext(AddToCartContext)
  if (!context) throw new Error('useAddToCart must be used inside AddToCartProvider.')
  return context
}
