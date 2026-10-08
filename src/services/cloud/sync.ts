import type { FinanceData } from '../../types'
import { createEmptyData } from '../storage'
import { createDefaultSettings } from '../../data/defaults'
import { diffPaths, fromCloud, mergeOrder, sameData, toCloud } from './shape'
import type { CloudBackend, CloudData, CloudUser } from './types'

export type SyncStatus =
  | 'starting' // backend loading / auth unknown
  | 'signed-out' // no session — the login screen is shown
  | 'local' // the user chose to work without an account
  | 'connecting' // signed in, first read from the cloud
  | 'synced'
  | 'saving'
  | 'offline'
  | 'error'

export type SyncDecision =
  | { kind: 'cloud-empty'; localTransactions: number }
  | { kind: 'both'; localTransactions: number; cloudTransactions: number }

export type DecisionChoice = 'upload' | 'cloud' | 'fresh'

export interface SyncState {
  status: SyncStatus
  user: CloudUser | null
  decision: SyncDecision | null
  error: string | null
  lastSyncedAt: string | null
}

/** The store side of sync: FinanceProvider implements it. */
export interface SyncHost {
  getData(): FinanceData
  /** Replace app data with what came from the cloud: save locally and render, but do not push back. */
  applyRemote(data: FinanceData): Promise<void>
}

const LS = {
  uid: 'ft-cloud-uid',
  localMode: 'ft-local-mode',
  pending: 'ft-cloud-pending',
  demo: 'ft-demo-untouched',
}
const lsGet = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const lsSet = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k)
    else localStorage.setItem(k, v)
  } catch {
    /* ignore */
  }
}

/** Local data is a freshly seeded demo nobody has touched yet — safe to drop when signing in. */
export const markDemoUntouched = (v: boolean) => lsSet(LS.demo, v ? '1' : null)

const nonEmpty = (raw: CloudData | null) => !!raw && Object.keys(raw).length > 0

/**
 * Keeps local data (the UI's source of truth, always available offline) and
 * users/{uid}/data in Realtime Database in sync. Every local change is sent as a
 * minimal multi-path update; changes from other devices arrive through a live listener.
 */
export class CloudSync {
  private state: SyncState = { status: 'starting', user: null, decision: null, error: null, lastSyncedAt: null }
  private listeners = new Set<() => void>()
  private backend: CloudBackend | null = null
  private host: SyncHost | null = null
  private unsubData: (() => void) | null = null
  private online = true
  private inflight = 0
  private decisionResolve: ((c: DecisionChoice) => void) | null = null
  private started = false
  /** Name typed on sign-up, used for the greeting of a brand new account. */
  private pendingName: string | null = null

  constructor(private loadBackend: () => Promise<CloudBackend>) {}

  /* ---------- state store (for useSyncExternalStore) ---------- */
  getState = () => this.state
  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  private set(patch: Partial<SyncState>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((l) => l())
  }

  get isLinked() {
    return !!this.state.user && !!this.unsubData
  }

  attach(host: SyncHost) {
    this.host = host
    if (!this.started) void this.start()
  }

  private async start() {
    this.started = true
    // Working without an account: Firebase isn't even downloaded until the user asks to sign in.
    if (lsGet(LS.localMode) === '1' && !lsGet(LS.uid)) {
      this.set({ status: 'local' })
      return
    }
    try {
      await this.ready()
    } catch {
      this.set({ status: lsGet(LS.uid) ? 'offline' : 'signed-out', error: 'Не вдалося завантажити модуль синхронізації.' })
    }
  }

  private backendPromise: Promise<CloudBackend> | null = null
  private connectionWatched = false

  /** Loads the backend once and starts listening to auth. */
  private ready(): Promise<CloudBackend> {
    this.backendPromise ??= this.loadBackend().then((backend) => {
      this.backend = backend
      backend.onAuth((user) => void this.handleAuth(user))
      return backend
    })
    this.backendPromise.catch(() => {
      this.backendPromise = null
    })
    return this.backendPromise
  }

  /** The connection indicator only matters (and only opens a socket) for a signed-in user. */
  private watchConnection() {
    if (this.connectionWatched || !this.backend) return
    this.connectionWatched = true
    this.backend.onConnection((online) => {
      this.online = online
      if (!this.state.user || this.state.status === 'connecting' || this.state.status === 'error') return
      this.set({ status: online ? (this.inflight ? 'saving' : 'synced') : 'offline' })
    })
  }

