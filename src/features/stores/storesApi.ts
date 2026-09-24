import { apiSlice } from '@/services/api/apiSlice'
import type { ApiResponse } from '@/types/api'
import type { Store } from './stores.types'

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
  }),
})

export const { useGetStoresQuery } = storesApi
