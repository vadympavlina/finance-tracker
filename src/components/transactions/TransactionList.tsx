import { useMemo, useState } from 'react'
import type { Transaction } from '../../types'
import { useLookups } from '../../hooks/useFinance'
import { TransactionItem } from './TransactionItem'
import { TransactionDetailsSheet } from './TransactionDetailsSheet'
import { describeTransaction } from './transactionMeta'
import { formatRelativeDay, parseDate, toDateInput } from '../../utils/date'
import { formatSignedMoney } from '../../utils/format'
import { calculateNetFlow } from '../../services/calculations'

interface TransactionListProps {
  transactions: Transaction[]
  /** Group by day with a header (History). */
  grouped?: boolean
}

/** Renders a list of transactions and owns the details sheet. Expects transactions sorted desc. */
export function TransactionList({ transactions, grouped }: TransactionListProps) {
  const { categoryById, accountById } = useLookups()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? (transactions.find((t) => t.id === selectedId) ?? null) : null

  const groups = useMemo(() => {
    if (!grouped) return null
    const map = new Map<string, Transaction[]>()
    for (const t of transactions) {
      const key = toDateInput(parseDate(t.date))
      const list = map.get(key)
      if (list) list.push(t)
      else map.set(key, [t])
    }
    return [...map.entries()]
  }, [transactions, grouped])

  const renderItem = (t: Transaction, meta: 'date' | 'time') => (
    <li key={t.id}>
      <TransactionItem tx={t} view={describeTransaction(t, categoryById, accountById)} meta={meta} onClick={() => setSelectedId(t.id)} />
    </li>
  )

  return (
    <>
      {groups ? (
        <div className="space-y-5">
          {groups.map(([day, list]) => {
            const net = calculateNetFlow(list)
            return (
              <section key={day} aria-label={formatRelativeDay(day)}>
                <div className="mb-1 flex items-center justify-between px-2">
                  <h3 className="text-sm font-semibold text-muted">{formatRelativeDay(day)}</h3>
                  <span className="tabular text-xs font-medium text-subtle">{net !== 0 ? formatSignedMoney(net) : ''}</span>
                </div>
                <ul className="rounded-[26px] bg-surface shadow-card p-1.5 shadow-card">{list.map((t) => renderItem(t, 'time'))}</ul>
              </section>
            )
          })}
        </div>
      ) : (
        <ul className="-mx-2">{transactions.map((t) => renderItem(t, 'date'))}</ul>
      )}
      <TransactionDetailsSheet tx={selected} onClose={() => setSelectedId(null)} />
    </>
  )
}
