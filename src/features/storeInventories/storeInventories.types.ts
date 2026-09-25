import type { Product, ProductVariation } from '@/features/products/products.types'

/** One status per record, as the API decides it. The three never overlap. */
export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

/**
 * Mirrors the API's StoreInventoryResource: one product (or one of its variations) stocked at a store.
 * `product` carries its images and category only when the API eager-loads them.
 */
export interface StoreInventory {
  id: number
  store_id: number
  product_id: number
  /** Null when the record is for the product itself rather than one of its variations. */
  variation_id: number | null
  product?: Product
  variation?: ProductVariation | null
  /** On hand. */
  stock_quantity: number
  /** Held for open orders. Set by the order system, never edited here. */
  reserved_quantity: number
  /** What can still be sold: stock − reserved, never below 0 (computed by the API). */
  available_quantity: number
  /** Null means the record never counts as low stock. */
  low_stock_threshold: number | null
  stock_status: InventoryStatus
  is_low_stock: boolean
  created_at: string
  updated_at: string
}

/** `GET /store-inventories/{store}/summary`. The three statuses add up to `total`. */
export interface InventorySummary {
  total: number
  in_stock: number
  low_stock: number
  out_of_stock: number
}

export type InventoryStatusFilter = 'all' | InventoryStatus

/** Everything that selects which records the table asks the API for (the page aside). */
export interface StoreInventoriesQueryArgs {
  storeId: number
  /** Matches the product's or the variation's name or SKU (StoreInventoryFilter::$relationSearch). */
  search: string
  status: InventoryStatusFilter
  page: number
  perPage: number
}

/** `POST /store-inventories/{store}` (StoreInventoryRequest). */
export interface CreateStoreInventoryPayload {
  product_id: number
  variation_id: number | null
  stock_quantity: number
  low_stock_threshold: number | null
}

/** `PATCH /store-inventories/{store}/{inventory}`. Only the quantities can change. */
export interface UpdateStoreInventoryPayload {
  stock_quantity: number
  low_stock_threshold: number | null
}
