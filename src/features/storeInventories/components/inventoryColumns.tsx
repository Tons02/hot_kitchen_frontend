import type { ColumnDef } from '@tanstack/react-table'
import { ProductThumbnail } from '@/features/products/components/ProductThumbnail'
import { cn } from '@/lib/utils'
import type { StoreInventory } from '../storeInventories.types'
import { getAvailableQuantity, getInventorySku, getInventoryStatus } from '../storeInventories.utils'
import { InventoryRowActions, type InventoryAction } from './InventoryRowActions'
import { InventoryStatusBadge } from './InventoryStatusBadge'

interface InventoryColumnsOptions {
  onAction: (action: InventoryAction) => void
}

const numberCell = (value: number | null, className?: string) =>
  value === null ? (
    <span className="text-muted-foreground">—</span>
  ) : (
    <span className={cn('tabular-nums', className)}>{value.toLocaleString()}</span>
  )

/**
 * Columns for the inventory table. Phones keep Product, Available, Status and Actions; the rest
 * appear as the screen widens, and the details sheet shows everything.
 */
export function getInventoryColumns({ onAction }: InventoryColumnsOptions): ColumnDef<StoreInventory>[] {
  return [
    {
      id: 'product',
      header: 'Product',
      accessorFn: (inventory) => inventory.product?.name ?? '',
      cell: ({ row }) => {
        const inventory = row.original
        // The thumbnail and category show once the API loads them with the product.
        const product = inventory.product
        const category = product?.category?.name
        return (
          <div className="flex min-w-40 items-center gap-3">
            {product && <ProductThumbnail product={product} size="sm" />}
            <div className="grid min-w-0 justify-items-start leading-tight">
              <button
                type="button"
                className="max-w-full truncate rounded-sm text-left font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                onClick={() => onAction({ type: 'view', inventory })}
              >
                {inventory.product?.name ?? 'Unknown product'}
              </button>
              <span className="max-w-full truncate text-xs text-muted-foreground">
                {/* Phones hide the Variation column, so it shows here instead. */}
                <span className="sm:hidden">{inventory.variation ? `${inventory.variation.name} · ` : ''}</span>
                {category ?? 'No category'}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'sku',
      header: 'SKU',
      cell: ({ row }) => {
        const sku = getInventorySku(row.original)
        return sku ? <span className="font-mono text-xs">{sku}</span> : <span className="text-muted-foreground">—</span>
      },
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      id: 'variation',
      header: 'Variation',
      cell: ({ row }) => row.original.variation?.name ?? <span className="text-muted-foreground">—</span>,
      meta: { className: 'hidden sm:table-cell' },
    },
    {
      id: 'stock',
      header: 'Stock',
      accessorKey: 'stock_quantity',
      cell: ({ row }) => numberCell(row.original.stock_quantity),
      meta: { className: 'hidden md:table-cell text-right' },
    },
    {
      id: 'reserved',
      header: 'Reserved',
      accessorKey: 'reserved_quantity',
      cell: ({ row }) => numberCell(row.original.reserved_quantity, 'text-muted-foreground'),
      meta: { className: 'hidden md:table-cell text-right' },
    },
    {
      id: 'available',
      header: 'Available',
      accessorFn: getAvailableQuantity,
      cell: ({ row }) => numberCell(getAvailableQuantity(row.original), 'font-semibold'),
      meta: { className: 'text-right' },
    },
    {
      id: 'threshold',
      header: 'Threshold',
      accessorKey: 'low_stock_threshold',
      cell: ({ row }) => numberCell(row.original.low_stock_threshold, 'text-muted-foreground'),
      meta: { className: 'hidden xl:table-cell text-right' },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <InventoryStatusBadge status={getInventoryStatus(row.original)} />,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <InventoryRowActions inventory={row.original} onAction={onAction} />
        </div>
      ),
      meta: { className: 'w-12' },
    },
  ]
}
