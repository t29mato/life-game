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
 * The Japan route: the same measured skeleton, and an entirely Japanese life.
 *
 * Structurally this board is the USA board, tile for tile: same tiers, same
 * stops, same hardship placements, same hazard tags, same payday count per
 * lane, every sum ×100. That is deliberate and load-bearing — the skeleton is
 * where two years of measured balance lives (the even opening fork, the
 * volatile work lane, the twice-a-game insurance payoff), and the CPU
 * scale-invariance suite proves a ×100 board plays identically. What a country
 * gets to change is everything the player actually reads: which life happens
 * on each tile, and in which words.
 *
 * The voice rule, applied on every tile below: **short sentences, plain
 * words, a Japanese word only where the sentence teaches it in passing** (the
 * tatami, the izakaya, the shaken), and never in a title. The joke is the
 * situation, not the vocabulary — a reader who is not a native English
 * speaker should get the punchline as fast as a reader who is.
 */

const START: SpaceContent = {
  ...flavour('jp-start', 'Start of Life', 'Your journey begins one April morning, wallet light, shoes new, and the whole timetable of a life posted on the wall ahead.', 'slate', 'space:start-of-life'),
  kind: 'start',
}

/**
 * University Lane: one February morning decides four years, and the bill is
 * due before the first lecture. The tuition stop and the loan tile carry the
 * same measured weight as every edition's — what is Japanese is the exam hall,
 * the six-tatami room, and a "scholarship" with excellent branding.
 */
const UNIVERSITY_LANE: readonly SpaceContent[] = [
  // Has to stay the fork's first step — see usa/route.ts college-1.
  flavour('jp-uni-move-in', 'Six-Tatami Room', 'Your first solo apartment is measured in straw mats. It holds a futon, a rice cooker, and every ambition you have.', 'blue', 'space:move-in-day', {
    from: 'hard',
    description: 'Your first solo apartment is measured in straw mats — and the landlord wants a deposit, plus a non-refundable payment called "gratitude money" for the privilege of renting to you.',
    effect: { type: 'payMoney', amount: 140_000, reason: 'Deposit and gratitude money' },
  }),
  {
    id: 'jp-uni-tuition', kind: 'event', title: 'Entrance Fees',
    description: 'One February morning decides four years: an examination hall silent except for six hundred pencils and one person coughing. You pass — and the fees are due before anyone shows you the library.',
    effect: { type: 'tuition', reason: 'University entrance and tuition' },
    tone: 'blue', icon: 'space:tuition-bill',
  },
  {
    id: 'jp-uni-konbini-shifts', kind: 'normal', title: 'Convenience Shifts',
    description: 'Night shifts at the convenience store: you can now scan, bag, brew, fry, and bow simultaneously, and the pay adds up.',
    effect: { type: 'gainMoney', amount: 900_000, reason: 'Convenience store shifts' },
    tone: 'blue', icon: 'space:campus-job',
  },
  setback('hard', 'jp-uni-phone-trap', 'The Phone Contract',
    'The phone plan you signed at nineteen had a cancellation fee buried in the fine print, and this is the month it catches up with you.',
    { type: 'payMoney', amount: 30_000, reason: 'Contract cancellation fees' },
    'blue', 'finance:bank-visit'),
  {
    id: 'jp-uni-grant', kind: 'normal', title: 'The Real Scholarship',
    description: 'A foundation grant nobody expected — you read the terms twice to confirm it is actually a gift — and it covers a serious chunk of the fees.',
    effect: { type: 'gainMoney', amount: 2_400_000, reason: 'Foundation grant' },
    tone: 'blue', icon: 'space:scholarship-win',
  },
  flavour('jp-uni-suit-season', 'Suit Season', 'Job hunting begins: one black suit, one white shirt, one approved hairstyle, and forty thousand identical portfolios. Yours has a nice font.', 'blue', 'space:finals-week', {
    from: 'hard',
    description: 'Job hunting begins: the black suit, the plain shoes, the portrait photos with the regulation half-smile — all, it turns out, sold separately.',
    effect: { type: 'payMoney', amount: 160_000, reason: 'The interview uniform' },
  }),
  {
    id: 'jp-uni-graduation', kind: 'event', title: 'Graduation Day',
    description: 'Four years, one thesis, and a diploma tube you will never open again. Officially a graduate.',
    effect: { type: 'graduate' },
    tone: 'blue', icon: 'space:cap-and-gown',
  },
  {
    id: 'jp-uni-farewell', kind: 'normal', title: 'Clearing the Dorm',
    description: 'You pack four years into two boxes and hand the room key back to the caretaker.',
    effect: { type: 'none' },
    tone: 'blue', icon: 'space:cap-and-gown',
  },
]

