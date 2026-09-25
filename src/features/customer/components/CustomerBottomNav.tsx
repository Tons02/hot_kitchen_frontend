import { NavLink } from 'react-router'
import { customerNavigation } from '@/config/customerNavigation'
import { cn } from '@/lib/utils'

/**
 * The phone navigation: fixed to the bottom, always in reach, icon plus label for every item.
 * CustomerLayout pads the page so the bar never covers content.
 */
export function CustomerBottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {customerNavigation.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors',
                  'focus-visible:bg-accent focus-visible:outline-none',
                  isActive && 'text-primary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                      isActive && 'bg-primary/10',
                    )}
                  >
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  {item.title}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
