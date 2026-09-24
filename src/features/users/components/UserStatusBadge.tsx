import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge'
import type { UserStatus } from '../users.types'

const STATUS_DISPLAY: Record<UserStatus, { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'success' },
  deactivated: { label: 'Deactivated', tone: 'warning' },
  archived: { label: 'Archived', tone: 'neutral' },
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const { label, tone } = STATUS_DISPLAY[status]
  return <StatusBadge tone={tone}>{label}</StatusBadge>
}
