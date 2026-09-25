/** Mirrors the API's ProductCategoryResource. */
export interface ProductCategory {
  id: number
  /** The API sometimes sends this as a string ("1"); the endpoints normalize it to a number. */
  store_id: number
  name: string
  description: string | null
  /** Public storage URL, so <img> can use it directly. Absent when no image was uploaded. */
  image_url?: string
  created_at: string
  updated_at: string
  /** Set while the category is archived (soft-deleted). */
  deleted_at: string | null
}

/** Which list to load: current categories, or soft-deleted (archived) ones. */
export type ProductCategoryListView = 'current' | 'archived'

export type ProductCategoryStatus = 'active' | 'archived'

/** A row action: edit opens the form dialog, archive and restore a confirmation. */
export interface ProductCategoryAction {
  type: 'edit' | 'archive' | 'restore'
  category: ProductCategory
}

/** The filter popover's fields. 'all' means "no filter". */
export interface ProductCategoryFilterValues {
  storeId: string
}

/** Everything that selects which categories the list asks the API for (the page aside). */
export interface ProductCategoriesQueryFilters extends ProductCategoryFilterValues {
  view: ProductCategoryListView
  /** Sent as `search`; the API matches it against ProductCategoryFilter::$columnSearch (name, description). */
  search: string
}

export interface ProductCategoriesQueryArgs extends ProductCategoriesQueryFilters {
  page: number
  perPage: number
}

/** Everything `POST /product-categories` and its update accept (ProductCategoryRequest). Sent as multipart. */
export interface ProductCategoryPayload {
  store_id: number
  name: string
  /** '' clears it. */
  description: string
  /** Only sent when a new image was chosen; the current one stays otherwise. */
  image?: File
}
