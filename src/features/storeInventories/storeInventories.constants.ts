import type { SelectOption } from '@/components/common/SelectInput'
import type { InventoryStatus } from './storeInventories.types'

export const INVENTORY_STATUS_LABELS: Record<InventoryStatus, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
}

export const INVENTORY_STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'in_stock', label: INVENTORY_STATUS_LABELS.in_stock },
  { value: 'low_stock', label: INVENTORY_STATUS_LABELS.low_stock },
  { value: 'out_of_stock', label: INVENTORY_STATUS_LABELS.out_of_stock },
]

/** Prefilled in the Add dialog, so new records warn before they run out. */
export const DEFAULT_LOW_STOCK_THRESHOLD = '10'

/** StoreInventoryRequest stores quantities as unsigned integers. */
export const MAX_QUANTITY = 4_294_967_295

export const DEFAULT_INVENTORY_PAGE_SIZE = 20

/** Keyboard shortcuts on the inventory pages, matching the other lists. Also shown in the UI as hints. */
export const INVENTORY_SHORTCUTS = {
  addProduct: 'Alt+A',
  search: 'Alt+S',
} as const
