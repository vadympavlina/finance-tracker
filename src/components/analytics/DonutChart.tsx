import { useState } from 'react'
import type { StructureSlice } from '../../services/calculations'
import { formatMoney, formatPercent } from '../../utils/format'

interface DonutChartProps {
  slices: StructureSlice[]
  total: number
  centerLabel: string
  size?: number
  label: string
}

/** SVG donut with 2px surface gaps between segments and a hover-able center readout. */
export function DonutChart({ slices, total, centerLabel, size = 200, label }: DonutChartProps) {
  const [active, setActive] = useState<number | null>(null)
  const stroke = 22
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const gap = slices.length > 1 ? 3 : 0
  let offset = 0
  const focused = active !== null ? slices[active] : null

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        {total > 0 &&
          slices.map((s, i) => {
            const len = (s.amount / total) * c
            const dash = Math.max(0, len - gap)
            const el = (
              <circle
                key={s.id}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={active === i ? stroke + 4 : stroke}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                opacity={active === null || active === i ? 1 : 0.35}
                className="cursor-pointer transition-all duration-200"
                onPointerEnter={() => setActive(i)}
                onPointerDown={() => setActive(i)}
                onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
              />
            )
            offset += len
            return el
          })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <span className="max-w-full truncate text-xs text-muted">{focused ? focused.name : centerLabel}</span>
        <span className="tabular text-lg leading-tight font-bold tracking-tight">{formatMoney(focused ? focused.amount : total)}</span>
        {focused && <span className="tabular text-xs font-medium text-muted">{formatPercent(focused.share)}</span>}
      </div>
    </div>
  )
}
