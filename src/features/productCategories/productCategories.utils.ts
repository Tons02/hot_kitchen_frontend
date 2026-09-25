import { DEFAULT_PRODUCT_CATEGORY_FILTERS } from './productCategories.constants'
import type { ProductCategoryFormValues } from './productCategories.schemas'
import type {
  ProductCategory,
  ProductCategoriesQueryArgs,
  ProductCategoryFilterValues,
  ProductCategoryListView,
  ProductCategoryPayload,
  ProductCategoryStatus,
} from './productCategories.types'

/** The API returns `store_id` as a string right after a create or update; everywhere else it's a number. */
export function normalizeProductCategory(category: ProductCategory): ProductCategory {
  return { ...category, store_id: Number(category.store_id) }
}

export function getProductCategoryStatus(view: ProductCategoryListView): ProductCategoryStatus {
  return view === 'archived' ? 'archived' : 'active'
}

/** How many of the popover's filters differ from the defaults, for the badge on the Filters button. */
export function countActiveFilters(filters: ProductCategoryFilterValues): number {
  return [filters.storeId !== DEFAULT_PRODUCT_CATEGORY_FILTERS.storeId].filter(Boolean).length
}

/**
 * Query params for `GET /product-categories`. `store_id` maps to ProductCategoryFilter::$allowedFilters,
 * `search` to its $columnSearch; archived categories are `status=inactive`. `pagination` is left out,
 * which makes the API return a paginator with totals.
 */
export function toProductCategoriesParams({ view, search, storeId, page, perPage }: ProductCategoriesQueryArgs) {
  const params: Record<string, string | number> = { page, per_page: perPage }
  const term = search.trim()

  if (term) params.search = term
  if (storeId !== 'all') params.store_id = storeId
  if (view === 'archived') params.status = 'inactive'

  return params
}

export function getProductCategoryFormDefaults(category?: ProductCategory): ProductCategoryFormValues {
  return {
    image: null,
    store_id: category ? String(category.store_id) : '',
    name: category?.name ?? '',
    description: category?.description ?? '',
  }
}

/** Converts validated form values into the API payload. Only call with values that passed the schema. */
export function toProductCategoryPayload(values: ProductCategoryFormValues): ProductCategoryPayload {
  return {
    store_id: Number(values.store_id),
    name: values.name,
    description: values.description,
    image: values.image ?? undefined,
  }
}

/**
 * The multipart body for create and update. PHP doesn't parse multipart PATCH bodies, so updates go
 * out as POST with `_method=PATCH`.
 */
export function toProductCategoryFormData(payload: ProductCategoryPayload, options: { method?: 'PATCH' } = {}): FormData {
  const body = new FormData()
  body.append('store_id', String(payload.store_id))
  body.append('name', payload.name)
  body.append('description', payload.description)
  if (payload.image) body.append('image', payload.image)
  if (options.method) body.append('_method', options.method)
  return body
}
