import { ChartPie, Flag, HandCoins, History, House, LayoutGrid, User, Wallet, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Extra paths that keep this tab highlighted. */
  also?: string[]
}

/**
 * Only 4 short tabs on phones so labels never get cut, even on 320px screens.
 * Everything else (categories, budgets, goals, history, accounts, settings) lives in Профіль.
 */
export const MOBILE_NAV: NavItem[] = [
  { to: '/', label: 'Головна', icon: House },
  { to: '/analytics', label: 'Аналітика', icon: ChartPie },
  { to: '/debts', label: 'Борги', icon: HandCoins },
  { to: '/profile', label: 'Профіль', icon: User, also: ['/categories', '/budgets', '/goals', '/history', '/accounts', '/settings'] },
]

export function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.to === '/') return pathname === '/'
  return [item.to, ...(item.also ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export const DESKTOP_NAV: NavItem[] = [
  { to: '/', label: 'Головна', icon: House },
  { to: '/categories', label: 'Категорії', icon: LayoutGrid },
  { to: '/analytics', label: 'Аналітика', icon: ChartPie },
  { to: '/budgets', label: 'Бюджет', icon: Wallet },
  { to: '/debts', label: 'Борги', icon: HandCoins },
  { to: '/goals', label: 'Цілі', icon: Flag },
  { to: '/history', label: 'Історія', icon: History },
  { to: '/profile', label: 'Профіль', icon: User },
]
