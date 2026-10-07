import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../utils/cn'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center', compact ? 'px-4 py-8' : 'px-6 py-12', className)}>
      <div className="mb-4 grid size-16 place-items-center rounded-3xl bg-primary-soft text-primary">
        <Icon className="size-7" aria-hidden strokeWidth={1.8} />
      </div>
      <p className="text-base font-semibold">{title}</p>
      {description && <p className="mt-1.5 max-w-xs text-sm leading-relaxed whitespace-pre-line text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
