import type { MouseEvent } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { getPageItems } from '@/lib/page-items'
import { cn } from '@/lib/utils'

interface PageNavigationProps {
  page: number
  pageCount: number
  /** The link for a page, e.g. `?page=3`, so it can be opened in a new tab or shared. */
  getHref: (page: number) => string
  /** Handles a normal click in place (the link's default navigation is prevented). */
  onPageChange: (page: number) => void
  /** e.g. "Menu pages", for screen readers. */
  label?: string
  className?: string
}

/** Previous · numbered pages · Next, on shadcn's Pagination. Renders nothing for a single page. */
export function PageNavigation({
  page,
  pageCount,
  getHref,
  onPageChange,
  label = 'Pages',
  className,
}: PageNavigationProps) {
  if (pageCount <= 1) return null

  const go = (target: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    // Ctrl/Cmd-click and middle-click still open the page in a new tab.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    if (target >= 1 && target <= pageCount && target !== page) onPageChange(target)
  }

  const isFirst = page <= 1
  const isLast = page >= pageCount

  return (
    <Pagination aria-label={label} className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={getHref(Math.max(1, page - 1))}
            onClick={go(page - 1)}
            aria-disabled={isFirst}
            tabIndex={isFirst ? -1 : undefined}
            className={cn(isFirst && 'pointer-events-none opacity-50')}
          />
        </PaginationItem>
        {getPageItems(page, pageCount).map((item, index) =>
          item === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${index}`} className="hidden sm:list-item">
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            // Phones show just the current page between Previous and Next.
            <PaginationItem key={item} className={cn(item !== page && 'hidden sm:list-item')}>
              <PaginationLink
                href={getHref(item)}
                onClick={go(item)}
                isActive={item === page}
                aria-label={`Page ${item}`}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href={getHref(Math.min(pageCount, page + 1))}
            onClick={go(page + 1)}
            aria-disabled={isLast}
            tabIndex={isLast ? -1 : undefined}
            className={cn(isLast && 'pointer-events-none opacity-50')}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
