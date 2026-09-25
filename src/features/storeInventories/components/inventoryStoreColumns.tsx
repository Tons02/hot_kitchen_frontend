import type { ColumnDef } from '@tanstack/react-table'
import type { Store } from '@/features/stores/stores.types'
import { cn } from '@/lib/utils'

/** A count from `GET /stores`, colored only when there's something to act on. */
const stockCount = (value: number | undefined, tone: 'warning' | 'destructive') => {
  if (value === undefined) return <span className="text-muted-foreground">—</span>
  return (
    <span className={cn('tabular-nums', value > 0 ? (tone === 'warning' ? 'text-warning' : 'text-destructive') : 'text-muted-foreground')}>
      {value.toLocaleString()}
    </span>
  )
}

/** The Store Inventory directory's extra columns: each store's stock counts (module-level, so stable). */
export const INVENTORY_STORE_COLUMNS: ColumnDef<Store>[] = [
  {
    id: 'products',
    header: 'Products',
    cell: ({ row }) => <span className="tabular-nums">{row.original.products_count?.toLocaleString() ?? '—'}</span>,
    meta: { className: 'hidden md:table-cell text-right' },
  },
  {
    id: 'low_stock',
    header: 'Low stock',
    cell: ({ row }) => stockCount(row.original.low_stock_count, 'warning'),
    meta: { className: 'text-right' },
  },
  {
    id: 'out_of_stock',
    header: 'Out of stock',
    cell: ({ row }) => stockCount(row.original.out_of_stock_count, 'destructive'),
    meta: { className: 'text-right' },
  },
]

/** The same counts as one line on the phone cards. */
export function renderInventoryStoreMeta(store: Store) {
  const low = store.low_stock_count ?? 0
  const out = store.out_of_stock_count ?? 0
  return (
    <span className="flex flex-wrap gap-x-3 text-xs">
      <span className="tabular-nums">{(store.products_count ?? 0).toLocaleString()} products</span>
      <span className={cn('tabular-nums', low > 0 ? 'text-warning' : 'text-muted-foreground')}>{low} low</span>
      <span className={cn('tabular-nums', out > 0 ? 'text-destructive' : 'text-muted-foreground')}>{out} out</span>
    </span>
  )
}
