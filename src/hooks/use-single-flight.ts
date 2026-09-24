import { useCallback, useLayoutEffect, useRef } from 'react'

/**
 * Wraps an async action so it can't run twice at once. A `disabled` button only takes effect after
 * React re-renders, so a fast double-click can slip a second call in before that. The ref here
 * blocks it immediately. Calls made while the first is still running are ignored.
 */
export function useSingleFlight<TArgs extends unknown[]>(action: (...args: TArgs) => Promise<void>) {
  const isRunning = useRef(false)
  const latestAction = useRef(action)

  useLayoutEffect(() => {
    latestAction.current = action
  })

  return useCallback(async (...args: TArgs) => {
    if (isRunning.current) return
    isRunning.current = true
    try {
      await latestAction.current(...args)
    } finally {
      isRunning.current = false
    }
  }, [])
}
