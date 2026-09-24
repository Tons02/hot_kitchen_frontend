import { WifiOffIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useOnlineStatus } from '@/hooks/use-online-status'

/**
 * A warning bar while the browser is offline, and a toast once the connection is back.
 * RTK Query refetches on reconnect (`refetchOnReconnect` in apiSlice), so data catches up by itself.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const wasOffline = useRef(false)

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true
      return
    }
    // Only after an actual outage, not on every page load.
    if (wasOffline.current) {
      wasOffline.current = false
      toast.success('Back online', { description: 'Your connection is restored.' })
    }
  }, [isOnline])

  if (isOnline) return null

  return (
    <div
      role="status"
      className="flex shrink-0 items-center justify-center gap-2 bg-warning px-4 py-2 text-center text-sm font-medium text-warning-foreground"
    >
      <WifiOffIcon className="size-4 shrink-0" aria-hidden="true" />
      You're offline. Changes can't be saved until your connection is back.
    </div>
  )
}
