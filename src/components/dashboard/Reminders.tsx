import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlarmClock, AlertTriangle, CalendarClock, X } from 'lucide-react'
import { useFinance } from '../../hooks/useFinance'
import { calculateBudgetProgress, calculateDebtRemaining, getUpcomingDebts } from '../../services/calculations'
import { diffInDays, isSameDay, parseDate } from '../../utils/date'
import { formatMoney, pluralUk } from '../../utils/format'
import { cn } from '../../utils/cn'

interface Reminder {
  id: string
  tone: 'warning' | 'danger' | 'info'
  icon: typeof AlarmClock
  title: string
  text: string
  to: string
}

/** Reminders based on settings: overdue / upcoming debts, budgets, daily logging. */
export function Reminders() {
  const { data } = useFinance()
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('ft:dismissed') ?? '[]') as string[]
    } catch {
      return []
    }
  })

  const reminders = useMemo<Reminder[]>(() => {
    const now = new Date()
    const list: Reminder[] = []
    const { reminders: cfg } = data.settings

    if (cfg.debts) {
      for (const d of getUpcomingDebts(data.debts, 3, now).slice(0, 2)) {
        const days = diffInDays(parseDate(d.dueDate!), now)
        const theyOwe = d.direction === 'they_owe_me'
        list.push({
          id: `debt-${d.id}-${days}`,
          tone: days < 0 ? 'danger' : 'warning',
          icon: CalendarClock,
          title: days < 0 ? `Прострочений борг · ${d.person}` : `Скоро повернення · ${d.person}`,
          text: `${theyOwe ? 'Тобі винні' : 'Ти винен'} ${formatMoney(calculateDebtRemaining(d))} — ${
            days < 0 ? `${Math.abs(days)} ${pluralUk(Math.abs(days), ['день', 'дні', 'днів'])} тому` : days === 0 ? 'сьогодні' : `через ${days} ${pluralUk(days, ['день', 'дні', 'днів'])}`
          }`,
          to: '/debts',
        })
      }
    }

    if (cfg.budgets) {
      const exceeded = data.budgets
        .map((b) => calculateBudgetProgress(b, data.transactions, now))
        .filter((p) => p.isActive && p.status === 'exceeded')
      if (exceeded.length) {
        const names = exceeded.map((p) => (p.budget.categoryId ? data.categories.find((c) => c.id === p.budget.categoryId)?.name : 'Загальний')).filter(Boolean)
        list.push({
          id: `budget-${exceeded.map((p) => p.budget.id).join('-')}`,
          tone: 'danger',
          icon: AlertTriangle,
          title: 'Перевищено бюджет',
          text: names.join(', '),
          to: '/budgets',
        })
      }
    }

    if (cfg.daily) {
      const [h, m] = cfg.dailyTime.split(':').map(Number)
      const after = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)
      const loggedToday = data.transactions.some((t) => isSameDay(parseDate(t.createdAt), now) || isSameDay(parseDate(t.date), now))
      if (after && !loggedToday) {
        list.push({
          id: `daily-${now.toDateString()}`,
          tone: 'info',
          icon: AlarmClock,
          title: 'Не забудь записати витрати',
          text: 'Сьогодні ще немає жодної операції',
          to: '/add/expense',
        })
      }
    }
    return list
  }, [data])

  const visible = reminders.filter((r) => !dismissed.includes(r.id))
  if (!visible.length) return null

  const dismiss = (id: string) => {
    const next = [...dismissed, id]
    setDismissed(next)
    try {
      sessionStorage.setItem('ft:dismissed', JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  return (
    <ul className="space-y-2" aria-label="Нагадування">
      {visible.map((r) => (
        <li
          key={r.id}
          className={cn(
            'flex items-center gap-3 rounded-[18px] border p-3 pl-3.5',
            r.tone === 'danger' && 'border-expense/20 bg-expense-soft',
            r.tone === 'warning' && 'border-warning/20 bg-warning-soft',
            r.tone === 'info' && 'border-primary/15 bg-primary-soft',
          )}
        >
          <r.icon
            className={cn('size-5 shrink-0', r.tone === 'danger' ? 'text-expense' : r.tone === 'warning' ? 'text-warning' : 'text-primary')}
            aria-hidden
          />
          <Link to={r.to} className="min-w-0 flex-1 rounded-lg">
            <span className="block truncate text-sm font-semibold">{r.title}</span>
            <span className="block truncate text-[13px] text-muted">{r.text}</span>
          </Link>
          <button type="button" onClick={() => dismiss(r.id)} aria-label="Сховати нагадування" className="press grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-black/5">
            <X className="size-4" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  )
}
