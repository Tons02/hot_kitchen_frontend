import { useEffect, useRef, useState, type ReactNode } from 'react'
import { DataTableLoadingState } from '@/components/common/data-table/DataTableLoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { USERS_CARD_LIST_STEP, USERS_MAX_PAGE_SIZE } from '../users.constants'
import type { User, UserAction, UsersQueryFilters } from '../users.types'
import { getFullName, getRoleLabel, getUserStatus } from '../users.utils'
import { useGetUsersQuery } from '../usersApi'
import { UserRowActions } from './UserRowActions'
import { UserStatusBadge } from './UserStatusBadge'

const NO_USERS: User[] = []

interface UserCardListProps {
  filters: UsersQueryFilters
  currentUserId: number | undefined
  onAction: (action: UserAction) => void
  emptyState: ReactNode
}

/**
 * The phone layout: one card per user. It always asks for page 1 and adds USERS_CARD_LIST_STEP to
 * `per_page` whenever the end of the list scrolls into view, until it has the response's `total`.
 */
export function UserCardList({ filters, currentUserId, onAction, emptyState }: UserCardListProps) {
  const [growth, setGrowth] = useState({ filters, perPage: USERS_CARD_LIST_STEP })
  // New search or filters start again from the first step.
  if (growth.filters !== filters) setGrowth({ filters, perPage: USERS_CARD_LIST_STEP })
  const { perPage } = growth

  // Refetch on every visit: profile picture links are signed and expire after a few minutes.
  // While a bigger per_page loads, `data` keeps the previous result so the cards stay on screen.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetUsersQuery(
    { ...filters, page: 1, perPage },
    { refetchOnMountOrArgChange: true },
  )

  const users = data?.items ?? NO_USERS
  const total = data?.total ?? 0
  // The API caps per_page, so the list can't grow past USERS_MAX_PAGE_SIZE.
  const hasMore = users.length < total && perPage < USERS_MAX_PAGE_SIZE
  const isLoadingMore = isFetching && perPage > users.length
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || isFetching) return

    // Starts loading a little before the end so scrolling rarely has to wait.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setGrowth((current) => ({
          ...current,
          perPage: Math.min(current.perPage + USERS_CARD_LIST_STEP, USERS_MAX_PAGE_SIZE),
        }))
      },
      { rootMargin: '240px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isFetching])

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
      {isLoadingMore && <DataTableLoadingState label="Loading more users…" />}
      {!hasMore && !isLoadingMore && (
        <p className="py-2 text-center text-sm text-muted-foreground">
          {users.length < total
            ? `Showing the first ${users.length} of ${total} users. Search or filter to narrow the list.`
            : total === 1
              ? 'Showing the only user.'
              : `Showing all ${total} users.`}
        </p>
      )}
    </div>
  )
}
