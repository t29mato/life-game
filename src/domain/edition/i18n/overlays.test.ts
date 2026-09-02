import { describe, expect, it } from 'vitest'

import type { SpaceEffect } from '../../model/types'
import { spacesOf } from '../../board/route'
import { editionFor } from '../registry'
import type { EditionTranslation } from './types'
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

/**
 * The compile-time check `types.ts` cannot do.
 *
 * `SpaceId` and its siblings are `string` in the frozen domain contract — a
 * closed union would mean editing that file every time an edition ships a
 * tile — so a typo'd key in an overlay is not a type error. It is worse than a
 * type error, in fact: it type-checks, ships, and then silently does nothing,
 * because the lookup it was written for never finds it. The same is true in
 * the other direction, and that one is likelier: a tile added to a route a
 * year from now leaves ten overlays quietly a tile short, and nothing in the
 * build says so.
 *
 * So this file checks both directions for every edition × locale, and it is
 * deliberately noisy about it — the assertions collect *every* problem into
 * one list rather than failing on the first, because the person reading the
 * failure is usually a translator with a batch of tiles to write, not a
 * debugger with one bug to find.
 */

const OVERLAYS: readonly EditionTranslation[] = [
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
]

/** Whether this effect carries a player-facing `reason` for the log and the card. */
const hasReason = (effect: SpaceEffect): boolean => 'reason' in effect

/** Both directions at once: nothing here that is not there, nothing there that is not here. */
const compare = (label: string, expected: readonly string[], actual: readonly string[]): string[] => {
  const problems: string[] = []
  for (const id of expected) if (!actual.includes(id)) problems.push(`${label} not translated: ${id}`)
  for (const id of actual) if (!expected.includes(id)) problems.push(`${label} does not exist: ${id}`)
  return problems
}

describe('edition translation overlays', () => {
  it('claims one edition and locale each, with no pair claimed twice', () => {
    const pairs = OVERLAYS.map((o) => `${o.editionId}/${o.locale}`)
    expect(new Set(pairs).size).toBe(pairs.length)
    for (const overlay of OVERLAYS) {
      expect(editionFor(overlay.editionId).id).toBe(overlay.editionId)
    }
  })

  for (const overlay of OVERLAYS) {
    describe(`${overlay.editionId} in ${overlay.locale}`, () => {
      const edition = editionFor(overlay.editionId)
      const spaces = spacesOf(edition.route)
      const careers = [...edition.careers.basic, ...edition.careers.graduate]
      const laneNames = edition.route.segments.flatMap((segment) =>
        segment.kind === 'fork' ? segment.branches.map((branch) => branch.identity.name) : [],
      )

      it('names every id its edition defines, and no id it does not', () => {
        expect([
          ...compare('space', spaces.map((s) => s.id), Object.keys(overlay.spaces)),
          ...compare('career', careers.map((c) => c.id), Object.keys(overlay.careers)),
          ...compare('house', edition.houses.map((h) => h.id), Object.keys(overlay.houses)),
          ...compare('stock', edition.stocks.map((s) => s.id), Object.keys(overlay.stocks)),
          ...compare('life tile', edition.lifeTiles.map((t) => t.id), Object.keys(overlay.lifeTiles)),
          ...compare('lane', laneNames, Object.keys(overlay.lanes)),
        ]).toEqual([])
      })

      /*
       * Every field is optional in the interface, because a half-finished
       * locale has to stay shippable. A locale that claims to be finished is
       * held to a stricter promise: an entry that exists is an entry that is
       * complete, since a tile with a translated title and an English sentence
       * under it reads as a bug rather than as a fallback.
       */
      it('translates every string on the entries it does name', () => {
        const problems: string[] = []
        for (const [id, text] of Object.entries(overlay.spaces)) {
          if (!text?.title) problems.push(`space ${id}: no title`)
          if (!text?.description) problems.push(`space ${id}: no description`)
        }
        for (const [id, text] of Object.entries(overlay.careers)) {
          if (!text?.title || !text?.description) problems.push(`career ${id}: incomplete`)
        }
        for (const [id, text] of Object.entries(overlay.houses)) {
          if (!text?.name || !text?.description) problems.push(`house ${id}: incomplete`)
        }
        for (const [id, text] of Object.entries(overlay.stocks)) {
          if (!text?.name || !text?.description) problems.push(`stock ${id}: incomplete`)
        }
        for (const [id, text] of Object.entries(overlay.lifeTiles)) {
          if (!text?.title) problems.push(`life tile ${id}: no title`)
        }
        for (const [name, text] of Object.entries(overlay.lanes)) {
          if (!text?.name || !text?.summary) problems.push(`lane ${name}: incomplete`)
        }
        expect(problems).toEqual([])
      })

      /*
       * `reason`, `footnote` and `harsher` are the fields that exist on some
       * tiles and not others, so they are the ones that drift. A missing one strands a log
       * line or a whole Hard-difficulty sentence in English; a stray one is a
       * translation of something the tile no longer has, which is a sign the
       * route moved underneath the overlay.
       */
      it('translates a reason, a footnote and a hardship exactly where the English tile has one', () => {
        const problems: string[] = []
        for (const space of spaces) {
          const text = overlay.spaces[space.id]
          if (!text) continue
          if (hasReason(space.effect) && !text.reason) problems.push(`space ${space.id}: no reason`)
          if (!hasReason(space.effect) && text.reason) problems.push(`space ${space.id}: reason on a tile with none`)
          if (space.footnote && !text.footnote) problems.push(`space ${space.id}: no footnote`)
          if (!space.footnote && text.footnote) problems.push(`space ${space.id}: footnote on a tile with none`)
          if (!space.harsher && text.harsher) problems.push(`space ${space.id}: hardship on a tile with none`)
          if (!space.harsher) continue
          if (!text.harsher?.description) problems.push(`space ${space.id}: hardship not translated`)
          if (space.harsher.title && !text.harsher?.title) problems.push(`space ${space.id}: hardship title not translated`)
          if (hasReason(space.harsher.effect) && !text.harsher?.reason) {
            problems.push(`space ${space.id}: hardship reason not translated`)
          }
        }
        expect(problems).toEqual([])
      })

      /*
       * The economy's bands are the one table keyed by position rather than by
       * id (see `EconomyText`), so the lengths are the only thing standing
       * between a band added later and every note after it shifting by one.
       */
      it('carries one economy note per band, in the same order', () => {
        expect(overlay.economy?.tuitionNotes).toHaveLength(edition.economy.tuition.outcomes.length)
        expect(overlay.economy?.marriage?.outcomes).toHaveLength(edition.economy.marriage.outcomes.length)
        expect(overlay.economy?.marriage?.rescued).toBeTruthy()
      })
    })
  }
})
