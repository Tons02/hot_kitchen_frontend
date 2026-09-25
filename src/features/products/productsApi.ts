import { toLayeredImageFormData } from '@/lib/layered-images'
import { apiSlice } from '@/services/api/apiSlice'
import { toPageResult } from '@/services/api/pagination'
import type { ApiResponse, PageResult, Paginated } from '@/types/api'
import type {
  AddProductImageRequest,
  Product,
  ProductImage,
  ProductListView,
  ProductPayload,
  ProductsQueryArgs,
  UpdateProductImageRequest,
} from './products.types'
import { toProductsParams } from './products.utils'

const unwrap = <T>(response: ApiResponse<T>) => response.data

/** Cache ids for the two list views, so a mutation can refresh just the lists it affects. */
export const LIST_ID: Record<ProductListView, string> = { current: 'LIST', archived: 'ARCHIVED' }

export const productsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * One page of products with their category, images, variations and add-ons. Search, filters and
     * paging happen on the API. The table pages through it; the mobile card list stays on page 1 and
     * raises `perPage` as it scrolls.
     */
    getProducts: builder.query<PageResult<Product>, ProductsQueryArgs>({
      query: (args) => ({ url: '/products', params: toProductsParams(args) }),
      transformResponse: (response: ApiResponse<Paginated<Product>>) => toPageResult(response.data),
      providesTags: (result, _error, { view }) => [
        { type: 'Products', id: LIST_ID[view] },
        ...(result?.items ?? []).map(({ id }) => ({ type: 'Products' as const, id })),
      ],
    }),

    /** The first page of one store's current products matching `search` (name, SKU, description), for pickers. */
    searchProducts: builder.query<PageResult<Product>, { storeId: number; search: string; perPage: number }>({
      query: ({ storeId, search, perPage }) => ({
        url: '/products',
        params: { store_id: storeId, page: 1, per_page: perPage, ...(search.trim() ? { search: search.trim() } : {}) },
      }),
      transformResponse: (response: ApiResponse<Paginated<Product>>) => toPageResult(response.data),
      // Tagged like the current list, so product changes refresh the pickers too.
      providesTags: [{ type: 'Products', id: LIST_ID.current }],
    }),

    /** One current product with its relations. The API can't find archived ones here. */
    getProduct: builder.query<Product, number>({
      query: (id) => `/products/${id}`,
      transformResponse: unwrap<Product>,
      providesTags: (_product, _error, id) => [{ type: 'Products', id }],
    }),

    /** Creates the product with its variations and add-ons in one transaction. Images follow separately. */
    createProduct: builder.mutation<Product, ProductPayload>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      transformResponse: unwrap<Product>,
      invalidatesTags: [{ type: 'Products', id: LIST_ID.current }],
    }),

    /**
     * Saves the product and replaces its variations and add-ons: rows with an id are updated, rows
     * without one are added, and saved rows left out are archived.
     */
    updateProduct: builder.mutation<Product, { id: number; payload: ProductPayload }>({
      query: ({ id, payload }) => ({ url: `/products/${id}`, method: 'PATCH', body: payload }),
      transformResponse: unwrap<Product>,
      invalidatesTags: (_product, _error, { id }) => [
        { type: 'Products', id },
        { type: 'Products', id: LIST_ID.current },
      ],
    }),

    /*
     * The image endpoints below don't invalidate anything: a save runs several of them in a row,
     * and useSaveProductImages refreshes the product once they've all finished.
     */

    /** Adds one image on the given layer (layers are unique per product). */
    addProductImage: builder.mutation<ProductImage, AddProductImageRequest>({
      query: ({ productId, image, layer }) => ({
        url: `/products/${productId}/images`,
        method: 'POST',
        body: toLayeredImageFormData({ image, layer }),
      }),
      transformResponse: unwrap<ProductImage>,
    }),

    /** Changes an image's file, its layer, or both. */
    updateProductImage: builder.mutation<ProductImage, UpdateProductImageRequest>({
      query: ({ productId, imageId, image, layer }) => ({
        url: `/products/${productId}/images/${imageId}`,
        method: 'POST',
        body: toLayeredImageFormData({ image, layer }),
      }),
      transformResponse: unwrap<ProductImage>,
    }),

    deleteProductImage: builder.mutation<void, { productId: number; imageId: number }>({
      query: ({ productId, imageId }) => ({ url: `/products/${productId}/images/${imageId}`, method: 'DELETE' }),
    }),

    /** Soft-deletes the product; it moves from the current list to the archived one. */
    archiveProduct: builder.mutation<Product, number>({
      // The API toggles: the same call archives a current product and restores an archived one.
      query: (id) => ({ url: `/products-archived/${id}`, method: 'PUT' }),
      transformResponse: unwrap<Product>,
      invalidatesTags: (_product, _error, id) => [
        { type: 'Products', id },
        { type: 'Products', id: LIST_ID.current },
        { type: 'Products', id: LIST_ID.archived },
      ],
    }),

    /** Brings an archived product back to the current list. */
    restoreProduct: builder.mutation<Product, number>({
      query: (id) => ({ url: `/products-archived/${id}`, method: 'PUT' }),
      transformResponse: unwrap<Product>,
      invalidatesTags: (_product, _error, id) => [
        { type: 'Products', id },
        { type: 'Products', id: LIST_ID.current },
        { type: 'Products', id: LIST_ID.archived },
      ],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useSearchProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useAddProductImageMutation,
  useUpdateProductImageMutation,
  useDeleteProductImageMutation,
  useArchiveProductMutation,
  useRestoreProductMutation,
} = productsApi
