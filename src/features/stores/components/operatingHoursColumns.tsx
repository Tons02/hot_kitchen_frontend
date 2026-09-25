import type { ColumnDef } from '@tanstack/react-table'
import { ClockIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Store } from '../stores.types'
import { OperatingHoursStatusBadge, OperatingHoursSummary } from './OperatingHoursSummary'
import { StoreLogo } from './StoreLogo'

interface OperatingHoursColumnsOptions {
  onEdit: (store: Store) => void
}

/** Columns for the operating hours table. Clicking a store's name opens its hours. */
export function getOperatingHoursColumns({ onEdit }: OperatingHoursColumnsOptions): ColumnDef<Store>[] {
  return [
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
                onClick={() => onEdit(store)}
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
      id: 'hours',
      header: 'Weekly hours',
      cell: ({ row }) => <OperatingHoursSummary hours={row.original.operating_hours} />,
    },
    {
      id: 'status',
      header: 'Schedule',
      cell: ({ row }) => <OperatingHoursStatusBadge hours={row.original.operating_hours} />,
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onEdit(row.original)}>
            <ClockIcon />
            Edit hours
          </Button>
        </div>
      ),
      meta: { className: 'w-32' },
    },
  ]
}
