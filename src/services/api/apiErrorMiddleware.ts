import { isRejectedWithValue, type Middleware } from '@reduxjs/toolkit'
import { toast } from 'sonner'
import { isInlineApiError, normalizeApiError } from './apiError'

/** Endpoints that handle their own failures and must never raise a global toast. */
const SILENT_ENDPOINTS: ReadonlySet<string> = new Set(['logout'])

interface RtkQueryThunkArg {
  type?: unknown
  endpointName?: unknown
}

function readThunkArg(meta: unknown): RtkQueryThunkArg {
  return (meta as { arg?: RtkQueryThunkArg } | undefined)?.arg ?? {}
}

/**
 * Global feedback for failed mutations the user can't fix from the form they're on:
 * network failures, timeouts, 403, 404, 413, 429 and 5xx.
 *
 * Everything else is handled closer to the UI:
 * - 400 / 409 / 422: forms render them inline via `applyServerErrors()`
 * - 401: the session-expiry flow signs the user out
 * - query errors: pages render `<ErrorState error={error} />`
 */
/**
 * For actions without a form, such as confirm dialogs: toasts the user-fixable errors
 * (400 / 409 / 422) that the middleware below leaves for the caller to show.
 */
export function toastInlineApiError(error: unknown): void {
  const normalized = normalizeApiError(error)
  if (isInlineApiError(normalized)) toast.error(normalized.message)
}

export const apiErrorMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const { type, endpointName } = readThunkArg(action.meta)

    if (type === 'mutation' && typeof endpointName === 'string' && !SILENT_ENDPOINTS.has(endpointName)) {
      const error = normalizeApiError(action.payload)
      if (error.status !== 401 && !isInlineApiError(error)) toast.error(error.message)
    }
  }

  return next(action)
}
