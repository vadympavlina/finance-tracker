import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  Account,
  Budget,
  Category,
  CategoryNote,
  Debt,
  FinanceData,
  Goal,
  GoalContribution,
  Settings,
  Transaction,
} from '../types'
import {
  createDemoData,
  createEmptyData,
  loadAllData,
  saveAllData,
  saveCollection,
  saveSettings,
  type CollectionKey,
} from '../services/storage'
import { calculateDebtRepaid, calculateDebtStatus, calculateGoalCurrent } from '../services/calculations'
import { createId } from '../utils/id'
import { nowISO } from '../utils/date'
import { roundMoney, setActiveCurrency } from '../utils/format'
import { useToast } from '../hooks/useUI'
import { cloudSync, markDemoUntouched } from '../services/cloud'

export type TransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
export type CategoryInput = Pick<Category, 'name' | 'icon' | 'color' | 'type'>
export type BudgetInput = Omit<Budget, 'id' | 'createdAt'>
export type DebtInput = Omit<Debt, 'id' | 'createdAt' | 'repaidAmount' | 'status'>
export type GoalInput = Pick<Goal, 'name' | 'targetAmount' | 'initialAmount' | 'deadline' | 'comment' | 'icon' | 'color'>
export type AccountInput = Pick<Account, 'name' | 'type' | 'balance'>

export interface FinanceActions {
  addTransaction(input: TransactionInput): Transaction
  updateTransaction(id: string, patch: Partial<TransactionInput>): void
  deleteTransaction(id: string): void

  addNote(input: { categoryId: string; text: string; date: string }): CategoryNote
  updateNote(id: string, patch: Partial<Pick<CategoryNote, 'text' | 'date'>>): void
  deleteNote(id: string): void

  addCategory(input: CategoryInput): Category
  updateCategory(id: string, patch: Partial<Category>): void
  /** Archives the category if it has operations, removes it otherwise. Returns what happened. */
  deleteCategory(id: string): 'archived' | 'deleted'

  addBudget(input: BudgetInput): Budget
  updateBudget(id: string, patch: Partial<BudgetInput>): void
  deleteBudget(id: string): void

  addDebt(input: DebtInput): Debt
  updateDebt(id: string, patch: Partial<DebtInput>): void
  deleteDebt(id: string): void
  addDebtRepayment(debtId: string, input: { amount: number; accountId: string; date: string; comment?: string }): Transaction

  addGoal(input: GoalInput): Goal
  updateGoal(id: string, patch: Partial<GoalInput>): void
  deleteGoal(id: string): void
  addGoalContribution(goalId: string, input: Omit<GoalContribution, 'id'>): void
  deleteGoalContribution(goalId: string, contributionId: string): void

  addAccount(input: AccountInput): Account
  updateAccount(id: string, patch: Partial<AccountInput>): void
  /** Archives the account if it has operations, removes it otherwise. */
  deleteAccount(id: string): 'archived' | 'deleted'

  updateSettings(patch: Partial<Settings>): void
  replaceAll(data: FinanceData): Promise<void>
  resetToDemo(): Promise<void>
  clearAll(): Promise<void>
}

export interface FinanceContextValue extends FinanceActions {
  data: FinanceData
}

export const FinanceContext = createContext<FinanceContextValue | null>(null)

/** Keeps derived fields (debt repaid/status, goal current) in sync with the source of truth. */
function reconcileDebts(debts: Debt[], transactions: Transaction[]): Debt[] {
  let changed = false
  const next = debts.map((d) => {
    const repaidAmount = calculateDebtRepaid(d, transactions)
    const withRepaid = { ...d, repaidAmount }
    const status = calculateDebtStatus(withRepaid)
    if (repaidAmount === d.repaidAmount && status === d.status) return d
    changed = true
    return { ...withRepaid, status }
  })
  return changed ? next : debts
}

