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

  const tones = {
    danger: 'bg-expense-soft text-expense',
    warning: 'bg-warning-soft text-warning',
    info: 'bg-primary-soft text-primary',
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-[26px] bg-surface shadow-card" aria-label="Нагадування">
      {visible.map((r) => (
        <li key={r.id} className="flex items-center gap-3 py-2.5 pr-2 pl-3">
          <span className={cn('grid size-10 shrink-0 place-items-center rounded-2xl', tones[r.tone])}>
            <r.icon className="size-[19px]" aria-hidden />
          </span>
          <Link to={r.to} className="min-w-0 flex-1 rounded-lg py-0.5">
            <span className="block truncate text-[14.5px] font-semibold">{r.title}</span>
            <span className="block truncate text-[13px] text-muted">{r.text}</span>
          </Link>
          <button
            type="button"
            onClick={() => dismiss(r.id)}
            aria-label={`Сховати: ${r.title}`}
            className="press grid size-10 shrink-0 place-items-center rounded-full text-subtle hover:bg-surface-2 hover:text-text"
          >
            <X className="size-[18px]" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  )
}
