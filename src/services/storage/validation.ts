import type {
  Account,
  Budget,
  Category,
  CategoryNote,
  Debt,
  ExportFile,
  FinanceData,
  Goal,
  Settings,
  Transaction,
} from '../../types'
import { createDefaultSettings } from '../../data/defaults'
import { isValidDateString } from '../../utils/date'

export type ValidationResult = { ok: true; data: FinanceData; summary: ImportSummary } | { ok: false; error: string }

export interface ImportSummary {
  transactions: number
  notes: number
  categories: number
  budgets: number
  debts: number
  goals: number
  accounts: number
  exportedAt: string | null
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const optStr = (v: unknown) => v === undefined || v === null || typeof v === 'string'
const optDate = (v: unknown) => v === undefined || v === null || isValidDateString(v)

class InvalidFile extends Error {}

function checkList<T>(
  raw: unknown,
  name: string,
  check: (item: Record<string, unknown>) => boolean,
  normalize: (item: Record<string, unknown>) => T,
): T[] {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) throw new InvalidFile(`Розділ «${name}» має неправильний формат.`)
  return raw.map((item, i) => {
    if (!isObj(item) || !isStr(item.id) || !check(item)) {
      throw new InvalidFile(`Запис №${i + 1} у розділі «${name}» пошкоджений.`)
    }
    return normalize(item)
  })
}

const TX_TYPES = ['income', 'expense', 'transfer', 'debt_repayment', 'adjustment']
const ACCENTS: unknown[] = ['emerald', 'ocean', 'violet', 'rose', 'amber', 'graphite']

/**
 * Validates an import file structure BEFORE anything is written to storage.
 * Returns user-friendly Ukrainian messages, never technical errors.
 */