function reconcileGoal(goal: Goal): Goal {
  return { ...goal, currentAmount: calculateGoalCurrent(goal) }
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FinanceData | null>(null)
  const dataRef = useRef<FinanceData | null>(null)
  const toast = useToast()

  const load = useCallback(async () => {
    const loaded = await loadAllData()
    const reconciled = { ...loaded, debts: reconcileDebts(loaded.debts, loaded.transactions) }
    dataRef.current = reconciled
    setActiveCurrency(reconciled.settings.currency)
    setData(reconciled)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Cloud sync: starts once local data is on screen; remote changes replace local data without echoing back.
  const loaded = data !== null
  useEffect(() => {
    if (!loaded) return
    cloudSync.attach({
      getData: () => dataRef.current as FinanceData,
      async applyRemote(remote) {
        const reconciled = { ...remote, debts: reconcileDebts(remote.debts, remote.transactions) }
        dataRef.current = reconciled
        setActiveCurrency(reconciled.settings.currency)
        setData(reconciled)
        await saveAllData(reconciled)
      },
    })
  }, [loaded])

  // Keep several open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('finance-tracker:')) void load()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [load])

  /** Applies a change in memory immediately and persists the touched collections. */
  const commit = useCallback(
    (patch: Partial<FinanceData>) => {
      const current = dataRef.current
      if (!current) return
      const next: FinanceData = { ...current, ...patch }
      if (patch.transactions) {
        const debts = reconcileDebts(next.debts, next.transactions)
        if (debts !== next.debts) {
          next.debts = debts
          patch = { ...patch, debts }
        }
      }
      dataRef.current = next
      setData(next)
      const writes: Promise<void>[] = []
      for (const key of Object.keys(patch) as Array<keyof FinanceData>) {
        if (key === 'settings') writes.push(saveSettings(next.settings))
        else writes.push(saveCollection(key as CollectionKey, next[key as CollectionKey]))
      }
      Promise.all(writes).catch(() => toast('Не вдалося зберегти дані. Перевір вільне місце в браузері.', 'error'))
      markDemoUntouched(false)
      cloudSync.push(current, next, Object.keys(patch) as Array<keyof FinanceData>)
    },
    [toast],
  )

  const get = () => dataRef.current as FinanceData

  const actions = useMemo<FinanceActions>(() => {
    const stamp = () => nowISO()
    const replaceAll = async (next: FinanceData) => {
      const reconciled = { ...next, debts: reconcileDebts(next.debts, next.transactions) }
      await saveAllData(reconciled)
      dataRef.current = reconciled
      setActiveCurrency(reconciled.settings.currency)
      setData(reconciled)
      markDemoUntouched(false)
      cloudSync.pushAll(reconciled)
    }
    return {
      /* ---------- Transactions ---------- */
      addTransaction(input) {
        const tx: Transaction = { ...input, amount: roundMoney(input.amount), id: createId('tx'), createdAt: stamp(), updatedAt: stamp() }
        commit({ transactions: [...get().transactions, tx] })
        return tx
      },
      updateTransaction(id, patch) {
        commit({
          transactions: get().transactions.map((t) =>
            t.id === id ? { ...t, ...patch, amount: roundMoney(patch.amount ?? t.amount), updatedAt: stamp() } : t,
          ),
        })
      },
      deleteTransaction(id) {
        commit({ transactions: get().transactions.filter((t) => t.id !== id) })
      },

      /* ---------- Category notes ---------- */
      addNote(input) {
        const note: CategoryNote = { ...input, text: input.text.trim(), id: createId('note'), createdAt: stamp(), updatedAt: stamp() }
        commit({ notes: [...get().notes, note] })
        return note
      },
      updateNote(id, patch) {
        commit({ notes: get().notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: stamp() } : n)) })
      },
      deleteNote(id) {
        commit({ notes: get().notes.filter((n) => n.id !== id) })
      },

      /* ---------- Categories ---------- */
      addCategory(input) {
        const category: Category = { ...input, id: createId('cat'), isArchived: false, isHidden: false, createdAt: stamp() }
        commit({ categories: [...get().categories, category] })
        return category
      },
      updateCategory(id, patch) {
        commit({ categories: get().categories.map((c) => (c.id === id ? { ...c, ...patch, id } : c)) })
      },
      deleteCategory(id) {
        const { categories, transactions, budgets } = get()
        const used = transactions.some((t) => t.categoryId === id) || get().notes.some((n) => n.categoryId === id)
        const nextBudgets = budgets.filter((b) => b.categoryId !== id)
        if (used) {
          commit({
            categories: categories.map((c) => (c.id === id ? { ...c, isArchived: true } : c)),
            budgets: nextBudgets,
          })
          return 'archived'
        }
        commit({ categories: categories.filter((c) => c.id !== id), budgets: nextBudgets })
        return 'deleted'
      },

      /* ---------- Budgets ---------- */
      addBudget(input) {
        const budget: Budget = { ...input, amount: roundMoney(input.amount), id: createId('budget'), createdAt: stamp() }
        commit({ budgets: [...get().budgets, budget] })
        return budget
      },
      updateBudget(id, patch) {
        commit({ budgets: get().budgets.map((b) => (b.id === id ? { ...b, ...patch } : b)) })
      },
      deleteBudget(id) {
        commit({ budgets: get().budgets.filter((b) => b.id !== id) })
      },

      /* ---------- Debts ---------- */
      addDebt(input) {
        const base: Debt = {
          ...input,
          amount: roundMoney(input.amount),
          id: createId('debt'),
          repaidAmount: 0,
          status: 'active',
          createdAt: stamp(),
        }
        const debt = { ...base, status: calculateDebtStatus(base) }
        commit({ debts: [...get().debts, debt] })
        return debt
      },
      updateDebt(id, patch) {
        const { debts, transactions } = get()
        const nextDebts = debts.map((d) => (d.id === id ? { ...d, ...patch } : d))
        // Keep person snapshot on repayment transactions in sync with the renamed debt.
        const renamed = patch.person ? transactions.map((t) => (t.debtId === id ? { ...t, debtPerson: patch.person } : t)) : null
        commit(renamed ? { debts: reconcileDebts(nextDebts, renamed), transactions: renamed } : { debts: reconcileDebts(nextDebts, transactions) })
      },
      deleteDebt(id) {
        // Repayment transactions stay in history — they were real money movements.
        commit({
          debts: get().debts.filter((d) => d.id !== id),
          transactions: get().transactions.map((t) => (t.debtId === id ? { ...t, debtId: null } : t)),
        })
      },
      addDebtRepayment(debtId, input) {
        const debt = get().debts.find((d) => d.id === debtId)
        if (!debt) throw new Error('Debt not found')
        const tx: Transaction = {
          id: createId('tx'),
          type: 'debt_repayment',
          amount: roundMoney(input.amount),
          categoryId: null,
          accountId: input.accountId,
          date: input.date,
          comment: input.comment,
          debtId,
          debtDirection: debt.direction,
          debtPerson: debt.person,
          createdAt: stamp(),
          updatedAt: stamp(),
        }
        commit({ transactions: [...get().transactions, tx] })
        return tx
      },

      /* ---------- Goals ---------- */
      addGoal(input) {
        const goal: Goal = reconcileGoal({ ...input, id: createId('goal'), contributions: [], currentAmount: 0, createdAt: stamp() })
        commit({ goals: [...get().goals, goal] })
        return goal
      },
      updateGoal(id, patch) {
        commit({ goals: get().goals.map((g) => (g.id === id ? reconcileGoal({ ...g, ...patch }) : g)) })
      },
      deleteGoal(id) {
        commit({ goals: get().goals.filter((g) => g.id !== id) })
      },
      addGoalContribution(goalId, input) {
        commit({
          goals: get().goals.map((g) =>
            g.id === goalId
              ? reconcileGoal({ ...g, contributions: [...g.contributions, { ...input, amount: roundMoney(input.amount), id: createId('gc') }] })
              : g,
          ),
        })
      },
      deleteGoalContribution(goalId, contributionId) {
        commit({
          goals: get().goals.map((g) =>
            g.id === goalId ? reconcileGoal({ ...g, contributions: g.contributions.filter((c) => c.id !== contributionId) }) : g,
          ),
        })
      },

      /* ---------- Accounts ---------- */
      addAccount(input) {
        const account: Account = { ...input, currency: get().settings.currency, id: createId('acc'), createdAt: stamp() }
        commit({ accounts: [...get().accounts, account] })
        return account
      },
      updateAccount(id, patch) {
        commit({ accounts: get().accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })
      },
      deleteAccount(id) {
        const { accounts, transactions, settings } = get()
        const used = transactions.some((t) => t.accountId === id || t.toAccountId === id)
        const remaining = accounts.filter((a) => a.id !== id && !a.isArchived)
        const settingsPatch =
          settings.defaultAccountId === id ? { settings: { ...settings, defaultAccountId: remaining[0]?.id ?? null } } : {}
        if (used) {
          commit({ accounts: accounts.map((a) => (a.id === id ? { ...a, isArchived: true } : a)), ...settingsPatch })
          return 'archived'
        }
        commit({ accounts: accounts.filter((a) => a.id !== id), ...settingsPatch })
        return 'deleted'
      },

      /* ---------- Settings & data ---------- */
      updateSettings(patch) {
        const settings = { ...get().settings, ...patch }
        if (patch.currency) setActiveCurrency(patch.currency)
        commit({ settings })
      },
      replaceAll,
      async resetToDemo() {
        const demo = createDemoData()
        demo.settings = { ...demo.settings, userName: get().settings.userName, fullName: get().settings.fullName, theme: get().settings.theme }
        await replaceAll(demo)
      },
      async clearAll() {
        await replaceAll(createEmptyData({ ...get().settings, hideBalance: false, defaultAccountId: 'acc_card' }))
      },
    }
  }, [commit])

  const value = useMemo(() => (data ? { data, ...actions } : null), [data, actions])

  if (!value) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg" role="status" aria-label="Завантаження">
        <div className="size-10 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
      </div>
    )
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}
