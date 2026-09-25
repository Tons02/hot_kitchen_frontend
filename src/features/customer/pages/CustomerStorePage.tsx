import { ArrowLeftIcon } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { DocumentTitle } from '@/components/common/DocumentTitle'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { DEFAULT_PRODUCT_FILTERS } from '@/features/products/products.constants'
import { useGetProductsQuery } from '@/features/products/productsApi'
import { useGetStoreQuery } from '@/features/stores/storesApi'
import { ROUTES } from '@/routes/paths'
import { StoreFeaturedSection } from '../components/storefront/StoreFeaturedSection'
import { StoreHero, StoreHeroSkeleton } from '../components/storefront/StoreHero'
import { StoreInfoSection } from '../components/storefront/StoreInfoSection'
import { StoreMenuSection, StoreMenuSkeleton } from '../components/storefront/StoreMenuSection'
import { StoreSectionNav, type StoreSection } from '../components/storefront/StoreSectionNav'
import { useSelectedStore } from '../hooks/useSelectedStore'

const SECTION = { overview: 'overview', featured: 'featured', menu: 'menu', location: 'location' } as const

/**
 * A store's storefront: who they are, their picks, the menu to order from, and where to find them.
 * Opening it makes this the customer's store, so the home page and cart follow it.
 */
export default function CustomerStorePage() {
  const storeId = Number(useParams().storeId)
  const isValidId = Number.isInteger(storeId) && storeId > 0
  const { data: store, isLoading, isError, error, refetch } = useGetStoreQuery(storeId, { skip: !isValidId })
  const selected = useSelectedStore()

  // Featured is left out of the jump links when the store features nothing (the section hides too).
  const { data: featured } = useGetProductsQuery(
    {
      ...DEFAULT_PRODUCT_FILTERS,
      view: 'current',
      search: '',
      storeId: String(storeId),
      featured: 'yes',
      page: 1,
      perPage: 10,
    },
    { skip: !isValidId },
  )
  // The whole menu's size, for the hero. One product per page keeps the request light.
  const { data: menuCount } = useGetProductsQuery(
    { ...DEFAULT_PRODUCT_FILTERS, view: 'current', search: '', storeId: String(storeId), page: 1, perPage: 1 },
    { skip: !isValidId },
  )

  const { select } = selected
  useEffect(() => {
    if (store) select(store.id)
  }, [store, select])

  const sections = useMemo<StoreSection[]>(
    () => [
      { id: SECTION.overview, label: 'Overview' },
      ...(featured && featured.total > 0 ? [{ id: SECTION.featured, label: 'Featured' }] : []),
      { id: SECTION.menu, label: 'Menu' },
      { id: SECTION.location, label: 'Location' },
    ],
    [featured],
  )

  if (!isValidId || isError) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-3 px-4 py-12 sm:px-6">
        <ErrorState
          title="We couldn't find this store"
          error={error}
          onRetry={isValidId ? refetch : undefined}
          className="w-full rounded-2xl border"
        />
        <Button asChild variant="outline" className="rounded-full">
          <Link to={ROUTES.shopStores}>
            <ArrowLeftIcon />
            All stores
          </Link>
        </Button>
      </div>
    )
  }

  if (isLoading || !store) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 pb-12 md:px-6 md:pt-6">
        <StoreHeroSkeleton />
        <div className="px-4 md:px-0">
          <StoreMenuSkeleton />
        </div>
      </div>
    )
  }

  const isOrderingPaused = !store.is_active

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col pb-12 md:px-6 md:pt-6">
      <DocumentTitle title={store.name} />
      <section id={SECTION.overview} aria-label={`About ${store.name}`} className="scroll-mt-32">
        <StoreHero store={store} productCount={menuCount?.total} menuSectionId={SECTION.menu} />
      </section>

      <div className="mt-6 flex flex-col gap-10 px-4 md:px-0">
        <StoreSectionNav sections={sections} />
        <StoreFeaturedSection storeId={store.id} sectionId={SECTION.featured} isOrderingPaused={isOrderingPaused} />
        <StoreMenuSection storeId={store.id} sectionId={SECTION.menu} isOrderingPaused={isOrderingPaused} />
        <StoreInfoSection store={store} sectionId={SECTION.location} />
      </div>
    </div>
  )
}
