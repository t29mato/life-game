import type { RouteBranch, RouteDefinition, SpaceContent } from '../../board/route'
import {
  EVERY_BOARD,
  LONG_ONLY,
  STANDARD_UP,
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
  ...flavour(EVERY_BOARD, 'in-start', 'Start of Life', 'Your journey begins one results morning in June, marksheet in hand, with the whole neighbourhood already asking what comes next.', 'slate', 'space:start-of-life'),
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
  // EVERY_BOARD, not STANDARD_UP — see usa/route.ts college-1.
  flavour(EVERY_BOARD, 'in-uni-hostel', 'The Hostel Room', 'Your first room away from home has two beds, one working fan, and a trunk under the bed packed with everything you own.', 'blue', 'space:move-in-day', {
    from: 'hard',
    description: 'Your first room away from home has two beds and one working fan — and the warden wants the caution deposit, the mess advance, and a "development fee" that is really just extra money the college keeps, and does not give back.',
    effect: { type: 'payMoney', amount: 140_000, reason: 'Deposit, mess advance and development fee' },
  }),
  {
    id: 'in-uni-admission', kind: 'stop', title: 'Admission Day',
    description: 'Two years of coaching classes end in one Sunday morning: an examination hall packed with students, silent except for pencils and one invigilator\'s squeaking shoes. Your rank comes through — and the fees are due at the counter before anyone shows you the library.',
    effect: { type: 'tuition', reason: 'Admission and tuition fees' },
    tone: 'blue', icon: 'space:tuition-bill', tier: EVERY_BOARD,
  },
  flavour(LONG_ONLY, 'in-uni-night-study', 'Exam-Week Nights', 'Cutting chai at midnight, three highlighters, and a photocopied set of last year\'s toppers\' notes you swear you will finish before the exam does.', 'blue', 'space:late-night-study', {
    from: 'hard',
    description: 'Cutting chai at midnight, three highlighters, and a photocopy shop by the gate that charges by the page for the toppers\' notes, of which there are nine hundred pages.',
    effect: { type: 'payMoney', amount: 50_000, reason: 'Chai and photocopies' },
  }),
  setback('veryHard', STANDARD_UP, 'in-uni-laptop', 'Laptop Dies',
    'Your laptop gives up two days before the final-year project demo, and the replacement is not the one from the exchange offer.',
    { type: 'payMoney', amount: 300_000, reason: 'Emergency laptop' },
    'blue', 'space:late-night-study'),
  {
    id: 'in-uni-tuition-classes', kind: 'normal', title: 'Tuition Classes',
    description: 'You teach mathematics to school children every evening in a rented room, and the parents pay on the first without fail — this side income has been paying students\' bills for generations.',
    effect: { type: 'gainMoney', amount: 900_000, reason: 'Evening tuition classes' },
    tone: 'blue', icon: 'space:campus-job', tier: EVERY_BOARD,
  },
  setback('hard', EVERY_BOARD, 'in-uni-credit-card', 'The Campus Credit Card',
    'The credit card a smiling agent signed you up for at the college gate has a high interest rate hidden in the small print, and this month you finally have to pay it.',
    { type: 'payMoney', amount: 250_000, reason: 'Credit card charges' },
    'blue', 'finance:bank-visit'),
  flavour(LONG_ONLY, 'in-uni-fest', 'The Culture Fest', 'You join the festival committee, which is supposed to be about organising events, but is actually about arguing over sponsor banners at two in the morning.', 'blue', 'space:group-project', {
    from: 'hard',
    description: 'You join the festival committee — and when the headline sponsor withdraws a week out, the shortfall is split between exactly the people who volunteered.',
    effect: { type: 'payMoney', amount: 40_000, reason: 'The sponsor shortfall' },
  }),
  {
    id: 'in-uni-scholarship', kind: 'normal', title: 'The Merit Scholarship',
    description: 'A trust nobody had heard of awards you a real scholarship — you read the letter three times to confirm nothing is being sold — and it covers a serious chunk of the fees.',
    effect: { type: 'gainMoney', amount: 2_400_000, reason: 'Merit scholarship' },
    tone: 'blue', icon: 'space:scholarship-win', tier: STANDARD_UP,
  },
  {
    id: 'in-uni-mess-fatigue', kind: 'normal', title: 'Mess Fatigue',
    description: 'The hostel mess serves the same three dinners on rotation, and this fortnight your resistance breaks: the food-delivery app knows your room number by heart.',
    effect: { type: 'payMoney', amount: 60_000, reason: 'A fortnight of ordering in' },
    tone: 'blue', icon: 'space:grocery-run', tier: LONG_ONLY,
  },
  flavour(STANDARD_UP, 'in-uni-placement-season', 'Placement Season', 'Final year begins: one formal shirt, one borrowed tie, forty identical resumes, and an aptitude test at seven in the morning. Yours has a nice font.', 'blue', 'space:finals-week', {
    from: 'hard',
    description: 'Final year begins: the formal shirt, the plain shoes, the resume printed on the good paper, and the aptitude-test practice subscription — all, it turns out, sold separately.',
    effect: { type: 'payMoney', amount: 160_000, reason: 'The placement uniform' },
  }),
  {
    id: 'in-uni-internship', kind: 'normal', title: 'Summer Internship',
    description: 'A summer of making slide decks nobody opens ends with a stipend far more generous than the slide decks deserved.',
    effect: { type: 'gainMoney', amount: 500_000, reason: 'Internship stipend' },
    tone: 'blue', icon: 'space:new-skills', tier: LONG_ONLY,
  },
  {
    id: 'in-uni-pitch', kind: 'normal', title: 'Demo Day',
    description: 'You pitch your hostel-room idea at the campus entrepreneurship cell\'s demo day, with two angel investors in the audience — spin to see who says yes.',
    effect: { type: 'spinForMoney', perPip: 40_000, reason: 'Demo day winnings' },
    tone: 'blue', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'in-uni-exchange', kind: 'normal', title: 'The Exchange Semester',
    description: 'A semester abroad costs a fortune, and changes how you see everything — including how strange it now feels when a queue actually stays in a straight line.',
    effect: { type: 'payMoney', amount: 400_000, reason: 'Exchange semester' },
    tone: 'blue', icon: 'space:weekend-trip', tier: STANDARD_UP,
  },
  {
    id: 'in-uni-education-loan', kind: 'normal', title: 'The Education Loan',
    description: 'The loan your father co-signed against the house comes due on schedule: the EMIs start the month the convocation gown goes back.',
    effect: { type: 'payMoney', amount: 500_000, reason: 'Education loan EMIs' },
    tone: 'blue', icon: 'finance:bank-visit', tier: STANDARD_UP,
  },
  {
    id: 'in-uni-convocation', kind: 'stop', title: 'Convocation Day',
    description: 'Four years, one project report, and a rolled degree your mother will frame before the week is out. Officially a graduate.',
    effect: { type: 'graduate' },
    tone: 'blue', icon: 'space:cap-and-gown', tier: EVERY_BOARD,
  },
  {
    id: 'in-uni-farewell', kind: 'normal', title: 'Hostel Checkout',
    description: 'You pack four years into two trunks and hand the room key back to the warden.',
    effect: { type: 'none' },
    tone: 'blue', icon: 'space:cap-and-gown', tier: EVERY_BOARD,
  },
]

const GRAD_FAIR: SpaceContent = {
  id: 'in-campus-placement', kind: 'stop', title: 'Campus Placement',
  description: 'One week of aptitude tests, group discussions, and a notice board the whole batch keeps walking past to check. Two offer letters carry your name; pick one.',
  effect: { type: 'chooseCareer', pool: 'graduate' },
  tone: 'gold', icon: 'space:grad-job-fair', tier: EVERY_BOARD,
}

/**
 * Straight to Work: an uncle knows a man, the man needs hands, and by Friday
 * you have a wage — two years before the students earn a thing. The rest of
 * the lane is the gamble the player asked for: a food-cart bet, a fantasy-app
 * payout, and rent that is due whatever the week did.
 */
