import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { DataTableLoadingState } from '@/components/common/data-table/DataTableLoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { User, UserAction, UsersQueryFilters } from '../users.types'
import { getFullName, getRoleLabel, getUserStatus } from '../users.utils'
import { useGetUserPagesInfiniteQuery } from '../usersApi'
import { UserRowActions } from './UserRowActions'
import { UserStatusBadge } from './UserStatusBadge'

const NO_USERS: User[] = []

interface UserCardListProps {
  filters: UsersQueryFilters
  currentUserId: number | undefined
  onAction: (action: UserAction) => void
  emptyState: ReactNode
}

/** The phone layout: one card per user, loading the next page as the end of the list scrolls into view. */
export function UserCardList({ filters, currentUserId, onAction, emptyState }: UserCardListProps) {
  // Refetch on every visit: profile picture links are signed and expire after a few minutes.
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetUserPagesInfiniteQuery(filters, { refetchOnMountOrArgChange: true })

  const users = useMemo(() => data?.pages.flatMap((page) => page.items) ?? NO_USERS, [data])
  const total = data?.pages[0]?.total ?? 0
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage || isFetchingNextPage) return

    // Starts loading a little before the end so scrolling rarely has to wait.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void fetchNextPage()
      },
      { rootMargin: '240px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <Card>
        <DataTableLoadingState label="Loading users…" />
      </Card>
    )
  }

  if (isError) return <ErrorState title="Couldn't load users" error={error} onRetry={refetch} className="rounded-xl border" />

  if (users.length === 0) return <Card className="py-0">{emptyState}</Card>

  const isCurrentView = filters.view === 'current'

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {users.map((user) => {
          const name = getFullName(user)
          return (
            <li key={user.id}>
              <Card className="py-4">
                <CardContent className="flex items-start gap-3 px-4">
                  <UserAvatar user={user} size="lg" />
                  <div className="grid min-w-0 flex-1 justify-items-start gap-1.5">
                    <div className="grid min-w-0 max-w-full justify-items-start leading-tight">
                      {isCurrentView ? (
                        <button
                          type="button"
                          className="max-w-full truncate rounded-sm text-left font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                          onClick={() => onAction({ type: 'edit', user })}
                        >
                          {name}
                        </button>
                      ) : (
                        <span className="max-w-full truncate font-medium">{name}</span>
                      )}
                      <span className="max-w-full truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                      <UserStatusBadge status={getUserStatus(user, filters.view)} />
                    </div>
                    <p className="max-w-full truncate text-xs text-muted-foreground">
                      {user.store ? `${user.store.name} (${user.store.code})` : 'All stores'} · {user.mobile_number}
                    </p>
                  </div>
                  {isCurrentView && (
                    <UserRowActions user={user} isSelf={user.id === currentUserId} onAction={onAction} />
                  )}
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>

      <div ref={sentinelRef} aria-hidden="true" />
      {isFetchingNextPage && <DataTableLoadingState label="Loading more users…" />}
      {!hasNextPage && (
        <p className="py-2 text-center text-sm text-muted-foreground">
          {total === 1 ? 'Showing the only user.' : `Showing all ${total} users.`}
        </p>
      )}
    </div>
  )
}
