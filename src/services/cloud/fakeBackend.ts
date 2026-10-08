import type { CloudBackend, CloudData, CloudUser } from './types'

/**
 * In-memory stand-in for Firebase used by unit tests and the local E2E build (VITE_FAKE_CLOUD=1).
 * With `persist`, the "cloud" lives in localStorage so several tabs act like several devices.
 */
export function createFakeBackend(opts: { persist?: boolean } = {}): CloudBackend & { db: Record<string, unknown>; setOnline(v: boolean): void } {
  const KEY = 'ft-fake-cloud'
  const AUTH = 'ft-fake-auth'
  let db: Record<string, unknown> = {}
  const load = () => {
    if (!opts.persist) return
    try {
      db = JSON.parse(localStorage.getItem(KEY) || '{}')
    } catch {
      db = {}
    }
  }
  const save = () => opts.persist && localStorage.setItem(KEY, JSON.stringify(db))
  load()
  const users: Record<string, { password: string; user: CloudUser }> = opts.persist ? JSON.parse(localStorage.getItem(AUTH + '-users') || '{}') : {}
  let current: CloudUser | null = opts.persist ? JSON.parse(localStorage.getItem(AUTH) || 'null') : null
  const authCbs = new Set<(u: CloudUser | null) => void>()
  const dataCbs = new Map<string, Set<(d: CloudData | null) => void>>()
  const connCbs = new Set<(v: boolean) => void>()
  let online = true

  const setAuth = (u: CloudUser | null) => {
    current = u
    if (opts.persist) localStorage.setItem(AUTH, JSON.stringify(u))
    authCbs.forEach((cb) => cb(u))
  }
  const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)))
  const dataOf = (uid: string) => clone(((db.users as Record<string, Record<string, unknown>> | undefined)?.[uid]?.data as CloudData | undefined) ?? null)
  const emit = (uid: string) => dataCbs.get(uid)?.forEach((cb) => cb(dataOf(uid)))
  const prune = (o: Record<string, unknown>) => {
    for (const k of Object.keys(o)) {
      const v = o[k]
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        prune(v as Record<string, unknown>)
        if (!Object.keys(v).length) delete o[k]
      }
    }
  }
  const setPath = (path: string, value: unknown) => {
    const parts = path.split('/')
    let node = db as Record<string, unknown>
    for (const p of parts.slice(0, -1)) node = (node[p] ??= {}) as Record<string, unknown>
    const last = parts[parts.length - 1]
    if (value === null) delete node[last]
    else node[last] = clone(value)
    prune(db)
  }
  if (opts.persist) {
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) {
        load()
        if (current) emit(current.uid)
      }
    })
  }

  const fail = (code: string) => Promise.reject(Object.assign(new Error(code), { code }))

  return {
    get db() {
      return db
    },
    setOnline(v) {
      online = v
      connCbs.forEach((cb) => cb(v))
    },
    onAuth(cb) {
      authCbs.add(cb)
      queueMicrotask(() => cb(current))
      return () => authCbs.delete(cb)
    },
    async signIn(email, password) {
      const u = users[email.toLowerCase()]
      if (!u || u.password !== password) return fail('auth/invalid-credential')
      setAuth(u.user)
    },
    async signUp(email, password, name) {
      if (password.length < 6) return fail('auth/weak-password')
      if (users[email.toLowerCase()]) return fail('auth/email-already-in-use')
      const user = { uid: 'u_' + Math.random().toString(36).slice(2, 10), email, displayName: name ?? null }
      users[email.toLowerCase()] = { password, user }
      if (opts.persist) localStorage.setItem(AUTH + '-users', JSON.stringify(users))
      setAuth(user)
    },
    async resetPassword(email) {
      if (!users[email.toLowerCase()]) return fail('auth/user-not-found')
    },
    async signOut() {
      setAuth(null)
    },
    async read(uid) {
      if (!online) return fail('offline')
      return dataOf(uid)
    },
    subscribe(uid, cb) {
      const set = dataCbs.get(uid) ?? new Set()
      set.add(cb)
      dataCbs.set(uid, set)
      queueMicrotask(() => cb(dataOf(uid)))
      return () => set.delete(cb)
    },
    async update(uid, paths) {
      for (const [k, v] of Object.entries(paths)) setPath(`users/${uid}/${k}`, v)
      save()
      emit(uid)
    },
    onConnection(cb) {
      connCbs.add(cb)
      queueMicrotask(() => cb(online))
      return () => connCbs.delete(cb)
    },
  }
}
