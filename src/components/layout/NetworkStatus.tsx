import { StatusBadge } from '@/components/common/StatusBadge'
import { useOnlineStatus } from '@/hooks/use-online-status'

/** Header indicator for the browser's connection. The offline banner explains what it means. */
export function NetworkStatus() {
  const isOnline = useOnlineStatus()

  return (
    <span role="status">
      <StatusBadge tone={isOnline ? 'success' : 'destructive'}>{isOnline ? 'Online' : 'Offline'}</StatusBadge>
    </span>
  )
}
