import type { Edition } from '@domain/edition/types'
import type { LocaleId } from '@domain/edition/i18n/types'
import { editionTextFor, type EditionText } from '@domain/edition/i18n/text'
import { EN, type NarrationOverlay, type NarrationText } from './en'
import { JA } from './ja'

/**
 * LIFE JOURNEY — the channel that lets the engine speak the player's language.
 *
 * ## Why there was nothing here before
 *
 * The board's words have been translatable since the edition overlays landed,
 * and the chrome's since the switcher did. Neither reaches the sentences the
 * *engine* writes — the narration on an event card, the chips under it, the
 * log, the roll tables, the label on a decision — because those are composed in
 * `application/usecases`, and the application layer had no way of being told
 * what language anybody was reading in. Two sweeps found this independently and
 * neither built it: `newBaby.ts` has no locale and could not get one.
 *
 * ## Why a dependency rather than a lookup
 *
 * The locale is a *presentation* concern: it lives in a React context, it is
 * remembered per device, and it can change mid-turn. The application layer must
 * not reach up for it, and the domain must not know it exists. So it arrives
 * the way `random` already does — injected, through `UseCaseDeps`, resolved
 * once near the composition root and passed down. Nothing below has to remember
 * which language it is in, which is the mistake every ambient `t(...)` invites.
 *
 * ## Why one object with two halves
 *
 * A use case writing a sentence needs two different vocabularies and it needs
 * them in the same breath:
 *
 * - `say` — the engine's own prose, this layer's catalogue (`en.ts`/`ja.ts`).
 * - `board(edition)` — the *edition's* words for the thing being talked about:
 *   a tile's `reason`, a career's title, a house's name. Those were already
 *   translated in all ten overlays and read by nobody, because
 *   `applyEffect` reads `effect.reason` and `career.title` straight off the
 *   English data. `EditionText` is the reading end that existed and had no
 *   caller down here; this is the caller.
 *
 * Holding them together is what stops a card from being half-translated, which
 * is worse than an untranslated one: a Japanese narration wrapped around an
 * English tile reason is a card that reads as broken rather than as English.
 *
 * ## What deliberately does not come through here
 *
 * Money. `formatMoney` reads the edition's own `CurrencySpec` in every
 * language, and every catalogue entry takes an already-formatted string. A
 * Japanese player on the India board still counts in ₹, grouped the way ₹ is
 * grouped. Changing the language you read in must never change what the board
 * counts in.
 */

const OVERLAYS: Readonly<Partial<Record<LocaleId, NarrationOverlay>>> = {
  ja: JA,
}

/**
 * Locales the engine's own prose is finished in, and therefore the ones
 * `narration.test.ts` holds to a complete catalogue.
 *
 * Separate from `OVERLAYS` for the same reason `COMPLETE_UI_LOCALES` is: a
 * language being written lives in `OVERLAYS` from its first key and reads the
 * rest in English, and only joins this list when a player can be handed it
 * without an apology.
 */
export const COMPLETE_NARRATION_LOCALES: readonly LocaleId[] = ['ja']

/**
 * One level deep, the same deliberate ceiling `presentation/i18n/ui.ts` sets
 * and for the same reason: a recursive merge over a structure that also holds
 * functions is a pile of `typeof` checks waiting to get a case wrong.
 */
function merge(overlay: NarrationOverlay): NarrationText {
  const out: Record<string, unknown> = {}
  for (const group of Object.keys(EN) as (keyof NarrationText)[]) {
    out[group] = { ...EN[group], ...(overlay[group] ?? {}) }
  }
  return out as NarrationText
}

const NARRATION_CACHE = new Map<LocaleId, NarrationText>()

/** The engine's prose catalogue for `locale`, built once and kept. */
export function narrationFor(locale: LocaleId): NarrationText {
  const cached = NARRATION_CACHE.get(locale)
  if (cached) return cached
  const overlay = OVERLAYS[locale]
  const built = overlay ? merge(overlay) : EN
  NARRATION_CACHE.set(locale, built)
  return built
}

/** The raw overlay, for the completeness test. Not for composing — use `narrationFor`. */
export function narrationOverlayFor(locale: LocaleId): NarrationOverlay | undefined {
  return OVERLAYS[locale]
}

/**
 * Everything a use case needs in order to write a sentence somebody can read.
 *
 * `board` takes the edition rather than closing over one because a use case
 * resolves its edition from the game state it was handed, and one `GameText`
 * outlives any single game: the store holds a locale, not a board.
 */
export interface GameText {
  readonly locale: LocaleId
  /** The engine's own prose, in this language. */
  readonly say: NarrationText
  /** What this edition's tiles, careers, houses and lanes read as, in this language. */
  board(edition: Edition): EditionText
}

const TEXT_CACHE = new Map<LocaleId, GameText>()

/** How the game reads in `locale` — cached, because every dispatch asks for it. */
export function gameTextFor(locale: LocaleId): GameText {
  const cached = TEXT_CACHE.get(locale)
  if (cached) return cached
  /*
   * The edition this catalogue was last asked about, and the answer.
   *
   * `editionTextFor` never rebuilds — it keeps a `WeakMap` per edition and a
   * `Map` per locale inside that — but a use case asks `board(edition)` several
   * times while composing a single card, and every card in a game asks about
   * the same board. One slot turns those two hashed lookups into a pointer
   * comparison. It cannot go stale: an edition re-registered under the same id
   * is a *different* object, so the comparison fails and the pair is resolved
   * again, which is the same guarantee the `WeakMap` below it already gives.
   */
  let memo: { readonly edition: Edition; readonly text: EditionText } | null = null
  const built: GameText = {
    locale,
    say: narrationFor(locale),
    board(edition) {
      if (memo === null || memo.edition !== edition) {
        memo = { edition, text: editionTextFor(edition, locale) }
      }
      return memo.text
    },
  }
  TEXT_CACHE.set(locale, built)
  return built
}

/**
 * English, and the answer for any caller that never said otherwise.
 *
 * Every use case takes its text as an optional dependency defaulting to this,
 * which is the same bargain the catalogues themselves strike: a caller that has
 * not been wired up yet reads English rather than crashing, and the hundred and
 * some tests that build `{ random }` by hand keep working. What stops that
 * default hiding an untranslated sentence is `coverage.test.ts`, which reads
 * the use cases' own source.
 */
export const EN_TEXT: GameText = gameTextFor('en')
