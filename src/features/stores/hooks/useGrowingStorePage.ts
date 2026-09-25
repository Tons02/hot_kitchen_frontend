import { useEffect, useRef, useState } from 'react'
import { STORES_CARD_LIST_STEP, STORES_MAX_PAGE_SIZE } from '../stores.constants'
import type { Store, StoresQueryFilters } from '../stores.types'
import { useGetStorePageQuery } from '../storesApi'

const NO_STORES: Store[] = []

/**
 * Feeds the phone card lists. It always asks for page 1 and adds STORES_CARD_LIST_STEP to
 * `per_page` whenever `sentinelRef` scrolls into view, until it has the response's `total`.
 */
export function useGrowingStorePage(filters: StoresQueryFilters) {
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

  return { stores, total, hasMore, isLoading, isLoadingMore, isError, error, refetch, sentinelRef }
}

/** The line under a fully scrolled card list. */
export function getStoreListEndMessage(shown: number, total: number): string {
  if (shown < total) return `Showing the first ${shown} of ${total} stores. Search to narrow the list.`
  return total === 1 ? 'Showing the only store.' : `Showing all ${total} stores.`
}
