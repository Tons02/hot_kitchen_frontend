import { ArrowRightIcon, SparklesIcon, StoreIcon } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { ProductCartAction } from '@/features/cart/components/ProductCartAction'
import { DEFAULT_PRODUCT_FILTERS } from '@/features/products/products.constants'
import type { Product } from '@/features/products/products.types'
import { useGetProductsQuery } from '@/features/products/productsApi'
import { ROUTES } from '@/routes/paths'
import { useSelectedStore } from '../hooks/useSelectedStore'
import { ProductCard, ProductCardSkeleton } from './ProductCard'
import { SectionHeading } from './SectionHeading'

const FEATURED_COUNT = 8
const NO_PRODUCTS: Product[] = []

/**
 * The selected store's featured products. Products always belong to a store, so nothing shows until
 * the customer picks one: showing another store's items would promise food they can't order.
 */
export function FeaturedProducts() {
  const selected = useSelectedStore()
  const storeId = selected.storeId

  const productsQuery = useGetProductsQuery(
    {
      ...DEFAULT_PRODUCT_FILTERS,
      view: 'current',
      search: '',
      storeId: String(storeId ?? ''),
      featured: 'yes',
      page: 1,
      perPage: FEATURED_COUNT,
    },
    { skip: storeId === null },
  )
  const products = productsQuery.data?.items ?? NO_PRODUCTS


  return (
    <section aria-labelledby="featured-heading" className="flex flex-col gap-6">
      <SectionHeading
        id="featured-heading"
        title="Featured favorites"
        description={
          selected.store ? (
            <>
              Popular picks from <span className="font-medium text-foreground">{selected.store.name}</span>
            </>
          ) : (
            'Popular picks from your selected store.'
          )
        }
        action={
          storeId !== null && (
            <Button asChild variant="ghost" className="self-start rounded-full">
              <Link to={ROUTES.shopStore(storeId)}>
                View full menu
                <ArrowRightIcon />
              </Link>
            </Button>
          )
        }
      />

      {storeId === null ? (
        <EmptyState
          icon={StoreIcon}
          title="Choose a store"
          description="Select a store to see available food."
          className="rounded-2xl border border-dashed"
        />
      ) : productsQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : productsQuery.isError ? (
        <ErrorState
          title="Couldn't load featured food"
          error={productsQuery.error}
          onRetry={productsQuery.refetch}
          className="rounded-2xl border"
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={SparklesIcon}
          title="No featured products"
          description="Check back soon for featured favorites."
          className="rounded-2xl border border-dashed"
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id} className="flex">
              <ProductCard product={product} action={<ProductCartAction product={product} />} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