  private async handleAuth(user: CloudUser | null) {
    this.unsubData?.()
    this.unsubData = null
    if (!user) {
      this.set({ user: null, status: lsGet(LS.localMode) === '1' && !lsGet(LS.uid) ? 'local' : 'signed-out', decision: null })
      return
    }
    this.set({ user, status: 'connecting', error: null })
    this.watchConnection()
    const backend = this.backend!
    const host = this.host!
    const linkedUid = lsGet(LS.uid)
    if (linkedUid === user.uid) {
      // Same account as before on this device: no blocking read, so it also opens offline.
      // Changes made while offline (not confirmed by the server) win; then follow the live cloud data.
      if (lsGet(LS.pending) === '1') void this.uploadAll(user.uid, host.getData()).catch(() => {})
      this.listen(user.uid)
      this.set({ status: this.online ? 'synced' : 'offline' })
      return
    }
    try {
      const raw = await backend.read(user.uid)
      const cloud = nonEmpty(raw) ? fromCloud(raw!) : null
      if (nonEmpty(raw) && !cloud) throw new Error('bad-cloud-data')
      const local = host.getData()
      const pristine = lsGet(LS.demo) === '1' || local.transactions.length === 0
      // Local data that belongs to another account on this device is never offered to this one.
      const otherAccount = !!linkedUid && linkedUid !== user.uid

      if (!cloud) {
        const choice = pristine || otherAccount ? 'fresh' : await this.ask({ kind: 'cloud-empty', localTransactions: local.transactions.length })
        const start = choice === 'upload' ? local : this.freshData(local)
        if (choice !== 'upload') await host.applyRemote(start)
        await this.uploadAll(user.uid, start)
      } else {
        const choice = pristine || otherAccount ? 'cloud' : await this.ask({ kind: 'both', localTransactions: local.transactions.length, cloudTransactions: cloud.transactions.length })
        if (choice === 'upload') await this.uploadAll(user.uid, local)
        else await host.applyRemote(cloud)
      }
      lsSet(LS.uid, user.uid)
      lsSet(LS.localMode, null)
      markDemoUntouched(false)
      this.pendingName = null
      this.listen(user.uid)
      this.set({ status: this.online ? 'synced' : 'offline', lastSyncedAt: new Date().toISOString() })
    } catch (e) {
      this.set({
        status: 'error',
        error:
          e instanceof Error && e.message === 'bad-cloud-data'
            ? 'Дані в хмарі пошкоджені. Локальні дані збережено.'
            : this.online
              ? 'Немає доступу до бази даних. Перевір правила доступу у Firebase.'
              : 'Для першого входу потрібен інтернет.',
      })
    }
  }

  private freshData(local: FinanceData): FinanceData {
    const s = local.settings
    const name = this.state.user?.displayName || this.pendingName
    const settings = { ...s, hideBalance: false, defaultAccountId: 'acc_card', onboarded: true }
    if (name) Object.assign(settings, { userName: name.split(' ')[0], fullName: name })
    return createEmptyData(settings)
  }

  private ask(decision: SyncDecision): Promise<DecisionChoice> {
    this.set({ decision })
    return new Promise((resolve) => {
      this.decisionResolve = (c) => {
        this.decisionResolve = null
        this.set({ decision: null })
        resolve(c)
      }
    })
  }

  resolveDecision(choice: DecisionChoice) {
    this.decisionResolve?.(choice)
  }

  private listen(uid: string) {
    this.unsubData = this.backend!.subscribe(uid, (raw) => {
      if (!nonEmpty(raw) || !this.host) return
      const remote = fromCloud(raw!)
      const local = this.host.getData()
      if (!remote || sameData(local, remote)) return
      void this.host.applyRemote(mergeOrder(local, remote))
      this.set({ lastSyncedAt: new Date().toISOString() })
    })
  }

  private async uploadAll(uid: string, data: FinanceData) {
    const cloud = toCloud(data)
    // Replace each collection wholesale (a full replace, unlike the per-item diff).
    const paths: Record<string, unknown> = { 'data/settings': cloud.settings }
    for (const key of COLLECTION_KEYS) paths[`data/${key}`] = cloud[key] && Object.keys(cloud[key]!).length ? cloud[key] : null
    await this.writeRaw(uid, paths)
  }

  private async write(uid: string, dataPaths: Record<string, unknown>) {
    if (!Object.keys(dataPaths).length) return
    const paths = Object.fromEntries(Object.entries(dataPaths).map(([k, v]) => [`data/${k}`, v]))
    await this.writeRaw(uid, paths)
  }

