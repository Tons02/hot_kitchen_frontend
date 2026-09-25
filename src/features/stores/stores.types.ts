import type { LayeredImage, LayeredImageDraft, LayeredImageStep } from '@/lib/layered-images'

/** A background image, as embedded in StoreResource. Public URL (no auth needed). */
export type StoreBackgroundImage = LayeredImage

/** ISO day numbers, per the API's DayOfWeek enum: 1 (Monday) to 7 (Sunday). */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7

/** Mirrors the API's StoreOperatingHourResource. */
export interface StoreOperatingHour {
  id: number
  day_of_week: DayOfWeek
  /** The enum case name, e.g. "MONDAY". */
  day_name: string
  /** A MySQL time, e.g. "08:00:00". Null when the day is closed. */
  open_time: string | null
  close_time: string | null
  is_closed: boolean
}

/** One day in `PUT /stores/{id}/operating-hours`. Times are "HH:mm" and ignored when closed. */
export interface OperatingHourPayload {
  day_of_week: DayOfWeek
  is_closed: boolean
  open_time: string | null
  close_time: string | null
}

/** The whole week at once: the API requires all seven days (StoreOperatingHoursRequest). */
export interface UpdateOperatingHoursRequest {
  storeId: number
  operatingHours: OperatingHourPayload[]
}

/** A run of consecutive days with the same hours, e.g. { days: "Mon–Fri", hours: "8:00 AM – 5:00 PM" }. */
export interface OperatingHoursSummaryLine {
  days: string
  hours: string
  isClosed: boolean
}

/** One delivery tier (StoreDeliveryRadiusResource): deliveries between these distances cost `fee`. */
export interface StoreDeliveryTier {
  id: number
  start_km: string | number
  end_km: string | number
  /** A decimal string, e.g. "49.00". */
  fee: string
}

/** Mirrors the API's StoreResource. Relations are present when the endpoint loads them. */
export interface Store {
  id: number
  /** Public storage URL, so <img> can use it directly. Absent when no logo was uploaded. */
  logo_url?: string
  background_images?: StoreBackgroundImage[]
  operating_hours?: StoreOperatingHour[]
  /** Delivery fee tiers by distance, on `GET /stores/{id}`. */
  delivery_radius?: StoreDeliveryTier[]
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
  /** Inventory counts, present on `GET /stores` (withCount). */
  products_count?: number
  low_stock_count?: number
  out_of_stock_count?: number
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

/** Image changes made in the form, sent to their own endpoints after the store itself saves. */
export interface StoreImageChanges {
  /** A new logo to upload (replaces the current one). */
  logo: File | null
  /** The background images as they should end up, in order. */
  backgroundImages: LayeredImageDraft[]
}

/** One request in saving a store's images: the logo upload, then the background image steps. */
export type StoreImageStep = { kind: 'logo'; key: 'logo'; file: File } | LayeredImageStep

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
