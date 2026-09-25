import { ArrowDownIcon, ClockIcon, MapPinIcon, StoreIcon, TriangleAlertIcon, UtensilsIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Store } from '@/features/stores/stores.types'
import { cn } from '@/lib/utils'
import { getStoreCoverUrl, getStoreOpenStatus, scrollToSection } from '../../customer.utils'

interface StoreHeroProps {
  store: Store
  /** Products on the menu, when known. */
  productCount?: number
  /** The section "Start ordering" scrolls to. */
  menuSectionId: string
}

/** The storefront's first screen: cover photo, logo, name, whether it's open, and one clear action. */
export function StoreHero({ store, productCount, menuSectionId }: StoreHeroProps) {
  const coverUrl = getStoreCoverUrl(store)
  const status = getStoreOpenStatus(store)

  return (
    <div className="flex flex-col">
      <div className="relative aspect-[16/9] max-h-96 w-full overflow-hidden bg-secondary sm:aspect-[21/8] md:rounded-3xl">
        {coverUrl ? (
          <img src={coverUrl} alt={`${store.name} storefront`} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-secondary-foreground/40">
            <UtensilsIcon className="size-16" aria-hidden="true" />
          </div>
        )}
        {/* Softens the photo's bottom edge where the logo overlaps it. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/60 to-transparent"
        />
      </div>

      <div className="flex flex-col gap-5 px-4 sm:px-6 md:px-8">
        <div className="-mt-10 flex items-end gap-4 sm:-mt-14">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-card shadow-sm sm:size-28">
            {store.logo_url ? (
              <img src={store.logo_url} alt={`${store.name} logo`} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <StoreIcon className="size-8" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{store.name}</h1>
            <p className="text-lg text-muted-foreground">{store.title_banner}</p>
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-sm">
              <li className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-2 rounded-full',
                    status.state === 'open'
                      ? 'bg-success'
                      : status.state === 'closed'
                        ? 'bg-destructive'
                        : 'bg-muted-foreground',
                  )}
                />
                <span className="font-medium">
                  {status.state === 'open' ? 'Open now' : status.state === 'closed' ? 'Closed' : 'Hours unavailable'}
                </span>
              </li>
              <li className="flex items-center gap-1.5 text-muted-foreground">
                <ClockIcon className="size-4" aria-hidden="true" />
                {status.label}
              </li>
              <li className="flex items-center gap-1.5 text-muted-foreground">
                <MapPinIcon className="size-4" aria-hidden="true" />
                {store.city}, {store.province}
              </li>
              {productCount !== undefined && productCount > 0 && (
                <li className="flex items-center gap-1.5 text-muted-foreground">
                  <UtensilsIcon className="size-4" aria-hidden="true" />
                  {productCount.toLocaleString()} item{productCount === 1 ? '' : 's'}
                </li>
              )}
            </ul>
          </div>
          <Button
            size="lg"
            className="self-start rounded-full px-6 md:self-auto"
            onClick={() => scrollToSection(menuSectionId)}
          >
            Start ordering
            <ArrowDownIcon />
          </Button>
        </div>

        {!store.is_active && (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>Store currently unavailable</AlertTitle>
            <AlertDescription>
              You can browse the menu, but ordering is paused until the store is back.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

export function StoreHeroSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-[16/9] max-h-96 w-full rounded-none sm:aspect-[21/8] md:rounded-3xl" />
      <div className="flex flex-col gap-3 px-4 sm:px-6 md:px-8">
        <Skeleton className="-mt-10 size-20 rounded-2xl border-4 border-background sm:-mt-14 sm:size-28" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-80 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
    </div>
  )
}
