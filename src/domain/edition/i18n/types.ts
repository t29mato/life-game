import type { CareerId, EditionId, HouseId, LifeTileId, SpaceId, StockId } from '../../model/types'

/**
 * LIFE JOURNEY — the translation contract.
 *
 * The English edition files are the single source of truth for what the game
 * *is*: which tiles exist, what they cost, which id each one answers to. A
 * translation must not be able to change any of that, and the cheapest way to
 * guarantee it is to keep translations out of those files entirely. So a
 * locale is an **overlay**: a table from the ids the English data already
 * defines to the strings a player in that language should read instead.
 *
 * Three things follow from that shape, and all three are the point:
 *
 * 1. **English is the fallback, implicitly.** Every field here is optional and
 *    every id is optional. A missing entry is not a bug that blanks a tile —
 *    it is a tile that has not been translated yet, and it reads in English.
 *    A half-finished locale is therefore always shippable.
 * 2. **A translation cannot invent content.** There is no `effect`, no `price`,
 *    no `next` here, so no amount of translating can move a number. The route
 *    is still authored in exactly one place.
 * 3. **Field names match the domain's own.** A career has a `title` and a house
 *    has a `name` in `model/types.ts`, so they have a `title` and a `name`
 *    here too, rather than a tidier uniform word. The integration that reads
 *    these tables is then a field-for-field substitution with nothing to
 *    remember.
 *
 * What this file deliberately cannot do is catch a typo'd id at compile time.
 * `SpaceId` and friends are `string` in the frozen contract — a closed union
 * would mean editing that file every time an edition ships a tile, which is
 * precisely the coupling it exists to avoid. The guard is
 * `overlays.test.ts` instead, which checks both directions for every edition ×
 * locale: no id here that the English data does not define (a typo, or a tile
 * that has since been renamed), and no id in the English data missing here (a
 * tile that has since been added and never translated).
 */

/** The locales the game ships in. English needs no overlay: it is the source. */
export type LocaleId = 'en' | 'ja' | 'fr'

/** Locales that are overlays over the English source, i.e. everything but `en`. */
export type TranslatedLocaleId = Exclude<LocaleId, 'en'>

/**
 * A tile's rewrite at a harder difficulty.
 *
 * Nested inside the space rather than keyed separately because a `Hardship`
 * has no id of its own — it *is* that tile, on a worse day, and it can only
 * ever be reached through the tile it belongs to. Giving it a sibling entry
 * would have meant inventing a key (`'main-street-3:harsher'`) that exists
 * nowhere in the domain and would have to be kept in step by hand.
 *
 * `title` is optional in the English `Hardship` too — a hardship that only
 * rewrites the sentence keeps the original label — so a translation that
 * omits it here means the same thing: the translated base title stands.
 */
export interface HardshipText {
  readonly title?: string
  readonly description?: string
  /** See `SpaceText.reason`. A hardship swaps in its own effect, and its own reason with it. */
  readonly reason?: string
}

/**
 * One tile's player-facing prose.
 *
 * `reason` is the third string because it is genuinely a third thing a player
 * reads: `title` is printed on the board, `description` fills the event card,
 * and `reason` is the phrase the log and the card's notes use to say where
 * the money went ("Won the lottery", "Laid off"). A space carries at most one
 * effect and therefore at most one reason, which is why it sits flat here
 * rather than under the effect it belongs to.
 */
export interface SpaceText {
  readonly title?: string
  readonly description?: string
  readonly reason?: string
  /**
   * See `Space.footnote` — the one line defending a figure on the tile that
   * otherwise looks wrong. A fourth string rather than folded into
   * `description` because it is read in a different place and a different
   * voice: the description is the story, this is the small print under the
   * number, and a reader who never wonders about the number never needs it.
   */
  readonly footnote?: string
  readonly harsher?: HardshipText
}

/** A career, in the domain's own words: `title` + `description`. */
export interface CareerText {
  readonly title?: string
  readonly description?: string
}

/** A house or a stock, both of which the domain names with `name`. */
export interface CatalogueText {
  readonly name?: string
  readonly description?: string
}

/** A LIFE tile is a title and a value; only the title is words. */
export interface LifeTileText {
  readonly title?: string
}

/** A road out of a fork: what it is called, and the one line on what it costs. */
export interface LaneText {
  readonly name?: string
  readonly summary?: string
}

/**
 * The event-card lines the economy writes rather than the route.
 *
 * Tuition bands and marriage bands each carry a `note` in the edition's own
 * voice, and a player reads them exactly the way they read a tile's
 * description — so leaving them untranslated would strand two of the loudest
 * moments in the game in English. They are keyed positionally, and that is the
 * one place in this file where an index does the job of an id: a band has no
 * id, only an order (worst spin first), and `overlays.test.ts` pins the array
 * lengths so a band added later cannot silently shift every note by one.
 */
export interface EconomyText {
  /** One per `economy.tuition.outcomes`, in the same order. */
  readonly tuitionNotes?: readonly string[]
  readonly marriage?: {
    /** `economy.marriage.rescued.note` — the proposal that had to be asked twice. */
    readonly rescued?: string
    /** One per `economy.marriage.outcomes`, in the same order. */
    readonly outcomes?: readonly string[]
  }
}

/**
 * One country's content, in one language.
 *
 * `locale` and `editionId` are carried on the object rather than left to the
 * file path because the thing that will eventually look a translation up holds
 * an edition and a locale, not a filename — and a table that names which pair
 * it answers for is a table a registry can check rather than trust.
 */
export interface EditionTranslation {
  readonly locale: TranslatedLocaleId
  readonly editionId: EditionId
  readonly spaces: Readonly<Partial<Record<SpaceId, SpaceText>>>
  readonly careers: Readonly<Partial<Record<CareerId, CareerText>>>
  readonly houses: Readonly<Partial<Record<HouseId, CatalogueText>>>
  readonly stocks: Readonly<Partial<Record<StockId, CatalogueText>>>
  readonly lifeTiles: Readonly<Partial<Record<LifeTileId, LifeTileText>>>
  /**
   * Keyed by the lane's **English name** — "College Lane", "Straight to Work".
   *
   * Every other table here is keyed by an id, because every other thing has
   * one. A `LaneIdentity` does not: it is two strings stamped onto whichever
   * space survives the difficulty gating to the head of its branch, so the
   * obvious substitute key — the head tile's id — is a different tile on Hard
   * than it is on Normal, and a lane would lose its name at exactly the
   * setting that adds tiles in front of it.
   *
   * The English name is stable route data, unique within an edition, and — the
   * deciding reason — it is what a caller actually has in hand: the
   * presentation layer reads `space.lane.name`, never the branch it came from.
   */
  readonly lanes: Readonly<Partial<Record<string, LaneText>>>
  readonly economy?: EconomyText
}
