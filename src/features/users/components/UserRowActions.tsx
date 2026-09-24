import { ArchiveIcon, EllipsisIcon, PencilIcon, UserCheckIcon, UserXIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User, UserAction } from '../users.types'
import { getFullName } from '../users.utils'

interface UserRowActionsProps {
  user: User
  /** The signed-in user can't deactivate or archive their own account. */
  isSelf: boolean
  onAction: (action: UserAction) => void
}

export function UserRowActions({ user, isSelf, onAction }: UserRowActionsProps) {
  return (
    // Non-modal so the confirm dialogs it opens get focus cleanly once the menu closes.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${getFullName(user)}`}>
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => onAction({ type: 'edit', user })}>
          <PencilIcon />
          Edit
        </DropdownMenuItem>
        {user.is_deactivated ? (
          <DropdownMenuItem onSelect={() => onAction({ type: 'activate', user })}>
            <UserCheckIcon />
            Reactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled={isSelf} onSelect={() => onAction({ type: 'deactivate', user })}>
            <UserXIcon />
            Deactivate
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isSelf}
          onSelect={() => onAction({ type: 'archive', user })}
        >
          <ArchiveIcon />
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
