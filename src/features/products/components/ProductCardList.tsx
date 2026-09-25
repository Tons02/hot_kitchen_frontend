import { StarIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { DataTableLoadingState } from '@/components/common/data-table/DataTableLoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Store } from '@/features/stores/stores.types'
import { PRODUCTS_CARD_LIST_STEP, PRODUCTS_MAX_PAGE_SIZE } from '../products.constants'
import type { Product, ProductAction, ProductsQueryFilters } from '../products.types'
import { getProductPriceLabel, getProductStatus } from '../products.utils'
import { useGetProductsQuery } from '../productsApi'
import { ProductRowActions } from './ProductRowActions'
import { ProductStatusBadge } from './ProductStatusBadge'
import { ProductThumbnail } from './ProductThumbnail'

const NO_PRODUCTS: Product[] = []

interface ProductCardListProps {
  filters: ProductsQueryFilters
  storesById: ReadonlyMap<number, Store>
  onAction: (action: ProductAction) => void
  emptyState: ReactNode
}

/**
 * The phone layout: one card per product. It always asks for page 1 and adds PRODUCTS_CARD_LIST_STEP
 * to `per_page` whenever the end of the list scrolls into view, until it has the response's `total`.
 */
export function ProductCardList({ filters, storesById, onAction, emptyState }: ProductCardListProps) {
  const [growth, setGrowth] = useState({ filters, perPage: PRODUCTS_CARD_LIST_STEP })
  // New search, filters or tab start again from the first step.
  if (growth.filters !== filters) setGrowth({ filters, perPage: PRODUCTS_CARD_LIST_STEP })
  const { perPage } = growth

  // While a bigger per_page loads, `data` keeps the previous result so the cards stay on screen.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetProductsQuery({ ...filters, page: 1, perPage })

  const products = data?.items ?? NO_PRODUCTS
  const total = data?.total ?? 0
  // The API caps per_page, so the list can't grow past PRODUCTS_MAX_PAGE_SIZE.
  const hasMore = products.length < total && perPage < PRODUCTS_MAX_PAGE_SIZE
  const isLoadingMore = isFetching && perPage > products.length
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || isFetching) return

    // Starts loading a little before the end so scrolling rarely has to wait.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setGrowth((current) => ({
          ...current,
          perPage: Math.min(current.perPage + PRODUCTS_CARD_LIST_STEP, PRODUCTS_MAX_PAGE_SIZE),
        }))
      },
      { rootMargin: '240px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isFetching])

  if (isLoading) {
    return (
      <Card>
        <DataTableLoadingState label="Loading products…" />
      </Card>
    )
  }

  if (isError) return <ErrorState title="Couldn't load products" error={error} onRetry={refetch} className="rounded-xl border" />

  if (products.length === 0) return <Card className="py-0">{emptyState}</Card>

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {products.map((product) => {
          const store = storesById.get(product.store_id)
          return (
            <li key={product.id}>
              <Card className="py-4">
                <CardContent className="flex items-start gap-3 px-4">
                  <ProductThumbnail product={product} size="lg" />
                  <div className="grid min-w-0 flex-1 justify-items-start gap-1.5">
                    <div className="grid min-w-0 max-w-full justify-items-start leading-tight">
                      <span className="flex max-w-full items-center gap-1.5">
                        <button
                          type="button"
                          className="truncate rounded-sm text-left font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                          onClick={() => onAction({ type: 'view', product })}
                        >
                          {product.name}
                        </button>
                        {product.is_featured && (
                          <StarIcon className="size-3.5 shrink-0 fill-warning text-warning" aria-label="Featured" />
                        )}
                      </span>
                      <span className="max-w-full truncate text-xs text-muted-foreground">
                        {store ? store.name : `Store #${product.store_id}`}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ProductStatusBadge status={getProductStatus(product, filters.view)} />
                      {product.category && <Badge variant="secondary">{product.category.name}</Badge>}
                    </div>
                    <p className="text-sm font-medium tabular-nums">{getProductPriceLabel(product)}</p>
                  </div>
                  <ProductRowActions product={product} view={filters.view} onAction={onAction} />
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>

      <div ref={sentinelRef} aria-hidden="true" />
      {isLoadingMore && <DataTableLoadingState label="Loading more products…" />}
      {!hasMore && !isLoadingMore && (
        <p className="py-2 text-center text-sm text-muted-foreground">
          {products.length < total
            ? `Showing the first ${products.length} of ${total} products. Search or filter to narrow the list.`
            : total === 1
              ? 'Showing the only product.'
              : `Showing all ${total} products.`}
        </p>
      )}
    </div>
  )
}
