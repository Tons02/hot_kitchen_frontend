import type { ProductCategoryFilterValues, ProductCategoryStatus } from './productCategories.types'

export const PRODUCT_CATEGORY_STATUS_LABELS: Record<ProductCategoryStatus, string> = {
  active: 'Active',
  archived: 'Archived',
}

/** Upload limits enforced by ProductCategoryRequest. */
export const MAX_CATEGORY_IMAGE_BYTES = 10 * 1024 * 1024
export const CATEGORY_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const DEFAULT_PRODUCT_CATEGORY_FILTERS: ProductCategoryFilterValues = {
  storeId: 'all',
}

/** Keyboard shortcuts on the Product Categories page, matching the other lists. Also shown in the UI as hints. */
export const PRODUCT_CATEGORY_SHORTCUTS = {
  addCategory: 'Alt+A',
  search: 'Alt+S',
} as const

export const DEFAULT_PRODUCT_CATEGORIES_PAGE_SIZE = 10
/** The mobile card list's first `per_page`, and how much it grows each time the end scrolls into view. */
export const PRODUCT_CATEGORIES_CARD_LIST_STEP = 10
/** The API's `per_page` limit (api-tool-kit's max_pagination_limit). */
export const PRODUCT_CATEGORIES_MAX_PAGE_SIZE = 100
