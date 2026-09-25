/** Today in the user's time zone as YYYY-MM-DD, the format `<input type="date">` uses. */
export function todayIsoDate(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

const pad = (value: number) => String(value).padStart(2, '0')

/** An API timestamp (ISO, UTC) as the value of `<input type="datetime-local">`, in the user's time zone. */
export function toDateTimeInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** A `datetime-local` value (the user's time zone) as an ISO timestamp in UTC, the API's time zone. */
export function fromDateTimeInputValue(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const DATE_TIME = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** "Sep 26, 2026, 10:00 AM" in the user's locale and time zone. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : DATE_TIME.format(date)
}
