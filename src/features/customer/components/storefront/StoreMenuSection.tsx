import { SearchXIcon, UtensilsIcon } from 'lucide-react'
import { useEffect, useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageNavigation } from '@/components/common/PageNavigation'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCartAction } from '@/features/cart/components/ProductCartAction'
import { useSearchProductCategoriesQuery } from '@/features/productCategories/productCategoriesApi'
import { DEFAULT_PRODUCT_FILTERS } from '@/features/products/products.constants'
import type { Product } from '@/features/products/products.types'
import { useGetProductsQuery } from '@/features/products/productsApi'
import { cn } from '@/lib/utils'
import { scrollToSection } from '../../customer.utils'
import { ProductCard, ProductCardSkeleton } from '../ProductCard'

/** Products per page of the menu. */
const PER_PAGE = 20
/** The API's `per_page` limit: a store's categories fit in one request. */
const CATEGORY_LIMIT = 100

const NO_PRODUCTS: Product[] = []

interface StoreMenuSectionProps {
  storeId: number
  /** The section's id, for the jump links; its heading's id is `${sectionId}-heading`. */
  sectionId: string
  isOrderingPaused: boolean
}

/** The menu's search, category and page, read from and written to the URL (`?q=&category=&page=`). */
function useMenuParams() {
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const categoryId = params.get('category') ?? 'all'
  const requestedPage = Number(params.get('page'))
  const page = Number.isInteger(requestedPage) && requestedPage > 1 ? requestedPage : 1

  /** Applies changes; a new search or category always starts again from page 1. */
  const update = (patch: { search?: string; categoryId?: string; page?: number }) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        const set = (key: string, value: string | null) => (value ? next.set(key, value) : next.delete(key))
        if (patch.search !== undefined) set('q', patch.search.trim() || null)
        if (patch.categoryId !== undefined) set('category', patch.categoryId === 'all' ? null : patch.categoryId)
        const nextPage = patch.page ?? 1
        set('page', nextPage > 1 ? String(nextPage) : null)
        return next
      },
      // Keeps the scroll position; paging scrolls to the top of the menu itself.
      { preventScrollReset: true },
    )

  /** The URL of a page with the current search and category, for the page links. */
  const getPageHref = (target: number) => {
    const next = new URLSearchParams(params)
    if (target > 1) next.set('page', String(target))
    else next.delete('page')
    const query = next.toString()
    return query ? `?${query}` : '?'
  }

  return { search, categoryId, page, update, getPageHref, setParams }
}

/**
 * The store's menu: search, categories (a sticky list on desktop, swipeable chips on phones) and the
 * product grid, 20 at a time with numbered pages. Search, category and page run on the API and live
 * in the URL, so a reload, a shared link or Back keeps the customer's place.
 */
