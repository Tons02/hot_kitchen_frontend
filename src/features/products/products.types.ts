import type { ProductCategory } from '@/features/productCategories/productCategories.types'
import type { LayeredImage } from '@/lib/layered-images'

/** A product photo, as embedded in ProductResource. Public URL (no auth needed). */
export interface ProductImage extends LayeredImage {
  product_id: number
}

/** Mirrors the API's ProductVariationResource, e.g. Regular or Large. Prices are decimal strings ("100.00"). */
export interface ProductVariation {
  id: number
  product_id: number
  name: string
  price: string
  sku: string | null
  is_available: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** Mirrors the API's ProductAddOnResource, e.g. Extra Cheese. */
export interface ProductAddOn {
  id: number
  product_id: number
  name: string
  price: string
  is_available: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** Mirrors the API's ProductResource. Relations are present when the endpoint loads them. */
export interface Product {
  id: number
  store_id: number
  category_id: number | null
  /** Null when the product has no category, or its category is archived. */
  category?: ProductCategory | null
  images?: ProductImage[]
  variations?: ProductVariation[]
  add_ons?: ProductAddOn[]
  name: string
  slug: string
  description: string | null
  sku: string | null
  /** A decimal string, e.g. "100.00". */
  base_price: string
  /** Minutes. */
  preparation_time: number | null
  is_featured: boolean
  is_available: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** Which list to load: current products, or soft-deleted (archived) ones. */
export type ProductListView = 'current' | 'archived'

export type ProductStatus = 'available' | 'unavailable' | 'archived'

/** A row action: view and edit open dialogs, archive and restore a confirmation. */
export interface ProductAction {
  type: 'view' | 'edit' | 'archive' | 'restore'
  product: Product
}

/** The filter popover's fields. 'all' means "no filter". */
export interface ProductFilterValues {
  storeId: string
  categoryId: string
  /** 'all', 'yes' or 'no'. */
  featured: string
  /** 'all', 'yes' or 'no'. */
  available: string
}

/** Everything that selects which products the list asks the API for (the page aside). */
export interface ProductsQueryFilters extends ProductFilterValues {
  view: ProductListView
  /** Sent as `search`; the API matches it against ProductFilter::$columnSearch (name, sku, description). */
  search: string
}

export interface ProductsQueryArgs extends ProductsQueryFilters {
  page: number
  perPage: number
}

/** On update, `id` edits that saved row; a row without one is added; saved rows left out are archived. */
export interface ProductVariationPayload {
  id?: number
  name: string
  price: number
  sku: string | null
  is_available: boolean
}

export interface ProductAddOnPayload {
  id?: number
  name: string
  price: number
  is_available: boolean
}

/**
 * Everything `POST /products` and `PATCH /products/{id}` accept (ProductRequest). Sent as JSON.
 * The variations and add-ons replace the saved lists (see `ProductVariationPayload`).
 */
export interface ProductPayload {
  store_id: number
  category_id: number | null
  name: string
  description: string | null
  sku: string | null
  base_price: number
  preparation_time: number | null
  is_featured: boolean
  is_available: boolean
  variations: ProductVariationPayload[]
  add_ons: ProductAddOnPayload[]
}

export interface AddProductImageRequest {
  productId: number
  image: File
  layer: number
}

/** Changes an existing image's file, its layer, or both. */
export interface UpdateProductImageRequest {
  productId: number
  imageId: number
  image?: File
  layer?: number
}
