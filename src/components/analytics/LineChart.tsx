import { useId, useState } from 'react'
import type { SeriesPoint } from '../../services/calculations'
import { useElementWidth } from '../../hooks/useElementWidth'
import { formatCompact, formatMoney } from '../../utils/format'

interface LineChartProps {
  data: SeriesPoint[]
  color: string
  height?: number
  label: string
}

const PAD_LEFT = 44
const PAD_BOTTOM = 26
const PAD_TOP = 34

/** Area/line chart with a crosshair tooltip. Used for the balance trend. */
export function LineChart({ data, color, height = 220, label }: LineChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const gradientId = useId()
  const [active, setActive] = useState<number | null>(null)
  const shown = active ?? data.length - 1

  const values = data.map((d) => d.value)
  const rawMin = Math.min(...values, 0)
  const rawMax = Math.max(...values, 0)
  const span = rawMax - rawMin || 1
  const min = rawMin - span * 0.05
  const max = rawMax + span * 0.1
  const innerW = Math.max(0, width - PAD_LEFT - 8)
  const innerH = height - PAD_TOP - PAD_BOTTOM
  const x = (i: number) => PAD_LEFT + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2)
  const y = (v: number) => PAD_TOP + innerH - ((v - min) / (max - min)) * innerH

  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ')
  const area = data.length ? `${line} L${x(data.length - 1)},${PAD_TOP + innerH} L${x(0)},${PAD_TOP + innerH} Z` : ''
  const ticks = [rawMin, (rawMin + rawMax) / 2, rawMax]
  const point = data[shown]

  const onMove = (clientX: number, rect: DOMRect) => {
    const rel = clientX - rect.left - PAD_LEFT
    const idx = Math.round((rel / innerW) * (data.length - 1))
    setActive(Math.max(0, Math.min(data.length - 1, idx)))
  }

  return (
    <div ref={ref} className="relative w-full touch-pan-y select-none" style={{ height }}>
      {width > 0 && data.length > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={label}
          onPointerMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerDown={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={PAD_LEFT} x2={width} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray="3 4" />
              <text x={0} y={y(t) + 4} fontSize={11} fill="var(--subtle)">
                {formatCompact(t)}
              </text>
            </g>
          ))}
          <path d={area} fill={`url(#${gradientId})`} className="animate-fade-in" />
          <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" pathLength={1000} className="line-draw" />
          {data.map((d, i) => (
            <text key={d.key} x={x(i)} y={height - 6} textAnchor="middle" fontSize={11} fontWeight={i === shown ? 600 : 400} fill={i === shown ? 'var(--text)' : 'var(--subtle)'}>
              {d.label}
            </text>
          ))}
          {point && (
            <g>
              <line x1={x(shown)} x2={x(shown)} y1={PAD_TOP - 6} y2={PAD_TOP + innerH} stroke={color} strokeOpacity={0.35} strokeDasharray="3 3" />
              <circle cx={x(shown)} cy={y(point.value)} r={5.5} fill={color} stroke="var(--surface)" strokeWidth={2.5} />
            </g>
          )}
        </svg>
      )}
      {width > 0 && point && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl bg-[#121a17] px-2.5 py-1 text-center text-white shadow-float dark:bg-surface-3"
          style={{ left: Math.min(Math.max(x(shown), 60), width - 60) }}
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
