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
      className="relative isolate overflow-hidden rounded-[32px] bg-[#121a17] p-6 text-[#f3f2ed] ring-1 ring-white/5"
    >
      {/* emerald glow + fine grid — the signature of this app */}
      <div className="pointer-events-none absolute -right-24 -bottom-32 -z-10 size-80 rounded-full bg-[radial-gradient(circle,rgba(52,200,141,0.55),rgba(52,200,141,0)_65%)]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-4">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-white/70"><span className="size-2 rounded-full bg-[#34c88d]" aria-hidden />Загальний баланс</p>
        <button
          type="button"
          onClick={onToggleHidden}
          aria-label={hidden ? 'Показати баланс' : 'Приховати баланс'}
          aria-pressed={hidden}
          className="press -mt-2 -mr-2 grid size-11 place-items-center rounded-full bg-white/[0.06] text-white/85 hover:bg-white/15"
        >
          {hidden ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      </div>
      <p className="tabular relative mt-3 text-[42px] leading-none font-semibold tracking-[-0.03em] sm:text-[50px]" aria-live="polite">
        {hidden ? MASK : formatMoney(balance)}
      </p>
      <div className="relative mt-5 flex flex-wrap items-center gap-2 text-sm">
        {!hidden && <TrendBadge value={change} onDark />}
        <span className="text-white/65">
          Цього місяця{!hidden && delta !== 0 ? ` ${formatSignedMoney(delta)}` : ''}
        </span>
      </div>
    </section>
  )
}
