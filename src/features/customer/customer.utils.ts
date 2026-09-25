import type { Store } from '@/features/stores/stores.types'
import { formatStoreTime } from '@/features/stores/stores.utils'
import { STORAGE_KEYS } from '@/lib/constants'

/*
 * Selected store persistence. Storage can be unavailable (private mode, blocked site data), so every
 * access is guarded; the site simply starts without a chosen store then.
 */

export function loadSelectedStoreId(): number | null {
  try {
    const id = Number(localStorage.getItem(STORAGE_KEYS.selectedStore))
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

export function saveSelectedStoreId(storeId: number | null): void {
  try {
    if (storeId === null) localStorage.removeItem(STORAGE_KEYS.selectedStore)
    else localStorage.setItem(STORAGE_KEYS.selectedStore, String(storeId))
  } catch {
    // Not remembered across visits; the choice still holds for this session.
  }
}

export type StoreOpenStatus =
  | { state: 'open'; label: string }
  | { state: 'closed'; label: string }
  | { state: 'unknown'; label: string }

const toMinutes = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Whether the store is open right now, from its operating hours (ISO days: Monday = 1, Sunday = 7),
 * with a short label such as "Open until 5:00 PM" or "Closed today".
 */
export function getStoreOpenStatus(store: Pick<Store, 'operating_hours'>, now = new Date()): StoreOpenStatus {
  const isoDay = now.getDay() === 0 ? 7 : now.getDay()
  const today = store.operating_hours?.find((hours) => hours.day_of_week === isoDay)

  if (!today) return { state: 'unknown', label: 'Hours not posted' }
  if (today.is_closed || !today.open_time || !today.close_time) return { state: 'closed', label: 'Closed today' }

  const current = now.getHours() * 60 + now.getMinutes()
  if (current < toMinutes(today.open_time)) return { state: 'closed', label: `Opens at ${formatStoreTime(today.open_time)}` }
  if (current >= toMinutes(today.close_time)) return { state: 'closed', label: 'Closed for today' }
  return { state: 'open', label: `Open until ${formatStoreTime(today.close_time)}` }
}

/** The store's banner photo (its first background image), else its logo. Public URLs. */
export function getStoreImageUrl(store: Pick<Store, 'background_images' | 'logo_url'>): string | undefined {
  const [first] = [...(store.background_images ?? [])].sort((a, b) => a.layer - b.layer)
  return first?.image_url ?? store.logo_url
}

export interface Coordinates {
  latitude: number
  longitude: number
}

/** Straight-line distance in km (haversine). A rough guide, not a delivery route. */
export function getDistanceKm(from: Coordinates, store: Pick<Store, 'latitude' | 'longitude'>): number | null {
  const lat = Number(store.latitude)
  const lng = Number(store.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = toRadians(lat - from.latitude)
  const dLng = toRadians(lng - from.longitude)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`
}

/** Scrolls a page section into view: smoothly, unless the user prefers reduced motion. */
export function scrollToSection(id: string): void {
  const section = document.getElementById(id)
  if (!section) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}

/** The store's cover photo: its first background image by layer. Undefined when it has none. */
export function getStoreCoverUrl(store: Pick<Store, 'background_images'>): string | undefined {
  return [...(store.background_images ?? [])].sort((a, b) => a.layer - b.layer)[0]?.image_url
}
