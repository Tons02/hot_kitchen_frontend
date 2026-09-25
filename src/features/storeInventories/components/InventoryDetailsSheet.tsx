import { PencilIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ProductThumbnail } from '@/features/products/components/ProductThumbnail'
import { formatPeso } from '@/lib/money'
import type { StoreInventory } from '../storeInventories.types'
import { getAvailableQuantity, getInventorySku, getInventoryStatus } from '../storeInventories.utils'
import { InventoryStatusBadge } from './InventoryStatusBadge'

interface InventoryDetailsSheetProps {
  /** Kept after closing so the content doesn't blank out during the exit animation. */
  inventory: StoreInventory | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (inventory: StoreInventory) => void
}

/** Everything about one record, including the columns phones hide. */
export function InventoryDetailsSheet({ inventory, open, onOpenChange, onEdit }: InventoryDetailsSheetProps) {
  const shownProduct = inventory?.product

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        {inventory && (
          <>
            <SheetHeader className="border-b">
              <div className="flex items-center gap-3">
                {shownProduct && <ProductThumbnail product={shownProduct} size="lg" />}
                <div className="grid min-w-0 gap-0.5">
                  <SheetTitle className="truncate">{inventory.product?.name ?? 'Unknown product'}</SheetTitle>
                  <SheetDescription>{inventory.variation ? `Variation: ${inventory.variation.name}` : 'No variation'}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
              <Section title="Product">
                <Row label="SKU">{getInventorySku(inventory) ?? '—'}</Row>
                <Row label="Category">{inventory.product?.category?.name ?? 'No category'}</Row>
                <Row label="Price">
                  {formatPeso(inventory.variation?.price ?? inventory.product?.base_price ?? 0)}
                  {inventory.variation && <span className="block text-xs text-muted-foreground">Variation price</span>}
                </Row>
              </Section>

              <Separator />

              <Section title="Inventory">
                <Row label="Stock on hand">{inventory.stock_quantity.toLocaleString()}</Row>
                <Row label="Reserved">{inventory.reserved_quantity.toLocaleString()}</Row>
                <Row label="Available">
                  <span className="font-semibold">{getAvailableQuantity(inventory).toLocaleString()}</span>
                </Row>
                <Row label="Low-stock threshold">
                  {inventory.low_stock_threshold === null ? 'Not set' : inventory.low_stock_threshold.toLocaleString()}
                </Row>
                <Row label="Status">
                  <InventoryStatusBadge status={getInventoryStatus(inventory)} />
                </Row>
              </Section>

              <p className="text-xs text-muted-foreground">
                Available = stock on hand − reserved for open orders. Reserved stock is managed by orders.
              </p>
            </div>

            <SheetFooter className="border-t">
              <Button onClick={() => onEdit(inventory)}>
                <PencilIcon />
                Edit inventory
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="font-heading text-sm font-medium">{title}</h3>
      <dl className="flex flex-col gap-2 text-sm">{children}</dl>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right tabular-nums">{children}</dd>
    </div>
  )
}
