import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithAuth } from './baseQuery'

/**
 * The only RTK Query API in the app. Features add endpoints from their own
 * `<feature>Api.ts` with `apiSlice.injectEndpoints()`. Never call `createApi` again.
 */
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  // After the connection drops and comes back, lists and records on screen reload themselves.
  refetchOnReconnect: true,
  tagTypes: ['Users', 'Stores', 'StoreOperatingHours', 'StoreInventories', 'StoreVouchers', 'ProductCategories', 'Products', 'Cart', 'Addresses'],
  endpoints: () => ({}),
})
