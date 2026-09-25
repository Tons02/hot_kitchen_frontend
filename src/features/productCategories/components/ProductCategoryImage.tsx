import { ShapesIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { ProductCategory } from '../productCategories.types'

interface ProductCategoryImageProps {
  category: Pick<ProductCategory, 'image_url'>
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

/** The category's image as a rounded square, or an icon when it has none. */
export function ProductCategoryImage({ category, size, className }: ProductCategoryImageProps) {
  return (
    <Avatar size={size} className={cn('rounded-md after:rounded-md', className)}>
      {category.image_url && <AvatarImage src={category.image_url} alt="" className="rounded-md object-cover" />}
      <AvatarFallback className="rounded-md">
        <ShapesIcon className="size-1/2" aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  )
}
