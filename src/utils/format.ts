import type { CurrencyCode } from '../types'

export const CURRENCIES: Record<CurrencyCode, { symbol: string; label: string }> = {
  UAH: { symbol: '₴', label: 'Гривня (₴)' },
  USD: { symbol: '$', label: 'Долар США ($)' },
  EUR: { symbol: '€', label: 'Євро (€)' },
  PLN: { symbol: 'zł', label: 'Злотий (zł)' },
}

let activeCurrency: CurrencyCode = 'UAH'

/** Set by the store when settings change, so every formatter uses the same symbol. */
export function setActiveCurrency(code: CurrencyCode) {
  activeCurrency = code
}
export function currencySymbol(code: CurrencyCode = activeCurrency) {
  return CURRENCIES[code]?.symbol ?? '₴'
}

/** Non-breaking space keeps "24 580 ₴" on one line. */
const NBSP = ' '

/** 24580 → "24 580", 1240.5 → "1 240,50" */
export function formatNumber(value: number): string {
  const abs = Math.abs(value)
  const rounded = Math.round(abs * 100) / 100
  const [int, frac] = rounded.toFixed(2).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  const sign = value < 0 && rounded !== 0 ? '−' : ''
  return frac === '00' ? `${sign}${grouped}` : `${sign}${grouped},${frac}`
}

/** 24580 → "24 580 ₴" */
export function formatMoney(value: number, code?: CurrencyCode): string {
  return `${formatNumber(value)}${NBSP}${currencySymbol(code)}`
}

/** Signed money for transaction lists: "+42 000 ₴" / "−1 240 ₴" */
export function formatSignedMoney(value: number, code?: CurrencyCode): string {
  if (value === 0) return formatMoney(0, code)
  const sign = value > 0 ? '+' : '−'
  return `${sign}${formatMoney(Math.abs(value), code)}`
}

/** Compact money for chart axes: 12 400 → "12,4 тис." */
export function formatCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')} млн`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace('.', ',').replace(',0', '')} тис`
  return String(Math.round(value))
}

export function formatPercent(value: number, withSign = false): string {
  const rounded = Math.round(value)
  if (withSign) return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded)}%`
  return `${rounded}%`
}

/**
 * Parses user input like "1 240,50" / "1240.5" into a number.
 * Returns NaN for empty or invalid input.
 */
export function parseAmount(input: string): number {
  const cleaned = input.replace(/[\s ]/g, '').replace(',', '.')
  if (!cleaned || !/^\d*\.?\d*$/.test(cleaned)) return Number.NaN
  return Number.parseFloat(cleaned)
}

/** Sanitizes amount input while typing: digits + one decimal separator, max 2 decimals. */
export function sanitizeAmountInput(input: string): string {
  let v = input.replace(/[^\d.,]/g, '').replace('.', ',')
  const firstComma = v.indexOf(',')
  if (firstComma !== -1) {
    v = v.slice(0, firstComma + 1) + v.slice(firstComma + 1).replace(/,/g, '').slice(0, 2)
  }
  v = v.replace(/^0+(?=\d)/, '')
  if (v.startsWith(',')) v = `0${v}`
  const [int, frac] = v.split(',')
  const limitedInt = int.slice(0, 10)
  return frac !== undefined ? `${limitedInt},${frac}` : limitedInt
}

/** Number → string for the amount input: 1240.5 → "1240,5" */
export function amountToInput(value: number): string {
  if (!value) return ''
  return String(Math.round(value * 100) / 100).replace('.', ',')
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function pluralUk(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
  return forms[2]
}
