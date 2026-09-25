import { apiSlice } from '@/services/api/apiSlice'
import { toPageResult } from '@/services/api/pagination'
import type { ApiResponse, PageResult, Paginated } from '@/types/api'
import type {
  CreateStoreInventoryPayload,
  InventorySummary,
  StoreInventoriesQueryArgs,
  StoreInventory,
  UpdateStoreInventoryPayload,
} from './storeInventories.types'
import { toStoreInventoriesParams } from './storeInventories.utils'

const unwrap = <T>(response: ApiResponse<T>) => response.data

/** Cache ids for one store's lists and its counts, so a change refreshes both. */
const storeListId = (storeId: number) => `STORE-${storeId}`
const storeSummaryId = (storeId: number) => `SUMMARY-${storeId}`

export const storeInventoriesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** One page of a store's inventory. Search, the status filter and paging happen on the API. */
    getStoreInventories: builder.query<PageResult<StoreInventory>, StoreInventoriesQueryArgs>({
      query: (args) => ({ url: `/store-inventories/${args.storeId}`, params: toStoreInventoriesParams(args) }),
      transformResponse: (response: ApiResponse<Paginated<StoreInventory>>) => toPageResult(response.data),
      providesTags: (result, _error, { storeId }) => [
        { type: 'StoreInventories', id: storeListId(storeId) },
        ...(result?.items ?? []).map(({ id }) => ({ type: 'StoreInventories' as const, id })),
      ],
    }),

    /**
     * A product's records at a store (at most one per variation), so the Add dialog can tell what's
     * already stocked without loading the whole inventory.
     */
    getProductInventories: builder.query<StoreInventory[], { storeId: number; productId: number }>({
      query: ({ storeId, productId }) => ({
        url: `/store-inventories/${storeId}`,
        params: { product_id: productId, pagination: 'none' },
      }),
      transformResponse: (response: ApiResponse<Paginated<StoreInventory> | StoreInventory[]>) =>
        toPageResult(response.data).items,
      providesTags: (_inventories, _error, { storeId }) => [{ type: 'StoreInventories', id: storeListId(storeId) }],
    }),

    /** The four counts for the summary cards. */
    getStoreInventorySummary: builder.query<InventorySummary, number>({
      query: (storeId) => `/store-inventories/${storeId}/summary`,
      transformResponse: unwrap<InventorySummary>,
      providesTags: (_summary, _error, storeId) => [{ type: 'StoreInventories', id: storeSummaryId(storeId) }],
    }),

    getStoreInventory: builder.query<StoreInventory, { storeId: number; inventoryId: number }>({
      query: ({ storeId, inventoryId }) => `/store-inventories/${storeId}/${inventoryId}`,
      transformResponse: unwrap<StoreInventory>,
      providesTags: (_inventory, _error, { inventoryId }) => [{ type: 'StoreInventories', id: inventoryId }],
    }),

    /** Adds a product (or one of its variations) to the store with its initial stock. */
    createStoreInventory: builder.mutation<StoreInventory, { storeId: number; payload: CreateStoreInventoryPayload }>({
      query: ({ storeId, payload }) => ({ url: `/store-inventories/${storeId}`, method: 'POST', body: payload }),
      transformResponse: unwrap<StoreInventory>,
      // The store list's counts come from GET /stores, so those refresh too.
      invalidatesTags: (_inventory, _error, { storeId }) => [
        { type: 'StoreInventories', id: storeListId(storeId) },
        { type: 'StoreInventories', id: storeSummaryId(storeId) },
        { type: 'Stores', id: 'LIST' },
      ],
    }),

    /** Sets the stock on hand and the low-stock threshold. Reserved stock is the order system's. */
    updateStoreInventory: builder.mutation<
      StoreInventory,
      { storeId: number; inventoryId: number; payload: UpdateStoreInventoryPayload }
    >({
      query: ({ storeId, inventoryId, payload }) => ({
        url: `/store-inventories/${storeId}/${inventoryId}`,
        method: 'PATCH',
        body: payload,
      }),
      transformResponse: unwrap<StoreInventory>,
      invalidatesTags: (_inventory, _error, { storeId, inventoryId }) => [
        { type: 'StoreInventories', id: inventoryId },
        { type: 'StoreInventories', id: storeListId(storeId) },
        { type: 'StoreInventories', id: storeSummaryId(storeId) },
        { type: 'Stores', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetStoreInventoriesQuery,
  useGetProductInventoriesQuery,
  useGetStoreInventorySummaryQuery,
  useGetStoreInventoryQuery,
  useCreateStoreInventoryMutation,
  useUpdateStoreInventoryMutation,
} = storeInventoriesApi
