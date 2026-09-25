import type { ColumnDef } from '@tanstack/react-table'
import type { Store } from '@/features/stores/stores.types'
import type { ProductCategory, ProductCategoryAction, ProductCategoryListView } from '../productCategories.types'
import { getProductCategoryStatus } from '../productCategories.utils'
import { ProductCategoryImage } from './ProductCategoryImage'
import { ProductCategoryRowActions } from './ProductCategoryRowActions'
import { ProductCategoryStatusBadge } from './ProductCategoryStatusBadge'

interface ProductCategoryColumnsOptions {
  view: ProductCategoryListView
  /** Stores by id, for the Store column. The API only sends `store_id`. */
  storesById: ReadonlyMap<number, Store>
  onAction: (action: ProductCategoryAction) => void
}

/** Columns for the categories table. Archived categories are read-only apart from Restore. */
export function getProductCategoryColumns({
  view,
  storesById,
  onAction,
}: ProductCategoryColumnsOptions): ColumnDef<ProductCategory>[] {
  const isCurrentView = view === 'current'

  return [
    {
      id: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span>,
      meta: { className: 'hidden xl:table-cell' },
    },
    {
      id: 'name',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.original
        return (
          <div className="flex min-w-48 items-center gap-3">
            <ProductCategoryImage category={category} />
            <div className="grid min-w-0 justify-items-start leading-tight">
              {isCurrentView ? (
                <button
                  type="button"
                  className="max-w-full truncate rounded-sm font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  onClick={() => onAction({ type: 'edit', category })}
                >
                  {category.name}
                </button>
              ) : (
                <span className="max-w-full truncate font-medium">{category.name}</span>
              )}
              <span className="max-w-80 truncate text-xs text-muted-foreground">
                {category.description || 'No description'}
              </span>
            </div>
          </div>
        )
      },
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
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      id: 'status',
      header: 'Status',
      cell: () => <ProductCategoryStatusBadge status={getProductCategoryStatus(view)} />,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ProductCategoryRowActions category={row.original} view={view} onAction={onAction} />
        </div>
      ),
      meta: { className: 'w-12' },
    },
  ]
}
