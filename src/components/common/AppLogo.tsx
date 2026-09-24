import { appConfig } from '@/config/app'
import { cn } from '@/lib/utils'

/** The logo at icon size, for tight spots like the sidebar. Decorative, so place it next to the app name. */
export function AppLogoMark({ className }: { className?: string }) {
  return <img src={appConfig.logoUrl} alt="" className={cn('size-8 shrink-0 object-contain', className)} />
}

/** The full logo. It already contains the "Hot Kitchen" wordmark, so it stands alone. */
export function AppLogo({ className }: { className?: string }) {
  return <img src={appConfig.logoUrl} alt={appConfig.name} className={cn('size-24 object-contain', className)} />
}
