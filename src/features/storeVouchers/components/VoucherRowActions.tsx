import { ArchiveIcon, ArchiveRestoreIcon, EllipsisIcon, EyeIcon, PencilIcon, PowerIcon, PowerOffIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Voucher, VoucherAction } from '../storeVouchers.types'

interface VoucherRowActionsProps {
  voucher: Voucher
  onAction: (action: VoucherAction) => void
}

/** Current vouchers can be viewed, edited, enabled/disabled and archived; archived ones viewed and restored. */
export function VoucherRowActions({ voucher, onAction }: VoucherRowActionsProps) {
  const isArchived = voucher.status === 'archived'

  return (
    // Non-modal so the dialogs it opens get focus cleanly once the menu closes.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for voucher ${voucher.code}`}>
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => onAction({ type: 'view', voucher })}>
          <EyeIcon />
          View details
        </DropdownMenuItem>
        {isArchived ? (
          <DropdownMenuItem onSelect={() => onAction({ type: 'restore', voucher })}>
            <ArchiveRestoreIcon />
            Restore
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem onSelect={() => onAction({ type: 'edit', voucher })}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction({ type: 'toggle', voucher })}>
              {voucher.is_active ? <PowerOffIcon /> : <PowerIcon />}
              {voucher.is_active ? 'Disable' : 'Enable'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onAction({ type: 'archive', voucher })}>
              <ArchiveIcon />
              Archive
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
