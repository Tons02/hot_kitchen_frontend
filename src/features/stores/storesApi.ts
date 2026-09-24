import { apiSlice } from '@/services/api/apiSlice'
import { toPageResult } from '@/services/api/pagination'
import type { ApiResponse, PageResult, Paginated } from '@/types/api'
import type {
  AddBackgroundImageRequest,
  Store,
  StoreBackgroundImage,
  StoreListView,
  StorePayload,
  StoresQueryArgs,
  UpdateBackgroundImageRequest,
} from './stores.types'
import { toBackgroundImageFormData, toLogoFormData, toStoresParams } from './stores.utils'

const unwrap = <T>(response: ApiResponse<T>) => response.data

/** Cache ids for the two list views, so a mutation can refresh just the lists it affects. */
export const LIST_ID: Record<StoreListView, string> = { current: 'LIST', archived: 'ARCHIVED' }

export const storesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** Every store (`pagination=none`), for pickers and filters. */
    getStores: builder.query<Store[], void>({
      query: () => ({ url: '/stores', params: { pagination: 'none' } }),
      transformResponse: (response: ApiResponse<Store[]>) => response.data,
      providesTags: (stores) => [
        { type: 'Stores', id: 'LIST' },
        ...(stores ?? []).map(({ id }) => ({ type: 'Stores' as const, id })),
      ],
    }),

    /**
     * One page of stores. Search and paging happen on the API. The table pages through it;
     * the mobile card list stays on page 1 and raises `perPage` as it scrolls.
     */
    getStorePage: builder.query<PageResult<Store>, StoresQueryArgs>({
      query: (args) => ({ url: '/stores', params: toStoresParams(args) }),
      transformResponse: (response: ApiResponse<Paginated<Store>>) => toPageResult(response.data),
      providesTags: (result, _error, { view }) => [
        { type: 'Stores', id: LIST_ID[view] },
        ...(result?.items ?? []).map(({ id }) => ({ type: 'Stores' as const, id })),
      ],
    }),

    /** One store with its background images, operating hours and delivery radius. */
    getStore: builder.query<Store, number>({
      query: (id) => `/stores/${id}`,
      transformResponse: unwrap<Store>,
      providesTags: (_store, _error, id) => [{ type: 'Stores', id }],
    }),

    createStore: builder.mutation<Store, StorePayload>({
      query: (body) => ({ url: '/stores', method: 'POST', body }),
      transformResponse: unwrap<Store>,
      invalidatesTags: [{ type: 'Stores', id: LIST_ID.current }],
    }),

    updateStore: builder.mutation<Store, { id: number; payload: StorePayload }>({
      query: ({ id, payload }) => ({ url: `/stores/${id}`, method: 'PATCH', body: payload }),
      transformResponse: unwrap<Store>,
      invalidatesTags: (_store, _error, { id }) => [
        { type: 'Stores', id },
        { type: 'Stores', id: LIST_ID.current },
      ],
    }),

    /*
     * The image endpoints below don't invalidate anything: a save runs several of them in a row,
     * and useSaveStoreImages refreshes the store once they've all finished.
     */

    /** Uploads or replaces the logo. */
    uploadStoreLogo: builder.mutation<Store, { storeId: number; logo: File }>({
      query: ({ storeId, logo }) => ({ url: `/stores/${storeId}/logo`, method: 'POST', body: toLogoFormData(logo) }),
      transformResponse: unwrap<Store>,
    }),

    /** Adds one background image on the given layer (layers are unique per store). */
    addStoreBackgroundImage: builder.mutation<StoreBackgroundImage, AddBackgroundImageRequest>({
      query: ({ storeId, image, layer }) => ({
        url: `/stores/${storeId}/background-images`,
        method: 'POST',
        body: toBackgroundImageFormData({ image, layer }),
      }),
      transformResponse: unwrap<StoreBackgroundImage>,
    }),

    /** Changes a background image's file, its layer, or both. */
    updateStoreBackgroundImage: builder.mutation<StoreBackgroundImage, UpdateBackgroundImageRequest>({
      query: ({ storeId, imageId, image, layer }) => ({
        url: `/stores/${storeId}/background-images/${imageId}`,
        method: 'POST',
        body: toBackgroundImageFormData({ image, layer }),
      }),
      transformResponse: unwrap<StoreBackgroundImage>,
    }),

    deleteStoreBackgroundImage: builder.mutation<void, { storeId: number; imageId: number }>({
      query: ({ storeId, imageId }) => ({
        url: `/stores/${storeId}/background-images/${imageId}`,
        method: 'DELETE',
      }),
    }),

    /** Soft-deletes the store; it moves from the current list to the archived one. */
    archiveStore: builder.mutation<Store, number>({
      // The API toggles: the same call archives an active store and restores an archived one.
      query: (id) => ({ url: `/stores-archived/${id}`, method: 'PUT' }),
      transformResponse: unwrap<Store>,
      invalidatesTags: (_store, _error, id) => [
        { type: 'Stores', id },
        { type: 'Stores', id: LIST_ID.current },
        { type: 'Stores', id: LIST_ID.archived },
      ],
    }),

    /** Brings an archived store back to the current list. */
    restoreStore: builder.mutation<Store, number>({
      query: (id) => ({ url: `/stores-archived/${id}`, method: 'PUT' }),
      transformResponse: unwrap<Store>,
      invalidatesTags: (_store, _error, id) => [
        { type: 'Stores', id },
        { type: 'Stores', id: LIST_ID.current },
        { type: 'Stores', id: LIST_ID.archived },
      ],
    }),
  }),
})

export const {
  useGetStoresQuery,
  useGetStorePageQuery,
  useGetStoreQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useUploadStoreLogoMutation,
  useAddStoreBackgroundImageMutation,
  useUpdateStoreBackgroundImageMutation,
  useDeleteStoreBackgroundImageMutation,
  useArchiveStoreMutation,
  useRestoreStoreMutation,
} = storesApi
