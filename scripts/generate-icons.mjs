/**
 * Renders every icon the app needs from icons-src/icon.mjs.
 *   npm run icons
 * Needs Chromium: uses playwright-core with CHROMIUM_PATH (or a locally installed Chrome).
 *
 * Output (public/):
 *   favicon.ico            16 + 32 + 48 (PNG-in-ICO) — legacy browsers, Windows, bookmarks
 *   favicon.svg            modern browsers (scales to any size)
 *   icons/favicon-16.png, favicon-32.png, favicon-48.png, favicon-96.png
 *   icons/apple-touch-icon.png (180)  + 152/167 for older iPads — iOS / iPadOS home screen
 *   apple-touch-icon.png, apple-touch-icon-precomposed.png — the same, at the site root
 *   icons/icon-192.png, icon-512.png                — PWA "any"
 *   icons/icon-maskable-192.png, icon-maskable-512.png — Android adaptive icons
 *   icons/icon-monochrome-512.png                   — Android 13+ themed icons
 *   icons/mstile-150.png, mstile-310.png + browserconfig.xml — Windows tiles
 *   icons/safari-pinned-tab.svg                     — Safari pinned tabs / mask-icon
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { appIcon, faviconSvg, monochromeIcon, pinnedTabIcon, THEME } from '../icons-src/icon.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pub = resolve(root, 'public')
const out = resolve(pub, 'icons')
await mkdir(out, { recursive: true })

let chromium
try {
  ;({ chromium } = await import('playwright-core'))
} catch {
  console.error('Install playwright-core (npm i -D playwright-core) to render icons.')
  process.exit(1)
}
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const page = await browser.newPage()

async function png(svg, size, { transparent = true } = {}) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><div style="width:${size}px;height:${size}px">${svg}</div>
     <style>svg{display:block;width:100%;height:100%}</style></body></html>`,
  )
  return page.screenshot({ omitBackground: transparent, type: 'png' })
}

const save = (name, data) => writeFile(resolve(out, name), data)

// Browser favicons: simplified mark below 64 px.
const small = faviconSvg()
const fav = {}
for (const s of [16, 32, 48]) fav[s] = await png(small, s)
await save('favicon-16.png', fav[16])
await save('favicon-32.png', fav[32])
await save('favicon-48.png', fav[48])
await save('favicon-96.png', await png(appIcon({ radius: 112 }), 96))
await writeFile(resolve(pub, 'favicon.svg'), small)

// favicon.ico with PNG entries (supported everywhere since Windows Vista / all modern browsers).
function ico(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  const dir = Buffer.alloc(16 * images.length)
  let offset = 6 + dir.length
  images.forEach(({ size, data }, i) => {
    const o = i * 16
    dir.writeUInt8(size >= 256 ? 0 : size, o)
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1)
    dir.writeUInt8(0, o + 2)
    dir.writeUInt8(0, o + 3)
    dir.writeUInt16LE(1, o + 4)
    dir.writeUInt16LE(32, o + 6)
    dir.writeUInt32LE(data.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += data.length
  })
  return Buffer.concat([header, dir, ...images.map((i) => i.data)])
}
await writeFile(resolve(pub, 'favicon.ico'), ico([16, 32, 48].map((size) => ({ size, data: fav[size] }))))

// iOS / iPadOS: full-bleed, opaque — the system applies its own rounded mask.
const ios = appIcon({ radius: 0 })
await save('apple-touch-icon.png', await png(ios, 180, { transparent: false }))
await save('apple-touch-icon-152.png', await png(ios, 152, { transparent: false }))
await save('apple-touch-icon-167.png', await png(ios, 167, { transparent: false }))
// Some iOS versions and link previews look for these next to index.html without reading <link> tags.
const apple180 = await png(ios, 180, { transparent: false })
await writeFile(resolve(pub, 'apple-touch-icon.png'), apple180)
await writeFile(resolve(pub, 'apple-touch-icon-precomposed.png'), apple180)

// PWA "any" icons keep their own rounded tile.
const any = appIcon({ radius: 112 })
await save('icon-192.png', await png(any, 192))
await save('icon-512.png', await png(any, 512))

// Android adaptive (maskable): full-bleed background, mark inside the 80% safe zone.
const maskable = appIcon({ radius: 0, scale: 0.78 })
await save('icon-maskable-192.png', await png(maskable, 192, { transparent: false }))
await save('icon-maskable-512.png', await png(maskable, 512, { transparent: false }))

// Android 13+ themed (monochrome) icon.
await save('icon-monochrome-512.png', await png(monochromeIcon(), 512))

// Windows tiles: the tile colour is the background, so render the mark on transparency.
const tile = appIcon({ radius: 0, scale: 0.62 })
await save('mstile-150.png', await png(tile, 150, { transparent: false }))
await save('mstile-310.png', await png(tile, 310, { transparent: false }))
await writeFile(
  resolve(out, 'browserconfig.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="mstile-150.png"/>
      <square310x310logo src="mstile-310.png"/>
      <TileColor>${THEME.ink}</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`,
)

await save('safari-pinned-tab.svg', pinnedTabIcon())

await browser.close()
console.log('Icons written to public/ and public/icons/')
