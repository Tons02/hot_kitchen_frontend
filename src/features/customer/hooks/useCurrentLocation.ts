import { useState } from 'react'
import type { Coordinates } from '../customer.utils'

type LocationStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable'

/**
 * The customer's position, asked for only when they press "Use my current location" (never on page
 * load). `status` says why there's no position: denied, or unsupported/failed.
 */
export function useCurrentLocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null)
  const [status, setStatus] = useState<LocationStatus>(() =>
    typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'idle' : 'unavailable',
  )

  const request = () => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude })
        setStatus('ready')
      },
      (error) => setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  }

  return { coords, status, request }
}
