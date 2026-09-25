import { ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** The closing nudge back to the store finder. */
export function OrderCta({ startHref }: { startHref: string }) {
  return (
    <section
      aria-labelledby="cta-heading"
      className="flex flex-col items-start gap-4 rounded-3xl bg-primary p-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:p-10"
    >
      <div className="space-y-1">
        <h2 id="cta-heading" className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Ready to order?
        </h2>
        <p className="opacity-90">Pick your store and your favorites are a few taps away.</p>
      </div>
      <Button asChild size="lg" variant="secondary" className="rounded-full px-6">
        <a href={startHref}>
          Start your order
          <ArrowRightIcon />
        </a>
      </Button>
    </section>
  )
}
