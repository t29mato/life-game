import type {
  CareerId,
  HouseId,
  LifeTileId,
  SpaceId,
  StockId,
} from '../../model/types'
import { spacesOf } from '../../board/route'
import type { Edition } from '../types'
import { translationFor } from './registry'
import type { CareerText, CatalogueText, LifeTileText, LocaleId, SpaceText } from './types'

/**
 * LIFE JOURNEY — the reading end of a translation.
 *
 * `types.ts` says what an overlay may contain and `registry.ts` says where to
 * find one; this is the object the rest of the game actually holds. Every
 * method answers the same shape of question — "what does a player in this
 * locale read for this id?" — and every one of them may answer `undefined`,
 * which means the same thing everywhere: read the English that is already on
 * the object in your hand. There is no key-shaped placeholder anywhere in this
 * file, because a half-translated board should read as a board, not as a bug
 * report.
 *
 * ## Why a space is looked up by id *and* by its English sentence
 *
 * A tile on Hard is not the tile on Normal. `createBoard` swaps in the
 * hardship — new sentence, sometimes a new title — and hands back a `Space`
 * that keeps the original id and has no memory of which version it is. The
 * overlay, meanwhile, stores the two versions nested (`SpaceText.harsher`),
 * because a hardship has no id of its own.
 *
 * The obvious bridge is to pass the difficulty down to every caller. This does
 * not do that, for two reasons. The plumbing is the smaller one: a `Space`
 * reaches the screen through a board, a landing event, a popover and a log,
 * and only some of those carry a difficulty. The larger one is that the
 * difficulty is the wrong question — the right one is *which sentence is this
 * object actually carrying*, and the object knows. So the index remembers the
 * English description of each version, and matching the live text against it
 * picks the translation of the sentence that is genuinely on screen. A
 * `LandingEvent` built from a tile carries that same sentence verbatim (see
 * `baseEvent` in `applyEffect.ts`), which is why the same lookup serves both,
 * and why an event whose prose the *engine* composed rather than copied — a
 * career fair's result, a bank's summary — matches nothing and correctly stays
 * in English.
 */

/** One tile's two possible sentences, and the translation of each. */
interface SpaceEntry {
  readonly base: SpaceText | undefined
  /** The English sentence the tile carries as written. */
  readonly baseEnglish: string
  /** The English sentence the hardship swaps in, when the tile has one. */
  readonly harsherEnglish?: string
  /**
   * The hardship's translation, already merged over the base: a hardship that
   * only rewrites the sentence keeps the translated title above it, exactly as
   * the English `Hardship` keeps the original title when it omits its own.
   */
  readonly harsher?: SpaceText
}

/**
 * Everything one edition reads as, in one locale.
 *
 * Built once per pair and cached — see `editionTextFor`. Holding it as an
 * object with methods rather than exporting a family of free functions is
 * deliberate: the presentation layer resolves the pair once, near the top, and
 * passes *this* down. Nothing below has to keep remembering which locale it is
 * in, which is the mistake every string-keyed `t(...)` API invites.
 */
export interface EditionText {
  readonly locale: LocaleId
  /** True when there is nothing to translate: English, or an untranslated edition. */
  readonly passthrough: boolean
  /**
   * A tile's prose, matched to the sentence it is actually carrying.
   *
   * Pass the live `description` — off a `Space` or off a `LandingEvent` —
   * whenever you have it. Omitting it asks for the tile as written, which is
   * what a caller reading route data rather than a board wants.
   */
  space(id: SpaceId, englishDescription?: string): SpaceText | undefined
  career(id: CareerId): CareerText | undefined
  house(id: HouseId): CatalogueText | undefined
  stock(id: StockId): CatalogueText | undefined
  lifeTile(id: LifeTileId): LifeTileText | undefined
  /** Keyed by the lane's English name — see `EditionTranslation.lanes`. */
  lane(englishName: string): { readonly name?: string; readonly summary?: string } | undefined
  /** One per `economy.tuition.outcomes`, in the same order. */
  tuitionNote(index: number): string | undefined
  /** One per `economy.marriage.outcomes`, in the same order. */
  marriageNote(index: number): string | undefined
  /** `economy.marriage.rescued.note` — the proposal that had to be asked twice. */
  marriageRescuedNote(): string | undefined
}

