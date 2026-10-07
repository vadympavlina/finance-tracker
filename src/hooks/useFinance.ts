import { useContext, useMemo } from 'react'
import { FinanceContext } from '../store/FinanceContext'
import type { Account, Category } from '../types'

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used inside <FinanceProvider>')
  return ctx
}

/** Lookup maps for categories and accounts (including archived ones, for history). */
export function useLookups() {
  const { data } = useFinance()
  return useMemo(() => {
    const categoryById = new Map<string, Category>(data.categories.map((c) => [c.id, c]))
    const accountById = new Map<string, Account>(data.accounts.map((a) => [a.id, a]))
    return { categoryById, accountById }
  }, [data.categories, data.accounts])
}

/** Accounts that can be used for new operations. */
export function useActiveAccounts() {
  const { data } = useFinance()
  return useMemo(() => data.accounts.filter((a) => !a.isArchived), [data.accounts])
}

/** Categories that can be selected for new operations. */
export function useSelectableCategories(type: Category['type']) {
  const { data } = useFinance()
  return useMemo(() => data.categories.filter((c) => c.type === type && !c.isArchived && !c.isHidden), [data.categories, type])
}

export function useDefaultAccountId(): string {
  const { data } = useFinance()
  const active = data.accounts.filter((a) => !a.isArchived)
  const preferred = active.find((a) => a.id === data.settings.defaultAccountId)
  return (preferred ?? active[0] ?? data.accounts[0])?.id ?? ''
}
