import lottie from 'lottie-web/build/player/lottie_light'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface LottieAnimationProps {
  /** Parsed Lottie JSON, e.g. `import animation from '@/assets/tableLoading.json'`. */
  animationData: object
  loop?: boolean
  /** Paints every shape in the current text color, so the animation matches the text around it. */
  inheritColor?: boolean
  /** Size it here, e.g. `size-24`. */
  className?: string
}

/**
 * Plays a Lottie animation with lottie-web's light SVG player, which has no expression
 * engine (and so never evals code from the file). Decorative: hidden from screen readers,
 * so pair it with visible text. With reduced motion it shows a single still frame.
 */
export function LottieAnimation({ animationData, loop = true, inheritColor = false, className }: LottieAnimationProps) {
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const animation = lottie.loadAnimation({
      container,
      // lottie-web writes into the data it's given, so each instance gets its own copy.
      animationData: structuredClone(animationData),
      renderer: 'svg',
      loop,
      autoplay: !prefersReducedMotion,
    })

    if (prefersReducedMotion) {
      // The last frame shows the finished composition.
      const showStillFrame = () => animation.goToAndStop(animation.totalFrames - 1, true)
      if (animation.isLoaded) showStillFrame()
      else animation.addEventListener('DOMLoaded', showStillFrame)
    }

    return () => animation.destroy()
  }, [animationData, loop])

  return (
    <span
      ref={containerRef}
      aria-hidden="true"
      className={cn('inline-block shrink-0', inheritColor && 'lottie-current-color', className)}
    />
  )
}
