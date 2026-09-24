import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

export interface NormalizedApiError {
  /** HTTP status, or null when no response was received (network failure, timeout, ...). */
  status: number | null
  /** Safe to show to users. Never contains stack traces, SQL, model names or other server internals. */
  message: string
  /** Validation messages keyed by field path, e.g. `username` or `rider_profile.plate_number`. */
  fieldErrors: Record<string, string>
}

export const API_ERROR_MESSAGES = {
  network: 'Unable to reach the server. Check your connection and try again.',
  timeout: 'The server took too long to respond. Please try again.',
  unauthorized: 'Your session has expired. Please sign in again.',
  forbidden: "You don't have permission to do that.",
  notFound: "We couldn't find what you were looking for.",
  validation: 'Please check the highlighted fields and try again.',
  badRequest: "We couldn't process that request. Please check your input and try again.",
  payloadTooLarge: 'The uploaded file is too large.',
  tooManyRequests: 'Too many requests. Please wait a moment and try again.',
  server: 'Something went wrong on our end. Please try again later.',
  unknown: 'Something went wrong. Please try again.',
} as const

/** Statuses the user can resolve by changing their input. Forms show these inline instead of toasting them. */
const INLINE_STATUSES: ReadonlySet<number> = new Set([400, 409, 422])

export function isInlineApiError(error: NormalizedApiError): boolean {
  return error.status !== null && INLINE_STATUSES.has(error.status)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return isRecord(error) && 'status' in error
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

/**
 * The API reports errors in two shapes:
 * - API toolkit helpers: `{ errors: [{ status, title, detail }] }`, where `detail` carries the message
 * - Laravel defaults:    `{ message, errors?: { field: [messages] } }`
 */
function extractServerMessage(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined

  if (Array.isArray(body.errors)) {
    const [first]: unknown[] = body.errors
    return isRecord(first) ? (nonEmptyString(first.detail) ?? nonEmptyString(first.title)) : undefined
  }

  return nonEmptyString(body.message)
}

function extractFieldErrors(body: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  if (!isRecord(body)) return fieldErrors

  const { errors } = body

  if (isRecord(errors)) {
    for (const [field, messages] of Object.entries(errors)) {
      const message = Array.isArray(messages) ? nonEmptyString(messages[0]) : nonEmptyString(messages)
      if (message) fieldErrors[field] = message
    }
  } else if (Array.isArray(errors)) {
    for (const item of errors) {
      if (!isRecord(item) || !isRecord(item.source)) continue
      const pointer = nonEmptyString(item.source.pointer)
      const message = nonEmptyString(item.detail)
      if (pointer && message) fieldErrors[pointer.replace(/^\//, '').replaceAll('/', '.')] = message
    }
  }

  return fieldErrors
}

function messageForStatus(status: number, body: unknown, fieldErrors: Record<string, string>): string {
  const serverMessage = extractServerMessage(body)

  switch (status) {
    case 400:
    case 409:
      return serverMessage ?? API_ERROR_MESSAGES.badRequest
    case 401:
      return API_ERROR_MESSAGES.unauthorized
    case 403:
      return API_ERROR_MESSAGES.forbidden
    case 404:
      // Laravel's 404 messages expose route and model names, so they are never shown.
      return API_ERROR_MESSAGES.notFound
    case 413:
      return API_ERROR_MESSAGES.payloadTooLarge
    case 422:
      return serverMessage ?? Object.values(fieldErrors)[0] ?? API_ERROR_MESSAGES.validation
    case 429:
      return API_ERROR_MESSAGES.tooManyRequests
    default:
      return status >= 500 ? API_ERROR_MESSAGES.server : API_ERROR_MESSAGES.unknown
  }
}

/** Converts any RTK Query or thrown error into a shape the UI can display safely. */
export function normalizeApiError(error: FetchBaseQueryError | SerializedError | unknown): NormalizedApiError {
  if (!isFetchBaseQueryError(error)) {
    return { status: null, message: API_ERROR_MESSAGES.unknown, fieldErrors: {} }
  }

  if (typeof error.status === 'number') {
    const fieldErrors = error.status === 422 ? extractFieldErrors(error.data) : {}
    return { status: error.status, message: messageForStatus(error.status, error.data, fieldErrors), fieldErrors }
  }

  switch (error.status) {
    case 'FETCH_ERROR':
      return { status: null, message: API_ERROR_MESSAGES.network, fieldErrors: {} }
    case 'TIMEOUT_ERROR':
      return { status: null, message: API_ERROR_MESSAGES.timeout, fieldErrors: {} }
    case 'PARSING_ERROR':
      return {
        status: error.originalStatus,
        message: error.originalStatus >= 500 ? API_ERROR_MESSAGES.server : API_ERROR_MESSAGES.unknown,
        fieldErrors: {},
      }
    default:
      return { status: null, message: API_ERROR_MESSAGES.unknown, fieldErrors: {} }
  }
}

export function getErrorMessage(error: unknown): string {
  return normalizeApiError(error).message
}
