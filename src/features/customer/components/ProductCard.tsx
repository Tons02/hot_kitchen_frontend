import { UtensilsIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Product } from '@/features/products/products.types'
import { getProductCoverUrl, getProductPriceLabel } from '@/features/products/products.utils'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  /** The cart control, e.g. <ProductCartAction>. Omit for read-only listings. */
  action?: ReactNode
}

/**
 * A compact menu item: photo, name, a line of description, price and the cart control. Products with
 * variations show their price range, since the chosen variation's price replaces the base price.
 */
export function ProductCard({ product, action }: ProductCardProps) {
  const imageUrl = getProductCoverUrl(product)
  const isAvailable = product.is_available

  return (
    <Card className="group w-full gap-0 overflow-hidden rounded-2xl py-0 transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className={cn(
              'size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none',
              !isAvailable && 'opacity-60 grayscale',
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <UtensilsIcon className="size-10" aria-hidden="true" />
          </div>
        )}
        {/* Said in words, not only by the faded photo. */}
        {!isAvailable && (
          <Badge variant="secondary" className="absolute top-3 left-3 rounded-full">
            Unavailable
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <h3 className="line-clamp-1 font-heading text-sm leading-tight font-semibold sm:text-base">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-sm font-semibold tabular-nums sm:text-base">{getProductPriceLabel(product)}</span>
          {action}
        </div>
      </div>
    </Card>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden rounded-2xl py-0">
      <Skeleton className="aspect-square rounded-none" />
      <div className="flex flex-col gap-2 p-3 sm:p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-14 rounded-full" />
        </div>
      </div>
    </Card>
  )
}
