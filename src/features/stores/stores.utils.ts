import {
  getLayeredImageDrafts,
  planLayeredImageSteps,
  summarizeLayeredImageChanges,
  type LayeredImageChangeSummary,
} from '@/lib/layered-images'
import { DAYS_OF_WEEK, DEFAULT_CLOSE_TIME, DEFAULT_OPEN_TIME, MOBILE_PREFIX } from './stores.constants'
import type { OperatingHourFormValue, OperatingHoursFormValues, StoreFormValues } from './stores.schemas'
import type {
  DayOfWeek,
  OperatingHourPayload,
  OperatingHoursSummaryLine,
  Store,
  StoreBackgroundImage,
  StoreImageChanges,
  StoreImageStep,
  StoreListView,
  StoreOperatingHour,
  StorePayload,
  StoresQueryArgs,
  StoreStatus,
} from './stores.types'

/** Up to two letters for the logo fallback, e.g. "Hot Kitchen Manila" → "HK". */
export function getStoreInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
}

/** Street to province, e.g. "123 Rizal St, Baliti, Angeles, Pampanga". */
export function getStoreAddress(store: Pick<Store, 'street_name' | 'barangay' | 'city' | 'province'>): string {
  return [store.street_name, store.barangay, store.city, store.province].filter(Boolean).join(', ')
}

/** "08:30:00" → "8:30 AM", in the viewer's locale. */
export function formatStoreTime(time: string | null): string {
  if (!time) return '—'
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/** A Google Maps link to the store's pin. */
export function getStoreMapUrl(store: Pick<Store, 'latitude' | 'longitude'>): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${store.latitude},${store.longitude}`)}`
}

export function getStoreStatus(store: Pick<Store, 'is_active'>, view: StoreListView): StoreStatus {
  if (view === 'archived') return 'archived'
  return store.is_active ? 'active' : 'inactive'
}

/**
 * Query params for `GET /stores`. `search` maps to StoreFilter::$columnSearch; archived stores
 * are `status=inactive`. `pagination` is left out, which makes the API return a paginator with totals.
 */
export function toStoresParams({ view, search, page, perPage }: StoresQueryArgs) {
  const params: Record<string, string | number> = { page, per_page: perPage }
  const term = search.trim()

  if (term) params.search = term
  if (view === 'archived') params.status = 'inactive'

  return params
}

function stripMobilePrefix(mobileNumber: string): string {
  return mobileNumber.startsWith(MOBILE_PREFIX)
    ? mobileNumber.slice(MOBILE_PREFIX.length)
    : mobileNumber.replace(/\D/g, '').slice(-10)
}

export function getStoreFormDefaults(store?: Store): StoreFormValues {
  return {
    logo: null,
    background_images: getLayeredImageDrafts(store?.background_images),
    code: store?.code ?? '',
    name: store?.name ?? '',
    title_banner: store?.title_banner ?? '',
    description_banner: store?.description_banner ?? '',
    region: store?.region ?? '',
    province: store?.province ?? '',
    city: store?.city ?? '',
    barangay: store?.barangay ?? '',
    street_name: store?.street_name ?? '',
    postal_code: store?.postal_code ?? '',
    latitude: store?.latitude ?? '',
    longitude: store?.longitude ?? '',
    mobile_number: store ? stripMobilePrefix(store.mobile_number) : '',
    email: store?.email ?? '',
  }
}

/** Converts validated form values into the API payload. Only call with values that passed `storeSchema`. */
export function toStorePayload(values: StoreFormValues): StorePayload {
  return {
    code: values.code,
    name: values.name,
    title_banner: values.title_banner,
    description_banner: values.description_banner,
    region: values.region,
    province: values.province,
    city: values.city,
    barangay: values.barangay,
    street_name: values.street_name,
    postal_code: values.postal_code,
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    mobile_number: `${MOBILE_PREFIX}${values.mobile_number}`,
    email: values.email,
  }
}

export function toStoreImageChanges(values: StoreFormValues): StoreImageChanges {
  return { logo: values.logo ?? null, backgroundImages: values.background_images }
}

/** The logo upload first, then the background image requests (see `planLayeredImageSteps`). */
export function planStoreImageSteps(saved: StoreBackgroundImage[], changes: StoreImageChanges): StoreImageStep[] {
  return [
    ...(changes.logo ? [{ kind: 'logo', key: 'logo', file: changes.logo } as const] : []),
    ...planLayeredImageSteps(saved, changes.backgroundImages),
  ]
}

