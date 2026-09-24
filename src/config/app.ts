import { environment } from './environment'

export const appConfig = {
  name: environment.appName,
  /**
   * The primary logo: a trimmed, transparent copy of `public/hot_kitchen_logo.png`
   * so it sits cleanly on both light and dark backgrounds.
   */
  logoUrl: `${environment.baseUrl}hot_kitchen_logo_transparent.png`,
  /** Requests slower than this fail with a timeout error. */
  apiTimeoutMs: 30_000,
} as const
