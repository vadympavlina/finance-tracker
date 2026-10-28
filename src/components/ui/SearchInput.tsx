import { useEffect, useRef } from 'react'
import { SearchField } from 'glisse'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
  className?: string
}

/** Liquid Glass search field (Glisse) with a clear button. */
export function SearchInput({ value, onChange, placeholder, label, className }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  // Glisse labels its clear button in English; give it a Ukrainian name.
  useEffect(() => {
    ref.current?.parentElement?.querySelector('.lg-input-clear')?.setAttribute('aria-label', 'Очистити пошук')
  }, [value])
  return (
    <SearchField
      ref={ref}
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      aria-label={label}
      enterKeyHint="search"
      className={['ft-search', className].filter(Boolean).join(' ')}
    />
  )
}
