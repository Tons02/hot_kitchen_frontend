import { useCallback, useMemo, useRef, useState } from 'react'
import { DataTable } from '@/components/common/data-table/DataTable'
import { DataTableEmptyState } from '@/components/common/data-table/DataTableEmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import { useHotkey } from '@/hooks/use-hotkey'
import { useIsBelowTablet } from '@/hooks/use-media-query'
import { OperatingHoursCardList } from '../components/OperatingHoursCardList'
import { OperatingHoursFormDialog } from '../components/OperatingHoursFormDialog'
import { getOperatingHoursColumns } from '../components/operatingHoursColumns'
import { DEFAULT_STORES_PAGE_SIZE, OPERATING_HOURS_SHORTCUTS } from '../stores.constants'
import type { Store, StoresQueryFilters } from '../stores.types'
import { useGetStorePageQuery } from '../storesApi'

/** Stable empty list: a new [] on every render would make the table reset itself in a loop. */
const NO_STORES: Store[] = []

const getRowId = (store: Store) => String(store.id)

/** Each current store's weekly schedule. `GET /stores` embeds the hours, so the list needs no extra calls. */
export default function StoreOperatingHoursPage() {
  const isBelowTablet = useIsBelowTablet()

  // The applied search: changing it is what triggers a request.
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_STORES_PAGE_SIZE)

  const [editedStore, setEditedStore] = useState<Store | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Archived stores don't take orders, so only current ones are listed.
  const queryFilters = useMemo<StoresQueryFilters>(() => ({ view: 'current', search }), [search])

  // The table (tablet and up) asks for one page at a time; phones use OperatingHoursCardList instead.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetStorePageQuery(
    { ...queryFilters, page, perPage: pageSize },
    { skip: isBelowTablet },
  )

  if (data && data.lastPage >= 1 && page > data.lastPage) setPage(data.lastPage)

  const openForm = useCallback((store: Store) => {
    setEditedStore(store)
    setIsFormOpen(true)
  }, [])

  const searchRef = useRef<HTMLInputElement>(null)
  useHotkey(
    OPERATING_HOURS_SHORTCUTS.search,
    () => {
      searchRef.current?.focus()
      searchRef.current?.select()
    },
    { enabled: !isFormOpen },
  )

  const columns = useMemo(() => getOperatingHoursColumns({ onEdit: openForm }), [openForm])

  const applySearch = (next: string) => {
    setSearch(next)
    setPage(1)
  }

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
    ) : (
      <DataTableEmptyState title="No stores yet" description="Add a store first, then set its operating hours here." />
    )

  return (
    <>
      <PageHeader title="Store operating hours" description="When each branch is open to take orders, day by day." />

      <div className={isBelowTablet ? 'flex flex-col gap-4' : 'flex min-h-0 flex-1 flex-col gap-4'}>
        <SearchInput
          ref={searchRef}
          value={search}
          onSearch={applySearch}
          placeholder="Search name, email or region, then press Enter"
          label="Search stores"
          shortcut={OPERATING_HOURS_SHORTCUTS.search}
          className="sm:max-w-md"
        />

        {isBelowTablet ? (
          <OperatingHoursCardList filters={queryFilters} onEdit={openForm} emptyState={emptyState} />
        ) : isError ? (
          <ErrorState title="Couldn't load stores" error={error} onRetry={refetch} className="rounded-xl border" />
        ) : (
          <DataTable
            columns={columns}
            data={data?.items ?? NO_STORES}
            isLoading={isLoading}
            isFetching={isFetching}
            loadingLabel="Loading stores…"
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
      </div>

      <OperatingHoursFormDialog store={editedStore} open={isFormOpen} onOpenChange={setIsFormOpen} />
    </>
  )
}
