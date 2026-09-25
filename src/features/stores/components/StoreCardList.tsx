import type { ReactNode } from 'react'
import { DataTableLoadingState } from '@/components/common/data-table/DataTableLoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Card, CardContent } from '@/components/ui/card'
import { getStoreListEndMessage, useGrowingStorePage } from '../hooks/useGrowingStorePage'
import type { StoreAction, StoresQueryFilters } from '../stores.types'
import { getStoreStatus } from '../stores.utils'
import { StoreLogo } from './StoreLogo'
import { StoreRowActions } from './StoreRowActions'
import { StoreStatusBadge } from './StoreStatusBadge'

interface StoreCardListProps {
  filters: StoresQueryFilters
  onAction: (action: StoreAction) => void
  emptyState: ReactNode
}

/** The phone layout: one card per store, loading more as the end scrolls into view. */
export function StoreCardList({ filters, onAction, emptyState }: StoreCardListProps) {
  const { stores, total, hasMore, isLoading, isLoadingMore, isError, error, refetch, sentinelRef } =
    useGrowingStorePage(filters)

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
        <p className="py-2 text-center text-sm text-muted-foreground">{getStoreListEndMessage(stores.length, total)}</p>
      )}
    </div>
  )
}
