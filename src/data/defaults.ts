import type { Account, Category, Settings } from '../types'

const CREATED = '2026-01-01T00:00:00'

type Preset = Pick<Category, 'id' | 'name' | 'icon' | 'color' | 'type'>

export const EXPENSE_CATEGORY_PRESETS: Preset[] = [
  { id: 'cat_food', name: 'Їжа', icon: 'shopping-cart', color: '#F97316', type: 'expense' },
  { id: 'cat_transport', name: 'Транспорт', icon: 'car', color: '#3B82F6', type: 'expense' },
  { id: 'cat_fun', name: 'Розваги', icon: 'gamepad', color: '#A855F7', type: 'expense' },
  { id: 'cat_home', name: 'Житло', icon: 'home', color: '#6366F1', type: 'expense' },
  { id: 'cat_health', name: "Здоров'я", icon: 'heart-pulse', color: '#10B981', type: 'expense' },
  { id: 'cat_clothes', name: 'Одяг', icon: 'shirt', color: '#EC4899', type: 'expense' },
  { id: 'cat_tech', name: 'Техніка', icon: 'laptop', color: '#0EA5E9', type: 'expense' },
  { id: 'cat_coffee', name: 'Кава та кафе', icon: 'coffee', color: '#8B5E3C', type: 'expense' },
  { id: 'cat_utilities', name: 'Комунальні', icon: 'zap', color: '#F59E0B', type: 'expense' },
  { id: 'cat_other', name: 'Інше', icon: 'package', color: '#64748B', type: 'expense' },
]

export const INCOME_CATEGORY_PRESETS: Preset[] = [
  { id: 'cat_salary', name: 'Зарплата', icon: 'briefcase', color: '#22C55E', type: 'income' },
  { id: 'cat_freelance', name: 'Підробіток', icon: 'laptop', color: '#14B8A6', type: 'income' },
  { id: 'cat_gift', name: 'Подарунок', icon: 'gift', color: '#EC4899', type: 'income' },
  { id: 'cat_refund', name: 'Повернення', icon: 'undo', color: '#0EA5E9', type: 'income' },
  { id: 'cat_sale', name: 'Продаж', icon: 'tag', color: '#F59E0B', type: 'income' },
  { id: 'cat_income_other', name: 'Інше', icon: 'coins', color: '#64748B', type: 'income' },
]

export function createDefaultCategories(): Category[] {
  return [...EXPENSE_CATEGORY_PRESETS, ...INCOME_CATEGORY_PRESETS].map((c) => ({
    ...c,
    isArchived: false,
    isHidden: false,
    createdAt: CREATED,
  }))
}

export function createDefaultAccounts(): Account[] {
  return [
    { id: 'acc_card', name: 'Основна картка', type: 'card', balance: 0, currency: 'UAH', createdAt: CREATED },
    { id: 'acc_cash', name: 'Готівка', type: 'cash', balance: 0, currency: 'UAH', createdAt: CREATED },
    { id: 'acc_savings', name: 'Заощадження', type: 'savings', balance: 0, currency: 'UAH', createdAt: CREATED },
  ]
}

export function createDefaultSettings(): Settings {
  return {
    userName: 'Вадим',
    fullName: 'Vadym Pavlina',
    currency: 'UAH',
    theme: 'light',
    textSize: 'md',
    hideBalance: false,
    defaultAccountId: 'acc_card',
    reminders: { daily: true, dailyTime: '20:00', debts: true, budgets: true },
    onboarded: true,
  }
}

export const ACCOUNT_TYPE_LABELS: Record<Account['type'], string> = {
  card: 'Картка',
  cash: 'Готівка',
  savings: 'Заощадження',
  other: 'Інше',
}

export const ACCOUNT_TYPE_ICONS: Record<Account['type'], string> = {
  card: 'credit-card',
  cash: 'banknote',
  savings: 'piggy-bank',
  other: 'wallet',
}

export const ACCOUNT_TYPE_COLORS: Record<Account['type'], string> = {
  card: '#0E8F62',
  cash: '#22C55E',
  savings: '#0EA5E9',
  other: '#64748B',
}
