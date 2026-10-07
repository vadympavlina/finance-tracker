import { ChartPie, Flag, HandCoins, History, House, LayoutGrid, User, Wallet, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const MOBILE_NAV: NavItem[] = [
  { to: '/', label: 'Головна', icon: House },
  { to: '/categories', label: 'Категорії', icon: LayoutGrid },
  { to: '/analytics', label: 'Аналітика', icon: ChartPie },
  { to: '/debts', label: 'Борги', icon: HandCoins },
  { to: '/profile', label: 'Профіль', icon: User },
]

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
