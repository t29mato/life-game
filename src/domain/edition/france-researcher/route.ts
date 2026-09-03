import type { RouteBranch, RouteDefinition, SpaceContent } from '../../board/route'
import {
  flavour,
  fork,
  missedPayday,
  payday,
  run,
  setback,
} from '../../board/route'

/**
 * The Researcher: France route — the measured skeleton, walked by somebody
 * who did not go to a grande école.
 *
 * Structurally this board is the USA board, tile for tile: the same five
 * forks, the same stops, the same hardship placements, the same hazard tags,
 * the same payday count on every lane, every sum at ×1 — the euro sits close
 * enough to the dollar that only the symbol moves, exactly as the country
 * France board found. That skeleton is where two years of measured balance
 * lives, and this board keeps all of it. What it does not keep is the
 * *meaning* of the forks — see `edition.test.ts`, which lists the two tiles
 * that deliberately diverge and holds every other one to the mirror.
 *
 * The four things that make this board France, in the order a player meets
 * them:
 *
 *  1. **The opening fork is not a choice about education, it is a choice
 *     about a class of institution.** The Grande École is the prestigious
 *     road, and it does not lead through university science at all: two years
 *     of preparatory class, one competition at twenty, three years at a school
 *     whose name opens doors, a contract signed at the school's own
 *     recruitment forum. Nobody on that road ever "decided against a
 *     doctorate". The question never came up. The University is the underdog
 *     road, and the board says so in the summaries rather than pretending the
 *     two are symmetric.
 *  2. **The thesis years can pay.** The tuition tile on the opening lane is a
 *     die whose best face is an industrial doctorate — the thesis done inside
 *     a company, on a salary — and it is the only tuition tile anywhere in
 *     this game that puts money *into* a pocket. See `economy.ts`.
 *  3. **The gated road is one entry gate, sat twice.** Two postdoctoral
 *     tiles, a bill for the mobility years, and then the concours: a national
 *     competition that appoints on a five or a six, fail-soft, and available
 *     exactly twice before the lane runs out. Miss both and you walk off the
 *     road still on a contract, straight past a layoff notice and into the
 *     industry fair — which is what ageing out of the concours looks like
 *     from the inside.
 *  4. **What is behind the gate is safety, not money.** The fonctionnaire
 *     shelf cannot be laid off by anything on this board, and the cadre
 *     shelf's second rung out-earns every post on it. That is the exact
 *     inverse of the Researcher: Japan board, where the permanent shelf's
 *     floor stands above industry's ceiling — see `careers.ts`.
 *
 * The voice rule, applied on every tile below: **short sentences, plain
 * words, and the French thing explained in passing rather than named.** The
 * board is in English. Four terms stay because they are the actual
 * English-language terms of art — grande école, concours, fonctionnaire, the
 * industrial doctorate — and even those are explained by what happens on the
 * tile rather than by a glossary. A reader who has never set foot in a French
 * laboratory should get every joke on the first read; a reader who has should
 * wince first.
 */

const START: SpaceContent = {
  ...flavour('frr-start', 'Start of Life', 'Your journey begins in a lycée corridor in the spring, in front of a noticeboard where somebody has pinned two futures next to each other and gone home.', 'slate', 'space:start-of-life'),
  kind: 'start',
}

/**
 * The University: the road the results said you did not have to take.
 *
 * The lane that mirrors College Lane, and the underdog of this board. Five
 * years for a master's and a doctorate, on money that arrives if a committee
 * decided in March that it should, while everybody you sat the entrance
 * competition with is three salaries into a career at a firm that has never
 * once asked what your thesis was about.
 *
 * The bill on it is a die that can pay you, which is a genuinely French fact
 * and the reason this board's opening fork could be balanced at all — see
 * `economy.ts`. What the lane actually charges is the years: nine tiles, one
 * small teaching fee, and a road opposite that is salaried from its first
 * square.
 */
const THE_UNIVERSITY: readonly SpaceContent[] = [
  // Has to stay the fork's first step — see usa/route.ts college-1.
  flavour('frr-uni-arrival', 'A Bench of Your Own', 'A badge, a desk under a window that does not open, and a metre of bench that is yours for as long as the money lasts.', 'blue', 'space:move-in-day', {
    from: 'hard',
    description: 'A badge, a desk, and a student room whose deposit is two months up front, paid to an agency that will find a reason to keep some of it.',
    effect: { type: 'payMoney', amount: 1_400, reason: 'Two months up front' },
  }),
  {
    id: 'frr-uni-thesis-years', kind: 'event', title: 'The Thesis Years',
    description: 'Enrolment, rent, and five years of one question — against whatever the doctoral school decided about you in the summer.',
    effect: { type: 'tuition', reason: 'The thesis years' },
    tone: 'blue', icon: 'space:tuition-bill',
  },
  {
    id: 'frr-uni-teaching-hours', kind: 'normal', title: 'Sixty-Four Hours',
    description: 'Tutorials for first-years, sixty-four hours of them across the year, paid at a rate you work out once, per hour, and then decide never to work out again.',
    effect: { type: 'gainMoney', amount: 9_000, reason: 'A year of tutorials' },
    tone: 'blue', icon: 'space:campus-job',
  },
  setback('hard', 'frr-uni-overdraft', 'Overdraft Charges',
    'The contract pays on the last working day and the rent leaves on the first. The bank has noticed, and charges for noticing.',
    { type: 'payMoney', amount: 300, reason: 'Overdraft charges' },
    'blue', 'finance:bank-visit'),
  {
    id: 'frr-uni-mobility-grant', kind: 'normal', title: 'The Year Abroad',
    description: 'A mobility grant sends you to a laboratory in another country for a year. It pays properly, it changes what you work on, and every panel for the next decade will look for it.',
    effect: { type: 'gainMoney', amount: 24_000, reason: 'A funded year abroad' },
    tone: 'blue', icon: 'space:scholarship-win',
  },
  // This tile and the grant above are what stop the lane reading as bench,
  // bill, one wage and a defence — five years compressed into a handful of
  // tiles.
  flavour('frr-uni-committee', 'The Monitoring Committee', 'Once a year, two people who are not your supervisor read what you have and ask, kindly, whether the plan is still the plan. It is not, and everybody in the room knows it.', 'blue', 'space:finals-week', {
    from: 'hard',
    description: 'The committee asks for a written report, forty pages of it, and the fortnight spent writing it is a fortnight of not teaching — which for somebody paid by the hour is a fortnight of not being paid.',
    effect: { type: 'payMoney', amount: 1_600, reason: 'A fortnight not earning' },
  }),
  {
    /*
     * The master's, and this board's `graduate` milestone.
     *
     * Its slot on the USA board is Cap and Gown, and mechanically it is the
     * same tile: an `event` awarding the degree, so nobody spins past it.
     * What has moved is what it means. The research master's is the year the
     * road actually forks in France — half this cohort is already gone to
     * work, and the ones still here are the ones who are going to sign for a
     * thesis in September.
     */
    id: 'frr-uni-master', kind: 'event', title: 'The Research Master\'s',
    description: 'A year of seminars, a first laboratory placement, and a mark that decides whether anybody will fund three more years of you. There is no ceremony. There is a list, on a wall, in July.',
    effect: { type: 'graduate' },
    tone: 'blue', icon: 'space:cap-and-gown',
  },
  {
    /*
     * The doctorate, and the first of this board's two deliberate
     * divergences from the USA skeleton. On that board this slot is Packing
     * Up — an ordinary tile with nothing on it, sitting between two
     * guaranteed events as a buffer. Here it carries the whole point of the
     * road, so it is an `event`: the effect has to fire for everybody who
     * walked this lane, or the gated road later on would be a promise the
     * board only keeps to whoever rolls exactly right.
     *
     * The Researcher: Japan board makes the same move in the same slot, for
     * the same reason. On both boards the fork at eighteen *is* the
     * doctorate, so the doctorate cannot wait until the middle of the board.
     */
    id: 'frr-uni-defence', kind: 'event', title: 'The Defence',
    description: 'Six hours in a room with a jury who have all read it, a rapporteur who flew in for the morning, and, at the end, a form everybody signs and a bottle somebody has kept cold since ten.',
    effect: { type: 'doctorate' },
    tone: 'blue', icon: 'space:cap-and-gown',
  },
]

