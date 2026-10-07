import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, HandCoins, Plus } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { DebtCard } from '../components/debts/DebtCard'
import { DebtDetailsSheet } from '../components/debts/DebtDetailsSheet'
import { Segmented } from '../components/ui/Tabs'
import { Button, IconButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { useFinance } from '../hooks/useFinance'
import { calculateDebtBalance, calculateDebtRemaining, calculateDebtStatus } from '../services/calculations'
import { parseDate } from '../utils/date'
import { formatMoney } from '../utils/format'

type Tab = 'all' | 'i_owe' | 'they_owe_me'

const STATUS_ORDER = { overdue: 0, pending: 1, active: 2, paid: 3 }

export default function DebtsPage() {
  const { data } = useFinance()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? (data.debts.find((d) => d.id === selectedId) ?? null) : null

  const balance = useMemo(() => calculateDebtBalance(data.debts), [data.debts])
  const list = useMemo(
    () =>
      data.debts
        .filter((d) => tab === 'all' || d.direction === tab)
        .map((d) => ({ debt: d, status: calculateDebtStatus(d) }))
        .sort((a, b) => {
          const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
          if (s) return s
          const ad = a.debt.dueDate ? parseDate(a.debt.dueDate).getTime() : Infinity
          const bd = b.debt.dueDate ? parseDate(b.debt.dueDate).getTime() : Infinity
          return ad - bd || calculateDebtRemaining(b.debt) - calculateDebtRemaining(a.debt)
        }),
    [data.debts, tab],
  )
  const open = list.filter((x) => x.status !== 'paid')
  const closed = list.filter((x) => x.status === 'paid')

  const headline = tab === 'all' ? balance.total : tab === 'i_owe' ? balance.iOwe : balance.owedToMe

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Борги"
        actions={
          <IconButton label="Додати борг" variant="primary" onClick={() => navigate('/debts/new')}>
            <Plus className="size-5" aria-hidden />
          </IconButton>
        }
      />
      <div className="space-y-4">
        <Segmented<Tab>
          label="Напрям боргів"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'all', label: 'Всі' },
            { value: 'i_owe', label: 'Мої борги' },
            { value: 'they_owe_me', label: 'Мені винні' },
          ]}
        />

        <section aria-label="Підсумок боргів" className="rounded-[24px] bg-[linear-gradient(135deg,#6c5ce7,#8b6cf0)] p-5 text-white shadow-primary">
          <p className="text-sm text-white/80">
            {tab === 'all' ? 'Загальна сума боргів' : tab === 'i_owe' ? 'Я винен' : 'Мені винні'}
          </p>
          <p className="tabular mt-1 text-[34px] leading-tight font-bold tracking-tight">{formatMoney(headline)}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/12 p-3">
              <p className="flex items-center gap-1 text-xs text-white/75">
                <ArrowUpRight className="size-3.5" aria-hidden /> Я винен
              </p>
              <p className="tabular text-[17px] font-bold">{formatMoney(balance.iOwe)}</p>
            </div>
            <div className="rounded-2xl bg-white/12 p-3">
              <p className="flex items-center gap-1 text-xs text-white/75">
                <ArrowDownLeft className="size-3.5" aria-hidden /> Мені винні
              </p>
              <p className="tabular text-[17px] font-bold">{formatMoney(balance.owedToMe)}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/70">Борги не впливають на баланс, доки гроші реально не передані.</p>
        </section>

        {list.length === 0 ? (
          <Card>
            <EmptyState
              icon={HandCoins}
              title={tab === 'they_owe_me' ? 'Тобі ніхто не винен' : tab === 'i_owe' ? 'У тебе немає боргів' : 'Боргів поки немає'}
              description="Записуй, кому позичив і в кого взяв, щоб нічого не забути."
              action={
                <Button icon={<Plus className="size-5" aria-hidden />} onClick={() => navigate('/debts/new')}>
                  Додати борг
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            {open.length > 0 && (
              <ul className="grid gap-3 lg:grid-cols-2">
                {open.map(({ debt }) => (
                  <li key={debt.id}>
                    <DebtCard debt={debt} onClick={() => setSelectedId(debt.id)} />
                  </li>
                ))}
              </ul>
            )}
            {closed.length > 0 && (
              <section aria-label="Погашені борги" className="space-y-3 pt-2">
                <h2 className="px-1 text-sm font-semibold text-muted">Погашені</h2>
                <ul className="grid gap-3 opacity-90 lg:grid-cols-2">
                  {closed.map(({ debt }) => (
                    <li key={debt.id}>
                      <DebtCard debt={debt} onClick={() => setSelectedId(debt.id)} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
      <DebtDetailsSheet debt={selected} onClose={() => setSelectedId(null)} />
    </div>
  )
}
