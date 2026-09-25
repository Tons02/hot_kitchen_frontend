import { Outlet } from 'react-router'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { appConfig } from '@/config/app'
import { AddToCartProvider } from '@/features/cart/components/AddToCartProvider'
import { CartFloatingButton } from '@/features/customer/components/CartFloatingButton'
import { CustomerBottomNav } from '@/features/customer/components/CustomerBottomNav'
import { CustomerHeader } from '@/features/customer/components/CustomerHeader'

/**
 * The customer site's shell: a sticky header, the page, a small footer, and on phones a bottom
 * navigation bar. Unlike MainLayout, the whole page scrolls (the header stays pinned).
 */
export function CustomerLayout() {
  return (
    // Every page's Add buttons, the cart panel and the phone cart pill share one add-to-cart flow.
    <AddToCartProvider>
      <div className="flex min-h-svh flex-1 flex-col bg-background">
        <CustomerHeader />
        <OfflineBanner />
        {/* Bottom padding keeps content clear of the phone navigation bar. */}
        <main className="flex flex-1 flex-col pb-24 md:pb-0">
          <Outlet />
        </main>
        <footer className="hidden border-t md:block">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
            <span>
              © {new Date().getFullYear()} {appConfig.name}
            </span>
            <span>Freshly cooked, made to order.</span>
          </div>
        </footer>
        <CartFloatingButton />
        <CustomerBottomNav />
      </div>
    </AddToCartProvider>
  )
}