export interface StoreImageChangeSummary extends LayeredImageChangeSummary {
  logo: boolean
}

/** What saving will do to the images, for the confirmation step. */
export function summarizeStoreImageChanges(
  saved: StoreBackgroundImage[],
  changes: StoreImageChanges,
): StoreImageChangeSummary {
  return { logo: changes.logo !== null, ...summarizeLayeredImageChanges(saved, changes.backgroundImages) }
}

/** The multipart body for the logo endpoint. */
export function toLogoFormData(logo: File): FormData {
  const body = new FormData()
  body.append('logo', logo)
  return body
}

/** "08:00:00" → "08:00", the format <input type="time"> and the API's H:i rule use. */
function toTimeValue(time: string | null): string {
  return time ? time.slice(0, 5) : ''
}

/** One row per day, Monday first. Days the store has no hours for yet start open 8 AM to 5 PM. */
export function getOperatingHoursFormDefaults(hours: StoreOperatingHour[]): OperatingHoursFormValues {
  const byDay = new Map(hours.map((hour) => [hour.day_of_week, hour]))

  return {
    operating_hours: DAYS_OF_WEEK.map(({ value }) => {
      const saved = byDay.get(value)
      return {
        day_of_week: value,
        is_closed: saved?.is_closed ?? false,
        open_time: toTimeValue(saved?.open_time ?? null) || DEFAULT_OPEN_TIME,
        close_time: toTimeValue(saved?.close_time ?? null) || DEFAULT_CLOSE_TIME,
      }
    }),
  }
}

/** Converts validated form values into the API payload. Closed days send no times. */
export function toOperatingHoursPayload(values: OperatingHoursFormValues): OperatingHourPayload[] {
  return values.operating_hours.map((hour) => ({
    day_of_week: hour.day_of_week as DayOfWeek,
    is_closed: hour.is_closed,
    open_time: hour.is_closed ? null : hour.open_time,
    close_time: hour.is_closed ? null : hour.close_time,
  }))
}

/** True once the store has hours for all seven days. */
export function hasFullWeekOfHours(hours: StoreOperatingHour[] | undefined): boolean {
  return new Set((hours ?? []).map((hour) => hour.day_of_week)).size === DAYS_OF_WEEK.length
}

/**
 * The week in a few lines, joining consecutive days with the same hours:
 * ["Mon–Fri 8:00 AM – 5:00 PM", "Sat 9:00 AM – 1:00 PM", "Sun Closed"]. Days without hours read "Not set".
 */
export function summarizeOperatingHours(hours: StoreOperatingHour[] | undefined): OperatingHoursSummaryLine[] {
  const byDay = new Map((hours ?? []).map((hour) => [hour.day_of_week, hour]))
  const lines: (OperatingHoursSummaryLine & { firstDay: string })[] = []

  for (const day of DAYS_OF_WEEK) {
    const hour = byDay.get(day.value)
    const isClosed = hour?.is_closed ?? false
    const text = !hour
      ? 'Not set'
      : isClosed
        ? 'Closed'
        : `${formatStoreTime(hour.open_time)} – ${formatStoreTime(hour.close_time)}`

    const previous = lines.at(-1)
    if (previous && previous.hours === text) {
      previous.days = `${previous.firstDay}–${day.shortLabel}`
    } else {
      lines.push({ days: day.shortLabel, hours: text, isClosed, firstDay: day.shortLabel })
    }
  }

  return lines
}

/** One day in the form as text: "8:00 AM – 5:00 PM" or "Closed". */
export function formatOperatingHourValue(hour: Pick<OperatingHourFormValue, 'is_closed' | 'open_time' | 'close_time'>): string {
  if (hour.is_closed) return 'Closed'
  return `${formatStoreTime(hour.open_time || null)} – ${formatStoreTime(hour.close_time || null)}`
}

/** True when the day's schedule differs from what's saved, comparing only what the API keeps. */
export function isOperatingHourChanged(saved: OperatingHourFormValue | undefined, next: OperatingHourFormValue): boolean {
  if (!saved) return true
  if (saved.is_closed !== next.is_closed) return true
  return !next.is_closed && (saved.open_time !== next.open_time || saved.close_time !== next.close_time)
}
