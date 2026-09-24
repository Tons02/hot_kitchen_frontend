import { MOBILE_PREFIX } from './stores.constants'
import type { StoreFormValues } from './stores.schemas'
import type {
  BackgroundImageDraft,
  Store,
  StoreBackgroundImage,
  StoreImageChanges,
  StoreImageStep,
  StoreListView,
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
    background_images: getBackgroundImageDrafts(store),
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

/** The store's saved background images as form drafts, in layer order. */
export function getBackgroundImageDrafts(store?: Store): BackgroundImageDraft[] {
  return [...(store?.background_images ?? [])]
    .sort((a, b) => a.layer - b.layer)
    .map((image) => ({
      key: `existing-${image.id}`,
      kind: 'existing',
      id: image.id,
      url: image.image_url,
      layer: image.layer,
      replacement: null,
    }))
}

let newDraftCount = 0

export function toNewBackgroundImageDraft(file: File): BackgroundImageDraft {
  newDraftCount += 1
  return { key: `new-${newDraftCount}`, kind: 'new', file }
}

/**
 * The requests that turn the saved images into the form's, one at a time:
 * 1. upload the logo
 * 2. remove images dropped from the list (frees their layers)
 * 3. park every image that changes layer on a spare one, since two images can't share a layer
 * 4. move each image to its final layer (1, 2, 3, ...), sending its replacement file in the same call
 * 5. upload new images straight onto their layers
 */
export function planStoreImageSteps(saved: StoreBackgroundImage[], changes: StoreImageChanges): StoreImageStep[] {
  const steps: StoreImageStep[] = []
  const drafts = changes.backgroundImages

  if (changes.logo) steps.push({ kind: 'logo', key: 'logo', file: changes.logo })

  const keptIds = new Set(drafts.flatMap((draft) => (draft.kind === 'existing' ? [draft.id] : [])))
  for (const image of saved) {
    if (!keptIds.has(image.id)) steps.push({ kind: 'remove', key: `existing-${image.id}`, imageId: image.id })
  }

  const targets = drafts.map((draft, index) => ({ draft, layer: index + 1 }))
  // Above every layer in use now and every final layer, so a parked image never blocks one.
  const firstSpareLayer = Math.max(drafts.length, ...saved.map((image) => image.layer)) + 1

  let parked = 0
  for (const { draft, layer } of targets) {
    if (draft.kind === 'existing' && draft.layer !== layer) {
      steps.push({ kind: 'park', key: draft.key, imageId: draft.id, layer: firstSpareLayer + parked })
      parked += 1
    }
  }

  for (const { draft, layer } of targets) {
    if (draft.kind !== 'existing') continue
    const moves = draft.layer !== layer
    if (moves || draft.replacement) {
      steps.push({
        kind: 'update',
        key: draft.key,
        imageId: draft.id,
        layer: moves ? layer : undefined,
        file: draft.replacement ?? undefined,
      })
    }
  }

  for (const { draft, layer } of targets) {
    if (draft.kind === 'new') steps.push({ kind: 'add', key: draft.key, file: draft.file, layer })
  }

  return steps
}

export interface StoreImageChangeSummary {
  logo: boolean
  added: number
  replaced: number
  removed: number
  reordered: boolean
}

/** What saving will do to the images, for the confirmation step. */
export function summarizeStoreImageChanges(
  saved: StoreBackgroundImage[],
  changes: StoreImageChanges,
): StoreImageChangeSummary {
  const drafts = changes.backgroundImages
  const kept = drafts.filter((draft) => draft.kind === 'existing')

  return {
    logo: changes.logo !== null,
    added: drafts.filter((draft) => draft.kind === 'new').length,
    replaced: kept.filter((draft) => draft.replacement).length,
    removed: saved.length - kept.length,
    reordered: drafts.some((draft, index) => draft.kind === 'existing' && draft.layer !== index + 1),
  }
}

/** The multipart body for the logo endpoint. */
export function toLogoFormData(logo: File): FormData {
  const body = new FormData()
  body.append('logo', logo)
  return body
}

/** The multipart body for adding or updating a background image. Leaves out what isn't changing. */
export function toBackgroundImageFormData({ image, layer }: { image?: File; layer?: number }): FormData {
  const body = new FormData()
  if (image) body.append('image', image)
  if (layer !== undefined) body.append('layer', String(layer))
  return body
}
