import { ArchiveIcon, ArchiveRestoreIcon, EllipsisIcon, EyeIcon, PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Product, ProductAction, ProductListView } from '../products.types'

interface ProductRowActionsProps {
  product: Product
  view: ProductListView
  onAction: (action: ProductAction) => void
}

/** Current products can be viewed, edited and archived; archived ones viewed and restored. */
export function ProductRowActions({ product, view, onAction }: ProductRowActionsProps) {
  return (
    // Non-modal so the dialogs it opens get focus cleanly once the menu closes.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${product.name}`}>
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => onAction({ type: 'view', product })}>
          <EyeIcon />
          View
        </DropdownMenuItem>
        {view === 'current' ? (
          <>
            <DropdownMenuItem onSelect={() => onAction({ type: 'edit', product })}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onAction({ type: 'archive', product })}>
              <ArchiveIcon />
              Archive
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onSelect={() => onAction({ type: 'restore', product })}>
            <ArchiveRestoreIcon />
            Restore
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
