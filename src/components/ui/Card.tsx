import type { HTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-3xl border border-border bg-surface', className)} {...props} />
}

interface SectionProps {
  title: string
  action?: { label: string; to?: string; onClick?: () => void }
  children: ReactNode
  className?: string
  id?: string
}

/** Section with a title row and an optional "Дивитись всі →" link. */
export function Section({ title, action, children, className, id }: SectionProps) {
  const headingId = id ?? `section-${title.replace(/\s+/g, '-')}`
  return (
    <section className={cn('space-y-3', className)} aria-labelledby={headingId}>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg font-bold tracking-tight">
          {title}
        </h2>
        {action &&
          (action.to ? (
            <Link to={action.to} className="press -mr-2 inline-flex items-center gap-0.5 rounded-xl px-2 py-1.5 text-sm font-medium text-primary hover:bg-primary-soft">
              {action.label}
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className="press -mr-2 inline-flex items-center gap-0.5 rounded-xl px-2 py-1.5 text-sm font-medium text-primary hover:bg-primary-soft">
              {action.label}
            </button>
          ))}
      </div>
      {children}
    </section>
  )
}
