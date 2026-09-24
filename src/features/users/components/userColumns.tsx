import type { ColumnDef } from '@tanstack/react-table'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Badge } from '@/components/ui/badge'
import type { User, UserAction, UserListView } from '../users.types'
import { getFullName, getRoleLabel, getUserStatus } from '../users.utils'
import { UserRowActions } from './UserRowActions'
import { UserStatusBadge } from './UserStatusBadge'

interface UserColumnsOptions {
  view: UserListView
  currentUserId: number | undefined
  onAction: (action: UserAction) => void
}

/** Columns for the users table. Archived users are read-only, so they get no edit link or actions. */
export function getUserColumns({ view, currentUserId, onAction }: UserColumnsOptions): ColumnDef<User>[] {
  const isCurrentView = view === 'current'

  const columns: ColumnDef<User>[] = [
    {
      id: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span>,
      meta: { className: 'hidden xl:table-cell' },
    },
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const user = row.original
        const name = getFullName(user)
        return (
          <div className="flex min-w-48 items-center gap-3">
            <UserAvatar user={user} />
            <div className="grid min-w-0 justify-items-start leading-tight">
              {isCurrentView ? (
                <button
                  type="button"
                  className="max-w-full truncate rounded-sm font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  onClick={() => onAction({ type: 'edit', user })}
                >
                  {name}
                </button>
              ) : (
                <span className="truncate font-medium">{name}</span>
              )}
              <span className="max-w-full truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'role',
      header: 'Role',
      cell: ({ row }) => <Badge variant="secondary">{getRoleLabel(row.original.role)}</Badge>,
    },
    {
      id: 'store',
      header: 'Store',
      cell: ({ row }) => {
        const { store } = row.original
        if (!store) return <span className="text-muted-foreground">All stores</span>
        return (
          <div className="grid leading-tight">
            <span>{store.name}</span>
            <span className="text-xs text-muted-foreground">{store.code}</span>
          </div>
        )
      },
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      id: 'mobile',
      header: 'Mobile',
      cell: ({ row }) => <span className="tabular-nums">{row.original.mobile_number}</span>,
      meta: { className: 'hidden xl:table-cell' },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <UserStatusBadge status={getUserStatus(row.original, view)} />,
    },
  ]

  if (isCurrentView) {
    columns.push({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <UserRowActions user={row.original} isSelf={row.original.id === currentUserId} onAction={onAction} />
        </div>
      ),
      meta: { className: 'w-12' },
    })
  }

  return columns
}
