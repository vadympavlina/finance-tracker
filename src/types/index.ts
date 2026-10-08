/**
 * Domain models.
 *
 * All dates are stored as local ISO strings without timezone
 * (e.g. "2026-10-01T14:32:00") — never as localized strings.
 * All amounts are positive numbers in the main currency; the sign of a
 * transaction is derived from its `type` (see calculations/transactions.ts).
 */

export type ID = string

/**
 * adjustment — a manual correction of the month's received money ("додати / відняти"):
 * changes the balance but is neither income nor expense in statistics.
 */
export type TransactionType = 'income' | 'expense' | 'transfer' | 'debt_repayment' | 'adjustment'
export type AdjustmentDirection = 'in' | 'out'

export interface Transaction {
  id: ID
  type: TransactionType
  /** Always positive. */
  amount: number
  /** Required for income / expense, empty for transfer / debt_repayment. */
  categoryId: ID | null
  /** Source account (for transfers — the "from" account). */
  accountId: ID
  /** Destination account, only for transfers. */
  toAccountId?: ID | null
  /** Local ISO date-time: 2026-10-01T14:32:00 */
  date: string
  comment?: string
  merchant?: string
  /** Link to a debt for debt_repayment transactions. */
  debtId?: ID | null
  /**
   * Snapshot of the debt direction at the moment of repayment, so that the
   * transaction stays correct even if the debt is deleted later.
   * they_owe_me → money comes in, i_owe → money goes out.
   */
  debtDirection?: DebtDirection | null
  /** Snapshot of the person name for debt repayments. */
  debtPerson?: string | null
  /** Only for adjustment: in = додати, out = відняти. */
  adjustmentDirection?: AdjustmentDirection | null
  createdAt: string
  updatedAt: string
}

export type CategoryType = 'expense' | 'income'

export interface Category {
  id: ID
  name: string
  /** Key from the icon registry (components/common/icons.ts). */
  icon: string
  /** Hex color, e.g. #7C5CFC */
  color: string
  type: CategoryType
  /** Archived = "deleted" by the user but kept for historical transactions. */
  isArchived: boolean
  /** Hidden from the category selector, still visible in stats. */
  isHidden: boolean
  createdAt: string
}

export type BudgetPeriod = 'month' | 'custom'

export interface Budget {
  id: ID
  /** null = overall monthly budget for all expenses. */
  categoryId: ID | null
  amount: number
  period: BudgetPeriod
  /** For custom periods (local ISO). For monthly budgets — creation month. */
  startDate: string
  endDate: string | null
  createdAt: string
}

export type DebtDirection = 'i_owe' | 'they_owe_me'
export type DebtStatus = 'active' | 'pending' | 'overdue' | 'paid'

export interface Debt {
  id: ID
  direction: DebtDirection
  person: string
  amount: number
  /** Kept in sync with repayment transactions by the store. */
  repaidAmount: number
  /** Date when the debt was created / money was given. */
  date: string
  dueDate: string | null
  /** Kept in sync by the store, but the UI always uses calculateDebtStatus(). */
  status: DebtStatus
  comment?: string
  createdAt: string
}

export interface GoalContribution {
  id: ID
  /** Positive = saved, negative = withdrawn. */
  amount: number
  date: string
  comment?: string
}

export interface Goal {
  id: ID
  name: string
  targetAmount: number
  /** Amount that was already saved when the goal was created. */
  initialAmount: number
  /** initialAmount + sum(contributions). Kept in sync by the store. */
  currentAmount: number
  deadline: string | null
  comment?: string
  icon: string
  color: string
  contributions: GoalContribution[]
  createdAt: string
}

export type AccountType = 'card' | 'cash' | 'savings' | 'other'

export interface Account {
  id: ID
  name: string
  type: AccountType
  /** Opening balance. The current balance is calculated from transactions. */
  balance: number
  currency: CurrencyCode
  isArchived?: boolean
  createdAt: string
}

export type CurrencyCode = 'UAH' | 'USD' | 'EUR' | 'PLN'
export type ThemeMode = 'light' | 'dark' | 'system'
export type TextSize = 'sm' | 'md' | 'lg' | 'xl'

export interface Settings {
  userName: string
  fullName: string
  currency: CurrencyCode
  theme: ThemeMode
  /** Interface text size; everything is sized in rem and scales with it. */
  textSize: TextSize
  hideBalance: boolean
  defaultAccountId: ID | null
  reminders: {
    /** Show a reminder on the dashboard if nothing was recorded today. */
    daily: boolean
    /** HH:mm — after this time the daily reminder appears. */
    dailyTime: string
    /** Show debts that are due soon / overdue. */
    debts: boolean
    /** Show category budgets that are close to the limit. */
    budgets: boolean
  }
  onboarded: boolean
}

/** A timestamped comment inside a category (no money involved). */
export interface CategoryNote {
  id: ID
  categoryId: ID
  text: string
  /** Local ISO date-time the note refers to (defaults to "now"). */
  date: string
  createdAt: string
  updatedAt: string
}

export interface FinanceData {
  transactions: Transaction[]
  notes: CategoryNote[]
  categories: Category[]
  budgets: Budget[]
  debts: Debt[]
  goals: Goal[]
  accounts: Account[]
  settings: Settings
}

export interface ExportFile extends FinanceData {
  app: 'finance-tracker'
  version: number
  exportedAt: string
}
