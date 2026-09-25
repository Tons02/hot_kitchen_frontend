import type { ColumnDef } from '@tanstack/react-table'
import { StarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Store } from '@/features/stores/stores.types'
import { formatPeso } from '@/lib/money'
import type { Product, ProductAction, ProductListView } from '../products.types'
import { formatPreparationTime, getProductPriceLabel, getProductStatus } from '../products.utils'
import { ProductRowActions } from './ProductRowActions'
import { ProductStatusBadge } from './ProductStatusBadge'
import { ProductThumbnail } from './ProductThumbnail'

interface ProductColumnsOptions {
  view: ProductListView
  /** Stores by id, for the Store column. The API only sends `store_id`. */
  storesById: ReadonlyMap<number, Store>
  onAction: (action: ProductAction) => void
}

/** Columns for the products table. Clicking a product's name opens its details. */
export function getProductColumns({ view, storesById, onAction }: ProductColumnsOptions): ColumnDef<Product>[] {
  return [
    {
      id: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span>,
      meta: { className: 'hidden 2xl:table-cell' },
    },
    {
      id: 'name',
      header: 'Product',
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex min-w-48 items-center gap-3">
            <ProductThumbnail product={product} />
            <div className="grid min-w-0 justify-items-start leading-tight">
              <span className="flex max-w-full items-center gap-1.5">
                <button
                  type="button"
                  className="truncate rounded-sm font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  onClick={() => onAction({ type: 'view', product })}
                >
                  {product.name}
                </button>
                {product.is_featured && (
                  <StarIcon className="size-3.5 shrink-0 fill-warning text-warning" aria-label="Featured" />
                )}
              </span>
              <span className="max-w-full truncate text-xs text-muted-foreground">
                {product.sku ? `SKU ${product.sku}` : 'No SKU'}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) =>
        row.original.category ? (
          <Badge variant="secondary">{row.original.category.name}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'store',
      header: 'Store',
      cell: ({ row }) => {
        const store = storesById.get(row.original.store_id)
        if (!store) return <span className="text-muted-foreground tabular-nums">Store #{row.original.store_id}</span>
        return (
          <div className="grid leading-tight">
            <span>{store.name}</span>
            <span className="text-xs text-muted-foreground">{store.code}</span>
          </div>
        )
      },
      meta: { className: 'hidden xl:table-cell' },
    },
    {
      id: 'price',
      header: 'Price',
      cell: ({ row }) => {
        const variationCount = row.original.variations?.length ?? 0
        return (
          <div className="grid leading-tight">
            <span className="tabular-nums">{getProductPriceLabel(row.original)}</span>
            {variationCount > 0 && (
              <span className="text-xs text-muted-foreground">
                By variation ({variationCount}) · base {formatPeso(row.original.base_price)}
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: 'preparation_time',
      header: 'Prep time',
      cell: ({ row }) => <span className="tabular-nums">{formatPreparationTime(row.original.preparation_time)}</span>,
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <ProductStatusBadge status={getProductStatus(row.original, view)} />,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ProductRowActions product={row.original} view={view} onAction={onAction} />
        </div>
      ),
      meta: { className: 'w-12' },
    },
  ]
}
