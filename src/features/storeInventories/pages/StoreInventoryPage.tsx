import { ArrowLeftIcon } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { DataTable } from '@/components/common/data-table/DataTable'
import { DataTableEmptyState } from '@/components/common/data-table/DataTableEmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { StoreCombobox } from '@/features/stores/components/StoreCombobox'
import { useGetStoreQuery } from '@/features/stores/storesApi'
import { useHotkey } from '@/hooks/use-hotkey'
import { useIsBelowTablet } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/paths'
import { AddInventoryDialog } from '../components/AddInventoryDialog'
import { EditInventoryDialog, type EditInventoryTarget } from '../components/EditInventoryDialog'
import { InventoryDetailsSheet } from '../components/InventoryDetailsSheet'
import type { InventoryAction } from '../components/InventoryRowActions'
import { getInventoryColumns } from '../components/inventoryColumns'
import { StoreInventoryStats } from '../components/StoreInventoryStats'
import { StoreInventoryToolbar } from '../components/StoreInventoryToolbar'
import { useOwnStoreId } from '@/features/stores/hooks/useOwnStoreId'
import { DEFAULT_INVENTORY_PAGE_SIZE, INVENTORY_SHORTCUTS } from '../storeInventories.constants'
import type { InventoryStatusFilter, StoreInventory } from '../storeInventories.types'
import { useGetStoreInventoriesQuery, useGetStoreInventorySummaryQuery } from '../storeInventoriesApi'

/** Stable empty list: a new [] on every render would make the table reset itself in a loop. */
const NO_INVENTORY: StoreInventory[] = []

const getRowId = (inventory: StoreInventory) => String(inventory.id)

/** Step two of Store Inventory: one store's stock. Store-bound users can only open their own store. */
export default function StoreInventoryPage() {
  const params = useParams()
  const storeId = Number(params.storeId)
  const ownStoreId = useOwnStoreId()

  if (ownStoreId !== null && ownStoreId !== storeId) {
    return <Navigate to={ROUTES.storeInventoryDetail(ownStoreId)} replace />
  }
  if (!Number.isInteger(storeId) || storeId <= 0) return <Navigate to={ROUTES.storeInventory} replace />

  // Keyed so switching stores starts with fresh search, filters and paging.
  return <StoreInventoryWorkspace key={storeId} storeId={storeId} canSwitchStore={ownStoreId === null} />
}

