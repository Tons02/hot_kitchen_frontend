import { apiSlice } from '@/services/api/apiSlice'
import type { ApiResponse } from '@/types/api'
import type { AddCartItemRequest, Cart, UpdateCartItemRequest } from './cart.types'

const unwrap = (response: ApiResponse<Cart>) => response.data

/**
 * Every cart change answers with the whole cart, priced again. Writing it straight into the cached
 * `getCart` result updates the header count and the cart panel without another request.
 */
async function storeReturnedCart(
  _arg: unknown,
  { dispatch, queryFulfilled }: { dispatch: (action: unknown) => unknown; queryFulfilled: Promise<{ data: Cart }> },
) {
  try {
    const { data } = await queryFulfilled
    dispatch(cartApi.util.upsertQueryData('getCart', undefined, data))
  } catch {
    // The caller shows the error; the cached cart stays as it was.
  }
}

export const cartApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** The signed-in customer's cart with live prices (an empty cart when they have none). */
    getCart: builder.query<Cart, void>({
      query: () => '/cart',
      transformResponse: unwrap,
      providesTags: ['Cart'],
    }),

    addCartItem: builder.mutation<Cart, AddCartItemRequest>({
      query: (body) => ({ url: '/cart/items', method: 'POST', body }),
      transformResponse: unwrap,
      onQueryStarted: storeReturnedCart,
    }),

    updateCartItem: builder.mutation<Cart, UpdateCartItemRequest>({
      query: ({ itemId, ...body }) => ({ url: `/cart/items/${itemId}`, method: 'PATCH', body }),
      transformResponse: unwrap,
      onQueryStarted: storeReturnedCart,
    }),

    removeCartItem: builder.mutation<Cart, number>({
      query: (itemId) => ({ url: `/cart/items/${itemId}`, method: 'DELETE' }),
      transformResponse: unwrap,
      onQueryStarted: storeReturnedCart,
    }),

    clearCart: builder.mutation<Cart, void>({
      query: () => ({ url: '/cart', method: 'DELETE' }),
      transformResponse: unwrap,
      onQueryStarted: storeReturnedCart,
    }),

    applyCartVoucher: builder.mutation<Cart, string>({
      query: (code) => ({ url: '/cart/voucher', method: 'POST', body: { code } }),
      transformResponse: unwrap,
      onQueryStarted: storeReturnedCart,
    }),

    removeCartVoucher: builder.mutation<Cart, void>({
      query: () => ({ url: '/cart/voucher', method: 'DELETE' }),
      transformResponse: unwrap,
      onQueryStarted: storeReturnedCart,
    }),
  }),
})

export const {
  useGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useApplyCartVoucherMutation,
  useRemoveCartVoucherMutation,
} = cartApi
