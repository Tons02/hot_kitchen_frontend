import { InboxIcon, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

interface EmptyStateProps {
  title: string
  description?: ReactNode
  icon?: LucideIcon
  iconClassName?: string
  /** Replaces the icon with an illustration or animation. */
  media?: ReactNode
  /** Call to action, e.g. a "Create" or "Clear filters" button. */
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = InboxIcon,
  iconClassName,
  media,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        {media ? (
          <EmptyMedia>{media}</EmptyMedia>
        ) : (
          <EmptyMedia variant="icon" className={iconClassName}>
            <Icon />
          </EmptyMedia>
        )}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}
