import { ChevronRightIcon } from 'lucide-react'
import { Fragment } from 'react'
import { Card } from '@/components/ui/card'
import { SectionHeading } from './SectionHeading'

const STEPS = [
  { title: 'Choose a store', description: 'Select a nearby store and browse its menu.' },
  { title: 'Choose your food', description: 'Pick your favorite meals and add them to your cart.' },
  { title: 'Place your order', description: 'Review your order and choose delivery or pickup.' },
]

const FLOW = ['Choose store', 'Browse menu', 'Add to cart', 'Checkout', 'Enjoy your food']

/** Three numbered steps, then the whole journey on one line. */
export function HowToOrder() {
  return (
    <section aria-labelledby="how-heading" className="flex flex-col gap-6">
      <SectionHeading id="how-heading" title="How to order" description="Three steps from hungry to happy." />

      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex">
            <Card className="w-full gap-2 rounded-2xl p-5">
              <span className="font-heading text-3xl font-bold text-primary tabular-nums" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-heading text-lg font-semibold">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </Card>
          </li>
        ))}
      </ol>

      <ol aria-label="Ordering journey" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {FLOW.map((stage, index) => (
          <Fragment key={stage}>
            <li className="rounded-full border bg-card px-3 py-1">{stage}</li>
            {index < FLOW.length - 1 && <ChevronRightIcon className="size-4" aria-hidden="true" />}
          </Fragment>
        ))}
      </ol>
    </section>
  )
}
