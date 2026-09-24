import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Store } from '../stores.types'
import { getStoreInitials } from '../stores.utils'

interface StoreLogoProps {
  store: Pick<Store, 'name' | 'logo_url'>
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

/** The store's logo, or its initials when it has none. Logos are public, so no token is needed. */
export function StoreLogo({ store, size, className }: StoreLogoProps) {
  return (
    <Avatar size={size} className={cn('rounded-md after:rounded-md', className)}>
      {store.logo_url && <AvatarImage src={store.logo_url} alt={`${store.name} logo`} className="rounded-md object-cover" />}
      <AvatarFallback className="rounded-md">{getStoreInitials(store.name)}</AvatarFallback>
    </Avatar>
  )
}