export function validateImport(json: unknown): ValidationResult {
  try {
    if (!isObj(json)) throw new InvalidFile('Файл не схожий на резервну копію Finance Tracker.')
    if (json.app !== undefined && json.app !== 'finance-tracker') {
      throw new InvalidFile('Цей файл створено іншим застосунком.')
    }
    const hasAny = ['transactions', 'categories', 'accounts'].some((k) => Array.isArray(json[k]))
    if (!hasAny) throw new InvalidFile('У файлі немає операцій, категорій чи рахунків.')

    const accounts = checkList<Account>(
      json.accounts,
      'Рахунки',
      (a) => isStr(a.name) && isNum(a.balance),
      (a) => ({
        id: a.id as string,
        name: a.name as string,
        type: (['card', 'cash', 'savings', 'other'].includes(a.type as string) ? a.type : 'other') as Account['type'],
        balance: a.balance as number,
        currency: (isStr(a.currency) ? a.currency : 'UAH') as Account['currency'],
        isArchived: Boolean(a.isArchived),
        createdAt: isStr(a.createdAt) ? (a.createdAt as string) : new Date().toISOString(),
      }),
    )
    if (!accounts.length) throw new InvalidFile('У файлі має бути хоча б один рахунок.')
    const accountIds = new Set(accounts.map((a) => a.id))

    const categories = checkList<Category>(
      json.categories,
      'Категорії',
      (c) => isStr(c.name) && (c.type === 'income' || c.type === 'expense'),
      (c) => ({
        id: c.id as string,
        name: c.name as string,
        icon: isStr(c.icon) ? (c.icon as string) : 'package',
        color: isStr(c.color) ? (c.color as string) : '#64748B',
        type: c.type as Category['type'],
        isArchived: Boolean(c.isArchived),
        isHidden: Boolean(c.isHidden),
        createdAt: isStr(c.createdAt) ? (c.createdAt as string) : new Date().toISOString(),
      }),
    )

    const transactions = checkList<Transaction>(
      json.transactions,
      'Операції',
      (t) =>
        TX_TYPES.includes(t.type as string) &&
        isNum(t.amount) &&
        (t.amount as number) > 0 &&
        isStr(t.accountId) &&
        accountIds.has(t.accountId as string) &&
        isValidDateString(t.date) &&
        optStr(t.comment) &&
        optStr(t.merchant) &&
        (t.type !== 'transfer' || (isStr(t.toAccountId) && accountIds.has(t.toAccountId as string))),
      (t) => ({
        id: t.id as string,
        type: t.type as Transaction['type'],
        amount: t.amount as number,
        categoryId: isStr(t.categoryId) ? (t.categoryId as string) : null,
        accountId: t.accountId as string,
        toAccountId: isStr(t.toAccountId) ? (t.toAccountId as string) : null,
        date: t.date as string,
        comment: (t.comment as string) || undefined,
        merchant: (t.merchant as string) || undefined,
        debtId: isStr(t.debtId) ? (t.debtId as string) : null,
        debtDirection: t.debtDirection === 'i_owe' || t.debtDirection === 'they_owe_me' ? t.debtDirection : null,
        debtPerson: isStr(t.debtPerson) ? (t.debtPerson as string) : null,
        adjustmentDirection: t.adjustmentDirection === 'out' ? 'out' : t.type === 'adjustment' ? 'in' : null,
        createdAt: isStr(t.createdAt) ? (t.createdAt as string) : (t.date as string),
        updatedAt: isStr(t.updatedAt) ? (t.updatedAt as string) : (t.date as string),
      }),
    )

    const notes = checkList<CategoryNote>(
      json.notes,
      'Нотатки',
      (n) => isStr(n.categoryId) && typeof n.text === 'string' && isValidDateString(n.date),
      (n) => ({
        id: n.id as string,
        categoryId: n.categoryId as string,
        text: n.text as string,
        date: n.date as string,
        createdAt: isStr(n.createdAt) ? (n.createdAt as string) : (n.date as string),
        updatedAt: isStr(n.updatedAt) ? (n.updatedAt as string) : (n.date as string),
      }),
    )

    const budgets = checkList<Budget>(
      json.budgets,
      'Бюджети',
      (b) => isNum(b.amount) && (b.period === 'month' || b.period === 'custom') && isValidDateString(b.startDate) && optDate(b.endDate),
      (b) => ({
        id: b.id as string,
        categoryId: isStr(b.categoryId) ? (b.categoryId as string) : null,
        amount: b.amount as number,
        period: b.period as Budget['period'],
        startDate: b.startDate as string,
        endDate: isStr(b.endDate) ? (b.endDate as string) : null,
        createdAt: isStr(b.createdAt) ? (b.createdAt as string) : (b.startDate as string),
      }),
    )

    const debts = checkList<Debt>(
      json.debts,
      'Борги',
      (d) =>
        (d.direction === 'i_owe' || d.direction === 'they_owe_me') &&
        isStr(d.person) &&
        isNum(d.amount) &&
        optDate(d.dueDate),
      (d) => ({
        id: d.id as string,
        direction: d.direction as Debt['direction'],
        person: d.person as string,
        amount: d.amount as number,
        repaidAmount: isNum(d.repaidAmount) ? (d.repaidAmount as number) : 0,
        date: isValidDateString(d.date) ? (d.date as string) : isStr(d.createdAt) ? (d.createdAt as string) : new Date().toISOString(),
        dueDate: isStr(d.dueDate) ? (d.dueDate as string) : null,
        status: (['active', 'pending', 'overdue', 'paid'].includes(d.status as string) ? d.status : 'active') as Debt['status'],
        comment: (d.comment as string) || undefined,
        createdAt: isStr(d.createdAt) ? (d.createdAt as string) : new Date().toISOString(),
      }),
    )

    const goals = checkList<Goal>(
      json.goals,
      'Цілі',
      (g) => isStr(g.name) && isNum(g.targetAmount) && optDate(g.deadline),
      (g) => {
        const contributions = Array.isArray(g.contributions)
          ? (g.contributions as unknown[]).filter(
              (c): c is Record<string, unknown> => isObj(c) && isNum(c.amount) && isValidDateString(c.date),
            )
          : []
        const list = contributions.map((c, i) => ({
          id: isStr(c.id) ? (c.id as string) : `${g.id}_c${i}`,
          amount: c.amount as number,
          date: c.date as string,
          comment: (c.comment as string) || undefined,
        }))
        const sum = list.reduce((s, c) => s + c.amount, 0)
        const current = isNum(g.currentAmount) ? (g.currentAmount as number) : sum
        return {
          id: g.id as string,
          name: g.name as string,
          targetAmount: g.targetAmount as number,
          initialAmount: isNum(g.initialAmount) ? (g.initialAmount as number) : current - sum,
          currentAmount: current,
          deadline: isStr(g.deadline) ? (g.deadline as string) : null,
          comment: (g.comment as string) || undefined,
          icon: isStr(g.icon) ? (g.icon as string) : 'target',
          color: isStr(g.color) ? (g.color as string) : '#0E8F62',
          contributions: list,
          createdAt: isStr(g.createdAt) ? (g.createdAt as string) : new Date().toISOString(),
        }
      },
    )

    const defaults = createDefaultSettings()
    const rawSettings = isObj(json.settings) ? json.settings : {}
    const settings: Settings = {
      ...defaults,
      ...(rawSettings as Partial<Settings>),
      reminders: { ...defaults.reminders, ...(isObj(rawSettings.reminders) ? (rawSettings.reminders as Partial<Settings['reminders']>) : {}) },
    }
    if (!ACCENTS.includes(settings.accent)) settings.accent = defaults.accent
    if (!['sm', 'md', 'lg', 'xl'].includes(settings.textSize)) settings.textSize = defaults.textSize
    if (!settings.defaultAccountId || !accountIds.has(settings.defaultAccountId)) settings.defaultAccountId = accounts[0].id

    return {
      ok: true,
      data: { transactions, notes, categories, budgets, debts, goals, accounts, settings },
      summary: {
        transactions: transactions.length,
        notes: notes.length,
        categories: categories.length,
        budgets: budgets.length,
        debts: debts.length,
        goals: goals.length,
        accounts: accounts.length,
        exportedAt: isStr(json.exportedAt) ? (json.exportedAt as string) : null,
      },
    }
  } catch (e) {
    return { ok: false, error: e instanceof InvalidFile ? e.message : 'Не вдалося прочитати файл. Перевір, що це коректний JSON.' }
  }
}

export function isExportFile(v: unknown): v is ExportFile {
  return isObj(v) && v.app === 'finance-tracker'
}
