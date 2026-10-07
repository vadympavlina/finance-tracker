import { getIcon } from './icons'
import { cn } from '../../utils/cn'

interface CategoryIconProps {
  icon: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  muted?: boolean
}

const sizes = {
  sm: 'size-9 [&>svg]:size-[18px]',
  md: 'size-11 [&>svg]:size-5',
  lg: 'size-14 [&>svg]:size-6',
}

/** Colored circular icon used for categories, accounts and goals. */
export function CategoryIcon({ icon, color, size = 'md', className, muted }: CategoryIconProps) {
  const Icon = getIcon(icon)
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-full', sizes[size], muted && 'opacity-60 grayscale', className)}
      style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
      aria-hidden
    >
      <Icon strokeWidth={2} />
    </span>
  )
}