const GRAD_FAIR: SpaceContent = {
  id: 'jp-job-hunt', kind: 'event', title: 'The Job Hunt',
  description: 'Forty thousand of you buy the same black suit in the same week and take the same aptitude test. Two doors open.',
  effect: { type: 'chooseCareer', pool: 'graduate' },
  tone: 'gold', icon: 'space:grad-job-fair',
}

/**
 * Straight to Work: the school-mediated placement system makes this lane's
 * structural promise — hired on tile one, paid before the students have
 * unpacked — *more* true in Japan than anywhere. The rest of the lane is the
 * gamble the player asked for: a yatai bet, a prize-exchange window, and rent
 * that is due whatever the week did.
 */
const WORK_LANE: readonly SpaceContent[] = [
  {
    id: 'jp-placement-day', kind: 'event', title: 'Placement Day',
    description: 'Your school has an arrangement with a local firm, and you leave with a badge, a uniform, and a wage — two years before the students earn a thing.',
    effect: { type: 'chooseCareer', pool: 'basic' },
    tone: 'gold', icon: 'space:first-job-fair',
  },
  {
    id: 'jp-work-first-envelope', kind: 'normal', title: 'First Pay Envelope',
    description: 'Your very first pay lands and feels enormous. Following custom, you take your parents to dinner with it, and they let you pay with visible pride.',
    effect: { type: 'gainMoney', amount: 200_000, reason: 'First pay envelope' },
    footnote: 'Part of a month, not a whole one — you were placed part-way through it. The first full envelope is the next Payday square.',
    tone: 'orange', icon: 'space:first-paycheck',
  },
  payday('jp-work-payday-1', 'A full month on the books, and the deposit lands while your classmates are still queueing for lecture seats.', missedPayday(
    'veryHard',
    'Paid in Arrears',
    'Nobody mentioned that the first month is paid a month behind, and the rice cooker does not care.',
    90_000,
    'A month of living on nothing',
  )),
  {
    id: 'jp-work-moving-out', kind: 'event', title: 'Moving Out',
    description: 'You are earning, so you are expected to be housed: a deposit, a month of gratitude money that thanks the landlord for existing, and a bed you assemble yourself.',
    effect: { type: 'payMoney', amount: 180_000, reason: 'Deposit, key money and first month' },
    tone: 'orange', icon: 'space:rent-due', unscaled: true,
  },
  {
    id: 'jp-work-first-night', kind: 'normal', title: 'First Night In',
    description: 'You unpack by the light of one bare bulb, because the ceiling light still needs buying.',
    effect: { type: 'none' },
    // Nothing happens here, so it does not wear the rent arrow. See the USA
    // board's own First Night In.
    tone: 'orange', icon: 'space:move-in-day',
  },
  {
    id: 'jp-work-uniform', kind: 'event', title: 'Uniform Deposit',
    description: 'Two uniforms, a name badge, safety boots, and a deposit you have a feeling you will never see again.',
    effect: { type: 'payMoney', amount: 150_000, reason: 'Uniform deposit' },
    tone: 'orange', icon: 'space:rent-due', appearsFrom: 'hard',
  },
  payday('jp-work-payday-2', 'Another month, another envelope, and still nobody has ever asked to see a diploma.', missedPayday(
    'hard',
    'Hours Cut',
    'The new rota goes up with your name on half as many lines as it used to carry.',
    120_000,
    'Half a month of shifts',
  )),
  payday('jp-work-payday-3', 'Three paydays in, and the bank book has started to look like a habit.'),
]

/**
 * Salaryman Street, first half: the years between the first wage and the
 * first serious question about where the wage comes from. The densest stretch
 * of recognition-comedy on the board, exactly as the proposal ordered.
 */
