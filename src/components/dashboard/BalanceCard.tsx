import { Eye, EyeOff } from 'lucide-react'
import { formatMoney, formatSignedMoney } from '../../utils/format'
import { TrendBadge } from '../common/TrendBadge'

interface BalanceCardProps {
  balance: number
  change: number | null
  delta: number
  hidden: boolean
  onToggleHidden: () => void
}

const MASK = '••••• ₴'

export function BalanceCard({ balance, change, delta, hidden, onToggleHidden }: BalanceCardProps) {
  return (
    <section
      aria-label="Загальний баланс"
      className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#6c5ce7_0%,#7f6cf2_45%,#5b8def_100%)] p-6 text-white shadow-primary"
    >
      <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/10 blur-[2px]" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -left-8 size-44 rounded-full bg-white/[0.07]" aria-hidden />
      <div className="relative flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-white/80">Загальний баланс</p>
        <button
          type="button"
          onClick={onToggleHidden}
          aria-label={hidden ? 'Показати баланс' : 'Приховати баланс'}
          aria-pressed={hidden}
          className="press -mt-2 -mr-2 grid size-11 place-items-center rounded-full text-white/85 hover:bg-white/15"
        >
          {hidden ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      </div>
      <p className="tabular relative mt-1 text-[40px] leading-none font-bold tracking-tight sm:text-[46px]" aria-live="polite">
        {hidden ? MASK : formatMoney(balance)}
      </p>
      <div className="relative mt-5 flex flex-wrap items-center gap-2 text-sm">
        {!hidden && <TrendBadge value={change} onDark />}
        <span className="text-white/80">
          Цього місяця{!hidden && delta !== 0 ? ` ${formatSignedMoney(delta)}` : ''}
        </span>
      </div>
    </section>
  )
}
