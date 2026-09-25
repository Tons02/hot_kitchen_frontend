import { PencilIcon, StarIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ImagePreviewDialog, type ImagePreview } from '@/components/common/ImagePreviewDialog'
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose } from '@/components/ui/dialog'
import { FieldSeparator } from '@/components/ui/field'
import { useStoreLookup } from '@/features/stores/hooks/useStoreLookup'
import { formatPeso } from '@/lib/money'
import type { Product, ProductListView } from '../products.types'
import { formatPreparationTime, formatPriceDifference, getProductPriceLabel, getProductStatus } from '../products.utils'
import { useGetProductQuery } from '../productsApi'
import { ProductStatusBadge } from './ProductStatusBadge'

interface ProductDetailsDialogProps {
  /** The row that was clicked. Kept after closing so the content doesn't blank out during the exit animation. */
  product: Product | null
  view: ProductListView
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Offered for current products. Omit to hide the Edit button. */
  onEdit?: (product: Product) => void
}

/** Read-only view of one product, including its variations and add-ons. */
export function ProductDetailsDialog({ product, view, open, onOpenChange, onEdit }: ProductDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-2xl">
        {product && <ProductDetailsContent key={product.id} row={product} view={view} onEdit={onEdit} />}
      </ModalContent>
    </Dialog>
  )
}

function ProductDetailsContent({
  row,
  view,
  onEdit,
}: {
  row: Product
  view: ProductListView
  onEdit?: (product: Product) => void
}) {
  // The list row already has everything shown here, so it renders at once; current products then
  // refresh from `GET /products/{id}`. That endpoint can't find archived products, so they keep the row.
  const { data } = useGetProductQuery(row.id, { skip: view === 'archived', refetchOnMountOrArgChange: true })
  const product = data ?? row
  const { byId: storesById } = useStoreLookup()
  const store = storesById.get(product.store_id)

  const [preview, setPreview] = useState<ImagePreview | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const images = [...(product.images ?? [])].sort((a, b) => a.layer - b.layer)
  const variations = product.variations ?? []
  const addOns = product.add_ons ?? []

  return (
    <>
      <ModalHeader title={product.name} description={product.sku ? `SKU ${product.sku}` : undefined} />
      <ModalBody className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <ProductStatusBadge status={getProductStatus(product, view)} />
          {product.is_featured && (
            <Badge variant="outline" className="gap-1">
              <StarIcon className="size-3 fill-warning text-warning" aria-hidden="true" />
              Featured
            </Badge>
          )}
          {product.category && <Badge variant="secondary">{product.category.name}</Badge>}
        </div>

        {images.length > 0 && (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((image, index) => (
              <li key={image.id} className="overflow-hidden rounded-md border bg-muted">
                <button
                  type="button"
                  className="block size-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset"
                  aria-label={`View photo ${index + 1} larger`}
                  onClick={() => {
                    setPreview({ src: image.image_url, title: `${product.name}, photo ${index + 1}` })
                    setIsPreviewOpen(true)
                  }}
                >
                  <img src={image.image_url} alt="" className="aspect-square size-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <DetailsSection title="Details">
          <DetailRow label="Store">{store ? `${store.name} (${store.code})` : `Store #${product.store_id}`}</DetailRow>
          <DetailRow label="Base price">
            <span className="tabular-nums">{formatPeso(product.base_price)}</span>
            {variations.length > 0 && (
              <span className="block text-xs text-muted-foreground">
                Customers pay {getProductPriceLabel(product)}, depending on the variation.
              </span>
            )}
          </DetailRow>
          <DetailRow label="Preparation time">{formatPreparationTime(product.preparation_time)}</DetailRow>
          <DetailRow label="Description">
            {product.description ? (
              <span className="whitespace-pre-line">{product.description}</span>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </DetailRow>
        </DetailsSection>

        <FieldSeparator />

        <DetailsSection title="Variations">
          {variations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No variations. Customers pay the base price.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                The customer picks one, and pays its price instead of the base price ({formatPeso(product.base_price)}).
              </p>
              <OptionList
                items={variations.map((variation) => ({
                  id: variation.id,
                  name: variation.name,
                  detail: [variation.sku && `SKU ${variation.sku}`, formatPeso(variation.price)].filter(Boolean).join(' · '),
                  note: formatPriceDifference(variation.price, product.base_price),
                  isAvailable: variation.is_available,
                }))}
              />
            </>
          )}
        </DetailsSection>

        <FieldSeparator />

        <DetailsSection title="Add-ons">
          {addOns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No add-ons.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Added on top of the product or variation price.</p>
              <OptionList
              items={addOns.map((addOn) => ({
                id: addOn.id,
                name: addOn.name,
                detail: formatPeso(addOn.price),
                isAvailable: addOn.is_available,
                }))}
              />
            </>
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
          <Button type="button" className="ml-2" onClick={() => onEdit(product)}>
            <PencilIcon />
            Edit product
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

function OptionList({
  items,
}: {
  items: { id: number; name: string; detail: string; note?: string | null; isAvailable: boolean }[]
}) {
  return (
    <ul className="divide-y rounded-lg border text-sm">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="font-medium">{item.name}</span>
          <span className="grid text-right tabular-nums leading-tight">
            <span className="text-muted-foreground">
              {item.detail}
              {!item.isAvailable && ' · Unavailable'}
            </span>
            {item.note && <span className="text-xs text-muted-foreground">{item.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}
