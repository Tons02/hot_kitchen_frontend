import { ArrowRightIcon, ClockIcon, FlameIcon, MapPinIcon } from 'lucide-react'
import { Link } from 'react-router'
import { AppLogo } from '@/components/common/AppLogo'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/routes/paths'

interface HeroSectionProps {
  /** Where "Start your order" jumps to on this page (the store finder). */
  startHref: string
}

const HIGHLIGHTS = [
  { icon: FlameIcon, label: 'Cooked fresh' },
  { icon: ClockIcon, label: 'Order ahead' },
  { icon: MapPinIcon, label: 'From a store near you' },
]

/** The first screen: what this is, and the one thing to do next. Kept short so stores show soon after. */
export function HeroSection({ startHref }: HeroSectionProps) {
  return (
    <section aria-labelledby="hero-heading" className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
      <div className="flex flex-col items-start gap-5">
        <h1 id="hero-heading" className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Good food.
          <br />
          <span className="text-primary">Easy ordering.</span>
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Discover your favorite meals from stores near you, and order them in a few taps.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full px-6">
            <a href={startHref}>
              Start your order
              <ArrowRightIcon />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-6">
            <Link to={ROUTES.shopStores}>Browse stores</Link>
          </Button>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-1.5">
              <Icon className="size-4 text-primary" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* Brand visual: the logo on soft, theme-aware shapes. Swap in a food photo when there is one. */}
      <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-sm md:max-w-md">
        <div className="absolute inset-4 rounded-full bg-secondary" />
        <div className="absolute top-2 right-6 size-20 rounded-full bg-primary/15" />
        <div className="absolute bottom-6 left-2 size-14 rounded-full bg-accent" />
        <div className="relative flex size-full items-center justify-center">
          <AppLogo className="size-3/5 drop-shadow-sm" />
        </div>
      </div>
    </section>
  )
}
