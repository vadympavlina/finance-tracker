import { useSyncExternalStore } from 'react'
import { cloudSync, type SyncState } from '../services/cloud'

/** Live sync / auth state. */
export function useCloud(): SyncState {
  return useSyncExternalStore(cloudSync.subscribe, cloudSync.getState)
}
