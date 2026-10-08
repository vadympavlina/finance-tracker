import { CloudSync } from './sync'
import type { CloudBackend } from './types'

export { AuthError, markDemoUntouched } from './sync'
export type { SyncState, SyncStatus, SyncDecision, DecisionChoice, SyncHost } from './sync'
export type { CloudUser } from './types'

const loadBackend = async (): Promise<CloudBackend> => {
  if (import.meta.env.VITE_FAKE_CLOUD === '1') {
    const { createFakeBackend } = await import('./fakeBackend')
    return createFakeBackend({ persist: true })
  }
  const { createFirebaseBackend } = await import('./firebaseBackend')
  return createFirebaseBackend()
}

/** App-wide sync engine; Firebase is downloaded only when it starts. */
export const cloudSync = new CloudSync(loadBackend)
