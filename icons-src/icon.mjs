// Single source of truth for the app mark: an emerald ring chart with a growth arrow
// on a graphite tile. scripts/generate-icons.mjs renders every favicon / app icon from it.

const INK = '#121A17'
const TRACK = '#24332D'
const LIGHT = '#F3F2ED'

const defs = `
  <defs>
    <linearGradient id="em" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7EEDB9"/>
      <stop offset="1" stop-color="#0E8F62"/>
    </linearGradient>
    <radialGradient id="glow" cx=".78" cy=".85" r=".7">
      <stop offset="0" stop-color="#34C88D" stop-opacity=".35"/>
      <stop offset="1" stop-color="#34C88D" stop-opacity="0"/>
    </radialGradient>
  </defs>`

/** The mark on the 512 grid, centred at 256,256. `small` = thicker, flatter shapes for 16–48 px. */
function mark({ small = false } = {}) {
  if (small) {
    return `
    <circle cx="256" cy="256" r="138" fill="none" stroke="${TRACK}" stroke-width="84"/>
    <path d="M256 118 A138 138 0 1 1 118 256" fill="none" stroke="#34C88D" stroke-width="84" stroke-linecap="round"/>
    <g fill="none" stroke="${LIGHT}" stroke-width="46" stroke-linecap="round" stroke-linejoin="round">
      <path d="M212 300 L300 212"/>
      <path d="M226 206 H306 V286"/>
    </g>`
  }
  return `
    <circle cx="256" cy="256" r="132" fill="none" stroke="${TRACK}" stroke-width="58"/>
    <path d="M256 124 A132 132 0 1 1 124 256" fill="none" stroke="url(#em)" stroke-width="58" stroke-linecap="round"/>
    <g fill="none" stroke="${LIGHT}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">
      <path d="M214 298 L298 214"/>
      <path d="M232 212 H300 V280"/>
    </g>`
}

/**
 * Full app icon.
 * radius 0  → full-bleed square (iOS home screen, maskable, Windows tile): the OS rounds it.
 * scale < 1 → shrinks the mark into the maskable safe zone.
 */
export function appIcon({ radius = 120, scale = 1, small = false } = {}) {
  const t = 256 * (1 - scale)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${small ? '' : defs}
  <rect width="512" height="512" rx="${radius}" fill="${INK}"/>
  ${small ? '' : `<rect width="512" height="512" rx="${radius}" fill="url(#glow)"/>`}
  <g transform="translate(${t} ${t}) scale(${scale})">${mark({ small })}</g>
</svg>`
}

/** Browser-tab favicon (SVG): simplified mark, readable at 16 px. Opaque square — no transparent corners. */
export const faviconSvg = () => appIcon({ radius: 0, small: true })

/** Monochrome silhouette for Safari pinned tabs / mask-icon. */
export function pinnedTabIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <path fill="none" stroke="#000" stroke-width="84" stroke-linecap="round" d="M256 118 A138 138 0 1 1 118 256"/>
  <g fill="none" stroke="#000" stroke-width="46" stroke-linecap="round" stroke-linejoin="round">
    <path d="M212 300 L300 212"/>
    <path d="M226 206 H306 V286"/>
  </g>
</svg>`
}

/** Single-colour glyph for Android "monochrome" themed icons (white on transparent, in safe zone). */
export function monochromeIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <g transform="translate(51.2 51.2) scale(0.8)">
    <path fill="none" stroke="#fff" stroke-width="72" stroke-linecap="round" d="M256 124 A132 132 0 1 1 124 256"/>
    <g fill="none" stroke="#fff" stroke-width="38" stroke-linecap="round" stroke-linejoin="round">
      <path d="M214 298 L298 214"/>
      <path d="M232 212 H300 V280"/>
    </g>
  </g>
</svg>`
}

export const THEME = { ink: INK, light: LIGHT, emerald: '#0E8F62' }
