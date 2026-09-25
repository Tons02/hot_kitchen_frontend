import { profileUpdated } from '@/features/auth/authSlice'
import type { User } from '@/features/users/users.types'
import { apiSlice } from '@/services/api/apiSlice'
import type { ApiResponse } from '@/types/api'
import type { AddressPayload, ChangePasswordRequest, UpdateProfileRequest, UserAddress } from './account.types'

const unwrap = <T>(response: ApiResponse<T>) => response.data

/** The signed-in user's own profile, password and saved addresses (`/me`). */
export const accountApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** Saves name and mobile changes, then updates the stored signed-in user (there's no /me read endpoint). */
    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (body) => ({ url: '/me', method: 'PATCH', body }),
      transformResponse: unwrap<User>,
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(profileUpdated(data))
        } catch {
          // The form shows the error.
        }
      },
    }),

    /** Other devices are signed out by the API; this one stays signed in. */
    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (body) => ({ url: '/me/password', method: 'PATCH', body }),
    }),

    /** Default first, then newest. */
    getAddresses: builder.query<UserAddress[], void>({
      query: () => '/me/addresses',
      transformResponse: unwrap<UserAddress[]>,
      providesTags: ['Addresses'],
    }),

    // Saving, defaulting or deleting one address can change another's default flag, so all refetch.
    createAddress: builder.mutation<UserAddress, AddressPayload>({
      query: (body) => ({ url: '/me/addresses', method: 'POST', body }),
      transformResponse: unwrap<UserAddress>,
      invalidatesTags: ['Addresses'],
    }),

    updateAddress: builder.mutation<UserAddress, { id: number; payload: AddressPayload }>({
      query: ({ id, payload }) => ({ url: `/me/addresses/${id}`, method: 'PATCH', body: payload }),
      transformResponse: unwrap<UserAddress>,
      invalidatesTags: ['Addresses'],
    }),

    setDefaultAddress: builder.mutation<UserAddress, number>({
      query: (id) => ({ url: `/me/addresses/${id}/default`, method: 'PATCH' }),
      transformResponse: unwrap<UserAddress>,
      invalidatesTags: ['Addresses'],
    }),

    deleteAddress: builder.mutation<void, number>({
      query: (id) => ({ url: `/me/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Addresses'],
    }),
  }),
})

export const {
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useSetDefaultAddressMutation,
  useDeleteAddressMutation,
} = accountApi
