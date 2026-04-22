import {
  converter,
  differenceCiede2000,
  formatHex,
  interpolate,
  wcagContrast,
  wcagLuminance,
} from 'culori'

// ─── Types ────────────────────────────────────────────────────────────────────

// Public API types (unchanged — components depend on these)
export type HSL = { h: number; s: number; l: number }

export type HarmonyRule =
  | 'analogous'
  | 'complementary'
  | 'split-complementary'
  | 'triadic'

export type Swatch = {
  id: string
  hex: string
  hsl: HSL
  locked: boolean
}

export type SavedPalette = {
  id: string
  name: string
  swatches: Omit<Swatch, 'locked'>[]
  savedAt: number
}

// Internal OKLCH representation (culori returns plain objects, no types package)
type OklchColor = { mode: 'oklch'; l: number; c: number; h: number }

// ─── culori converters ────────────────────────────────────────────────────────

const toOklch = converter('oklch')
const toHslCulori = converter('hsl')
const deltaE = differenceCiede2000()

// ─── ID generation (SSR-safe) ─────────────────────────────────────────────────

let _counter = 0
export function generateId(): string {
  return Math.random().toString(36).slice(2) + (++_counter).toString(36)
}

// ─── Public conversion helpers (same signatures as before) ────────────────────

export function hslToHex({ h, s, l }: HSL): string {
  return (
    formatHex({ mode: 'hsl', h, s: s / 100, l: l / 100 }) ?? '#000000'
  ).toUpperCase()
}

export function hexToHsl(hex: string): HSL {
  const raw = toHslCulori(hex)
  return {
    h: Math.round(raw?.h ?? 0),
    s: Math.round((raw?.s ?? 0) * 100),
    l: Math.round((raw?.l ?? 0) * 100),
  }
}

// ─── WCAG luminance & contrast ────────────────────────────────────────────────

export function getRelativeLuminance(hex: string): number {
  return wcagLuminance(hex) ?? 0
}

export function getTextColor(backgroundHex: string): '#000000' | '#ffffff' {
  const contrastWithWhite = wcagContrast(backgroundHex, '#ffffff') ?? 1
  const contrastWithBlack = wcagContrast(backgroundHex, '#000000') ?? 1
  return contrastWithWhite >= contrastWithBlack ? '#ffffff' : '#000000'
}

// ─── Harmony rules (operate on OKLCH hue degrees) ────────────────────────────

function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360
}

function jitter(range: number): number {
  return (Math.random() - 0.5) * 2 * range
}

export function randomHarmonyRule(): HarmonyRule {
  const rules: HarmonyRule[] = [
    'analogous',
    'complementary',
    'split-complementary',
    'triadic',
  ]
  return rules[Math.floor(Math.random() * rules.length)]
}

// Returns OKLCH hue values derived from seedHue using the given harmony rule.
// OKLCH hue offsets are perceptually even, so the same angular offsets
// produce better-balanced results than they would in HSL.
export function harmonyHues(
  seedHue: number,
  rule: HarmonyRule,
  count: number
): number[] {
  const hues: number[] = []

  if (rule === 'analogous') {
    hues.push(seedHue)
    for (let i = 1; hues.length < count; i++) {
      hues.push(wrapHue(seedHue + i * 30 + jitter(8)))
      if (hues.length < count)
        hues.push(wrapHue(seedHue - i * 30 + jitter(8)))
    }
  } else if (rule === 'complementary') {
    const comp = wrapHue(seedHue + 180)
    const bases = [seedHue, comp]
    for (let i = 0; hues.length < count; i++) {
      hues.push(wrapHue(bases[i % 2] + (i >= 2 ? jitter(15) : 0)))
    }
  } else if (rule === 'split-complementary') {
    const bases = [seedHue, wrapHue(seedHue + 150), wrapHue(seedHue + 210)]
    for (let i = 0; hues.length < count; i++) {
      hues.push(wrapHue(bases[i % 3] + (i >= 3 ? jitter(20) : 0)))
    }
  } else {
    // triadic
    const bases = [seedHue, wrapHue(seedHue + 120), wrapHue(seedHue + 240)]
    for (let i = 0; hues.length < count; i++) {
      hues.push(wrapHue(bases[i % 3] + (i >= 3 ? jitter(20) : 0)))
    }
  }

  return hues.slice(0, count)
}

// ─── Internal OKLCH helpers ───────────────────────────────────────────────────

// Vibrancy bounds — chosen to stay within sRGB gamut for most hues
const L_MIN = 0.15
const L_MAX = 0.90
const C_MIN = 0.06
const C_TARGET_MIN = 0.08
const C_TARGET_MAX = 0.20
const L_TARGET_MIN = 0.32
const L_TARGET_MAX = 0.76

function randomOklch(h: number): OklchColor {
  return {
    mode: 'oklch',
    l: L_TARGET_MIN + Math.random() * (L_TARGET_MAX - L_TARGET_MIN),
    c: C_TARGET_MIN + Math.random() * (C_TARGET_MAX - C_TARGET_MIN),
    h: wrapHue(h),
  }
}

function isValidOklch(color: OklchColor): boolean {
  return (
    color.c >= C_MIN &&
    color.l >= L_MIN &&
    color.l <= L_MAX
  )
}

function minDeltaE(candidate: OklchColor, others: OklchColor[]): number {
  if (others.length === 0) return Infinity
  return Math.min(...others.map((o) => deltaE(candidate, o)))
}

