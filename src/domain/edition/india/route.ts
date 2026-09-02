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
 * The India route: the same measured skeleton, and an entirely Indian life.
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
 * The voice rule, applied on every tile below: short sentences, plain words,
 * an Indian word only where the sentence teaches it in passing (the chai,
 * the EMI, the shagun), and never in a title. The joke is the situation, not
 * the vocabulary — a reader who is not a native English speaker should get
 * the punchline as fast as a reader who is.
 */

const START: SpaceContent = {
  ...flavour('in-start', 'Start of Life', 'Your journey begins one results morning in June, marksheet in hand, with the whole neighbourhood already asking what comes next.', 'slate', 'space:start-of-life'),
  kind: 'start',
}

/**
 * College Lane: one Sunday morning of examination decides four years, and the
 * fees are due at the admission counter before anyone shows you the library.
 * The tuition stop and the loan tile carry the same measured weight as every
 * edition's — what is Indian is the coaching town, the hostel mess, and an
 * education loan the family co-signed.
 */
const COLLEGE_LANE: readonly SpaceContent[] = [
  // Has to stay the fork's first step — see usa/route.ts college-1.
  flavour('in-uni-hostel', 'The Hostel Room', 'Your first room away from home has two beds, one working fan, and a trunk under the bed packed with everything you own.', 'blue', 'space:move-in-day', {
    from: 'hard',
    description: 'Your first room away from home has two beds and one working fan — and the warden wants the caution deposit, the mess advance, and a "development fee" that is really just extra money the college keeps, and does not give back.',
    effect: { type: 'payMoney', amount: 140_000, reason: 'Deposit, mess advance and development fee' },
  }),
  {
    id: 'in-uni-admission', kind: 'event', title: 'Admission Day',
    description: 'Two years of coaching classes end in one Sunday morning: an examination hall packed with students, silent except for pencils and one invigilator\'s squeaking shoes. Your rank comes through — and the fees are due at the counter before anyone shows you the library.',
    effect: { type: 'tuition', reason: 'Admission and tuition fees' },
    tone: 'blue', icon: 'space:tuition-bill',
  },
  {
    id: 'in-uni-tuition-classes', kind: 'normal', title: 'Tuition Classes',
    description: 'You teach mathematics to school children every evening in a rented room, and the parents pay on the first without fail — this side income has been paying students\' bills for generations.',
    effect: { type: 'gainMoney', amount: 900_000, reason: 'Evening tuition classes' },
    tone: 'blue', icon: 'space:campus-job',
  },
  setback('hard', 'in-uni-credit-card', 'The Campus Credit Card',
    'The credit card a smiling agent signed you up for at the college gate has a high interest rate hidden in the small print, and this month you finally have to pay it.',
    { type: 'payMoney', amount: 30_000, reason: 'Credit card charges' },
    'blue', 'finance:bank-visit'),
  {
    id: 'in-uni-scholarship', kind: 'normal', title: 'The Merit Scholarship',
    description: 'A trust nobody had heard of awards you a real scholarship — you read the letter three times to confirm nothing is being sold — and it covers a serious chunk of the fees.',
    effect: { type: 'gainMoney', amount: 2_400_000, reason: 'Merit scholarship' },
    tone: 'blue', icon: 'space:scholarship-win',
  },
  flavour('in-uni-placement-season', 'Placement Season', 'Final year begins: one formal shirt, one borrowed tie, forty identical resumes, and an aptitude test at seven in the morning. Yours has a nice font.', 'blue', 'space:finals-week', {
    from: 'hard',
    description: 'Final year begins: the formal shirt, the plain shoes, the resume printed on the good paper, and the aptitude-test practice subscription — all, it turns out, sold separately.',
    effect: { type: 'payMoney', amount: 160_000, reason: 'The placement uniform' },
  }),
  {
    id: 'in-uni-convocation', kind: 'event', title: 'Convocation Day',
    description: 'Four years, one project report, and a rolled degree your mother will frame before the week is out. Officially a graduate.',
    effect: { type: 'graduate' },
    tone: 'blue', icon: 'space:cap-and-gown',
  },
  {
    id: 'in-uni-farewell', kind: 'normal', title: 'Hostel Checkout',
    description: 'You pack four years into two trunks and hand the room key back to the warden.',
    effect: { type: 'none' },
    tone: 'blue', icon: 'space:cap-and-gown',
  },
]