const WORK_LANE: readonly SpaceContent[] = [
  {
    id: 'in-joining-day', kind: 'stop', title: 'Joining Day',
    description: 'Your uncle knows a man, the man needs hands, and by Friday you have a badge, a duty roster, and a wage — two years before the students earn a thing.',
    effect: { type: 'chooseCareer', pool: 'basic' },
    tone: 'gold', icon: 'space:first-job-fair', tier: EVERY_BOARD,
  },
  {
    id: 'in-work-first-salary', kind: 'normal', title: 'First Salary',
    description: 'Your very first pay lands and feels enormous. Following custom, you buy sweets for the whole street and press the first note into your mother\'s hand, and she keeps it forever.',
    effect: { type: 'gainMoney', amount: 200_000, reason: 'First salary' },
    tone: 'orange', icon: 'space:first-paycheck', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'in-work-payday-1', 'A full month on the rolls, and the credit lands while your classmates are still queueing for lecture seats.', missedPayday(
    'veryHard',
    'Salary Next Week',
    'The accountant says next week, the same thing he said last time, and you still need money for food.',
    90_000,
    'A month of living on nothing',
  )),
  {
    id: 'in-work-pg-room', kind: 'stop', title: 'The Paying-Guest Room',
    description: 'You are earning, so you are expected to be housed: a paying-guest room with a deposit, two months\' advance, and a landlady whose house rules run to a second page.',
    effect: { type: 'payMoney', amount: 180_000, reason: 'Deposit and two months\' advance' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD, unscaled: true,
  },
  {
    id: 'in-work-first-night', kind: 'normal', title: 'First Night In',
    description: 'You unpack by the light of one bare bulb, because the tube light is still on next week\'s list.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD,
  },
  {
    id: 'in-work-uniform', kind: 'stop', title: 'Uniform Deposit',
    description: 'Two uniforms, a name badge, safety shoes, and a deposit you have a feeling you will never see again.',
    effect: { type: 'payMoney', amount: 150_000, reason: 'Uniform deposit' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD, appearsFrom: 'hard',
  },
  {
    id: 'in-work-overtime', kind: 'normal', title: 'Overtime, Paid',
    description: 'You take the festival-week double shifts, and the overtime actually appears on the slip — a novelty you decide not to mention too loudly.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:overtime-shift', tier: STANDARD_UP,
  },
  {
    id: 'in-work-food-cart', kind: 'normal', title: 'The Food Cart Bet',
    description: 'Every rupee you have goes into a second-hand cart and a very good batter, parked outside the IT park at lunch — spin to see what the office crowd does.',
    effect: { type: 'spinForMoney', perPip: 200_000, reason: 'What the cart took' },
    tone: 'orange', icon: 'career:food-truck-owner', tier: STANDARD_UP,
  },
  setback('veryHard', STANDARD_UP, 'in-work-late-rent', 'Late Rent',
    'The rent goes in four days late, and the landlady\'s knock arrives before your apology does, with the society watchman for moral support.',
    { type: 'payMoney', amount: 250_000, reason: 'Late rent penalty' },
    'orange', 'space:rent-due'),
  payday(EVERY_BOARD, 'in-work-payday-2', 'Another month, another credit, and still nobody has ever asked to see a degree.', missedPayday(
    'hard',
    'Hours Cut',
    'The duty roster goes up on Sunday with your name on half as many lines as last week.',
    120_000,
    'Half a month of shifts',
  )),
  flavour(LONG_ONLY, 'in-work-heavy-licence', 'The Heavy-Vehicle Licence', 'A weekend course, one road test, and a licence your boss is genuinely impressed by.', 'orange', 'space:new-skills', {
    from: 'hard',
    description: 'A weekend course, one road test, and a licence your boss is genuinely impressed by — with the driving school\'s fee, and the agent who "knows the office", both yours to pay.',
    effect: { type: 'payMoney', amount: 80_000, reason: 'Course and agent fees' },
  }),
  flavour(STANDARD_UP, 'in-work-never-late', 'Never Once Late', 'You have not missed a shift or the 7:10 local in two years. The chai vendor at the station starts your glass when he sees you on the bridge, which is the local equivalent of a medal.', 'orange', 'space:steady-hustle'),
  payday(EVERY_BOARD, 'in-work-payday-3', 'Three paydays in, and the passbook has started to look like a habit.'),
  {
    id: 'in-work-wedding-gig', kind: 'normal', title: 'The Wedding Season Gig',
    description: 'Two nights hauling generators and stringing fairy lights for a wedding procession pays better than it has any right to.',
    effect: { type: 'gainMoney', amount: 90_000, reason: 'Wedding season work' },
    tone: 'orange', icon: 'space:side-hustle', tier: LONG_ONLY,
  },
  {
    id: 'in-work-fantasy-payout', kind: 'normal', title: 'The Fantasy Eleven',
    description: 'Your fantasy cricket team — captained, against all advice, by a bowler — tops the league on the final over. Spin for the payout.',
    effect: { type: 'spinForMoney', perPip: 120_000, reason: 'Fantasy league payout' },
    tone: 'orange', icon: 'space:lottery-ticket', tier: LONG_ONLY,
  },
  {
    id: 'in-work-last-mile', kind: 'normal', title: 'The Last-Mile Auto',
    description: 'The company covers the train pass. The auto-rickshaw from the station, it turns out, is not covered — that one you pay for yourself.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:car-trouble', tier: LONG_ONLY,
  },
  {
    id: 'in-work-keys', kind: 'normal', title: 'Keys to the Shop',
    description: 'Somebody has to hold the keys, open at six, and write the duty roster. Spin: it might as well be you.',
    effect: { type: 'promotion', reason: 'Somebody has to hold the keys' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: LONG_ONLY,
  },
]

/**
 * Office Road, first half: the years between the first salary and the first
 * serious question about where the salary comes from. The densest stretch of
 * recognition-comedy on the board.
 */
const OFFICE_ROAD_EARLY: readonly SpaceContent[] = [
  flavour(STANDARD_UP, 'in-main-flat-hunt', 'The Flat Hunt', 'You sign a lease on a place described as "semi-furnished", which means a geyser, one tubelight, and a nail where a previous tenant\'s calendar hung.', 'slate', 'space:apartment-hunt', {
    from: 'hard',
    description: 'You sign a lease on a place described as "semi-furnished" — and the ten-month deposit, the brokerage, and the society\'s "move-in charge" are itemised beautifully.',
    effect: { type: 'payMoney', amount: 220_000, reason: 'Deposit, brokerage and move-in charges' },
  }),
  {
    id: 'in-main-probation', kind: 'normal', title: 'Probation Review',
    description: 'Six months in, somebody sits down opposite you with a form in triplicate and asks how you think it is going. Spin.',
    effect: { type: 'promotion', reason: 'The end of probation' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'in-main-mega-sale', kind: 'normal', title: 'The Mega Sale',
    description: 'You open the shopping app for one phone cover, at midnight, during the festival sale, and forty minutes later your cart is full of things you did not need, all heavily discounted.',
    effect: { type: 'payMoney', amount: 80_000, reason: 'The sale got you' },
    tone: 'slate', icon: 'space:grocery-run', tier: LONG_ONLY,
  },
  {
    id: 'in-main-bank', kind: 'normal', title: 'Bank Visit',
    description: 'You take a token, wait under the fan, and are sent to a second counter that sends you back to the first, warmly.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit', tier: EVERY_BOARD,
  },
  {
    id: 'in-main-ca-magic', kind: 'normal', title: 'The CA\'s Magic',
    description: 'Your chartered accountant — a cousin\'s classmate, consulted over one phone call — finds deductions you did not know your own salary contained.',
    effect: { type: 'gainMoney', amount: 150_000, reason: 'Tax deductions found' },
    tone: 'slate', icon: 'space:side-hustle', tier: LONG_ONLY,
  },
  {
    id: 'in-main-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'A relative who sells policies has been waiting your whole life for this conversation, and arrives with a briefcase, a laminated chart, and your date of birth already filled in.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office', tier: EVERY_BOARD,
  },
  {
    id: 'in-main-burnout', kind: 'normal', title: 'Burnout',
    description: 'A year of eleven-thirty calls and "high-performance culture", and one Monday morning you simply cannot log in. The job does not wait.',
    effect: { type: 'loseCareer', reason: 'Signed off, and the job did not wait' },
    tone: 'orange', icon: 'space:steady-hustle', tier: STANDARD_UP,
  },
  {
    id: 'in-main-gym', kind: 'normal', title: 'Gym Membership',
    description: 'You commit to the gym above the supermarket on the first of January. You have visited twice; you paid the annual fee once, in full, on day one.',
    effect: { type: 'none' },
    tone: 'slate', icon: 'space:gym-membership', tier: LONG_ONLY,
  },
  // The only payday in this stretch — see usa/route.ts main-6. Harshening it
  // zeroed every player's income for this whole run on Hard and Very Hard, so
  // it stays unconditional rather than joining every other lane's pattern of
  // harshening one of several paydays and leaving another alone.
  payday(EVERY_BOARD, 'in-main-payday-1', 'The credit lands at 9:00 on the last working day, and the message tone is the best sound of the month.'),
  {
    id: 'in-main-whatsapp-tip', kind: 'normal', title: 'The WhatsApp Tip',
    description: 'The family group forwards a ticker in a yellow box with eleven rocket emojis. The market is open until three-thirty.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'space:stock-tip', tier: EVERY_BOARD,
  },
  {
    id: 'in-main-pothole', kind: 'normal', title: 'Pothole Season',
    description: 'The monsoon fills the road home with new potholes every night, and the scooter\'s suspension gives out. The garage bill is the scooter\'s way of complaining.',
    effect: { type: 'payMoney', amount: 120_000, reason: 'Suspension and rim repairs' },
    tone: 'slate', icon: 'space:car-trouble', tier: LONG_ONLY,
  },
  {
    id: 'in-main-goa-trip', kind: 'normal', title: 'The Goa Trip',
    description: 'The college group chat finally converts nine years of "we should go" into three days that empty your wallet and fix everything else.',
    effect: { type: 'payMoney', amount: 60_000, reason: 'The Goa trip' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'in-main-roundabout', kind: 'normal', title: 'The Roundabout Scrape',
    description: 'A gentle merge at the roundabout, a bus that refuses to give way, and both of you lean on the horn. The bodyshop\'s estimate arrives on letterhead.',
    effect: { type: 'payMoney', amount: 240_000, reason: 'Bodyshop bill', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: EVERY_BOARD,
  },
  setback('veryHard', EVERY_BOARD, 'in-main-pileup', 'Expressway Pileup',
    'Winter fog on the expressway, brake lights, and four cars crushed together at the toll plaza. Everyone walks away; the invoices do not.',
    { type: 'payMoney', amount: 1_400_000, reason: 'Pileup repairs', hazard: 'accident' },
    'slate', 'space:fender-bender'),
  setback('hard', EVERY_BOARD, 'in-main-root-canal', 'Root Canal',
    'One filling, one crown, one lecture about sweets, and an invoice that stings rather more than the drill did.',
    { type: 'payMoney', amount: 500_000, reason: 'Dental work' },
    'slate', 'space:gym-membership'),
  {
    id: 'in-main-basement-pillar', kind: 'normal', title: 'The Basement Pillar',
    description: 'The society\'s basement parking was built for smaller cars than anyone actually drives, and the pillar by your slot has never once moved.',
    effect: { type: 'payMoney', amount: 260_000, reason: 'Wing mirror and pride', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'in-main-pressure-cooker', kind: 'normal', title: 'The Pressure Cooker',
    description: 'Three whistles is the rule. You answer the doorbell during the second, and the kitchen ceiling ends up spattered with dal.',
    effect: { type: 'payMoney', amount: 600_000, reason: 'Kitchen fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'in-main-townhall-praise', kind: 'normal', title: 'The Townhall',
    description: 'Your name is read out at the quarterly townhall for last month\'s numbers, and a spot award follows the applause.',
    effect: { type: 'gainMoney', amount: 100_000, reason: 'Spot award' },
    tone: 'slate', icon: 'space:good-review', tier: LONG_ONLY,
  },
  {
    id: 'in-main-first-rain', kind: 'normal', title: 'The First Rain',
    description: 'After two months of heat the sky finally breaks, the whole office drifts to the terrace, and somebody sends the intern for hot pakoras. Nothing else gets done today, correctly.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'slate', icon: 'space:lucky-find', tier: EVERY_BOARD,
  },
]

/**
 * The mid-career crossroads: stay or go, and India is the country where each
 * side of that question has a family delegation attached. The junction halts
 * movement, as every fork must.
 */
const MID_CAREER_FORK: SpaceContent = {
  id: 'in-crossroads', kind: 'stop', title: 'Five Years In',
  description: 'Five years at the same desk, an increment letter on schedule, and a recruiter\'s message you have somehow still not deleted. The road forks here.',
  effect: { type: 'none' },
  tone: 'orange', icon: 'space:networking-night', tier: EVERY_BOARD,
}

/**
 * The Permanent Post: the raise arrives because you were still there to
 * receive it. Everything on this side compounds, and everything it costs is a
 * thing the company decided on your behalf — including, twice, your city.
 */
const PERMANENT_POST_ROAD: readonly SpaceContent[] = [
  {
    id: 'in-loyal-seniority', kind: 'normal', title: 'The Seniority List',
    description: 'Nobody has left this department in a decade, so the post above yours only comes free when somebody finally retires. Spin to see whether this was the year.',
    effect: { type: 'promotion', reason: 'The post above yours came free' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'in-loyal-diwali-bonus', kind: 'payday', title: 'The Diwali Bonus',
    description: 'Every festival season the company simply hands you an extra month, plus a box of dry fruits with the chairman\'s photograph on it.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  {
    id: 'in-loyal-transfer', kind: 'normal', title: 'The Transfer Order',
    description: 'Nagpur. The first of next month. The company decided in the last quarter; you found out on Friday. You have to leave your flat, your gym and your favourite dosa counter behind, and the packers\' truck is yours to pay for.',
    effect: { type: 'payMoney', amount: 300_000, reason: 'Relocating for the company' },
    tone: 'orange', icon: 'space:apartment-hunt', tier: STANDARD_UP,
  },
  {
    id: 'in-loyal-fog', kind: 'normal', title: 'December Fog',
    description: 'Forty minutes each way for nine years, and one December morning the fog hides the same gentle corner until it is a moment too late to react.',
    effect: { type: 'payMoney', amount: 400_000, reason: 'Commuter write-off', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'in-loyal-memento', kind: 'normal', title: 'Twenty-Five Years, One Memento',
    description: 'A silver-plated plaque, a felicitation at the annual day, and a story about the old office that everybody at the table lets you finish.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'orange', icon: 'space:lucky-find', tier: LONG_ONLY,
  },
  {
    id: 'in-loyal-collection', kind: 'normal', title: 'The Office Collection',
    description: 'You start the collection envelope for a colleague\'s wedding, which makes the shortfall at the end of it — there is always a shortfall — yours.',
    effect: { type: 'payEach', amount: 60_000, reason: 'Making up the collection' },
    tone: 'orange', icon: 'space:surprise-bonus', tier: LONG_ONLY,
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
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    id: 'in-switch-hike', kind: 'stop', title: 'The Forty-Percent Hike',
    description: 'You resign with the next offer letter already in hand. HR schedules a retention call, then a second one; the counteroffer arrives exactly one day after it stopped mattering.',
    effect: { type: 'careerChange', reason: 'You named your hike elsewhere', compulsory: true },
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    id: 'in-switch-joining-bonus', kind: 'payday', title: 'The Joining Bonus',
    description: 'The new firm buys out your notice period, and the transfer lands like a festival bonus you did not have to wait for.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: EVERY_BOARD,
  },
  {
    id: 'in-switch-gap', kind: 'normal', title: 'The Notice-Period Gap',
    description: 'Three weeks between handing back one badge and being issued the next — during which the health cover lapses, and one small fever gets billed at the hospital\'s full price, with no discount at all.',
    effect: { type: 'payMoney', amount: 300_000, reason: 'Three weeks between badges' },
    tone: 'orange', icon: 'space:rent-due', tier: STANDARD_UP,
  },
  {
    id: 'in-switch-truck', kind: 'normal', title: 'The Packers and Movers',
    description: 'You follow the truck to the new city in your own car, and scrape the roof against the society\'s gate arch — you now know its exact height.',
    effect: { type: 'payMoney', amount: 400_000, reason: 'Truck and arch repairs', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'in-switch-freelance', kind: 'normal', title: 'Consulting Rates',
    description: 'You go independent for a season, invoice by the day, and learn what the old company was quietly worth — spin for how many of the days were good ones.',
    effect: { type: 'spinForMoney', perPip: 120_000, reason: 'A season of day rates' },
    tone: 'orange', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'in-switch-farewell', kind: 'normal', title: 'The Farewell Party',
    description: 'Your third farewell of the decade. The card is enormous, the collection is generous, and nobody quite remembers your designation.',
    effect: { type: 'collectFromEach', amount: 70_000, reason: 'The farewell collection' },
    tone: 'orange', icon: 'space:poker-night', tier: LONG_ONLY,
  },
]

/** Office Road, second half: the appraisal, the restructuring, and the ring. */
const OFFICE_ROAD_LATE: readonly SpaceContent[] = [
  {
    id: 'in-main-appraisal', kind: 'stop', title: 'The Appraisal',
    description: 'A small meeting room, two managers with your self-review open between them, and a rating that ranks you against everyone else on the team. Spin, and hear where you land.',
    effect: { type: 'promotion', reason: 'Your appraisal came round' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'in-main-festival-couriers', kind: 'normal', title: 'The Festival Couriers',
    description: 'Sweet boxes couriered to relatives in three cities, each chosen to be exactly as generous as the box they will courier to you.',
    effect: { type: 'none' },
    tone: 'slate', icon: 'space:streaming-bill', tier: LONG_ONLY,
  },
  {
    id: 'in-main-increment', kind: 'normal', title: 'The Increment Letter',
    description: 'Your pay rises because another appraisal cycle has finished, not because anyone singled you out. The letter mentions "performance" once, in small print, and moves on.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk', tier: STANDARD_UP,
  },
  setback('veryHard', EVERY_BOARD, 'in-main-tax-notice', 'The Income Tax Notice',
    'A very polite notice, a long afternoon with a shoebox of receipts and your CA, and a figure at the bottom that has clearly already been decided.',
    { type: 'payMoney', amount: 1_500_000, reason: 'Tax notice settlement' },
    'slate', 'space:refund-check'),
  {
    id: 'in-main-rolled-off', kind: 'normal', title: 'Rolled Off',
    description: 'The client project everyone swore would renew in April is, very quietly, not renewed. You are put "on the bench" — unassigned, still paid, waiting for a new project — until the company stops waiting too.',
    effect: { type: 'loseCareer', reason: 'Rolled off, then let go' },
    tone: 'orange', icon: 'space:layoff-notice', tier: EVERY_BOARD, appearsFrom: 'hard',
  },
  {
    id: 'in-main-restructuring', kind: 'normal', title: 'Restructuring',
    description: 'The firm announces a "voluntary" separation scheme, and your name is on the list of volunteers.',
    effect: { type: 'loseCareer', reason: 'Volunteered, apparently' },
    tone: 'orange', icon: 'space:layoff-notice', tier: EVERY_BOARD,
  },
  {
    id: 'in-main-job-portal', kind: 'stop', title: 'The Job Portal',
    description: 'You set the profile to "actively looking" at midnight, and by breakfast two firms like your CV. Pick one.',
    effect: { type: 'careerChange', reason: 'A fresh start off the portal' },
    tone: 'orange', icon: 'space:career-fair-return', tier: EVERY_BOARD,
  },
  {
    id: 'in-main-cashback', kind: 'normal', title: 'Cashback Convergence',
    description: 'Four wallet apps, eleven scratch cards, and this is the week the cashbacks finally converge on a free mixer-grinder.',
    effect: { type: 'gainMoney', amount: 40_000, reason: 'The cashbacks converge' },
    tone: 'slate', icon: 'space:coupon-clipping', tier: LONG_ONLY,
  },
  setback('hard', LONG_ONLY, 'in-main-challan', 'The E-Challan',
    'A camera you never saw, a text message with photographic evidence, and a fine that has been compounding quietly since March.',
    { type: 'payMoney', amount: 120_000, reason: 'Traffic challan' },
    'slate', 'space:car-trouble'),
  {
    id: 'in-main-office-party', kind: 'normal', title: 'The Office Diwali Party',
    description: 'The year is officially celebrated at a banquet hall with a DJ. Someone from Accounts dances, magnificently. You are somehow the treasurer.',
    effect: { type: 'payEach', amount: 60_000, reason: 'You are somehow the treasurer' },
    tone: 'slate', icon: 'space:neighborhood-bbq', tier: LONG_ONLY,
    harsher: {
      from: 'hard',
      description: 'The year is officially celebrated at a banquet hall with a DJ — then the after-party, then the midnight biryani run, then cabs across half the city, and every receipt finds its way to the treasurer. You are somehow the treasurer.',
      effect: { type: 'payEach', amount: 120_000, reason: 'The after-party, the biryani, and the cabs' },
    },
  },
  {
    id: 'in-main-quarter-close', kind: 'normal', title: 'The March Closing',
    description: 'Six weeks of late nights before the financial year closes in March end with a pay slip you read twice.',
    effect: { type: 'gainMoney', amount: 200_000, reason: 'Year-end overtime, actually paid' },
    tone: 'slate', icon: 'space:overtime-shift', tier: LONG_ONLY,
  },
  {
    id: 'in-main-diwali-hampers', kind: 'normal', title: 'The Diwali Hampers',
    description: 'Dry-fruit boxes for everyone at the table, chosen with great care from a catalogue that is mostly cashews arranged in circles.',
    effect: { type: 'payEach', amount: 80_000, reason: 'A beautifully arranged hamper each' },
    tone: 'slate', icon: 'space:surprise-bonus', tier: EVERY_BOARD,
  },
  {
    id: 'in-main-tds-refund', kind: 'normal', title: 'The TDS Refund',
    description: 'A message from the tax department arrives — the good kind, for once — and some of the year quietly comes back.',
    effect: { type: 'gainMoney', amount: 70_000, reason: 'Tax refund' },
    tone: 'slate', icon: 'space:refund-check', tier: LONG_ONLY,
  },
  {
    id: 'in-main-variable-pay', kind: 'payday', title: 'The Variable Pay',
    description: 'The annual variable lands, sized in months of salary, and half the office is on the car showroom\'s website by lunch.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:surprise-bonus', tier: LONG_ONLY,
    harsher: missedPayday(
      'veryHard',
      'Variable Pay, Zeroed',
      'This year\'s variable arrives as a townhall about a slowing economy.',
      90_000,
      'A townhall about the slowdown',
    ),
  },
  {
    id: 'in-main-card-party', kind: 'normal', title: 'The Card Party',
    description: 'The festival card party: cushions on the floor, friendly stakes, and the exact right three cards at the exact right moment.',
    effect: { type: 'collectFromEach', amount: 50_000, reason: 'Card party winnings' },
    tone: 'slate', icon: 'space:poker-night', tier: STANDARD_UP,
  },
  flavour(LONG_ONLY, 'in-main-jewellers', 'The Jeweller\'s Window', 'You linger a little too long at the gold showroom\'s window, and somehow the whole family knows by dinner.', 'slate', 'space:ring-shopping'),
]

const MARRIAGE: SpaceContent = {
  id: 'in-wedding', kind: 'stop', title: 'The Wedding',
  description: 'Three days, five functions, a white horse, a brass band, and every guest hands over a decorated envelope whose sum ends, by strict custom, in a single extra rupee.',
  effect: { type: 'getMarried' },
  tone: 'pink', icon: 'space:wedding-day', tier: EVERY_BOARD,
}

/** Family Lane: the beats every Indian parent knows, in order of arrival. */
const FAMILY_LANE: readonly SpaceContent[] = [
  {
    id: 'in-family-nursery-setup', kind: 'normal', title: 'The Nursery',
    description: 'You paint the nursery a cheerful yellow and assemble a cot at midnight, while both grandmothers\' advice arrives faster than the baby.',
    effect: { type: 'payMoney', amount: 200_000, reason: 'Nursery setup' },
    tone: 'purple', icon: 'space:nursery-setup', tier: EVERY_BOARD,
  },
  {
    id: 'in-family-new-baby', kind: 'stop', title: 'New Baby',
    description: 'A tiny new roommate arrives, and so does the entire extended family, with sweets, opinions, and a naming ceremony that requires a hall.',
    effect: { type: 'haveChildren', count: 1, celebrationPerPip: 40_000 },
    tone: 'purple', icon: 'space:new-baby', tier: EVERY_BOARD,
  },
  {
    id: 'in-family-summer-rush', kind: 'normal', title: 'The Summer Holidays',
    description: 'The schools close, the whole country travels the same two weeks, and the hill station charges accordingly. You have a wonderful time in a queue for a viewpoint.',
    effect: { type: 'payMoney', amount: 180_000, reason: 'Holidays at peak price' },
    tone: 'purple', icon: 'space:family-vacation', tier: LONG_ONLY,
  },
  setback('hard', EVERY_BOARD, 'in-family-admission', 'The School Admission',
    'The "good school" interviews the parents, not the child. You pass the interview — and then the fee structure, printed on the back, empties your bank account.',
    { type: 'payPerChild', amount: 500_000, reason: 'School fees per child' },
    'purple', 'space:nursery-setup'),
  setback('veryHard', STANDARD_UP, 'in-family-coaching', 'Coaching Classes',
    'Every child now attends a second school that begins when the first one ends. Dinner is a tiffin eaten on the back of a scooter between the two.',
    { type: 'payPerChild', amount: 500_000, reason: 'Coaching fees per child' },
    'purple', 'space:school-fees'),
  {
    id: 'in-family-school-list', kind: 'normal', title: 'The School List',
    description: 'Each child needs the uniform from one specific shop, the books from another, and forty-one items labelled by hand before Tuesday. The school bag costs more than your first phone and will outlast it.',
    effect: { type: 'payPerChild', amount: 300_000, reason: 'Uniforms and books per child' },
    tone: 'purple', icon: 'space:school-fees', tier: EVERY_BOARD,
  },
  {
    id: 'in-family-sports-day', kind: 'normal', title: 'Sports Day',
    description: 'Your child\'s house wins the relay. You filmed the wrong child in the identical uniform for most of it, but the cheering was real.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:school-play', tier: EVERY_BOARD,
  },
  {
    id: 'in-family-hatchback', kind: 'normal', title: 'The Family Hatchback',
    description: 'Reversing out of the society gate with three children arguing in the back seat, into the one gatepost that has never once moved.',
    effect: { type: 'payMoney', amount: 320_000, reason: 'Hatchback bodywork', hazard: 'accident' },
    tone: 'purple', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'in-family-music-lessons', kind: 'normal', title: 'Music Lessons',
    description: 'The music teacher comes on Sunday mornings, and the whole building now knows the first four bars of one raga extremely well.',
    effect: { type: 'payMoney', amount: 90_000, reason: 'Music lessons' },
    tone: 'purple', icon: 'space:piano-lessons', tier: LONG_ONLY,
  },
  {
    id: 'in-family-twins', kind: 'normal', title: 'Twins',
    description: 'The technician goes quiet at the scan, turns the screen around, and holds up two fingers.',
    effect: { type: 'haveChildren', count: 2, celebrationPerPip: 70_000 },
    tone: 'purple', icon: 'space:second-baby', tier: EVERY_BOARD,
  },
  {
    id: 'in-family-first-birthday', kind: 'normal', title: 'The First Birthday',
    description: 'A hall, a caterer, a photographer, and two hundred guests for a person who sleeps through the cake. The photographs are perfect.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:soccer-season', tier: STANDARD_UP,
  },
  {
    id: 'in-family-grandparents-envelopes', kind: 'normal', title: 'The Grandparents\' Envelopes',
    description: 'Every festival, every visit, every good report card: a folded note pressed into every small hand in the house, over every small protest.',
    effect: { type: 'collectPerChild', amount: 150_000, reason: 'Festival money per child' },
    tone: 'purple', icon: 'space:child-benefit', tier: STANDARD_UP,
  },
  flavour(STANDARD_UP, 'in-family-portrait', 'The Studio Portrait', 'Everyone actually smiles at the same time — the studio frames it before you can change your mind.', 'purple', 'space:family-portrait', {
    from: 'veryHard',
    description: 'Everyone smiles at the same time exactly once, and the studio charges for the whole afternoon, the album, and the commemorative calendars for both sets of grandparents.',
    effect: { type: 'payMoney', amount: 110_000, reason: 'The full photo package' },
  }),
  payday(STANDARD_UP, 'in-family-payday', 'Payday lands somewhere between the school run and the homework hour, and is spent in roughly the same window.'),
  {
    id: 'in-family-back-to-work', kind: 'normal', title: 'Back to Work',
    description: 'You return from parental leave with new scheduling superpowers, and negotiate hard on the way back in.',
    effect: { type: 'payRaise' },
    tone: 'purple', icon: 'space:pay-raise-talk', tier: LONG_ONLY,
  },
  {
    id: 'in-family-third', kind: 'normal', title: 'Another Arrival',
    description: 'The hatchback is officially too small, and nobody minds in the slightest.',
    effect: { type: 'haveChildren', count: 1, celebrationPerPip: 40_000 },
    tone: 'purple', icon: 'space:new-baby', tier: LONG_ONLY,
  },
]

/** Career Track: the hours are real and so are the raises. */
const CAREER_TRACK: readonly SpaceContent[] = [
  {
    id: 'in-fast-shortlist', kind: 'normal', title: 'The Shortlist',
    description: 'Your name is on the shortlist for the team lead\'s post, and so are two others. Spin.',
    effect: { type: 'promotion', reason: 'On the shortlist' },
    tone: 'orange', icon: 'space:big-promotion', tier: STANDARD_UP,
  },
  {
    id: 'in-fast-referral', kind: 'normal', title: 'The Chai Break Referral',
    description: 'The conference itself was fine; the chai queue outside produces a referral worth real money.',
    effect: { type: 'gainMoney', amount: 120_000, reason: 'Referral bonus' },
    tone: 'orange', icon: 'space:networking-night', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'in-fast-payday-1', 'The late nights finally show up on the pay slip.'),
  {
    id: 'in-fast-headhunted', kind: 'normal', title: 'Headhunted',
    description: 'A recruiter calls your personal number during the Monday stand-up, with two offers and no patience.',
    effect: { type: 'careerChange', reason: 'Headhunted for something new' },
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    id: 'in-fast-client-city', kind: 'normal', title: 'The Client\'s City',
    description: 'An unfamiliar city, a rented sedan, and a flyover exit that arrives a full lane earlier than the map said.',
    effect: { type: 'payMoney', amount: 320_000, reason: 'Rental excess', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'in-fast-client-win', kind: 'normal', title: 'Client Win',
    description: 'You land the account everyone said was impossible, and the celebratory sweets reach three floors of the building.',
    effect: { type: 'gainMoney', amount: 300_000, reason: 'Client win bonus' },
    tone: 'orange', icon: 'space:client-win', tier: STANDARD_UP,
  },
  {
    id: 'in-fast-conference', kind: 'normal', title: 'Conference Talk',
    description: 'Your talk makes the rounds of the whole industry in a week, and the organisers of the next three conferences would like your calendar.',
    effect: { type: 'gainMoney', amount: 440_000, reason: 'Speaking fees' },
    tone: 'orange', icon: 'space:conference-talk', tier: STANDARD_UP,
  },
  setback('hard', EVERY_BOARD, 'in-fast-burnout', 'Burnout Leave',
    'Six weeks signed off with a doctor\'s certificate, and the pay slip is a great deal lighter by the time you badge back in.',
    { type: 'payMoney', amount: 1_200_000, reason: 'Unpaid leave' },
    'orange', 'space:steady-hustle'),
  {
    id: 'in-fast-payday-severance', kind: 'payday', title: 'Year-End Payroll',
    description: 'The financial year closes out, and whatever this job pays lands in your account one more time before the org chart is redrawn.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: EVERY_BOARD, appearsFrom: 'veryHard',
  },
  {
    id: 'in-fast-reorg', kind: 'normal', title: 'The Reorganisation',
    description: 'The org chart is redrawn overnight and your name turns up in a different box entirely. Nobody asked, which is what a reorganisation is.',
    effect: { type: 'careerChange', reason: 'Reorganised into a new role', compulsory: true },
    tone: 'orange', icon: 'space:career-fair-return', tier: EVERY_BOARD, appearsFrom: 'veryHard',
  },
  {
    id: 'in-fast-trading-app', kind: 'normal', title: 'The Trading App',
    description: 'You are itching to spend the bonus, and the app has been sending notifications with rocket emojis.',
    effect: { type: 'buyStock' },
    tone: 'orange', icon: 'finance:trading-floor', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'in-fast-payday-2', 'Another month down, another credit in.', missedPayday(
    'hard',
    'Variable Clawback',
    'Last year\'s variable is reassessed by somebody in another time zone, and reassessed downwards.',
    600_000,
    'Variable pay clawed back',
  )),
  {
    id: 'in-fast-bonus-season', kind: 'normal', title: 'Bonus Season',
    description: 'The appraisal letter is thicker than expected. You check the name at the top twice, quietly, in the corridor.',
    effect: { type: 'gainMoney', amount: 500_000, reason: 'Annual bonus' },
    tone: 'orange', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  flavour(LONG_ONLY, 'in-fast-cabin', 'The Cabin', 'You are given a cabin — but in this company, a cabin can mean you were promoted, or that you were moved somewhere quiet before being let go. You check the org chart twice before celebrating.', 'orange', 'space:corner-office', {
    from: 'hard',
    description: 'You are given a cabin — the good kind, this time — and the sofa, the plant and the second chair for visitors are, by tradition, yours to buy.',
    effect: { type: 'payMoney', amount: 180_000, reason: 'Furnishing the cabin' },
  }),
  {
    id: 'in-fast-board-seat', kind: 'normal', title: 'Board Seat',
    description: 'A chair has come free at the long table on the top floor. Spin to find out whose name ends up on the door.',
    effect: { type: 'promotion', reason: 'A chair at the long table' },
    tone: 'orange', icon: 'space:corner-office', tier: STANDARD_UP,
  },
  {
    id: 'in-fast-counteroffer', kind: 'normal', title: 'The Counteroffer',
    description: 'You mention, lightly, over chai, that somebody else has been in touch. The counteroffer arrives before the chai does.',
    effect: { type: 'payRaise' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'in-fast-esops', kind: 'normal', title: 'The ESOPs Vest',
    description: 'Four years of startup paperwork you signed without reading turn into an actual number in an actual account.',
    effect: { type: 'gainMoney', amount: 700_000, reason: 'Stock options vesting' },
    tone: 'orange', icon: 'space:bonus-season', tier: LONG_ONLY,
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
    tone: 'slate', icon: 'finance:trading-floor', tier: EVERY_BOARD,
  },
  {
    id: 'in-midtown-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'Every share you hold posts a credit — and one company adds an annual report thick enough to level the wobbling table, which is the part you tell people about.',
    effect: { type: 'stockDividend', perShare: 300_000, reason: 'Quarterly dividend' },
    tone: 'slate', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'in-midtown-team-dinner', kind: 'normal', title: 'The Team Dinner',
    description: 'The team eats out to celebrate the release. You are senior now, which means the bill quietly makes its way down the table and lands at your plate.',
    effect: { type: 'payEach', amount: 80_000, reason: 'The senior seat pays' },
    tone: 'slate', icon: 'space:neighborhood-bbq', tier: STANDARD_UP,
  },
  {
    id: 'in-midtown-geyser', kind: 'normal', title: 'The Old Geyser',
    description: 'The bathroom water heater has been humming ominously since the nineties, and tonight it retires — taking the wiring, the false ceiling and one towel rail with it.',
    effect: { type: 'payMoney', amount: 560_000, reason: 'Geyser fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'in-midtown-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Before anyone hands you a set of house keys, someone would like a word about cover — and unrolls a flood map of your neighbourhood that is thorough, recent, and quietly terrifying.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office', tier: EVERY_BOARD,
  },
  // The only payday in this stretch too — see in-main-payday-1. Harshening it
  // zeroed Very Hard's income for the whole run between the marriage fork and
  // the home-buying fork, so it stays unconditional.
  payday(EVERY_BOARD, 'in-midtown-payday', 'A credit lands the week the booking amount on a flat is due.'),
  {
    id: 'in-midtown-wiring', kind: 'normal', title: 'The Festival Wiring',
    description: 'The meter board has carried the whole building\'s fairy lights every festival since 1987. This year it finally gives out, in sparks, at two in the morning.',
    effect: { type: 'payMoney', amount: 560_000, reason: 'Electrical fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'in-midtown-nilgai', kind: 'normal', title: 'The Nilgai',
    description: 'A nilgai — a blue bull the size of a small car — steps out of the roadside scrub at dusk, considers you carefully, and walks away. The bonnet does not walk away.',
    effect: { type: 'payMoney', amount: 360_000, reason: 'Front end rebuilt', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'in-midtown-presentation', kind: 'normal', title: 'The Big Presentation',
    description: 'You present to the leadership floor and everyone in the room nods along. Spin to find out if the nodding turns into the promotion.',
    effect: { type: 'promotion', reason: 'You won the room' },
    tone: 'orange', icon: 'space:client-win', tier: STANDARD_UP,
  },
  {
    id: 'in-midtown-joint-account', kind: 'normal', title: 'The Joint Account',
    description: 'The salaries are merged, and yours now arrives in a shared account from which a fixed sum returns to you, titled, in the family ledger, "pocket money".',
    effect: { type: 'household', reason: 'The household ledger, settled up' },
    tone: 'purple', icon: 'finance:bank-visit', tier: EVERY_BOARD,
  },
  {
    id: 'in-midtown-festival-bonus', kind: 'payday', title: 'The Festival Bonus',
    description: 'The Diwali credit lands, sized in months of what you earn rather than what anybody promised, and every one of you gets a different number.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: EVERY_BOARD,
  },
  {
    id: 'in-midtown-raise', kind: 'normal', title: 'Mid-Career Raise',
    description: 'A quiet word by the lift, a new number, and a handshake of exactly matched firmness on the way out.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  setback('veryHard', EVERY_BOARD, 'in-midtown-repo-rate', 'The Repo Rate',
    'The central bank moves the rate on a Thursday morning, and by Friday every home-loan EMI in the household has moved with it.',
    { type: 'payMoney', amount: 1_400_000, reason: 'Rates go the wrong way' },
    'slate', 'space:market-crash'),
  setback('hard', LONG_ONLY, 'in-midtown-seepage', 'The Seepage Question',
    'The structural engineer asks, gently, how many monsoons the wall behind the wardrobe has absorbed. The report that answers costs money, and so does the answer.',
    { type: 'payMoney', amount: 800_000, reason: 'Waterproofing and repairs' },
    'slate', 'space:house-hunting'),
  {
    id: 'in-midtown-hill-station', kind: 'normal', title: 'The Hill Station Weekend',
    description: 'A long weekend, one hill station, and the entire city arriving on the same two-lane road — and hotel prices that triple the moment the season turns rainy and pleasant.',
    effect: { type: 'none' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'in-midtown-flight-month', kind: 'normal', title: 'The Flight Month',
    description: 'Four cities in five days on the six a.m. flights, and every one of the receipts is yours until the expense forms clear.',
    effect: { type: 'payMoney', amount: 150_000, reason: 'Travel expenses' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'in-midtown-bank', kind: 'normal', title: 'Bank Visit',
    description: 'The branch manager now greets you by name and offers chai, which is either flattering or ominous.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit', tier: LONG_ONLY,
  },
  flavour(LONG_ONLY, 'in-midtown-site-visits', 'Six Site Visits', 'Six builders\' sample flats in one Saturday, each with rented furniture and a clubhouse render grander than the last, and you liked the second one best all along.', 'slate', 'space:house-hunting', {
    from: 'hard',
    description: 'Six builders\' sample flats in one Saturday, and a tank of fuel, three coffees and a parking fee to show for the day.',
    effect: { type: 'payMoney', amount: 60_000, reason: 'A Saturday of site visits' },
  }),
]

const HOME_BUYING: SpaceContent = {
  id: 'in-model-flat', kind: 'stop', title: 'The Model Flat',
  description: 'A sample flat with rented furniture, a brochure full of clubhouse renders, and a salesman whose EMI plan is exactly as long as the rest of your working life.',
  effect: { type: 'buyHouse' },
  tone: 'gold', icon: 'space:house-hunting', tier: EVERY_BOARD,
}

/** Dalal Street: F&O, crypto, and a man in a very good suit. */
const DALAL_STREET: readonly SpaceContent[] = [
  {
    id: 'in-risky-startup', kind: 'normal', title: 'The Startup Bet',
    description: 'You pour savings into a friend\'s Bengaluru startup and spin to see what comes back.',
    effect: { type: 'spinForMoney', perPip: 200_000, reason: 'Startup investment payout' },
    tone: 'pink', icon: 'space:startup-bet', tier: EVERY_BOARD,
  },
  {
    id: 'in-risky-bad-tip', kind: 'normal', title: 'The Bad Tip',
    description: 'The "sure thing" you forwarded to three groups tanks in a week, and you buy everyone at the table dinner to make up for recommending it to so many people.',
    effect: { type: 'payEach', amount: 200_000, reason: 'The bad stock tip' },
    tone: 'pink', icon: 'space:stock-tip', tier: EVERY_BOARD,
  },
  {
    id: 'in-risky-golf', kind: 'normal', title: 'Client Golf',
    description: 'Eighteen holes at the members\' club, a friendly wager on every hole, and you have been quietly playing worse than your real skill all season, just so today\'s win looks innocent.',
    effect: { type: 'collectFromEach', amount: 250_000, reason: 'Eighteen friendly wagers' },
    tone: 'pink', icon: 'space:poker-night', tier: EVERY_BOARD,
  },
  {
    id: 'in-risky-crash', kind: 'normal', title: 'Market Crash',
    description: 'The index drops hard and your portfolio takes the hit. Your father mentions, again, the year one broker\'s fraud crashed the whole market.',
    effect: { type: 'payMoney', amount: 900_000, reason: 'Market crash' },
    tone: 'pink', icon: 'space:market-crash', tier: EVERY_BOARD,
  },
  setback('hard', EVERY_BOARD, 'in-risky-second-leg', 'The Second Leg Down',
    'The index finds a lower floor than anyone believed it had, and finds it inside a single afternoon session.',
    { type: 'payMoney', amount: 1_600_000, reason: 'The market falls again' },
    'pink', 'space:market-crash'),
  setback('veryHard', LONG_ONLY, 'in-risky-fo-wipeout', 'The Options Wipeout',
    'Nine in ten lose money in the derivatives market, says the regulator\'s own warning, on the app, under the button. The position is closed for you at the worst minute of expiry day.',
    { type: 'payMoney', amount: 2_000_000, reason: 'Position closed out' },
    'pink', 'space:market-crash'),
  {
    id: 'in-risky-suv', kind: 'normal', title: 'One Careful Week',
    description: 'You buy the SUV you promised yourself at seventeen, and introduce it to the society\'s gate before the registration plates arrive.',
    effect: { type: 'payMoney', amount: 500_000, reason: 'Bumper, gate and pride', hazard: 'accident' },
    tone: 'pink', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'in-risky-lottery', kind: 'normal', title: 'The Bumper Draw',
    description: 'You queue forty minutes at the famously lucky ticket counter, because the famously lucky counter is famously lucky. Spin for what the queue was worth.',
    effect: { type: 'spinForMoney', perPip: 350_000, reason: 'The festival bumper draw' },
    tone: 'pink', icon: 'space:lottery-ticket', tier: EVERY_BOARD,
  },
  {
    id: 'in-risky-old-sip', kind: 'normal', title: 'The Forgotten SIP',
    description: 'A mutual fund deduction you set up in your first job and never once looked at has quietly become a sum, and everyone at the table is openly jealous.',
    effect: { type: 'collectFromEach', amount: 200_000, reason: 'The forgotten investment' },
    tone: 'pink', icon: 'space:surprise-bonus', tier: STANDARD_UP,
  },
  {
    id: 'in-risky-mega-contest', kind: 'normal', title: 'One More Contest',
    description: 'The fantasy app\'s mega contest closes at the toss. You copy the team picked by an "expert" you do not actually trust, and the entry fees add up all season.',
    effect: { type: 'payMoney', amount: 600_000, reason: 'A season of entry fees' },
    tone: 'pink', icon: 'space:bidding-war', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'in-risky-payday', 'A pay credit lands while your investments are busy misbehaving.'),
  {
    id: 'in-risky-margin-call', kind: 'normal', title: 'Margin Call',
    description: 'The broker rings at nine-sixteen, one minute after the open. You already know it is bad news, just from his tone.',
    effect: { type: 'payMoney', amount: 400_000, reason: 'Margin call' },
    tone: 'pink', icon: 'space:market-crash', tier: LONG_ONLY,
  },
  {
    id: 'in-risky-swap', kind: 'normal', title: 'The Handshake Deal',
    description: 'One handshake over one filter coffee, and you and the front-runner trade bank balances.',
    effect: { type: 'swapMoneyWithLeader', reason: 'A deal with the front-runner' },
    tone: 'pink', icon: 'space:rival-swap', tier: EVERY_BOARD,
  },
  {
    id: 'in-risky-terrace-party', kind: 'normal', title: 'The Terrace Party',
    description: 'You book the entire rooftop restaurant for the party of the winter and insist on picking up every single bill.',
    effect: { type: 'payEach', amount: 150_000, reason: 'The whole terrace, on you' },
    tone: 'pink', icon: 'space:neighborhood-bbq', tier: LONG_ONLY,
  },
  {
    id: 'in-risky-angel', kind: 'normal', title: 'Angel Investing',
    description: 'Three cheques into three garage startups — spin to find out which one grew up.',
    effect: { type: 'spinForMoney', perPip: 150_000, reason: 'Angel investment return' },
    tone: 'pink', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'in-risky-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The speculative end of your portfolio has a very good quarter for once, and you brag about it to anyone who will listen.',
    effect: { type: 'stockDividend', perShare: 400_000, reason: 'Bumper dividend' },
    tone: 'pink', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'in-risky-good-suit', kind: 'normal', title: 'A Very Good Suit',
    description: 'The relationship manager leans in and lowers his voice. He is wearing a very good suit, which is not the same thing as a very good product.',
    effect: { type: 'buyStock' },
    tone: 'pink', icon: 'space:stock-tip', tier: LONG_ONLY,
  },
]

/** Steady Street: the FD, the gold coin, and the diary of every rupee. */
const STEADY_STREET: readonly SpaceContent[] = [
  {
    id: 'in-safe-cashback', kind: 'normal', title: 'Cashback Day',
    description: 'Four payment apps, one straining phone, and a checkout moment where the accumulated cashback covers the whole basket.',
    effect: { type: 'gainMoney', amount: 80_000, reason: 'The cashback pays out' },
    tone: 'green', icon: 'space:coupon-clipping', tier: EVERY_BOARD,
  },
  {
    id: 'in-safe-kitchen-garden', kind: 'normal', title: 'The Kitchen Garden',
    description: 'The balcony\'s curry leaves, chillies and one heroic tomato plant finally deliver, saving a market trip and settling an argument with the neighbour about soil.',
    effect: { type: 'none' },
    tone: 'green', icon: 'space:garden-harvest', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'in-safe-payday', 'The credit arrives on the last working day, as it has every month since you can remember.', missedPayday(
    'veryHard',
    'Salary Stuck',
    'A cell in a spreadsheet somewhere means this month\'s salary will arrive next month instead.',
    100_000,
    'Salary held over a month',
  )),
  setback('hard', EVERY_BOARD, 'in-safe-excess', 'The Policy Excess',
    'Even the careful road has a claim form on it, and the surveyor\'s report subtracts the excess in exact change.',
    { type: 'payMoney', amount: 400_000, reason: 'Policy excess' },
    'green', 'finance:insurance-office'),
  setback('veryHard', STANDARD_UP, 'in-safe-monsoon-roof', 'The Monsoon Terrace',
    'The cloudburst finds the one crack in the terrace waterproofing, and the contractor with the good reputation is booked until Thursday.',
    { type: 'payMoney', amount: 900_000, reason: 'Terrace repairs' },
    'green', 'space:house-hunting'),
  setback('hard', LONG_ONLY, 'in-safe-fridge', 'The Fridge Gives Up',
    'It hums, it rattles, it stops — in May. Everything inside, including the mango pulp being saved for guests, goes by lunchtime.',
    { type: 'payMoney', amount: 300_000, reason: 'A new fridge' },
    'green', 'space:grocery-run'),
  {
    id: 'in-safe-scooter-dominoes', kind: 'normal', title: 'The Scooter Dominoes',
    description: 'A row of parked scooters outside the market goes down like dominoes, and yours was in the exact middle, and nobody at all saw a thing.',
    effect: { type: 'payMoney', amount: 300_000, reason: 'Panel and paint', hazard: 'accident' },
    tone: 'green', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'in-safe-ledger', kind: 'normal', title: 'The Household Diary',
    description: 'You keep the household accounts diary faithfully for a whole year, every auto fare and every kilo of onions, and by year\'s end you have saved more than you expected.',
    effect: { type: 'gainMoney', amount: 100_000, reason: 'The diary balances ahead' },
    tone: 'green', icon: 'space:budget-win', tier: EVERY_BOARD,
  },
  {
    id: 'in-safe-fd-matures', kind: 'normal', title: 'The Fixed Deposit Matures',
    description: 'The five-year fixed deposit — the FD, the family\'s answer to every question — matures on schedule, and the interest buys one genuinely excellent dinner.',
    effect: { type: 'gainMoney', amount: 120_000, reason: 'Five years of interest' },
    tone: 'green', icon: 'space:interest-payout', tier: STANDARD_UP,
  },
  {
    id: 'in-safe-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'A rival leaves their proudest keepsake unattended by the chai tray, and your hand hovers over it.',
    effect: { type: 'stealLifeTile', reason: 'A keepsake changes hands' },
    tone: 'green', icon: 'space:sticky-fingers', tier: STANDARD_UP,
  },
  {
    id: 'in-safe-upi-scratch', kind: 'normal', title: 'The Scratch Card',
    description: 'The payment app\'s scratch card — usually eleven rupees and a sticker — lands, for once, on the number the animation had been promising all year.',
    effect: { type: 'gainMoney', amount: 90_000, reason: 'The scratch card pays out' },
    tone: 'green', icon: 'space:cashback-bonus', tier: LONG_ONLY,
  },
  {
    id: 'in-safe-old-passbook', kind: 'normal', title: 'The Old Passbook',
    description: 'A childhood post-office savings book surfaces in the steel cupboard at your parents\' house, and the balance inside has been compounding patiently since primary school.',
    effect: { type: 'gainMoney', amount: 140_000, reason: 'The forgotten account' },
    tone: 'green', icon: 'space:refund-check', tier: EVERY_BOARD,
  },
  {
    id: 'in-safe-gold-coins', kind: 'normal', title: 'The Gold Coin Drawer',
    description: 'Every year, on the festival day for buying gold, one small coin went into the locker. Today the jeweller weighs the drawer, and it holds more than you remembered saving.',
    effect: { type: 'gainMoney', amount: 100_000, reason: 'The coins, weighed' },
    tone: 'green', icon: 'space:quiet-savings', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'in-safe-payday-2', 'Another last working day, another quiet credit. This is the whole idea.'),
  {
    id: 'in-safe-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The steady half of your portfolio posts its steady little credit, plus an invitation to an annual general meeting with very good samosas.',
    effect: { type: 'stockDividend', perShare: 250_000, reason: 'Quarterly dividend' },
    tone: 'green', icon: 'space:dividend-day', tier: EVERY_BOARD,
  },
  {
    id: 'in-safe-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Late is better than never, and the relative with the briefcase is delighted to unroll the laminated chart for you again.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'green', icon: 'finance:insurance-office', tier: LONG_ONLY,
  },
  flavour(LONG_ONLY, 'in-safe-society-festival', 'The Society Festival Night', 'The housing society\'s festival night: fairy lights on every balcony, a hired sound system, and the same circle dance the courtyard has danced for generations, learned in four minutes.', 'green', 'space:neighborhood-bbq', {
    from: 'hard',
    description: 'The housing society\'s festival night — and you, it turns out, are this year\'s committee, which means the caterer\'s advance and the sound system\'s deposit are yours.',
    effect: { type: 'payMoney', amount: 70_000, reason: 'The festival committee finds you' },
  }),
]

/** Sunset Years: the sharpest material on the board, played warm. */
const SUNSET_YEARS: readonly SpaceContent[] = [
  {
    id: 'in-sunset-number', kind: 'stop', title: 'The Two-Crore Question',
    description: 'Every family WhatsApp group has forwarded the calculation of what a comfortable retirement needs, and every forward says two crore. Your own quick math runs a little higher — and the number, unfortunately, does not withdraw itself.',
    effect: { type: 'retireEarly' },
    tone: 'gold', icon: 'space:retirement-fund', tier: EVERY_BOARD,
  },
  {
    id: 'in-sunset-upgrade', kind: 'normal', title: 'Home Upgrade',
    description: 'The builder calls about something brighter, higher, and just about within reach — the new tower has a floor free, and the floor has a view.',
    effect: { type: 'upgradeHouse' },
    tone: 'slate', icon: 'space:home-upgrade', tier: EVERY_BOARD,
  },
  {
    id: 'in-sunset-flood', kind: 'normal', title: 'The Hundred-Year Rain',
    description: 'The hundred-year rain arrives for the third time this decade, spends one night in your ground floor, and leaves without helping to clean up.',
    effect: { type: 'payMoney', amount: 1_200_000, reason: 'Flood damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: EVERY_BOARD,
  },
  setback('veryHard', STANDARD_UP, 'in-sunset-cyclone', 'The Cyclone',
    'The cyclone finds everything the flood loosened, starting with the water tank on the roof.',
    { type: 'payMoney', amount: 1_600_000, reason: 'Cyclone damage', hazard: 'fire' },
    'slate', 'space:house-fire'),
  setback('hard', EVERY_BOARD, 'in-sunset-parents', 'Caring for Your Parents',
    'Somebody who once carried you now needs carrying, and they move into the room you always meant them to have. You would never count the cost. The hospital counts it anyway.',
    { type: 'payMoney', amount: 2_000_000, reason: 'Caring for family' },
    'slate', 'space:family-portrait'),
  {
    id: 'in-sunset-godown', kind: 'normal', title: 'The Godown Fire',
    description: 'The little storeroom — the godown — holding the online shop\'s entire stock goes up in eleven minutes flat, along with the online shop.',
    effect: { type: 'payMoney', amount: 700_000, reason: 'Godown fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'in-sunset-speed-breaker', kind: 'normal', title: 'The New Speed Breaker',
    description: 'The municipality installs an unmarked speed breaker where no speed breaker has ever stood, and you formally introduce the car\'s underside to it twice in one month.',
    effect: { type: 'payMoney', amount: 380_000, reason: 'Sump guard, twice', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  payday(EVERY_BOARD, 'in-sunset-payday-1', 'One of your very last pay credits lands.'),
  {
    id: 'in-sunset-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'Decades of never once selling pay out, share by share, all at once.',
    effect: { type: 'stockDividend', perShare: 400_000, reason: 'Annual dividend' },
    tone: 'slate', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'in-sunset-swap', kind: 'normal', title: 'The Last Deal',
    description: 'One final audacious handshake over filter coffee, and the leader\'s fortune leaves the table with you instead.',
    effect: { type: 'swapMoneyWithLeader', reason: 'The eleventh-hour swap' },
    tone: 'slate', icon: 'space:rival-swap', tier: EVERY_BOARD,
  },
  {
    id: 'in-sunset-children-visit', kind: 'normal', title: 'The Children Visit',
    description: 'Every grown-up child arrives with a suitcase of gifts and quietly leaves an envelope in the puja room. The one abroad wires it instead, with a phone call that runs two hours.',
    effect: { type: 'collectPerChild', amount: 400_000, reason: 'An envelope from each child' },
    tone: 'slate', icon: 'space:child-benefit', tier: EVERY_BOARD,
  },
  {
    id: 'in-sunset-fund', kind: 'normal', title: 'The Fund Blows Up',
    description: 'You retired early on one clever fund, and this is the quarter the clever fund\'s letter begins with the word "regrettably".',
    effect: { type: 'payMoney', amount: 1_600_000, reason: 'The fund you retired on' },
    tone: 'slate', icon: 'space:market-crash', tier: STANDARD_UP,
  },
  {
    id: 'in-sunset-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'Over the good chai, you begin talking the front-runner out of their finest story.',
    effect: { type: 'stealLifeTile', reason: 'A story changes hands' },
    tone: 'slate', icon: 'space:sticky-fingers', tier: EVERY_BOARD,
  },
  {
    id: 'in-sunset-last-title', kind: 'normal', title: 'One Last Title',
    description: 'One more designation before the door, if they can be persuaded. Spin, and let the last appraisal of your life decide it.',
    effect: { type: 'promotion', reason: 'The last appraisal of your life' },
    tone: 'slate', icon: 'space:big-promotion', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'in-sunset-payday-2', 'You stopped counting the paydays years ago; the last working day has not.'),
  {
    id: 'in-sunset-farewell', kind: 'normal', title: 'The Farewell Tour',
    description: 'Every department insists on a felicitation, and every felicitation comes with a shawl. You now own eleven shawls and are moved by every one of them.',
    effect: { type: 'collectFromEach', amount: 300_000, reason: 'Farewell gifts' },
    tone: 'slate', icon: 'space:surprise-bonus', tier: STANDARD_UP,
  },
  {
    id: 'in-sunset-pension', kind: 'normal', title: 'The Pension Arrives',
    description: 'The provident fund statement arrives in a government envelope. The monthly figure assumes you also did everything else right.',
    effect: { type: 'gainMoney', amount: 110_000, reason: 'Pension instalment' },
    tone: 'green', icon: 'space:garage-sale', tier: LONG_ONLY,
  },
  {
    id: 'in-sunset-declutter', kind: 'normal', title: 'The Great Decluttering',
    description: 'The scrap dealer who cycles the lane calling for old newspapers weighs forty years of them on his hand-held scale, and pays in creased notes counted twice.',
    effect: { type: 'gainMoney', amount: 70_000, reason: 'Forty years, weighed' },
    tone: 'green', icon: 'space:yard-sale', tier: LONG_ONLY,
  },
  {
    id: 'in-sunset-trunk', kind: 'normal', title: 'The Steel Trunk',
    description: 'The trunk from the village house is finally opened, and the antiques dealer goes very quiet at one of the brass lamps — spin for the appraisal.',
    effect: { type: 'spinForMoney', perPip: 90_000, reason: 'The appraisal' },
    tone: 'slate', icon: 'space:garage-sale', tier: LONG_ONLY,
  },
  {
    id: 'in-sunset-sit-down', kind: 'normal', title: 'The Sit-Down',
    description: 'You both go through a year of the household diary at the kitchen table, and the pocket-money system is finally audited in both directions. There is a gold bangle to discuss.',
    effect: { type: 'household', reason: 'The diary, audited both ways' },
    tone: 'purple', icon: 'space:quiet-savings', tier: LONG_ONLY,
  },
  {
    id: 'in-sunset-last-ticket', kind: 'normal', title: 'One Last Ticket',
    description: 'One final ticket from the famously lucky counter on the way out the door — spin for the payout.',
    effect: { type: 'spinForMoney', perPip: 350_000, reason: 'One last ticket' },
    tone: 'slate', icon: 'space:lottery-ticket', tier: STANDARD_UP,
  },
  setback('veryHard', EVERY_BOARD, 'in-sunset-final-notice', 'The Final Notice',
    'One last envelope from the tax department arrives before the office door closes behind you for good.',
    { type: 'payMoney', amount: 2_200_000, reason: 'Final tax bill' },
    'slate', 'space:refund-check'),
  flavour(EVERY_BOARD, 'in-sunset-ahead', 'Sunset Ahead', 'From the terrace, the whole neighbourhood\'s kites climb into the dusk, the way they have every winter evening you were too busy to look up.', 'slate', 'space:sunset-ahead'),
]

const RETIREMENT: SpaceContent = {
  id: 'in-retirement', kind: 'retirement', title: 'Retirement Day',
  description: 'A shawl around your shoulders, a coconut in your hands, a framed group photograph — and the first Monday in forty years with nowhere to be.',
  effect: { type: 'retire' },
  tone: 'gold', icon: 'space:retirement', tier: EVERY_BOARD,
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
    summary: 'An uncle knows a man, and by Friday you have a wage — years before the students earn a thing. No safety net, and a trade ladder whose bottom rung is grim and whose top rung out-earns every graduate at this table.',
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
