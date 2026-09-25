import type { DayOfWeek, StoreStatus } from './stores.types'

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

/** The week in the API's order (DayOfWeek enum, Monday = 1). */
export const DAYS_OF_WEEK: readonly { value: DayOfWeek; label: string; shortLabel: string }[] = [
  { value: 1, label: 'Monday', shortLabel: 'Mon' },
  { value: 2, label: 'Tuesday', shortLabel: 'Tue' },
  { value: 3, label: 'Wednesday', shortLabel: 'Wed' },
  { value: 4, label: 'Thursday', shortLabel: 'Thu' },
  { value: 5, label: 'Friday', shortLabel: 'Fri' },
  { value: 6, label: 'Saturday', shortLabel: 'Sat' },
  { value: 7, label: 'Sunday', shortLabel: 'Sun' },
]

/** Prefilled for days a store has no hours for yet, so a new schedule starts from something sensible. */
export const DEFAULT_OPEN_TIME = '08:00'
export const DEFAULT_CLOSE_TIME = '17:00'

/** Keyboard shortcut on the Operating Hours page. Also shown in the UI as a hint. */
export const OPERATING_HOURS_SHORTCUTS = {
  search: 'Alt+S',
} as const
