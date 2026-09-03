import type { RouteBranch, RouteDefinition, SpaceContent } from '../../board/route'
import { NEW_BABY_ARRIVALS, TWINS_ARRIVALS } from '../../rules/children'
import {
  flavour,
  fork,
  missedPayday,
  payday,
  run,
  setback,
} from '../../board/route'

/**
 * The Researcher: Japan route — the measured skeleton, walked by somebody who
 * spent five years on a stipend.
 *
 * Structurally this board is the USA board, tile for tile: the same five
 * forks, the same stops, the same hardship placements, the same hazard tags,
 * the same payday count on every lane, every sum ×100. That skeleton is where
 * two years of measured balance lives, and this board keeps all of it. What it
 * does not keep is the *meaning* of the forks, and that is the whole point of
 * the edition — see `edition.test.ts`, which lists the four tiles that
 * deliberately diverge and holds every other one to the mirror.
 *
 * The four divergences, and why each one is here:
 *
 *  1. **The doctorate is awarded on the opening lane, not in the middle of the
 *     board.** In this life the fork at eighteen is not "degree or no degree",
 *     it is the master's exit into corporate research against the doctoral
 *     course, and by the time anybody reaches the middle of the board that
 *     question was answered years ago. So the graduation tile awards the
 *     master's and the tile after it awards the doctorate, which is what makes
 *     the gated road below able to ask for one.
 *  2. **The gated road is the Fixed-Term Ladder, gated on the doctorate
 *     itself** rather than on any degree — the strictest gate the engine has,
 *     and the only board that has ever needed it.
 *  3. **Its fifth tile is an open call rather than an appointment.** Promotion
 *     inside the ladder is a national competition with several dozen
 *     applicants, so it is a `promotion` roll that lands twice in six and
 *     costs nothing when it misses. This board's catastrophic moment is the
 *     end of the ladder, not the climb.
 *  4. **Two career redraws deal from the industry shelf at the bottom rung.**
 *     Leaving the university mid-career is not a sideways step here; the
 *     hiring calendar prices a decade of contracts at nothing. That is the one
 *     line that will make this board play differently from the American
 *     researcher's board, and it is written on two tiles.
 *
 * The voice rule, applied on every tile below and inherited from the country
 * Japan board: **short sentences, plain words, and the Japanese thing
 * explained in passing rather than named** — the permanent post, the ten-year
 * rule, the spring hiring round, the open call, the ten thousand postdocs.
 * Never a Japanese word in a title. A reader who has never set foot in a
 * Japanese university should get every joke on the first read; a reader who
 * has should wince first.
 */

const START: SpaceContent = {
  ...flavour('jpr-start', 'Start of Life', 'Your journey begins one April morning, in a lecture hall where somebody is explaining, very fast, what the next four years are for.', 'slate', 'space:start-of-life'),
  kind: 'start',
}

/**
 * The Doctoral Course: five years, one question, and a road that is only worth
 * walking if the thing at the end of it is worth having.
 *
 * The lane that mirrors College Lane, and the one this whole edition turns
 * over. Everywhere else on the shelf this is the safe road that buys a floor.
 * Here it is the gamble: the bill is smaller than a country board's (see
 * `economy.ts` for why a Japanese doctorate costs years rather than money),
 * the shelf it opens is the widest in the game, and the road opposite is the
 * one your whole cohort took.
 */
const DOCTORAL_COURSE: readonly SpaceContent[] = [
  // Has to stay the fork's first step — see usa/route.ts college-1.
  flavour('jpr-doc-bench', 'Your Own Bench', 'You are given a key card, a desk under a window that does not open, and a metre of bench that is yours for five years.', 'blue', 'space:move-in-day', {
    from: 'hard',
    description: 'You are given a key card, a desk, and a metre of bench — plus a list of everything you are expected to buy for it out of your own pocket in the first month.',
    effect: { type: 'payMoney', amount: 140_000, reason: 'Kitting out your own bench' },
  }),
  {
    id: 'jpr-doc-stipend-years', kind: 'event', title: 'The Stipend Years',
    description: 'Five years of it: fees, rent, and a research budget, against whatever the fellowship panel decided about you in March. Your classmates are three salaries in by now, and one of them keeps saying so kindly.',
    effect: { type: 'tuition', reason: 'Five years on a stipend' },
    tone: 'blue', icon: 'space:tuition-bill',
  },
  {
    id: 'jpr-doc-teaching', kind: 'normal', title: 'Teaching Assistant Shifts',
    description: 'Forty first-years, one laboratory class a week, and a wage per session that you work out, once, per hour, and then decide never to work out again.',
    effect: { type: 'gainMoney', amount: 900_000, reason: 'Teaching assistant shifts' },
    tone: 'blue', icon: 'space:campus-job',
  },
  setback('hard', 'jpr-doc-conference-fees', 'Conference Registration',
    'The meeting is in Sapporo, the registration fee is not discounted for students, and your supervisor is very sorry but the budget line closed in March.',
    { type: 'payMoney', amount: 30_000, reason: 'Registration you paid yourself' },
    'blue', 'finance:bank-visit'),
  {
    id: 'jpr-doc-fellowship', kind: 'normal', title: 'The Fellowship',
    description: 'The national fellowship comes through: a monthly stipend, a research budget in your own name, and a line on your record that every panel for the next decade will look for.',
    effect: { type: 'gainMoney', amount: 2_400_000, reason: 'The national fellowship' },
    tone: 'blue', icon: 'space:scholarship-win',
  },
  // This tile and the fellowship above are what stop the lane reading as bench,
  // bill, one wage and a hood — five years compressed into a handful of tiles.
  flavour('jpr-doc-qualifying', 'Qualifying Exams', 'Two written papers, one oral, and a committee who have all read the thing you have not written yet. You survive on convenience-store rice balls and the vending machine on the third floor.', 'blue', 'space:finals-week', {
    from: 'hard',
    description: 'Two written papers and one oral, and the fortnight of not working that goes with them — which for somebody paid by the teaching session means a fortnight of not being paid.',
    effect: { type: 'payMoney', amount: 160_000, reason: 'A fortnight not earning' },
  }),
  {
    /*
     * The master's, and this board's `graduate` milestone.
     *
     * Its slot on the USA board is Cap and Gown, and mechanically it is the
     * same tile: an `event` awarding the degree, so nobody spins past it. What
     * has moved is what it means. Two years in, the whole cohort is standing
     * here in the same rented gown, and almost all of them are leaving — this
     * is the exit the road opposite is named for, seen from inside. Staying is
     * the decision this lane was chosen to make, and the next tile is what it
     * buys.
     */
    id: 'jpr-doc-masters', kind: 'event', title: 'The Master\'s Gown',
    description: 'Two years done, a thesis bound in the university\'s own blue, and a rented gown for the photograph. Most of the people in this room are starting work in April. You are not.',
    effect: { type: 'graduate' },
    tone: 'blue', icon: 'space:cap-and-gown',
  },
  {
    /*
     * The doctorate, and the first of this board's four deliberate
     * divergences from the USA skeleton. On that board this slot is Packing
     * Up — an ordinary tile with nothing on it, sitting between two
     * guaranteed events as a buffer. Here it carries the whole point of the
     * road, so it is an `event`: the effect has to fire for everybody who
     * walked this lane, or the gated road later on would be a promise the
     * board only keeps to whoever rolls exactly right.
     */
    id: 'jpr-doc-defence', kind: 'event', title: 'The Defence',
    description: 'Three hours in a small room with the five people alive who know the field best, and at the end of it they stand up and call you doctor.',
    effect: { type: 'doctorate' },
    tone: 'blue', icon: 'space:cap-and-gown',
  },
]

