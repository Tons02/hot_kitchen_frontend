import type { Product } from '@/features/products/products.types'
import { DEFAULT_LOW_STOCK_THRESHOLD } from './storeInventories.constants'
import type { AddInventoryFormValues, EditInventoryFormValues } from './storeInventories.schemas'
import type {
  CreateStoreInventoryPayload,
  InventoryStatus,
  StoreInventoriesQueryArgs,
  StoreInventory,
  UpdateStoreInventoryPayload,
} from './storeInventories.types'

/** What can still be sold. Uses the API's value; falls back to its formula, never below 0. */
export function getAvailableQuantity(inventory: Pick<StoreInventory, 'available_quantity' | 'stock_quantity' | 'reserved_quantity'>) {
  if (typeof inventory.available_quantity === 'number') return inventory.available_quantity
  return Math.max(0, inventory.stock_quantity - (inventory.reserved_quantity ?? 0))
}

/** The API's own status for the record (`stock_status`), so the table never disagrees with its filters. */
export function getInventoryStatus(inventory: Pick<StoreInventory, 'stock_status'>): InventoryStatus {
  return inventory.stock_status
}

/** "Classic Burger", or "Classic Burger · Large" for a variation's record. */
export function getInventoryName(inventory: Pick<StoreInventory, 'product' | 'variation'>): string {
  const name = inventory.product?.name ?? 'Unknown product'
  return inventory.variation ? `${name} · ${inventory.variation.name}` : name
}

/** The variation's SKU when the record is for a variation, else the product's. */
export function getInventorySku(inventory: Pick<StoreInventory, 'product' | 'variation'>): string | null {
  return inventory.variation?.sku || inventory.product?.sku || null
}

/**
 * Query params for `GET /store-inventories/{store}`. `search` maps to StoreInventoryFilter's
 * relation search; `status` to the model's inStock / lowStock / outOfStock scopes. `pagination` is
 * left out, which makes the API return a page with totals.
 */
export function toStoreInventoriesParams({ search, status, page, perPage }: StoreInventoriesQueryArgs) {
  const params: Record<string, string | number> = { page, per_page: perPage }
  const term = search.trim()

  if (term) params.search = term
  if (status !== 'all') params.status = status

  return params
}

/**
 * What the product can still be stocked as at this store, given its existing records there: the
 * product itself when it has no variations, otherwise each variation that has no record yet.
 */
export function getStockableOptions(product: Product | undefined, records: StoreInventory[]) {
  const variations = product?.variations ?? []
  const stockedVariationIds = new Set(records.map((record) => record.variation_id))

  return {
    hasVariations: variations.length > 0,
    variations: variations.filter((variation) => !stockedVariationIds.has(variation.id)),
    /** Nothing left to add: the product (or every one of its variations) already has a record. */
    isFullyStocked: product !== undefined && (variations.length === 0 ? records.length > 0 : variations.every((variation) => stockedVariationIds.has(variation.id))),
  }
}

const toThreshold = (value: string) => (value === '' ? null : Number(value))

export const ADD_INVENTORY_DEFAULTS: AddInventoryFormValues = {
  product_id: '',
  variation_id: '',
  stock_quantity: '',
  low_stock_threshold: DEFAULT_LOW_STOCK_THRESHOLD,
}

export function toCreateInventoryPayload(values: AddInventoryFormValues): CreateStoreInventoryPayload {
  return {
    product_id: Number(values.product_id),
    variation_id: values.variation_id ? Number(values.variation_id) : null,
    stock_quantity: Number(values.stock_quantity),
    low_stock_threshold: toThreshold(values.low_stock_threshold),
  }
}

export function getEditInventoryDefaults(inventory: StoreInventory): EditInventoryFormValues {
  return {
    stock_quantity: String(inventory.stock_quantity),
    low_stock_threshold: inventory.low_stock_threshold === null ? '' : String(inventory.low_stock_threshold),
  }
}

export function toUpdateInventoryPayload(values: EditInventoryFormValues): UpdateStoreInventoryPayload {
  return {
    stock_quantity: Number(values.stock_quantity),
    low_stock_threshold: toThreshold(values.low_stock_threshold),
  }
}
