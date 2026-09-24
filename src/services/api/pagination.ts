import type { PageResult, Paginated, ResourcePage } from '@/types/api'

type PageBody<TItem> = Paginated<TItem> | ResourcePage<TItem> | TItem[]

/**
 * Normalizes the page shapes index endpoints return:
 * - Laravel's paginator (`current_page`, `data`, `total`, ...)
 * - a paginated Resource collection (`data` + `meta`)
 * - a plain array (unpaginated), treated as a single page
 */
export function toPageResult<TItem>(body: PageBody<TItem>): PageResult<TItem> {
  if (Array.isArray(body)) {
    return { items: body, page: 1, perPage: body.length, total: body.length, lastPage: 1 }
  }

  if ('meta' in body) {
    const { current_page, last_page, per_page, total } = body.meta
    return { items: body.data, page: current_page, perPage: per_page, total, lastPage: last_page }
  }

  return {
    items: body.data,
    page: body.current_page,
    perPage: body.per_page,
    total: body.total,
    lastPage: body.last_page,
  }
}