const ACADEMIC_FAIR: SpaceContent = {
  id: 'jpr-doc-first-post', kind: 'event', title: 'The First Position',
  description: 'The board lists posts all over the country, each with a start date, an end date and a research topic already chosen. Two of them would have you.',
  effect: { type: 'chooseCareer', pool: 'graduate' },
  tone: 'gold', icon: 'space:grad-job-fair',
}

/**
 * The Master's Exit: the national default, and on this board the safe road.
 *
 * Mirrors Straight to Work exactly — hired on tile one, paid three times
 * before anybody on the other road has defended — and the spring hiring round
 * makes that promise *more* true here than anywhere. A manufacturer's research
 * division takes a whole cohort at once, on the same date, at the same salary,
 * and everybody knows what everybody else earns.
 *
 * It is not "no degree". That is the difference this edition exists to draw:
 * the person on this road has a master's, works in research, and is doing the
 * respectable thing. What they gave up is the one question that would have
 * been theirs.
 */
const MASTERS_EXIT: readonly SpaceContent[] = [
  {
    id: 'jpr-ms-spring-intake', kind: 'event', title: 'The Spring Intake',
    description: 'One recruitment season, one interview suit, one start date shared with four hundred other people. You walk in with a research division already assigned and a salary that is the same as everybody else\'s in the room.',
    effect: { type: 'chooseCareer', pool: 'basic' },
    tone: 'gold', icon: 'space:first-job-fair',
  },
  {
    id: 'jpr-ms-first-envelope', kind: 'normal', title: 'First Pay Envelope',
    description: 'Your first pay lands and feels enormous. You take your parents to dinner with it, and they let you pay with visible pride.',
    effect: { type: 'gainMoney', amount: 200_000, reason: 'First pay envelope' },
    footnote: 'Part of a month, not a whole one — you started part-way through it. The first full envelope is the next Payday square.',
    tone: 'orange', icon: 'space:first-paycheck',
  },
  payday('jpr-ms-payday-1', 'A full month on the books, and the deposit lands while your old labmates are still arguing with a spectrometer.', missedPayday(
    'veryHard',
    'Paid in Arrears',
    'Nobody mentioned that the first month is paid a month in arrears, and the deposit on the flat did not wait.',
    90_000,
    'A month of living on nothing',
  )),
  {
    id: 'jpr-ms-company-flat', kind: 'event', title: 'The Company Flat',
    description: 'You are earning, so you are expected to be housed: a subsidised flat eleven minutes from the laboratory, a deposit, and a bed you assemble yourself at midnight.',
    effect: { type: 'payMoney', amount: 180_000, reason: 'Deposit and moving in' },
    tone: 'orange', icon: 'space:rent-due', unscaled: true,
  },
  {
    id: 'jpr-ms-first-night', kind: 'normal', title: 'First Night In',
    description: 'You unpack four boxes, three of which are books, and go to sleep at two because the last train home from the laboratory is at midnight anyway.',
    // Nothing happens here, so it does not wear the rent arrow. See the USA
    // board's own First Night In.
    tone: 'orange', icon: 'space:move-in-day',
    effect: { type: 'none' },
  },
  {
    id: 'jpr-ms-clean-room', kind: 'event', title: 'Clean Room Kit',
    description: 'Two sets of whites, safety boots, a dosimeter badge, and a training course you pay for and then attend on a Saturday.',
    effect: { type: 'payMoney', amount: 150_000, reason: 'Kit and safety training' },
    tone: 'orange', icon: 'space:rent-due', appearsFrom: 'hard',
  },
  payday('jpr-ms-payday-2', 'Another month, another envelope, and nobody has once asked what your thesis would have been about.', missedPayday(
    'hard',
    'Bonus Halved',
    'The division misses its number, and the summer bonus is reassessed by somebody who has never been in the building.',
    120_000,
    'Half a bonus season',
  )),
  payday('jpr-ms-payday-3', 'Three paydays in, and the bank book has started to look like a habit. Your old supervisor is very pleased for you, and says so at length.'),
]

/**
 * The Corridor, first half: the years between the first position and the first
 * serious question about where the next one comes from.
 *
 * The department's corridor, with the noticeboard nobody has cleared since
 * 2011 — and, since both roads out of the opening fork meet here, also the
 * corridor of a corporate research division. The tiles are written so that
 * both people recognise them, because both of them are standing here.
 */