// Builds a valid candidate for the given hue, enforcing ΔE distance from
// already-accepted colors. Threshold relaxes after 5 failed attempts.
function pickCandidate(h: number, accepted: OklchColor[]): OklchColor {
  let threshold = 20
  for (let attempt = 0; attempt < 15; attempt++) {
    if (attempt === 5) threshold = 15
    if (attempt === 10) threshold = 8
    const candidate = randomOklch(h)
    if (isValidOklch(candidate) && minDeltaE(candidate, accepted) >= threshold) {
      return candidate
    }
  }
  // Fallback: return a valid color without distance guarantee
  return randomOklch(h)
}

// Ensures the palette has enough lightness variety (std dev ≥ 0.12).
// Sorts by current lightness, assigns evenly-spaced targets, restores order.
function ensureLightnessSpread(colors: OklchColor[]): OklchColor[] {
  const count = colors.length
  if (count <= 1) return colors

  const ls = colors.map((c) => c.l)
  const mean = ls.reduce((a, b) => a + b, 0) / count
  const stdDev = Math.sqrt(ls.reduce((a, b) => a + (b - mean) ** 2, 0) / count)
  if (stdDev >= 0.12) return colors

  // Build evenly-spaced lightness targets clamped to valid range
  const spanMin = Math.max(L_TARGET_MIN, 0.28)
  const spanMax = Math.min(L_TARGET_MAX, 0.80)
  const targets = Array.from({ length: count }, (_, i) =>
    count === 1 ? (spanMin + spanMax) / 2 : spanMin + (i / (count - 1)) * (spanMax - spanMin)
  )

  // Sort colors by current lightness, assign targets, restore original order
  const indexed = colors.map((c, i) => ({ c, i, l: c.l }))
  indexed.sort((a, b) => a.l - b.l)

  const result = new Array<OklchColor>(count)
  indexed.forEach(({ c, i }, rank) => {
    result[i] = { ...c, l: targets[rank] }
  })
  return result
}

// Convert an internal OKLCH color to a public Swatch
function oklchToSwatch(color: OklchColor, locked = false): Swatch {
  const hex = (formatHex(color) ?? '#808080').toUpperCase()
  // Derive the stored HSL from the final hex (avoids gamut-clamping drift)
  const hsl = hexToHsl(hex)
  return { id: generateId(), hex, hsl, locked }
}

// Convert public HSL (s/l in 0-100) back to internal OKLCH
function hslToOklch(hsl: HSL): OklchColor {
  const raw = toOklch({ mode: 'hsl', h: hsl.h, s: hsl.s / 100, l: hsl.l / 100 })
  return {
    mode: 'oklch',
    l: raw?.l ?? 0.5,
    c: raw?.c ?? 0.1,
    h: wrapHue(raw?.h ?? 0),
  }
}

// ─── Palette generation ───────────────────────────────────────────────────────

export function generateInitialPalette(count = 5): Swatch[] {
  const seedHue = Math.random() * 360
  const rule = randomHarmonyRule()
  const hues = harmonyHues(seedHue, rule, count)

  const accepted: OklchColor[] = []
  for (const h of hues) {
    accepted.push(pickCandidate(h, accepted))
  }

  const spread = ensureLightnessSpread(accepted)
  return spread.map((c) => oklchToSwatch(c))
}

export function regeneratePalette(swatches: Swatch[]): Swatch[] {
  const locked = swatches.filter((s) => s.locked)

  // Seed hue from first locked swatch (converted to OKLCH) or random
  const seedHue =
    locked.length > 0
      ? hslToOklch(locked[0].hsl).h
      : Math.random() * 360

  const rule = randomHarmonyRule()
  const hues = harmonyHues(seedHue, rule, swatches.length)

  // Pre-populate accepted list with locked colors
  const lockedOklch = locked.map((s) => hslToOklch(s.hsl))

  const accepted: OklchColor[] = [...lockedOklch]
  let hueIndex = 0
  const newColors: (OklchColor | null)[] = swatches.map((swatch) => {
    if (swatch.locked) return null
    const h = hues[hueIndex++] ?? wrapHue(seedHue + hueIndex * 37)
    const candidate = pickCandidate(h, accepted)
    accepted.push(candidate)
    return candidate
  })

  // Collect unlocked candidates for lightness spread (excluding locked ones)
  const unlockedCandidates = newColors.filter((c): c is OklchColor => c !== null)
  const spread = ensureLightnessSpread(unlockedCandidates)
  let spreadIndex = 0

  return swatches.map((swatch, i) => {
    if (swatch.locked) return swatch
    return oklchToSwatch(spread[spreadIndex++] ?? newColors[i]!)
  })
}

// ─── Interpolation for "+" insert ─────────────────────────────────────────────

export function interpolateSwatch(left: HSL, right: HSL): Swatch {
  const leftOklch = hslToOklch(left)
  const rightOklch = hslToOklch(right)

  // culori's interpolate handles circular hue interpolation in OKLCH
  const fn = interpolate([leftOklch, rightOklch], 'oklch')
  const raw = fn(0.5) as OklchColor

  const mid: OklchColor = {
    mode: 'oklch',
    l: Math.max(L_MIN, Math.min(L_MAX, raw.l ?? 0.5)),
    c: Math.max(C_MIN, raw.c ?? C_TARGET_MIN),
    h: wrapHue(raw.h ?? 0),
  }

  return oklchToSwatch(mid)
}

// ─── Shades ───────────────────────────────────────────────────────────────────

// OKLCH lightness values for 9 shade steps (light → dark)
const SHADE_L = [
  0.95, 0.90, 0.85, 0.80, 0.75, 0.70,
  0.65, 0.60, 0.55, 0.50, 0.45, 0.40,
  0.35, 0.30, 0.25, 0.20, 0.15, 0.10,
]

export function generateShades(hsl: HSL): string[] {
  const base = hslToOklch(hsl)
  return SHADE_L.map((l) =>
    (formatHex({ ...base, l }) ?? '#808080').toUpperCase()
  )
}