function StoreInventoryWorkspace({ storeId, canSwitchStore }: { storeId: number; canSwitchStore: boolean }) {
  const navigate = useNavigate()
  const isBelowTablet = useIsBelowTablet()
  const storeQuery = useGetStoreQuery(storeId)
  const store = storeQuery.data

  // Applied search and filter: changing them is what triggers a request.
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<InventoryStatusFilter>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_INVENTORY_PAGE_SIZE)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EditInventoryTarget | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [viewed, setViewed] = useState<StoreInventory | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const summaryQuery = useGetStoreInventorySummaryQuery(storeId)
  const { data, isLoading, isFetching, isError, error, refetch } = useGetStoreInventoriesQuery({
    storeId,
    search,
    status,
    page,
    perPage: pageSize,
  })

  if (data && data.lastPage >= 1 && page > data.lastPage) setPage(data.lastPage)

  const openEdit = useCallback((inventory: StoreInventory) => {
    setEditTarget({ storeId: inventory.store_id, inventoryId: inventory.id })
    setIsEditOpen(true)
  }, [])

  const handleAction = useCallback(
    (action: InventoryAction) => {
      if (action.type === 'edit') {
        openEdit(action.inventory)
        return
      }
      setViewed(action.inventory)
      setIsDetailsOpen(true)
    },
    [openEdit],
  )

  const columns = useMemo(() => getInventoryColumns({ onAction: handleAction }), [handleAction])

  // Shortcuts act on the list, so they pause while a dialog is open over it.
  const searchRef = useRef<HTMLInputElement>(null)
  const shortcutsEnabled = !isAddOpen && !isEditOpen && !isDetailsOpen
  useHotkey(INVENTORY_SHORTCUTS.addProduct, () => setIsAddOpen(true), { enabled: shortcutsEnabled })
  useHotkey(
    INVENTORY_SHORTCUTS.search,
    () => {
      searchRef.current?.focus()
      searchRef.current?.select()
    },
    { enabled: shortcutsEnabled },
  )

  const applySearch = (next: string) => {
    setSearch(next)
    setPage(1)
  }

  const applyStatus = (next: InventoryStatusFilter) => {
    setStatus(next)
    setPage(1)
  }

  const clearAll = () => {
    setSearch('')
    applyStatus('all')
  }

  if (storeQuery.isLoading) return <LoadingState label="Loading store…" />

  if (storeQuery.isError || !store) {
    return (
      <div className="flex flex-col items-start gap-3">
        <ErrorState
          title="Couldn't open this store"
          error={storeQuery.error}
          onRetry={storeQuery.refetch}
          className="w-full rounded-xl border"
        />
        {canSwitchStore && (
          <Button variant="outline" asChild>
            <Link to={ROUTES.storeInventory}>
              <ArrowLeftIcon />
              All stores
            </Link>
          </Button>
        )}
      </div>
    )
  }

  const isFiltered = search !== '' || status !== 'all'
  const emptyState =
    summaryQuery.data?.total === 0 ? (
      <DataTableEmptyState
        title="No inventory yet"
        description="This store doesn't have any products assigned yet."
        action={<Button onClick={() => setIsAddOpen(true)}>Add product</Button>}
      />
    ) : (
      <DataTableEmptyState
        title="No products found"
        description="Try changing your search or filters."
        action={
          isFiltered && (
            <Button variant="destructive" onClick={clearAll}>
              Clear search and filters
            </Button>
          )
        }
      />
    )

  return (
    <>
      <PageHeader
        title={store.name}
        description={`${store.code} · ${store.city}, ${store.province}`}
        actions={
          canSwitchStore && (
            <div className="w-full sm:w-72">
              <StoreCombobox
                value={String(storeId)}
                onChange={(next) => navigate(ROUTES.storeInventoryDetail(next))}
                aria-label="Switch store"
              />
            </div>
          )
        }
      />

      {/* Tablet and up: fill the screen so the table can take the height that's left. Phones scroll the page. */}
      <div className={cn('flex flex-col gap-4', !isBelowTablet && 'min-h-0 flex-1')}>
        {summaryQuery.isError ? (
          <ErrorState
            title="Couldn't load the stock counts"
            error={summaryQuery.error}
            onRetry={summaryQuery.refetch}
            className="rounded-xl border py-6"
          />
        ) : (
          <StoreInventoryStats summary={summaryQuery.data ?? null} activeStatus={status} onStatusChange={applyStatus} />
        )}

        <StoreInventoryToolbar
          search={search}
          onSearch={applySearch}
          status={status}
          onStatusChange={applyStatus}
          onAdd={() => setIsAddOpen(true)}
          searchRef={searchRef}
        />

        {isError ? (
          <ErrorState title="Couldn't load this store's inventory" error={error} onRetry={refetch} className="rounded-xl border" />
        ) : (
          <DataTable
            columns={columns}
            data={data?.items ?? NO_INVENTORY}
            isLoading={isLoading}
            isFetching={isFetching}
            loadingLabel="Loading inventory…"
            emptyState={emptyState}
            getRowId={getRowId}
            // Fills the rest of the screen from tablet up; on very short screens the page scrolls instead.
            className={isBelowTablet ? undefined : 'min-h-80 flex-1'}
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
      </div>

      <AddInventoryDialog storeId={storeId} storeName={store.name} open={isAddOpen} onOpenChange={setIsAddOpen} />
      <EditInventoryDialog target={editTarget} open={isEditOpen} onOpenChange={setIsEditOpen} />
      <InventoryDetailsSheet
        inventory={viewed}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onEdit={(inventory) => {
          setIsDetailsOpen(false)
          openEdit(inventory)
        }}
      />
    </>
  )
}
