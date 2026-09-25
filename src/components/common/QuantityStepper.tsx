import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  /** What is being counted, for the buttons' labels, e.g. "Classic Burger". */
  label: string
  disabled?: boolean
  size?: 'sm' | 'default'
  className?: string
}

/** − value + for small counts such as an order quantity. The value is announced as it changes. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  disabled,
  size = 'default',
  className,
}: QuantityStepperProps) {
  const buttonSize = size === 'sm' ? 'icon-xs' : 'icon-sm'

  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full border bg-background p-0.5', className)}>
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        className="rounded-full"
        aria-label={`Fewer ${label}`}
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon />
      </Button>
      <span className={cn('min-w-6 text-center font-medium tabular-nums', size === 'sm' && 'text-sm')} aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        className="rounded-full"
        aria-label={`More ${label}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon />
      </Button>
    </div>
  )
}