/** The answer for English, and for any edition a locale has not reached. */
function passthroughText(locale: LocaleId): EditionText {
  return {
    locale,
    passthrough: true,
    space: () => undefined,
    career: () => undefined,
    house: () => undefined,
    stock: () => undefined,
    lifeTile: () => undefined,
    lane: () => undefined,
    tuitionNote: () => undefined,
    marriageNote: () => undefined,
    marriageRescuedNote: () => undefined,
  }
}

function buildSpaceIndex(edition: Edition, spaces: Readonly<Record<string, SpaceText | undefined>>) {
  const index = new Map<SpaceId, SpaceEntry>()
  for (const content of spacesOf(edition.route)) {
    const text = spaces[content.id]
    if (!text) continue
    const harsher = content.harsher
    index.set(content.id, {
      base: text,
      baseEnglish: content.description,
      ...(harsher
        ? {
            harsherEnglish: harsher.description,
            harsher: {
              // A hardship that names no title of its own is still the same
              // tile, so the translated base title stands over the new
              // sentence — the mirror of `atDifficulty`'s `harsher.title ??
              // content.title`.
              ...(text.harsher?.title ?? text.title ? { title: text.harsher?.title ?? text.title } : {}),
              ...(text.harsher?.description ? { description: text.harsher.description } : {}),
              ...(text.harsher?.reason ? { reason: text.harsher.reason } : {}),
              ...(text.footnote ? { footnote: text.footnote } : {}),
            },
          }
        : {}),
    })
  }
  return index
}

const CACHE = new WeakMap<Edition, Map<LocaleId, EditionText>>()

/**
 * What `edition` reads as in `locale` — cached against the edition object.
 *
 * Cached rather than rebuilt because the index walks every tile on the route,
 * and the presentation layer asks for this on every render. A `WeakMap` keyed
 * by the edition means a test that registers a throwaway edition does not leak
 * one, and re-registering an edition under the same id gets a fresh index for
 * free, because it is a different object.
 */
export function editionTextFor(edition: Edition, locale: LocaleId): EditionText {
  let byLocale = CACHE.get(edition)
  if (!byLocale) {
    byLocale = new Map()
    CACHE.set(edition, byLocale)
  }
  const cached = byLocale.get(locale)
  if (cached) return cached

  const overlay = translationFor(edition.id, locale)
  const built: EditionText = overlay
    ? (() => {
        const spaceIndex = buildSpaceIndex(edition, overlay.spaces)
        return {
          locale,
          passthrough: false,
          space: (id, englishDescription) => {
            const entry = spaceIndex.get(id)
            if (!entry) return undefined
            if (englishDescription === undefined) return entry.base
            if (englishDescription === entry.harsherEnglish) return entry.harsher
            /*
             * A sentence that is neither of the tile's own is a card the
             * *engine* wrote rather than copied off the tile — a career fair's
             * result, the bank's summary. Answering `undefined` is what keeps
             * this card in English instead of stamping the tile's unrelated
             * prose over a sentence that was about something else. Strict
             * matching is safe because a tile's description is a written
             * constant: `createBoard` only ever swaps one whole string for
             * another, never composes one.
             */
            return englishDescription === entry.baseEnglish ? entry.base : undefined
          },
          career: (id) => overlay.careers[id],
          house: (id) => overlay.houses[id],
          stock: (id) => overlay.stocks[id],
          lifeTile: (id) => overlay.lifeTiles[id],
          lane: (englishName) => overlay.lanes[englishName],
          tuitionNote: (index) => overlay.economy?.tuitionNotes?.[index],
          marriageNote: (index) => overlay.economy?.marriage?.outcomes?.[index],
          marriageRescuedNote: () => overlay.economy?.marriage?.rescued,
        }
      })()
    : passthroughText(locale)

  byLocale.set(locale, built)
  return built
}
