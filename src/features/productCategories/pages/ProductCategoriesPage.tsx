import { PlusIcon } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { DataTable } from '@/components/common/data-table/DataTable'
import { DataTableEmptyState } from '@/components/common/data-table/DataTableEmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useStoreLookup } from '@/features/stores/hooks/useStoreLookup'
import { useHotkey } from '@/hooks/use-hotkey'
import { useIsBelowTablet } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { ProductCategoryActionDialogs } from '../components/ProductCategoryActionDialogs'
import { ProductCategoryCardList } from '../components/ProductCategoryCardList'
import { getProductCategoryColumns } from '../components/productCategoryColumns'
import { ProductCategoryFormDialog, type ProductCategoryFormTarget } from '../components/ProductCategoryFormDialog'
import { ProductCategoryToolbar } from '../components/ProductCategoryToolbar'
import {
  DEFAULT_PRODUCT_CATEGORIES_PAGE_SIZE,
  DEFAULT_PRODUCT_CATEGORY_FILTERS,
  PRODUCT_CATEGORY_SHORTCUTS,
} from '../productCategories.constants'
import type {
  ProductCategory,
  ProductCategoriesQueryFilters,
  ProductCategoryAction,
  ProductCategoryFilterValues,
  ProductCategoryListView,
} from '../productCategories.types'
import { countActiveFilters } from '../productCategories.utils'
import { useGetProductCategoriesQuery } from '../productCategoriesApi'

/** Stable empty list: a new [] on every render would make the table reset itself in a loop. */
const NO_CATEGORIES: ProductCategory[] = []

const getRowId = (category: ProductCategory) => String(category.id)

export default function ProductCategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const view: ProductCategoryListView = searchParams.get('view') === 'archived' ? 'archived' : 'current'
  const isBelowTablet = useIsBelowTablet()
  const { byId: storesById } = useStoreLookup()

  // Applied search and filters: changing them is what triggers a request.
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ProductCategoryFilterValues>(DEFAULT_PRODUCT_CATEGORY_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PRODUCT_CATEGORIES_PAGE_SIZE)

  const [formTarget, setFormTarget] = useState<ProductCategoryFormTarget | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<ProductCategoryAction | null>(null)
  const [isActionOpen, setIsActionOpen] = useState(false)

  const queryFilters = useMemo<ProductCategoriesQueryFilters>(
    () => ({ view, search, ...filters }),
    [view, search, filters],
  )

  // The table (tablet and up) asks for one page at a time; phones use ProductCategoryCardList instead.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetProductCategoriesQuery(
    { ...queryFilters, page, perPage: pageSize },
    { skip: isBelowTablet },
  )

  // After archiving the last category on the last page, step back to a page that exists.
  if (data && data.lastPage >= 1 && page > data.lastPage) setPage(data.lastPage)

  // Only calls state setters, so one stable handler serves the table and the cards.
  const openForm = useCallback((target: ProductCategoryFormTarget) => {
    setFormTarget(target)
    setIsFormOpen(true)
  }, [])

  const handleAction = useCallback(
    (action: ProductCategoryAction) => {
      if (action.type === 'edit') {
        openForm({ mode: 'edit', categoryId: action.category.id })
        return
      }
      setPendingAction(action)
      setIsActionOpen(true)
    },
    [openForm],
  )

  // Shortcuts act on the list, so they pause while a dialog is open over it.
  const searchRef = useRef<HTMLInputElement>(null)
  const shortcutsEnabled = !isFormOpen && !isActionOpen
  useHotkey(PRODUCT_CATEGORY_SHORTCUTS.addCategory, () => openForm({ mode: 'create' }), { enabled: shortcutsEnabled })
  useHotkey(
    PRODUCT_CATEGORY_SHORTCUTS.search,
    () => {
      searchRef.current?.focus()
      searchRef.current?.select()
    },
    { enabled: shortcutsEnabled },
  )

  const columns = useMemo(
    () => getProductCategoryColumns({ view, storesById, onAction: handleAction }),
    [view, storesById, handleAction],
  )

  const applySearch = (next: string) => {
    setSearch(next)
    setPage(1)
  }

  const applyFilters = (next: ProductCategoryFilterValues) => {
    setFilters(next)
    setPage(1)
  }

  const clearAll = () => {
    setSearch('')
    applyFilters(DEFAULT_PRODUCT_CATEGORY_FILTERS)
  }

  const isFiltered = search !== '' || countActiveFilters(filters) > 0

  const addCategoryButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={() => openForm({ mode: 'create' })} aria-keyshortcuts={PRODUCT_CATEGORY_SHORTCUTS.addCategory}>
          <PlusIcon />
          Add category
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Add category <Kbd>{PRODUCT_CATEGORY_SHORTCUTS.addCategory}</Kbd>
      </TooltipContent>
    </Tooltip>
  )

  const emptyState = isFiltered ? (
    <DataTableEmptyState
      title="No categories match your search"
      description="Try a different search or store."
      action={
        <Button variant="destructive" onClick={clearAll}>
          Clear search and filters
        </Button>
      }
    />
  ) : view === 'archived' ? (
    <DataTableEmptyState title="No archived categories" description="Categories you archive will show up here." />
  ) : (
    <DataTableEmptyState
      title="No categories yet"
      description="Add a category to start grouping a store's products."
      action={addCategoryButton}
    />
  )

  return (
    <>
      <PageHeader
        title="Product categories"
        description="How each store's menu is grouped, e.g. Burgers, Drinks or Desserts."
        actions={addCategoryButton}
      />

      <Tabs
        // Tablet and up: fill the screen so the table can take the height that's left. Phones scroll the cards.
        className={isBelowTablet ? undefined : 'min-h-0 flex-1'}
        value={view}
        onValueChange={(next) => {
          setPage(1)
          setSearchParams(next === 'archived' ? { view: 'archived' } : {}, { replace: true })
        }}
      >
        <TabsList>
          <TabsTrigger value="current">Categories</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        <TabsContent value={view} className={cn('flex flex-col gap-4 pt-2', !isBelowTablet && 'min-h-0 flex-1')}>
          <ProductCategoryToolbar
            search={search}
            onSearch={applySearch}
            filters={filters}
            onFiltersChange={applyFilters}
            searchRef={searchRef}
          />

          {isBelowTablet ? (
            <ProductCategoryCardList
              filters={queryFilters}
              storesById={storesById}
              onAction={handleAction}
              emptyState={emptyState}
            />
          ) : isError ? (
            <ErrorState
              title="Couldn't load product categories"
              error={error}
              onRetry={refetch}
              className="rounded-xl border"
            />
          ) : (
            <DataTable
              columns={columns}
              data={data?.items ?? NO_CATEGORIES}
              isLoading={isLoading}
              isFetching={isFetching}
              loadingLabel="Loading product categories…"
              emptyState={emptyState}
              getRowId={getRowId}
              // Fills the rest of the screen; on very short screens the page scrolls instead.
              className="min-h-80 flex-1"
              pagination={{
                page,
                pageCount: data?.lastPage ?? 1,
                pageSize,
                total: data?.total ?? 0,
                onPageChange: setPage,
                onPageSizeChange: (size) => {
                  setPageSize(size)
                  setPage(1)
                },
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      <ProductCategoryFormDialog target={formTarget} open={isFormOpen} onOpenChange={setIsFormOpen} />
      <ProductCategoryActionDialogs action={pendingAction} open={isActionOpen} onOpenChange={setIsActionOpen} />
    </>
  )
}
