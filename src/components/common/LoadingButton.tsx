import type { ComponentProps } from 'react'
import buttonLoadingAnimation from '@/assets/buttonLoading.json'
import { Button } from '@/components/ui/button'
import { LottieAnimation } from './LottieAnimation'

type LoadingButtonProps = Omit<ComponentProps<typeof Button>, 'asChild'> & {
  /** Shows the loading animation and disables the button. */
  isLoading?: boolean
}

/** A button for actions that wait on the server: submit buttons, confirm buttons. */
export function LoadingButton({ isLoading = false, disabled, children, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={disabled || isLoading} aria-busy={isLoading || undefined} {...props}>
      {/* Takes the button's text color, so it stays visible on the orange primary button too. */}
      {isLoading && <LottieAnimation animationData={buttonLoadingAnimation} inheritColor className="-my-1 size-6" />}
      {children}
    </Button>
  )
}
