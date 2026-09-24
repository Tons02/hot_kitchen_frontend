import { useSyncExternalStore } from 'react'

/** Whether a media query matches. Correct on the first render, so layouts never flash the wrong variant. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

/** Below Tailwind's `md` breakpoint (768px): phones, before tablet width. */
export function useIsBelowTablet(): boolean {
  return useMediaQuery('(max-width: 767.98px)')
}
