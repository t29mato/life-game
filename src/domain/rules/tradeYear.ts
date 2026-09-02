import type { Career, Money, SpinValue } from '../model/types'
import { SPIN_FACES } from '../model/constants'
import { CAREER_FAMILY, isCareerIcon, type CareerFamily } from './careerFamily'
import { SPIN_VALUES } from './diePayout'

/**
 * A year in the work you already do.
 *
 * The board had plenty to say about *changing* jobs and nothing at all to say
 * about doing one. Every tile that touched a career took it away, swapped it,
 * or promoted somebody out of it — so a restaurant owner and a climate
 * modeller lived the same life, tile for tile, with a different number printed
 * on their payday. This is the other kind of career event: nothing changes
 * hands, nobody is hired or laid off, and the year the trade had is what moves
 * the money.
 *
 * Three rules hold it together.
 *
 * **The story belongs to the family, not to the job title.** Sixty-two careers
 * across five editions would be sixty-two sets of vignettes nobody could keep
 * true; the eight families in `careerFamily.ts` are the grouping the game
 * already draws plaques, gear and the Handbook from, and a food-poisoning
 * scandal is a thing that happens to any kitchen. So a family is written once
 * and every trade in it inherits the year.
 *
 * **The die tells the whole story, and nothing else is rolled for.** Each
 * family writes one vignette per face, worst first, and the face picks both
 * which one happened *and* how far from an even year it lands. A second draw
 * for "which story" would spend randomness on something the number already
 * decided, and would leave a 6 able to deal a mild good year.
 *
 * **It is worth nothing on average, deliberately.** The faces are weighted
 * `(2f - 7)/5` — -1, -0.6, -0.2, +0.2, +0.6, +1 — so the best year pays
 * exactly what the worst one costs and the tile pays out zero over the whole
 * die. It is a variance tile and a storytelling tile, not an income tile:
 * every mean-based guard in `gameBalance.test.ts` is priced against a board
 * this thing does not move, and `expectedTradeYearValue` is the test that says
 * so. What it *does* move is the spread, and proportionally — see `swingFor`.
 */

/**
 * What each face of the die did to a trade, worst first.
 *
 * Six lines per family, one per face, and the order is the severity: face 1 is
 * the year that ends careers and face 6 is the one people tell stories about.
 * They are written for the whole family rather than for one job in it, which
 * is why a kitchen's disaster is an inspector rather than a specific dish.
 */
export type TradeYearStories = readonly [string, string, string, string, string, string]

export const TRADE_YEAR_STORIES: Readonly<Record<CareerFamily, TradeYearStories>> = {
  kitchen: [
    'A bad batch puts four people in hospital. The inspector closes the kitchen, and the settlement takes the rest of the year.',
    'The walk-in freezer dies over a long weekend and every case of stock in it goes in the bin.',
    'Somewhere brighter opens across the road, and half the lunch trade walks over to have a look.',
    'A warm spring fills the outside tables every evening, and the tables pay for themselves.',
    'A critic writes four hundred words about one dish. The line starts forming an hour before opening.',
    'You land on a national list of the year\'s best. The booking line rings from nine until somebody unplugs it.',
  ],
  field: [
    'Hail flattens the crop three weeks before harvest, and the loss adjuster is very sorry about it.',
    'The rain never comes. Half of what was planted is lifted, and every buyer knows it.',
    'A cold snap sets the whole season back a month, and the good prices are gone by the time it is ready.',
    'A dry, bright autumn, and everything comes in clean and early.',
    'The buyers come to you this year. Every crate is sold before it leaves the yard.',
    'A perfect season here and a shortage everywhere else. Your price is the price.',
  ],
  works: [
    'A load goes over on a wet corner. Nobody is hurt, the vehicle is finished, and the excess is yours.',
    'The engine everything depends on gives up, and the rebuild eats the tool fund.',
    'The big contract goes to a firm quoting under cost, and the quiet months run longer than planned.',
    'A steady year, and one job so smooth the customer sends two more behind it.',
    'A yard across town shuts, and every one of their customers turns up at yours.',
    'You win a fleet contract on your own name. The work is booked out a year ahead.',
  ],
  office: [
    'A deal you signed off turns out to rest on numbers somebody else invented, and putting it right comes out of your pocket.',
    'The budget is cut, and your line is the one that pays for the rest of it.',
    'A quiet year. Nothing goes wrong, nothing goes right, and the bonus pool says so.',
    'You close the one deal nobody thought would close, and it lands inside this year\'s figures.',
    'Your name goes on the deal of the year. The bonus arrives before the paperwork does.',
    'The book you spent a decade building is bought out, and your share of it is written in a letter you read twice.',
  ],
  studio: [
    'The work you gave two years to is cancelled a month before it ships, and nothing is paid for work not delivered.',
    'A client folds owing you six months of invoices, and the letters go nowhere.',
    'The work is good and nobody sees it. The year passes very quietly.',
    'A small piece finds an audience it was never aimed at, and the phone starts ringing.',
    'Your name is on the thing everybody is talking about, and what you can ask for doubles.',
    'It goes everywhere. Strangers quote it back to you, and the royalties keep arriving all year.',
  ],
  care: [
    'A complaint is made against you. It is settled in the end, and the year goes on legal advice and a premium you cannot argue with.',
    'The building floods. The doors stay shut while the floor dries, and the fittings are all replaced.',
    'Somewhere cheaper opens two streets away, and the book is thinner every week of the year.',
    'Word gets round. The waiting list is longer than the week is.',
    'The local paper writes about what you do, and the phone does not stop for a month.',
    'You are asked to take the cases nobody else will, and paid properly for them for the first time.',
  ],
  science: [
    'Two years of work fails its final test in front of everybody, and the programme is cancelled with your name on it.',
    'The grant is not renewed. The lab runs the year on whatever is left in the drawer.',
    'The results are real and dull. Nobody is in a hurry to publish them.',
    'A quiet result turns out to matter, and the funding follows it.',
    'Your design flies. Everybody who said it would not now wants a meeting.',
    'The thing you spent a decade on is used by everyone, and the licence pays out every year from here.',
  ],
  pitch: [
    'The season ends bottom of the table. The club pays out what is left of the contract and thanks you for your time.',
    'Half the squad is injured by August, and the sponsors quietly decline to renew.',
    'A middling season. Nobody is angry, nobody is excited, and nobody renegotiates.',
    'A long run in the cup, and the gate money is better than anyone budgeted for.',
    'You take a side nobody rated to promotion, and every club in the league now has your number.',
    'A title, an open-top bus, and a contract you never had to ask for.',
  ],
}

