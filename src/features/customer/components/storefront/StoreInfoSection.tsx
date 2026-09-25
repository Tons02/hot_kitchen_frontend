import { ClockIcon, ExternalLinkIcon, MailIcon, MapPinIcon, PhoneIcon, TruckIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { OperatingHoursSummary } from '@/features/stores/components/OperatingHoursSummary'
import type { Store } from '@/features/stores/stores.types'
import { getStoreAddress, getStoreMapUrl } from '@/features/stores/stores.utils'
import { formatPeso } from '@/lib/money'

/** "Delivery up to 8 km · ₱39.00 – ₱89.00", from the store's distance tiers. */
function describeDelivery(store: Store): string | null {
  const tiers = store.delivery_radius ?? []
  if (tiers.length === 0) return null
  const maxKm = Math.max(...tiers.map((tier) => Number(tier.end_km)))
  const fees = tiers.map((tier) => Number(tier.fee))
  const low = Math.min(...fees)
  const high = Math.max(...fees)
  const feeText = low === high ? formatPeso(low) : `${formatPeso(low)} – ${formatPeso(high)}`
  return `Up to ${maxKm} km · ${low === 0 && high === 0 ? 'Free' : feeText}`
}

/** Where the store is, when it's open, how to reach it, and how far it delivers. Compact, with a map. */
export function StoreInfoSection({ store, sectionId }: { store: Store; sectionId: string }) {
  const delivery = describeDelivery(store)
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(`${store.latitude},${store.longitude}`)}&z=16&output=embed`

  return (
    <section id={sectionId} aria-labelledby={`${sectionId}-heading`} className="flex scroll-mt-32 flex-col gap-4">
      <h2 id={`${sectionId}-heading`} className="font-heading text-2xl font-semibold tracking-tight">
        Store information
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="gap-4 rounded-2xl p-5">
          <InfoRow icon={<MapPinIcon />} label="Address">
            {getStoreAddress(store)}
            {store.postal_code && ` ${store.postal_code}`}
          </InfoRow>
          <Separator />
          <InfoRow icon={<ClockIcon />} label="Opening hours">
            <OperatingHoursSummary hours={store.operating_hours} />
          </InfoRow>
          <Separator />
          <InfoRow icon={<PhoneIcon />} label="Contact">
            <a href={`tel:${store.mobile_number}`} className="tabular-nums underline-offset-4 hover:underline">
              {store.mobile_number}
            </a>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MailIcon className="size-3.5" aria-hidden="true" />
              <a href={`mailto:${store.email}`} className="underline-offset-4 hover:underline">
                {store.email}
              </a>
            </span>
          </InfoRow>
          {delivery && (
            <>
              <Separator />
              <InfoRow icon={<TruckIcon />} label="Delivery">
                {delivery}
              </InfoRow>
            </>
          )}
        </Card>

        <div className="flex flex-col gap-2">
          <div className="aspect-video overflow-hidden rounded-2xl border bg-muted md:aspect-auto md:flex-1">
            <iframe
              title={`Map showing ${store.name}`}
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="size-full min-h-56 border-0"
            />
          </div>
          <a
            href={getStoreMapUrl(store)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 self-start rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Open in Google Maps
            <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="mt-0.5 text-primary [&_svg]:size-4" aria-hidden="true">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-medium">{label}</span>
        <div className="flex flex-col gap-0.5 text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}
