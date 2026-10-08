import { useEffect } from 'react'
import type { AccentColor, TextSize, ThemeMode } from '../types'

const THEME_COLORS = { light: '#f3f2ed', dark: '#0b0f0d' }

/** Applies the theme to <html> and keeps the browser UI color in sync. */
export function useTheme(mode: ThemeMode) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = mode === 'dark' || (mode === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? THEME_COLORS.dark : THEME_COLORS.light)
      try {
        localStorage.setItem('ft-theme', dark ? 'dark' : 'light')
      } catch {
        /* ignore */
      }
    }
    apply()
    if (mode !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [mode])
}

export const TEXT_SCALE: Record<TextSize, string> = { sm: '93.75%', md: '100%', lg: '112.5%', xl: '125%' }

/** Scales the whole interface (all sizes are rem-based) for small / large text preferences. */
export function useTextSize(size: TextSize | undefined) {
  useEffect(() => {
    const value = TEXT_SCALE[size ?? 'md'] ?? '100%'
    document.documentElement.style.fontSize = value
    try {
      localStorage.setItem('ft-text-size', value)
    } catch {
      /* ignore */
    }
  }, [size])
}

/** Accent palette shown in Settings; the actual colours live in index.css under [data-accent]. */
export const ACCENT_OPTIONS: Array<{ value: AccentColor; label: string; swatch: string }> = [
  { value: 'emerald', label: 'Смарагд', swatch: '#14a06e' },
  { value: 'ocean', label: 'Океан', swatch: '#2f74f0' },
  { value: 'violet', label: 'Фіалка', swatch: '#7c56ee' },
  { value: 'rose', label: 'Троянда', swatch: '#e0457b' },
  { value: 'amber', label: 'Бурштин', swatch: '#e07b12' },
  { value: 'graphite', label: 'Графіт', swatch: '#3a4440' },
]

/** Sets data-accent on <html>; CSS swaps the primary tokens for both themes. */
export function useAccent(accent: AccentColor | undefined) {
  useEffect(() => {
    const value = accent ?? 'emerald'
    if (value === 'emerald') delete document.documentElement.dataset.accent
    else document.documentElement.dataset.accent = value
    try {
      localStorage.setItem('ft-accent', value)
    } catch {
      /* ignore */
    }
  }, [accent])
}
