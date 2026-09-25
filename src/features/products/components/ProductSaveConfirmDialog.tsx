import { TriangleAlertIcon } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { summarizeLayeredImageChanges } from '@/lib/layered-images'
import { formatPeso } from '@/lib/money'
import type { ProductFormValues } from '../products.schemas'
import type { Product } from '../products.types'
import { summarizeOptionChanges, type ProductOptionChanges } from '../products.utils'

interface ProductSaveConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The product being edited; omit when creating. */
  product?: Product
  /** Null while there's nothing to confirm (the dialog keeps its last text while closing). */
  pending: ProductFormValues | null
  /** Turns a store id into its name for the summary. */
  getStoreLabel: (storeId: string) => string
  onConfirm: () => void
}

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

/** "Add 2 variations", "Update 1 variation", "Remove 1 variation". */
function describeOptionChanges(changes: ProductOptionChanges | null, noun: string): string[] {
  if (!changes) return []
  return [
    changes.added > 0 ? `Add ${count(changes.added, noun)}` : '',
    changes.changed > 0 ? `Update ${count(changes.changed, noun)}` : '',
    changes.removed > 0 ? `Remove ${count(changes.removed, noun)}` : '',
  ].filter(Boolean)
}

/** The last check before saving: lists every change, because image changes can't be undone. */
export function ProductSaveConfirmDialog({
  open,
  onOpenChange,
  product,
  pending,
  getStoreLabel,
  onConfirm,
}: ProductSaveConfirmDialogProps) {
  const isEditing = product !== undefined
  const images = pending ? summarizeLayeredImageChanges(product?.images ?? [], pending.images) : null
  const variations = pending ? summarizeOptionChanges(product?.variations ?? [], pending.variations) : null
  const addOns = pending ? summarizeOptionChanges(product?.add_ons ?? [], pending.add_ons) : null
  const removedOptions = (variations?.removed ?? 0) + (addOns?.removed ?? 0)

  const changes = pending
    ? [
        isEditing
          ? `Save the details of ${pending.name}`
          : `Create ${pending.name} in ${getStoreLabel(pending.store_id)} at ${formatPeso(pending.base_price)}`,
        ...describeOptionChanges(variations, 'variation'),
        ...describeOptionChanges(addOns, 'add-on'),
        images?.added && `Upload ${count(images.added, 'new photo')}`,
        images?.replaced && `Replace ${count(images.replaced, 'photo')}`,
        images?.removed && `Permanently delete ${count(images.removed, 'photo')}`,
        images?.reordered && 'Save the new order of the photos',
      ].filter((change): change is string => typeof change === 'string')
    : []

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Save these changes?' : 'Create this product?'}
      description={
        isEditing
          ? "Check that everything is correct. Photo changes can't be undone once they're saved."
          : 'Check that everything is correct before saving.'
      }
      confirmLabel={isEditing ? 'Yes, save changes' : 'Yes, create product'}
      onConfirm={onConfirm}
    >
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {changes.map((change) => (
          <li key={change}>{change}</li>
        ))}
      </ul>
      {removedOptions > 0 && (
        <Alert>
          <TriangleAlertIcon />
          <AlertDescription>
            Removed variations and add-ons are archived. Customers can no longer pick them, and past orders keep them.
          </AlertDescription>
        </Alert>
      )}
      {Boolean(images?.removed) && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>Deleted photos can't be recovered.</AlertDescription>
        </Alert>
      )}
    </ConfirmDialog>
  )
}
