import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, CreditCard, Flag, HandCoins, History, LayoutGrid, Pencil, Settings, Wallet, type LucideIcon } from 'lucide-react'
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
import { StatStrip } from '../components/dashboard/StatStrip'
import { CloudCard } from '../components/cloud/CloudCard'

export default function ProfilePage() {
  const { data, updateSettings } = useFinance()
  const stats = useFinanceStats()
  const toast = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [userName, setUserName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const menu: Array<{ to: string; label: string; hint: string; icon: LucideIcon; tone: string }> = [
    { to: '/debts', label: 'Борги', hint: stats.debt.total ? `Відкрито на ${formatMoney(stats.debt.total)}${stats.debt.overdueCount ? ` · ${stats.debt.overdueCount} прострочено` : ''}` : 'Боргів немає', icon: HandCoins, tone: 'bg-expense-soft text-expense' },
    { to: '/categories', label: 'Категорії', hint: `${data.categories.filter((c) => !c.isArchived).length} активних`, icon: LayoutGrid, tone: 'bg-info-soft text-info' },
    { to: '/budgets', label: 'Бюджет', hint: stats.budgetProgress ? `Використано ${Math.round(stats.budgetProgress.percent)}%` : 'Не встановлено', icon: Wallet, tone: 'bg-warning-soft text-warning' },
    { to: '/goals', label: 'Цілі', hint: `${data.goals.length} ${pluralUk(data.goals.length, ['ціль', 'цілі', 'цілей'])}`, icon: Flag, tone: 'bg-mint-soft text-mint' },
    { to: '/history', label: 'Історія операцій', hint: `${data.transactions.length} ${pluralUk(data.transactions.length, ['операція', 'операції', 'операцій'])}`, icon: History, tone: 'bg-surface-3 text-text' },
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
        <Card className="@container p-5">
          {/* Narrow cards: avatar and edit on top, the name gets the full width below. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-ink text-xl font-bold text-on-ink">
              {initials(data.settings.fullName || data.settings.userName)}
            </span>
            <div className="order-3 w-full min-w-0 @[360px]:order-none @[360px]:w-auto @[360px]:flex-1">
              <p className="text-xl leading-snug font-bold break-words">{data.settings.fullName || data.settings.userName}</p>
              <p className="text-sm text-muted">Фінансовий контроль</p>
            </div>
            <IconButton label="Редагувати профіль" onClick={openEdit} className="ml-auto @[360px]:ml-0">
              <Pencil className="size-[18px]" aria-hidden />
            </IconButton>
          </div>
        </Card>

        <CloudCard />

        <section aria-label={`Статистика за ${formatMonthYear(new Date())}`}>
          <p className="mb-2 px-1 text-sm text-muted">{formatMonthYear(new Date())}</p>
          <StatStrip
            caption={`Підсумки: ${formatMonthYear(new Date())}`}
            items={[
              { label: 'Доходи', value: stats.monthly.income, tone: 'income', change: stats.monthly.incomeChange, to: '/analytics?tab=income' },
              { label: 'Витрати', value: stats.monthly.expenses, tone: 'expense', change: stats.monthly.expensesChange, inverse: true, to: '/analytics' },
              { label: 'Борги', value: stats.debt.total, tone: 'debt', change: null, to: '/debts', hint: stats.debt.overdueCount ? `${stats.debt.overdueCount} прострочено` : undefined },
            ]}
          />
        </section>

        <Card className="divide-y divide-border overflow-hidden">
          {menu.map((m) => (
            <Link key={m.to} to={m.to} className="press flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-surface-2">
              <span className={`grid size-10 place-items-center rounded-full ${m.tone}`}>
                <m.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-semibold">{m.label}</span>
                <span className="block min-w-0 break-words text-sm text-muted">{m.hint}</span>
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
