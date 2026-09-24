/** A background image, as embedded in StoreResource. Public URL (no auth needed). */
export interface StoreBackgroundImage {
  id: number
  image_url: string
  /** Display order, starting at 1. */
  layer: number
}

export interface StoreOperatingHour {
  id: number
  /** 0 (Sunday) to 6, per the API's DayOfWeek enum. */
  day_of_week: number
  day_name: string
  open_time: string | null
  close_time: string | null
  is_closed: boolean
}

/** Mirrors the API's StoreResource. Relations are present when the endpoint loads them. */
export interface Store {
  id: number
  /** Public storage URL, so <img> can use it directly. Absent when no logo was uploaded. */
  logo_url?: string
  background_images?: StoreBackgroundImage[]
  operating_hours?: StoreOperatingHour[]
  code: string
  name: string
  title_banner: string
  description_banner: string
  region: string
  province: string
  city: string
  barangay: string
  street_name: string
  postal_code: string
  /** Decimal columns arrive as strings, e.g. "14.5211990". */
  latitude: string
  longitude: string
  mobile_number: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Which list to load: current stores, or soft-deleted (archived) ones. */
export type StoreListView = 'current' | 'archived'

export type StoreStatus = 'active' | 'inactive' | 'archived'

/** A row action: view and edit open dialogs, archive and restore a confirmation. */
export interface StoreAction {
  type: 'view' | 'edit' | 'archive' | 'restore'
  store: Store
}

/** Everything that selects which stores the list asks the API for (the page aside). */
export interface StoresQueryFilters {
  view: StoreListView
  /** Sent as `search`; the API matches it against StoreFilter::$columnSearch. */
  search: string
}

export interface StoresQueryArgs extends StoresQueryFilters {
  page: number
  perPage: number
}

/** Everything `POST /stores` and `PATCH /stores/{id}` accept (StoreRequest). */
export interface StorePayload {
  code: string
  name: string
  title_banner: string
  description_banner: string
  region: string
  province: string
  city: string
  barangay: string
  street_name: string
  postal_code: string
  latitude: number
  longitude: number
  /** Full international format, e.g. +639171234567. */
  mobile_number: string
  email: string
}

/**
 * One background image in the form, in display order. Nothing is sent until the form is saved:
 * existing images can get a replacement file or be dropped from the list (removed), new ones are
 * uploaded, and every image ends up on the layer matching its position (1, 2, 3, ...).
 */
export type BackgroundImageDraft =
  | { key: string; kind: 'existing'; id: number; url: string; layer: number; replacement: File | null }
  | { key: string; kind: 'new'; file: File }

/** Image changes made in the form, sent to their own endpoints after the store itself saves. */
export interface StoreImageChanges {
  /** A new logo to upload (replaces the current one). */
  logo: File | null
  /** The background images as they should end up, in order. */
  backgroundImages: BackgroundImageDraft[]
}

/**
 * One request in saving a store's images, run in order. `key` names the logo ('logo') or the
 * draft it belongs to, so the form can show a spinner on that image while it runs.
 */
export type StoreImageStep =
  | { kind: 'logo'; key: 'logo'; file: File }
  | { kind: 'remove'; key: string; imageId: number }
  /** Parks an image on a spare layer so another can take its old one (layers must be unique). */
  | { kind: 'park'; key: string; imageId: number; layer: number }
  | { kind: 'update'; key: string; imageId: number; layer?: number; file?: File }
  | { kind: 'add'; key: string; file: File; layer: number }

export type StoreImageStepStatus = 'pending' | 'working' | 'done' | 'failed'

/** Status per image key while the form saves, e.g. { logo: 'done', 'existing-7': 'working' }. */
export type StoreSaveProgress = Record<string, StoreImageStepStatus>

export interface AddBackgroundImageRequest {
  storeId: number
  image: File
  layer: number
}

/** Changes an existing image's file, its layer, or both. */
export interface UpdateBackgroundImageRequest {
  storeId: number
  imageId: number
  image?: File
  layer?: number
}
