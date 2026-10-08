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
  primary: 'glass-tinted text-white hover:brightness-105',
  accent: 'glass-tinted text-white hover:brightness-105',
  secondary: 'glass text-text hover:brightness-[0.98]',
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
        variant === 'surface' && 'glass text-text',
        variant === 'ghost' && 'text-text hover:bg-black/5 dark:hover:bg-white/10',
        (variant === 'primary' || variant === 'accent') && 'glass-tinted text-white',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})