/**
 * How far from an even year each face lands, as a multiple of the tile's own
 * stake — -1, -0.6, -0.2, +0.2, +0.6, +1 across the six faces.
 *
 * Symmetric about the middle of the die on purpose. There is no even year on
 * the table: the two middle faces are a mild bad year and a mild good one, so
 * the tile always has something to say, and the two ends are the same size in
 * both directions, so the whole thing pays nothing on average.
 */
export function tradeYearWeight(spin: SpinValue): number {
  return (2 * spin - (SPIN_FACES + 1)) / (SPIN_FACES - 1)
}

/** The family this player's trade belongs to — null for anybody not working. */
export function tradeFamilyOf(career: Career | null | undefined): CareerFamily | null {
  if (!career || !isCareerIcon(career.icon)) return null
  return CAREER_FAMILY[career.icon]
}

/**
 * What one face is worth, rounded to something a card can print.
 *
 * `share` is the tile's own stake, written as a fraction of a year's salary
 * rather than as a sum of money, and that is the whole reason this reads as
 * the player's *own* trade having a year. A flat figure would be regressive —
 * it lands hardest on whoever earns least, which on this board is the
 * school-leaver on the bottom rung — and it would say nothing about the job.
 * Scaled by salary, a bad year at a food truck and a bad year at a restaurant
 * are the same story told at two sizes, which is exactly what a ladder is for.
 * `HouseholdSpec.shareOfPayday` is the same argument, made about a marriage.
 *
 * Rounded away from zero symmetrically, so the good half and the bad half stay
 * exact mirrors of one another and the die keeps paying nothing on average
 * even after the rounding.
 */
export function tradeYearSwing(salary: Money, share: number, spin: SpinValue, rounding: number): Money {
  const raw = salary * share * tradeYearWeight(spin)
  const unit = rounding > 0 ? rounding : 1
  return Math.sign(raw) * Math.round(Math.abs(raw) / unit) * unit
}

/** Everything one landing on a trade-year tile turns into. */
export interface TradeYear {
  readonly family: CareerFamily
  /** What happened, in the family's own words. */
  readonly story: string
  /** Signed: positive is a good year. */
  readonly swing: Money
}

/**
 * The year this career had on this roll, or null when there is no career to
 * have one.
 *
 * Failing closed on an unemployed player is the same rule the driver's career
 * gear and the degree regalia already follow, and here it is the mechanic
 * rather than the art: this tile is about the work you do, and somebody
 * between jobs is not doing any. They walk past it, exactly as a single player
 * walks past the joint account.
 */
export function tradeYearFor(
  career: Career | null | undefined,
  spin: SpinValue,
  share: number,
  rounding: number,
): TradeYear | null {
  const family = tradeFamilyOf(career)
  if (!family || !career) return null
  const stories = TRADE_YEAR_STORIES[family]
  // Clamped rather than trusted: a face outside the written table is a bug in
  // whoever rolled it, and a missing story would be an empty card.
  const story = stories[Math.min(Math.max(spin, 1), stories.length) - 1] as string
  return { family, story, swing: tradeYearSwing(career.salary, share, spin, rounding) }
}

/** Every face of the die, so an average is an average and not an estimate. */
const EVERY_SPIN = SPIN_VALUES

/**
 * What a trade year is worth before anybody rolls: zero, for every trade in
 * every edition, and that is the property worth guarding rather than the
 * number.
 *
 * A tile that paid out on average would be a raise the board hands to whoever
 * happens to walk past it, and every mean this game is balanced on — the
 * economy's band, the two lanes of the opening fork, the step down at each
 * difficulty — would have to be re-measured against it. A tile that cost money
 * on average would be a tax on having a job. Neither is what was asked for:
 * what was asked for was a good year and a bad year, and the die deciding
 * which.
 */
export function expectedTradeYearValue(salary: Money, share: number, rounding: number): Money {
  return (
    EVERY_SPIN.reduce((sum, spin) => sum + tradeYearSwing(salary, share, spin, rounding), 0) /
    EVERY_SPIN.length
  )
}

/** The best year on the die — what the tile is playing for, in both directions. */
export function bestTradeYear(salary: Money, share: number, rounding: number): Money {
  return tradeYearSwing(salary, share, SPIN_FACES as SpinValue, rounding)
}
