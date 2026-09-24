/*
 * A sprite-sheet character that follows the pointer and reacts when clicked.
 *
 * Adapted from page-mascot by Kamran Ahmed (MIT, see THIRD_PARTY_NOTICES.md):
 * https://github.com/nilbuild/page-mascot
 * This version adds `gaze` / `expression` props and an imperative `play()`, so a page can
 * steer the character, for example to watch a field or close its eyes over a password.
 */
import { useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from 'react'
import { cn } from '@/lib/utils'

/** Cell order of the directions sheet, left to right, top to bottom. */
const DIRECTIONS = [
  'up-left',
  'up',
  'up-right',
  'left',
  'center',
  'right',
  'down-left',
  'down',
  'down-right',
] as const

/** Cell order of the reactions sheet, left to right, top to bottom. */
const EXPRESSIONS = [
  'blink',
  'heart',
  'sparkle',
  'surprised',
  'wink',
  'bashful',
  'sleepy',
  'dizzy',
  'delighted',
] as const

export type MascotDirection = (typeof DIRECTIONS)[number]
export type MascotExpression = (typeof EXPRESSIONS)[number]

export interface MascotHandle {
  /** Shows an expression for a moment, then returns to whatever the props say. */
  play: (expression: MascotExpression, durationMs?: number) => void
}

interface MascotProps {
  /** 3×3 sheet of head directions, in `DIRECTIONS` order. A served path or an imported image. */
  directions: string
  /** 3×3 sheet of expressions, in `EXPRESSIONS` order. */
  reactions: string
  /** Width and height in px. */
  size?: number
  /** Where to look. Overrides pointer tracking while set. */
  gaze?: MascotDirection | null
  /** An expression to hold, such as closed eyes. Wins over `gaze` while set. */
  expression?: MascotExpression | null
  /** Accessible name. Without one the mascot is decorative: hidden from screen readers and skipped by Tab. */
  label?: string
  className?: string
  ref?: Ref<MascotHandle>
}

// Clockwise from the right, matching atan2 with y pointing down.
const CLOCKWISE: readonly MascotDirection[] = [
  'right',
  'down-right',
  'down',
  'down-left',
  'left',
  'up-left',
  'up',
  'up-right',
]
const SECTOR = (Math.PI * 2) / CLOCKWISE.length
const HYSTERESIS = 0.12
const DEAD_ZONE_PX = 70

const BOOP_PAYOFFS: readonly MascotExpression[] = ['heart', 'sparkle', 'delighted']
const BOOP_PAYOFF_MS = 120
const BOOP_END_MS = 560
const DIZZY_AFTER_BOOPS = 4
const DIZZY_WINDOW_MS = 1600
const DIZZY_END_MS = 1100
const DEFAULT_PLAY_MS = 900

const SQUASH_MS = 420
const SQUASH: Keyframe[] = [
  { transform: 'scale(1, 1)', easing: 'ease-in' },
  { transform: 'scale(1.10, 0.86)', offset: 0.18, easing: 'ease-out' },
  { transform: 'scale(0.95, 1.08)', offset: 0.45, easing: 'ease-in-out' },
  { transform: 'scale(1.03, 0.97)', offset: 0.72, easing: 'ease-in-out' },
  { transform: 'scale(1, 1)' },
]

/** With background-size 300%, each cell is a clean 0 / 50 / 100% step on both axes. */
function cellStyle(sheet: string, index: number, isVisible: boolean): CSSProperties {
  return {
    backgroundImage: `url(${sheet})`,
    backgroundSize: '300% 300%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`,
    opacity: isVisible ? 1 : 0,
  }
}

function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

export function Mascot({
  directions,
  reactions,
  size = 140,
  gaze = null,
  expression = null,
  label,
  className,
  ref,
}: MascotProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const squashRef = useRef<HTMLSpanElement>(null)
  const timersRef = useRef<number[]>([])
  const boopsRef = useRef({ count: 0, at: 0 })
  const [trackedDirection, setTrackedDirection] = useState<MascotDirection>('center')
  const [playing, setPlaying] = useState<MascotExpression | null>(null)

  // Pointer tracking. Off for touch and other coarse pointers, where there's no cursor to follow.
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let sector = -1
    let pointer: { x: number; y: number } | null = null

    const aim = () => {
      const button = buttonRef.current
      if (!button || !pointer) return

      const box = button.getBoundingClientRect()
      const dx = pointer.x - (box.left + box.width / 2)
      const dy = pointer.y - (box.top + box.height / 2)

      if (Math.hypot(dx, dy) < DEAD_ZONE_PX) {
        sector = -1
        setTrackedDirection('center')
        return
      }

      // Hold the current sector until the pointer is well past its edge, so the head doesn't flicker.
      const angle = Math.atan2(dy, dx)
      if (sector !== -1 && Math.abs(wrapAngle(angle - sector * SECTOR)) < SECTOR / 2 + HYSTERESIS) return

      sector = (Math.round(angle / SECTOR) + CLOCKWISE.length) % CLOCKWISE.length
      setTrackedDirection(CLOCKWISE[sector])
    }

    const onPointerMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY }
      aim()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('scroll', aim, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('scroll', aim)
    }
  }, [])

  useEffect(() => {
    const timers = timersRef.current
    return () => timers.forEach(window.clearTimeout)
  }, [])

  // Cleared in place: the unmount cleanup above holds on to this same array.
  const clearTimers = () => {
    const timers = timersRef.current
    timers.forEach(window.clearTimeout)
    timers.length = 0
  }

  const later = (ms: number, next: MascotExpression | null) => {
    timersRef.current.push(window.setTimeout(() => setPlaying(next), ms))
  }

  useImperativeHandle(ref, () => ({
    play: (next, durationMs = DEFAULT_PLAY_MS) => {
      clearTimers()
      setPlaying(next)
      later(durationMs, null)
    },
  }))

  const boop = () => {
    clearTimers()

    const now = Date.now()
    const boops = boopsRef.current
    boops.count = now - boops.at < DIZZY_WINDOW_MS ? boops.count + 1 : 1
    boops.at = now

    if (boops.count >= DIZZY_AFTER_BOOPS) {
      boops.count = 0
      setPlaying('dizzy')
      later(DIZZY_END_MS, null)
    } else {
      setPlaying('blink')
      later(BOOP_PAYOFF_MS, BOOP_PAYOFFS[(boops.count - 1) % BOOP_PAYOFFS.length])
      later(BOOP_END_MS, null)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Per-keyframe easing with a linear effect: an easing on the effect itself would
    // reinterpret every offset and front-load the whole bounce.
    squashRef.current?.animate(SQUASH, { duration: SQUASH_MS, easing: 'linear' })
  }

  const shownExpression = playing ?? expression
  const shownDirection = gaze ?? trackedDirection

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={boop}
      aria-label={label ? `Boop the ${label}` : undefined}
      aria-hidden={label ? undefined : true}
      tabIndex={label ? undefined : -1}
      className={cn(
        'relative block shrink-0 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 select-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span ref={squashRef} className="relative block size-full origin-[50%_78%]">
        <span
          className="absolute inset-0"
          style={cellStyle(directions, DIRECTIONS.indexOf(shownDirection), shownExpression === null)}
        />
        <span
          className="absolute inset-0"
          style={cellStyle(reactions, EXPRESSIONS.indexOf(shownExpression ?? 'blink'), shownExpression !== null)}
        />
      </span>
    </button>
  )
}
