/** Small, dependency-free date helpers. All storage values are local ISO strings. */

const pad = (n: number) => String(n).padStart(2, '0')

/** Date → "2026-10-01T14:32:00" (local time, no timezone). */
export function toLocalISO(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

/** Date → "2026-10-01" (for <input type="date">). */
export function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Date → "14:32" (for <input type="time">). */
export function toTimeInput(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** "2026-10-01" + "14:32" → local ISO string. */
export function fromDateTimeInputs(date: string, time = '12:00'): string {
  return `${date}T${time.length === 5 ? `${time}:00` : time}`
}

/** Parses a stored ISO string (local, or with timezone) into a Date. */
export function parseDate(value: string | Date): Date {
  if (value instanceof Date) return value
  // "YYYY-MM-DD" alone is parsed as UTC by the spec — force local midnight.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`)
  return new Date(value)
}

export function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(parseDate(value).getTime())
}

export const nowISO = () => toLocalISO(new Date())

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
export function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}
export function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}
/** Monday-based week. */
export function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7
  return startOfDay(addDays(d, -day))
}
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}
export function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1)
}
export function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1)
}
export function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999)
}
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}
export function diffInDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000)
}

export interface DateRange {
  start: Date
  end: Date
}

export function isInRange(value: string | Date, range: DateRange): boolean {
  const t = parseDate(value).getTime()
  return t >= range.start.getTime() && t <= range.end.getTime()
}

export function monthRange(d: Date): DateRange {
  return { start: startOfMonth(d), end: endOfMonth(d) }
}

/* ---------- Ukrainian formatting (UI only) ---------- */

const dayMonthFmt = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' })
const dayMonthYearFmt = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
const monthFmt = new Intl.DateTimeFormat('uk-UA', { month: 'long' })
const monthShortFmt = new Intl.DateTimeFormat('uk-UA', { month: 'short' })
const weekdayShortFmt = new Intl.DateTimeFormat('uk-UA', { weekday: 'short' })
const timeFmt = new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' })

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const stripYearSuffix = (s: string) => s.replace(/\s?р\.$/, '')

/** "1 жовтня" */
export function formatDayMonth(value: string | Date): string {
  return dayMonthFmt.format(parseDate(value))
}
/** "1 жовтня 2026" */
export function formatFullDate(value: string | Date): string {
  return stripYearSuffix(dayMonthYearFmt.format(parseDate(value)))
}
/** "14:32" */
export function formatTime(value: string | Date): string {
  return timeFmt.format(parseDate(value))
}
/** "Жовтень" */
export function formatMonthName(value: string | Date): string {
  return capitalize(monthFmt.format(parseDate(value)))
}
/** "Жовтень 2026" */
export function formatMonthYear(value: string | Date): string {
  const d = parseDate(value)
  return `${formatMonthName(d)} ${d.getFullYear()}`
}
/** "жовт." */
export function formatMonthShort(value: string | Date): string {
  return capitalize(monthShortFmt.format(parseDate(value)).replace('.', ''))
}
/** "пн" */
export function formatWeekdayShort(value: string | Date): string {
  return capitalize(weekdayShortFmt.format(parseDate(value)))
}

/** "Сьогодні" / "Вчора" / "1 жовтня" / "1 жовтня 2025" (other years). */
export function formatRelativeDay(value: string | Date, now = new Date()): string {
  const d = parseDate(value)
  const diff = diffInDays(now, d)
  if (diff === 0) return 'Сьогодні'
  if (diff === 1) return 'Вчора'
  if (diff === -1) return 'Завтра'
  return d.getFullYear() === now.getFullYear() ? formatDayMonth(d) : formatFullDate(d)
}
