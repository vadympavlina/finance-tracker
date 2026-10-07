import { getAdapter } from './adapter'

export interface CollectionStorage<T extends { id: string }> {
  key: string
  getAll(): Promise<T[]>
  saveAll(items: T[]): Promise<void>
  getById(id: string): Promise<T | undefined>
  upsert(item: T): Promise<T[]>
  remove(id: string): Promise<T[]>
  clear(): Promise<void>
}

/** Generic repository for a list of entities stored under one key. */
export function createCollectionStorage<T extends { id: string }>(key: string): CollectionStorage<T> {
  const getAll = async () => {
    const data = await getAdapter().read<T[]>(key)
    return Array.isArray(data) ? data : []
  }
  const saveAll = (items: T[]) => getAdapter().write(key, items)

  return {
    key,
    getAll,
    saveAll,
    async getById(id) {
      return (await getAll()).find((i) => i.id === id)
    },
    async upsert(item) {
      const items = await getAll()
      const idx = items.findIndex((i) => i.id === item.id)
      const next = idx === -1 ? [...items, item] : items.map((i) => (i.id === item.id ? item : i))
      await saveAll(next)
      return next
    },
    async remove(id) {
      const next = (await getAll()).filter((i) => i.id !== id)
      await saveAll(next)
      return next
    },
    clear: () => getAdapter().remove(key),
  }
}
