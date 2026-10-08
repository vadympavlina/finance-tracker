import { beforeEach, describe, expect, it } from 'vitest'
import type { FinanceData, Transaction } from '../../../types'
import { createDemoData } from '../../../data/demoData'
import { createEmptyData } from '../../storage'
import { canonical, diffPaths, fromCloud, sameData, toCloud } from '../shape'
import { CloudSync, type SyncHost } from '../sync'
import { createFakeBackend } from '../fakeBackend'

const NOW = new Date(2026, 9, 7, 15, 0)

// Minimal localStorage for the node test environment.
beforeEach(() => {
  const m = new Map<string, string>()
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
  }
})

const flush = () => new Promise((r) => setTimeout(r, 0))
const tx = (id: string, amount = 100): Transaction => ({
  id,
  type: 'expense',
  amount,
  categoryId: 'cat_food',
  accountId: 'acc_card',
  date: '2026-10-05T12:00:00',
  createdAt: '2026-10-05T12:00:00',
  updatedAt: '2026-10-05T12:00:00',
})

function makeHost(initial: FinanceData) {
  const host = {
    data: initial,
    applied: 0,
    getData: () => host.data,
    async applyRemote(d: FinanceData) {
      host.applied++
      host.data = d
    },
  }
  return host satisfies SyncHost
}

/** Simulates the store: apply locally, then push the diff. */
function change(sync: CloudSync, host: ReturnType<typeof makeHost>, patch: Partial<FinanceData>) {
  const prev = host.data
  host.data = { ...prev, ...patch }
  sync.push(prev, host.data, Object.keys(patch) as Array<keyof FinanceData>)
}

describe('cloud shape', () => {
  it('round-trips through the database shape, ignoring order and empty arrays', () => {
    const demo = createDemoData(NOW)
    const back = fromCloud(JSON.parse(JSON.stringify(toCloud(demo))))
    expect(back).not.toBeNull()
    expect(sameData(demo, back!)).toBe(true)
    expect(canonical({ a: [], b: null, c: { d: undefined } })).toBe(canonical({}))
  })

  it('diffs only changed and removed items', () => {
    const a = createEmptyData()
    a.transactions = [tx('t1'), tx('t2')]
    const b = { ...a, transactions: [tx('t1'), tx('t3', 50)] }
    expect(diffPaths(a, b, ['transactions'])).toEqual({ 'transactions/t2': null, 'transactions/t3': expect.objectContaining({ id: 't3', amount: 50 }) })
    expect(diffPaths(a, a, ['transactions', 'settings'])).toEqual({})
  })
})

