import { describe, expect, it } from 'vitest'
import type { Account, Budget, Debt, Transaction } from '../../../types'
import {
  calculateBalance,
  calculateAccountBalance,
  calculateBudgetProgress,
  calculateDebtBalance,
  calculateDebtStatus,
  calculateExpenses,
  calculateGoalProgress,
  calculateIncome,
  calculateMonthlyStats,
  calculateCategoryExpenses,
} from '..'
import { createDemoData } from '../../../data/demoData'
import { buildExport, validateImport } from '../../storage'
import { formatMoney, formatSignedMoney, parseAmount, sanitizeAmountInput } from '../../../utils/format'
import { formatFullDate, monthRange } from '../../../utils/date'

const NOW = new Date(2026, 9, 7, 15, 0) // 7 Oct 2026

const account = (id: string, balance = 0): Account => ({ id, name: id, type: 'card', balance, currency: 'UAH', createdAt: '2026-01-01T00:00:00' })
let n = 0
const tx = (partial: Partial<Transaction>): Transaction => ({
  id: `t${++n}`,
  type: 'expense',
  amount: 100,
  categoryId: 'food',
  accountId: 'card',
  date: '2026-10-05T12:00:00',
  createdAt: '2026-10-05T12:00:00',
  updatedAt: '2026-10-05T12:00:00',
  ...partial,
})

describe('balance', () => {
  const accounts = [account('card', 1000), account('cash', 200)]

  it('income increases, expense decreases the balance', () => {
    const list = [tx({ type: 'income', amount: 5000, categoryId: 'salary' }), tx({ amount: 1200 })]
    expect(calculateBalance(accounts, list)).toBe(1000 + 200 + 5000 - 1200)
  })

  it('transfers move money between accounts but keep the total', () => {
    const list = [tx({ type: 'transfer', amount: 300, categoryId: null, toAccountId: 'cash' })]
    expect(calculateBalance(accounts, list)).toBe(1200)
    expect(calculateAccountBalance(accounts[0], list)).toBe(700)
    expect(calculateAccountBalance(accounts[1], list)).toBe(500)
    expect(calculateIncome(list)).toBe(0)
    expect(calculateExpenses(list)).toBe(0)
  })

  it('debt repayments move real money but are not income/expense', () => {
    const list = [
      tx({ type: 'debt_repayment', amount: 2000, categoryId: null, debtDirection: 'they_owe_me', debtId: 'd1' }),
      tx({ type: 'debt_repayment', amount: 500, categoryId: null, debtDirection: 'i_owe', debtId: 'd2' }),
    ]
    expect(calculateBalance(accounts, list)).toBe(1200 + 2000 - 500)
    expect(calculateIncome(list)).toBe(0)
    expect(calculateExpenses(list)).toBe(0)
  })
})

describe('debts', () => {
  const debt = (p: Partial<Debt>): Debt => ({
    id: 'd',
    direction: 'i_owe',
    person: 'X',
    amount: 5000,
    repaidAmount: 0,
    date: '2026-09-01T12:00:00',
    dueDate: null,
    status: 'active',
    createdAt: '2026-09-01T12:00:00',
    ...p,
  })

  it('creating a debt does not change the balance (debts live outside transactions)', () => {
    expect(calculateBalance([account('card', 100)], [])).toBe(100)
  })

  it('computes statuses', () => {
    expect(calculateDebtStatus(debt({}), NOW)).toBe('active')
    expect(calculateDebtStatus(debt({ dueDate: '2026-10-20T12:00:00' }), NOW)).toBe('pending')
    expect(calculateDebtStatus(debt({ dueDate: '2026-10-01T12:00:00' }), NOW)).toBe('overdue')
    expect(calculateDebtStatus(debt({ repaidAmount: 5000, dueDate: '2026-10-01T12:00:00' }), NOW)).toBe('paid')
  })

  it('sums remaining amounts by direction', () => {
    const b = calculateDebtBalance(
      [debt({ id: 'a', amount: 5000, repaidAmount: 2000 }), debt({ id: 'b', direction: 'they_owe_me', amount: 1500 }), debt({ id: 'c', repaidAmount: 5000 })],
      NOW,
    )
    expect(b).toMatchObject({ iOwe: 3000, owedToMe: 1500, total: 4500, openCount: 2 })
  })
})

describe('budgets', () => {
  const budget: Budget = { id: 'b', categoryId: 'food', amount: 1000, period: 'month', startDate: '2026-10-01T00:00:00', endDate: null, createdAt: '2026-10-01T00:00:00' }
  it('tracks progress and exceeding', () => {
    expect(calculateBudgetProgress(budget, [tx({ amount: 700 })], NOW)).toMatchObject({ spent: 700, remaining: 300, status: 'ok' })
    expect(calculateBudgetProgress(budget, [tx({ amount: 850 })], NOW).status).toBe('warning')
    const over = calculateBudgetProgress(budget, [tx({ amount: 700 }), tx({ amount: 400 })], NOW)
    expect(over).toMatchObject({ spent: 1100, remaining: -100, status: 'exceeded' })
  })
  it('ignores other categories and previous months', () => {
    const p = calculateBudgetProgress(budget, [tx({ categoryId: 'fun', amount: 900 }), tx({ amount: 900, date: '2026-09-20T12:00:00' })], NOW)
    expect(p.spent).toBe(0)
  })
})

