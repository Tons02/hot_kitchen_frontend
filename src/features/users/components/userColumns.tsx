import type { ColumnDef } from '@tanstack/react-table'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { VEHICLE_TYPE_LABELS } from '../users.constants'
import type { User, UserAction, UserListView } from '../users.types'
import { getFullName, getRoleLabel, getUserStatus } from '../users.utils'
import { LicenseProofThumbnail } from './LicenseProofThumbnail'
import { UserRowActions } from './UserRowActions'
import { UserStatusBadge } from './UserStatusBadge'

interface UserColumnsOptions {
  view: UserListView
  /** The applied role filter ('all' for every role). Decides which role-specific columns show. */
  role: string
  currentUserId: number | undefined
  onAction: (action: UserAction) => void
}

const storeColumn: ColumnDef<User> = {
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
}

/** Shows a rider-profile value, or a muted dash when the rider has none. */
const riderValue = (value: string | null | undefined) =>
  value ? <span>{value}</span> : <span className="text-muted-foreground">—</span>

/** Vehicle and license columns, shown only while the list is filtered to delivery riders. */
const riderColumns: ColumnDef<User>[] = [
  {
    id: 'vehicle_type',
    header: 'Vehicle type',
    cell: ({ row }) => {
      const type = row.original.rider_profile?.vehicle_type
      return riderValue(type ? VEHICLE_TYPE_LABELS[type] : null)
    },
  },
  {
    id: 'vehicle_brand',
    header: 'Vehicle brand',
    cell: ({ row }) => riderValue(row.original.rider_profile?.vehicle_brand),
    meta: { className: 'hidden xl:table-cell' },
  },
  {
    id: 'plate_number',
    header: 'Plate number',
    cell: ({ row }) => riderValue(row.original.rider_profile?.plate_number),
  },
  {
    id: 'license_number',
    header: "Driver's license",
    cell: ({ row }) => riderValue(row.original.rider_profile?.license_number),
    meta: { className: 'hidden lg:table-cell' },
  },
  {
    id: 'proof_of_license',
    header: 'Proof of license',
    cell: ({ row }) => (
      <LicenseProofThumbnail
        url={row.original.rider_profile?.proof_of_license_url}
        riderName={getFullName(row.original)}
      />
    ),
  },
]

/**
 * Columns for the users table. Archived users are read-only, so they get no edit link or actions.
 * Admins have no store, so filtering to admins hides it; filtering to riders adds their vehicle and license.
 */
export function getUserColumns({ view, role, currentUserId, onAction }: UserColumnsOptions): ColumnDef<User>[] {
  const isCurrentView = view === 'current'
  const isRiderList = role === 'delivery_rider'

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
    ...(role === 'admin' ? [] : [storeColumn]),
    ...(isRiderList ? riderColumns : []),
    {
      id: 'mobile',
      header: 'Mobile',
      cell: ({ row }) => <span className="tabular-nums">{row.original.mobile_number}</span>,
      // Riders have more columns to fit, so their mobile number gives way first.
      meta: { className: isRiderList ? 'hidden 2xl:table-cell' : 'hidden xl:table-cell' },
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
