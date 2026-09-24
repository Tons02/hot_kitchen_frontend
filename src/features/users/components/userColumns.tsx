import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router'
import { DataTableColumnHeader } from '@/components/common/data-table/DataTableColumnHeader'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/routes/paths'
import type { User, UserAction, UserListView } from '../users.types'
import { getFullName, getRoleLabel, getUserStatus } from '../users.utils'
import { UserRowActions } from './UserRowActions'
import { UserStatusBadge } from './UserStatusBadge'

interface UserColumnsOptions {
  view: UserListView
  currentUserId: number | undefined
  onAction: (action: UserAction) => void
}

/** Columns for the users table. Archived users are read-only, so they get no links or actions. */
export function getUserColumns({ view, currentUserId, onAction }: UserColumnsOptions): ColumnDef<User>[] {
  const isCurrentView = view === 'current'

  const columns: ColumnDef<User>[] = [
    {
      id: 'name',
      accessorFn: (user) => getFullName(user),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const user = row.original
        const name = getFullName(user)
        return (
          <div className="flex min-w-48 items-center gap-3">
            <UserAvatar user={user} />
            <div className="grid min-w-0 leading-tight">
              {isCurrentView ? (
                <Link to={ROUTES.userEdit(user.id)} className="truncate font-medium hover:underline">
                  {name}
                </Link>
              ) : (
                <span className="truncate font-medium">{name}</span>
              )}
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'role',
      accessorFn: (user) => getRoleLabel(user.role),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ getValue }) => <Badge variant="secondary">{getValue<string>()}</Badge>,
      meta: { className: 'hidden sm:table-cell' },
    },
    {
      id: 'store',
      accessorFn: (user) => user.store?.name ?? '',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Store" />,
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
      accessorKey: 'mobile_number',
      header: 'Mobile',
      enableSorting: false,
      cell: ({ getValue }) => <span className="tabular-nums">{getValue<string>()}</span>,
      meta: { className: 'hidden md:table-cell' },
    },
    {
      id: 'status',
      accessorFn: (user) => getUserStatus(user, view),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <UserStatusBadge status={getUserStatus(row.original, view)} />,
    },
  ]

  if (isCurrentView) {
    columns.push({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
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