describe('goals', () => {
  it('computes progress and remaining', () => {
    const p = calculateGoalProgress(
      { id: 'g', name: 'Відпустка', targetAmount: 50000, initialAmount: 25000, currentAmount: 25000, deadline: null, icon: 'plane', color: '#000', contributions: [], createdAt: '' },
      NOW,
    )
    expect(p).toMatchObject({ percent: 50, remaining: 25000, isCompleted: false })
  })
})

describe('demo data', () => {
  const demo = createDemoData(NOW)
  it('matches the headline numbers', () => {
    const m = calculateMonthlyStats(demo.transactions, NOW)
    expect(m.income).toBe(42000)
    expect(m.expenses).toBe(17420)
    expect(calculateDebtBalance(demo.debts, NOW).total).toBe(6500)
  })
  it('category breakdown sums to total expenses', () => {
    const cats = calculateCategoryExpenses(demo.transactions, demo.categories, monthRange(NOW))
    expect(cats.reduce((s, c) => s + c.amount, 0)).toBe(17420)
  })
  it('all accounts stay positive', () => {
    for (const a of demo.accounts) expect(calculateAccountBalance(a, demo.transactions)).toBeGreaterThan(0)
  })
  it('round-trips through export → import validation', () => {
    const res = validateImport(JSON.parse(JSON.stringify(buildExport(demo))))
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.data.transactions).toHaveLength(demo.transactions.length)
  })
})

describe('import validation', () => {
  it('rejects garbage with a friendly message', () => {
    const res = validateImport({ foo: 1 })
    expect(res.ok).toBe(false)
    const bad = validateImport({ accounts: [{ id: 'a', name: 'A', balance: 0 }], transactions: [{ id: 't', type: 'expense', amount: -5, accountId: 'a', date: 'x' }] })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.error).toMatch(/Операції/)
  })
})

describe('formatting', () => {
  it('formats UAH with spaces', () => {
    expect(formatMoney(24580)).toBe('24 580 ₴')
    expect(formatSignedMoney(-1240)).toBe('−1 240 ₴')
    expect(formatSignedMoney(42000)).toBe('+42 000 ₴')
    expect(formatMoney(1240.5)).toBe('1 240,50 ₴')
  })
  it('parses amounts', () => {
    expect(parseAmount('1 240,50')).toBe(1240.5)
    expect(parseAmount('')).toBeNaN()
    expect(sanitizeAmountInput('12.345')).toBe('12,34')
    expect(sanitizeAmountInput('0012')).toBe('12')
  })
  it('formats dates in Ukrainian', () => {
    expect(formatFullDate('2026-10-01T14:32:00')).toBe('1 жовтня 2026')
  })
})

describe('month summary', () => {
  it('було + отримано − витрачено = залишилось; відняти зменшує отримане, але не є витратою', async () => {
    const { calculateMonthSummary } = await import('..')
    const accounts = [account('card', 1000)]
    const list = [
      tx({ type: 'income', amount: 20000, categoryId: 'salary', date: '2026-10-02T10:00:00' }),
      tx({ type: 'adjustment', amount: 1500, categoryId: null, adjustmentDirection: 'out', date: '2026-10-03T10:00:00' }),
      tx({ type: 'adjustment', amount: 500, categoryId: null, adjustmentDirection: 'in', date: '2026-10-03T11:00:00' }),
      tx({ amount: 4000, date: '2026-10-04T10:00:00' }),
      tx({ amount: 999, date: '2026-09-20T10:00:00' }),
    ]
    const s = calculateMonthSummary(list, accounts, NOW, NOW)
    expect(s.opening).toBe(1000 - 999)
    expect(s.received).toBe(20000 - 1500 + 500)
    expect(s.expenses).toBe(4000)
    expect(s.closing).toBe(s.opening + s.received - s.expenses)
    expect(calculateExpenses(list, monthRange(NOW))).toBe(4000)
    expect(calculateIncome(list, monthRange(NOW))).toBe(20000)
  })

  it('imports notes and adjustments', () => {
    const demo = createDemoData(NOW)
    demo.transactions.push(tx({ id: 'adj', type: 'adjustment', amount: 10, categoryId: null, accountId: 'acc_card', adjustmentDirection: 'out' }))
    const res = validateImport(JSON.parse(JSON.stringify(buildExport(demo))))
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.data.notes.length).toBe(demo.notes.length)
      expect(res.data.transactions.find((t) => t.id === 'adj')?.adjustmentDirection).toBe('out')
    }
  })

  it('keeps a valid accent and falls back for unknown ones', () => {
    const demo = createDemoData(NOW)
    const ok = validateImport(JSON.parse(JSON.stringify(buildExport({ ...demo, settings: { ...demo.settings, accent: 'violet' } }))))
    expect(ok.ok && ok.data.settings.accent).toBe('violet')
    const raw = JSON.parse(JSON.stringify(buildExport(demo)))
    raw.settings.accent = 'neon'
    const bad = validateImport(raw)
    expect(bad.ok && bad.data.settings.accent).toBe('emerald')
  })
})
