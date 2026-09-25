import { isAnyOf } from '@reduxjs/toolkit'
import { toast } from 'sonner'
import { listenerMiddleware } from '@/app/listenerMiddleware'
import { API_ERROR_MESSAGES } from '@/services/api/apiError'
import { apiSlice } from '@/services/api/apiSlice'
import type { AuthSession } from './auth.types'
import { clearSession, saveSession } from './auth.utils'
import { loggedIn, loggedOut, profileUpdated, sessionExpired } from './authSlice'

/** Side effects of auth state changes. Reducers stay pure; persistence and cache resets happen here. */
export function registerAuthListeners(): void {
  listenerMiddleware.startListening({
    actionCreator: loggedIn,
    effect: ({ payload }) => saveSession(payload),
  })

  // Keeps the stored session in step with profile edits, so a reload shows the new name.
  listenerMiddleware.startListening({
    actionCreator: profileUpdated,
    effect: (_action, { getState }) => {
      const { auth } = getState() as { auth: { token: string | null; user: AuthSession['user'] | null } }
      if (auth.token && auth.user) saveSession({ token: auth.token, user: auth.user })
    },
  })

  listenerMiddleware.startListening({
    matcher: isAnyOf(loggedOut, sessionExpired),
    effect: (_action, { dispatch }) => {
      clearSession()
      // Drop every cached response so the next user never sees the previous user's data.
      dispatch(apiSlice.util.resetApiState())
    },
  })

  listenerMiddleware.startListening({
    actionCreator: sessionExpired,
    effect: () => {
      // A fixed id collapses the toasts from several requests failing at once.
      toast.error(API_ERROR_MESSAGES.unauthorized, { id: 'session-expired' })
    },
  })
}
