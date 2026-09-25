import { Link, NavLink } from 'react-router'
import { AppLogoMark } from '@/components/common/AppLogo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { appConfig } from '@/config/app'
import { customerNavigation } from '@/config/customerNavigation'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/paths'
import { CartButton } from './CartButton'
import { CustomerAccountMenu } from './CustomerAccountMenu'

/** Compact sticky header: brand, the primary links (desktop), theme, cart and account. */
export function CustomerHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          to={ROUTES.home}
          className="flex items-center gap-2 rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <AppLogoMark className="size-9" />
          <span className="font-heading text-lg font-semibold tracking-tight">{appConfig.name}</span>
        </Link>

        {/* Phones use the bottom bar instead. */}
        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {customerNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                  isActive && 'bg-accent text-accent-foreground',
                )
              }
            >
              {item.title}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <CartButton />
          <div className="hidden md:block">
            <CustomerAccountMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
