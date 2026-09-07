import type { RandomPort } from '../ports/RandomPort'
import { EN_TEXT, type GameText } from '../i18n/text'

/** Every use case that touches randomness — or says anything — takes exactly this. */
export interface UseCaseDeps {
  readonly random: RandomPort
  /**
   * What language the game is being read in, and the words to say it in.
   *
   * Optional, and English when absent, for the same reason every catalogue in
   * this project is a `Partial` over an English base: a caller that has not
   * been wired up yet — a balance harness, a unit test building `{ random }` by
   * hand — reads English rather than crashing. `coverage.test.ts` is what stops
   * that default hiding an untranslated sentence.
   */
  readonly text?: GameText
}

/** The catalogue this call is speaking from. English unless somebody said otherwise. */
export function textOf(deps: UseCaseDeps): GameText {
  return deps.text ?? EN_TEXT
}
