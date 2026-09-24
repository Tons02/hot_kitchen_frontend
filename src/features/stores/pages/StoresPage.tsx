import { PlusIcon } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { DataTable } from '@/components/common/data-table/DataTable'
import { DataTableEmptyState } from '@/components/common/data-table/DataTableEmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useHotkey } from '@/hooks/use-hotkey'
import { useIsBelowTablet } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { StoreActionDialogs } from '../components/StoreActionDialogs'
import { StoreCardList } from '../components/StoreCardList'
import { getStoreColumns } from '../components/storeColumns'
import { StoreDetailsDialog } from '../components/StoreDetailsDialog'
import { StoreFormDialog, type StoreFormTarget } from '../components/StoreFormDialog'
import { DEFAULT_STORES_PAGE_SIZE, STORE_SHORTCUTS } from '../stores.constants'
import type { Store, StoreAction, StoreListView, StoresQueryFilters } from '../stores.types'
import { useGetStorePageQuery } from '../storesApi'

/** Stable empty list: a new [] on every render would make the table reset itself in a loop. */
const NO_STORES: Store[] = []

const getRowId = (store: Store) => String(store.id)

export default function StoresPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const view: StoreListView = searchParams.get('view') === 'archived' ? 'archived' : 'current'
  const isBelowTablet = useIsBelowTablet()

  // The applied search: changing it is what triggers a request.
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_STORES_PAGE_SIZE)

  const [formTarget, setFormTarget] = useState<StoreFormTarget | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewedStore, setViewedStore] = useState<Store | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<StoreAction | null>(null)
  const [isActionOpen, setIsActionOpen] = useState(false)

  const queryFilters = useMemo<StoresQueryFilters>(() => ({ view, search }), [view, search])

  // The table (tablet and up) asks for one page at a time; phones use StoreCardList instead.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetStorePageQuery(
    { ...queryFilters, page, perPage: pageSize },
    { skip: isBelowTablet },
  )

  // After archiving the last store on the last page, step back to a page that exists.
  if (data && data.lastPage >= 1 && page > data.lastPage) setPage(data.lastPage)

  // Only calls state setters, so one stable handler serves the table, the cards and the dialogs.
  const openForm = useCallback((target: StoreFormTarget) => {
    setFormTarget(target)
    setIsFormOpen(true)
  }, [])

  const handleAction = useCallback(
    (action: StoreAction) => {
      if (action.type === 'view') {
        setViewedStore(action.store)
        setIsDetailsOpen(true)
        return
      }
      if (action.type === 'edit') {
        openForm({ mode: 'edit', storeId: action.store.id })
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
  useHotkey(STORE_SHORTCUTS.addStore, () => openForm({ mode: 'create' }), { enabled: shortcutsEnabled })
  useHotkey(
    STORE_SHORTCUTS.search,
    () => {
      searchRef.current?.focus()
      searchRef.current?.select()
    },
    { enabled: shortcutsEnabled },
  )

  const columns = useMemo(() => getStoreColumns({ view, onAction: handleAction }), [view, handleAction])

  const applySearch = (next: string) => {
    setSearch(next)
    setPage(1)
  }

  const addStoreButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={() => openForm({ mode: 'create' })} aria-keyshortcuts={STORE_SHORTCUTS.addStore}>
          <PlusIcon />
          Add store
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Add store <Kbd>{STORE_SHORTCUTS.addStore}</Kbd>
      </TooltipContent>
    </Tooltip>
  )

  const emptyState =
    search !== '' ? (
      <DataTableEmptyState
        title="No stores match your search"
        description="Try a different name, email or region."
        action={
          <Button variant="destructive" onClick={() => applySearch('')}>
            Clear search
          </Button>
        }
      />
    ) : view === 'archived' ? (
      <DataTableEmptyState title="No archived stores" description="Stores you archive will show up here." />
    ) : (
      <DataTableEmptyState title="No stores yet" description="Add your first branch to get started." action={addStoreButton} />
    )

  return (
    <>
      <PageHeader title="Stores" description="Branches, their storefront and where they deliver from." actions={addStoreButton} />

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
          <TabsTrigger value="current">Stores</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        <TabsContent value={view} className={cn('flex flex-col gap-4 pt-2', !isBelowTablet && 'min-h-0 flex-1')}>
          <SearchInput
            ref={searchRef}
            value={search}
            onSearch={applySearch}
            placeholder="Search name, email or region, then press Enter"
            label="Search stores"
            shortcut={STORE_SHORTCUTS.search}
            className="sm:max-w-md"
          />

          {isBelowTablet ? (
            <StoreCardList filters={queryFilters} onAction={handleAction} emptyState={emptyState} />
          ) : isError ? (
            <ErrorState title="Couldn't load stores" error={error} onRetry={refetch} className="rounded-xl border" />
          ) : (
            <DataTable
              columns={columns}
              data={data?.items ?? NO_STORES}
              isLoading={isLoading}
              isFetching={isFetching}
              loadingLabel="Loading storesâ€¦"
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

      <StoreDetailsDialog
        store={viewedStore}
        view={view}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onEdit={(store) => {
          setIsDetailsOpen(false)
          openForm({ mode: 'edit', storeId: store.id })
        }}
      />
      <StoreFormDialog target={formTarget} open={isFormOpen} onOpenChange={setIsFormOpen} />
      <StoreActionDialogs action={pendingAction} open={isActionOpen} onOpenChange={setIsActionOpen} />
    </>
  )
}
