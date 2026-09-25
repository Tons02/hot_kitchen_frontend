import { UtensilsIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Product } from '../products.types'
import { getProductCoverUrl } from '../products.utils'

interface ProductThumbnailProps {
  product: Pick<Product, 'images'>
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

/** The product's first photo as a rounded square, or an icon when it has none. */
export function ProductThumbnail({ product, size, className }: ProductThumbnailProps) {
  const src = getProductCoverUrl(product)

  return (
    <Avatar size={size} className={cn('rounded-md after:rounded-md', className)}>
      {src && <AvatarImage src={src} alt="" className="rounded-md object-cover" />}
      <AvatarFallback className="rounded-md">
        <UtensilsIcon className="size-1/2" aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  )
}