  private async writeRaw(uid: string, paths: Record<string, unknown>) {
    paths.meta = { schema: 1, updatedAt: new Date().toISOString() }
    this.inflight++
    lsSet(LS.pending, '1')
    if (this.state.status === 'synced') this.set({ status: 'saving' })
    try {
      await this.backend!.update(uid, paths)
      this.inflight--
      if (!this.inflight) lsSet(LS.pending, null)
      if (this.state.user) this.set({ status: this.online ? (this.inflight ? 'saving' : 'synced') : 'offline', lastSyncedAt: new Date().toISOString() })
    } catch (e) {
      this.inflight--
      this.set({ status: 'error', error: 'Зміни не збереглися в хмарі (немає доступу). Вони є на цьому пристрої.' })
      throw e
    }
  }

  /** Called by the store after each local change. */
  push(prev: FinanceData, next: FinanceData, keys: Array<keyof FinanceData>) {
    const uid = this.state.user?.uid
    if (!uid || !this.isLinked) return
    void this.write(uid, diffPaths(prev, next, keys)).catch(() => {})
  }

  /** Import / demo / clear: replace everything in the cloud too. */
  pushAll(next: FinanceData) {
    const uid = this.state.user?.uid
    if (!uid || !this.isLinked) return
    void this.uploadAll(uid, next).catch(() => {})
  }

  /* ---------- auth actions (errors are thrown with Ukrainian messages) ---------- */
  async signIn(email: string, password: string) {
    await (await this.ready()).signIn(email, password).catch(rethrow)
  }
  async signUp(email: string, password: string, name?: string) {
    this.pendingName = name?.trim() || null
    await (await this.ready()).signUp(email, password, this.pendingName ?? undefined).catch(rethrow)
  }
  async signInWithGoogle() {
    await (await this.ready()).signInWithGoogle().catch(rethrow)
  }
  async resetPassword(email: string) {
    await (await this.ready()).resetPassword(email).catch(rethrow)
  }
  /** Signs out; local copy of the account's data is replaced by an empty set. */
  async signOut(host?: SyncHost) {
    this.unsubData?.()
    this.unsubData = null
    lsSet(LS.uid, null)
    lsSet(LS.pending, null)
    lsSet(LS.localMode, null)
    markDemoUntouched(false)
    await (await this.ready()).signOut()
    const h = host ?? this.host
    if (h) {
      const d = createDefaultSettings()
      // Keep only how the app looks on this device; the account's data stays in the cloud.
      const { theme, accent, textSize } = h.getData().settings
      await h.applyRemote(createEmptyData({ ...d, theme, accent, textSize }))
    }
  }
  /** Try the first sync again after an error (e.g. once the database rules are published). */
  retry() {
    if (this.state.user) void this.handleAuth(this.state.user)
  }
  continueLocally() {
    lsSet(LS.localMode, '1')
    this.set({ status: 'local' })
  }
  /** Leave local mode and show the login screen (from Profile → "Увійти"). */
  requestLogin() {
    lsSet(LS.localMode, null)
    if (!this.state.user) this.set({ status: 'signed-out' })
    void this.ready().catch(() => {})
  }
}

const COLLECTION_KEYS = ['transactions', 'notes', 'categories', 'budgets', 'debts', 'goals', 'accounts'] as const

const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Неправильний формат email.',
  'auth/missing-email': 'Вкажи email.',
  'auth/missing-password': 'Вкажи пароль.',
  'auth/invalid-credential': 'Неправильний email або пароль.',
  'auth/wrong-password': 'Неправильний email або пароль.',
  'auth/user-not-found': 'Користувача з таким email не знайдено.',
  'auth/email-already-in-use': 'Цей email уже зареєстровано. Спробуй увійти.',
  'auth/weak-password': 'Пароль занадто простий — щонайменше 6 символів.',
  'auth/too-many-requests': 'Забагато спроб. Зачекай трохи й спробуй знову.',
  'auth/network-request-failed': 'Немає зʼєднання з інтернетом.',
  'auth/popup-closed-by-user': 'Вікно входу закрито.',
  'auth/cancelled-popup-request': 'Вікно входу закрито.',
  'auth/popup-blocked': 'Браузер заблокував вікно входу. Дозволь спливні вікна.',
  'auth/operation-not-allowed': 'Цей спосіб входу не увімкнено у Firebase.',
  'auth/unauthorized-domain': 'Цей сайт не додано до дозволених доменів у Firebase Auth.',
  'auth/user-disabled': 'Обліковий запис вимкнено.',
}

export class AuthError extends Error {
  constructor(public code: string) {
    super(MESSAGES[code] ?? 'Не вдалося увійти. Спробуй ще раз.')
  }
}
function rethrow(e: unknown): never {
  const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : 'unknown'
  throw new AuthError(code)
}
