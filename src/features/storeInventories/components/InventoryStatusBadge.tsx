import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge'
import { INVENTORY_STATUS_LABELS } from '../storeInventories.constants'
import type { InventoryStatus } from '../storeInventories.types'

const STATUS_TONES: Record<InventoryStatus, StatusTone> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'destructive',
}

/** The status in words, with a colored dot. The text carries the meaning, so it reads without color. */
export function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  return <StatusBadge tone={STATUS_TONES[status]}>{INVENTORY_STATUS_LABELS[status]}</StatusBadge>
}
