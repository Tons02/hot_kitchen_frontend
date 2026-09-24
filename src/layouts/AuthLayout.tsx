import { Outlet } from 'react-router'
import { AppLogo } from '@/components/common/AppLogo'
import { OfflineBanner } from '@/components/layout/OfflineBanner'

export function AuthLayout() {
  return (
    <div className="flex flex-1 flex-col bg-muted">
      <OfflineBanner />
      <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <AppLogo className="self-center" />
          <Outlet />
        </div>
      </div>
    </div>
  )
}
