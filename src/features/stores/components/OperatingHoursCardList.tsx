import { ClockIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { DataTableLoadingState } from '@/components/common/data-table/DataTableLoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getStoreListEndMessage, useGrowingStorePage } from '../hooks/useGrowingStorePage'
import type { Store, StoresQueryFilters } from '../stores.types'
import { OperatingHoursStatusBadge, OperatingHoursSummary } from './OperatingHoursSummary'
import { StoreLogo } from './StoreLogo'

interface OperatingHoursCardListProps {
  filters: StoresQueryFilters
  onEdit: (store: Store) => void
  emptyState: ReactNode
}

/** The phone layout: one card per store with its week, loading more as the end scrolls into view. */
export function OperatingHoursCardList({ filters, onEdit, emptyState }: OperatingHoursCardListProps) {
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
              <CardContent className="flex flex-col gap-3 px-4">
                <div className="flex items-center gap-3">
                  <StoreLogo store={store} size="lg" />
                  <div className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate font-medium">{store.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{store.code}</span>
                  </div>
                  <OperatingHoursStatusBadge hours={store.operating_hours} />
                </div>
                <OperatingHoursSummary hours={store.operating_hours} />
                <Button variant="outline" size="sm" className="self-start" onClick={() => onEdit(store)}>
                  <ClockIcon />
                  Edit hours
                </Button>
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
