import type { Budget, Debt, FinanceData, Goal, Transaction } from '../types'
import { addMonths, endOfMonth, toLocalISO } from '../utils/date'
import { createDefaultAccounts, createDefaultCategories, createDefaultSettings } from './defaults'

/**
 * Demo data shown on the first launch. Everything is generated relative to
 * "now", so the app always looks alive: the current month has
 * 42 000 ₴ of income, 17 420 ₴ of expenses and 6 500 ₴ of open debts.
 */
export function createDemoData(now = new Date()): FinanceData {
  const transactions: Transaction[] = []
  let seq = 0

  /** Date inside the given month (monthOffset ≤ 0), clamped to [1st day, now]. */
  const at = (monthOffset: number, day: number, time = '12:00'): string => {
    const base = addMonths(now, monthOffset)
    const lastDay = endOfMonth(base).getDate()
    const [h, m] = time.split(':').map(Number)
    let d = new Date(base.getFullYear(), base.getMonth(), Math.min(Math.max(1, day), lastDay), h, m)
    if (d > now) d = new Date(now.getTime() - (++seq % 50 + 5) * 60_000)
    if (d.getMonth() !== now.getMonth() && monthOffset === 0) d = new Date(now.getFullYear(), now.getMonth(), 1, 9, 0)
    return toLocalISO(d)
  }
  /** Day of the current month that is `daysAgo` days before today (never earlier than the 1st). */
  const recent = (daysAgo: number) => Math.max(1, now.getDate() - daysAgo)

  const add = (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'accountId'> & { accountId?: string }) => {
    const id = `tx_demo_${transactions.length + 1}`
    transactions.push({ ...tx, accountId: tx.accountId ?? 'acc_card', id, createdAt: tx.date, updatedAt: tx.date })
  }
  const expense = (date: string, categoryId: string, amount: number, merchant?: string, comment?: string, accountId?: string) =>
    add({ type: 'expense', amount, categoryId, date, merchant, comment, accountId })
  const income = (date: string, categoryId: string, amount: number, merchant?: string, comment?: string, accountId?: string) =>
    add({ type: 'income', amount, categoryId, date, merchant, comment, accountId })

  /* ---------------- Current month: income 42 000, expenses 17 420 ---------------- */
  income(at(0, recent(1), '10:05'), 'cat_salary', 42000, 'ITSTEP', 'Зарплата за вересень')

  expense(at(0, recent(0), '14:32'), 'cat_food', 1240, 'Сільпо', 'Продукти на тиждень')
  expense(at(0, recent(1), '08:47'), 'cat_coffee', 180, "Кав'ярня", 'Флет вайт і круасан', 'acc_cash')
  expense(at(0, recent(2), '19:10'), 'cat_food', 860, 'АТБ')
  expense(at(0, recent(2), '12:30'), 'cat_transport', 320, 'Uklon')
  expense(at(0, recent(3), '18:20'), 'cat_fun', 480, 'Кінотеатр', 'Кіно з друзями')
  expense(at(0, recent(3), '09:15'), 'cat_coffee', 160, "Кав'ярня", undefined, 'acc_cash')
  expense(at(0, recent(4), '17:40'), 'cat_food', 1420, 'Сільпо')
  expense(at(0, recent(4), '11:00'), 'cat_transport', 1800, 'АЗС WOG', 'Пальне')
  expense(at(0, recent(5), '20:15'), 'cat_fun', 1100, 'Steam', 'Гра')
  expense(at(0, recent(5), '13:05'), 'cat_health', 680, 'Аптека')
  expense(at(0, recent(5), '10:20'), 'cat_coffee', 220, 'Пекарня')
  expense(at(0, recent(6), '16:45'), 'cat_home', 2300, 'Епіцентр', 'Товари для дому')
  expense(at(0, recent(6), '09:30'), 'cat_transport', 260, 'Bolt')
  expense(at(0, 1, '19:30'), 'cat_food', 980, 'Novus')
  expense(at(0, 1, '15:00'), 'cat_clothes', 980, 'Магазин одягу', 'Футболка і шкарпетки')
  expense(at(0, 1, '13:40'), 'cat_health', 600, 'Стоматологія', 'Огляд')
  expense(at(0, 1, '12:10'), 'cat_other', 260, 'Нова пошта', 'Доставка')
  expense(at(0, 1, '11:20'), 'cat_food', 740, 'Ринок', undefined, 'acc_cash')
  expense(at(0, 1, '10:45'), 'cat_transport', 740, 'Метро', 'Проїзний на місяць')
  expense(at(0, 1, '10:00'), 'cat_fun', 900, 'Концерт', 'Квитки')
  expense(at(0, 1, '09:40'), 'cat_coffee', 200, "Кав'ярня", undefined, 'acc_cash')
  expense(at(0, 1, '09:00'), 'cat_other', 1000, 'Подарунок', 'День народження друга')

  add({
    type: 'debt_repayment',
    amount: 2000,
    categoryId: null,
    date: at(0, 1, '18:00'),
    debtId: 'debt_dima',
    debtDirection: 'they_owe_me',
    debtPerson: 'Діма',
    comment: 'Частина боргу',
  })
  add({ type: 'transfer', amount: 3000, categoryId: null, date: at(0, 1, '10:30'), toAccountId: 'acc_savings', comment: 'Відкладаю на подушку' })
  add({ type: 'transfer', amount: 1000, categoryId: null, date: at(0, recent(4), '18:00'), toAccountId: 'acc_cash', comment: 'Зняття готівки' })

  /* ---------------- Previous 5 months ---------------- */
  const monthPlans: Array<{ freelance?: number; scale: number }> = [
    { scale: 1.32, freelance: 6000 }, // -1
    { scale: 1.38 }, // -2
    { scale: 1.36, freelance: 4500 }, // -3
    { scale: 1.2 }, // -4
    { scale: 1.4, freelance: 3000 }, // -5
  ]
  const baseExpenses: Array<[number, string, number, string, string?]> = [
    [3, 'cat_food', 1380, 'Сільпо'],
    [7, 'cat_food', 1120, 'АТБ'],
    [12, 'cat_food', 1460, 'Сільпо'],
    [19, 'cat_food', 980, 'Novus'],
    [25, 'cat_food', 1210, 'Сільпо'],
    [4, 'cat_transport', 1700, 'АЗС WOG', 'Пальне'],
    [15, 'cat_transport', 640, 'Uklon'],
    [9, 'cat_fun', 850, 'Кінотеатр'],
    [21, 'cat_fun', 1300, 'Ресторан', 'Вечеря'],
    [10, 'cat_home', 1900, 'Епіцентр'],
    [14, 'cat_utilities', 2020, 'Комунальні послуги', 'Світло, вода, газ'],
    [16, 'cat_utilities', 250, 'Київстар', 'Мобільний звʼязок'],
    [6, 'cat_health', 520, 'Аптека'],
    [11, 'cat_coffee', 180, "Кав'ярня"],
    [18, 'cat_coffee', 210, "Кав'ярня"],
    [23, 'cat_coffee', 160, "Кав'ярня"],
    [17, 'cat_clothes', 1450, 'Магазин одягу'],
    [27, 'cat_other', 640, 'Нова пошта'],
  ]

  monthPlans.forEach((plan, i) => {
    const offset = -(i + 1)
    income(at(offset, 5, '10:00'), 'cat_salary', 40000, 'ITSTEP', 'Зарплата')
    if (plan.freelance) income(at(offset, 20, '16:00'), 'cat_freelance', plan.freelance, 'Фриланс', 'Лендінг для клієнта')
    baseExpenses.forEach(([day, cat, amount, merchant, comment], j) => {
      const wobble = 1 + (((i * 7 + j * 3) % 9) - 4) / 40
      expense(at(offset, day, `${10 + (j % 9)}:${j % 2 ? '15' : '40'}`), cat, Math.round((amount * plan.scale * wobble) / 10) * 10, merchant, comment)
    })
    add({ type: 'transfer', amount: 4000, categoryId: null, date: at(offset, 6, '09:00'), toAccountId: 'acc_savings', comment: 'Накопичення' })
    // Rent paid in cash
    add({ type: 'transfer', amount: 12000, categoryId: null, date: at(offset, 1, '09:00'), toAccountId: 'acc_cash', comment: 'Зняття готівки' })
    expense(at(offset, 1, '12:00'), 'cat_home', 12000, 'Оренда квартири', undefined, 'acc_cash')
  })
  // Big tech purchase two months ago
  expense(at(-2, 22, '15:30'), 'cat_tech', 8999, 'Comfy', 'Навушники та монітор')
  // Repaid Sergiy last month
  add({
    type: 'debt_repayment',
    amount: 1500,
    categoryId: null,
    date: at(-1, 24, '19:00'),
    debtId: 'debt_sergiy',
    debtDirection: 'i_owe',
    debtPerson: 'Сергій',
    comment: 'Повернув повністю',
  })

  /* ---------------- Debts: 6 500 ₴ open ---------------- */
  const debts: Debt[] = [
    {
      id: 'debt_dima',
      direction: 'they_owe_me',
      person: 'Діма',
      amount: 4000,
      repaidAmount: 2000,
      date: at(-1, 12, '13:00'),
      dueDate: toLocalISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8, 12)),
      status: 'pending',
      comment: 'Позичив на ремонт авто',
      createdAt: at(-1, 12, '13:00'),
    },
    {
      id: 'debt_sergiy',
      direction: 'i_owe',
      person: 'Сергій',
      amount: 1500,
      repaidAmount: 1500,
      date: at(-1, 8, '20:00'),
      dueDate: toLocalISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 13, 12)),
      status: 'paid',
      comment: 'Квитки на концерт',
      createdAt: at(-1, 8, '20:00'),
    },
    {
      id: 'debt_mama',
      direction: 'i_owe',
      person: 'Мама',
      amount: 3000,
      repaidAmount: 0,
      date: at(-2, 3, '11:00'),
      dueDate: null,
      status: 'active',
      comment: 'На ремонт ноутбука',
      createdAt: at(-2, 3, '11:00'),
    },
    {
      id: 'debt_oleg',
      direction: 'they_owe_me',
      person: 'Олег',
      amount: 1500,
      repaidAmount: 0,
      date: at(-1, 2, '18:00'),
      dueDate: toLocalISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4, 12)),
      status: 'overdue',
      createdAt: at(-1, 2, '18:00'),
    },
  ]

  /* ---------------- Budgets ---------------- */
  const monthStart = at(0, 1, '00:00')
  const budget = (id: string, categoryId: string | null, amount: number): Budget => ({
    id,
    categoryId,
    amount,
    period: 'month',
    startDate: monthStart,
    endDate: null,
    createdAt: monthStart,
  })
  const budgets: Budget[] = [
    budget('budget_total', null, 25000),
    budget('budget_food', 'cat_food', 7000),
    budget('budget_transport', 'cat_transport', 5000),
    budget('budget_fun', 'cat_fun', 5000),
    budget('budget_coffee', 'cat_coffee', 600),
  ]

  /* ---------------- Goals ---------------- */
  const goal = (
    id: string,
    name: string,
    icon: string,
    color: string,
    target: number,
    initial: number,
    contributions: Array<[number, number]>,
    deadlineMonths: number | null,
    comment?: string,
  ): Goal => {
    const list = contributions.map(([offset, amount], idx) => ({
      id: `${id}_c${idx}`,
      amount,
      date: at(offset, 6, '09:05'),
    }))
    return {
      id,
      name,
      icon,
      color,
      targetAmount: target,
      initialAmount: initial,
      currentAmount: initial + list.reduce((s, c) => s + c.amount, 0),
      deadline: deadlineMonths === null ? null : toLocalISO(new Date(now.getFullYear(), now.getMonth() + deadlineMonths, 1, 12)),
      comment,
      contributions: list,
      createdAt: at(-5, 1, '09:00'),
    }
  }
  const goals: Goal[] = [
    goal('goal_vacation', 'Відпустка', 'plane', '#0EA5E9', 50000, 10000, [[-4, 3000], [-3, 3000], [-2, 3000], [-1, 3000], [0, 3000]], 8, 'Поїздка до Італії'),
    goal('goal_macbook', 'Новий MacBook', 'laptop', '#7C5CFC', 80000, 5000, [[-3, 5000], [-2, 5000], [-1, 5000]], 12),
    goal('goal_safety', 'Подушка безпеки', 'shield', '#10B981', 100000, 3000, [[-5, 2000], [-4, 2000], [-3, 2000], [-2, 2000], [-1, 2000], [0, 2000]], null, '6 місяців витрат'),
  ]

  const accounts = createDefaultAccounts()
  accounts[0].balance = 3200
  accounts[1].balance = 1500
  accounts[2].balance = 6000

  return {
    transactions,
    categories: createDefaultCategories(),
    budgets,
    debts,
    goals,
    accounts,
    settings: createDefaultSettings(),
  }
}
