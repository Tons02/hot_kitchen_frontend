import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { isInlineApiError, normalizeApiError } from '@/services/api/apiError'

/**
 * Maps a failed mutation onto a React Hook Form instance:
 * - field validation errors are attached to their fields, and the first one is focused
 * - other user-fixable errors (400 / 409 / 422 without field details) go to `errors.root.server`
 * - anything else is ignored here because the global API error middleware already notified the user
 */
export function applyServerErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
): void {
  const normalized = normalizeApiError(error)
  if (!isInlineApiError(normalized)) return

  const fieldErrors = Object.entries(normalized.fieldErrors)

  if (fieldErrors.length === 0) {
    setError('root.server', { type: 'server', message: normalized.message })
    return
  }

  fieldErrors.forEach(([field, message], index) => {
    setError(field as Path<TFieldValues>, { type: 'server', message }, { shouldFocus: index === 0 })
  })
}
