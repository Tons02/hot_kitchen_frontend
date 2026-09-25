import { ArchiveIcon, ArchiveRestoreIcon, EllipsisIcon, PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ProductCategory, ProductCategoryAction, ProductCategoryListView } from '../productCategories.types'

interface ProductCategoryRowActionsProps {
  category: ProductCategory
  view: ProductCategoryListView
  onAction: (action: ProductCategoryAction) => void
}

/** Current categories can be edited and archived; archived ones only restored. */
export function ProductCategoryRowActions({ category, view, onAction }: ProductCategoryRowActionsProps) {
  return (
    // Non-modal so the dialogs it opens get focus cleanly once the menu closes.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${category.name}`}>
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {view === 'current' ? (
          <>
            <DropdownMenuItem onSelect={() => onAction({ type: 'edit', category })}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onAction({ type: 'archive', category })}>
              <ArchiveIcon />
              Archive
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onSelect={() => onAction({ type: 'restore', category })}>
            <ArchiveRestoreIcon />
            Restore
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
