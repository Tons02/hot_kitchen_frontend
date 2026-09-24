import { useEffect, useEffectEvent } from 'react'

interface ParsedHotkey {
  alt: boolean
  ctrl: boolean
  shift: boolean
  meta: boolean
  key: string
}

function parseHotkey(combo: string): ParsedHotkey {
  const parts = combo.toLowerCase().split('+')
  return {
    alt: parts.includes('alt'),
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta'),
    key: parts.at(-1) ?? '',
  }
}

/** Letters and digits match the physical key: on a Mac, Option+A types "å", but its code is still KeyA. */
function matchesKey(event: KeyboardEvent, key: string): boolean {
  if (/^[a-z]$/.test(key)) return event.code === `Key${key.toUpperCase()}`
  if (/^\d$/.test(key)) return event.code === `Digit${key}`
  return event.key.toLowerCase() === key
}

/**
 * Runs `onPress` when a keyboard shortcut like 'Alt+A' is pressed anywhere on the page.
 * Pass `enabled: false` while it shouldn't fire, e.g. when a dialog is open over the page.
 */
export function useHotkey(combo: string, onPress: () => void, { enabled = true }: { enabled?: boolean } = {}) {
  // Always calls the latest handler without re-adding the listener on every render.
  const handlePress = useEffectEvent(onPress)

  useEffect(() => {
    if (!enabled) return
    const hotkey = parseHotkey(combo)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.defaultPrevented) return
      if (
        event.altKey !== hotkey.alt ||
        event.ctrlKey !== hotkey.ctrl ||
        event.shiftKey !== hotkey.shift ||
        event.metaKey !== hotkey.meta ||
        !matchesKey(event, hotkey.key)
      ) {
        return
      }
      // Stops the browser's own use of the combo (e.g. Firefox opens its History menu on Alt+S).
      event.preventDefault()
      handlePress()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [combo, enabled])
}
