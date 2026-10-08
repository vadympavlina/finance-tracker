import { useState } from 'react'
import type { SeriesPoint } from '../../services/calculations'
import { useElementWidth } from '../../hooks/useElementWidth'
import { formatCompact, formatMoney } from '../../utils/format'

interface BarChartProps {
  data: SeriesPoint[]
  color: string
  height?: number
  label: string
}

const PAD_LEFT = 40
const PAD_BOTTOM = 26
const PAD_TOP = 30

function niceMax(value: number): number {
  if (value <= 0) return 100
  const pow = 10 ** Math.floor(Math.log10(value))
  const n = value / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return step * pow
}

/** Lightweight SVG bar chart with hover / tap tooltips and an accessible data table. */
export function BarChart({ data, color, height = 220, label }: BarChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const currentIndex = data.findIndex((d) => d.isCurrent)
  const [active, setActive] = useState<number | null>(null)
  const shown = active ?? (currentIndex >= 0 ? currentIndex : data.length - 1)

  const max = niceMax(Math.max(...data.map((d) => d.value), 0))
  const innerW = Math.max(0, width - PAD_LEFT)
  const innerH = height - PAD_TOP - PAD_BOTTOM
  const slot = data.length ? innerW / data.length : 0
  const barW = Math.max(6, Math.min(28, slot * 0.5))
  const ticks = [0, max / 2, max]
  const y = (v: number) => PAD_TOP + innerH - (v / max) * innerH

  const point = data[shown]
  const tooltipX = PAD_LEFT + slot * shown + slot / 2

  if (!data.some((d) => d.value > 0)) {
    return (
      <div className="grid w-full place-items-center rounded-2xl bg-surface-2 px-4 text-center text-sm text-muted" style={{ height }} role="img" aria-label={`${label}: немає даних`}>
        Ще немає операцій за цей період
      </div>
    )
  }

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={label} className="overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD_LEFT} x2={width} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray={t === 0 ? undefined : '3 4'} />
              <text x={0} y={y(t) + 4} fontSize={11} fill="var(--subtle)" className="tabular">
                {formatCompact(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = PAD_LEFT + slot * i + (slot - barW) / 2
            const h = Math.max(d.value > 0 ? 3 : 0, (d.value / max) * innerH)
            const isShown = i === shown
            return (
              <g key={d.key}>
                <rect
                  x={x}
                  y={PAD_TOP + innerH - h}
                  width={barW}
                  height={h}
                  rx={Math.min(6, barW / 2)}
                  fill={color}
                  opacity={isShown ? 1 : 0.32}
                  className="bar-grow transition-opacity"
                  style={{ animationDelay: `${i * 35}ms` }}
                />
                <text
                  x={PAD_LEFT + slot * i + slot / 2}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={isShown ? 600 : 400}
                  fill={isShown ? 'var(--text)' : 'var(--subtle)'}
                >
                  {d.label}
                </text>
                {/* Hit target larger than the bar */}
                <rect
                  x={PAD_LEFT + slot * i}
                  y={PAD_TOP - 10}
                  width={slot}
                  height={innerH + 10 + PAD_BOTTOM}
                  fill="transparent"
                  onPointerEnter={() => setActive(i)}
                  onPointerDown={() => setActive(i)}
                  onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
                />
              </g>
            )
          })}
        </svg>
      )}
      {width > 0 && point && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl bg-[#121a17] px-2.5 py-1 text-center text-white shadow-float dark:bg-surface-3"
          style={{ left: Math.min(Math.max(tooltipX, 56), width - 56) }}
          aria-hidden
        >
          <span className="tabular block text-[13px] leading-tight font-semibold whitespace-nowrap">{formatMoney(point.value)}</span>
          <span className="block text-[10px] leading-tight whitespace-nowrap text-white/70">{point.fullLabel}</span>
        </div>
      )}
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.fullLabel}</th>
              <td>{formatMoney(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
