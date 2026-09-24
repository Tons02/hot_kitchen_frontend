import type { StoreStatus } from './stores.types'

export const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  archived: 'Archived',
}

/** Upload limits enforced by StoreLogoRequest and StoreBackgroundImageRequest. */
export const MAX_STORE_IMAGE_BYTES = 10 * 1024 * 1024
export const STORE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

/** Philippine mobile numbers: the API expects +63 followed by 10 digits. */
export const MOBILE_PREFIX = '+63'

/** Keyboard shortcuts on the Stores page, matching the Users page. Also shown in the UI as hints. */
export const STORE_SHORTCUTS = {
  addStore: 'Alt+A',
  search: 'Alt+S',
} as const

export const DEFAULT_STORES_PAGE_SIZE = 10
/** The mobile card list's first `per_page`, and how much it grows each time the end scrolls into view. */
export const STORES_CARD_LIST_STEP = 10
/** The API's `per_page` limit (api-tool-kit's max_pagination_limit). */
export const STORES_MAX_PAGE_SIZE = 100
