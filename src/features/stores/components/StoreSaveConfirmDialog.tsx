import { TriangleAlertIcon } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { StoreImageChangeSummary } from '../stores.utils'

interface StoreSaveConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  storeName: string
  /** Null while there's nothing to confirm (the dialog keeps its last text while closing). */
  summary: StoreImageChangeSummary | null
  onConfirm: () => void
}

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

/** The last check before saving: lists every change, because none of them can be undone. */
export function StoreSaveConfirmDialog({
  open,
  onOpenChange,
  isEditing,
  storeName,
  summary,
  onConfirm,
}: StoreSaveConfirmDialogProps) {
  const changes = [
    isEditing ? `Save the details of ${storeName}` : `Create the store ${storeName}`,
    summary?.logo && (isEditing ? 'Replace the logo' : 'Upload the logo'),
    summary?.added && `Upload ${count(summary.added, 'new background image')}`,
    summary?.replaced && `Replace ${count(summary.replaced, 'background image')}`,
    summary?.removed && `Permanently delete ${count(summary.removed, 'background image')}`,
    summary?.reordered && 'Save the new order of the background images',
  ].filter((change): change is string => typeof change === 'string')

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Save these changes?' : 'Create this store?'}
      description="Check that everything is correct. These changes can't be undone once they're saved."
      confirmLabel={isEditing ? 'Yes, save changes' : 'Yes, create store'}
      onConfirm={onConfirm}
    >
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {changes.map((change) => (
          <li key={change}>{change}</li>
        ))}
      </ul>
      {Boolean(summary?.removed) && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>Deleted background images can't be recovered.</AlertDescription>
        </Alert>
      )}
    </ConfirmDialog>
  )
}
