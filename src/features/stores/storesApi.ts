import { toLayeredImageFormData } from '@/lib/layered-images'
import { apiSlice } from '@/services/api/apiSlice'
import { toPageResult } from '@/services/api/pagination'
import type { ApiResponse, PageResult, Paginated } from '@/types/api'
import type {
  AddBackgroundImageRequest,
  Store,
  StoreBackgroundImage,
  StoreListView,
  StoreOperatingHour,
  StorePayload,
  StoresQueryArgs,
  UpdateBackgroundImageRequest,
  UpdateOperatingHoursRequest,
} from './stores.types'
import { toLogoFormData, toStoresParams } from './stores.utils'

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

    /** The first page of current stores matching `search`, for pickers. Never loads the whole list. */
    searchStores: builder.query<PageResult<Store>, { search: string; perPage: number }>({
      query: ({ search, perPage }) => ({
        url: '/stores',
        params: { page: 1, per_page: perPage, ...(search.trim() ? { search: search.trim() } : {}) },
      }),
      transformResponse: (response: ApiResponse<Paginated<Store>>) => toPageResult(response.data),
      providesTags: [{ type: 'Stores', id: LIST_ID.current }],
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
        body: toLayeredImageFormData({ image, layer }),
      }),
      transformResponse: unwrap<StoreBackgroundImage>,
    }),

    /** Changes a background image's file, its layer, or both. */
    updateStoreBackgroundImage: builder.mutation<StoreBackgroundImage, UpdateBackgroundImageRequest>({
      query: ({ storeId, imageId, image, layer }) => ({
        url: `/stores/${storeId}/background-images/${imageId}`,
        method: 'POST',
        body: toLayeredImageFormData({ image, layer }),
      }),
      transformResponse: unwrap<StoreBackgroundImage>,
    }),

    deleteStoreBackgroundImage: builder.mutation<void, { storeId: number; imageId: number }>({
      query: ({ storeId, imageId }) => ({
        url: `/stores/${storeId}/background-images/${imageId}`,
        method: 'DELETE',
      }),
    }),

    /** The store's weekly schedule, one row per day it has hours for. */
    getStoreOperatingHours: builder.query<StoreOperatingHour[], number>({
      query: (storeId) => `/stores/${storeId}/operating-hours`,
      transformResponse: unwrap<StoreOperatingHour[]>,
      providesTags: (_hours, _error, storeId) => [{ type: 'StoreOperatingHours', id: storeId }],
    }),

    /** Replaces the whole week in one call. Store rows embed their hours, so the lists refresh too. */
    updateStoreOperatingHours: builder.mutation<StoreOperatingHour[], UpdateOperatingHoursRequest>({
      query: ({ storeId, operatingHours }) => ({
        url: `/stores/${storeId}/operating-hours`,
        method: 'PUT',
        body: { operating_hours: operatingHours },
      }),
      transformResponse: unwrap<StoreOperatingHour[]>,
      invalidatesTags: (_hours, _error, { storeId }) => [
        { type: 'StoreOperatingHours', id: storeId },
        { type: 'Stores', id: storeId },
        { type: 'Stores', id: LIST_ID.current },
      ],
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
  useSearchStoresQuery,
  useGetStorePageQuery,
  useGetStoreQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useUploadStoreLogoMutation,
  useAddStoreBackgroundImageMutation,
  useUpdateStoreBackgroundImageMutation,
  useDeleteStoreBackgroundImageMutation,
  useGetStoreOperatingHoursQuery,
  useUpdateStoreOperatingHoursMutation,
  useArchiveStoreMutation,
  useRestoreStoreMutation,
} = storesApi
