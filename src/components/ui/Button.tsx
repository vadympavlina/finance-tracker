import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Button as GlassButton } from 'glisse'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'danger-soft' | 'soft'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  block?: boolean
}

/** Variants rendered as Liquid Glass (Glisse); ghost and soft stay plain text-style buttons. */
const GLASS: Partial<Record<Variant, { variant: 'glass' | 'filled'; destructive?: boolean }>> = {
  primary: { variant: 'filled' },
  accent: { variant: 'filled' },
  secondary: { variant: 'glass' },
  danger: { variant: 'filled', destructive: true },
  'danger-soft': { variant: 'glass', destructive: true },
}

const plain: Record<'ghost' | 'soft', string> = {
  ghost: 'text-muted hover:text-text hover:bg-surface-2',
  soft: 'bg-primary-soft text-primary hover:brightness-[0.97]',
}

const plainSizes: Record<Size, string> = {
  sm: 'min-h-9 px-4 text-sm rounded-full gap-1.5',
  md: 'min-h-11 px-5 py-2 text-[0.9375rem] rounded-full gap-2',
  lg: 'min-h-14 px-6 py-2.5 text-base rounded-full gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, block, className, children, type = 'button', ...props },
  ref,
) {
  const glass = GLASS[variant]
  if (glass) {
    return (
      <GlassButton
        ref={ref}
        type={type}
        variant={glass.variant}
        destructive={glass.destructive}
        icon={icon}
        className={cn('ft-btn', size !== 'md' && `ft-btn-${size}`, block && 'ft-btn-block', className)}
        {...props}
      >
        {children}
      </GlassButton>
    )
  }
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'press inline-flex items-center justify-center text-center leading-tight font-semibold select-none disabled:cursor-not-allowed disabled:opacity-50 [&>svg]:shrink-0',
        plain[variant as 'ghost' | 'soft'],
        plainSizes[size],
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
  size?: 'sm' | 'md' | 'lg'
  /** Highlights the glyph in the accent colour (e.g. active filters). */
  active?: boolean
}

/** Round glass icon button (Glisse); `ghost` is a bare glyph without glass. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'surface', size = 'md', active, className, children, type = 'button', ...props },
  ref,
) {
  if (variant === 'ghost') {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        className={cn(
          'press inline-flex shrink-0 items-center justify-center rounded-full text-text hover:bg-black/5 dark:hover:bg-white/10',
          size === 'lg' ? 'size-12' : size === 'md' ? 'size-11' : 'size-9',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
  return (
    <GlassButton
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      variant={variant === 'surface' ? 'glass' : 'filled'}
      icon={children}
      data-active={active ? '' : undefined}
      className={cn('ft-btn ft-icon', size !== 'md' && `ft-icon-${size}`, className)}
      {...props}
    />
  )
})
