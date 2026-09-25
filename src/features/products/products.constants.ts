import type { SelectOption } from '@/components/common/SelectInput'
import type { ProductFilterValues, ProductStatus } from './products.types'

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  available: 'Available',
  unavailable: 'Unavailable',
  archived: 'Archived',
}

/** Upload limits enforced by ProductImageRequest. */
export const MAX_PRODUCT_IMAGE_BYTES = 10 * 1024 * 1024
export const PRODUCT_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

/** ProductRequest's limits: prices up to 999,999.99, preparation time up to 65,535 minutes. */
export const MAX_PRICE = 999_999.99
export const MAX_PREPARATION_MINUTES = 65_535

/** The category select's "no category" choice, since the API's category_id is optional. */
export const NO_CATEGORY = 'none'

export const DEFAULT_PRODUCT_FILTERS: ProductFilterValues = {
  storeId: 'all',
  categoryId: 'all',
  featured: 'all',
  available: 'all',
}

export const FEATURED_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Featured or not' },
  { value: 'yes', label: 'Featured only' },
  { value: 'no', label: 'Not featured' },
]

export const AVAILABLE_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All availability' },
  { value: 'yes', label: 'Available' },
  { value: 'no', label: 'Unavailable' },
]

/** Keyboard shortcuts on the Products page, matching the other lists. Also shown in the UI as hints. */
export const PRODUCT_SHORTCUTS = {
  addProduct: 'Alt+A',
  search: 'Alt+S',
} as const

export const DEFAULT_PRODUCTS_PAGE_SIZE = 10
/** The mobile card list's first `per_page`, and how much it grows each time the end scrolls into view. */
export const PRODUCTS_CARD_LIST_STEP = 10
/** The API's `per_page` limit (api-tool-kit's max_pagination_limit). */
export const PRODUCTS_MAX_PAGE_SIZE = 100
