import type { FinanceData } from '../../types'

export interface CloudUser {
  uid: string
  email: string | null
  displayName: string | null
}

export type CollectionName = Exclude<keyof FinanceData, 'settings'>

/** What lives under users/{uid}/data in Realtime Database: every collection as a map keyed by id. */
export type CloudData = Partial<Record<CollectionName, Record<string, unknown>>> & { settings?: unknown }

export interface CloudMeta {
  schema: number
  updatedAt: string
}

/** Everything the sync engine needs from a backend; Firebase in production, in-memory in tests. */
export interface CloudBackend {
  onAuth(cb: (user: CloudUser | null) => void): () => void
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string, name?: string): Promise<void>
  signInWithGoogle(): Promise<void>
  resetPassword(email: string): Promise<void>
  signOut(): Promise<void>
  /** One-off read of users/{uid}/data (null when the account has no data yet). */
  read(uid: string): Promise<CloudData | null>
  /** Live updates of users/{uid}/data. */
  subscribe(uid: string, cb: (data: CloudData | null) => void): () => void
  /** Multi-path update relative to users/{uid}; a null value deletes the path. */
  update(uid: string, paths: Record<string, unknown>): Promise<void>
  onConnection(cb: (online: boolean) => void): () => void
}
