import type { ComponentProps } from 'react'
import buttonLoadingAnimation from '@/assets/buttonLoading.json'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LottieAnimation } from './LottieAnimation'

type LoadingButtonProps = Omit<ComponentProps<typeof Button>, 'asChild'> & {
  /** Swaps the label for the loading animation and disables the button. */
  isLoading?: boolean
}

/** A button for actions that wait on the server: submit buttons, confirm buttons. */
export function LoadingButton({ isLoading = false, disabled, className, children, ...props }: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      // While loading it's busy rather than unavailable, so it keeps its full color.
      className={cn('relative', isLoading && 'disabled:opacity-100', className)}
      {...props}
    >
      {/* Hidden, not removed: the button keeps its width and its accessible name while loading. */}
      <span className={cn('inline-flex items-center gap-1.5', isLoading && 'opacity-0')}>{children}</span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          {/* Takes the button's text color, so it stays visible on every button variant. */}
          <LottieAnimation animationData={buttonLoadingAnimation} inheritColor className="size-7" />
        </span>
      )}
    </Button>
  )
}
