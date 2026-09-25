import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/features/users/users.types'
import type { AuthSession, AuthUser } from './auth.types'
import { loadSession } from './auth.utils'

interface AuthState {
  token: string | null
  user: AuthUser | null
}

const signedOutState: AuthState = { token: null, user: null }

export const authSlice = createSlice({
  name: 'auth',
  initialState: (): AuthState => loadSession() ?? signedOutState,
  reducers: {
    loggedIn: (_state, action: PayloadAction<AuthSession>) => action.payload,
    loggedOut: () => signedOutState,
    /**
     * The signed-in user changed their own profile (`PATCH /me`). There's no "current user" endpoint,
     * so the stored copy is updated from the response.
     */
    profileUpdated: (state, action: PayloadAction<User>) => {
      if (state.user) state.user = { ...state.user, ...action.payload }
    },
    /** The API rejected the stored token (401). */
    sessionExpired: () => signedOutState,
  },
  selectors: {
    selectToken: (state) => state.token,
    selectCurrentUser: (state) => state.user,
    selectIsAuthenticated: (state) => state.token !== null,
  },
})

export const { loggedIn, loggedOut, profileUpdated, sessionExpired } = authSlice.actions
export const { selectToken, selectCurrentUser, selectIsAuthenticated } = authSlice.selectors
