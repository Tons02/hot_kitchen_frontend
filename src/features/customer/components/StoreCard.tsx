import { CheckIcon, MapPinIcon, StoreIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Store } from '@/features/stores/stores.types'
import { cn } from '@/lib/utils'
import { formatDistance, getStoreImageUrl, getStoreOpenStatus } from '../customer.utils'

interface StoreCardProps {
  store: Store
  isSelected?: boolean
  /** Straight-line distance, when the customer shared their location. */
  distanceKm?: number | null
  onSelect: (store: Store) => void
}

/** A store to order from: photo, name, area, whether it's open now, and one action. */
export function StoreCard({ store, isSelected = false, distanceKm, onSelect }: StoreCardProps) {
  const imageUrl = getStoreImageUrl(store)
  const status = getStoreOpenStatus(store)

  return (
    <Card
      className={cn(
        'group w-full gap-0 overflow-hidden rounded-2xl py-0 transition-shadow hover:shadow-md',
        isSelected && 'ring-2 ring-primary',
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${store.name} storefront`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <StoreIcon className="size-10" aria-hidden="true" />
          </div>
        )}
        {isSelected && (
          <Badge className="absolute top-3 left-3 gap-1 rounded-full">
            <CheckIcon aria-hidden="true" />
            Your store
          </Badge>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-heading text-base leading-tight font-semibold">{store.name}</h3>
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {store.city}, {store.province}
            {typeof distanceKm === 'number' && <span className="block text-xs">{formatDistance(distanceKm)}</span>}
          </span>
        </p>
        {/* The words carry the status; the dot only reinforces it. */}
        <p className="flex items-center gap-1.5 text-sm">
          <span
            aria-hidden="true"
            className={cn(
              'size-2 rounded-full',
              status.state === 'open' ? 'bg-success' : status.state === 'closed' ? 'bg-destructive' : 'bg-muted-foreground',
            )}
          />
          <span className={cn(status.state === 'open' ? 'font-medium' : 'text-muted-foreground')}>
            {status.state === 'open' ? 'Open' : status.state === 'closed' ? 'Closed' : 'Hours unavailable'}
          </span>
          <span className="text-muted-foreground">· {status.label}</span>
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full rounded-full"
          variant={isSelected ? 'secondary' : 'default'}
          onClick={() => onSelect(store)}
          aria-pressed={isSelected}
        >
          {isSelected ? 'Continue ordering' : 'Order here'}
        </Button>
      </CardFooter>
    </Card>
  )
}

export function StoreCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden rounded-2xl py-0">
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-2 h-9 w-full rounded-full" />
      </div>
    </Card>
  )
}
