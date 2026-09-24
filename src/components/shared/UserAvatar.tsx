import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/features/users/users.types'
import { getFullName, getInitials } from '@/features/users/users.utils'

type UserAvatarUser = Pick<User, 'first_name' | 'last_name' | 'suffix' | 'profile_picture_url'>

interface UserAvatarProps {
  user: UserAvatarUser
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

/** Falls back to initials when there's no picture or its signed URL has expired. */
export function UserAvatar({ user, size, className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      {user.profile_picture_url && <AvatarImage src={user.profile_picture_url} alt={getFullName(user)} />}
      <AvatarFallback>{getInitials(user)}</AvatarFallback>
    </Avatar>
  )
}
