/**
 * Calculation layer — the ONLY place where financial numbers are computed.
 * UI components call these functions (usually through hooks/useFinanceStats)
 * and never sum amounts on their own.
 */
export * from './transactions'
export * from './balance'
export * from './stats'
export * from './budgets'
export * from './debts'
export * from './goals'
export * from './analytics'
