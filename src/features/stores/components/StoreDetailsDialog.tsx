import { ExternalLinkIcon, PencilIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ImagePreviewDialog, type ImagePreview } from '@/components/common/ImagePreviewDialog'
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose } from '@/components/ui/dialog'
import { FieldSeparator } from '@/components/ui/field'
import type { Store, StoreListView } from '../stores.types'
import { formatStoreTime, getStoreAddress, getStoreMapUrl, getStoreStatus } from '../stores.utils'
import { useGetStoreQuery } from '../storesApi'
import { StoreLogo } from './StoreLogo'
import { StoreStatusBadge } from './StoreStatusBadge'

interface StoreDetailsDialogProps {
  /** The row that was clicked. Kept after closing so the content doesn't blank out during the exit animation. */
  store: Store | null
  view: StoreListView
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Offered for current stores. Omit to hide the Edit button. */
  onEdit?: (store: Store) => void
}

/** Read-only view of one store. */
export function StoreDetailsDialog({ store, view, open, onOpenChange, onEdit }: StoreDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-3xl">
        {store && <StoreDetailsContent key={store.id} row={store} view={view} onEdit={onEdit} />}
      </ModalContent>
    </Dialog>
  )
}

function StoreDetailsContent({
  row,
  view,
  onEdit,
}: {
  row: Store
  view: StoreListView
  onEdit?: (store: Store) => void
}) {
  // The list row already has everything shown here, so it renders at once; current stores then
  // refresh from `GET /stores/{id}`. That endpoint can't find archived stores, so they keep the row.
  const { data } = useGetStoreQuery(row.id, { skip: view === 'archived', refetchOnMountOrArgChange: true })
  const store = data ?? row

  const [preview, setPreview] = useState<ImagePreview | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const showPreview = (image: ImagePreview) => {
    setPreview(image)
    setIsPreviewOpen(true)
  }

  const backgroundImages = store.background_images ?? []
  const operatingHours = store.operating_hours ?? []

  return (
    <>
      <ModalHeader title={store.name} description={store.code} />
      <ModalBody className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          {store.logo_url ? (
            <button
              type="button"
              className="rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              aria-label="View logo larger"
              onClick={() => store.logo_url && showPreview({ src: store.logo_url, title: `${store.name} logo` })}
            >
              <StoreLogo store={store} className="size-16" />
            </button>
          ) : (
            <StoreLogo store={store} className="size-16" />
          )}
          <StoreStatusBadge status={getStoreStatus(store, view)} />
        </div>

        <DetailsSection title="Storefront banner">
          <DetailRow label="Title">{store.title_banner}</DetailRow>
          <DetailRow label="Description">
            <span className="whitespace-pre-line">{store.description_banner}</span>
          </DetailRow>
          <DetailRow label="Background images">
            {backgroundImages.length === 0 ? (
              <span className="text-muted-foreground">None</span>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {backgroundImages.map((image, index) => (
                  <li key={image.id} className="overflow-hidden rounded-md border bg-muted">
                    <button
                      type="button"
                      className="block size-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset"
                      aria-label={`View background image ${index + 1} larger`}
                      onClick={() => showPreview({ src: image.image_url, title: `Background image ${index + 1}` })}
                    >
                      <img src={image.image_url} alt="" className="aspect-video size-full object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </DetailRow>
        </DetailsSection>

        <FieldSeparator />

        <DetailsSection title="Contact">
          <DetailRow label="Mobile number">
            <span className="tabular-nums">{store.mobile_number}</span>
          </DetailRow>
          <DetailRow label="Email">{store.email}</DetailRow>
        </DetailsSection>

        <FieldSeparator />

        <DetailsSection title="Address">
          <DetailRow label="Address">{getStoreAddress(store)}</DetailRow>
          <DetailRow label="Region">{store.region}</DetailRow>
          <DetailRow label="Postal code">{store.postal_code}</DetailRow>
          <DetailRow label="Map location">
            <a
              href={getStoreMapUrl(store)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary tabular-nums underline-offset-4 hover:underline"
            >
              {store.latitude}, {store.longitude}
              <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
            </a>
          </DetailRow>
        </DetailsSection>

        <FieldSeparator />

        <DetailsSection title="Operating hours">
          {operatingHours.length === 0 ? (
            <p className="text-sm text-muted-foreground">No operating hours set yet.</p>
          ) : (
            <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[8rem_1fr]">
              {operatingHours.map((hours) => (
                <div key={hours.id} className="contents">
                  <dt className="text-muted-foreground">{hours.day_name}</dt>
                  <dd className="tabular-nums">
                    {hours.is_closed
                      ? 'Closed'
                      : `${formatStoreTime(hours.open_time)} – ${formatStoreTime(hours.close_time)}`}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </DetailsSection>
      </ModalBody>

      <ModalFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Close
          </Button>
        </DialogClose>
        {onEdit && view === 'current' && (
          <Button type="button" className="ml-2" onClick={() => onEdit(store)}>
            <PencilIcon />
            Edit store
          </Button>
        )}
      </ModalFooter>

      <ImagePreviewDialog image={preview} open={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
    </>
  )
}

function DetailsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-heading text-base font-medium">{title}</h3>
      {children}
    </section>
  )
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 text-sm sm:grid-cols-[10rem_1fr] sm:gap-6">
      <span className="text-muted-foreground">{label}</span>
      <div className="min-w-0 break-words">{children}</div>
    </div>
  )
}
