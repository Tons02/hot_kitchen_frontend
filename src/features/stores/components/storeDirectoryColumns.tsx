import type { ColumnDef } from '@tanstack/react-table'
import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import type { Store } from '../stores.types'
import { StoreLogo } from './StoreLogo'

export interface StoreDirectoryColumnsOptions {
  /** Where opening a store goes, e.g. its inventory or its vouchers. */
  getStoreHref: (storeId: number) => string
  /** The row button's label, e.g. "Open inventory". */
  openLabel: string
  /** Page-specific columns between Location and the button, e.g. stock counts. */
  extraColumns?: ColumnDef<Store>[]
}

/** Columns for a store picker: the store, its location, any extra columns, and a button to open it. */
export function getStoreDirectoryColumns({
  getStoreHref,
  openLabel,
  extraColumns = [],
}: StoreDirectoryColumnsOptions): ColumnDef<Store>[] {
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
              <Link
                to={getStoreHref(store.id)}
                className="max-w-full truncate rounded-sm font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {store.name}
              </Link>
              <span className="max-w-full truncate text-xs text-muted-foreground">{store.code}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => (
        <div className="grid leading-tight">
          <span>{row.original.city}</span>
          <span className="text-xs text-muted-foreground">{row.original.province}</span>
        </div>
      ),
      meta: { className: 'hidden lg:table-cell' },
    },
    ...extraColumns,
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to={getStoreHref(row.original.id)} aria-label={`${openLabel}: ${row.original.name}`}>
              {openLabel}
              <ChevronRightIcon />
            </Link>
          </Button>
        </div>
      ),
      meta: { className: 'w-40' },
    },
  ]
}
