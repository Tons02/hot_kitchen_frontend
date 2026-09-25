import { apiSlice } from '@/services/api/apiSlice'
import { toPageResult } from '@/services/api/pagination'
import type { ApiResponse, PageResult, Paginated } from '@/types/api'
import type { StoreVouchersQueryArgs, Voucher, VoucherPayload, VoucherUsage } from './storeVouchers.types'
import { toStoreVouchersParams } from './storeVouchers.utils'

const unwrap = <T>(response: ApiResponse<T>) => response.data

/** Cache id for one store's voucher lists (every status tab), so a change refreshes them all. */
const storeListId = (storeId: number) => `STORE-${storeId}`

type VoucherRef = { storeId: number; voucherId: number }

/** Every change refreshes the voucher itself and its store's lists (its status may move tabs). */
const invalidateVoucher = (_voucher: unknown, _error: unknown, { storeId, voucherId }: VoucherRef) => [
  { type: 'StoreVouchers' as const, id: voucherId },
  { type: 'StoreVouchers' as const, id: storeListId(storeId) },
]

export const storeVouchersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** One page of a store's vouchers. Status, search, the discount-type filter and paging happen on the API. */
    getStoreVouchers: builder.query<PageResult<Voucher>, StoreVouchersQueryArgs>({
      query: (args) => ({ url: `/store-vouchers/${args.storeId}`, params: toStoreVouchersParams(args) }),
      transformResponse: (response: ApiResponse<Paginated<Voucher>>) => toPageResult(response.data),
      providesTags: (result, _error, { storeId }) => [
        { type: 'StoreVouchers', id: storeListId(storeId) },
        ...(result?.items ?? []).map(({ id }) => ({ type: 'StoreVouchers' as const, id })),
      ],
    }),

    /** One voucher, archived ones included, with its usage count and total discount given. */
    getStoreVoucher: builder.query<Voucher, VoucherRef>({
      query: ({ storeId, voucherId }) => `/store-vouchers/${storeId}/${voucherId}`,
      transformResponse: unwrap<Voucher>,
      providesTags: (_voucher, _error, { voucherId }) => [{ type: 'StoreVouchers', id: voucherId }],
    }),

    /** Who redeemed the voucher, on which order and for how much. Newest first. */
    getVoucherUsages: builder.query<PageResult<VoucherUsage>, VoucherRef & { page: number; perPage: number }>({
      query: ({ storeId, voucherId, page, perPage }) => ({
        url: `/store-vouchers/${storeId}/${voucherId}/usages`,
        params: { page, per_page: perPage },
      }),
      transformResponse: (response: ApiResponse<Paginated<VoucherUsage>>) => toPageResult(response.data),
      providesTags: (_usages, _error, { voucherId }) => [{ type: 'StoreVouchers', id: voucherId }],
    }),

    createStoreVoucher: builder.mutation<Voucher, { storeId: number; payload: VoucherPayload }>({
      query: ({ storeId, payload }) => ({ url: `/store-vouchers/${storeId}`, method: 'POST', body: payload }),
      transformResponse: unwrap<Voucher>,
      invalidatesTags: (_voucher, _error, { storeId }) => [{ type: 'StoreVouchers', id: storeListId(storeId) }],
    }),

    /** Replaces every setting (the API resets anything left out), so always send the whole payload. */
    updateStoreVoucher: builder.mutation<Voucher, VoucherRef & { payload: VoucherPayload }>({
      query: ({ storeId, voucherId, payload }) => ({
        url: `/store-vouchers/${storeId}/${voucherId}`,
        method: 'PATCH',
        body: payload,
      }),
      transformResponse: unwrap<Voucher>,
      invalidatesTags: invalidateVoucher,
    }),

    /** Enables a disabled voucher or disables an enabled one, without editing it. */
    toggleStoreVoucher: builder.mutation<Voucher, VoucherRef>({
      query: ({ storeId, voucherId }) => ({ url: `/store-vouchers-toggle/${storeId}/${voucherId}`, method: 'PATCH' }),
      transformResponse: unwrap<Voucher>,
      invalidatesTags: invalidateVoucher,
    }),

    /** Archives a voucher, or restores an archived one (the API toggles). */
    archiveStoreVoucher: builder.mutation<Voucher, VoucherRef>({
      query: ({ storeId, voucherId }) => ({ url: `/store-vouchers-archived/${storeId}/${voucherId}`, method: 'PUT' }),
      transformResponse: unwrap<Voucher>,
      invalidatesTags: invalidateVoucher,
    }),
  }),
})

export const {
  useGetStoreVouchersQuery,
  useGetStoreVoucherQuery,
  useGetVoucherUsagesQuery,
  useCreateStoreVoucherMutation,
  useUpdateStoreVoucherMutation,
  useToggleStoreVoucherMutation,
  useArchiveStoreVoucherMutation,
} = storeVouchersApi