const SALARYMAN_STREET_EARLY: readonly SpaceContent[] = [
  {
    id: 'jp-main-probation', kind: 'normal', title: 'Probation Review',
    description: 'Six months in, somebody sits down opposite you with a form to fill out in three copies and asks how you think it is going.',
    effect: { type: 'promotion', reason: 'The end of probation' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
  {
    id: 'jp-main-bank', kind: 'normal', title: 'Bank Visit',
    description: 'The teller bows at exactly the angle the manual specifies and asks, warmly, how the money is treating you.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit',
  },
  {
    id: 'jp-main-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'The broker\'s laminated flood-fire-and-earthquake map of your neighbourhood is thorough, recent, and quietly terrifying.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office',
  },
  // The only payday in this stretch — see usa/route.ts main-6. Harshening it
  // zeroed every player's income for this whole run on Hard and Very Hard, so
  // it stays unconditional rather than joining every other lane's pattern of
  // harshening one of several paydays and leaving another alone.
  payday('jp-main-payday-1', 'The deposit lands at 9:00 on the dot, because of course it does. The best notification of the week.'),
  {
    id: 'jp-main-stock-tip', kind: 'normal', title: 'Stock Tip',
    description: 'A colleague opens the trading app under the desk and swears by a ticker. The market is open until three.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'space:stock-tip',
  },
  {
    id: 'jp-main-fender-bender', kind: 'normal', title: 'Car Crash',
    description: 'A wet crossing and a car that does not stop. The other driver bows at precisely forty-five degrees; the bodyshop is less apologetic about its quote.',
    effect: { type: 'payMoney', amount: 900_000, reason: 'Bodyshop bill', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender',
  },
  setback('veryHard', 'jp-main-pileup', 'Expressway Pileup',
    'Fog on the expressway, brake lights, and four cars crushed together on the ramp. Everyone walks away; the invoices do not.',
    { type: 'payMoney', amount: 1_600_000, reason: 'Pileup repairs', hazard: 'accident' },
    'slate', 'space:fender-bender'),
  setback('hard', 'jp-main-dentist', 'Dentist Bill',
    'One filling, one silver crown, one lecture about flossing, and an invoice that stings rather more than the drill did.',
    { type: 'payMoney', amount: 500_000, reason: 'Dental work' },
    'slate', 'space:gym-membership'),
  {
    id: 'jp-main-blossom-duty', kind: 'normal', title: 'Blossom Duty',
    description: 'The cherry trees bloom for one perfect week, and you are this year\'s designated tarp-holder at six a.m., guarding an empty rectangle from other companies\' tarp-holders. Worth it.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'slate', icon: 'space:lucky-find',
  },
]

/**
 * The mid-career crossroads: stay or go, and Japan is the country where that
 * question has a name on each side. The junction halts movement, as every
 * fork must.
 */
const MID_CAREER_FORK: SpaceContent = {
  id: 'jp-crossroads', kind: 'normal', title: 'Five Years In',
  description: 'Five years at the same desk, a seniority raise on schedule, and a recruiter\'s message you have somehow still not deleted. The road forks here.',
  effect: { type: 'none' },
  tone: 'orange', icon: 'space:networking-night',
}

/**
 * Company Loyalty Road: the raise arrives because you were still there to
 * receive it. Everything on this side compounds, and everything it costs is a
 * thing the company decided on your behalf.
 */
const COMPANY_LOYALTY_ROAD: readonly SpaceContent[] = [
  {
    id: 'jp-loyal-seniority', kind: 'normal', title: 'The Seniority Ladder',
    description: 'Nobody has left this department in a decade, so the job above yours only comes free when somebody finally retires.',
    effect: { type: 'promotion', reason: 'The job above yours came free' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
]

/**
 * Job-Hopper Alley: the raise arrives because you left. Mid-career hiring
 * stopped being a scandal a generation ago, and this road is the proof — a
 * compulsory re-draw at the head, and a gap where the health insurance bill
 * finds you between badges.
 */
const JOB_HOPPER_ALLEY: readonly SpaceContent[] = [
  {
    id: 'jp-hopper-lookout', kind: 'normal', title: 'Quiet Job Search',
    description: 'You update your résumé in a manga café after hours and start taking calls nobody at the office can hear.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:headhunted',
  },
  {
    id: 'jp-hopper-move', kind: 'event', title: 'Name Your Price',
    description: 'You hand in your notice with the next offer already signed. HR looks stunned, as if you had quit on the spot; the new title arrives with a new number attached.',
    effect: { type: 'careerChange', reason: 'You named your price elsewhere', compulsory: true },
    tone: 'orange', icon: 'space:headhunted',
  },
  {
    id: 'jp-hopper-bonus', kind: 'payday', title: 'Signing Bonus',
    description: 'The new firm buys out your notice period, and the transfer lands like a bonus season you did not have to wait for.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season',
  },
]

/** Salaryman Street, second half: the review, the restructuring, and the ring. */
const SALARYMAN_STREET_LATE: readonly SpaceContent[] = [
  {
    id: 'jp-main-review', kind: 'event', title: 'The Review',
    description: 'A small meeting room, two managers with your file open between them, and one question: are you ready for the desk above yours?',
    effect: { type: 'promotion', reason: 'Your review came round' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
  setback('veryHard', 'jp-main-tax-audit', 'Tax Audit',
    'A very polite letter, a long afternoon with a shoebox of receipts, and a figure at the bottom that has clearly already been decided.',
    { type: 'payMoney', amount: 1_500_000, reason: 'Tax audit settlement' },
    // A brown envelope with a number at the bottom is a bill, and the
    // refund cheque next door on the safe road is money coming the other
    // way. One picture cannot be both.
    'slate', 'space:tuition-bill'),
  {
    id: 'jp-main-contract-ends', kind: 'normal', title: 'Contract Ends',
    description: 'The contract everyone swore blind would renew in April is, very quietly, not renewed. The farewell bouquet is lovely.',
    effect: { type: 'loseCareer', reason: 'Contract not renewed' },
    tone: 'orange', icon: 'space:layoff-notice', appearsFrom: 'hard',
  },
  {
    id: 'jp-main-restructuring', kind: 'normal', title: 'Restructuring',
    description: 'The firm announces a "voluntary" early retirement scheme, and your name is on the list of volunteers.',
    effect: { type: 'loseCareer', reason: 'Volunteered, apparently' },
    tone: 'orange', icon: 'space:layoff-notice',
  },
  {
    id: 'jp-main-midcareer-fair', kind: 'stop', title: 'Mid-Career Fair',
    description: 'A hall of booths for people who did everything right at a company that did not. Two firms like your CV.',
    effect: { type: 'careerChange', reason: 'A fresh start at the mid-career fair' },
    tone: 'orange', icon: 'space:career-fair-return',
  },
  {
    id: 'jp-main-seasonal-gifts', kind: 'normal', title: 'Seasonal Gifts',
    description: 'Summer gifts and winter gifts for everyone at the table, chosen with great care from a catalogue that is mostly ham.',
    effect: { type: 'payEach', amount: 80_000, reason: 'A beautifully wrapped ham each' },
    tone: 'slate', icon: 'space:surprise-bonus',
  },
]

const MARRIAGE: SpaceContent = {
  id: 'jp-wedding', kind: 'event', title: 'Wedding Day',
  description: 'A hotel banquet, two outfit changes, and every guest hands over a thick envelope of crisp notes — attendance is priced, and beautifully calligraphed.',
  effect: { type: 'getMarried' },
  tone: 'pink', icon: 'space:wedding-day',
}

/** Family Lane: the beats every Japanese parent knows, in order of arrival. */
const FAMILY_LANE: readonly SpaceContent[] = [
  {
    id: 'jp-family-nursery-setup', kind: 'normal', title: 'Nursery Setup',
    description: 'You paint the nursery a cheerful yellow, assemble a crib at midnight, and collect the ward office\'s handbook for new parents, which is heavier than the crib.',
    effect: { type: 'payMoney', amount: 200_000, reason: 'Nursery setup' },
    tone: 'purple', icon: 'space:nursery-setup',
  },
  {
    id: 'jp-family-new-baby', kind: 'event', title: 'New Baby',
    description: 'The spare room is painted and the crib is built. The ward office has a handbook, a nurse and a lump sum ready, and will keep them ready.',
    effect: { type: 'haveChildren', arrivals: NEW_BABY_ARRIVALS, celebrationPerChild: 250_000 },
    tone: 'purple', icon: 'space:new-baby',
  },
  setback('hard', 'jp-family-waitlist', 'The Nursery Waitlist',
    'You applied for public nursery before the baby could sit up. You are 47th in line, so a private one bridges the gap at private prices.',
    { type: 'payPerChild', amount: 500_000, reason: 'Private nursery per child' },
    'purple', 'space:nursery-setup'),
  {
    id: 'jp-family-school-bag', kind: 'normal', title: 'The School Bag',
    description: 'Each child needs the traditional leather backpack, the uniform, the gym clothes, and forty-one items labelled by hand before the first day. The backpack costs more than your first laptop and will outlast your car.',
    effect: { type: 'payPerChild', amount: 300_000, reason: 'School bag and uniforms per child' },
    tone: 'purple', icon: 'space:school-fees',
  },
  {
    id: 'jp-family-sports-day', kind: 'normal', title: 'Sports Day',
    description: 'Your child\'s class wins the giant-ball-rolling event. You filmed the wrong child for most of it, but the cheering was real.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:school-play',
  },
  {
    id: 'jp-family-twins', kind: 'normal', title: 'Twins',
    description: 'The technician goes quiet at the scan, turns the screen around, and holds up two fingers.',
    effect: { type: 'haveChildren', arrivals: TWINS_ARRIVALS, celebrationPerChild: 250_000 },
    tone: 'purple', icon: 'space:second-baby',
  },
]

/** Career Track: the overtime is real and so are the raises. */
const CAREER_TRACK: readonly SpaceContent[] = [
  payday('jp-fast-payday-1', 'Overtime finally shows up on the pay slip.'),
  {
    id: 'jp-fast-headhunted', kind: 'normal', title: 'Headhunted',
    description: 'A recruiter calls your personal phone during the morning meeting, with two offers and no patience.',
    effect: { type: 'careerChange', reason: 'Headhunted for something new' },
    tone: 'orange', icon: 'space:headhunted',
  },
  setback('hard', 'jp-fast-burnout', 'Burnout Leave',
    'Six weeks signed off with a doctor\'s note, and the pay packet is a great deal lighter by the time you bow your way back in.',
    { type: 'payMoney', amount: 1_200_000, reason: 'Unpaid leave' },
    'orange', 'space:layoff-notice'),
  {
    id: 'jp-fast-payday-severance', kind: 'payday', title: 'Year-End Payroll',
    description: 'The fiscal year closes out, and whatever this job pays lands in your account one more time before the org chart is redrawn.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', appearsFrom: 'veryHard',
  },
  {
    id: 'jp-fast-reorg', kind: 'normal', title: 'The Reorganisation',
    description: 'The org chart is redrawn overnight and your name turns up in a different box entirely. Nobody asked, which is what a reorganisation is.',
    effect: { type: 'careerChange', reason: 'Reorganised into a new role', compulsory: true },
    tone: 'orange', icon: 'space:career-fair-return', appearsFrom: 'veryHard',
  },
  {
    id: 'jp-fast-trading', kind: 'normal', title: 'Trading App',
    description: 'The bonus is burning a hole in your pocket, and the app has been sending notifications with exclamation marks.',
    effect: { type: 'buyStock' },
    tone: 'orange', icon: 'finance:trading-floor',
  },
  payday('jp-fast-payday-2', 'Another month down, another deposit in.', missedPayday(
    'hard',
    'Bonus Clawback',
    'Last year\'s bonus is reassessed by somebody in another building, and reassessed downwards.',
    600_000,
    'Bonus clawed back',
  )),
  {
    id: 'jp-fast-retention', kind: 'normal', title: 'Retention Offer',
    description: 'You mention, lightly, over tea, that somebody else has been in touch. The counter-offer arrives before the tea does.',
    effect: { type: 'payRaise' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
]

/**
 * Midtown: the money act. The insurance office sells what Japan actually
 * fears, the household tiles learn about the allowance system, and the trunk
 * carries the hazards so that everybody — not half the table — walks them.
 */
const MIDTOWN: readonly SpaceContent[] = [
  {
    id: 'jp-midtown-trading', kind: 'normal', title: 'The Brokerage',
    description: 'Screens everywhere, a queue of retirees at the counter, and a broker who insists this one is different.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'finance:trading-floor',
  },
  {
    id: 'jp-midtown-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Before anyone hands you a set of house keys, someone would like a word about cover — and unrolls a hazard map of your neighbourhood that is thorough, recent, and quietly terrifying.',
    // No auto cover at this window: both crash tiles are behind a pawn
    // standing here, so a policy sold at this desk could never pay out.
    // The broker sells what this stretch of road can actually bill for.
    effect: { type: 'buyInsurance', kinds: ['home', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office',
  },
  // The only payday in this stretch too — see jp-main-payday-1. Harshening it
  // zeroed Very Hard's income for the whole run between the marriage fork and
  // the home-buying fork, so it stays unconditional.
  payday('jp-midtown-payday', 'A deposit lands the week the deposit on an apartment is due.'),
  {
    id: 'jp-midtown-allowance', kind: 'normal', title: 'The Allowance',
    description: 'The accounts are merged. Your whole salary now goes into a shared account, and a fixed sum comes back to you each month — labelled "allowance" in the family ledger.',
    effect: { type: 'household', reason: 'The household ledger, settled up' },
    tone: 'purple', icon: 'finance:bank-visit',
  },
  /*
   * The child-mischief tile — see the USA route's own comment on
   * `midtown-phone-call` for why it is a trunk `payPerChild` rather than
   * anything new. Zero for a player with no children, by construction.
   */
  {
    id: 'jp-midtown-phone-call', kind: 'event', title: 'The Teacher Calls',
    description: 'The homeroom teacher telephones during a meeting. Your child is fine. The classroom window is not, and the school would like it settled quietly.',
    effect: { type: 'payPerChild', amount: 400_000, reason: 'Whatever they broke, per child' },
    tone: 'purple', icon: 'space:school-fees',
  },
  {
    id: 'jp-midtown-bonus', kind: 'payday', title: 'Year-End Bonus',
    description: 'The winter envelope lands, sized in months of what you earn rather than what anybody promised, and every one of you gets a different number.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season',
  },
  {
    id: 'jp-midtown-raise', kind: 'normal', title: 'Mid-Career Raise',
    description: 'A quiet word by the elevator, a new number, and a bow of exactly matched depth on the way out.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk',
  },
  setback('veryHard', 'jp-midtown-rate-rise', 'Rate Rise',
    'The era of the flat variable rate ends overnight, and every monthly figure in the household moves with it.',
    { type: 'payMoney', amount: 1_400_000, reason: 'Rates go the wrong way' },
    'slate', 'space:market-crash'),
]

const HOME_BUYING: SpaceContent = {
  id: 'jp-model-room', kind: 'stop', title: 'The Model Room',
  description: 'A showroom apartment with rented furniture, soft lighting, and a salesman whose repayment plan is exactly as long as the rest of your working life.',
  effect: { type: 'buyHouse' },
  tone: 'gold', icon: 'space:house-hunting',
}

/** Speculation Street: crypto, margin, and a man in a very good suit. */
const SPECULATION_STREET: readonly SpaceContent[] = [
  {
    id: 'jp-risky-startup', kind: 'normal', title: 'Startup Bet',
    description: 'You pour savings into a friend\'s Shibuya startup.',
    effect: { type: 'spinForMoney', perPip: 310_000, reason: 'Startup investment payout' },
    tone: 'pink', icon: 'space:startup-bet',
  },
  {
    id: 'jp-risky-bad-tip', kind: 'normal', title: 'Bad Stock Tip',
    description: 'Your "sure thing" tanks in a week, and you buy the table dinner to make up for having recommended it at volume.',
    effect: { type: 'payEach', amount: 200_000, reason: 'Bad stock tip' },
    tone: 'pink', icon: 'space:market-crash',
  },
  {
    id: 'jp-risky-golf', kind: 'normal', title: 'Client Golf',
    description: 'Eighteen holes, a friendly wager a hole, and the handicap you have quietly kept worse than it really is, all season.',
    effect: { type: 'collectFromEach', amount: 250_000, reason: 'Eighteen friendly wagers' },
    tone: 'pink', icon: 'space:poker-night',
  },
  {
    id: 'jp-risky-crash', kind: 'normal', title: 'Market Crash',
    description: 'The market dips hard and your portfolio winces. Your father mentions, again, the year the palace grounds were worth more than California.',
    effect: { type: 'payMoney', amount: 900_000, reason: 'Market crash' },
    tone: 'pink', icon: 'space:market-crash',
  },
  setback('hard', 'jp-risky-aftershock', 'Aftershock',
    'The index finds a lower floor than anyone believed it had, and finds it inside a single afternoon session.',
    { type: 'payMoney', amount: 1_600_000, reason: 'The market falls again' },
    'pink', 'space:market-crash'),
  {
    id: 'jp-risky-jumbo', kind: 'normal', title: 'The Jumbo',
    description: 'You queue forty minutes at the famously lucky lottery booth, because the famously lucky booth is famously lucky.',
    effect: { type: 'spinForMoney', perPip: 550_000, reason: 'Year-end Jumbo' },
    tone: 'pink', icon: 'space:lottery-ticket',
  },
  payday('jp-risky-payday', 'A pay packet lands while your investments are busy misbehaving.'),
  {
    id: 'jp-risky-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One handshake, one seal pressed onto one document, and you and the front-runner trade bank balances.',
    effect: { type: 'swapMoneyWithLeader', reason: 'A deal with the front-runner' },
    tone: 'pink', icon: 'space:rival-swap',
  },
]

/** Steady Street: the point card, the coupon, the biscuit tin of 500-yen coins. */
const STEADY_STREET: readonly SpaceContent[] = [
  {
    id: 'jp-safe-points', kind: 'normal', title: 'Point Card Payout',
    description: 'Thirteen loyalty cards, one straining wallet, and a checkout moment where the points cover the whole basket.',
    effect: { type: 'gainMoney', amount: 80_000, reason: 'The points pay out' },
    tone: 'green', icon: 'space:coupon-clipping',
  },
  payday('jp-safe-payday', 'The deposit arrives on the twenty-fifth, as it has every month since you can remember.', missedPayday(
    'veryHard',
    'Wages Withheld',
    'A cell in a spreadsheet somewhere means this month\'s wages will arrive next month instead.',
    100_000,
    'Wages held over a month',
  )),
  setback('hard', 'jp-safe-excess', 'Policy Excess',
    'Even the careful road has a claim form on it, and the excess is yours to cover, in exact change.',
    { type: 'payMoney', amount: 100_000, reason: 'Policy excess' },
    'green', 'finance:insurance-office'),
  {
    id: 'jp-safe-ledger', kind: 'normal', title: 'The Household Ledger',
    description: 'You keep the household accounts book faithfully for a whole year, column by column, and the book quietly wins.',
    effect: { type: 'gainMoney', amount: 100_000, reason: 'The ledger balances ahead' },
    tone: 'green', icon: 'space:budget-win',
  },
  {
    id: 'jp-safe-old-passbook', kind: 'normal', title: 'The Old Passbook',
    description: 'A childhood postal savings book surfaces in a drawer at your parents\' house, and the balance inside has been waiting patiently since primary school.',
    effect: { type: 'gainMoney', amount: 140_000, reason: 'The forgotten account' },
    tone: 'green', icon: 'space:refund-check',
  },
  {
    id: 'jp-safe-coin-tin', kind: 'normal', title: 'The Coin Tin',
    description: 'Every 500-yen coin for three years has gone into a biscuit tin. Today the tin is full, and it is heavier than it has any right to be.',
    effect: { type: 'gainMoney', amount: 100_000, reason: 'Three years of coins' },
    tone: 'green', icon: 'space:quiet-savings',
  },
  payday('jp-safe-payday-2', 'Another twenty-fifth, another quiet deposit. This is the whole idea.'),
  {
    id: 'jp-safe-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The steady half of your portfolio posts its steady little cheque, plus a shareholder gift box of very good rice.',
    effect: { type: 'stockDividend', perShare: 250_000, reason: 'Quarterly dividend' },
    tone: 'green', icon: 'space:dividend-day',
  },
]

/** Sunset Years: the sharpest material on the board, played warm. */
const SUNSET_YEARS: readonly SpaceContent[] = [
  {
    id: 'jp-sunset-number', kind: 'stop', title: 'The Twenty-Million Problem',
    description: 'A government report calculates what a comfortable retirement requires, then apologises for saying so. Your own envelope arithmetic runs a little higher — and the number does not go away on its own.',
    effect: { type: 'retireEarly' },
    tone: 'gold', icon: 'space:retirement-fund',
  },
  {
    id: 'jp-sunset-upgrade', kind: 'normal', title: 'Home Upgrade',
    description: 'The agent calls about something brighter, higher, and just about within reach — the tower has a floor free, and the floor has a view.',
    effect: { type: 'upgradeHouse' },
    tone: 'slate', icon: 'space:home-upgrade',
  },
  {
    id: 'jp-sunset-earthquake', kind: 'normal', title: 'The Earthquake',
    description: 'The big one finally introduces itself at four in the morning, drops every plate you own, and cracks the kitchen they landed in.',
    effect: { type: 'payMoney', amount: 2_400_000, reason: 'Earthquake damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire',
  },
  setback('hard', 'jp-sunset-parents', 'Caring for Your Parents',
    'Somebody who once carried you now needs carrying, and the care home\'s waitlist is longer than its brochure. You would never count the cost. The invoice counts it anyway.',
    { type: 'payMoney', amount: 2_000_000, reason: 'Caring for family' },
    'slate', 'space:family-portrait'),
  payday('jp-sunset-payday-1', 'One of your very last pay packets lands.'),
  {
    id: 'jp-sunset-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One final audacious deal over green tea, and the leader watches their fortune bow politely and leave with you.',
    effect: { type: 'swapMoneyWithLeader', reason: 'The eleventh-hour swap' },
    tone: 'slate', icon: 'space:rival-swap',
  },
  {
    id: 'jp-sunset-children-visit', kind: 'normal', title: 'The Children Visit',
    description: 'Every grown-up child arrives with fruit in a box too beautiful to open, and quietly leaves an envelope under it.',
    effect: { type: 'collectPerChild', amount: 400_000, reason: 'An envelope from each child' },
    tone: 'slate', icon: 'space:child-benefit',
  },
  {
    id: 'jp-sunset-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'Over the good tea, you begin talking the front-runner out of their finest story.',
    effect: { type: 'stealLifeTile', reason: 'A story changes hands' },
    tone: 'slate', icon: 'space:sticky-fingers',
  },
  {
    id: 'jp-sunset-last-title', kind: 'normal', title: 'One Last Title',
    description: 'One more title before the door, if they can be persuaded.',
    effect: { type: 'promotion', reason: 'The last review of your life' },
    tone: 'slate', icon: 'space:big-promotion',
  },
  payday('jp-sunset-payday-2', 'You stopped counting the paydays years ago; the twenty-fifth has not.'),
  setback('veryHard', 'jp-sunset-final-tax', 'Final Tax Bill',
    'One last envelope from the tax office arrives before the office door closes behind you for good.',
    { type: 'payMoney', amount: 2_200_000, reason: 'Final tax bill' },
    // A brown envelope with a number at the bottom is a bill, and the
    // refund cheque next door on the safe road is money coming the other
    // way. One picture cannot be both.
    'slate', 'space:tuition-bill'),
  flavour('jp-sunset-ahead', 'Sunset Ahead', 'From the train window, the mountain turns pink at dusk, the way it has every evening you were too busy to look.', 'slate', 'space:sunset-ahead'),
]

const RETIREMENT: SpaceContent = {
  id: 'jp-retirement', kind: 'retirement', title: 'Retirement Day',
  description: 'A bouquet at your desk, one deep bow to the office, and the first morning in forty years with nowhere to be.',
  effect: { type: 'retire' },
  tone: 'gold', icon: 'space:retirement',
}

// ---------------------------------------------------------------------------
// The route: start, four forks, four trunk runs, and retirement — the same
// grammar as every edition, with the summaries written as two uncles giving
// contradictory advice, because the argument at the table is the content.
// ---------------------------------------------------------------------------

const UNIVERSITY_BRANCH: RouteBranch = {
  identity: {
    name: 'University Lane',
    summary: 'Four years, one exam that decides them, and the bill up front, in full, before you have earned a yen. What the degree buys is a corporate ladder that mostly goes up — dependable, and never enormous.',
  },
  spaces: [...UNIVERSITY_LANE, GRAD_FAIR],
}

const WORK_BRANCH: RouteBranch = {
  identity: {
    name: 'Straight to Work',
    summary: 'Your school hands you to an employer before the graduates have bought their suits. Paid from day one, no safety net, and a trade ladder whose bottom rung is grim and whose top rung out-earns every graduate at this table.',
  },
  spaces: WORK_LANE,
}

const LOYALTY_BRANCH: RouteBranch = {
  identity: {
    name: 'Company Loyalty Road',
    summary: 'Stay put. The raises come by seniority, slowly and without fail, the bonus comes twice a year, and the company remembers loyalty — usually. It also decides where you live.',
  },
  spaces: COMPANY_LOYALTY_ROAD,
}

const HOPPER_BRANCH: RouteBranch = {
  identity: {
    name: 'Job-Hopper Alley',
    summary: 'Leave, and name your price. Recruiters love you and HR departments keep a file — glorious if you drew badly the first time, and a real risk if you did not.',
  },
  spaces: JOB_HOPPER_ALLEY,
}

const FAMILY_BRANCH: RouteBranch = {
  identity: {
    name: 'Family Lane',
    summary: 'School bags, cram school, and a house full of noise, with an envelope from every grown-up child at the end. Far fewer paydays, and every bill arrives multiplied.',
  },
  spaces: FAMILY_LANE,
}

const CAREER_BRANCH: RouteBranch = {
  identity: {
    name: 'Career Track',
    summary: 'The overtime is real and so are the raises, the bonuses and the long table at the end of the room. What you gave up for it is a separate list, and it is long.',
  },
  spaces: CAREER_TRACK,
}

const SPECULATION_BRANCH: RouteBranch = {
  identity: {
    name: 'Speculation Street',
    summary: 'Crypto, margin, and a tip from a man in a very good suit. Whoever is behind at the model room should be here; whoever is ahead should think hard about it.',
  },
  spaces: SPECULATION_STREET,
}

const STEADY_BRANCH: RouteBranch = {
  identity: {
    name: 'Steady Street',
    summary: 'The savings account, the point card, the coupon, the biscuit tin of 500-yen coins. Nobody ever got rich down here, or ruined — which is worth a great deal if you are already winning.',
  },
  spaces: STEADY_STREET,
}

export const ROUTE_JAPAN: RouteDefinition = {
  segments: [
    fork(START, UNIVERSITY_BRANCH, WORK_BRANCH),
    run('salaryman street', SALARYMAN_STREET_EARLY),
    fork(MID_CAREER_FORK, LOYALTY_BRANCH, HOPPER_BRANCH),
    run('salaryman street, after the crossroads', SALARYMAN_STREET_LATE),
    fork(MARRIAGE, FAMILY_BRANCH, CAREER_BRANCH),
    run('midtown', MIDTOWN),
    fork(HOME_BUYING, SPECULATION_BRANCH, STEADY_BRANCH),
    run('sunset years', SUNSET_YEARS),
  ],
  terminal: RETIREMENT,
}
