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
import { ProductActionDialogs } from '../components/ProductActionDialogs'
import { ProductCardList } from '../components/ProductCardList'
import { getProductColumns } from '../components/productColumns'
import { ProductDetailsDialog } from '../components/ProductDetailsDialog'
import { ProductFormDialog, type ProductFormTarget } from '../components/ProductFormDialog'
import { ProductToolbar } from '../components/ProductToolbar'
import { DEFAULT_PRODUCT_FILTERS, DEFAULT_PRODUCTS_PAGE_SIZE, PRODUCT_SHORTCUTS } from '../products.constants'
import type { Product, ProductAction, ProductFilterValues, ProductListView, ProductsQueryFilters } from '../products.types'
import { countActiveFilters } from '../products.utils'
import { useGetProductsQuery } from '../productsApi'

/** Stable empty list: a new [] on every render would make the table reset itself in a loop. */
const NO_PRODUCTS: Product[] = []

const getRowId = (product: Product) => String(product.id)

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const view: ProductListView = searchParams.get('view') === 'archived' ? 'archived' : 'current'
  const isBelowTablet = useIsBelowTablet()
  const { byId: storesById } = useStoreLookup()

  // Applied search and filters: changing them is what triggers a request.
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ProductFilterValues>(DEFAULT_PRODUCT_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PRODUCTS_PAGE_SIZE)

  const [formTarget, setFormTarget] = useState<ProductFormTarget | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewedProduct, setViewedProduct] = useState<Product | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<ProductAction | null>(null)
  const [isActionOpen, setIsActionOpen] = useState(false)

  const queryFilters = useMemo<ProductsQueryFilters>(() => ({ view, search, ...filters }), [view, search, filters])

  // The table (tablet and up) asks for one page at a time; phones use ProductCardList instead.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetProductsQuery(
    { ...queryFilters, page, perPage: pageSize },
    { skip: isBelowTablet },
  )

  // After archiving the last product on the last page, step back to a page that exists.
  if (data && data.lastPage >= 1 && page > data.lastPage) setPage(data.lastPage)

  // Only calls state setters, so one stable handler serves the table, the cards and the dialogs.
  const openForm = useCallback((target: ProductFormTarget) => {
    setFormTarget(target)
    setIsFormOpen(true)
  }, [])

  const handleAction = useCallback(
    (action: ProductAction) => {
      if (action.type === 'view') {
        setViewedProduct(action.product)
        setIsDetailsOpen(true)
        return
      }
      if (action.type === 'edit') {
        openForm({ mode: 'edit', productId: action.product.id })
        return
      }
      setPendingAction(action)
      setIsActionOpen(true)
    },
    [openForm],
  )

  // Shortcuts act on the list, so they pause while a dialog is open over it.
  const searchRef = useRef<HTMLInputElement>(null)
  const shortcutsEnabled = !isFormOpen && !isDetailsOpen && !isActionOpen
  useHotkey(PRODUCT_SHORTCUTS.addProduct, () => openForm({ mode: 'create' }), { enabled: shortcutsEnabled })
  useHotkey(
    PRODUCT_SHORTCUTS.search,
    () => {
      searchRef.current?.focus()
      searchRef.current?.select()
    },
    { enabled: shortcutsEnabled },
  )

  const columns = useMemo(
    () => getProductColumns({ view, storesById, onAction: handleAction }),
    [view, storesById, handleAction],
  )

  const applySearch = (next: string) => {
    setSearch(next)
    setPage(1)
  }

  const applyFilters = (next: ProductFilterValues) => {
    setFilters(next)
    setPage(1)
  }

  const clearAll = () => {
    setSearch('')
    applyFilters(DEFAULT_PRODUCT_FILTERS)
  }

  const isFiltered = search !== '' || countActiveFilters(filters, view) > 0

  const addProductButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={() => openForm({ mode: 'create' })} aria-keyshortcuts={PRODUCT_SHORTCUTS.addProduct}>
          <PlusIcon />
          Add product
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Add product <Kbd>{PRODUCT_SHORTCUTS.addProduct}</Kbd>
      </TooltipContent>
    </Tooltip>
  )

  const emptyState = isFiltered ? (
    <DataTableEmptyState
      title="No products match your search"
      description="Try a different search or filters."
      action={
        <Button variant="destructive" onClick={clearAll}>
          Clear search and filters
        </Button>
      }
    />
  ) : view === 'archived' ? (
    <DataTableEmptyState title="No archived products" description="Products you archive will show up here." />
  ) : (
    <DataTableEmptyState title="No products yet" description="Add your first menu item to get started." action={addProductButton} />
  )

  return (
    <>
      <PageHeader title="Products" description="Each store's menu items, their prices, sizes and extras." actions={addProductButton} />

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
          <TabsTrigger value="current">Products</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        <TabsContent value={view} className={cn('flex flex-col gap-4 pt-2', !isBelowTablet && 'min-h-0 flex-1')}>
          <ProductToolbar
            view={view}
            search={search}
            onSearch={applySearch}
            filters={filters}
            onFiltersChange={applyFilters}
            searchRef={searchRef}
          />

          {isBelowTablet ? (
            <ProductCardList filters={queryFilters} storesById={storesById} onAction={handleAction} emptyState={emptyState} />
          ) : isError ? (
            <ErrorState title="Couldn't load products" error={error} onRetry={refetch} className="rounded-xl border" />
          ) : (
            <DataTable
              columns={columns}
              data={data?.items ?? NO_PRODUCTS}
              isLoading={isLoading}
              isFetching={isFetching}
              loadingLabel="Loading products…"
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

      <ProductDetailsDialog
        product={viewedProduct}
        view={view}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onEdit={(product) => {
          setIsDetailsOpen(false)
          openForm({ mode: 'edit', productId: product.id })
        }}
      />
      <ProductFormDialog target={formTarget} open={isFormOpen} onOpenChange={setIsFormOpen} />
      <ProductActionDialogs action={pendingAction} open={isActionOpen} onOpenChange={setIsActionOpen} />
    </>
  )
}
