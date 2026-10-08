import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'danger-soft' | 'soft'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  block?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-on-ink hover:bg-ink-2',
  accent: 'bg-primary text-on-primary shadow-primary hover:bg-primary-strong',
  secondary: 'bg-surface text-text border border-border-strong hover:bg-surface-2',
  ghost: 'text-muted hover:text-text hover:bg-surface-2',
  danger: 'bg-expense text-white hover:brightness-95',
  'danger-soft': 'bg-expense-soft text-expense hover:brightness-[0.97]',
  soft: 'bg-primary-soft text-primary hover:brightness-[0.97]',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-full gap-1.5',
  md: 'h-11 px-5 text-[15px] rounded-full gap-2',
  lg: 'h-14 px-6 text-base rounded-full gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, block, className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'press inline-flex items-center justify-center font-semibold select-none disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
})

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  variant?: 'surface' | 'ghost' | 'primary' | 'accent'
  size?: 'sm' | 'md'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'surface', size = 'md', className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'press inline-flex shrink-0 items-center justify-center rounded-full',
        size === 'md' ? 'size-11' : 'size-9',
        variant === 'surface' && 'border border-border-strong bg-surface text-text hover:bg-surface-2',
        variant === 'ghost' && 'text-muted hover:bg-surface-2 hover:text-text',
        variant === 'primary' && 'bg-ink text-on-ink hover:bg-ink-2',
        variant === 'accent' && 'bg-primary text-on-primary shadow-primary hover:bg-primary-strong',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})
