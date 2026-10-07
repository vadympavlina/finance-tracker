import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, CreditCard, Flag, History, Pencil, Settings, Wallet, type LucideIcon } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/ui/Card'
import { IconButton, Button } from '../components/ui/Button'
import { Sheet } from '../components/ui/Sheet'
import { TextField } from '../components/ui/Field'
import { useFinance } from '../hooks/useFinance'
import { useFinanceStats } from '../hooks/useFinanceStats'
import { useToast } from '../hooks/useUI'
import { formatMoney, initials, pluralUk } from '../utils/format'
import { formatMonthYear } from '../utils/date'

export default function ProfilePage() {
  const { data, updateSettings } = useFinance()
  const stats = useFinanceStats()
  const toast = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [userName, setUserName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const menu: Array<{ to: string; label: string; hint: string; icon: LucideIcon; tone: string }> = [
    { to: '/budgets', label: 'Бюджет', hint: stats.budgetProgress ? `Використано ${Math.round(stats.budgetProgress.percent)}%` : 'Не встановлено', icon: Wallet, tone: 'bg-warning-soft text-warning' },
    { to: '/goals', label: 'Цілі', hint: `${data.goals.length} ${pluralUk(data.goals.length, ['ціль', 'цілі', 'цілей'])}`, icon: Flag, tone: 'bg-info-soft text-info' },
    { to: '/history', label: 'Історія операцій', hint: `${data.transactions.length} ${pluralUk(data.transactions.length, ['операція', 'операції', 'операцій'])}`, icon: History, tone: 'bg-mint-soft text-mint' },
    { to: '/accounts', label: 'Рахунки', hint: `${stats.accountBalances.length} ${pluralUk(stats.accountBalances.length, ['рахунок', 'рахунки', 'рахунків'])}`, icon: CreditCard, tone: 'bg-primary-soft text-primary' },
    { to: '/settings', label: 'Налаштування', hint: 'Тема, валюта, експорт', icon: Settings, tone: 'bg-surface-3 text-muted' },
  ]

  const openEdit = () => {
    setFullName(data.settings.fullName)
    setUserName(data.settings.userName)
    setError(null)
    setEditOpen(true)
  }

  const save = () => {
    if (!userName.trim()) return setError('Вкажи імʼя для привітання')
    updateSettings({ fullName: fullName.trim() || userName.trim(), userName: userName.trim() })
    toast('Дані збережено')
    setEditOpen(false)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Профіль" />
      <div className="space-y-5">
        <Card className="flex items-center gap-4 p-5">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#6c5ce7,#5b8def)] text-xl font-bold text-white">
            {initials(data.settings.fullName || data.settings.userName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-bold">{data.settings.fullName || data.settings.userName}</p>
            <p className="text-sm text-muted">Фінансовий контроль</p>
          </div>
          <IconButton label="Редагувати профіль" variant="ghost" onClick={openEdit}>
            <Pencil className="size-5" aria-hidden />
          </IconButton>
        </Card>

        <section aria-label={`Статистика за ${formatMonthYear(new Date())}`}>
          <p className="mb-2 px-1 text-sm text-muted">{formatMonthYear(new Date())}</p>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Доходи', value: stats.monthly.income, cls: 'text-income' },
              { label: 'Витрати', value: stats.monthly.expenses, cls: 'text-expense' },
              { label: 'Борги', value: stats.debt.total, cls: 'text-primary' },
            ].map((s) => (
              <Card key={s.label} className="p-3.5 text-center">
                <p className={`tabular truncate text-[15px] font-bold sm:text-lg ${s.cls}`}>{formatMoney(s.value)}</p>
                <p className="mt-0.5 text-xs text-muted">{s.label}</p>
              </Card>
            ))}
          </div>
        </section>

        <Card className="divide-y divide-border overflow-hidden">
          {menu.map((m) => (
            <Link key={m.to} to={m.to} className="press flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-surface-2">
              <span className={`grid size-10 place-items-center rounded-full ${m.tone}`}>
                <m.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{m.label}</span>
                <span className="block truncate text-sm text-muted">{m.hint}</span>
              </span>
              <ChevronRight className="size-5 text-subtle" aria-hidden />
            </Link>
          ))}
        </Card>
      </div>

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Профіль"
        size="sm"
        footer={
          <Button block size="lg" onClick={save}>
            Зберегти
          </Button>
        }
      >
        <form
          className="space-y-4 pt-1"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <TextField label="Повне імʼя" value={fullName} maxLength={50} onChange={(e) => setFullName(e.target.value)} data-autofocus />
          <TextField
            label="Як до тебе звертатися"
            value={userName}
            maxLength={30}
            error={error}
            hint="Використовується у привітанні на головній"
            onChange={(e) => {
              setUserName(e.target.value)
              setError(null)
            }}
          />
          <button type="submit" hidden />
        </form>
      </Sheet>
    </div>
  )
}
