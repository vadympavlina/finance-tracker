import type { FinanceData } from '../../types'
import { validateImport } from '../storage/validation'
import { createDefaultAccounts, createDefaultCategories } from '../../data/defaults'
import type { CloudData, CollectionName } from './types'

export const COLLECTIONS: CollectionName[] = ['transactions', 'notes', 'categories', 'budgets', 'debts', 'goals', 'accounts']

/** Realtime Database rejects undefined and drops empty arrays/objects; a JSON round-trip strips undefined. */
const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

const byId = (items: Array<{ id: string }>) => Object.fromEntries(items.map((i) => [i.id, plain(i)]))

export function toCloud(data: FinanceData): CloudData {
  const out: CloudData = { settings: plain(data.settings) }
  for (const key of COLLECTIONS) out[key] = byId(data[key])
  return out
}

/** Turns users/{uid}/data back into app data, normalised by the same validator as file import. */
export function fromCloud(raw: CloudData): FinanceData | null {
  const json: Record<string, unknown> = { settings: raw.settings ?? {} }
  for (const key of COLLECTIONS) {
    const map = raw[key]
    json[key] = map && typeof map === 'object' ? sortForDisplay(Object.values(map) as Array<Record<string, unknown>>) : []
  }
  const res = validateImport(json)
  return res.ok ? res.data : null
}

/** The database keeps maps sorted by key; restore a natural order (creation time, defaults in their usual order). */
let defaultOrder: Map<string, number> | null = null
function sortForDisplay(items: Array<Record<string, unknown>>) {
  defaultOrder ??= new Map([...createDefaultCategories(), ...createDefaultAccounts()].map((d, i) => [d.id, i]))
  const rank = (i: Record<string, unknown>) => defaultOrder!.get(String(i.id)) ?? Number.MAX_SAFE_INTEGER
  return items.sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')) || rank(a) - rank(b) || String(a.id).localeCompare(String(b.id)))
}

/** Keeps the local order for items that already exist; new ones from the cloud go to the end. */
export function mergeOrder(local: FinanceData, remote: FinanceData): FinanceData {
  const out = { ...remote }
  for (const key of COLLECTIONS) {
    const pos = new Map(local[key].map((i, idx) => [i.id, idx]))
    const list = [...remote[key]] as Array<{ id: string }>
    list.sort((a, b) => (pos.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (pos.get(b.id) ?? Number.MAX_SAFE_INTEGER))
    ;(out as Record<string, unknown>)[key] = list
  }
  return out
}

/**
 * Stable JSON that ignores what the database cannot keep (undefined, null, empty arrays/objects), key order,
 * and `false` flags (a missing flag means false everywhere in the app; the importer fills them in).
 */
export function canonical(v: unknown): string {
  const norm = (x: unknown): unknown => {
    if (Array.isArray(x)) {
      const arr = x.map(norm).filter((i) => i !== undefined)
      return arr.length ? arr : undefined
    }
    if (x && typeof x === 'object') {
      const entries = Object.keys(x)
        .sort()
        .map((k) => [k, norm((x as Record<string, unknown>)[k])] as const)
        .filter(([, val]) => val !== undefined)
      return entries.length ? Object.fromEntries(entries) : undefined
    }
    return x === null || x === false ? undefined : x
  }
  return JSON.stringify(norm(v)) ?? ''
}

/** Order-independent comparison of two datasets as the database would store them. */
export function sameData(a: FinanceData, b: FinanceData): boolean {
  if (canonical(a.settings) !== canonical(b.settings)) return false
  return COLLECTIONS.every((k) => canonical(byId(a[k])) === canonical(byId(b[k])))
}

/**
 * Minimal multi-path update (relative to users/{uid}/data) that turns `prev` into `next`
 * for the given keys: changed items are written, removed ones set to null.
 */
export function diffPaths(prev: FinanceData, next: FinanceData, keys: Array<keyof FinanceData>): Record<string, unknown> {
  const paths: Record<string, unknown> = {}
  for (const key of keys) {
    if (key === 'settings') {
      if (canonical(prev.settings) !== canonical(next.settings)) paths.settings = plain(next.settings)
      continue
    }
    const before = new Map(prev[key].map((i) => [i.id, canonical(i)]))
    const seen = new Set<string>()
    for (const item of next[key]) {
      seen.add(item.id)
      if (before.get(item.id) !== canonical(item)) paths[`${key}/${item.id}`] = plain(item)
    }
    for (const id of before.keys()) if (!seen.has(id)) paths[`${key}/${id}`] = null
  }
  return paths
}
