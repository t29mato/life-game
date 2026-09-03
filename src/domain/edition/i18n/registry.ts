import type { EditionId } from '../../model/types'
import type { EditionTranslation, LocaleId, TranslatedLocaleId } from './types'
import { USA_JA } from '../usa/i18n/ja'
import { USA_FR } from '../usa/i18n/fr'
import { JAPAN_JA } from '../japan/i18n/ja'
import { JAPAN_FR } from '../japan/i18n/fr'
import { FRANCE_JA } from '../france/i18n/ja'
import { FRANCE_FR } from '../france/i18n/fr'
import { INDIA_JA } from '../india/i18n/ja'
import { INDIA_FR } from '../india/i18n/fr'
import { BOLIVIA_JA } from '../bolivia/i18n/ja'
import { BOLIVIA_FR } from '../bolivia/i18n/fr'
import { RESEARCHER_JAPAN_JA } from '../japan-researcher/i18n/ja'

/**
 * The shelf of overlays, keyed the way a caller actually asks for one.
 *
 * A caller holds an edition and a locale — never a filename — so the pair is
 * the key, and `EditionTranslation` carries both fields on itself precisely so
 * this table can be built by reading the overlays rather than by writing the
 * pairs out a second time and hoping the two lists agree.
 *
 * Overlays are imported statically. They are large — a finished country runs
 * to some ninety tiles of prose — and a lazier scheme would mean every
 * consumer of a tile's title becoming asynchronous, which is a heavy price for
 * a game that is meant to work with the network off. `overlays.test.ts` is
 * what keeps them honest; this file only has to find them.
 */
const KEY = (editionId: EditionId, locale: TranslatedLocaleId): string => `${editionId}/${locale}`

const SHELF: readonly EditionTranslation[] = [
  USA_JA,
  USA_FR,
  JAPAN_JA,
  JAPAN_FR,
  FRANCE_JA,
  FRANCE_FR,
  INDIA_JA,
  INDIA_FR,
  BOLIVIA_JA,
  BOLIVIA_FR,
  RESEARCHER_JAPAN_JA,
]

const TRANSLATIONS = new Map<string, EditionTranslation>(
  SHELF.map((overlay) => [KEY(overlay.editionId, overlay.locale), overlay]),
)

/** Every overlay this build ships, in registration order. What the tests walk. */
export function allTranslations(): readonly EditionTranslation[] {
  return [...TRANSLATIONS.values()]
}

/**
 * Adds or replaces one edition × locale overlay.
 *
 * The mirror of `registerEdition`, and there for the same reason: a test that
 * builds a variant edition needs somewhere to hang a variant overlay.
 */
export function registerTranslation(overlay: EditionTranslation): void {
  TRANSLATIONS.set(KEY(overlay.editionId, overlay.locale), overlay)
}

/**
 * The overlay for this pair, or `undefined` when there is none.
 *
 * `undefined` is the ordinary answer, not an error: English is the source and
 * needs no overlay, and a locale that has not reached this edition yet reads
 * in English. Both cases are the same case, so both return the same thing.
 */
export function translationFor(
  editionId: EditionId | undefined,
  locale: LocaleId,
): EditionTranslation | undefined {
  if (locale === 'en' || editionId === undefined) return undefined
  return TRANSLATIONS.get(KEY(editionId, locale))
}
