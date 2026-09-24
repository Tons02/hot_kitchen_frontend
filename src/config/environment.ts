/**
 * Typed access to build-time environment variables.
 *
 * Every VITE_* value is embedded in the client bundle and visible to anyone
 * using the app. Never put secrets or credentials here.
 */
function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env.local and set it.`,
    )
  }
  return value
}

export const environment = {
  apiUrl: requireEnv('VITE_API_URL', import.meta.env.VITE_API_URL).replace(/\/+$/, ''),
  appName: import.meta.env.VITE_APP_NAME || 'Hot Kitchen',
  /** Public path the app is served from (Vite's `base`), always ending in `/`. */
  baseUrl: import.meta.env.BASE_URL,
} as const
