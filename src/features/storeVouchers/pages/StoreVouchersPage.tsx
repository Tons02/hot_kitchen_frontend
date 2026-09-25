import { ArrowLeftIcon } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { DataTable } from '@/components/common/data-table/DataTable'
import { DataTableEmptyState } from '@/components/common/data-table/DataTableEmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StoreCombobox } from '@/features/stores/components/StoreCombobox'
import { useOwnStoreId } from '@/features/stores/hooks/useOwnStoreId'
import { useGetStoreQuery } from '@/features/stores/storesApi'
import { useHotkey } from '@/hooks/use-hotkey'
import { useIsBelowTablet } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/paths'
import { VoucherActionDialogs } from '../components/VoucherActionDialogs'
import { getVoucherColumns } from '../components/voucherColumns'
import { VoucherDetailsSheet } from '../components/VoucherDetailsSheet'
import { VoucherFormDialog, type VoucherFormTarget } from '../components/VoucherFormDialog'
import { VoucherToolbar } from '../components/VoucherToolbar'
import { DEFAULT_VOUCHERS_PAGE_SIZE, VOUCHER_SHORTCUTS, VOUCHER_STATUS_TABS } from '../storeVouchers.constants'
import type { Voucher, VoucherAction, VoucherStatusFilter } from '../storeVouchers.types'
import { useGetStoreVouchersQuery } from '../storeVouchersApi'

/** Stable empty list: a new [] on every render would make the table reset itself in a loop. */
const NO_VOUCHERS: Voucher[] = []

const getRowId = (voucher: Voucher) => String(voucher.id)

/** Step two of Store Vouchers: one store's discount codes. Store-bound users can only open their own store. */
export default function StoreVouchersPage() {
  const params = useParams()
  const storeId = Number(params.storeId)
  const ownStoreId = useOwnStoreId()

  if (ownStoreId !== null && ownStoreId !== storeId) {
    return <Navigate to={ROUTES.storeVouchersDetail(ownStoreId)} replace />
  }
  if (!Number.isInteger(storeId) || storeId <= 0) return <Navigate to={ROUTES.storeVouchers} replace />

  // Keyed so switching stores starts with a fresh tab, search, filter and paging.
  return <StoreVouchersWorkspace key={storeId} storeId={storeId} canSwitchStore={ownStoreId === null} />
}

