import type { Settings } from '../../types'
import { getAdapter } from './adapter'

const KEY = 'settings'

export const settingsStorage = {
  key: KEY,
  async get(): Promise<Settings | null> {
    return getAdapter().read<Settings>(KEY)
  },
  async save(settings: Settings): Promise<void> {
    await getAdapter().write(KEY, settings)
  },
  async clear(): Promise<void> {
    await getAdapter().remove(KEY)
  },
}
