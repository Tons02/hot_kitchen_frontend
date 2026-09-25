import { useEffect, useRef, useState, type ReactNode } from 'react'
import { DataTableLoadingState } from '@/components/common/data-table/DataTableLoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Card, CardContent } from '@/components/ui/card'
import type { Store } from '@/features/stores/stores.types'
import { PRODUCT_CATEGORIES_CARD_LIST_STEP, PRODUCT_CATEGORIES_MAX_PAGE_SIZE } from '../productCategories.constants'
import type {
  ProductCategory,
  ProductCategoriesQueryFilters,
  ProductCategoryAction,
} from '../productCategories.types'
import { getProductCategoryStatus } from '../productCategories.utils'
import { useGetProductCategoriesQuery } from '../productCategoriesApi'
import { ProductCategoryImage } from './ProductCategoryImage'
import { ProductCategoryRowActions } from './ProductCategoryRowActions'
import { ProductCategoryStatusBadge } from './ProductCategoryStatusBadge'

const NO_CATEGORIES: ProductCategory[] = []

interface ProductCategoryCardListProps {
  filters: ProductCategoriesQueryFilters
  storesById: ReadonlyMap<number, Store>
  onAction: (action: ProductCategoryAction) => void
  emptyState: ReactNode
}

/**
 * The phone layout: one card per category. It always asks for page 1 and adds
 * PRODUCT_CATEGORIES_CARD_LIST_STEP to `per_page` whenever the end of the list scrolls into view,
 * until it has the response's `total`.
 */
export function ProductCategoryCardList({ filters, storesById, onAction, emptyState }: ProductCategoryCardListProps) {
  const [growth, setGrowth] = useState({ filters, perPage: PRODUCT_CATEGORIES_CARD_LIST_STEP })
  // New search, filters or tab start again from the first step.
  if (growth.filters !== filters) setGrowth({ filters, perPage: PRODUCT_CATEGORIES_CARD_LIST_STEP })
  const { perPage } = growth

  // While a bigger per_page loads, `data` keeps the previous result so the cards stay on screen.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetProductCategoriesQuery({
    ...filters,
    page: 1,
    perPage,
  })

  const categories = data?.items ?? NO_CATEGORIES
  const total = data?.total ?? 0
  // The API caps per_page, so the list can't grow past PRODUCT_CATEGORIES_MAX_PAGE_SIZE.
  const hasMore = categories.length < total && perPage < PRODUCT_CATEGORIES_MAX_PAGE_SIZE
  const isLoadingMore = isFetching && perPage > categories.length
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
          perPage: Math.min(current.perPage + PRODUCT_CATEGORIES_CARD_LIST_STEP, PRODUCT_CATEGORIES_MAX_PAGE_SIZE),
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
        <DataTableLoadingState label="Loading product categories…" />
      </Card>
    )
  }

  if (isError) {
    return (
      <ErrorState title="Couldn't load product categories" error={error} onRetry={refetch} className="rounded-xl border" />
    )
  }

  if (categories.length === 0) return <Card className="py-0">{emptyState}</Card>

  const isCurrentView = filters.view === 'current'

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {categories.map((category) => {
          const store = storesById.get(category.store_id)
          return (
            <li key={category.id}>
              <Card className="py-4">
                <CardContent className="flex items-start gap-3 px-4">
                  <ProductCategoryImage category={category} size="lg" />
                  <div className="grid min-w-0 flex-1 justify-items-start gap-1.5">
                    <div className="grid min-w-0 max-w-full justify-items-start leading-tight">
                      {isCurrentView ? (
                        <button
                          type="button"
                          className="max-w-full truncate rounded-sm text-left font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                          onClick={() => onAction({ type: 'edit', category })}
                        >
                          {category.name}
                        </button>
                      ) : (
                        <span className="max-w-full truncate font-medium">{category.name}</span>
                      )}
                      <span className="max-w-full truncate text-xs text-muted-foreground">
                        {store ? `${store.name} (${store.code})` : `Store #${category.store_id}`}
                      </span>
                    </div>
                    <ProductCategoryStatusBadge status={getProductCategoryStatus(filters.view)} />
                    {category.description && (
                      <p className="line-clamp-2 max-w-full text-xs text-muted-foreground">{category.description}</p>
                    )}
                  </div>
                  <ProductCategoryRowActions category={category} view={filters.view} onAction={onAction} />
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>

      <div ref={sentinelRef} aria-hidden="true" />
      {isLoadingMore && <DataTableLoadingState label="Loading more categories…" />}
      {!hasMore && !isLoadingMore && (
        <p className="py-2 text-center text-sm text-muted-foreground">
          {categories.length < total
            ? `Showing the first ${categories.length} of ${total} categories. Search or filter to narrow the list.`
            : total === 1
              ? 'Showing the only category.'
              : `Showing all ${total} categories.`}
        </p>
      )}
    </div>
  )
}
