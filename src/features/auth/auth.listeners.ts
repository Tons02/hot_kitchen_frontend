import { isAnyOf } from '@reduxjs/toolkit'
import { toast } from 'sonner'
import { listenerMiddleware } from '@/app/listenerMiddleware'
import { API_ERROR_MESSAGES } from '@/services/api/apiError'
import { apiSlice } from '@/services/api/apiSlice'
import { clearSession, saveSession } from './auth.utils'
import { loggedIn, loggedOut, sessionExpired } from './authSlice'

/** Side effects of auth state changes. Reducers stay pure; persistence and cache resets happen here. */
export function registerAuthListeners(): void {
  listenerMiddleware.startListening({
    actionCreator: loggedIn,
    effect: ({ payload }) => saveSession(payload),
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
