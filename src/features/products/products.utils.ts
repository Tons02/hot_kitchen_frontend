import { getLayeredImageDrafts } from '@/lib/layered-images'
import { formatPeso } from '@/lib/money'
import { DEFAULT_PRODUCT_FILTERS, NO_CATEGORY } from './products.constants'
import type { ProductAddOnFormValue, ProductFormValues, ProductVariationFormValue } from './products.schemas'
import type {
  Product,
  ProductFilterValues,
  ProductImage,
  ProductListView,
  ProductPayload,
  ProductsQueryArgs,
  ProductStatus,
} from './products.types'

export function getProductStatus(product: Pick<Product, 'is_available'>, view: ProductListView): ProductStatus {
  if (view === 'archived') return 'archived'
  return product.is_available ? 'available' : 'unavailable'
}

/** The first image by layer, for thumbnails. */
export function getProductCoverUrl(product: Pick<Product, 'images'>): string | undefined {
  const images = product.images ?? []
  return images.reduce<ProductImage | undefined>((first, image) => (!first || image.layer < first.layer ? image : first), undefined)
    ?.image_url
}

/** "15 min", or "1 hr 30 min" for longer preparation times. */
export function formatPreparationTime(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`
}

/** How many of the popover's filters differ from the defaults, for the badge on the Filters button. */
export function countActiveFilters(filters: ProductFilterValues, view: ProductListView): number {
  return [
    filters.storeId !== DEFAULT_PRODUCT_FILTERS.storeId,
    filters.categoryId !== DEFAULT_PRODUCT_FILTERS.categoryId,
    filters.featured !== DEFAULT_PRODUCT_FILTERS.featured,
    // Every archived product shows as Archived, so availability only applies to current ones.
    view === 'current' && filters.available !== DEFAULT_PRODUCT_FILTERS.available,
  ].filter(Boolean).length
}

/**
 * Query params for `GET /products`. Filters map to ProductFilter::$allowedFilters, `search` to its
 * $columnSearch; archived products are `status=inactive`. `pagination` is left out, which makes the
 * API return a paginator with totals.
 */
export function toProductsParams({ view, search, storeId, categoryId, featured, available, page, perPage }: ProductsQueryArgs) {
  const params: Record<string, string | number> = { page, per_page: perPage }
  const term = search.trim()

  if (term) params.search = term
  if (storeId !== 'all') params.store_id = storeId
  if (categoryId !== 'all') params.category_id = categoryId
  if (featured !== 'all') params.is_featured = featured === 'yes' ? 1 : 0
  if (view === 'archived') params.status = 'inactive'
  else if (available !== 'all') params.is_available = available === 'yes' ? 1 : 0

  return params
}

export function getProductFormDefaults(product?: Product): ProductFormValues {
  return {
    images: getLayeredImageDrafts(product?.images),
    store_id: product ? String(product.store_id) : '',
    category_id: product?.category_id ? String(product.category_id) : NO_CATEGORY,
    name: product?.name ?? '',
    description: product?.description ?? '',
    sku: product?.sku ?? '',
    base_price: product ? String(Number(product.base_price)) : '',
    preparation_time: product?.preparation_time != null ? String(product.preparation_time) : '',
    is_featured: product?.is_featured ?? false,
    is_available: product?.is_available ?? true,
    variations: (product?.variations ?? []).map((variation) => ({
      record_id: String(variation.id),
      name: variation.name,
      price: String(Number(variation.price)),
      sku: variation.sku ?? '',
      is_available: variation.is_available,
    })),
    add_ons: (product?.add_ons ?? []).map((addOn) => ({
      record_id: String(addOn.id),
      name: addOn.name,
      price: String(Number(addOn.price)),
      is_available: addOn.is_available,
    })),
  }
}

export const EMPTY_VARIATION: ProductVariationFormValue = { record_id: '', name: '', price: '', sku: '', is_available: true }
export const EMPTY_ADD_ON: ProductAddOnFormValue = { record_id: '', name: '', price: '', is_available: true }

/** A saved row keeps its id so the API updates it; a new row goes without one and is added. */
const withRecordId = (recordId: string) => (recordId ? { id: Number(recordId) } : {})

/**
 * Converts validated form values into the API payload. Only call with values that passed `productSchema`.
 * New products have no saved rows, so their variations and add-ons all go without ids, as the API requires.
 */
export function toProductPayload(values: ProductFormValues): ProductPayload {
  return {
    store_id: Number(values.store_id),
    category_id: values.category_id === NO_CATEGORY ? null : Number(values.category_id),
    name: values.name,
    description: values.description || null,
    sku: values.sku || null,
    base_price: Number(values.base_price),
    preparation_time: values.preparation_time ? Number(values.preparation_time) : null,
    is_featured: values.is_featured,
    is_available: values.is_available,
    variations: values.variations.map((variation) => ({
      ...withRecordId(variation.record_id),
      name: variation.name,
      price: Number(variation.price),
      sku: variation.sku || null,
      is_available: variation.is_available,
    })),
    add_ons: values.add_ons.map((addOn) => ({
      ...withRecordId(addOn.record_id),
      name: addOn.name,
      price: Number(addOn.price),
      is_available: addOn.is_available,
    })),
  }
}

export interface ProductOptionChanges {
  added: number
  changed: number
  /** Saved rows left out of the list. The API archives them. */
  removed: number
}

/** What saving will do to a product's variations or add-ons, for the confirmation step. */
export function summarizeOptionChanges(
  saved: { id: number; name: string; price: string; sku?: string | null; is_available: boolean }[],
  rows: { record_id: string; name: string; price: string; sku?: string; is_available: boolean }[],
): ProductOptionChanges {
  const savedById = new Map(saved.map((row) => [String(row.id), row]))
  const kept = rows.filter((row) => row.record_id && savedById.has(row.record_id))

  return {
    added: rows.length - kept.length,
    changed: kept.filter((row) => {
      const before = savedById.get(row.record_id)
      return (
        !before ||
        before.name !== row.name ||
        Number(before.price) !== Number(row.price) ||
        (before.sku ?? '') !== (row.sku ?? '') ||
        before.is_available !== row.is_available
      )
    }).length,
    removed: saved.length - kept.length,
  }
}

/**
 * What a customer actually pays. A chosen variation's price replaces the base price, so a product with
 * variations costs whatever its variations cost: "₱100.00 – ₱150.00", or one price when they match.
 */
export function getProductPriceLabel(product: Pick<Product, 'base_price' | 'variations'>): string {
  const prices = (product.variations ?? []).map((variation) => Number(variation.price)).filter(Number.isFinite)
  if (prices.length === 0) return formatPeso(product.base_price)
  const low = Math.min(...prices)
  const high = Math.max(...prices)
  return low === high ? formatPeso(low) : `${formatPeso(low)} – ${formatPeso(high)}`
}

/** How a variation's price compares with the base price it replaces: "+₱50.00", "−₱10.00" or "Same as base". */
export function formatPriceDifference(price: string | number, basePrice: string | number): string | null {
  const difference = Number(price) - Number(basePrice)
  if (!Number.isFinite(difference)) return null
  if (difference === 0) return 'Same as base price'
  return `${difference > 0 ? '+' : '−'}${formatPeso(Math.abs(difference))} vs base price`
}
