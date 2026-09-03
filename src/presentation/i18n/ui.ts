import type { LocaleId } from '@domain/edition/i18n/types'
import { EN, type UiOverlay, type UiText } from './en'
import { JA } from './ja'

/**
 * Resolving a language into the object every component actually reads.
 *
 * The merge is one level deep and that is a deliberate ceiling, not an
 * oversight: a catalogue two levels deep would need a recursive merge, and a
 * recursive merge over a structure that also holds *functions* is a small pile
 * of `typeof` checks waiting to get one case wrong. Groups of flat keys are
 * enough to organise three hundred strings, and they merge with one spread.
 *
 * English is always the base, so an untranslated key is an English key rather
 * than a hole — see the rules at the top of `en.ts`.
 */
const OVERLAYS: Readonly<Partial<Record<LocaleId, UiOverlay>>> = {
  ja: JA,
}

/**
 * Locales the chrome is finished in, and therefore the ones `ui.test.ts`
 * holds to a complete catalogue.
 *
 * Separate from `OVERLAYS` on purpose: a language being written lives in
 * `OVERLAYS` from its first key and reads half in English until it is done,
 * and only joins this list when it can be offered to a player without
 * apologising. `en` is not here because it is the source, not a locale being
 * measured against one.
 */
export const COMPLETE_UI_LOCALES: readonly LocaleId[] = ['ja']

function merge(overlay: UiOverlay): UiText {
  const out: Record<string, unknown> = {}
  for (const group of Object.keys(EN) as (keyof UiText)[]) {
    out[group] = { ...EN[group], ...(overlay[group] ?? {}) }
  }
  return out as UiText
}

const CACHE = new Map<LocaleId, UiText>()

/**
 * The catalogue for `locale`, built once and kept.
 *
 * Cached because every component reads it on every render, and because the
 * merged object's identity is what lets a `useMemo` downstream stay stable
 * across a render that changed nothing.
 */
export function uiFor(locale: LocaleId): UiText {
  const cached = CACHE.get(locale)
  if (cached) return cached
  const overlay = OVERLAYS[locale]
  const built = overlay ? merge(overlay) : EN
  CACHE.set(locale, built)
  return built
}

/** The raw overlays, for the completeness test. Not for rendering — use `uiFor`. */
export function uiOverlayFor(locale: LocaleId): UiOverlay | undefined {
  return OVERLAYS[locale]
}

export { EN }
export type { UiText, UiOverlay }
