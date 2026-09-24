import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/app/store'
import { appConfig } from '@/config/app'
import { selectIsAuthenticated, selectToken, sessionExpired } from '@/features/auth/authSlice'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_HOTKITCHEN_BACKEND_ENDPOINT,
  timeout: appConfig.apiTimeoutMs,
  prepareHeaders: (headers, { getState }) => {
    // Laravel only returns JSON errors (instead of redirects or HTML) when the client asks for JSON.
    headers.set('Accept', 'application/json')

    const token = selectToken(getState() as RootState)
    if (token) headers.set('Authorization', `Bearer ${token}`)

    return headers
  },
})

/** A 401 from these endpoints means bad credentials or an already-revoked token, not an expired session. */
const SESSION_AGNOSTIC_ENDPOINTS: ReadonlySet<string> = new Set(['login', 'logout'])

export const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions)

  if (
    result.error?.status === 401 &&
    !SESSION_AGNOSTIC_ENDPOINTS.has(api.endpoint) &&
    selectIsAuthenticated(api.getState() as RootState)
  ) {
    api.dispatch(sessionExpired())
  }

  return result
}
