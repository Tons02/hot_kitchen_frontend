import type { ColumnDef } from '@tanstack/react-table'
import type { Store, StoreAction, StoreListView } from '../stores.types'
import { getStoreStatus } from '../stores.utils'
import { StoreLogo } from './StoreLogo'
import { StoreRowActions } from './StoreRowActions'
import { StoreStatusBadge } from './StoreStatusBadge'

interface StoreColumnsOptions {
  view: StoreListView
  onAction: (action: StoreAction) => void
}

/** Columns for the stores table. Clicking a store's name opens its details. */
export function getStoreColumns({ view, onAction }: StoreColumnsOptions): ColumnDef<Store>[] {
  return [
    {
      id: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span>,
      meta: { className: 'hidden xl:table-cell' },
    },
    {
      id: 'name',
      header: 'Store',
      cell: ({ row }) => {
        const store = row.original
        return (
          <div className="flex min-w-48 items-center gap-3">
            <StoreLogo store={store} />
            <div className="grid min-w-0 justify-items-start leading-tight">
              <button
                type="button"
                className="max-w-full truncate rounded-sm font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                onClick={() => onAction({ type: 'view', store })}
              >
                {store.name}
              </button>
              <span className="max-w-full truncate text-xs text-muted-foreground">{store.code}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const store = row.original
        return (
          <div className="grid leading-tight">
            <span>{store.city}</span>
            <span className="text-xs text-muted-foreground">
              {store.province} · {store.region}
            </span>
          </div>
        )
      },
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      id: 'contact',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="grid leading-tight">
          <span className="tabular-nums">{row.original.mobile_number}</span>
          <span className="text-xs text-muted-foreground">{row.original.email}</span>
        </div>
      ),
      meta: { className: 'hidden xl:table-cell' },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StoreStatusBadge status={getStoreStatus(row.original, view)} />,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <StoreRowActions store={row.original} view={view} onAction={onAction} />
        </div>
      ),
      meta: { className: 'w-12' },
    },
  ]
}
