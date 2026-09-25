import { EllipsisIcon, EyeIcon, PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { StoreInventory } from '../storeInventories.types'
import { getInventoryName } from '../storeInventories.utils'

export interface InventoryAction {
  type: 'view' | 'edit'
  inventory: StoreInventory
}

interface InventoryRowActionsProps {
  inventory: StoreInventory
  onAction: (action: InventoryAction) => void
}

export function InventoryRowActions({ inventory, onAction }: InventoryRowActionsProps) {
  return (
    // Non-modal so the dialogs it opens get focus cleanly once the menu closes.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${getInventoryName(inventory)}`}>
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => onAction({ type: 'view', inventory })}>
          <EyeIcon />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction({ type: 'edit', inventory })}>
          <PencilIcon />
          Edit inventory
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
