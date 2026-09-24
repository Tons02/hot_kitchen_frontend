import { UserPlusIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { DataTable } from '@/components/common/data-table/DataTable'
import { DataTableEmptyState } from '@/components/common/data-table/DataTableEmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { selectCurrentUser } from '@/features/auth/authSlice'
import { ROUTES } from '@/routes/paths'
import { UserActionDialogs } from '../components/UserActionDialogs'
import { getUserColumns } from '../components/userColumns'
import { UserFilters } from '../components/UserFilters'
import { DEFAULT_USER_FILTERS } from '../users.constants'
import type { User, UserAction, UserListView } from '../users.types'
import { filterUsers } from '../users.utils'
import { useGetUsersQuery } from '../usersApi'

/** Stable empty list: a new [] on every render would make the table reset itself in a loop. */
const NO_USERS: User[] = []

const getRowId = (user: User) => String(user.id)

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const view: UserListView = searchParams.get('view') === 'archived' ? 'archived' : 'current'

  const [filters, setFilters] = useState(DEFAULT_USER_FILTERS)
  const [pendingAction, setPendingAction] = useState<UserAction | null>(null)
  const [isActionOpen, setIsActionOpen] = useState(false)
  const currentUserId = useAppSelector(selectCurrentUser)?.id

  // Refetch on every visit: profile picture links are signed and expire after a few minutes.
  const { data, isLoading, isError, error, refetch } = useGetUsersQuery(view, { refetchOnMountOrArgChange: true })
  const users = data ?? NO_USERS
  const visibleUsers = useMemo(() => filterUsers(users, filters, view), [users, filters, view])

  const columns = useMemo(
    () =>
      getUserColumns({
        view,
        currentUserId,
        onAction: (action) => {
          setPendingAction(action)
          setIsActionOpen(true)
        },
      }),
    [view, currentUserId],
  )

  const addUserButton = (
    <Button asChild>
      <Link to={ROUTES.userCreate}>
        <UserPlusIcon />
        Add user
      </Link>
    </Button>
  )

  const emptyState =
    users.length > 0 ? (
      <DataTableEmptyState
        title="No users match your filters"
        description="Try a different search, or clear the filters."
        action={
          <Button variant="outline" onClick={() => setFilters(DEFAULT_USER_FILTERS)}>
            Clear filters
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
        value={view}
        onValueChange={(next) => setSearchParams(next === 'archived' ? { view: 'archived' } : {}, { replace: true })}
      >
        <TabsList>
          <TabsTrigger value="current">Users</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        <TabsContent value={view} className="flex flex-col gap-4 pt-2">
          <UserFilters value={filters} onChange={setFilters} view={view} />
          {isError ? (
            <ErrorState title="Couldn't load users" error={error} onRetry={refetch} className="rounded-xl border" />
          ) : (
            <DataTable
              columns={columns}
              data={visibleUsers}
              isLoading={isLoading}
              loadingLabel="Loading users…"
              emptyState={emptyState}
              getRowId={getRowId}
            />
          )}
        </TabsContent>
      </Tabs>

      <UserActionDialogs action={pendingAction} open={isActionOpen} onOpenChange={setIsActionOpen} />
    </>
  )
}
