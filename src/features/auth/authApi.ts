import { apiSlice } from '@/services/api/apiSlice'
import type { LoginRequest, LoginResponse } from './auth.types'
import { loggedIn, loggedOut } from './authSlice'

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({ url: '/login', method: 'POST', body: credentials }),
      async onQueryStarted(_credentials, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(loggedIn({ token: data.token, user: data.data }))
        } catch {
          // The form that called the mutation renders the error.
        }
      },
    }),

    logout: builder.mutation<void, void>({
      query: () => ({ url: '/logout', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } catch {
          // An already-revoked token or an unreachable server must not keep the user signed in.
        } finally {
          dispatch(loggedOut())
        }
      },
    }),
  }),
})

export const { useLoginMutation, useLogoutMutation } = authApi