const GRAD_FAIR: SpaceContent = {
  id: 'in-campus-placement', kind: 'event', title: 'Campus Placement',
  description: 'One week of aptitude tests, group discussions, and a notice board the whole batch keeps walking past to check. Two offer letters carry your name; pick one.',
  effect: { type: 'chooseCareer', pool: 'graduate' },
  tone: 'gold', icon: 'space:grad-job-fair',
}

/**
 * Straight to Work: an uncle knows a man, the man needs hands, and you walk
 * out with a wage — two years before the students earn a thing. The rest of
 * the lane is the gamble the player asked for: a food-cart bet, a fantasy-app
 * payout, and rent that is due whatever the week did.
 */
const WORK_LANE: readonly SpaceContent[] = [
  {
    id: 'in-joining-day', kind: 'event', title: 'Joining Day',
    description: 'Your uncle knows a man, the man needs hands, and you walk out with a badge, a duty roster, and a wage — two years before the students earn a thing.',
    effect: { type: 'chooseCareer', pool: 'basic' },
    tone: 'gold', icon: 'space:first-job-fair',
  },
  {
    id: 'in-work-first-salary', kind: 'normal', title: 'First Salary',
    description: 'Your very first pay lands and feels enormous. Following custom, you buy sweets for the whole street and press the first note into your mother\'s hand, and she keeps it forever.',
    effect: { type: 'gainMoney', amount: 200_000, reason: 'First salary' },
    tone: 'orange', icon: 'space:first-paycheck',
  },
  payday('in-work-payday-1', 'A full month on the rolls, and the credit lands while your classmates are still queueing for lecture seats.', missedPayday(
    'veryHard',
    'Salary Not Yet',
    'The accountant says it is coming, the same thing he said last time, and you still need money for food.',
    90_000,
    'A month of living on nothing',
  )),
  {
    id: 'in-work-pg-room', kind: 'event', title: 'The Paying-Guest Room',
    description: 'You are earning, so you are expected to be housed: a paying-guest room with a deposit, two months\' advance, and a landlady whose house rules run to a second page.',
    effect: { type: 'payMoney', amount: 180_000, reason: 'Deposit and two months\' advance' },
    tone: 'orange', icon: 'space:rent-due', unscaled: true,
  },
  {
    id: 'in-work-first-night', kind: 'normal', title: 'First Night In',
    description: 'You unpack by the light of one bare bulb, because the tube light has not made it off the list yet.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:rent-due',
  },
  {
    id: 'in-work-uniform', kind: 'event', title: 'Uniform Deposit',
    description: 'Two uniforms, a name badge, safety shoes, and a deposit you have a feeling you will never see again.',
    effect: { type: 'payMoney', amount: 150_000, reason: 'Uniform deposit' },
    tone: 'orange', icon: 'space:rent-due', appearsFrom: 'hard',
  },
  payday('in-work-payday-2', 'Another month, another credit, and still nobody has ever asked to see a degree.', missedPayday(
    'hard',
    'Hours Cut',
    'The new duty roster goes up with your name on half as many lines as it used to carry.',
    120_000,
    'Half a month of shifts',
  )),
  payday('in-work-payday-3', 'Three paydays in, and the passbook has started to look like a habit.'),
]

/**
 * Office Road, first half: the years between the first salary and the first
 * serious question about where the salary comes from. The densest stretch of
 * recognition-comedy on the board.
 */
