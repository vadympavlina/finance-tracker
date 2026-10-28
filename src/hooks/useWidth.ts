import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Width of a container, kept in sync while it resizes. Glisse sizes tabs from a px
 * `--lg-tab-width`, so tabs fill the available width instead of a fixed 84px.
 */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}
