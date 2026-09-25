import { ProductCartAction } from '@/features/cart/components/ProductCartAction'
import { DEFAULT_PRODUCT_FILTERS } from '@/features/products/products.constants'
import type { Product } from '@/features/products/products.types'
import { useGetProductsQuery } from '@/features/products/productsApi'
import { ProductCard, ProductCardSkeleton } from '../ProductCard'

const FEATURED_COUNT = 10
const NO_PRODUCTS: Product[] = []

interface StoreFeaturedSectionProps {
  storeId: number
  /** The section's id, for the jump links; its heading's id is `${sectionId}-heading`. */
  sectionId: string
  /** Ordering is paused (the store is unavailable). */
  isOrderingPaused: boolean
}

/**
 * The store's featured products: a swipeable row on phones, a grid from tablet up. The whole section
 * is left out when the store features nothing.
 */
export function StoreFeaturedSection({ storeId, sectionId, isOrderingPaused }: StoreFeaturedSectionProps) {
  const { data, isLoading } = useGetProductsQuery({
    ...DEFAULT_PRODUCT_FILTERS,
    view: 'current',
    search: '',
    storeId: String(storeId),
    featured: 'yes',
    page: 1,
    perPage: FEATURED_COUNT,
  })
  const products = data?.items ?? NO_PRODUCTS

  if (!isLoading && products.length === 0) return null

  return (
    <section id={sectionId} aria-labelledby={`${sectionId}-heading`} className="flex scroll-mt-32 flex-col gap-4">
      <div className="space-y-1">
        <h2 id={`${sectionId}-heading`} className="font-heading text-2xl font-semibold tracking-tight">
          Featured
        </h2>
        <p className="text-muted-foreground">The store's picks.</p>
      </div>
      {/* Phones swipe through the row; wider screens get a grid. */}
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="w-44 shrink-0 sm:w-auto">
                <ProductCardSkeleton />
              </li>
            ))
          : products.map((product) => (
              <li key={product.id} className="flex w-44 shrink-0 snap-start sm:w-auto">
                <ProductCard
                  product={product}
                  action={<ProductCartAction product={product} disabled={isOrderingPaused} />}
                />
              </li>
            ))}
      </ul>
    </section>
  )
}