const FIRST_POST: SpaceContent = {
  id: 'frr-uni-first-post', kind: 'event', title: 'The First Contract',
  description: 'The list goes up in the spring: posts all over Europe, each with a start date, an end date and a project already written. Two of them would take you.',
  effect: { type: 'chooseCareer', pool: 'graduate' },
  tone: 'gold', icon: 'space:grad-job-fair',
}

/**
 * The Grande École: the road that never saw the fork.
 *
 * Mirrors Straight to Work exactly — hired on tile one, paid three times
 * before anybody on the other road has defended — and in France that promise
 * is *more* true than anywhere, because the hiring happens before the diploma
 * does. A school's own recruitment forum in the autumn of the final year, a
 * contract signed in November, a start date in September, and a starting
 * salary everybody in the year group compares within a thousand euros.
 *
 * It is not "no degree", and it is not even a decision. That is the
 * difference this board exists to draw: the person on this road holds an
 * engineering diploma, works in research, and did the prestigious thing. The
 * doctorate was never on the table, because nobody they respected had one.
 */
const THE_GRANDE_ECOLE: readonly SpaceContent[] = [
  {
    id: 'frr-ge-recruitment-forum', kind: 'event', title: 'The Recruitment Forum',
    description: 'Two hundred firms in the school\'s own hall, in November of the final year. You leave with a contract that starts in September and a starting salary the whole year group already knows.',
    effect: { type: 'chooseCareer', pool: 'basic' },
    tone: 'gold', icon: 'space:first-job-fair',
  },
  {
    id: 'frr-ge-first-pay', kind: 'normal', title: 'First Pay Slip',
    description: 'Four pages, eleven lines of contributions, and a number at the bottom that is still more money than anybody in your family earned at twenty-three. You take your parents to dinner with it.',
    effect: { type: 'gainMoney', amount: 2_000, reason: 'First pay slip' },
    footnote: 'Part of a month, not a whole one — you started part-way through it. The first full one is the next Payday square.',
    tone: 'orange', icon: 'space:first-paycheck',
  },
  payday('frr-ge-payday-1', 'A full month on the payroll, and the transfer lands while your old classmates are still arguing with a spectrometer.', missedPayday(
    'veryHard',
    'Paid in Arrears',
    'Nobody mentioned that the first month is paid a month behind, and the agency holding the flat\'s deposit did not wait.',
    900,
    'A month of living on nothing',
  )),
  {
    id: 'frr-ge-deposit', kind: 'event', title: 'The Deposit and the Guarantor',
    description: 'Two months up front, a file thicker than a thesis, and a landlord who would also like a guarantor, in France, earning three times the rent.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'Deposit and first month' },
    tone: 'orange', icon: 'space:rent-due', unscaled: true,
  },
  {
    id: 'frr-ge-first-night', kind: 'normal', title: 'First Night In',
    description: 'You unpack four boxes, three of which are books, and eat standing up because the table arrives on Thursday.',
    // Nothing happens here, so it does not wear the rent arrow. See the USA
    // board's own First Night In.
    tone: 'orange', icon: 'space:move-in-day',
    effect: { type: 'none' },
  },
  {
    id: 'frr-ge-school-invoice', kind: 'event', title: 'The School\'s Last Invoice',
    description: 'The final year\'s fees, deferred until you had a salary, arrive the month you have one. The school is very proud of you and would like to be paid.',
    effect: { type: 'payMoney', amount: 1_500, reason: 'The final year\'s fees' },
    tone: 'orange', icon: 'space:rent-due', appearsFrom: 'hard',
  },
  payday('frr-ge-payday-2', 'Another month, another transfer, and nobody has once asked what your thesis would have been about.', missedPayday(
    'hard',
    'Bonus Reassessed',
    'The division misses its number, and the variable part of your pay is reassessed by somebody who has never been in the building.',
    1_200,
    'Half a bonus',
  )),
  payday('frr-ge-payday-3', 'Three payslips in, and the account has started to look like a habit. Your old physics teacher is very pleased for you, and says so at length.'),
]

/**
 * The Boulevard, first half: the years between the first contract and the
 * first serious question about where the next one comes from.
 *
 * The plane trees outside the laboratory, and — since both roads out of the
 * opening fork meet here — also the boulevard outside a group's research
 * centre. The tiles are written so that both people recognise them, because
 * both of them are standing here.
 */
