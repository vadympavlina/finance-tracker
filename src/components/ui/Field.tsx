import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

const control =
  'w-full min-w-0 rounded-[14px] border border-transparent bg-surface-2 px-4 text-[1rem] text-text placeholder:text-subtle transition-colors outline-none focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 aria-[invalid=true]:border-expense'

interface FieldWrapperProps {
  label: string
  error?: string | null
  hint?: string
  children: (id: string, describedBy: string | undefined) => ReactNode
  className?: string
  optional?: boolean
}

export function FieldWrapper({ label, error, hint, children, className, optional }: FieldWrapperProps) {
  const id = useId()
  const msgId = `${id}-msg`
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-muted">
        {label}
        {optional && <span className="text-xs font-normal text-subtle">· необовʼязково</span>}
      </label>
      {children(id, error || hint ? msgId : undefined)}
      {error ? (
        <p id={msgId} className="text-sm font-medium text-expense" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="text-xs text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: string
  error?: string | null
  hint?: string
  optional?: boolean
  wrapperClassName?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, optional, wrapperClassName, className, ...props },
  ref,
) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} optional={optional} className={wrapperClassName}>
      {(id, describedBy) => (
        <input ref={ref} id={id} aria-invalid={!!error} aria-describedby={describedBy} className={cn(control, 'h-12', className)} {...props} />
      )}
    </FieldWrapper>
  )
})

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  optional?: boolean
}

export function TextArea({ label, optional, className, ...props }: TextAreaProps) {
  return (
    <FieldWrapper label={label} optional={optional}>
      {(id) => <textarea id={id} rows={2} className={cn(control, 'resize-none py-3', className)} {...props} />}
    </FieldWrapper>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string | null
  options: Array<{ value: string; label: string }>
}

export function SelectField({ label, error, options, className, ...props }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} error={error}>
      {(id, describedBy) => (
        <select id={id} aria-invalid={!!error} aria-describedby={describedBy} className={cn(control, 'h-12 appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10', className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239aa1b1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...props}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldWrapper>
  )
}

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  const id = useId()
  return (
    <div className="flex min-h-12 items-center justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-[0.9375rem] font-medium">
          {label}
        </label>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-[30px] w-[62px] shrink-0 rounded-full transition-colors duration-300 disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-black/10 dark:bg-white/20',
        )}
      >
        <span
          className={cn(
            'absolute top-[2px] left-[2px] h-[26px] w-[38px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-[cubic-bezier(0.32,1.3,0.5,1)]',
            checked && 'translate-x-[20px]',
          )}
        />
      </button>
    </div>
  )
}

export { control as controlClassName }
