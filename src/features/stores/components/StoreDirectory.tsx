import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { DataTable } from '@/components/common/data-table/DataTable'
import { DataTableEmptyState } from '@/components/common/data-table/DataTableEmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import { useHotkey } from '@/hooks/use-hotkey'
import { useIsBelowTablet } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { DEFAULT_STORES_PAGE_SIZE, STORE_SHORTCUTS } from '../stores.constants'
import type { Store, StoresQueryFilters } from '../stores.types'
import { useGetStorePageQuery } from '../storesApi'
import { getStoreDirectoryColumns } from './storeDirectoryColumns'
import { StoreDirectoryCardList } from './StoreDirectoryCardList'

interface StoreDirectoryProps {
  title: string
  description: string
  /** Where opening a store goes, e.g. its inventory or its vouchers. */
  getStoreHref: (storeId: number) => string
  /** The row button's label, e.g. "Open inventory". */
  openLabel: string
  /** Page-specific table columns, e.g. stock counts. Pass a stable (module-level) array. */
  extraColumns?: ColumnDef<Store>[]
  /** The same details for the phone cards. */
  renderCardMeta?: (store: Store) => ReactNode
  /** What the empty list says about adding stores, e.g. "then stock it here". */
  emptyDescription: string
}

/** Stable empty list: a new [] on every render would make the table reset itself in a loop. */
const NO_STORES: Store[] = []

const getRowId = (store: Store) => String(store.id)

/**
 * Step one of a per-store page (Store Inventory, Store Vouchers): find the store. A server-paged,
 * searchable list of current stores; a table from tablet up, tappable cards on phones.
 */
export function StoreDirectory({
  title,
  description,
  getStoreHref,
  openLabel,
  extraColumns,
  renderCardMeta,
  emptyDescription,
}: StoreDirectoryProps) {
  const isBelowTablet = useIsBelowTablet()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_STORES_PAGE_SIZE)

  // Archived stores don't sell, so only current ones are listed.
  const queryFilters = useMemo<StoresQueryFilters>(() => ({ view: 'current', search }), [search])

  // The table (tablet and up) asks for one page at a time; phones use the card list instead.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetStorePageQuery(
    { ...queryFilters, page, perPage: pageSize },
    { skip: isBelowTablet },
  )

  if (data && data.lastPage >= 1 && page > data.lastPage) setPage(data.lastPage)

  const columns = useMemo(
    () => getStoreDirectoryColumns({ getStoreHref, openLabel, extraColumns }),
    [getStoreHref, openLabel, extraColumns],
  )

  const searchRef = useRef<HTMLInputElement>(null)
  useHotkey(STORE_SHORTCUTS.search, () => {
    searchRef.current?.focus()
    searchRef.current?.select()
  })

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
      <DataTableEmptyState title="No stores yet" description={emptyDescription} />
    )

  return (
    <>
      <PageHeader title={title} description={description} />

      <div className={cn('flex flex-col gap-4', !isBelowTablet && 'min-h-0 flex-1')}>
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
          <StoreDirectoryCardList
            filters={queryFilters}
            getStoreHref={getStoreHref}
            renderMeta={renderCardMeta}
            emptyState={emptyState}
          />
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
    </>
  )
}
