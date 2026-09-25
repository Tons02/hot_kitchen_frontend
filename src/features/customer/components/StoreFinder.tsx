import { LocateFixedIcon, StoreIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { StoreCombobox } from '@/features/stores/components/StoreCombobox'
import type { Store } from '@/features/stores/stores.types'
import { useSearchStoresQuery } from '@/features/stores/storesApi'
import { ROUTES } from '@/routes/paths'
import { getDistanceKm } from '../customer.utils'
import { useCurrentLocation } from '../hooks/useCurrentLocation'
import { useSelectedStore } from '../hooks/useSelectedStore'
import { SectionHeading } from './SectionHeading'
import { StoreCard, StoreCardSkeleton } from './StoreCard'

interface StoreFinderProps {
  /** Heading id, so a "Start your order" link can jump here. */
  headingId?: string
  title?: string
  /** How many stores to show as cards; the picker searches all of them. */
  limit?: number
}

const NO_STORES: Store[] = []

/**
 * Where the customer chooses their store: a searchable picker, an opt-in "use my location" that sorts
 * the cards by distance, and store cards. The choice is remembered (see customerSlice).
 */
export function StoreFinder({ headingId, title = 'Find a store', limit = 6 }: StoreFinderProps) {
  const selected = useSelectedStore()
  const location = useCurrentLocation()

  const storesQuery = useSearchStoresQuery({ search: '', perPage: limit })
  const stores = storesQuery.data?.items ?? NO_STORES

  const withDistance = stores.map((store) => ({
    store,
    distanceKm: location.coords ? getDistanceKm(location.coords, store) : null,
  }))
  // Nearest first once the customer shares their location.
  if (location.coords) withDistance.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))

  const navigate = useNavigate()
  // Choosing a store opens its storefront (which also makes it the customer's store).
  const chooseStore = (store: Pick<Store, 'id'>) => {
    selected.select(store.id)
    navigate(ROUTES.shopStore(store.id))
  }

  return (
    <section aria-labelledby={headingId} className="flex scroll-mt-24 flex-col gap-6">
      <SectionHeading id={headingId} title={title} description="Where would you like to order from?" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-80">
          <StoreCombobox
            value={selected.storeId ? String(selected.storeId) : ''}
            onChange={(value) => chooseStore({ id: Number(value) })}
            placeholder="Choose your store"
            aria-label="Choose your store"
          />
        </div>
        {location.status !== 'unavailable' && (
          <Button
            variant="outline"
            className="rounded-full"
            onClick={location.request}
            disabled={location.status === 'locating'}
          >
            {location.status === 'locating' ? <Spinner /> : <LocateFixedIcon />}
            {location.status === 'ready' ? 'Nearest stores first' : 'Use my current location'}
          </Button>
        )}
      </div>
      {location.status === 'denied' && (
        <p role="status" className="text-sm text-muted-foreground">
          Location is turned off for this site. You can still choose a store from the list.
        </p>
      )}

      {storesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <StoreCardSkeleton key={index} />
          ))}
        </div>
      ) : storesQuery.isError ? (
        <ErrorState
          title="Couldn't load stores"
          error={storesQuery.error}
          onRetry={storesQuery.refetch}
          className="rounded-2xl border"
        />
      ) : stores.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title="No stores available"
          description="We couldn't find an available store right now."
          className="rounded-2xl border"
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withDistance.map(({ store, distanceKm }) => (
            <li key={store.id} className="flex">
              <StoreCard
                store={store}
                distanceKm={distanceKm}
                isSelected={store.id === selected.storeId}
                onSelect={chooseStore}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
