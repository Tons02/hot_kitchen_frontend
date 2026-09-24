import type { Role, User } from '@/features/users/users.types'
import { STORAGE_KEYS } from '@/lib/constants'
import type { AuthSession } from './auth.types'

/** UI-only check. The API is the source of truth for what a user may do. */
export function hasRole(user: Pick<User, 'role'> | null, roles: readonly Role[]): boolean {
  return user !== null && roles.includes(user.role)
}

/*
 * Session persistence.
 *
 * The API issues a bearer token and has no "current user" endpoint, so the token and the
 * user returned at login are kept in localStorage. Anything in localStorage is readable by
 * scripts on the page, which is one more reason to never render untrusted HTML.
 */

function isAuthSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) return false
  const { token, user } = value as Record<string, unknown>
  return typeof token === 'string' && typeof user === 'object' && user !== null && 'role' in user
}

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isAuthSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveSession(session: AuthSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session))
  } catch {
    // Storage is full or blocked: the session still works until the page is reloaded.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.session)
  } catch {
    // Storage is blocked, so there is nothing persisted to clear.
  }
}
