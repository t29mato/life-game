import type { EditionId } from './types'
import type { Edition } from './types'
import { EDITION_USA } from './usa'
import { EDITION_JAPAN } from './japan'
import { EDITION_FRANCE } from './france'
import { EDITION_INDIA } from './india'
import { EDITION_BOLIVIA } from './bolivia'
import { EDITION_RESEARCHER_JAPAN } from './japan-researcher'

/**
 * Which edition a game without one is played on.
 *
 * A save written before editions existed carries no `editionId`, and the
 * honest reading of that save is the game it was actually played at — the same
 * reasoning that makes `difficultyProfile(undefined)` mean `normal`.
 */
export const DEFAULT_EDITION_ID: EditionId = EDITION_USA.id

/**
 * The shelf, in the order the picker offers it: the original game first,
 * then the rest alphabetically — which is a shelf, not a ranking.
 *
 * The five countries are one life told five ways, and the researcher board is
 * a different life that happens to be set in one of them. It is registered
 * here alongside them rather than in place of any of them: nothing on this
 * shelf has ever been withdrawn, and a player who wants an ordinary board
 * finds five of them in front of the sixth.
 */
const REGISTRY = new Map<EditionId, Edition>([
  [EDITION_USA.id, EDITION_USA],
  [EDITION_BOLIVIA.id, EDITION_BOLIVIA],
  [EDITION_FRANCE.id, EDITION_FRANCE],
  [EDITION_INDIA.id, EDITION_INDIA],
  [EDITION_JAPAN.id, EDITION_JAPAN],
  [EDITION_RESEARCHER_JAPAN.id, EDITION_RESEARCHER_JAPAN],
])

/**
 * Adds an edition to the set a saved game can name.
 *
 * `GameState` stores an `editionId` rather than the edition itself, so that a
 * save stays a small document and an edition's content can be corrected under
 * a game in progress. That trade needs somewhere to resolve the id, and this
 * is it. Registering the same id twice replaces it, which is what a test that
 * builds a variant edition wants.
 */
export function registerEdition(edition: Edition): void {
  REGISTRY.set(edition.id, edition)
}

/** Every registered edition, in registration order. */
export function allEditions(): readonly Edition[] {
  return [...REGISTRY.values()]
}

/**
 * The edition named by `id`, defaulting to the USA edition.
 *
 * The fallback is not defensive padding: an id from an older save, or from an
 * edition that has since been withdrawn, has to resolve to *something* or the
 * save becomes unloadable. Falling back to the original game is the least
 * surprising thing that can happen to it.
 */
export function editionFor(id: EditionId | undefined): Edition {
  return (id !== undefined && REGISTRY.get(id)) || EDITION_USA
}

/** The edition a game is being played on. The engine's usual way in. */
export function editionOf(state: { readonly editionId?: EditionId }): Edition {
  return editionFor(state.editionId)
}

export { EDITION_USA }
