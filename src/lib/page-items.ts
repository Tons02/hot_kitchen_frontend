/**
 * The page numbers to show: always the first and last, the current page and its neighbours, and
 * 'ellipsis' for the gaps. e.g. page 6 of 12 → 1 … 5 6 7 … 12.
 */
export function getPageItems(page: number, pageCount: number, siblings = 1): (number | 'ellipsis')[] {
  const pages = new Set([1, pageCount])
  for (let offset = -siblings; offset <= siblings; offset++) {
    const neighbour = page + offset
    if (neighbour >= 1 && neighbour <= pageCount) pages.add(neighbour)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((number, index) => {
    const previous = sorted[index - 1]
    if (previous === undefined || number - previous === 1) return [number]
    // A gap of exactly one page shows that page rather than an ellipsis.
    return number - previous === 2 ? [previous + 1, number] : ['ellipsis' as const, number]
  })
}
