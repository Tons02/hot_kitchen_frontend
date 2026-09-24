import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/features/users/users.types'
import { getFullName, getInitials } from '@/features/users/users.utils'
import { useAuthorizedFileUrl } from '@/hooks/use-authorized-file-url'

type UserAvatarUser = Pick<User, 'first_name' | 'last_name' | 'suffix' | 'profile_picture_url'>

interface UserAvatarProps {
  user: UserAvatarUser
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

/** Falls back to initials while the picture loads, or when there's none or its signed URL has expired. */
export function UserAvatar({ user, size, className }: UserAvatarProps) {
  // The picture route requires the Bearer token, which a plain <img src> can't send.
  const src = useAuthorizedFileUrl(user.profile_picture_url)

  return (
    <Avatar size={size} className={className}>
      {src && <AvatarImage src={src} alt={getFullName(user)} />}
      <AvatarFallback>{getInitials(user)}</AvatarFallback>
    </Avatar>
  )
}