const CORRIDOR_EARLY: readonly SpaceContent[] = [
  {
    id: 'jpr-corridor-first-review', kind: 'normal', title: 'The First Review',
    description: 'Six months in, somebody sits down opposite you with a form in three copies and asks how you think it is going.',
    effect: { type: 'promotion', reason: 'The end of your first six months' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
  {
    id: 'jpr-corridor-bank', kind: 'normal', title: 'Bank Visit',
    description: 'The teller bows at exactly the angle the manual specifies and asks, warmly, whether a person on a three-year contract has considered a mortgage.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit',
  },
  {
    id: 'jpr-corridor-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'The broker unrolls a laminated hazard map of your neighbourhood and talks you through it. You have read the underlying survey. It is worse than the map.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office',
  },
  // The only payday in this stretch — see usa/route.ts main-6. Harshening it
  // zeroed every player's income for this whole run on Hard and Very Hard, so
  // it stays unconditional.
  payday('jpr-corridor-payday-1', 'The deposit lands at 9:00 on the dot, from a payroll office three buildings away that has never once got it wrong.'),
  {
    id: 'jpr-corridor-spinout-tip', kind: 'normal', title: 'A Word After the Seminar',
    description: 'Somebody two labs along has founded a company on their own patent, and mentions, over the seminar sandwiches, that there is still room in the round.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'space:stock-tip',
  },
  {
    id: 'jpr-corridor-crash', kind: 'normal', title: 'Car Crash',
    description: 'A wet crossing on the way back from the field site, and a car that does not stop. The other driver bows at precisely forty-five degrees; the bodyshop is less apologetic about its quote.',
    effect: { type: 'payMoney', amount: 900_000, reason: 'Bodyshop bill', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender',
  },
  setback('veryHard', 'jpr-corridor-pileup', 'Expressway Pileup',
    'Fog on the expressway coming back from a conference, brake lights, and four cars crushed together on the ramp. Everyone walks away; the invoices do not.',
    { type: 'payMoney', amount: 1_600_000, reason: 'Pileup repairs', hazard: 'accident' },
    'slate', 'space:fender-bender'),
  setback('hard', 'jpr-corridor-dentist', 'Dentist Bill',
    'One filling, one silver crown, one lecture about grinding your teeth in your sleep, and an invoice that stings rather more than the drill did.',
    { type: 'payMoney', amount: 500_000, reason: 'Dental work' },
    'slate', 'space:gym-membership'),
  {
    id: 'jpr-corridor-preprint', kind: 'normal', title: 'A Good Week',
    description: 'The thing works on a Tuesday afternoon, for the first time, in front of nobody at all, and you sit down on the floor of the laboratory and laugh.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'slate', icon: 'space:lucky-find',
  },
]

/**
 * The mid-career crossroads: stay at the bench, or take the call.
 *
 * The junction halts nothing and asks everybody, exactly as it does on every
 * other board. What differs is the price of one of the two answers — see
 * `LEAVE_FOR_INDUSTRY` below.
 */
const MID_CAREER_FORK: SpaceContent = {
  id: 'jpr-crossroads', kind: 'normal', title: 'Three Contracts In',
  description: 'Three contracts in, or five years at the same division, and a message from a recruiter that you have somehow still not deleted. The road forks here.',
  effect: { type: 'none' },
  tone: 'orange', icon: 'space:networking-night',
}

/**
 * Stay at the Bench: the raise arrives because you were still there to be
 * given it.
 *
 * One tile, a promotion roll, and no bill — the mirror of Company Road. For
 * somebody in a research division it is the next grade; for somebody on a
 * fixed-term post it is the renewal, and the roll is the same roll because the
 * question is the same question.
 */
const STAY_AT_THE_BENCH: readonly SpaceContent[] = [
  {
    id: 'jpr-bench-renewal', kind: 'normal', title: 'The Renewal',
    description: 'Nobody has left this group in a decade, so the post above yours only comes free when somebody finally retires.',
    effect: { type: 'promotion', reason: 'The post above yours came free' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
]

/**
 * Leave for Industry: the mid-career exit every academic has priced at least
 * once, and the tile that makes this board Japanese.
 *
 * The redraw at its head is the same compulsory `careerChange` Job-Hopper
 * Alley carries, with two words added: `pool: 'basic'` and `startsOver: true`.
 * The first says the door leads *out* — this road is leaving the university,
 * so it deals from the industry shelf and not from whichever shelf a
 * doctorate would otherwise entitle you to. The second is the one that will be
 * argued about, and it is the truest line on the board: a hiring calendar
 * built around taking a whole cohort in at twenty-three has no column for
 * eleven years of contracts, so you are hired at the door, at the door's
 * salary, whatever you were running last month. Leaving late is worse than
 * never having gone.
 *
 * It costs a player already working in industry nothing, deliberately —
 * `startsOver` only bites on somebody crossing in from another shelf, because
 * moving between two research divisions is an ordinary move and this tile is
 * not charging for that.
 */
const LEAVE_FOR_INDUSTRY: readonly SpaceContent[] = [
  {
    id: 'jpr-leave-lookout', kind: 'normal', title: 'The Quiet Applications',
    description: 'You rewrite the eleven-page academic record as two pages a recruiter can read, in a café, on a Sunday, without telling anybody.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:headhunted',
  },
  {
    id: 'jpr-leave-move', kind: 'event', title: 'The Mid-Career Market',
    description: 'The agency is friendly, thorough, and completely uninterested in what you published. Two divisions would take you — both at the grade they take people in at.',
    effect: {
      type: 'careerChange',
      reason: 'You left the university',
      compulsory: true,
      pool: 'basic',
      startsOver: true,
    },
    tone: 'orange', icon: 'space:headhunted',
  },
  {
    id: 'jpr-leave-first-salary', kind: 'payday', title: 'The First Real Salary',
    description: 'The transfer lands on the twenty-fifth, in full, with no end date attached to it, and you look at the figure for a while.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season',
  },
]

/**
 * The Corridor, second half, up to the junction: the review and the audit.
 * Cut in two by the gated fork, exactly as Main Street is — see the USA
 * board's `GRAD_SCHOOL_FORK` for the two measurements that put the junction
 * this late.
 */
const CORRIDOR_LATE: readonly SpaceContent[] = [
  {
    id: 'jpr-corridor-review', kind: 'event', title: 'The Review',
    description: 'A small room, two people with your file open between them, and one question: are you ready for the post above yours?',
    effect: { type: 'promotion', reason: 'Your review came round' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
  setback('veryHard', 'jpr-corridor-tax', 'Tax Audit',
    'A very polite letter about eleven years of honoraria, travel reimbursements and one small book royalty, and a figure at the bottom that has clearly already been decided.',
    { type: 'payMoney', amount: 1_500_000, reason: 'Tax audit settlement' },
    // A brown envelope with a number at the bottom is a bill, and the refund
    // cheque next door on the safe road is money coming the other way. One
    // picture cannot be both.
    'slate', 'space:tuition-bill'),
]

/**
 * The Send-Off, and the junction the Fixed-Term Ladder hangs off.
 *
 * Two jobs on one tile, for the same reason the USA board's Holiday Gifts
 * carries its junction: the gated road needed a fork and the board did not
 * need another space. The money and the kind are untouched — an ordinary
 * tile, a gift to everybody at the table — so a player who lands on it has
 * the year they always had, and a player who sweeps past it pays nothing.
 */
const LADDER_FORK: SpaceContent = {
  id: 'jpr-send-off', kind: 'normal', title: 'The Send-Off',
  description: 'Somebody in the group is leaving for a post in another city, so everybody chips in for the flowers and the good sake. Over the second bottle they explain what they are walking into, and the road forks here.',
  effect: { type: 'payEach', amount: 80_000, reason: 'Flowers and the good sake' },
  tone: 'slate', icon: 'space:surprise-bonus',
}

/**
 * The Fixed-Term Ladder: the road only a doctorate opens, and the one that
 * ends at the cliff.
 *
 * Six tiles, a bill at the top, no payday anywhere on it, and a compulsory
 * appointment at the bottom — the same lane shape the USA board's Grad School
 * has, telling an entirely different truth. There is no committee on this road
 * and no vote. There is a series of posts, each with a year printed on it, and
 * a rule that says an employer who keeps renewing you past ten years owes you
 * a permanent one. Everybody involved knows the rule. The ladder is what it
 * feels like to climb toward it.
 *
 * There is deliberately no payday on it, for the reason the USA lane has none:
 * the years not earning are the road's real price, and a wage packet in the
 * middle would quietly refund it. Six ungated tiles, for the layout reason
 * that file explains at length.
 */
const FIXED_TERM_LADDER: readonly SpaceContent[] = [
  {
    /*
     * An `event`, not a `stop`: it settles on one press with nothing to weigh,
     * because the road was already chosen at the junction. Same argument the
     * USA board's Doctoral Fees tile is written on, and the same die-decided
     * bill — see `economy.ts` for what this board spends it on.
     */
    id: 'jpr-ladder-arrival', kind: 'event', title: 'Setting Up the Lab',
    description: 'A room with a sink in it, a start date, and an end date three years later. Everything between the sink and a working laboratory is a quotation you are about to read very carefully.',
    effect: { type: 'tuition', reason: 'Setting up the laboratory', bill: 'doctorate' },
    tone: 'blue', icon: 'space:tuition-bill',
  },
  flavour('jpr-ladder-rejection', 'The First Rejection', 'Not funded. Two reviewers liked it, one did not understand it, and the panel had money for eleven of the sixty. You start again in October, which is what October is for.', 'blue', 'space:finals-week', {
    from: 'hard',
    description: 'Not funded — and the equipment you had already committed to for the work is delivered anyway, in three boxes, with an invoice.',
    effect: { type: 'payMoney', amount: 260_000, reason: 'Equipment ordered against a grant that did not come' },
  }),
  {
    /*
     * The one bit of income on the lane, and deliberately not a payday.
     * Teaching two evening classes at another university is a fee, not a
     * salary: it does not scale with the post, and it never arrives for being
     * passed. It is here so the lane is not four straight tiles of paying out.
     */
    id: 'jpr-ladder-evening-classes', kind: 'normal', title: 'Evening Classes',
    description: 'Two evenings a week at a university on the other side of the city, paid by the class, arranged by a colleague who felt bad about the funding.',
    effect: { type: 'gainMoney', amount: 400_000, reason: 'Teaching by the class' },
    tone: 'blue', icon: 'space:campus-job',
  },
  {
    /*
     * A flat grant rather than a LIFE tile, and the reason is measured — see
     * the USA board's Grant Award tile. A LIFE tile is variance, and every
     * tile on this lane is variance charged to one side of the opening fork.
     */
    id: 'jpr-ladder-small-grant', kind: 'normal', title: 'The Small Grant',
    description: 'The young researchers\' scheme funds you on the third attempt. It is not a lot of money. It is the first money that was yours because of an idea you had.',
    effect: { type: 'gainMoney', amount: 300_000, reason: 'A grant in your own name' },
    tone: 'blue', icon: 'space:scholarship-win',
  },
  {
    /*
     * The third divergence from the USA skeleton, and the one that says what
     * kind of country this is. That board's fifth grad-school tile is The
     * Defence, awarding the doctorate; this board awarded it years ago on the
     * opening lane, so the slot is free for the thing that actually happens
     * halfway up a fixed-term career: an open call.
     *
     * It is a `promotion` — a roll, fail-soft, repeatable, and long odds by
     * construction (the academia shelf climbs on a five and a six; see
     * `careers.ts`). An `event` so that everybody who walks the lane is asked
     * once. Missing costs nothing but the year, which is the whole difference
     * between this board and the American one: there, the roll in the middle
     * of the road is the one that ends careers.
     */
    id: 'jpr-ladder-open-call', kind: 'event', title: 'The Open Call',
    description: 'A post is advertised nationally. Thirty-one people apply, four are interviewed, one is appointed, and everybody involved has met everybody else at a conference.',
    effect: { type: 'promotion', reason: 'A post was advertised' },
    tone: 'blue', icon: 'space:big-promotion',
  },
  {
    /*
     * The Ten-Year Cliff.
     *
     * A plain compulsory `careerChange`, and that is a deliberate build
     * decision rather than a shortcut: the recommended order for this edition
     * is to ship the board with the effects the engine already has, play it,
     * and only then decide whether a gate-review effect with a real failure
     * branch earns its plumbing. So today the cliff is the good half of the
     * story — the road *is* the appointment, and standing here means the ten
     * years worked.
     *
     * It needs no `pool`: only a doctorate can be standing here, and a
     * doctorate's own shelf is the permanent one, so the redraw deals two
     * permanent posts and nothing else. Compulsory for the reason the USA
     * board's Appointment is compulsory — a player who could decline here
     * would have walked the whole ladder and kept the contract, which is not a
     * decision, it is a refund.
     */
    id: 'jpr-ladder-cliff', kind: 'event', title: 'The Ten-Year Cliff',
    description: 'The tenth year. Everybody who has counted knows what the tenth year means, and the letter, when it comes, has no end date on it anywhere. Two departments want you.',
    effect: { type: 'careerChange', reason: 'Ten years, and a post with no end date', compulsory: true },
    tone: 'gold', icon: 'space:grad-job-fair',
  },
]

/**
 * The Staff Job: the road for everybody the ladder is not for, and for
 * everybody it is for who rolled the other half of the die.
 *
 * Three tiles against the ladder's six, and one of them is a payday. That
 * ratio is the argument in miniature: this side is shorter, it is earning, and
 * it reaches the rest of the board sooner. It is not a consolation prize
 * either — the technical staff who keep the instruments true, and the
 * researchers in a division that has never once asked them to write a grant,
 * are half of what research in this country actually is.
 */
const STAFF_JOB: readonly SpaceContent[] = [
  flavour('jpr-staff-steady', 'A Steady Year', 'No upheaval, no application deadline, and a quiet competence that four different groups have started to rely on.', 'orange', 'space:steady-hustle'),
  payday('jpr-staff-payday', 'A deposit lands while somebody you know is filling in the fourteenth page of a funding form.'),
  {
    id: 'jpr-staff-course', kind: 'normal', title: 'The Evening Course',
    description: 'One evening a week for a year, no doctorate at the end of it, and a certificate in statistics that turns out to be worth having anyway.',
    effect: { type: 'payMoney', amount: 600_000, reason: 'Evening course fees' },
    // Fees, not wages. The campus-job coin belongs to the tiles that pay.
    tone: 'orange', icon: 'space:tuition-bill',
  },
]

/**
 * The Corridor after the gate: the two ways to lose a post, and the one way
 * back.
 *
 * Both roads out of the junction rejoin here, and that is the right way round
 * — a permanent post is not a shield against everything, it is a shield
 * against exactly this, and the board should make the difference visible by
 * walking everybody past the same two tiles. Somebody on a fixed-term post
 * loses it here. Somebody who cleared the cliff reads the notice and goes back
 * to work, because a permanent post is not the employer's to end.
 */
const CORRIDOR_AFTER_THE_GATE: readonly SpaceContent[] = [
  {
    // Sits with the notice below immediately in front of the fair, for the
    // same reason: two ways to lose the post, one hall to fix it, and neither
    // more than a tile away from the fix.
    id: 'jpr-after-nonrenewal', kind: 'normal', title: 'Not Renewed',
    description: 'The contract everyone swore blind would be renewed in April is, very quietly, not renewed. The farewell bouquet is lovely.',
    effect: { type: 'loseCareer', reason: 'The contract was not renewed' },
    tone: 'orange', icon: 'space:layoff-notice', appearsFrom: 'hard',
  },
  {
    // Keep this immediately in front of the fair below: the swing is only fair
    // because the way back is the very next tile.
    id: 'jpr-after-layoff', kind: 'normal', title: 'Layoff Notice',
    description: 'The programme ends two years early, the whole floor is called into one meeting, and afterwards your key card opens nothing.',
    effect: { type: 'loseCareer', reason: 'The programme ended early' },
    tone: 'orange', icon: 'space:layoff-notice',
  },
  {
    /*
     * A stop, and on every board, because it is the layoff's only way back —
     * see the USA board's Career Fair. What is written on it here is the
     * fourth divergence: `pool: 'basic'` and `startsOver: true`, the same pair
     * the mid-career exit carries and for the same reason. This hall is
     * industry's hall. Somebody who spent a decade on fixed-term posts and is
     * standing here without one is hired at the grade the calendar hires at,
     * and the option card says so out loud before they roll.
     */
    id: 'jpr-after-fair', kind: 'stop', title: 'The Career-Change Fair',
    description: 'A hall of booths for people who did everything right in a system that ran out of posts. Nobody here reads a publication list. Two divisions like the two pages.',
    effect: {
      type: 'careerChange',
      reason: 'A fresh start, at the grade they start people at',
      pool: 'basic',
      startsOver: true,
    },
    tone: 'orange', icon: 'space:career-fair-return',
  },
]

const MARRIAGE: SpaceContent = {
  id: 'jpr-wedding', kind: 'event', title: 'Wedding Day',
  description: 'Vows, photographs, and a room containing both families, both supervisors, and four people who have refereed each other\'s papers anonymously for years.',
  effect: { type: 'getMarried' },
  tone: 'pink', icon: 'space:wedding-day',
}

/** Two Bodies: the lane where a research life meets the rest of a life. */
const TWO_BODIES: readonly SpaceContent[] = [
  {
    id: 'jpr-family-nursery-setup', kind: 'normal', title: 'Nursery Setup',
    description: 'You paint the nursery a cheerful yellow, assemble a crib at midnight, and read the ward office\'s handbook for new parents, which is longer than your thesis.',
    effect: { type: 'payMoney', amount: 200_000, reason: 'Nursery setup' },
    tone: 'purple', icon: 'space:nursery-setup',
  },
  {
    id: 'jpr-family-new-baby', kind: 'event', title: 'New Baby',
    description: 'The spare room is painted and the crib is built, three weeks before a grant deadline. The deadline is the only part of the year you control.',
    effect: { type: 'haveChildren', arrivals: NEW_BABY_ARRIVALS, celebrationPerChild: 250_000 },
    tone: 'purple', icon: 'space:new-baby',
  },
  setback('hard', 'jpr-family-waitlist', 'The Nursery Waitlist',
    'Public nursery places are allocated by a points system that awards nothing for a fixed-term contract. You are 47th in line, so a private place bridges the gap at private prices.',
    { type: 'payPerChild', amount: 500_000, reason: 'Private nursery per child' },
    'purple', 'space:nursery-setup'),
  {
    id: 'jpr-family-school-bag', kind: 'normal', title: 'The School Bag',
    description: 'Each child needs the leather backpack, the uniform, the gym clothes, and forty-one items labelled by hand before the first day. The backpack costs more than your first laptop and will outlast your car.',
    effect: { type: 'payPerChild', amount: 300_000, reason: 'School bag and uniforms per child' },
    tone: 'purple', icon: 'space:school-fees',
  },
  {
    id: 'jpr-family-open-day', kind: 'normal', title: 'Bring Your Child to the Lab',
    description: 'Your child explains liquid nitrogen to the other children, loudly, mostly correctly, and with a confidence you have never once felt at a conference.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:school-play',
  },
  {
    id: 'jpr-family-twins', kind: 'normal', title: 'Twins',
    description: 'The technician goes quiet at the scan, turns the screen around, and holds up two fingers. You are, professionally, quite good at reading images, and you had not seen it.',
    effect: { type: 'haveChildren', arrivals: TWINS_ARRIVALS, celebrationPerChild: 250_000 },
    tone: 'purple', icon: 'space:second-baby',
  },
]

/** The Lab at Midnight: the years given to the work, and what they came to. */
const LAB_AT_MIDNIGHT: readonly SpaceContent[] = [
  payday('jpr-lab-payday-1', 'The overtime the university does not officially have finally shows up on the pay slip.'),
  {
    id: 'jpr-lab-the-year', kind: 'normal', title: 'The Year You Had',
    description: 'Twelve months of first trains and last trains, and a figure at the end of them that nobody in the building could have predicted in April.',
    effect: { type: 'tradeYear', reason: 'A year of first trains and last trains, and what it came to.', share: 0.5 },
    tone: 'orange', icon: 'space:overtime-shift',
  },
  setback('hard', 'jpr-lab-burnout', 'Signed Off',
    'Six weeks with a doctor\'s note, and the pay packet is a great deal lighter by the time you bow your way back into the building.',
    { type: 'payMoney', amount: 1_200_000, reason: 'Unpaid leave' },
    'orange', 'space:layoff-notice'),
  {
    id: 'jpr-lab-year-end-payroll', kind: 'payday', title: 'Year-End Payroll',
    description: 'The fiscal year closes on the last day of March, and whatever this post pays lands one more time before everything is reorganised again.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', appearsFrom: 'veryHard',
  },
  {
    id: 'jpr-lab-reorganisation', kind: 'normal', title: 'The Reorganisation',
    description: 'The institute is taken apart and put back together overnight, with new names on the doors. Yours says the same thing, and nothing else about the year is the same.',
    effect: { type: 'tradeYear', reason: 'A year decided several floors above you.', share: 0.5 },
    tone: 'orange', icon: 'space:career-fair-return', appearsFrom: 'veryHard',
  },
  {
    id: 'jpr-lab-trading', kind: 'normal', title: 'The Licensing Cheque',
    description: 'A small licensing payment arrives from the technology transfer office, and the app on your phone has been sending notifications with exclamation marks.',
    effect: { type: 'buyStock' },
    tone: 'orange', icon: 'finance:trading-floor',
  },
  payday('jpr-lab-payday-2', 'Another month down, another deposit in, and a fortnight of it spent on one figure that is now perfect.', missedPayday(
    'hard',
    'Grant Overhead Clawback',
    'Last year\'s overhead is recalculated by somebody in the administration building, and recalculated downwards.',
    600_000,
    'Overhead clawed back',
  )),
  {
    id: 'jpr-lab-retention', kind: 'normal', title: 'The Counter-Offer',
    description: 'You mention, lightly, over tea, that somebody else has been in touch. The head of department finds a special allowance before the tea does.',
    effect: { type: 'payRaise' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
]

/**
 * Grant Season: the money act, and the trunk that carries the overflow.
 *
 * Longer than the branches either side of it, and deliberately — a tile on a
 * branch costs the layout engine a column on the trunk, and a tile on a trunk
 * run costs nothing but itself. Branches are expensive and trunks are free,
 * and a hazard on the trunk is walked by everybody rather than by half the
 * table.
 */
const GRANT_SEASON: readonly SpaceContent[] = [
  {
    id: 'jpr-grant-trading', kind: 'normal', title: 'The Brokerage',
    description: 'Screens everywhere, a queue of retirees at the counter, and a broker who has strong opinions about a sensor company you happen to know rather well.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'finance:trading-floor',
  },
  {
    id: 'jpr-grant-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Before anyone hands you a set of house keys, somebody would like a word about cover — and unrolls a hazard map of your neighbourhood that is thorough, recent, and quietly terrifying.',
    // No auto cover at this window: both crash tiles are behind a pawn
    // standing here, so a policy sold at this desk could never pay out.
    effect: { type: 'buyInsurance', kinds: ['home', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office',
  },
  // The only payday in this stretch too. Harshening it zeroed Very Hard's
  // income for the whole run between the marriage fork and the home-buying
  // fork, so it stays unconditional.
  payday('jpr-grant-payday', 'A deposit lands the week the deposit on a flat is due.'),
  {
    id: 'jpr-grant-joint-account', kind: 'normal', title: 'The Joint Account',
    description: 'The accounts are merged, and for the first time somebody else\'s spending is also, unavoidably, your spending. They have opinions about how much of the budget is books.',
    effect: { type: 'household', reason: 'The household ledger, settled up' },
    tone: 'purple', icon: 'finance:bank-visit',
  },
  /*
   * The child-mischief tile — see the USA route's own comment on
   * `midtown-phone-call` for why it is a trunk `payPerChild` rather than
   * anything new. Zero for a player with no children, by construction.
   */
  {
    id: 'jpr-phone-call', kind: 'event', title: 'The Teacher Calls',
    description: 'The homeroom teacher telephones twenty minutes into your seminar. Your child is fine. The classroom window is not, and somebody else finishes the talk.',
    effect: { type: 'payPerChild', amount: 400_000, reason: 'Whatever they broke, per child' },
    tone: 'purple', icon: 'space:school-fees',
  },
  {
    id: 'jpr-grant-bonus', kind: 'payday', title: 'Year-End Bonus',
    description: 'The winter envelope lands, sized in months of what you earn rather than in what anybody promised, and every one of you gets a different number.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season',
  },
  {
    id: 'jpr-grant-raise', kind: 'normal', title: 'Mid-Career Raise',
    description: 'A quiet word by the lift, a new number, and a bow of exactly matched depth on the way out.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk',
  },
  setback('veryHard', 'jpr-grant-rate-rise', 'Rate Rise',
    'The era of the flat variable rate ends overnight. Everything in the household is repriced by a decision taken in a building you have never entered.',
    { type: 'payMoney', amount: 1_400_000, reason: 'Rates go the wrong way' },
    'slate', 'space:market-crash'),
]

const HOME_BUYING: SpaceContent = {
  id: 'jpr-model-room', kind: 'stop', title: 'The Model Room',
  description: 'A showroom flat with rented furniture, soft lighting, and a salesman whose repayment plan is exactly as long as the rest of your working life. He asks, pleasantly, about the end date on your contract.',
  effect: { type: 'buyHouse' },
  tone: 'gold', icon: 'space:house-hunting',
}

/** The Spinout: found a company on your own research, or watch one from the front row. */
const THE_SPINOUT: readonly SpaceContent[] = [
  {
    id: 'jpr-spinout-seed', kind: 'normal', title: 'The Seed Round',
    description: 'You put your savings into the company built on your own patent and sign eleven documents.',
    effect: { type: 'spinForMoney', perPip: 310_000, reason: 'The seed round' },
    tone: 'pink', icon: 'space:startup-bet',
  },
  {
    id: 'jpr-spinout-bad-tip', kind: 'normal', title: 'The Recommendation',
    description: 'You told everyone at the table the technology was sound. The technology is sound. The company is not, and you buy dinner to make up for having said so at volume.',
    effect: { type: 'payEach', amount: 200_000, reason: 'A recommendation you regret' },
    tone: 'pink', icon: 'space:market-crash',
  },
  {
    id: 'jpr-spinout-consulting', kind: 'normal', title: 'Consulting Days',
    description: 'Four companies want two days a month of exactly what you know, and are all quietly surprised you said yes to the first figure. You were not.',
    effect: { type: 'collectFromEach', amount: 250_000, reason: 'Consulting days' },
    tone: 'pink', icon: 'space:poker-night',
  },
  {
    id: 'jpr-spinout-down-round', kind: 'normal', title: 'The Down Round',
    description: 'The market for anything nine years from revenue closes overnight, and your holding is repriced by people who have not read the science.',
    effect: { type: 'payMoney', amount: 900_000, reason: 'The down round' },
    tone: 'pink', icon: 'space:market-crash',
  },
  setback('hard', 'jpr-spinout-aftershock', 'The Bridge Round',
    'The company needs six more months and asks the people who believe in it most. You are, unfortunately, the person who believes in it most.',
    { type: 'payMoney', amount: 1_600_000, reason: 'Bridging the company again' },
    'pink', 'space:market-crash'),
  {
    id: 'jpr-spinout-acquisition-talk', kind: 'normal', title: 'The Acquisition Talk',
    description: 'A very large company has been reading your patents for two years, and would like a conversation.',
    effect: { type: 'spinForMoney', perPip: 550_000, reason: 'The acquisition talk' },
    tone: 'pink', icon: 'space:lottery-ticket',
  },
  payday('jpr-spinout-payday', 'A pay packet lands while your equity is busy misbehaving.'),
  {
    id: 'jpr-spinout-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One handshake, one seal pressed onto one page of a shareholders\' agreement, and you and the front-runner trade bank balances.',
    effect: { type: 'swapMoneyWithLeader', reason: 'A deal with the front-runner' },
    tone: 'pink', icon: 'space:rival-swap',
  },
]

/** The Instrument Room: nobody has ever got rich in here, or ruined. */
const INSTRUMENT_ROOM: readonly SpaceContent[] = [
  {
    id: 'jpr-instrument-service-contract', kind: 'normal', title: 'The Service Contract',
    description: 'Three institutes renew the maintenance agreement without being asked, because the machine has not failed once since you took it over.',
    effect: { type: 'gainMoney', amount: 80_000, reason: 'Service contracts renewed' },
    tone: 'green', icon: 'space:coupon-clipping',
  },
  payday('jpr-instrument-payday', 'The deposit arrives on the twenty-fifth, as it has since the year the building opened.', missedPayday(
    'veryHard',
    'Wages Withheld',
    'A cell in a spreadsheet in the administration building means this month\'s wages will arrive next month instead.',
    100_000,
    'Wages held over a month',
  )),
  setback('hard', 'jpr-instrument-excess', 'Policy Excess',
    'Even the careful road has a claim form on it, in triplicate, and the excess is yours to cover in exact change.',
    { type: 'payMoney', amount: 100_000, reason: 'Policy excess' },
    'green', 'finance:insurance-office'),
  {
    id: 'jpr-instrument-ledger', kind: 'normal', title: 'The Budget Balances',
    description: 'You keep the facility\'s accounts faithfully for a whole year, column by column, and the year ends with a surplus small enough to be believed.',
    effect: { type: 'gainMoney', amount: 100_000, reason: 'The budget balances ahead' },
    tone: 'green', icon: 'space:budget-win',
  },
  {
    id: 'jpr-instrument-old-passbook', kind: 'normal', title: 'The Old Passbook',
    description: 'A childhood postal savings book surfaces in a drawer at your parents\' house, opened the year you asked for a microscope, and it has been quietly compounding ever since.',
    effect: { type: 'gainMoney', amount: 140_000, reason: 'The forgotten account' },
    tone: 'green', icon: 'space:refund-check',
  },
  {
    id: 'jpr-instrument-coin-tin', kind: 'normal', title: 'The Coin Tin',
    description: 'Every 500-yen coin for three years has gone into a biscuit tin on the shelf above the pH meter. Today the tin is full, and heavier than it has any right to be.',
    effect: { type: 'gainMoney', amount: 100_000, reason: 'Three years of coins' },
    tone: 'green', icon: 'space:quiet-savings',
  },
  payday('jpr-instrument-payday-2', 'Another twenty-fifth, another quiet deposit, and nothing at all to report at the group meeting. This is the whole idea.'),
  {
    id: 'jpr-instrument-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The reagent supplier posts its steady little cheque, plus a shareholder gift box containing, for reasons nobody has explained, very good rice.',
    effect: { type: 'stockDividend', perShare: 250_000, reason: 'Quarterly dividend' },
    tone: 'green', icon: 'space:dividend-day',
  },
]

/** Emeritus Row: the sharpest material on the board, played warm. */
const EMERITUS_ROW: readonly SpaceContent[] = [
  {
    /*
     * The buyout, and the one question the board asks everybody. A `stop` at
     * the head of the last act, so the whole table is asked it once — and it
     * has to be here rather than further along, because what stopping forfeits
     * is exactly this run. See the USA board's The Number.
     */
    id: 'jpr-emeritus-buyout', kind: 'stop', title: 'The Buyout',
    description: 'The early retirement package is explained by somebody from personnel who is younger than your longest-running experiment. The figure is real, and it is offered once.',
    effect: { type: 'retireEarly' },
    tone: 'gold', icon: 'space:retirement-fund',
  },
  {
    id: 'jpr-emeritus-upgrade', kind: 'normal', title: 'Home Upgrade',
    description: 'The agent calls about something brighter and higher, and just about within reach now that the appointment has no end date on it.',
    effect: { type: 'upgradeHouse' },
    tone: 'slate', icon: 'space:home-upgrade',
  },
  {
    id: 'jpr-emeritus-earthquake', kind: 'normal', title: 'The Earthquake',
    description: 'The big one finally introduces itself at four in the morning, drops every plate you own, and cracks the kitchen they landed in. The laboratory, built to a much better code, is fine.',
    effect: { type: 'payMoney', amount: 2_400_000, reason: 'Earthquake damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire',
  },
  setback('hard', 'jpr-emeritus-parents', 'Caring for Your Parents',
    'Somebody who kept every one of your school reports now needs carrying, and the care home\'s waitlist is longer than its brochure. You would never count the cost. The invoice counts it anyway.',
    { type: 'payMoney', amount: 2_000_000, reason: 'Caring for family' },
    'slate', 'space:family-portrait'),
  payday('jpr-emeritus-payday-1', 'One of your very last pay packets lands, in the same week as a proof you will not live to see cited.'),
  {
    id: 'jpr-emeritus-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One final audacious arrangement over green tea, and the leader watches their fortune bow politely and leave with you.',
    effect: { type: 'swapMoneyWithLeader', reason: 'The eleventh-hour swap' },
    tone: 'slate', icon: 'space:rival-swap',
  },
  {
    id: 'jpr-emeritus-children-visit', kind: 'normal', title: 'The Children Visit',
    description: 'Every grown-up child arrives with fruit in a box too beautiful to open, and one of them has brought a paper of their own to show you.',
    effect: { type: 'collectPerChild', amount: 400_000, reason: 'An envelope from each child' },
    tone: 'slate', icon: 'space:child-benefit',
  },
  {
    id: 'jpr-emeritus-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'A co-author you have not spoken to in years presents your figure at a meeting you could not get funding to attend, and the room remembers whose it was.',
    effect: { type: 'stealLifeTile', reason: 'A figure changes hands' },
    tone: 'slate', icon: 'space:sticky-fingers',
  },
  {
    id: 'jpr-emeritus-named-chair', kind: 'normal', title: 'The Named Chair',
    description: 'One more title before the door, if the faculty meeting can be persuaded.',
    effect: { type: 'promotion', reason: 'The last review of your life' },
    tone: 'slate', icon: 'space:big-promotion',
  },
  payday('jpr-emeritus-payday-2', 'You stopped counting the paydays somewhere around the third grant renewal; the twenty-fifth has not.'),
  setback('veryHard', 'jpr-emeritus-final-tax', 'Final Tax Bill',
    'One last envelope from the tax office arrives, about eleven years of honoraria, and it is waiting on the desk on your final morning.',
    { type: 'payMoney', amount: 2_200_000, reason: 'Final tax bill' },
    'slate', 'space:tuition-bill'),
  {
    /*
     * The last year in the trade, and the board's one guaranteed word about
     * the work a player actually does. An `event`, so every seat at the table
     * gets exactly one year in their own field per game — and on this board
     * those six vignettes are the edition's own (see `tradeYearStories.ts`),
     * which is most of what a researcher will remember about playing it.
     */
    id: 'jpr-emeritus-last-year', kind: 'event', title: 'The Last Lab Meeting',
    description: 'One more year of the question you have been asking all your life, and then the keys go back and somebody else opens the freezer. Everybody wants to know how it went.',
    effect: { type: 'tradeYear', reason: 'The last year at the bench.', share: 0.5 },
    tone: 'slate', icon: 'space:sunset-ahead',
  },
]

const RETIREMENT: SpaceContent = {
  id: 'jpr-retirement', kind: 'retirement', title: 'Retirement Day',
  description: 'A bouquet at your desk, one deep bow to the room, and the first morning in forty years with no experiment running anywhere.',
  effect: { type: 'retire' },
  tone: 'gold', icon: 'space:retirement',
}

// ---------------------------------------------------------------------------
// The route: start, five forks, five trunk runs, and retirement — the same
// grammar as every edition. The ten summaries below are the only writing on
// this board a player reads *before* deciding anything, so each one is a case
// put by somebody who believes it, with its cost admitted in the same breath.
// ---------------------------------------------------------------------------

const DOCTORAL_BRANCH: RouteBranch = {
  identity: {
    name: 'The Doctoral Course',
    summary: 'Five more years on a stipend, chasing one question nobody has answered, while everybody you sat the entrance exam with is three salaries in. At the end of it you are one of a handful of people alive qualified to run a laboratory — if a laboratory can be got.',
  },
  spaces: [...DOCTORAL_COURSE, ACADEMIC_FAIR],
}

const MASTERS_BRANCH: RouteBranch = {
  identity: {
    name: 'The Master\'s Exit',
    summary: 'Leave with the master\'s and take the job, the way almost everybody does. Real equipment, real money, a salary the same day every month for forty years — and somebody else deciding what the question is, permanently.',
  },
  spaces: MASTERS_EXIT,
}

const BENCH_BRANCH: RouteBranch = {
  identity: {
    name: 'Stay at the Bench',
    summary: 'Stay where you are and let the work compound. The post above yours comes free when somebody retires, the group knows what you are worth, and nobody is going to make you say it out loud.',
  },
  spaces: STAY_AT_THE_BENCH,
}

const LEAVE_BRANCH: RouteBranch = {
  identity: {
    name: 'Leave for Industry',
    summary: 'Take the call. Real money, a contract with no end date, and an interviewer who does not ask about the papers — because the calendar that hires here has no column for the years you spent on them. You start at the door, wherever you were standing.',
  },
  spaces: LEAVE_FOR_INDUSTRY,
}

/**
 * The one branch on this board that names a condition, and the strictest gate
 * the engine has: the doctorate itself, not merely a degree. The summary has
 * to make the case *and* be readable by the half of the table who will never
 * be offered it — the fact that it is only ever shown to a doctor is the
 * gate's business, not the sentence's.
 */
const LADDER_BRANCH: RouteBranch = {
  identity: {
    name: 'The Fixed-Term Ladder',
    summary: 'A post with a year printed on it, then another, then another — and a rule that says whoever keeps renewing you past ten years owes you one that never ends. Every payday on this road belongs to somebody else, and what is at the top of it cannot be taken away.',
    requires: 'doctorate',
  },
  spaces: FIXED_TERM_LADDER,
}

const STAFF_BRANCH: RouteBranch = {
  identity: {
    name: 'The Staff Job',
    summary: 'Keep the post that pays every month. The title never changes, the work is real, half the results in the building depend on you, and nobody is going to make you write a funding application to keep doing it.',
  },
  spaces: STAFF_JOB,
}

const TWO_BODIES_BRANCH: RouteBranch = {
  identity: {
    name: 'Two Bodies',
    summary: 'School bags, a nursery waiting list that awards no points for a fixed-term contract, and an envelope from every grown-up child at the end. Far fewer paydays, and every bill arrives multiplied.',
  },
  spaces: TWO_BODIES,
}

const LAB_BRANCH: RouteBranch = {
  identity: {
    name: 'The Lab at Midnight',
    summary: 'The building empties at six and you are still there at one, and you would not be anywhere else. The raises are real, the results are real, and the list of what it cost is a separate list, and it is long.',
  },
  spaces: LAB_AT_MIDNIGHT,
}

const SPINOUT_BRANCH: RouteBranch = {
  identity: {
    name: 'The Spinout',
    summary: 'Found a company on your own research and find out what the market thinks of it. Whoever is behind at the model room should be here; whoever is ahead should think hard about it.',
  },
  spaces: THE_SPINOUT,
}

const INSTRUMENT_BRANCH: RouteBranch = {
  identity: {
    name: 'The Instrument Room',
    summary: 'The machine, the booking calendar, the service contract that renews itself, and a biscuit tin of coins. Nobody has ever got rich in here, or ruined — which is worth a great deal if you are already winning.',
  },
  spaces: INSTRUMENT_ROOM,
}

export const ROUTE_RESEARCHER_JAPAN: RouteDefinition = {
  segments: [
    fork(START, DOCTORAL_BRANCH, MASTERS_BRANCH),
    run('the corridor', CORRIDOR_EARLY),
    fork(MID_CAREER_FORK, BENCH_BRANCH, LEAVE_BRANCH),
    run('the corridor, after the crossroads', CORRIDOR_LATE),
    fork(LADDER_FORK, LADDER_BRANCH, STAFF_BRANCH),
    run('the corridor, after the send-off', CORRIDOR_AFTER_THE_GATE),
    fork(MARRIAGE, TWO_BODIES_BRANCH, LAB_BRANCH),
    run('grant season', GRANT_SEASON),
    fork(HOME_BUYING, SPINOUT_BRANCH, INSTRUMENT_BRANCH),
    run('emeritus row', EMERITUS_ROW),
  ],
  terminal: RETIREMENT,
}
