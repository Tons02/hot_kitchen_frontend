import { ArrowLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { AppLogo } from '@/components/common/AppLogo'
import { DocumentTitle } from '@/components/common/DocumentTitle'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/routes/paths'
import { AuthBrandPanel } from './AuthBrandPanel'

interface AuthSplitLayoutProps {
  title: string
  children: ReactNode
}

/**
 * The sign-in page's shell: the brand panel beside the form on desktop, the form alone under the logo
 * on phones, with a way back to the shop and the theme toggle.
 */
export function AuthSplitLayout({ title, children }: AuthSplitLayoutProps) {
  return (
    <div className="grid min-h-svh flex-1 bg-background lg:grid-cols-2">
      <DocumentTitle title={title} />

      {/* Full height, and stays in view if the form ever scrolls. */}
      <AuthBrandPanel className="h-svh lg:sticky lg:top-0" />

      <main className="flex flex-col">
        <OfflineBanner />
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Button asChild variant="ghost" className="rounded-full">
            <Link to={ROUTES.home}>
              <ArrowLeftIcon />
              Back to home
            </Link>
          </Button>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="flex w-full max-w-sm flex-col gap-4">
            <AppLogo className="size-20 self-center lg:hidden" />
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
