import { UserPlusIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { DataTable } from '@/components/common/data-table/DataTable'
import { DataTableEmptyState } from '@/components/common/data-table/DataTableEmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { selectCurrentUser } from '@/features/auth/authSlice'
import { useIsBelowTablet } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { UserActionDialogs } from '../components/UserActionDialogs'
import { UserCardList } from '../components/UserCardList'
import { getUserColumns } from '../components/userColumns'
import { UserFormDialog, type UserFormTarget } from '../components/UserFormDialog'
import { UserToolbar } from '../components/UserToolbar'
import { DEFAULT_USER_FILTERS, DEFAULT_USERS_PAGE_SIZE } from '../users.constants'
import type { User, UserAction, UserFilterValues, UserListView, UsersQueryFilters } from '../users.types'
import { countActiveFilters } from '../users.utils'
import { useGetUsersQuery } from '../usersApi'

/** Stable empty list: a new [] on every render would make the table reset itself in a loop. */
const NO_USERS: User[] = []

const getRowId = (user: User) => String(user.id)

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const view: UserListView = searchParams.get('view') === 'archived' ? 'archived' : 'current'
  const isBelowTablet = useIsBelowTablet()

  // Applied search and filters: changing them is what triggers a request.
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<UserFilterValues>(DEFAULT_USER_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_USERS_PAGE_SIZE)

  const [formTarget, setFormTarget] = useState<UserFormTarget | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<UserAction | null>(null)
  const [isActionOpen, setIsActionOpen] = useState(false)
  const currentUserId = useAppSelector(selectCurrentUser)?.id

  const queryFilters = useMemo<UsersQueryFilters>(() => ({ view, search, ...filters }), [view, search, filters])

  // The table (tablet and up) asks for one page at a time; phones use UserCardList's infinite query instead.
  // Refetch on every visit: profile picture links are signed and expire after a few minutes.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetUsersQuery(
    { ...queryFilters, page, perPage: pageSize },
    { skip: isBelowTablet, refetchOnMountOrArgChange: true },
  )

  // After archiving the last user on the last page, step back to a page that exists.
  if (data && data.lastPage >= 1 && page > data.lastPage) setPage(data.lastPage)

  // Only calls state setters, so one stable handler serves the table and the cards.
  const openForm = useCallback((target: UserFormTarget) => {
    setFormTarget(target)
    setIsFormOpen(true)
  }, [])

  const handleAction = useCallback(
    (action: UserAction) => {
      if (action.type === 'edit') {
        openForm({ mode: 'edit', userId: action.user.id })
        return
      }
      setPendingAction(action)
      setIsActionOpen(true)
    },
    [openForm],
  )

  const columns = useMemo(
    () => getUserColumns({ view, currentUserId, onAction: handleAction }),
    [view, currentUserId, handleAction],
  )

  const applySearch = (next: string) => {
    setSearch(next)
    setPage(1)
  }

  const applyFilters = (next: UserFilterValues) => {
    setFilters(next)
    setPage(1)
  }

  const clearAll = () => {
    setSearch('')
    applyFilters(DEFAULT_USER_FILTERS)
  }

  const isFiltered = search !== '' || countActiveFilters(filters, view) > 0

  const addUserButton = (
    <Button onClick={() => openForm({ mode: 'create' })}>
      <UserPlusIcon />
      Add user
    </Button>
  )

  const emptyState = isFiltered ? (
    <DataTableEmptyState
      title="No users match your search"
      description="Try a different search or filters."
      action={
        <Button variant="destructive" onClick={clearAll}>
          Clear search and filters
        </Button>
      }
    />
  ) : view === 'archived' ? (
    <DataTableEmptyState title="No archived users" description="Users you archive will show up here." />
  ) : (
    <DataTableEmptyState
      title="No users yet"
      description="Add your first staff member to get started."
      action={addUserButton}
    />
  )

  return (
    <>
      <PageHeader
        title="Users"
        description="Staff accounts, their roles and the stores they work at."
        actions={addUserButton}
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
          <TabsTrigger value="current">Users</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        <TabsContent value={view} className={cn('flex flex-col gap-4 pt-2', !isBelowTablet && 'min-h-0 flex-1')}>
          <UserToolbar
            view={view}
            search={search}
            onSearch={applySearch}
            filters={filters}
            onFiltersChange={applyFilters}
          />

          {isBelowTablet ? (
            <UserCardList
              filters={queryFilters}
              currentUserId={currentUserId}
              onAction={handleAction}
              emptyState={emptyState}
            />
          ) : isError ? (
            <ErrorState title="Couldn't load users" error={error} onRetry={refetch} className="rounded-xl border" />
          ) : (
            <DataTable
              columns={columns}
              data={data?.items ?? NO_USERS}
              isLoading={isLoading}
              isFetching={isFetching}
              loadingLabel="Loading users…"
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

      <UserFormDialog target={formTarget} open={isFormOpen} onOpenChange={setIsFormOpen} />
      <UserActionDialogs action={pendingAction} open={isActionOpen} onOpenChange={setIsActionOpen} />
    </>
  )
}
