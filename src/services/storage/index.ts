import type { ExportFile, FinanceData } from '../../types'
import { createDemoData } from '../../data/demoData'
import { createDefaultAccounts, createDefaultCategories, createDefaultSettings } from '../../data/defaults'
import { getAdapter } from './adapter'
import { accountStorage } from './accountStorage'
import { budgetStorage } from './budgetStorage'
import { categoryStorage } from './categoryStorage'
import { debtStorage } from './debtStorage'
import { goalStorage } from './goalStorage'
import { settingsStorage } from './settingsStorage'
import { transactionStorage } from './transactionStorage'
import { noteStorage } from './noteStorage'
import { validateImport } from './validation'

export { accountStorage, budgetStorage, categoryStorage, debtStorage, goalStorage, noteStorage, settingsStorage, transactionStorage }
export { validateImport } from './validation'
export type { ImportSummary, ValidationResult } from './validation'
export { setAdapter, getAdapter, createMemoryAdapter, localStorageAdapter, StorageError } from './adapter'
export type { StorageAdapter } from './adapter'

export const SCHEMA_VERSION = 1
const META_KEY = 'meta'

interface Meta {
  version: number
  initializedAt: string
}

export type CollectionKey = Exclude<keyof FinanceData, 'settings'>

const collections = {
  transactions: transactionStorage,
  notes: noteStorage,
  categories: categoryStorage,
  budgets: budgetStorage,
  debts: debtStorage,
  goals: goalStorage,
  accounts: accountStorage,
} as const

/**
 * Loads all data. On the very first launch seeds demo data,
 * so the app looks like a real one right away.
 */
export async function loadAllData(): Promise<FinanceData> {
  const meta = await getAdapter().read<Meta>(META_KEY)
  if (!meta) {
    const demo = createDemoData()
    await saveAllData(demo)
    return demo
  }
  const [transactions, notes, categories, budgets, debts, goals, accounts, settings] = await Promise.all([
    transactionStorage.getAll(),
    noteStorage.getAll(),
    categoryStorage.getAll(),
    budgetStorage.getAll(),
    debtStorage.getAll(),
    goalStorage.getAll(),
    accountStorage.getAll(),
    settingsStorage.get(),
  ])
  const defaults = createDefaultSettings()
  return {
    transactions,
    notes,
    categories: categories.length ? categories : createDefaultCategories(),
    budgets,
    debts,
    goals,
    accounts: accounts.length ? accounts : createDefaultAccounts(),
    settings: settings ? { ...defaults, ...settings, reminders: { ...defaults.reminders, ...settings.reminders } } : defaults,
  }
}

export async function saveCollection<K extends CollectionKey>(key: K, items: FinanceData[K]): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (collections[key] as any).saveAll(items)
}

export async function saveSettings(settings: FinanceData['settings']): Promise<void> {
  await settingsStorage.save(settings)
}

export async function saveAllData(data: FinanceData): Promise<void> {
  await Promise.all([
    ...(Object.keys(collections) as CollectionKey[]).map((k) => saveCollection(k, data[k])),
    settingsStorage.save(data.settings),
    getAdapter().write<Meta>(META_KEY, { version: SCHEMA_VERSION, initializedAt: new Date().toISOString() }),
  ])
}

export function buildExport(data: FinanceData): ExportFile {
  return { app: 'finance-tracker', version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), ...data }
}

/** Parses + validates an import file. Nothing is written until the user confirms. */
export function parseImportFile(text: string) {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false as const, error: 'Файл пошкоджений або не є JSON.' }
  }
  return validateImport(json)
}

/** Empty state: default categories + accounts, no operations. */
export function createEmptyData(keepSettings?: FinanceData['settings']): FinanceData {
  return {
    transactions: [],
    notes: [],
    categories: createDefaultCategories(),
    budgets: [],
    debts: [],
    goals: [],
    accounts: createDefaultAccounts(),
    settings: keepSettings ?? createDefaultSettings(),
  }
}

export { createDemoData }