describe('cloud sync', () => {
  it('first sign-in with untouched demo data starts a clean account and uploads it', async () => {
    localStorage.setItem('ft-demo-untouched', '1')
    const backend = createFakeBackend()
    const host = makeHost(createDemoData(NOW))
    const sync = new CloudSync(async () => backend)
    sync.attach(host)
    await flush()
    expect(sync.getState().status).toBe('signed-out')
    await sync.signUp('a@b.c', 'secret1', 'Олена Коваль')
    await flush()
    expect(sync.getState().status).toBe('synced')
    expect(host.data.transactions).toHaveLength(0)
    expect(host.data.settings.userName).toBe('Олена')
    const uid = sync.getState().user!.uid
    const stored = (backend.db.users as Record<string, { data: unknown; meta: unknown }>)[uid]
    expect(stored.meta).toBeTruthy()
    expect(Object.keys((stored.data as { categories: object }).categories).length).toBeGreaterThan(3)
  })

  it('asks before uploading real local data, then pushes per-item changes', async () => {
    const backend = createFakeBackend()
    const local = createEmptyData()
    local.transactions = [tx('t1')]
    const host = makeHost(local)
    const sync = new CloudSync(async () => backend)
    sync.attach(host)
    await flush()
    void sync.signUp('x@y.z', 'secret1')
    await flush()
    await flush()
    expect(sync.getState().decision).toEqual({ kind: 'cloud-empty', localTransactions: 1 })
    sync.resolveDecision('upload')
    await flush()
    await flush()
    const uid = sync.getState().user!.uid
    const cloudTx = () => Object.keys(((backend.db.users as Record<string, { data: { transactions?: object } }>)[uid].data.transactions ?? {}))
    expect(cloudTx()).toEqual(['t1'])

    change(sync, host, { transactions: [...host.data.transactions, tx('t2', 40)] })
    await flush()
    expect(cloudTx().sort()).toEqual(['t1', 't2'])
    change(sync, host, { transactions: host.data.transactions.filter((t) => t.id !== 't1') })
    await flush()
    expect(cloudTx()).toEqual(['t2'])
  })

  it('a second device signing in gets the cloud data and live updates', async () => {
    const backend = createFakeBackend()
    const a = makeHost(createEmptyData())
    a.data = { ...a.data, transactions: [tx('t1')] }
    const syncA = new CloudSync(async () => backend)
    syncA.attach(a)
    await flush()
    void syncA.signUp('m@n.o', 'secret1')
    await flush()
    await flush()
    syncA.resolveDecision('upload')
    await flush()
    await flush()

    // Device B shares the backend (same "server"); it has untouched demo data.
    localStorage.removeItem('ft-cloud-uid')
    localStorage.setItem('ft-demo-untouched', '1')
    const b = makeHost(createDemoData(NOW))
    const syncB = new CloudSync(async () => backend)
    syncB.attach(b)
    await flush()
    await flush()
    expect(b.data.transactions.map((t) => t.id)).toEqual(['t1'])

    // A change on A arrives on B.
    change(syncA, a, { transactions: [...a.data.transactions, tx('t9', 7)] })
    await flush()
    expect(b.data.transactions.map((t) => t.id).sort()).toEqual(['t1', 't9'])
  })

  it('reports a clear error when the database denies access', async () => {
    const backend = createFakeBackend()
    backend.read = async () => Promise.reject(Object.assign(new Error('PERMISSION_DENIED'), { code: 'PERMISSION_DENIED' }))
    const host = makeHost(createEmptyData())
    const sync = new CloudSync(async () => backend)
    sync.attach(host)
    await flush()
    await sync.signUp('q@w.e', 'secret1')
    await flush()
    expect(sync.getState().status).toBe('error')
    expect(sync.getState().error).toMatch(/правила/)
  })

  it('maps auth errors to Ukrainian messages', async () => {
    const sync = new CloudSync(async () => createFakeBackend())
    sync.attach(makeHost(createEmptyData()))
    await flush()
    await expect(sync.signIn('no@one.ua', 'whatever')).rejects.toThrow('Неправильний email або пароль.')
    await expect(sync.signUp('a@a.ua', '123')).rejects.toThrow(/6 символів/)
  })

  it("never offers one account's data to another account on the same device", async () => {
    const backend = createFakeBackend()
    const host = makeHost(createEmptyData())
    const sync = new CloudSync(async () => backend)
    sync.attach(host)
    await flush()
    await sync.signUp('anna@x.ua', 'secret1')
    await flush()
    host.data = { ...host.data, transactions: [tx('anna1')] }
    sync.push(createEmptyData(), host.data, ['transactions'])
    await flush()
    // Anna's session ends without a sign-out (e.g. expired); Petro signs in on the same device.
    await backend.signOut()
    await flush()
    await sync.signUp('petro@x.ua', 'secret1')
    await flush()
    expect(sync.getState().decision).toBeNull()
    expect(host.data.transactions).toHaveLength(0)
    const users = backend.db.users as Record<string, { data: { transactions?: object } }>
    const petro = sync.getState().user!.uid
    expect(users[petro].data.transactions).toBeUndefined()
    const anna = Object.keys(users).find((u) => u !== petro)!
    expect(Object.keys(users[anna].data.transactions!)).toEqual(['anna1'])
  })
})