const BOULEVARD_EARLY: readonly SpaceContent[] = [
  {
    id: 'frr-blvd-first-review', kind: 'normal', title: 'The End of the Trial Period',
    description: 'Four months in, somebody sits down opposite you with a form and confirms, warmly, that they are keeping you.',
    effect: { type: 'promotion', reason: 'The end of the trial period' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
  {
    id: 'frr-blvd-bank', kind: 'normal', title: 'Bank Visit',
    description: 'The adviser is thirty seconds late, immaculately polite, and asks whether somebody on a three-year contract has considered a home loan.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit',
  },
  {
    id: 'frr-blvd-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'The broker unrolls a flood map of your neighbourhood and talks you through it. You have read the underlying survey. It is worse than the map.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office',
  },
  // The only payday in this stretch — see usa/route.ts main-6. Harshening it
  // zeroed every player's income for this whole run on Hard and Very Hard, so
  // it stays unconditional.
  payday('frr-blvd-payday-1', 'The transfer lands on the twenty-eighth, from an accounts office two buildings away that has never once got it wrong.'),
  {
    id: 'frr-blvd-spinout-tip', kind: 'normal', title: 'A Word After the Seminar',
    description: 'Somebody two laboratories along has founded a company on a licence from their own bench, and mentions, over the seminar wine, that the round is not closed.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'space:stock-tip',
  },
  {
    id: 'frr-blvd-crash', kind: 'normal', title: 'Car Crash',
    description: 'A wet roundabout on the way back from the field site, and a van that does not stop. Everybody is fine, everybody is sorry, and the bodyshop is neither.',
    effect: { type: 'payMoney', amount: 9_000, reason: 'Bodyshop bill', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender',
  },
  setback('veryHard', 'frr-blvd-pileup', 'Motorway Pileup',
    'Fog on the motorway coming back from a conference, brake lights, and four cars folded together on the slip road. Everyone walks away; the invoices do not.',
    { type: 'payMoney', amount: 16_000, reason: 'Pileup repairs', hazard: 'accident' },
    'slate', 'space:fender-bender'),
  setback('hard', 'frr-blvd-dentist', 'Dentist Bill',
    'One crown, one lecture about grinding your teeth in your sleep, and the part the top-up insurance politely declines to cover.',
    { type: 'payMoney', amount: 5_000, reason: 'Dental work' },
    'slate', 'space:gym-membership'),
  {
    id: 'frr-blvd-good-week', kind: 'normal', title: 'A Good Week',
    description: 'You come in on a Saturday because nobody else will be there, and at four o\'clock the experiment does the thing it was supposed to do in March.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'slate', icon: 'space:lucky-find',
  },
]

/**
 * The mid-career crossroads: stay where you are, or take the call.
 *
 * The junction halts nothing and asks everybody, exactly as it does on every
 * other board. What differs is what one of the two answers costs — see
 * `THE_MOVE_TO_INDUSTRY` below, and its opposite number on the Japan board.
 */
const MID_CAREER_FORK: SpaceContent = {
  id: 'frr-crossroads', kind: 'normal', title: 'Three Contracts In',
  description: 'Three contracts in, or five years at the same firm, and a message from a recruiter you have somehow still not deleted. The road forks here.',
  effect: { type: 'none' },
  tone: 'orange', icon: 'space:networking-night',
}

/**
 * Stay Where You Are: the step that arrives because you were still there to
 * take it.
 *
 * One tile, one review, and no bill — the mirror of Company Road. For
 * somebody in a research centre it is the next coefficient; for somebody on a
 * contract it is the renewal and the project that comes with it, and the roll
 * is the same roll because the question is the same question.
 */
const STAY_WHERE_YOU_ARE: readonly SpaceContent[] = [
  {
    id: 'frr-stay-renewal', kind: 'normal', title: 'The Renewal',
    description: 'The post above yours comes free when somebody finally retires, and the person who decides has known your work for six years.',
    effect: { type: 'promotion', reason: 'The post above yours came free' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
]

/**
 * The Move to Industry: the mid-career exit every French researcher has
 * priced at least once — and the tile where this board and the Japan board
 * say opposite things.
 *
 * The redraw at its head is the same compulsory `careerChange` Job-Hopper
 * Alley carries, with one word added: `pool: 'basic'`. The door leads *out*,
 * so it deals from the cadre shelf and not from the shelf a doctorate would
 * otherwise entitle you to — without that cap, the tile that represents
 * giving up on a permanent post would be offering one.
 *
 * What it deliberately does **not** carry is `startsOver`. That is the whole
 * contrast with the Japan board, whose identical tile deals at the door-in
 * rung because a hiring calendar built around taking a cohort in at
 * twenty-three has no column for eleven years of contracts. France's does. A
 * doctorate is a recognised diploma here, the years count toward the grade,
 * and a laboratory's project leader is hired as a cadre with eleven years
 * behind them — so the offer is dealt at the rung already reached, exactly as
 * the board's default has always dealt it. One field, present on one board
 * and absent on the other, and the two labour markets are told apart.
 */
const THE_MOVE_TO_INDUSTRY: readonly SpaceContent[] = [
  {
    id: 'frr-move-lookout', kind: 'normal', title: 'The Quiet Applications',
    description: 'You rewrite eleven pages of publications as two pages a recruiter can read, in a café, on a Sunday, without telling anybody.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:headhunted',
  },
  {
    id: 'frr-move-offer', kind: 'event', title: 'The Mid-Career Market',
    description: 'The recruiter is friendly, thorough, and entirely uninterested in what you published — but the diploma counts, and so do the years. Two firms would take you at the grade you have reached.',
    effect: {
      type: 'careerChange',
      reason: 'You left the laboratory',
      compulsory: true,
      pool: 'basic',
    },
    tone: 'orange', icon: 'space:headhunted',
  },
  {
    id: 'frr-move-first-salary', kind: 'payday', title: 'The First Real Salary',
    description: 'The transfer lands at the end of the month, in full, with no end date attached to it anywhere, and you look at the figure for a while.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season',
  },
]

/**
 * The Boulevard, second half, up to the junction: the review and the audit.
 * Cut in two by the gated fork, exactly as Main Street is — see the USA
 * board's `GRAD_SCHOOL_FORK` for the two measurements that put the junction
 * this late.
 */
const BOULEVARD_LATE: readonly SpaceContent[] = [
  {
    id: 'frr-blvd-review', kind: 'event', title: 'The Review',
    description: 'Two people, your file open on the table between them, and the question everybody in the corridor already knows they are going to ask.',
    effect: { type: 'promotion', reason: 'Your review came round' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
  setback('veryHard', 'frr-blvd-tax', 'Tax Adjustment',
    'A very polite letter about eleven years of expenses, conference reimbursements and one small book royalty, with a figure at the bottom that has clearly already been decided.',
    { type: 'payMoney', amount: 15_000, reason: 'Tax adjustment' },
    // A brown envelope with a number at the bottom is a bill, and the refund
    // cheque next door on the safe road is money coming the other way. One
    // picture cannot be both.
    'slate', 'space:tuition-bill'),
]

/**
 * The Leaving Drinks, and the junction the concours road hangs off.
 *
 * Two jobs on one tile, for the same reason the USA board's Holiday Gifts
 * carries its junction: the gated road needed a fork and the board did not
 * need another space. The money and the kind are untouched — an ordinary
 * tile, a whip-round at the table — so a player who lands on it has the year
 * they always had, and a player who sweeps past it pays nothing.
 */
const CONCOURS_FORK: SpaceContent = {
  id: 'frr-leaving-drinks', kind: 'normal', title: 'The Leaving Drinks',
  description: 'Somebody in the group has been appointed somewhere permanent, four hundred kilometres away, so everybody puts in for the crémant and a card. Over the second bottle they explain exactly how they did it, and the road forks here.',
  effect: { type: 'payEach', amount: 800, reason: 'The whip-round' },
  tone: 'slate', icon: 'space:surprise-bonus',
}

/**
 * The Concours: the road only a doctorate opens, and the only long-odds roll
 * on this board.
 *
 * Six tiles, a bill at the top, no payday anywhere on it, and — where every
 * other board in this repository puts a guaranteed appointment at the end —
 * **two sittings of a national competition that appoints on a five or a six.**
 * That is the France board's whole shape: no tenure clock, no ten-year cliff,
 * no committee that can end a career. One gate, in your early thirties, with
 * everything behind it and a short queue of chances at it.
 *
 * Failure is fail-soft in the fullest sense the engine allows: the post, the
 * rung, the raises and the money are all exactly where they were, and the only
 * thing spent is the year. **How many years there are is the number of gate
 * tiles on this lane, and that is the attempt limit** — no counter, no new
 * player state, just a road that runs out. Miss both sittings and the lane
 * rejoins the trunk one tile in front of a layoff notice and two in front of
 * the industry fair, which is precisely what ageing out of the concours looks
 * like: nothing dramatic happens, and then one spring you are forty and
 * somebody offers you a job in a firm.
 *
 * There is deliberately no payday on it, for the reason the USA lane has
 * none: the years not earning are the road's real price, and a wage packet in
 * the middle would quietly refund it. Six ungated tiles, for the layout
 * reason that file explains at length.
 */
const THE_CONCOURS: readonly SpaceContent[] = [
  {
    /*
     * An `event`, not a `stop`: it settles on one press with nothing to
     * weigh, because the road was already chosen at the junction. Same
     * argument the USA board's Doctoral Fees tile is written on, and the same
     * die-decided bill — see `economy.ts` for what this board spends it on.
     */
    id: 'frr-conc-mobility', kind: 'event', title: 'The Mobility Years',
    description: 'Nobody will appoint you where you were trained, so you go abroad, and then you come back — two moves, two deposits, and the months in between when one contract has ended and the next has not started.',
    effect: { type: 'tuition', reason: 'The mobility years', bill: 'doctorate' },
    tone: 'blue', icon: 'space:tuition-bill',
  },
  flavour('frr-conc-qualification', 'The Qualification', 'Before you may apply for a single post, a national council must agree that you are the kind of person who may apply. A file, a deadline in October, and a decision in February that arrives with no reasons attached.', 'blue', 'space:finals-week', {
    from: 'hard',
    description: 'The file is refused on a technicality about the composition of your jury. You assemble the whole thing again, with certified translations, and pay for every one of them.',
    effect: { type: 'payMoney', amount: 2_600, reason: 'Assembling the file twice' },
  }),
  {
    /*
     * The one bit of income on the lane, and deliberately not a payday.
     * Teaching hours at another university are a fee, not a salary: they do
     * not scale with the post, and they never arrive for being passed. It is
     * here so the lane is not four straight tiles of paying out.
     */
    id: 'frr-conc-teaching', kind: 'normal', title: 'Teaching by the Hour',
    description: 'Ninety-six hours of tutorials at the university across town, arranged by a colleague who felt bad about the funding, invoiced in March and paid in November.',
    effect: { type: 'gainMoney', amount: 4_000, reason: 'Hours taught across town' },
    tone: 'blue', icon: 'space:campus-job',
  },
  {
    /*
     * A flat grant rather than a LIFE tile, and the reason is measured — see
     * the USA board's Grant Award tile. A LIFE tile is variance, and every
     * tile on this lane is variance charged to one side of the opening fork.
     */
    id: 'frr-conc-starter-grant', kind: 'normal', title: 'The Regional Grant',
    description: 'The region funds young researchers, on the third attempt, for two years. It is not a lot of money. It is the first money that was yours because of an idea you had.',
    effect: { type: 'gainMoney', amount: 3_000, reason: 'A grant in your own name' },
    tone: 'blue', icon: 'space:scholarship-win',
  },
  {
    /*
     * **The concours, first sitting** — and the second of this board's two
     * deliberate divergences from the USA skeleton.
     *
     * That board's fifth grad-school tile is The Defence, awarding the
     * doctorate; this board awarded it years ago on the opening lane, so the
     * slot is free for the thing that actually decides a French academic
     * career. It is a `careerChange` carrying `passSpin` — a gate, not a fair
     * (see `SpaceEffect`): on a five or a six a permanent post is yours, and
     * on the other four faces the list goes up without your name on it and
     * absolutely nothing else changes.
     *
     * `pool: 'doctorate'` because the posts it deals are the fonctionnaire
     * shelf and nothing else — no other tile on this board names that shelf,
     * which is what makes the competition the only door to it.
     *
     * And no `startsOver`, deliberately, on the one tile where the Japan
     * board would have written it. A concours reckons the years: eight years
     * of contracts, two countries and a hundred and ninety-two teaching hours
     * a year are counted into the grade you are appointed at. The offer is
     * therefore dealt at the rung already reached, exactly as every other
     * redraw on this board deals it — and that was not only a fact about
     * France, it was the measurement: appointing everybody at the door made
     * clearing the gate a pay cut for anybody who had climbed, and a
     * competition you are sorry to win is a badly written tile.
     */
    id: 'frr-conc-first-sitting', kind: 'event', title: 'The Concours',
    description: 'One national competition, sat in the spring. Eleven posts in your section this year, and roughly two hundred people qualified to want them. Two of the eleven would suit you.',
    effect: {
      type: 'careerChange',
      reason: 'The competition, first sitting',
      compulsory: true,
      pool: 'doctorate',
      passSpin: 5,
    },
    tone: 'blue', icon: 'space:big-promotion',
  },
  {
    /*
     * **The second sitting**, and the attempt limit.
     *
     * Mechanically this is the same tile again, which is exactly what the
     * second year is: the same file, updated, sat by the same person, in
     * front of a panel with one different member. Two is the whole allowance
     * — the concept document says two or three, and two is what the lane has
     * room for on a skeleton nobody is allowed to lengthen — and after it the
     * road simply ends, one tile in front of a layoff notice and two in front
     * of the industry fair.
     *
     * It shares the USA board's slot with a compulsory `careerChange` and is
     * therefore *not* a divergence: same kind, same effect type, same
     * `compulsory`. What it adds is the bar.
     */
    id: 'frr-conc-second-sitting', kind: 'event', title: 'The Second Sitting',
    description: 'The same file, a year older, and a panel with one new member on it. After this one the age written quietly into every shortlist starts working against you.',
    effect: {
      type: 'careerChange',
      reason: 'The competition, second sitting',
      compulsory: true,
      pool: 'doctorate',
      passSpin: 5,
    },
    tone: 'gold', icon: 'space:grad-job-fair',
  },
]

/**
 * The Engineer's Post: the road for everybody the concours is not for, and
 * for everybody it is for who was sent the other way by the die.
 *
 * Three tiles against the concours road's six, and one of them is a payday.
 * That ratio is the argument in miniature: this side is shorter, it is
 * earning, and it reaches the rest of the board sooner. It is not a
 * consolation prize either — the research engineers who keep the platforms
 * true and the instruments honest are half of what French research actually
 * is, and nobody is ever going to ask them to sit a competition for it.
 */
const THE_ENGINEERS_POST: readonly SpaceContent[] = [
  flavour('frr-eng-steady', 'A Steady Year', 'No competition, no file, no deadline in October, and a quiet competence that four different groups have started to rely on.', 'orange', 'space:steady-hustle'),
  payday('frr-eng-payday', 'A transfer lands while somebody you know is filling in the fourteenth page of an application form.'),
  {
    id: 'frr-eng-course', kind: 'normal', title: 'The Evening Diploma',
    description: 'One evening a week for a year at the conservatory of arts and crafts, no thesis at the end of it, and a statistics diploma that turns out to be worth having anyway.',
    effect: { type: 'payMoney', amount: 6_000, reason: 'Evening course fees' },
    // Fees, not wages. The campus-job coin belongs to the tiles that pay.
    tone: 'orange', icon: 'space:tuition-bill',
  },
]

/**
 * The Boulevard after the gate: the two ways to lose a post, and the one way
 * back.
 *
 * Both roads out of the junction rejoin here, and that is the right way round
 * — a permanent post is not a shield against everything, it is a shield
 * against exactly this, and the board should make the difference visible by
 * walking everybody past the same two tiles. Somebody on a contract loses it
 * here. Somebody who cleared the concours reads the notice, feels the
 * particular guilt of the person it cannot touch, and goes back to work.
 *
 * It is also where the concours road's attempt limit is actually paid. A
 * player who sat twice and missed twice arrives on these three tiles still on
 * a contract, and the fair at the end of them deals from the cadre shelf.
 * Nobody announces that they have aged out. It simply becomes the only offer
 * on the table.
 */
const BOULEVARD_AFTER_THE_GATE: readonly SpaceContent[] = [
  {
    // Sits with the notice below immediately in front of the fair, for the
    // same reason: two ways to lose the post, one hall to fix it, and neither
    // more than a tile away from the fix.
    id: 'frr-blvd-not-renewed', kind: 'normal', title: 'Not Renewed',
    description: 'The contract everybody swore would be renewed in September is, very quietly, not renewed. The leaving card is signed by twenty-two people.',
    effect: { type: 'loseCareer', reason: 'The contract was not renewed' },
    tone: 'orange', icon: 'space:layoff-notice', appearsFrom: 'hard',
  },
  {
    // Keep this immediately in front of the fair below: the swing is only fair
    // because the way back is the very next tile.
    id: 'frr-blvd-restructuring', kind: 'normal', title: 'The Restructuring Plan',
    description: 'The group announces a plan, the works council negotiates it for four months, and at the end of the four months the site is closed anyway.',
    effect: { type: 'loseCareer', reason: 'The site was closed' },
    tone: 'orange', icon: 'space:layoff-notice',
  },
  {
    /*
     * A stop, and on every board, because it is the layoff's only way back —
     * see the USA board's Career Fair.
     *
     * `pool: 'graduate'` is the one rule written on it, and it is the
     * sentence that makes the concours mean anything: **no career fair in
     * this country can hand out a permanent state post.** Everything short of
     * one is here — the firms, the private laboratories, the contracts — and
     * a doctorate is worth the best of that, which is why the cap is the
     * contract shelf and not the cadre shelf. What is *not* here, and can
     * never be got here, is the thing the gated road exists for. A
     * fonctionnaire standing at this stand has nothing to gain and declines;
     * everybody else is hired at the grade their years have earned, because
     * in this country those years count.
     */
    id: 'frr-blvd-industry-fair', kind: 'stop', title: 'The Industry Fair',
    description: 'A hall of stands for people who did everything right in a system that has eleven posts a year. Nobody here reads a publication list, everybody here reads the diploma, and not one stand can offer a post the state has to appoint you to.',
    effect: {
      type: 'careerChange',
      reason: 'A fresh start, at the grade the years have earned',
      pool: 'graduate',
    },
    tone: 'orange', icon: 'space:career-fair-return',
  },
]

const MARRIAGE: SpaceContent = {
  id: 'frr-wedding', kind: 'event', title: 'Wedding Day',
  description: 'The town hall at eleven, a long lunch that becomes a long dinner, and a room containing both families, both supervisors, and four people who have refereed each other anonymously for years.',
  effect: { type: 'getMarried' },
  tone: 'pink', icon: 'space:wedding-day',
}

/** The Two-Body Problem: where a research life meets the rest of a life. */
const THE_TWO_BODY_PROBLEM: readonly SpaceContent[] = [
  {
    id: 'frr-family-nursery', kind: 'normal', title: 'Nursery Setup',
    description: 'You paint the small room yellow, assemble a cot at midnight, and read a booklet from the town hall that is longer than your thesis and rather better organised.',
    effect: { type: 'payMoney', amount: 2_000, reason: 'Nursery setup' },
    tone: 'purple', icon: 'space:nursery-setup',
  },
  {
    id: 'frr-family-new-baby', kind: 'event', title: 'New Baby',
    description: 'A tiny new colleague arrives three weeks before a deadline, and the deadline turns out to matter a great deal less than you had thought.',
    effect: { type: 'haveChildren', count: 1, celebrationPerPip: 600 },
    tone: 'purple', icon: 'space:new-baby',
  },
  setback('hard', 'frr-family-creche', 'The Crèche List',
    'Places are allocated by a commission in June that awards nothing for a fixed-term contract. You are nineteenth on the list, so a private place bridges the gap at private prices.',
    { type: 'payPerChild', amount: 5_000, reason: 'A private place per child' },
    'purple', 'space:nursery-setup'),
  {
    id: 'frr-family-school-year', kind: 'normal', title: 'The School Year',
    description: 'Each child needs the list: the exact exercise books, the compass, the eleven items to be covered in transparent film on the kitchen table in August.',
    effect: { type: 'payPerChild', amount: 3_000, reason: 'The school list per child' },
    tone: 'purple', icon: 'space:school-fees',
  },
  {
    id: 'frr-family-open-day', kind: 'normal', title: 'Bring Your Child to the Lab',
    description: 'Your child stands on a stool at the open day and explains liquid nitrogen to a queue of adults, loudly, mostly correctly, and with a confidence you have never once felt at a conference.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:school-play',
  },
  {
    id: 'frr-family-twins', kind: 'normal', title: 'Twins',
    description: 'The sonographer goes quiet, turns the screen round, and holds up two fingers. You are, professionally, quite good at reading images, and you had not seen it.',
    effect: { type: 'haveChildren', count: 2, celebrationPerPip: 1_100 },
    tone: 'purple', icon: 'space:second-baby',
  },
]

/** Nights at the Bench: the years given to the work, and what they came to. */
const NIGHTS_AT_THE_BENCH: readonly SpaceContent[] = [
  payday('frr-nights-payday-1', 'The hours nobody records finally show up on a payslip, as a line called something else.'),
  {
    id: 'frr-nights-the-year', kind: 'normal', title: 'The Year You Had',
    description: 'Twelve months of first trains and last trains, and a figure at the end of them that nobody in the building could have predicted in January.',
    effect: { type: 'tradeYear', reason: 'A year of first trains and last trains, and what it came to.', share: 0.5 },
    tone: 'orange', icon: 'space:overtime-shift',
  },
  setback('hard', 'frr-nights-signed-off', 'Signed Off',
    'Six weeks with a doctor\'s note, a conversation with occupational health, and a pay slip that is a great deal lighter by the time you walk back in.',
    { type: 'payMoney', amount: 12_000, reason: 'Six weeks off' },
    'orange', 'space:layoff-notice'),
  {
    id: 'frr-nights-year-end', kind: 'payday', title: 'The December Transfer',
    description: 'The year closes, the accounts close with it, and whatever this post pays lands one more time before everything is reorganised again.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', appearsFrom: 'veryHard',
  },
  {
    id: 'frr-nights-reorganisation', kind: 'normal', title: 'The Reorganisation',
    description: 'The unit is merged with two others and given a new acronym. The door says something different, and nothing else about the year is the same.',
    effect: { type: 'tradeYear', reason: 'A year decided several floors above you.', share: 0.5 },
    tone: 'orange', icon: 'space:career-fair-return', appearsFrom: 'veryHard',
  },
  {
    id: 'frr-nights-licensing', kind: 'normal', title: 'The Licensing Cheque',
    description: 'A small payment arrives from the technology transfer office, and the application on your telephone has been sending notifications with exclamation marks.',
    effect: { type: 'buyStock' },
    tone: 'orange', icon: 'finance:trading-floor',
  },
  payday('frr-nights-payday-2', 'Another month down, another transfer in, and a fortnight of it spent on one figure that is now perfect.', missedPayday(
    'hard',
    'Overheads Clawed Back',
    'Last year\'s overheads are recalculated by somebody in the administration building, and recalculated downwards.',
    6_000,
    'Overheads clawed back',
  )),
  {
    id: 'frr-nights-counter-offer', kind: 'normal', title: 'The Counter-Offer',
    description: 'You mention, lightly, at the coffee machine, that somebody else has been in touch. The director finds a bonus line before the coffee is finished.',
    effect: { type: 'payRaise' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
]

/**
 * The Funding Season: the money act, and the trunk that carries the overflow.
 *
 * Longer than the branches either side of it, and deliberately — a tile on a
 * branch costs the layout engine a column on the trunk, and a tile on a trunk
 * run costs nothing but itself. Branches are expensive and trunks are free,
 * and a hazard on the trunk is walked by everybody rather than by half the
 * table.
 */
const FUNDING_SEASON: readonly SpaceContent[] = [
  {
    id: 'frr-season-trading', kind: 'normal', title: 'The Brokerage',
    description: 'Screens everywhere, a queue of retired people at the counter, and an adviser with strong opinions about a sensor company you happen to know rather well.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'finance:trading-floor',
  },
  {
    id: 'frr-season-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Before anybody hands over a set of keys, somebody would like a word about cover — and unrolls a risk map of your commune that is thorough, recent, and quietly terrifying.',
    // No motor cover at this window: both crash tiles are behind a pawn
    // standing here, so a policy sold at this desk could never pay out.
    effect: { type: 'buyInsurance', kinds: ['home', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office',
  },
  // The only payday in this stretch too. Harshening it zeroed Very Hard's
  // income for the whole run between the marriage fork and the home-buying
  // fork, so it stays unconditional.
  payday('frr-season-payday', 'A transfer lands the week the deposit on a flat is due.'),
  {
    id: 'frr-season-joint-account', kind: 'normal', title: 'The Joint Account',
    description: 'The accounts are merged, and for the first time somebody else\'s spending is also, unavoidably, your spending. They have opinions about how much of it is books.',
    effect: { type: 'household', reason: 'The household ledger, settled up' },
    tone: 'purple', icon: 'finance:bank-visit',
  },
  {
    id: 'frr-season-thirteenth', kind: 'payday', title: 'The Thirteenth Month',
    description: 'An extra month\'s pay lands in December because a collective agreement signed before you were born says it must, and nobody has ever once complained.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season',
  },
  {
    id: 'frr-season-raise', kind: 'normal', title: 'Mid-Career Raise',
    description: 'A quiet word by the lift, a new coefficient, and a handshake with exactly the right amount of pressure in it.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk',
  },
  setback('veryHard', 'frr-season-rate-rise', 'Rate Rise',
    'The era of the cheap fixed rate ends overnight. Everything in the household is repriced by a decision taken in a building in Frankfurt.',
    { type: 'payMoney', amount: 14_000, reason: 'Rates go the wrong way' },
    'slate', 'space:market-crash'),
]

const HOME_BUYING: SpaceContent = {
  id: 'frr-notary', kind: 'stop', title: 'The Notary\'s Office',
  description: 'A showroom flat with rented furniture, then an office with a long table where a notary reads every page aloud. He asks, pleasantly, about the end date on your contract.',
  effect: { type: 'buyHouse' },
  tone: 'gold', icon: 'space:house-hunting',
}

/** The Deep-Tech Spinout: found a company on your own research, or watch one from the front row. */
const THE_SPINOUT: readonly SpaceContent[] = [
  {
    id: 'frr-spin-seed', kind: 'normal', title: 'The Seed Round',
    description: 'You put your savings into the company built on your own patent and sign eleven documents in front of the notary.',
    effect: { type: 'spinForMoney', perPip: 3_100, reason: 'The seed round' },
    tone: 'pink', icon: 'space:startup-bet',
  },
  {
    id: 'frr-spin-bad-tip', kind: 'normal', title: 'The Recommendation',
    description: 'You said, at a long lunch, in front of everybody, that the technology was sound. It is. The company is not, and you pick up the bill to make up for the volume.',
    effect: { type: 'payEach', amount: 2_000, reason: 'A recommendation you regret' },
    tone: 'pink', icon: 'space:market-crash',
  },
  {
    id: 'frr-spin-consulting', kind: 'normal', title: 'Consulting Days',
    description: 'Four firms want two days a month of exactly what you know, and are all quietly surprised you accepted the first figure. You were not.',
    effect: { type: 'collectFromEach', amount: 2_500, reason: 'Consulting days' },
    tone: 'pink', icon: 'space:poker-night',
  },
  {
    id: 'frr-spin-down-round', kind: 'normal', title: 'The Down Round',
    description: 'Anything nine years from revenue is repriced overnight, by people who have read the cap table and not the science.',
    effect: { type: 'payMoney', amount: 9_000, reason: 'The down round' },
    tone: 'pink', icon: 'space:market-crash',
  },
  setback('hard', 'frr-spin-bridge', 'The Bridge Round',
    'Six more months are needed, and the round is offered first to whoever believes in it most. That, unfortunately, is a matter of public record, and it is you.',
    { type: 'payMoney', amount: 16_000, reason: 'Bridging the company again' },
    'pink', 'space:market-crash'),
  {
    id: 'frr-spin-acquisition', kind: 'normal', title: 'The Acquisition Talk',
    description: 'A very large group has been reading your patents for two years and would like a conversation.',
    effect: { type: 'spinForMoney', perPip: 5_500, reason: 'The acquisition talk' },
    tone: 'pink', icon: 'space:lottery-ticket',
  },
  payday('frr-spin-payday', 'A salary lands while your equity is busy misbehaving.'),
  {
    id: 'frr-spin-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One handshake, one page of a shareholders\' agreement initialled in the margin, and you and the front-runner trade bank balances.',
    effect: { type: 'swapMoneyWithLeader', reason: 'A deal with the front-runner' },
    tone: 'pink', icon: 'space:rival-swap',
  },
]

/** The Livret A: nobody has ever got rich in here, or ruined. */
const THE_LIVRET_A: readonly SpaceContent[] = [
  {
    id: 'frr-livret-service-contract', kind: 'normal', title: 'The Maintenance Agreement',
    description: 'Three institutes renew the agreement in January without anybody asking them to, because the machine has not failed once since you took it on.',
    effect: { type: 'gainMoney', amount: 800, reason: 'Agreements renewed' },
    tone: 'green', icon: 'space:coupon-clipping',
  },
  payday('frr-livret-payday', 'The transfer arrives on the twenty-eighth, as it has since the year the building opened.', missedPayday(
    'veryHard',
    'Wages Withheld',
    'A cell in a spreadsheet in the administration building means this month\'s pay will arrive next month instead.',
    1_000,
    'Wages held over a month',
  )),
  setback('hard', 'frr-livret-excess', 'Policy Excess',
    'Even the careful road has a claim form on it, in triplicate, and the excess is yours to cover.',
    { type: 'payMoney', amount: 1_000, reason: 'Policy excess' },
    'green', 'finance:insurance-office'),
  {
    id: 'frr-livret-ledger', kind: 'normal', title: 'The Budget Balances',
    description: 'You keep the platform\'s accounts faithfully for a whole year, line by line, and the year ends with a surplus small enough to be believed.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'The budget balances ahead' },
    tone: 'green', icon: 'space:budget-win',
  },
  {
    id: 'frr-livret-passbook', kind: 'normal', title: 'The Old Passbook',
    description: 'A savings booklet opened for you at birth surfaces in a drawer at your parents\' house. Nobody has touched it since 1994, and the state has been paying interest on it the whole time.',
    effect: { type: 'gainMoney', amount: 1_400, reason: 'The forgotten booklet' },
    tone: 'green', icon: 'space:refund-check',
  },
  {
    id: 'frr-livret-coin-jar', kind: 'normal', title: 'The Coin Jar',
    description: 'Every two-euro coin for three years has gone into a jar on the shelf above the pH meter. Today the jar is full, and heavier than it has any right to be.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'Three years of coins' },
    tone: 'green', icon: 'space:quiet-savings',
  },
  payday('frr-livret-payday-2', 'Another twenty-eighth, another quiet transfer, and nothing at all to report at the group meeting. This is the whole idea.'),
  {
    id: 'frr-livret-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The consumables supplier posts its steady little payment, plus a shareholders\' invitation to a factory in Picardy that you are genuinely tempted by.',
    effect: { type: 'stockDividend', perShare: 2_500, reason: 'Annual dividend' },
    tone: 'green', icon: 'space:dividend-day',
  },
]

/** The Emeritus Years: the sharpest material on the board, played warm. */
const EMERITUS_YEARS: readonly SpaceContent[] = [
  {
    /*
     * The buyout, and the one question the board asks everybody. A `stop` at
     * the head of the last act, so the whole table is asked it once — and it
     * has to be here rather than further along, because what stopping
     * forfeits is exactly this run. See the USA board's The Number.
     */
    id: 'frr-emeritus-number', kind: 'stop', title: 'The Number',
    description: 'The pension simulator is explained by somebody from human resources who is younger than your longest-running experiment. The figure is real, and it is offered once.',
    effect: { type: 'retireEarly' },
    tone: 'gold', icon: 'space:retirement-fund',
  },
  {
    id: 'frr-emeritus-upgrade', kind: 'normal', title: 'Home Upgrade',
    description: 'The agent calls about something brighter and higher, and just about within reach now that the post has no end date on it.',
    effect: { type: 'upgradeHouse' },
    tone: 'slate', icon: 'space:home-upgrade',
  },
  {
    id: 'frr-emeritus-fire', kind: 'normal', title: 'The Chimney Fire',
    description: 'The old flue goes up at four in the morning and takes the roof timbers with it. The laboratory, built to a much better code, is fine.',
    effect: { type: 'payMoney', amount: 24_000, reason: 'Fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire',
  },
  setback('hard', 'frr-emeritus-parents', 'Caring for Your Parents',
    'Somebody who kept every one of your school reports now needs carrying, and the home\'s waiting list is longer than its brochure. You would never count the cost. The invoice counts it anyway.',
    { type: 'payMoney', amount: 20_000, reason: 'Caring for family' },
    'slate', 'space:family-portrait'),
  payday('frr-emeritus-payday-1', 'One of your very last transfers lands, in the same week as a proof you will not live to see cited.'),
  {
    id: 'frr-emeritus-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One final audacious arrangement over a long lunch, and the leader watches their fortune shake your hand and leave with you.',
    effect: { type: 'swapMoneyWithLeader', reason: 'The eleventh-hour swap' },
    tone: 'slate', icon: 'space:rival-swap',
  },
  {
    id: 'frr-emeritus-children', kind: 'normal', title: 'The Children Visit',
    description: 'Every grown-up child arrives for the long weekend with something from a market, and one of them has brought a paper of their own to show you.',
    effect: { type: 'collectPerChild', amount: 4_000, reason: 'A gift from each child' },
    tone: 'slate', icon: 'space:child-benefit',
  },
  {
    id: 'frr-emeritus-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'A co-author you have not spoken to in years presents your figure at a meeting you could not get the credit line to attend, and the room remembers whose it was.',
    effect: { type: 'stealLifeTile', reason: 'A figure changes hands' },
    tone: 'slate', icon: 'space:sticky-fingers',
  },
  {
    id: 'frr-emeritus-last-grade', kind: 'normal', title: 'The Exceptional Grade',
    description: 'One more step before the door, if the national committee can be persuaded that thirty years counts for something.',
    effect: { type: 'promotion', reason: 'The last commission of your life' },
    tone: 'slate', icon: 'space:big-promotion',
  },
  payday('frr-emeritus-payday-2', 'You stopped counting the transfers somewhere around the third renewal; the twenty-eighth has not.'),
  setback('veryHard', 'frr-emeritus-final-tax', 'Final Tax Bill',
    'One last envelope about eleven years of expenses and one small royalty, waiting on the desk on your final morning.',
    { type: 'payMoney', amount: 22_000, reason: 'Final tax bill' },
    'slate', 'space:tuition-bill'),
  {
    /*
     * The last year in the trade, and the board's one guaranteed word about
     * the work a player actually does. An `event`, so every seat at the table
     * gets exactly one year in their own field per game — and on this board
     * those six vignettes are the edition's own (see `tradeYearStories.ts`),
     * which is most of what a researcher will remember about playing it.
     */
    id: 'frr-emeritus-last-year', kind: 'event', title: 'The Last Seminar',
    description: 'One more year of the question you have been asking since you were twenty-four, and then the keys go back and somebody else opens the freezer. Everybody wants to know how it went.',
    effect: { type: 'tradeYear', reason: 'The last year at the bench.', share: 0.5 },
    tone: 'slate', icon: 'space:sunset-ahead',
  },
]

const RETIREMENT: SpaceContent = {
  id: 'frr-retirement', kind: 'retirement', title: 'Retirement Day',
  description: 'A speech in the seminar room, a present chosen by three people who guessed well, and the first morning in forty years with no experiment running anywhere.',
  effect: { type: 'retire' },
  tone: 'gold', icon: 'space:retirement',
}

// ---------------------------------------------------------------------------
// The route: start, five forks, five trunk runs, and retirement — the same
// grammar as every edition. The ten summaries below are the only writing on
// this board a player reads *before* deciding anything, so each one is a case
// put by somebody who believes it, with its cost admitted in the same breath.
// ---------------------------------------------------------------------------

const UNIVERSITY_BRANCH: RouteBranch = {
  identity: {
    name: 'The University',
    summary: 'Five more years for a master\'s and a thesis, on money a committee decides on in the summer — and one year in six the thesis is done inside a company that pays you to do it. At the end you are a doctor, which in this country is worth everything at one door and nothing at all at most of the others.',
  },
  spaces: [...THE_UNIVERSITY, FIRST_POST],
}

const GRANDE_ECOLE_BRANCH: RouteBranch = {
  identity: {
    name: 'The Grande École',
    summary: 'Two years of preparatory class, one competition, three years at a school whose name opens doors for forty years — and a contract signed at its own recruitment forum before you graduate. Real money from the first month, and nobody on this road ever spends an evening wondering whether to do a doctorate.',
  },
  spaces: THE_GRANDE_ECOLE,
}

const STAY_BRANCH: RouteBranch = {
  identity: {
    name: 'Stay Where You Are',
    summary: 'Stay put and let the work compound. The post above yours comes free when somebody retires, the people who decide have known your work for six years, and nobody is going to make you say what you are worth out loud.',
  },
  spaces: STAY_WHERE_YOU_ARE,
}

const MOVE_BRANCH: RouteBranch = {
  identity: {
    name: 'The Move to Industry',
    summary: 'Take the call. Real money, a contract with no end date, and a recruiter who does not ask about the papers — but does count the diploma and every year since it, so you arrive at the grade you had already reached.',
  },
  spaces: THE_MOVE_TO_INDUSTRY,
}

/**
 * The one branch on this board that names a condition, and the strictest gate
 * the engine has: the doctorate itself, not merely a degree. The summary has
 * to make the case *and* be readable by the half of the table who will never
 * be offered it — the fact that it is only ever shown to a doctor is the
 * gate's business, not the sentence's.
 */
const CONCOURS_BRANCH: RouteBranch = {
  identity: {
    name: 'The Concours',
    summary: 'Go abroad, come back, get on the national list, and then sit the competition: eleven posts, two hundred people, and a five or a six. You may sit it twice on this road. Clear it and nothing can ever take the post away; miss twice and you walk off this road at forty with a contract ending in June.',
    requires: 'doctorate',
  },
  spaces: THE_CONCOURS,
}

const ENGINEERS_BRANCH: RouteBranch = {
  identity: {
    name: 'The Engineer\'s Post',
    summary: 'Keep the post that pays every month. The title changes slowly, the work is real, half the results in the building depend on you, and nobody is ever going to ask you to sit a national competition for the right to carry on doing it.',
  },
  spaces: THE_ENGINEERS_POST,
}

const TWO_BODY_BRANCH: RouteBranch = {
  identity: {
    name: 'The Two-Body Problem',
    summary: 'A crèche commission that awards no points for a fixed-term contract, a school list to be covered in transparent film every August, and something from a market at the end of it. Far fewer paydays, and every bill arrives multiplied.',
  },
  spaces: THE_TWO_BODY_PROBLEM,
}

const NIGHTS_BRANCH: RouteBranch = {
  identity: {
    name: 'Nights at the Bench',
    summary: 'The building empties at six and you are still there at one, and you would not be anywhere else. The raises are real, the results are real, and the list of what it cost is a separate list, and it is long.',
  },
  spaces: NIGHTS_AT_THE_BENCH,
}

const SPINOUT_BRANCH: RouteBranch = {
  identity: {
    name: 'The Deep-Tech Spinout',
    summary: 'Found a company on a licence from your own laboratory and find out what the market thinks of it. Whoever is behind at the notary\'s office should be here; whoever is ahead should think hard about it.',
  },
  spaces: THE_SPINOUT,
}

const LIVRET_BRANCH: RouteBranch = {
  identity: {
    name: 'The Livret A',
    summary: 'The savings booklet somebody opened for you at birth, the maintenance agreement that renews itself, and a jar of coins above the pH meter. Nobody has ever got rich in here, or ruined — which is worth a great deal if you are already winning.',
  },
  spaces: THE_LIVRET_A,
}

export const ROUTE_RESEARCHER_FRANCE: RouteDefinition = {
  segments: [
    fork(START, UNIVERSITY_BRANCH, GRANDE_ECOLE_BRANCH),
    run('the boulevard', BOULEVARD_EARLY),
    fork(MID_CAREER_FORK, STAY_BRANCH, MOVE_BRANCH),
    run('the boulevard, after the crossroads', BOULEVARD_LATE),
    fork(CONCOURS_FORK, CONCOURS_BRANCH, ENGINEERS_BRANCH),
    run('the boulevard, after the leaving drinks', BOULEVARD_AFTER_THE_GATE),
    fork(MARRIAGE, TWO_BODY_BRANCH, NIGHTS_BRANCH),
    run('the funding season', FUNDING_SEASON),
    fork(HOME_BUYING, SPINOUT_BRANCH, LIVRET_BRANCH),
    run('the emeritus years', EMERITUS_YEARS),
  ],
  terminal: RETIREMENT,
}
