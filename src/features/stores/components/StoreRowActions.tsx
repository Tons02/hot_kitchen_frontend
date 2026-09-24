import { ArchiveIcon, ArchiveRestoreIcon, EllipsisIcon, EyeIcon, PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Store, StoreAction, StoreListView } from '../stores.types'

interface StoreRowActionsProps {
  store: Store
  view: StoreListView
  onAction: (action: StoreAction) => void
}

/** Current stores can be viewed, edited and archived; archived ones viewed and restored. */
export function StoreRowActions({ store, view, onAction }: StoreRowActionsProps) {
  return (
    // Non-modal so the dialogs it opens get focus cleanly once the menu closes.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${store.name}`}>
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => onAction({ type: 'view', store })}>
          <EyeIcon />
          View
        </DropdownMenuItem>
        {view === 'current' ? (
          <>
            <DropdownMenuItem onSelect={() => onAction({ type: 'edit', store })}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onAction({ type: 'archive', store })}>
              <ArchiveIcon />
              Archive
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onSelect={() => onAction({ type: 'restore', store })}>
            <ArchiveRestoreIcon />
            Restore
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
