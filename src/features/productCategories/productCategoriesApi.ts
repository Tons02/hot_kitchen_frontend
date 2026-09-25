import { apiSlice } from '@/services/api/apiSlice'
import { toPageResult } from '@/services/api/pagination'
import type { ApiResponse, PageResult, Paginated } from '@/types/api'
import type {
  ProductCategory,
  ProductCategoriesQueryArgs,
  ProductCategoryListView,
  ProductCategoryPayload,
} from './productCategories.types'
import { normalizeProductCategory, toProductCategoriesParams, toProductCategoryFormData } from './productCategories.utils'

const unwrap = (response: ApiResponse<ProductCategory>) => normalizeProductCategory(response.data)

/** Cache ids for the two list views, so a mutation can refresh just the lists it affects. */
const LIST_ID: Record<ProductCategoryListView, string> = { current: 'LIST', archived: 'ARCHIVED' }

export const productCategoriesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * One page of categories. Search, the store filter and paging happen on the API. The table pages
     * through it; the mobile card list stays on page 1 and raises `perPage` as it scrolls.
     */
    getProductCategories: builder.query<PageResult<ProductCategory>, ProductCategoriesQueryArgs>({
      query: (args) => ({ url: '/product-categories', params: toProductCategoriesParams(args) }),
      transformResponse: (response: ApiResponse<Paginated<ProductCategory>>) => {
        const page = toPageResult(response.data)
        return { ...page, items: page.items.map(normalizeProductCategory) }
      },
      providesTags: (result, _error, { view }) => [
        { type: 'ProductCategories', id: LIST_ID[view] },
        ...(result?.items ?? []).map(({ id }) => ({ type: 'ProductCategories' as const, id })),
      ],
    }),

    /**
     * The first page of one store's current categories matching `search`, for pickers. Never loads
     * the whole list, which can run to thousands.
     */
    searchProductCategories: builder.query<PageResult<ProductCategory>, { storeId: number; search: string; perPage: number }>({
      query: ({ storeId, search, perPage }) => ({
        url: '/product-categories',
        params: { store_id: storeId, page: 1, per_page: perPage, ...(search.trim() ? { search: search.trim() } : {}) },
      }),
      transformResponse: (response: ApiResponse<Paginated<ProductCategory>>) => {
        const page = toPageResult(response.data)
        return { ...page, items: page.items.map(normalizeProductCategory) }
      },
      // Tagged like the current list, so adding, editing or archiving a category refreshes the pickers too.
      providesTags: [{ type: 'ProductCategories', id: LIST_ID.current }],
    }),

    /** One current category. The API can't find archived ones here. */
    getProductCategory: builder.query<ProductCategory, number>({
      query: (id) => `/product-categories/${id}`,
      transformResponse: unwrap,
      providesTags: (_category, _error, id) => [{ type: 'ProductCategories', id }],
    }),

    createProductCategory: builder.mutation<ProductCategory, ProductCategoryPayload>({
      query: (payload) => ({ url: '/product-categories', method: 'POST', body: toProductCategoryFormData(payload) }),
      transformResponse: unwrap,
      invalidatesTags: [{ type: 'ProductCategories', id: LIST_ID.current }],
    }),

    updateProductCategory: builder.mutation<ProductCategory, { id: number; payload: ProductCategoryPayload }>({
      query: ({ id, payload }) => ({
        url: `/product-categories/${id}`,
        method: 'POST',
        body: toProductCategoryFormData(payload, { method: 'PATCH' }),
      }),
      transformResponse: unwrap,
      invalidatesTags: (_category, _error, { id }) => [
        { type: 'ProductCategories', id },
        { type: 'ProductCategories', id: LIST_ID.current },
      ],
    }),

    /** Soft-deletes the category; it moves from the current list to the archived one. */
    archiveProductCategory: builder.mutation<ProductCategory, number>({
      // The API toggles: the same call archives a current category and restores an archived one.
      query: (id) => ({ url: `/product-categories-archived/${id}`, method: 'PUT' }),
      transformResponse: unwrap,
      invalidatesTags: (_category, _error, id) => [
        { type: 'ProductCategories', id },
        { type: 'ProductCategories', id: LIST_ID.current },
        { type: 'ProductCategories', id: LIST_ID.archived },
      ],
    }),

    /** Brings an archived category back to the current list. */
    restoreProductCategory: builder.mutation<ProductCategory, number>({
      query: (id) => ({ url: `/product-categories-archived/${id}`, method: 'PUT' }),
      transformResponse: unwrap,
      invalidatesTags: (_category, _error, id) => [
        { type: 'ProductCategories', id },
        { type: 'ProductCategories', id: LIST_ID.current },
        { type: 'ProductCategories', id: LIST_ID.archived },
      ],
    }),
  }),
})

export const {
  useGetProductCategoriesQuery,
  useSearchProductCategoriesQuery,
  useGetProductCategoryQuery,
  useCreateProductCategoryMutation,
  useUpdateProductCategoryMutation,
  useArchiveProductCategoryMutation,
  useRestoreProductCategoryMutation,
} = productCategoriesApi
