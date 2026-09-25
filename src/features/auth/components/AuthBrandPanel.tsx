import { ClockIcon, FlameIcon, MapPinIcon } from 'lucide-react'
import { Link } from 'react-router'
import { AppLogo } from '@/components/common/AppLogo'
import { appConfig } from '@/config/app'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/paths'

const PERKS = [
  { icon: MapPinIcon, text: 'Order from the store nearest you' },
  { icon: FlameIcon, text: 'Freshly cooked, made to order' },
  { icon: ClockIcon, text: 'Skip the line with order ahead' },
]

/**
 * The brand panel beside the sign-in and sign-up forms (desktop only): the logo, a promise and three
 * perks on soft, theme-aware shapes. The caller sets its size and position via `className`.
 */
export function AuthBrandPanel({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        'relative hidden flex-col justify-between overflow-hidden bg-secondary p-10 text-secondary-foreground lg:flex',
        className,
      )}
    >
      <div aria-hidden="true" className="absolute -top-24 -right-24 size-80 rounded-full bg-primary/15" />
      <div aria-hidden="true" className="absolute -bottom-32 -left-16 size-96 rounded-full bg-background/40" />
      <Link to={ROUTES.home} className="relative font-heading text-lg font-semibold">
        {appConfig.name}
      </Link>
      <div className="relative flex flex-col gap-6">
        <AppLogo className="size-40" />
        <h2 className="font-heading text-4xl font-bold tracking-tight text-balance">Your favorites are waiting.</h2>
        <ul className="flex flex-col gap-3">
          {PERKS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-background/60">
                <Icon className="size-4 text-primary" aria-hidden="true" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
      <p className="relative text-sm opacity-80">
        © {new Date().getFullYear()} {appConfig.name}
      </p>
    </aside>
  )
}