export function StoreMenuSection({ storeId, sectionId, isOrderingPaused }: StoreMenuSectionProps) {
  const { search, categoryId, page, update, getPageHref, setParams } = useMenuParams()

  const { data: categoryPage, isLoading: isLoadingCategories } = useSearchProductCategoriesQuery({
    storeId,
    search: '',
    perPage: CATEGORY_LIMIT,
  })
  const categories = categoryPage?.items ?? []

  const query = useMemo(
    () => ({
      ...DEFAULT_PRODUCT_FILTERS,
      view: 'current' as const,
      search,
      storeId: String(storeId),
      categoryId,
      page,
      perPage: PER_PAGE,
    }),
    [search, storeId, categoryId, page],
  )
  // While another page loads, `data` keeps the current one on screen (dimmed) instead of flashing skeletons.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetProductsQuery(query)
  const products = data?.items ?? NO_PRODUCTS
  const total = data?.total ?? 0
  const pageCount = data?.lastPage ?? 1

  // A page past the end (an old link, or items removed since) steps back to the last page. It changes
  // the URL, so it runs after render rather than during it.
  const lastPage = data?.lastPage
  useEffect(() => {
    if (lastPage !== undefined && lastPage >= 1 && page > lastPage) {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (lastPage > 1) next.set('page', String(lastPage))
          else next.delete('page')
          return next
        },
        { replace: true, preventScrollReset: true },
      )
    }
  }, [lastPage, page, setParams])

  const goToPage = (target: number) => {
    update({ search, categoryId, page: target })
    scrollToSection(sectionId)
  }

  const categoryOptions = [
    { id: 'all', name: 'All' },
    ...categories.map((category) => ({ id: String(category.id), name: category.name })),
  ]
  const activeCategory = categoryOptions.find((option) => option.id === categoryId)
  const isFiltered = search !== '' || categoryId !== 'all'

  const clearFilters = () => update({ search: '', categoryId: 'all' })
  const firstShown = (page - 1) * PER_PAGE + 1
  const lastShown = firstShown + products.length - 1

  return (
    <section id={sectionId} aria-labelledby={`${sectionId}-heading`} className="flex scroll-mt-32 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 id={`${sectionId}-heading`} className="font-heading text-2xl font-semibold tracking-tight">
            Menu
          </h2>
          <p className="text-muted-foreground" aria-live="polite">
            {isLoading
              ? 'Loading the menu…'
              : `${total.toLocaleString()} item${total === 1 ? '' : 's'}${activeCategory && categoryId !== 'all' ? ` in ${activeCategory.name}` : ''}${pageCount > 1 ? ` · showing ${firstShown}–${lastShown}` : ''}`}
          </p>
        </div>
        <SearchInput
          value={search}
          onSearch={(next) => update({ search: next, categoryId })}
          placeholder="Search the menu, then press Enter"
          label="Search the menu"
          className="sm:max-w-xs"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[13rem_1fr]">
        {/* Phones: sticky swipeable chips under the section nav. Desktop: a sticky list beside the grid. */}
        <nav
          aria-label="Menu categories"
          className="sticky top-28 z-20 -mx-4 bg-background/95 px-4 py-2 backdrop-blur lg:top-32 lg:mx-0 lg:self-start lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
        >
          {isLoadingCategories ? (
            <div className="flex gap-2 lg:flex-col">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-8 w-20 rounded-full lg:w-full lg:rounded-lg" />
              ))}
            </div>
          ) : (
            <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
              {categoryOptions.map((option) => {
                const isActive = option.id === categoryId
                return (
                  <li key={option.id} className="shrink-0">
                    <button
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => update({ search, categoryId: option.id })}
                      className={cn(
                        'rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors lg:w-full lg:rounded-lg lg:border-0 lg:px-3 lg:py-2 lg:text-left',
                        'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground lg:bg-accent lg:text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      {option.name}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </nav>

        <div className="flex min-w-0 flex-col gap-4">
          {isLoading ? (
            <ProductGrid>
              {Array.from({ length: 6 }, (_, index) => (
                <li key={index}>
                  <ProductCardSkeleton />
                </li>
              ))}
            </ProductGrid>
          ) : isError ? (
            <ErrorState title="Couldn't load the menu" error={error} onRetry={refetch} className="rounded-2xl border" />
          ) : products.length === 0 ? (
            <EmptyState
              icon={isFiltered ? SearchXIcon : UtensilsIcon}
              title={isFiltered ? 'No products found' : 'Nothing on the menu yet'}
              description={isFiltered ? 'Try another category or search term.' : 'Check back soon.'}
              action={
                isFiltered && (
                  <Button variant="outline" className="rounded-full" onClick={clearFilters}>
                    Show the whole menu
                  </Button>
                )
              }
              className="rounded-2xl border border-dashed"
            />
          ) : (
            <>
              <ProductGrid className={cn('transition-opacity', isFetching && 'opacity-60')}>
                {products.map((product) => (
                  <li key={product.id} className="flex">
                    <ProductCard
                      product={product}
                      action={<ProductCartAction product={product} disabled={isOrderingPaused} />}
                    />
                  </li>
                ))}
              </ProductGrid>
              <PageNavigation
                page={page}
                pageCount={pageCount}
                getHref={getPageHref}
                onPageChange={goToPage}
                label="Menu pages"
                className="pt-2"
              />
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function ProductGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4', className)}>{children}</ul>
}

export function StoreMenuSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 6 }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