const OFFICE_ROAD_EARLY: readonly SpaceContent[] = [
  {
    id: 'in-main-probation', kind: 'normal', title: 'Probation Review',
    description: 'Six months in, somebody sits down opposite you with a form in triplicate and asks how you think it is going. Roll.',
    effect: { type: 'promotion', reason: 'The end of probation' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
  {
    id: 'in-main-bank', kind: 'normal', title: 'Bank Visit',
    description: 'You take a token, wait under the fan, and are sent to a second counter that sends you back to the first, warmly.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit',
  },
  {
    id: 'in-main-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'A relative who sells policies has been waiting your whole life for this conversation, and arrives with a briefcase, a laminated chart, and your date of birth already filled in.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office',
  },
  // The only payday in this stretch — see usa/route.ts main-6. Harshening it
  // zeroed every player's income for this whole run on Hard and Very Hard, so
  // it stays unconditional rather than joining every other lane's pattern of
  // harshening one of several paydays and leaving another alone.
  payday('in-main-payday-1', 'The credit lands at 9:00 on the last working day, and the message tone is the best sound of the month.'),
  {
    id: 'in-main-whatsapp-tip', kind: 'normal', title: 'The WhatsApp Tip',
    description: 'The family group forwards a ticker in a yellow box with eleven rocket emojis. The market is open until three-thirty.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'space:stock-tip',
  },
  {
    id: 'in-main-roundabout', kind: 'normal', title: 'The Roundabout',
    description: 'A merge at the roundabout, a bus that refuses to give way, and one of you gives way rather harder than intended. The bodyshop\'s estimate arrives on letterhead.',
    effect: { type: 'payMoney', amount: 900_000, reason: 'Bodyshop bill', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender',
  },
  setback('veryHard', 'in-main-pileup', 'Expressway Pileup',
    'Winter fog on the expressway, brake lights, and four cars crushed together at the toll plaza. Everyone walks away; the invoices do not.',
    { type: 'payMoney', amount: 1_600_000, reason: 'Pileup repairs', hazard: 'accident' },
    'slate', 'space:fender-bender'),
  setback('hard', 'in-main-root-canal', 'Root Canal',
    'One filling, one crown, one lecture about sweets, and an invoice that stings rather more than the drill did.',
    { type: 'payMoney', amount: 500_000, reason: 'Dental work' },
    'slate', 'space:gym-membership'),
  {
    id: 'in-main-first-rain', kind: 'normal', title: 'The First Rain',
    description: 'After two months of heat the sky finally breaks, the whole office drifts to the terrace, and somebody sends the intern for hot pakoras. Nothing else gets done today, correctly.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'slate', icon: 'space:lucky-find',
  },
]

/**
 * The mid-career crossroads: stay or go, and India is the country where each
 * side of that question has a family delegation attached. The junction halts
 * movement, as every fork must.
 */
const MID_CAREER_FORK: SpaceContent = {
  id: 'in-crossroads', kind: 'normal', title: 'Five Years In',
  description: 'Five years at the same desk, an increment letter on schedule, and a recruiter\'s message you have somehow still not deleted. The road forks here.',
  effect: { type: 'none' },
  tone: 'orange', icon: 'space:networking-night',
}

/**
 * The Permanent Post: the raise arrives because you were still there to
 * receive it. Everything on this side compounds, and everything it costs is a
 * thing the company decided on your behalf — including, twice, your city.
 */
const PERMANENT_POST_ROAD: readonly SpaceContent[] = [
  {
    id: 'in-loyal-seniority', kind: 'normal', title: 'The Seniority List',
    description: 'Nobody has left this department in a decade, so the post above yours only comes free when somebody finally retires. Roll to see whether this was the year.',
    effect: { type: 'promotion', reason: 'The post above yours came free' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
]

/**
 * The Switch: the raise arrives because you left. The hike culture is the
 * whole economy of half the country's offices — a compulsory re-draw at the
 * head, and a gap where the health cover lapses between badges.
 */
const SWITCH_ALLEY: readonly SpaceContent[] = [
  {
    id: 'in-switch-lookout', kind: 'normal', title: 'Quiet Job Search',
    description: 'You update your résumé on LinkedIn after hours and start taking calls nobody in the cubicle next door can hear.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:headhunted',
  },
  {
    id: 'in-switch-hike', kind: 'event', title: 'The Forty-Percent Hike',
    description: 'You resign with the next offer letter already in hand. HR schedules a retention call, then a second one; the counteroffer arrives exactly one day after it stopped mattering.',
    effect: { type: 'careerChange', reason: 'You named your hike elsewhere', compulsory: true },
    tone: 'orange', icon: 'space:headhunted',
  },
  {
    id: 'in-switch-joining-bonus', kind: 'payday', title: 'The Joining Bonus',
    description: 'The new firm buys out your notice period, and the transfer lands like a festival bonus you did not have to wait for.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season',
  },
]

/** Office Road, second half: the appraisal, the restructuring, and the ring. */
const OFFICE_ROAD_LATE: readonly SpaceContent[] = [
  {
    id: 'in-main-appraisal', kind: 'event', title: 'The Appraisal',
    description: 'A small meeting room, two managers with your self-review open between them, and a rating that ranks you against everyone else on the team. Roll, and hear where you land.',
    effect: { type: 'promotion', reason: 'Your appraisal came round' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
  setback('veryHard', 'in-main-tax-notice', 'The Income Tax Notice',
    'A very polite notice, a long afternoon with a shoebox of receipts and your CA, and a figure at the bottom that has clearly already been decided.',
    { type: 'payMoney', amount: 1_500_000, reason: 'Tax notice settlement' },
    'slate', 'space:refund-check'),
  {
    id: 'in-main-rolled-off', kind: 'normal', title: 'Rolled Off',
    description: 'The client project everyone swore would renew in April is, very quietly, not renewed. You are put "on the bench" — unassigned, still paid, waiting for a new project — until the company stops waiting too.',
    effect: { type: 'loseCareer', reason: 'Rolled off, then let go' },
    tone: 'orange', icon: 'space:layoff-notice', appearsFrom: 'hard',
  },
  {
    id: 'in-main-restructuring', kind: 'normal', title: 'Restructuring',
    description: 'The firm announces a "voluntary" separation scheme, and your name is on the list of volunteers.',
    effect: { type: 'loseCareer', reason: 'Volunteered, apparently' },
    tone: 'orange', icon: 'space:layoff-notice',
  },
  {
    id: 'in-main-job-portal', kind: 'stop', title: 'The Job Portal',
    description: 'You set the profile to "actively looking" at midnight, and by breakfast two firms like your CV. Pick one.',
    effect: { type: 'careerChange', reason: 'A fresh start off the portal' },
    tone: 'orange', icon: 'space:career-fair-return',
  },
  {
    id: 'in-main-diwali-hampers', kind: 'normal', title: 'The Diwali Hampers',
    description: 'Dry-fruit boxes for everyone at the table, chosen with great care from a catalogue that is mostly cashews arranged in circles.',
    effect: { type: 'payEach', amount: 80_000, reason: 'A beautifully arranged hamper each' },
    tone: 'slate', icon: 'space:surprise-bonus',
  },
]

const MARRIAGE: SpaceContent = {
  id: 'in-wedding', kind: 'event', title: 'The Wedding',
  description: 'Three days, five functions, a white horse, a brass band, and every guest hands over a decorated envelope whose sum ends, by strict custom, in a single extra rupee.',
  effect: { type: 'getMarried' },
  tone: 'pink', icon: 'space:wedding-day',
}

/** Family Lane: the beats every Indian parent knows, in order of arrival. */
const FAMILY_LANE: readonly SpaceContent[] = [
  {
    id: 'in-family-nursery-setup', kind: 'normal', title: 'The Nursery',
    description: 'You paint the nursery a cheerful yellow and assemble a cot at midnight, while both grandmothers\' advice arrives faster than the baby.',
    effect: { type: 'payMoney', amount: 200_000, reason: 'Nursery setup' },
    tone: 'purple', icon: 'space:nursery-setup',
  },
  {
    id: 'in-family-new-baby', kind: 'event', title: 'New Baby',
    description: 'A tiny new roommate arrives, and so does the entire extended family, with sweets, opinions, and a naming ceremony that requires a hall.',
    effect: { type: 'haveChildren', count: 1, celebrationPerPip: 60_000 },
    tone: 'purple', icon: 'space:new-baby',
  },
  setback('hard', 'in-family-admission', 'The School Admission',
    'The "good school" interviews the parents, not the child. You pass the interview — and then the fee structure, printed on the back, empties your bank account.',
    { type: 'payPerChild', amount: 500_000, reason: 'School fees per child' },
    'purple', 'space:nursery-setup'),
  {
    id: 'in-family-school-list', kind: 'normal', title: 'The School List',
    description: 'Each child needs the uniform from one specific shop, the books from another, and forty-one items labelled by hand before Tuesday. The school bag costs more than your first phone and will outlast it.',
    effect: { type: 'payPerChild', amount: 300_000, reason: 'Uniforms and books per child' },
    tone: 'purple', icon: 'space:school-fees',
  },
  {
    id: 'in-family-sports-day', kind: 'normal', title: 'Sports Day',
    description: 'Your child\'s house wins the relay. You filmed the wrong child in the identical uniform for most of it, but the cheering was real.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:school-play',
  },
  {
    id: 'in-family-twins', kind: 'normal', title: 'Twins',
    description: 'The technician goes quiet at the scan, turns the screen around, and holds up two fingers.',
    effect: { type: 'haveChildren', count: 2, celebrationPerPip: 110_000 },
    tone: 'purple', icon: 'space:second-baby',
  },
]

/** Career Track: the hours are real and so are the raises. */
const CAREER_TRACK: readonly SpaceContent[] = [
  payday('in-fast-payday-1', 'The late nights finally show up on the pay slip.'),
  {
    id: 'in-fast-headhunted', kind: 'normal', title: 'Headhunted',
    description: 'A recruiter calls your personal number during the morning stand-up, with two offers and no patience.',
    effect: { type: 'careerChange', reason: 'Headhunted for something new' },
    tone: 'orange', icon: 'space:headhunted',
  },
  setback('hard', 'in-fast-burnout', 'Burnout Leave',
    'Six weeks signed off with a doctor\'s certificate, and the pay slip is a great deal lighter by the time you badge back in.',
    { type: 'payMoney', amount: 1_200_000, reason: 'Unpaid leave' },
    'orange', 'space:steady-hustle'),
  {
    id: 'in-fast-payday-severance', kind: 'payday', title: 'Year-End Payroll',
    description: 'The financial year closes out, and whatever this job pays lands in your account one more time before the org chart is redrawn.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', appearsFrom: 'veryHard',
  },
  {
    id: 'in-fast-reorg', kind: 'normal', title: 'The Reorganisation',
    description: 'The org chart is redrawn overnight and your name turns up in a different box entirely. Nobody asked, which is what a reorganisation is.',
    effect: { type: 'careerChange', reason: 'Reorganised into a new role', compulsory: true },
    tone: 'orange', icon: 'space:career-fair-return', appearsFrom: 'veryHard',
  },
  {
    id: 'in-fast-trading-app', kind: 'normal', title: 'The Trading App',
    description: 'You are itching to spend the bonus, and the app has been sending notifications with rocket emojis.',
    effect: { type: 'buyStock' },
    tone: 'orange', icon: 'finance:trading-floor',
  },
  payday('in-fast-payday-2', 'Another month down, another credit in.', missedPayday(
    'hard',
    'Variable Clawback',
    'Last year\'s variable is reassessed by somebody in another time zone, and reassessed downwards.',
    600_000,
    'Variable pay clawed back',
  )),
  {
    id: 'in-fast-counteroffer', kind: 'normal', title: 'The Counteroffer',
    description: 'You mention, lightly, over chai, that somebody else has been in touch. The counteroffer arrives before the chai does.',
    effect: { type: 'payRaise' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
]

/**
 * Midtown: the money act. The insurance office sells what India actually
 * fears, the household tiles learn about the joint account, and the trunk
 * carries the hazards so that everybody — not half the table — walks them.
 */
const MIDTOWN: readonly SpaceContent[] = [
  {
    id: 'in-midtown-brokerage', kind: 'normal', title: 'The Brokerage',
    description: 'You finally open the demat account, under the supervision of an uncle who has beaten the market every year, in stories.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'finance:trading-floor',
  },
  {
    id: 'in-midtown-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Before anyone hands you a set of house keys, someone would like a word about cover — and unrolls a flood map of your neighbourhood that is thorough, recent, and quietly terrifying.',
    // No auto cover at this window: both crash tiles are behind a pawn
    // standing here, so a policy sold at this desk could never pay out.
    // The broker sells what this stretch of road can actually bill for.
    effect: { type: 'buyInsurance', kinds: ['home', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office',
  },
  // The only payday in this stretch too — see in-main-payday-1. Harshening it
  // zeroed Very Hard's income for the whole run between the marriage fork and
  // the home-buying fork, so it stays unconditional.
  payday('in-midtown-payday', 'A credit lands the week the booking amount on a flat is due.'),
  {
    id: 'in-midtown-joint-account', kind: 'normal', title: 'The Joint Account',
    description: 'The salaries are merged, and yours now arrives in a shared account from which a fixed sum returns to you, titled, in the family ledger, "pocket money".',
    effect: { type: 'household', reason: 'The household ledger, settled up' },
    tone: 'purple', icon: 'finance:bank-visit',
  },
  {
    id: 'in-midtown-festival-bonus', kind: 'payday', title: 'The Festival Bonus',
    description: 'The Diwali credit lands, sized in months of what you earn rather than what anybody promised, and every one of you gets a different number.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season',
  },
  {
    id: 'in-midtown-raise', kind: 'normal', title: 'Mid-Career Raise',
    description: 'A quiet word by the lift, a new number, and a handshake of exactly matched firmness on the way out.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk',
  },
  setback('veryHard', 'in-midtown-repo-rate', 'The Repo Rate',
    'The central bank moves the rate overnight, and every home-loan EMI in the household moves with it.',
    { type: 'payMoney', amount: 1_400_000, reason: 'Rates go the wrong way' },
    'slate', 'space:market-crash'),
]

const HOME_BUYING: SpaceContent = {
  id: 'in-model-flat', kind: 'stop', title: 'The Model Flat',
  description: 'A sample flat with rented furniture, a brochure full of clubhouse renders, and a salesman whose EMI plan is exactly as long as the rest of your working life.',
  effect: { type: 'buyHouse' },
  tone: 'gold', icon: 'space:house-hunting',
}

/** Dalal Street: F&O, crypto, and a man in a very good suit. */
const DALAL_STREET: readonly SpaceContent[] = [
  {
    id: 'in-risky-startup', kind: 'normal', title: 'The Startup Bet',
    description: 'You pour savings into a friend\'s Bengaluru startup and roll to see what comes back.',
    effect: { type: 'spinForMoney', perPip: 310_000, reason: 'Startup investment payout' },
    tone: 'pink', icon: 'space:startup-bet',
  },
  {
    id: 'in-risky-bad-tip', kind: 'normal', title: 'The Bad Tip',
    description: 'The "sure thing" you forwarded to three groups tanks in a week, and you buy everyone at the table dinner to make up for recommending it to so many people.',
    effect: { type: 'payEach', amount: 200_000, reason: 'The bad stock tip' },
    tone: 'pink', icon: 'space:stock-tip',
  },
  {
    id: 'in-risky-golf', kind: 'normal', title: 'Client Golf',
    description: 'Eighteen holes at the members\' club, a friendly wager on every hole, and you have been quietly playing worse than your real skill all season, just so today\'s win looks innocent.',
    effect: { type: 'collectFromEach', amount: 250_000, reason: 'Eighteen friendly wagers' },
    tone: 'pink', icon: 'space:poker-night',
  },
  {
    id: 'in-risky-crash', kind: 'normal', title: 'Market Crash',
    description: 'The index drops hard and your portfolio takes the hit. Your father mentions, again, the year one broker\'s fraud crashed the whole market.',
    effect: { type: 'payMoney', amount: 900_000, reason: 'Market crash' },
    tone: 'pink', icon: 'space:market-crash',
  },
  setback('hard', 'in-risky-second-leg', 'The Second Leg Down',
    'The index finds a lower floor than anyone believed it had, and finds it inside a single afternoon session.',
    { type: 'payMoney', amount: 1_600_000, reason: 'The market falls again' },
    'pink', 'space:market-crash'),
  {
    id: 'in-risky-lottery', kind: 'normal', title: 'The Bumper Draw',
    description: 'You queue forty minutes at the famously lucky ticket counter, because the famously lucky counter is famously lucky. Roll for what the queue was worth.',
    effect: { type: 'spinForMoney', perPip: 550_000, reason: 'The festival bumper draw' },
    tone: 'pink', icon: 'space:lottery-ticket',
  },
  payday('in-risky-payday', 'A pay credit lands while your investments are busy misbehaving.'),
  {
    id: 'in-risky-swap', kind: 'normal', title: 'The Handshake Deal',
    description: 'One handshake over one filter coffee, and you and the front-runner trade bank balances.',
    effect: { type: 'swapMoneyWithLeader', reason: 'A deal with the front-runner' },
    tone: 'pink', icon: 'space:rival-swap',
  },
]

/** Steady Street: the FD, the gold coin, and the diary of every rupee. */
const STEADY_STREET: readonly SpaceContent[] = [
  {
    id: 'in-safe-cashback', kind: 'normal', title: 'Cashback Day',
    description: 'Four payment apps, one straining phone, and a checkout moment where the accumulated cashback covers the whole basket.',
    effect: { type: 'gainMoney', amount: 80_000, reason: 'The cashback pays out' },
    tone: 'green', icon: 'space:coupon-clipping',
  },
  payday('in-safe-payday', 'The credit arrives on the last working day, as it has every month since you can remember.', missedPayday(
    'veryHard',
    'Salary Stuck',
    'A cell in a spreadsheet somewhere means this month\'s salary will arrive next month instead.',
    100_000,
    'Salary held over a month',
  )),
  setback('hard', 'in-safe-excess', 'The Policy Excess',
    'Even the careful road has a claim form on it, and the surveyor\'s report subtracts the excess in exact change.',
    { type: 'payMoney', amount: 100_000, reason: 'Policy excess' },
    'green', 'finance:insurance-office'),
  {
    id: 'in-safe-ledger', kind: 'normal', title: 'The Household Diary',
    description: 'You keep the household accounts diary faithfully for a whole year, every auto fare and every kilo of onions, and by year\'s end you have saved more than you expected.',
    effect: { type: 'gainMoney', amount: 100_000, reason: 'The diary balances ahead' },
    tone: 'green', icon: 'space:budget-win',
  },
  {
    id: 'in-safe-old-passbook', kind: 'normal', title: 'The Old Passbook',
    description: 'A childhood post-office savings book surfaces in the steel cupboard at your parents\' house, and the balance inside has been compounding patiently since primary school.',
    effect: { type: 'gainMoney', amount: 140_000, reason: 'The forgotten account' },
    tone: 'green', icon: 'space:refund-check',
  },
  {
    id: 'in-safe-gold-coins', kind: 'normal', title: 'The Gold Coin Drawer',
    description: 'Every year, on the festival day for buying gold, one small coin went into the locker. Today the jeweller weighs the drawer, and it holds more than you remembered saving.',
    effect: { type: 'gainMoney', amount: 100_000, reason: 'The coins, weighed' },
    tone: 'green', icon: 'space:quiet-savings',
  },
  payday('in-safe-payday-2', 'Another last working day, another quiet credit. This is the whole idea.'),
  {
    id: 'in-safe-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The steady half of your portfolio posts its steady little credit, plus an invitation to an annual general meeting with very good samosas.',
    effect: { type: 'stockDividend', perShare: 250_000, reason: 'Quarterly dividend' },
    tone: 'green', icon: 'space:dividend-day',
  },
]

/** Sunset Years: the sharpest material on the board, played warm. */
const SUNSET_YEARS: readonly SpaceContent[] = [
  {
    id: 'in-sunset-number', kind: 'stop', title: 'The Two-Crore Question',
    description: 'Every family WhatsApp group has forwarded the calculation of what a comfortable retirement needs, and every forward says two crore. Your own quick math runs a little higher — and the number, unfortunately, does not withdraw itself.',
    effect: { type: 'retireEarly' },
    tone: 'gold', icon: 'space:retirement-fund',
  },
  {
    id: 'in-sunset-upgrade', kind: 'normal', title: 'Home Upgrade',
    description: 'The builder calls about something brighter, higher, and just about within reach — the new tower has a floor free, and the floor has a view.',
    effect: { type: 'upgradeHouse' },
    tone: 'slate', icon: 'space:home-upgrade',
  },
  {
    id: 'in-sunset-flood', kind: 'normal', title: 'The Hundred-Year Rain',
    description: 'The hundred-year rain arrives for the third time this decade, spends one night in your ground floor, and leaves without helping to clean up.',
    effect: { type: 'payMoney', amount: 2_400_000, reason: 'Flood damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire',
  },
  setback('hard', 'in-sunset-parents', 'Caring for Your Parents',
    'Somebody who once carried you now needs carrying, and they move into the room you always meant them to have. You would never count the cost. The hospital counts it anyway.',
    { type: 'payMoney', amount: 2_000_000, reason: 'Caring for family' },
    'slate', 'space:family-portrait'),
  payday('in-sunset-payday-1', 'One of your very last pay credits lands.'),
  {
    id: 'in-sunset-swap', kind: 'normal', title: 'The Last Deal',
    description: 'One final audacious handshake over filter coffee, and the leader\'s fortune leaves the table with you instead.',
    effect: { type: 'swapMoneyWithLeader', reason: 'The eleventh-hour swap' },
    tone: 'slate', icon: 'space:rival-swap',
  },
  {
    id: 'in-sunset-children-visit', kind: 'normal', title: 'The Children Visit',
    description: 'Every grown-up child arrives with a suitcase of gifts and quietly leaves an envelope in the puja room. The one abroad wires it instead, with a phone call that runs two hours.',
    effect: { type: 'collectPerChild', amount: 400_000, reason: 'An envelope from each child' },
    tone: 'slate', icon: 'space:child-benefit',
  },
  {
    id: 'in-sunset-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'Over the good chai, you begin talking the front-runner out of their finest story.',
    effect: { type: 'stealLifeTile', reason: 'A story changes hands' },
    tone: 'slate', icon: 'space:sticky-fingers',
  },
  {
    id: 'in-sunset-last-title', kind: 'normal', title: 'One Last Title',
    description: 'One more designation before the door, if they can be persuaded. Roll, and let the last appraisal of your life decide it.',
    effect: { type: 'promotion', reason: 'The last appraisal of your life' },
    tone: 'slate', icon: 'space:big-promotion',
  },
  payday('in-sunset-payday-2', 'You stopped counting the paydays years ago; the last working day has not.'),
  setback('veryHard', 'in-sunset-final-notice', 'The Final Notice',
    'One last envelope from the tax department arrives before the office door closes behind you for good.',
    { type: 'payMoney', amount: 2_200_000, reason: 'Final tax bill' },
    'slate', 'space:refund-check'),
  flavour('in-sunset-ahead', 'Sunset Ahead', 'From the terrace, the whole neighbourhood\'s kites climb into the dusk, the way they have every winter evening you were too busy to look up.', 'slate', 'space:sunset-ahead'),
]

const RETIREMENT: SpaceContent = {
  id: 'in-retirement', kind: 'retirement', title: 'Retirement Day',
  description: 'A shawl around your shoulders, a coconut in your hands, a framed group photograph — and the first morning in forty years with nowhere to be.',
  effect: { type: 'retire' },
  tone: 'gold', icon: 'space:retirement',
}

// ---------------------------------------------------------------------------
// The route: start, four forks, four trunk runs, and retirement — the same
// grammar as every edition, with the summaries written as two uncles giving
// contradictory advice, because the argument at the table is the content.
// ---------------------------------------------------------------------------

const COLLEGE_BRANCH: RouteBranch = {
  identity: {
    name: 'The College Route',
    summary: 'Two years of coaching, one Sunday-morning exam that decides everything, and the fees up front, in full, before you have earned a rupee. What the degree buys is a placement ladder that mostly goes up — dependable, and never enormous.',
  },
  spaces: [...COLLEGE_LANE, GRAD_FAIR],
}

const WORK_BRANCH: RouteBranch = {
  identity: {
    name: 'Straight to Work',
    summary: 'An uncle knows a man, and you walk out with a wage — years before the students earn a thing. No safety net, and a trade ladder whose bottom rung is grim and whose top rung out-earns every graduate at this table.',
  },
  spaces: WORK_LANE,
}

const PERMANENT_BRANCH: RouteBranch = {
  identity: {
    name: 'The Permanent Post',
    summary: 'Stay put. The increments come by seniority, slowly and without fail, the Diwali bonus never misses, and the company remembers loyalty — usually. It also decides which city you live in.',
  },
  spaces: PERMANENT_POST_ROAD,
}

const SWITCH_BRANCH: RouteBranch = {
  identity: {
    name: 'The Switch',
    summary: 'Leave, and name your hike. Recruiters love you and HR departments keep a file — glorious if you drew badly the first time, and a real risk if you did not.',
  },
  spaces: SWITCH_ALLEY,
}

const FAMILY_BRANCH: RouteBranch = {
  identity: {
    name: 'Family Lane',
    summary: 'School lists, coaching classes, and a house full of noise, with an envelope from every grown-up child at the end. Far fewer paydays, and every bill arrives multiplied.',
  },
  spaces: FAMILY_LANE,
}

const CAREER_BRANCH: RouteBranch = {
  identity: {
    name: 'Career Track',
    summary: 'The hours are real and so are the raises, the bonuses and the cabin at the end of the corridor. So is everything else you gave up to get them.',
  },
  spaces: CAREER_TRACK,
}

const DALAL_BRANCH: RouteBranch = {
  identity: {
    name: 'Dalal Street',
    summary: 'Options, crypto, and a tip from a man in a very good suit. Whoever is behind at the model flat should be here; whoever is ahead should think hard about it.',
  },
  spaces: DALAL_STREET,
}

const STEADY_BRANCH: RouteBranch = {
  identity: {
    name: 'Steady Street',
    summary: 'The fixed deposit, the gold coin, the scratch card, the diary of every rupee. Nobody ever got rich down here, or ruined — which is worth a great deal if you are already winning.',
  },
  spaces: STEADY_STREET,
}

export const ROUTE_INDIA: RouteDefinition = {
  segments: [
    fork(START, COLLEGE_BRANCH, WORK_BRANCH),
    run('office road', OFFICE_ROAD_EARLY),
    fork(MID_CAREER_FORK, PERMANENT_BRANCH, SWITCH_BRANCH),
    run('office road, after the crossroads', OFFICE_ROAD_LATE),
    fork(MARRIAGE, FAMILY_BRANCH, CAREER_BRANCH),
    run('midtown', MIDTOWN),
    fork(HOME_BUYING, DALAL_BRANCH, STEADY_BRANCH),
    run('sunset years', SUNSET_YEARS),
  ],
  terminal: RETIREMENT,
}
