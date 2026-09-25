import { ChevronRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { DataTableLoadingState } from '@/components/common/data-table/DataTableLoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Card } from '@/components/ui/card'
import { getStoreListEndMessage, useGrowingStorePage } from '../hooks/useGrowingStorePage'
import type { Store, StoresQueryFilters } from '../stores.types'
import { StoreLogo } from './StoreLogo'

interface StoreDirectoryCardListProps {
  filters: StoresQueryFilters
  getStoreHref: (storeId: number) => string
  /** A line of page-specific details under the store's name, e.g. stock counts. */
  renderMeta?: (store: Store) => ReactNode
  emptyState: ReactNode
}

/** The phone layout of a store picker: one tappable card per store, loading more as you scroll. */
export function StoreDirectoryCardList({ filters, getStoreHref, renderMeta, emptyState }: StoreDirectoryCardListProps) {
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
            <Link
              to={getStoreHref(store.id)}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 text-card-foreground transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <StoreLogo store={store} size="lg" />
              <div className="grid min-w-0 flex-1 gap-1 leading-tight">
                <span className="truncate font-medium">{store.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {store.code} · {store.city}
                </span>
                {renderMeta?.(store)}
              </div>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
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
