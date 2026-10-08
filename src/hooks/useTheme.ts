import { useEffect } from 'react'
import type { ThemeMode } from '../types'

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