function StoreVouchersWorkspace({ storeId, canSwitchStore }: { storeId: number; canSwitchStore: boolean }) {
  const navigate = useNavigate()
  const isBelowTablet = useIsBelowTablet()
  const storeQuery = useGetStoreQuery(storeId)
  const store = storeQuery.data

  // Applied tab, search and filter: changing them is what triggers a request.
  const [status, setStatus] = useState<VoucherStatusFilter>('all')
  const [search, setSearch] = useState('')
  const [discountType, setDiscountType] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_VOUCHERS_PAGE_SIZE)

  const [formTarget, setFormTarget] = useState<VoucherFormTarget | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewed, setViewed] = useState<Voucher | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<VoucherAction | null>(null)
  const [isActionOpen, setIsActionOpen] = useState(false)

  const { data, isLoading, isFetching, isError, error, refetch } = useGetStoreVouchersQuery({
    storeId,
    status,
    search,
    discountType,
    page,
    perPage: pageSize,
  })

  if (data && data.lastPage >= 1 && page > data.lastPage) setPage(data.lastPage)

  const openForm = useCallback((target: VoucherFormTarget) => {
    setFormTarget(target)
    setIsFormOpen(true)
  }, [])

  const handleAction = useCallback(
    (action: VoucherAction) => {
      if (action.type === 'view') {
        setViewed(action.voucher)
        setIsDetailsOpen(true)
        return
      }
      if (action.type === 'edit') {
        openForm({ mode: 'edit', voucherId: action.voucher.id })
        return
      }
      setPendingAction(action)
      setIsActionOpen(true)
    },
    [openForm],
  )

  const columns = useMemo(() => getVoucherColumns({ onAction: handleAction }), [handleAction])

  // Shortcuts act on the list, so they pause while a dialog is open over it.
  const searchRef = useRef<HTMLInputElement>(null)
  const shortcutsEnabled = !isFormOpen && !isDetailsOpen && !isActionOpen
  useHotkey(VOUCHER_SHORTCUTS.addVoucher, () => openForm({ mode: 'create' }), { enabled: shortcutsEnabled })
  useHotkey(
    VOUCHER_SHORTCUTS.search,
    () => {
      searchRef.current?.focus()
      searchRef.current?.select()
    },
    { enabled: shortcutsEnabled },
  )

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const clearAll = () => {
    setSearch('')
    setDiscountType('all')
    setPage(1)
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
            <Link to={ROUTES.storeVouchers}>
              <ArrowLeftIcon />
              All stores
            </Link>
          </Button>
        )}
      </div>
    )
  }

  const isFiltered = search !== '' || discountType !== 'all'
  const emptyState = isFiltered ? (
    <DataTableEmptyState
      title="No vouchers found"
      description="Try changing your search or filters."
      action={
        <Button variant="destructive" onClick={clearAll}>
          Clear search and filters
        </Button>
      }
    />
  ) : status === 'all' ? (
    <DataTableEmptyState
      title="No vouchers yet"
      description="Create a discount code for this store's customers."
      action={<Button onClick={() => openForm({ mode: 'create' })}>Add voucher</Button>}
    />
  ) : (
    <DataTableEmptyState
      title={`No ${VOUCHER_STATUS_TABS.find((tab) => tab.value === status)?.label.toLowerCase()} vouchers`}
      description="Vouchers show up here when they reach this status."
    />
  )

  return (
    <>
      <PageHeader
        title={`${store.name} vouchers`}
        description={`${store.code} · Discount codes customers can use at this store.`}
        actions={
          canSwitchStore && (
            <div className="w-full sm:w-72">
              <StoreCombobox
                value={String(storeId)}
                onChange={(next) => navigate(ROUTES.storeVouchersDetail(next))}
                aria-label="Switch store"
              />
            </div>
          )
        }
      />

      {/* Tablet and up: fill the screen so the table can take the height that's left. Phones scroll the page. */}
      <div className={cn('flex flex-col gap-4', !isBelowTablet && 'min-h-0 flex-1')}>
        <Tabs value={status} onValueChange={(next) => resetPage(setStatus)(next as VoucherStatusFilter)}>
          {/* Scrolls sideways on phones rather than wrapping. */}
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList>
              {VOUCHER_STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        <VoucherToolbar
          search={search}
          onSearch={resetPage(setSearch)}
          discountType={discountType}
          onDiscountTypeChange={resetPage(setDiscountType)}
          onAdd={status === 'archived' ? undefined : () => openForm({ mode: 'create' })}
          searchRef={searchRef}
        />

        {isError ? (
          <ErrorState title="Couldn't load vouchers" error={error} onRetry={refetch} className="rounded-xl border" />
        ) : (
          <DataTable
            columns={columns}
            data={data?.items ?? NO_VOUCHERS}
            isLoading={isLoading}
            isFetching={isFetching}
            loadingLabel="Loading vouchers…"
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
              onPageSizeChange: resetPage(setPageSize),
            }}
          />
        )}
      </div>

      <VoucherFormDialog
        storeId={storeId}
        storeName={store.name}
        target={formTarget}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
      <VoucherDetailsSheet
        storeId={storeId}
        voucher={viewed}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onEdit={(voucher) => {
          setIsDetailsOpen(false)
          openForm({ mode: 'edit', voucherId: voucher.id })
        }}
      />
      <VoucherActionDialogs storeId={storeId} action={pendingAction} open={isActionOpen} onOpenChange={setIsActionOpen} />
    </>
  )
}
