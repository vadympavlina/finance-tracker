import { Eye, EyeOff } from 'lucide-react'
import { formatMoney, formatSignedMoney } from '../../utils/format'
import { useCountUp } from '../../hooks/useCountUp'
import { TrendBadge } from '../common/TrendBadge'
import { FitText } from '../ui/FitText'

interface BalanceCardProps {
  balance: number
  change: number | null
  delta: number
  hidden: boolean
  onToggleHidden: () => void
}

const MASK = '•••••• ₴'

/** Graphite hero with an emerald glow — the most prominent element of the dashboard. */
export function BalanceCard({ balance, change, delta, hidden, onToggleHidden }: BalanceCardProps) {
  const animated = useCountUp(balance)
  return (
    <section
      aria-label="Загальний баланс"
      className="relative isolate overflow-hidden rounded-[32px] bg-[#121a17] px-6 pt-5 pb-6 text-[#f3f2ed] ring-1 ring-white/5"
    >
      <div
        className="pointer-events-none absolute -right-28 -bottom-36 -z-10 size-[22rem] rounded-full bg-[radial-gradient(circle,rgb(var(--accent-rgb)/0.5),rgb(var(--accent-rgb)/0)_65%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(160deg,black_20%,transparent_75%)]"
        aria-hidden
      />
      <div className="flex items-center justify-between gap-4">
        <p className="inline-flex items-center gap-2 text-[0.8125rem] font-medium tracking-wide text-white/65">
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[rgb(var(--accent-rgb))] opacity-50 [animation-duration:2.4s]" />
            <span className="relative inline-flex size-2 rounded-full bg-[rgb(var(--accent-rgb))]" />
          </span>
          Загальний баланс
        </p>
        <button
          type="button"
          onClick={onToggleHidden}
          aria-label={hidden ? 'Показати баланс' : 'Приховати баланс'}
          aria-pressed={hidden}
          className="press -mr-2 grid size-11 place-items-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"
        >
          {hidden ? <EyeOff className="size-[19px]" aria-hidden /> : <Eye className="size-[19px]" aria-hidden />}
        </button>
      </div>
      <p className="mt-2" aria-live="polite">
        <span className="sr-only">{hidden ? 'Баланс приховано' : formatMoney(balance)}</span>
        <FitText className="tabular text-[2.75rem] leading-none font-semibold tracking-[-0.035em] sm:text-[3.25rem]" min={0.45}>
          <span aria-hidden>{hidden ? MASK : formatMoney(Math.round(balance) === balance ? animated : balance)}</span>
        </FitText>
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[0.8438rem]">
        {!hidden && <TrendBadge value={change} onDark />}
        <span className="text-white/60">
          {hidden || delta === 0 ? 'Цього місяця' : `${formatSignedMoney(delta)} цього місяця`}
        </span>
      </div>
    </section>
  )
}
