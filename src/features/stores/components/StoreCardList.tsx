import { useEffect, useRef, useState, type ReactNode } from 'react'
import { DataTableLoadingState } from '@/components/common/data-table/DataTableLoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Card, CardContent } from '@/components/ui/card'
import { STORES_CARD_LIST_STEP, STORES_MAX_PAGE_SIZE } from '../stores.constants'
import type { Store, StoreAction, StoresQueryFilters } from '../stores.types'
import { getStoreStatus } from '../stores.utils'
import { useGetStorePageQuery } from '../storesApi'
import { StoreLogo } from './StoreLogo'
import { StoreRowActions } from './StoreRowActions'
import { StoreStatusBadge } from './StoreStatusBadge'

const NO_STORES: Store[] = []

interface StoreCardListProps {
  filters: StoresQueryFilters
  onAction: (action: StoreAction) => void
  emptyState: ReactNode
}

/**
 * The phone layout: one card per store. It always asks for page 1 and adds STORES_CARD_LIST_STEP to
 * `per_page` whenever the end of the list scrolls into view, until it has the response's `total`.
 */
export function StoreCardList({ filters, onAction, emptyState }: StoreCardListProps) {
  const [growth, setGrowth] = useState({ filters, perPage: STORES_CARD_LIST_STEP })
  // New search or tab starts again from the first step.
  if (growth.filters !== filters) setGrowth({ filters, perPage: STORES_CARD_LIST_STEP })
  const { perPage } = growth

  // While a bigger per_page loads, `data` keeps the previous result so the cards stay on screen.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetStorePageQuery({ ...filters, page: 1, perPage })

  const stores = data?.items ?? NO_STORES
  const total = data?.total ?? 0
  // The API caps per_page, so the list can't grow past STORES_MAX_PAGE_SIZE.
  const hasMore = stores.length < total && perPage < STORES_MAX_PAGE_SIZE
  const isLoadingMore = isFetching && perPage > stores.length
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
          perPage: Math.min(current.perPage + STORES_CARD_LIST_STEP, STORES_MAX_PAGE_SIZE),
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
        <DataTableLoadingState label="Loading stores…" />
      </Card>
    )
  }

  if (isError) return <ErrorState title="Couldn't load stores" error={error} onRetry={refetch} className="rounded-xl border" />

  if (stores.length === 0) return <Card className="py-0">{emptyState}</Card>

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {stores.map((store) => (
          <li key={store.id}>
            <Card className="py-4">
              <CardContent className="flex items-start gap-3 px-4">
                <StoreLogo store={store} size="lg" />
                <div className="grid min-w-0 flex-1 justify-items-start gap-1.5">
                  <div className="grid min-w-0 max-w-full justify-items-start leading-tight">
                    <button
                      type="button"
                      className="max-w-full truncate rounded-sm text-left font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      onClick={() => onAction({ type: 'view', store })}
                    >
                      {store.name}
                    </button>
                    <span className="max-w-full truncate text-xs text-muted-foreground">{store.code}</span>
                  </div>
                  <StoreStatusBadge status={getStoreStatus(store, filters.view)} />
                  <p className="max-w-full truncate text-xs text-muted-foreground">
                    {store.city}, {store.province} · {store.mobile_number}
                  </p>
                </div>
                <StoreRowActions store={store} view={filters.view} onAction={onAction} />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <div ref={sentinelRef} aria-hidden="true" />
      {isLoadingMore && <DataTableLoadingState label="Loading more stores…" />}
      {!hasMore && !isLoadingMore && (
        <p className="py-2 text-center text-sm text-muted-foreground">
          {stores.length < total
            ? `Showing the first ${stores.length} of ${total} stores. Search to narrow the list.`
            : total === 1
              ? 'Showing the only store.'
              : `Showing all ${total} stores.`}
        </p>
      )}
    </div>
  )
}
