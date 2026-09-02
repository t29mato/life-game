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
 * The France route: the same measured skeleton, and an entirely French life.
 *
 * Structurally this board is the USA board, tile for tile: same tiers, same
 * stops, same hardship placements, same hazard tags, same payday count per
 * lane, every sum at ×1 (the euro sits close enough to the dollar that the
 * unit does not move). That is deliberate and important — the skeleton is
 * where the measured balance lives (the even opening fork, the volatile work
 * lane, the twice-a-game insurance payoff), and what a country gets to change
 * is everything the player actually reads: which life happens on each tile,
 * and in which words. `france/edition.test.ts` compares the two routes tile
 * by tile and checks they match.
 *
 * The voice rule, applied on every tile below: **short sentences, plain
 * words, a French word only where the sentence teaches it in passing** (the
 * notaire, the concours, the apéro), and never in a title. The joke is the
 * situation, not the vocabulary — a reader who is not a native English
 * speaker should get the punchline as fast as a reader who is.
 */

const START: SpaceContent = {
  ...flavour('fr-start', 'Start of Life', 'Every September, the whole country restarts at once — new shoes, a new timetable, and your life begins on the same morning as everyone else\'s.', 'slate', 'space:start-of-life'),
  kind: 'start',
}

/**
 * The Great Schools lane: two free years of ferocious cramming, one national
 * exam, and then a school whose fees the Republic does not subsidise. The
 * tuition stop and the loan tile carry the same measured weight as every
 * edition's — what is French is the concours, the maid's room under the roof,
 * and an internship called a "stage" with a stipend called gratitude.
 */
const GRANDE_ECOLE_LANE: readonly SpaceContent[] = [
  // Has to stay the fork's first step — see usa/route.ts college-1.
  flavour('fr-uni-move-in', 'The Maid\'s Room', 'Your first home is nine square metres under the roof, six floors up, no lift. It is tiny, but it is yours.', 'blue', 'space:move-in-day', {
    from: 'hard',
    description: 'Your first home is nine square metres under the roof, six floors up, no lift — and the letting agent wants a deposit, a guarantor, and a fee just for showing you the room.',
    effect: { type: 'payMoney', amount: 1_400, reason: 'Deposit and agency fee' },
  }),
  {
    id: 'fr-uni-fees', kind: 'event', title: 'The School Fees',
    description: 'Two free years of studying paid off: you passed the entrance exam. But the school itself is not free, and the bill is due before you even see the library.',
    effect: { type: 'tuition', reason: 'Grande école fees' },
    tone: 'blue', icon: 'space:tuition-bill',
  },
  {
    id: 'fr-uni-harvest', kind: 'normal', title: 'The Grape Harvest',
    description: 'You spend three weeks in September picking grapes for a vineyard that feeds you well at lunch. The work pays in cash, sore hands, and one bottle you are saving for later.',
    effect: { type: 'gainMoney', amount: 9_000, reason: 'Harvest wages' },
    tone: 'blue', icon: 'space:campus-job',
  },
  setback('hard', 'fr-uni-overdraft', 'Overdraft Charges',
    'Your account dips below zero for one single day. The bank charges you for it anyway, and includes a leaflet about budgeting.',
    { type: 'payMoney', amount: 300, reason: 'Overdraft charges' },
    'blue', 'finance:bank-visit'),
  {
    id: 'fr-uni-grant', kind: 'normal', title: 'The Merit Grant',
    description: 'A scholarship exists that matches you exactly. You read the letter twice to be sure it is real, and it covers a big chunk of your fees.',
    effect: { type: 'gainMoney', amount: 24_000, reason: 'Foundation grant' },
    tone: 'blue', icon: 'space:scholarship-win',
  },
  flavour('fr-uni-exams', 'Exam Fortnight', 'Five written exams, then one where three teachers watch you work out a problem on a blackboard. You live on coffee.', 'blue', 'space:finals-week', {
    from: 'hard',
    description: 'Five written exams, one blackboard exam in front of three teachers — and you panic-hire a tutor for the subject you dread most.',
    effect: { type: 'payMoney', amount: 1_600, reason: 'Emergency tutoring' },
  }),
  {
    id: 'fr-uni-graduation', kind: 'event', title: 'Graduation Day',
    description: 'You graduate with a long, impressive-sounding diploma, a handshake from an official, and a network of alumni you can call on for life.',
    effect: { type: 'graduate' },
    tone: 'blue', icon: 'space:cap-and-gown',
  },
  {
    id: 'fr-uni-farewell', kind: 'normal', title: 'Clearing the Room',
    description: 'You empty the student room into two suitcases and hand the key back to the concierge.',
    effect: { type: 'none' },
    tone: 'blue', icon: 'space:cap-and-gown',
  },
]

const GRAD_FAIR: SpaceContent = {
  id: 'fr-grad-forum', kind: 'event', title: 'The Careers Forum',
  description: 'Former students of your school fill the great hall for one day, offering firm handshakes and firmer salary numbers. Two jobs are open. Pick one.',
  effect: { type: 'chooseCareer', pool: 'graduate' },
  tone: 'gold', icon: 'space:grad-job-fair',
}

/**
 * Straight to Work: the apprenticeship signs you to a patron while the prépa
 * students are still buying flashcards — paid from day one, which is the only
 * thing this lane can genuinely offer against a diploma, and exactly what it
 * offers. The rest of the lane is the gamble the player asked for: a crêpe
 * van bet, a scratch card from the tobacconist, and rent that is due whatever
 * the week did.
 */
const WORK_LANE: readonly SpaceContent[] = [
  {
    id: 'fr-apprenticeship-day', kind: 'event', title: 'Apprenticeship Day',
    description: 'A trade school finds you an employer on the spot. You sign there and then, and you are paid from your first shift — while the exam students are still standing in line to enrol.',
    effect: { type: 'chooseCareer', pool: 'basic' },
    tone: 'gold', icon: 'space:first-job-fair',
  },
  {
    id: 'fr-work-first-payslip', kind: 'normal', title: 'First Pay Slip',
    description: 'Your first French pay slip has forty lines on it. Your actual salary is somewhere below four different kinds of tax, but it still feels like a lot.',
    effect: { type: 'gainMoney', amount: 2_000, reason: 'First pay packet' },
    tone: 'orange', icon: 'space:first-paycheck',
  },
  payday('fr-work-payday-1', 'A full month worked, and the money lands while your friends are still students.', missedPayday(
    'veryHard',
    'Paid in Arrears',
    'Nobody told you: your first month is paid a month late. The landlord does not care.',
    900,
    'A month of living on nothing',
  )),
  {
    id: 'fr-work-moving-out', kind: 'event', title: 'Moving Out',
    description: 'Now that you are earning, you are expected to move out: a deposit, a guarantor (your parents have to sign), and a rental application thicker than a job application.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'Deposit and first month' },
    tone: 'orange', icon: 'space:rent-due', unscaled: true,
  },
  {
    id: 'fr-work-first-night', kind: 'normal', title: 'First Night In',
    description: 'You unpack by lamplight, because the overhead bulb has not made it off the shopping list yet.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:rent-due',
  },
  {
    id: 'fr-work-gear', kind: 'event', title: 'Work Gear Deposit',
    description: 'Two sets of overalls, steel-toed boots, an ID badge, and a deposit you doubt you will ever see again.',
    effect: { type: 'payMoney', amount: 1_500, reason: 'Work gear deposit' },
    tone: 'orange', icon: 'space:rent-due', appearsFrom: 'hard',
  },
  payday('fr-work-payday-2', 'Another month, another pay slip. Still nobody has asked to see your diploma.', missedPayday(
    'hard',
    'Hours Cut',
    'Your boss posts the new schedule with a sigh. Your name is on half as many shifts as it was.',
    1_200,
    'Half a month of shifts',
  )),
  payday('fr-work-payday-3', 'Three months in, and getting paid no longer feels like a surprise.'),
]

/**
 * The Boulevard, first half: the years between the first wage and the first
 * serious question about where the wage comes from. The trunk carries the
 * hazards so that everybody — not half the table — walks them.
 */
const BOULEVARD_EARLY: readonly SpaceContent[] = [
  {
    id: 'fr-main-trial-period', kind: 'normal', title: 'Trial Period Ends',
    description: 'Your trial period ends today. Someone sits across from you with a form. Roll to find out what they say.',
    effect: { type: 'promotion', reason: 'The end of the trial period' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
  {
    id: 'fr-main-bank', kind: 'normal', title: 'Bank Appointment',
    description: 'Your personal banker meets you by appointment, offers you a coffee, and asks how your money is doing.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit',
  },
  {
    id: 'fr-main-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'In France, insurance is not optional — home insurance is required by law, and a second policy called the mutuelle covers what health insurance does not. The broker has a folder ready for each.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office',
  },
  // The only payday in this stretch — see usa/route.ts main-6. Harshening it
  // zeroed every player's income for this whole run on Hard and Very Hard, so
  // it stays unconditional rather than joining every other lane's pattern of
  // harshening one of several paydays and leaving another alone.
  payday('fr-main-payday-1', 'The money lands on the 28th, like clockwork — the best notification of the week.'),
  {
    id: 'fr-main-stock-tip', kind: 'normal', title: 'Stock Tip',
    description: 'A coworker insists a stock is a sure thing, over lunch. The market is open until half past five.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'space:stock-tip',
  },
  {
    id: 'fr-main-fender-bender', kind: 'normal', title: 'Car Crash',
    description: 'You and the other driver fill out the accident report on the hood of a car that is no longer the shape it was, and agree it was your fault.',
    effect: { type: 'payMoney', amount: 9_000, reason: 'Bodyshop bill', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender',
  },
  setback('veryHard', 'fr-main-pileup', 'Ring Road Pileup',
    'Thick fog on the ring road, sudden brake lights, and four cars crushed together on the exit ramp. Nobody is hurt. The repair bills are large.',
    { type: 'payMoney', amount: 16_000, reason: 'Pileup repairs', hazard: 'accident' },
    'slate', 'space:fender-bender'),
  setback('hard', 'fr-main-dentist', 'The Dental Quote',
    'One crown, one lecture about flossing, and a bill whose biggest line item is not covered by insurance.',
    { type: 'payMoney', amount: 5_000, reason: 'Dental work' },
    'slate', 'space:gym-membership'),
  {
    id: 'fr-main-lucky-find', kind: 'normal', title: 'Lucky Find',
    description: 'Something small and lucky happens to you — the kind of story you will tell at dinner for years.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'slate', icon: 'space:lucky-find',
  },
]

/**
 * The mid-career crossroads: stay or go, in the country that invented the job
 * for life and then invented the paperwork for leaving it amicably. The
 * junction halts movement, as every fork must.
 */
const MID_CAREER_FORK: SpaceContent = {
  id: 'fr-crossroads', kind: 'normal', title: 'Five Years In',
  description: 'Five years into a permanent job, your pay rises slowly by seniority — and a recruiter\'s message is still sitting, unread, in your inbox. The road forks here.',
  effect: { type: 'none' },
  tone: 'orange', icon: 'space:networking-night',
}

/**
 * The Permanent Contract road: the raise arrives because you were still there
 * to receive it. Everything on this side compounds, and everything it costs
 * is a thing the company decided on your behalf.
 */
const PERMANENT_CONTRACT_ROAD: readonly SpaceContent[] = [
  {
    id: 'fr-loyal-grid', kind: 'normal', title: 'The Seniority Grid',
    description: 'Your pay rises by one step every year, but the job above you only opens up when someone retires. Roll to find out if this is that year.',
    effect: { type: 'promotion', reason: 'The job above yours came free' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
]

/**
 * Job-Hopper Alley: the raise arrives because you left — through the
 * negotiated exit the whole country signs when it wants to move on without a
 * fight. A compulsory re-draw at the head, and a gap where the paperwork
 * finds you between badges.
 */
const JOB_HOPPER_ALLEY: readonly SpaceContent[] = [
  {
    id: 'fr-hopper-lookout', kind: 'normal', title: 'Quiet Job Search',
    description: 'You update your CV over lunch and start taking calls nobody at the office can hear.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:headhunted',
  },
  {
    id: 'fr-hopper-exit', kind: 'event', title: 'The Negotiated Exit',
    description: 'You and your company agree, in writing, to part ways. This "negotiated exit" gets you a payout, your full rights, and a fresh start — with a new job and a new salary.',
    effect: { type: 'careerChange', reason: 'You signed the negotiated exit', compulsory: true },
    tone: 'orange', icon: 'space:headhunted',
  },
  {
    id: 'fr-hopper-bonus', kind: 'payday', title: 'Signing Bonus',
    description: 'Your new employer pays out your three-month notice period in cash. It lands like a whole extra pay check.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season',
  },
]

/** The Boulevard, second half: the review, the redundancy plan, and the ring. */
const BOULEVARD_LATE: readonly SpaceContent[] = [
  {
    id: 'fr-main-annual-review', kind: 'event', title: 'The Annual Review',
    description: 'A small meeting room, two managers, your file open on the table. One question: are you ready for the next job up? Roll to find out what they decide.',
    effect: { type: 'promotion', reason: 'Your annual review came round' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
  setback('veryHard', 'fr-main-tax-audit', 'Tax Audit',
    'A very polite letter from the tax office leads to a long afternoon sorting through a shoebox of receipts — and a final bill that seems to have been decided in advance.',
    { type: 'payMoney', amount: 15_000, reason: 'Tax audit settlement' },
    'slate', 'space:refund-check'),
  {
    id: 'fr-main-cdd-ends', kind: 'normal', title: 'The Fixed Term Ends',
    description: 'Your short-term contract, which everyone promised would become permanent, quietly is not renewed. The farewell card is very nice, at least.',
    effect: { type: 'loseCareer', reason: 'Contract not renewed' },
    tone: 'orange', icon: 'space:layoff-notice', appearsFrom: 'hard',
  },
  {
    id: 'fr-main-redundancy', kind: 'normal', title: 'The Redundancy Plan',
    description: 'Everyone on your floor is called into one meeting with a consultant in an expensive suit. Afterward, your key card stops working.',
    effect: { type: 'loseCareer', reason: 'Restructured out' },
    tone: 'orange', icon: 'space:layoff-notice',
  },
  {
    id: 'fr-main-employment-office', kind: 'stop', title: 'The Employment Office',
    description: 'A caseworker at the unemployment office reviews your file and finds two jobs that fit. Pick one.',
    effect: { type: 'careerChange', reason: 'A fresh start from the employment office' },
    tone: 'orange', icon: 'space:career-fair-return',
  },
  {
    id: 'fr-main-gifts', kind: 'normal', title: 'Holiday Gifts',
    description: 'You buy a present for everyone at the table, chosen carefully and wrapped beautifully by the shop.',
    effect: { type: 'payEach', amount: 800, reason: 'A present for everyone' },
    tone: 'slate', icon: 'space:surprise-bonus',
  },
]

const MARRIAGE: SpaceContent = {
  id: 'fr-wedding', kind: 'event', title: 'Wedding Day',
  description: 'You marry twice in one day: once at the town hall in front of the mayor, and once at a party that, by tradition, runs until dawn. Guests fill the gift envelope box on the table.',
  effect: { type: 'getMarried' },
  tone: 'pink', icon: 'space:wedding-day',
}

/** Family Lane: the beats every French parent knows, in order of arrival. */
const FAMILY_LANE: readonly SpaceContent[] = [
  {
    id: 'fr-family-nursery-setup', kind: 'normal', title: 'Nursery Setup',
    description: 'You paint the nursery a cheerful yellow, build a crib at midnight, and pick up the health record book the state has already printed with your baby\'s name.',
    effect: { type: 'payMoney', amount: 2_000, reason: 'Nursery setup' },
    tone: 'purple', icon: 'space:nursery-setup',
  },
  {
    id: 'fr-family-new-baby', kind: 'event', title: 'New Baby',
    description: 'A tiny new family member arrives, and the state — which was ready and waiting — opens a file, a benefit, and a vaccination schedule for them.',
    effect: { type: 'haveChildren', count: 1, celebrationPerPip: 600 },
    tone: 'purple', icon: 'space:new-baby',
  },
  setback('hard', 'fr-family-creche', 'The Crèche Waitlist',
    'Getting a spot in the public daycare is as hard as passing an exam. The private childminder who fills the gap is just as expensive.',
    { type: 'payPerChild', amount: 5_000, reason: 'Childcare per child' },
    'purple', 'space:nursery-setup'),
  {
    id: 'fr-family-school-list', kind: 'normal', title: 'The School List',
    description: 'The back-to-school list asks for seventeen specific items per child, including one exact brand of notebook that is sold out everywhere.',
    effect: { type: 'payPerChild', amount: 3_000, reason: 'School supplies per child' },
    tone: 'purple', icon: 'space:school-fees',
  },
  {
    id: 'fr-family-year-end-show', kind: 'normal', title: 'The Year-End Show',
    description: 'Your child says both of their lines perfectly in the school play, and you tear up in the third row behind a wall of phones.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:school-play',
  },
  {
    id: 'fr-family-twins', kind: 'normal', title: 'Twins',
    description: 'The technician goes quiet at the ultrasound, turns the screen around, and holds up two fingers.',
    effect: { type: 'haveChildren', count: 2, celebrationPerPip: 1_100 },
    tone: 'purple', icon: 'space:second-baby',
  },
]

/** The Executive Track: pass cadre, and the overtime stops being counted. */
const EXECUTIVE_TRACK: readonly SpaceContent[] = [
  payday('fr-fast-payday-1', 'Nobody counts your overtime anymore, but the pay check still arrives.'),
  {
    id: 'fr-fast-headhunted', kind: 'normal', title: 'Headhunted',
    description: 'A recruiter calls your personal phone during a meeting, with two job offers and zero patience.',
    effect: { type: 'careerChange', reason: 'Headhunted for something new' },
    tone: 'orange', icon: 'space:headhunted',
  },
  setback('hard', 'fr-fast-burnout', 'Burnout Leave',
    'A doctor signs you off work for six weeks and calmly uses the word "overwork." Your pay is much lighter by the time you return.',
    { type: 'payMoney', amount: 12_000, reason: 'Unpaid leave' },
    'orange', 'space:steady-hustle'),
  {
    id: 'fr-fast-payday-severance', kind: 'payday', title: 'Year-End Payroll',
    description: 'The year closes out, and whatever this job pays lands in your account one more time before the org chart is redrawn.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', appearsFrom: 'veryHard',
  },
  {
    id: 'fr-fast-reorg', kind: 'normal', title: 'The Reorganisation',
    description: 'The company chart is redrawn overnight, and your name ends up in a completely different box. Nobody asked you first — that is what a reorganisation is.',
    effect: { type: 'careerChange', reason: 'Reorganised into a new role', compulsory: true },
    tone: 'orange', icon: 'space:career-fair-return', appearsFrom: 'veryHard',
  },
  {
    id: 'fr-fast-trading-desk', kind: 'normal', title: 'The Trading Desk',
    description: 'You are eager to spend your bonus, and the business district is full of people happy to suggest where to put it.',
    effect: { type: 'buyStock' },
    tone: 'orange', icon: 'finance:trading-floor',
  },
  payday('fr-fast-payday-2', 'Another month down, another pay check in.', missedPayday(
    'hard',
    'Bonus Clawback',
    'An auditor in a distant office recalculates last year\'s bonus — downward, with a long explanation attached.',
    6_000,
    'Bonus clawed back',
  )),
  {
    id: 'fr-fast-retention', kind: 'normal', title: 'Retention Offer',
    description: 'You mention, casually over coffee, that someone else has been in touch. The counter-offer arrives before the coffee does.',
    effect: { type: 'payRaise' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
]

/**
 * Midtown: the money act. The insurance office sells what France actually
 * requires by statute, the household tiles learn about the joint account,
 * and the trunk carries the hazards so that everybody — not half the table —
 * walks them.
 */
const MIDTOWN: readonly SpaceContent[] = [
  {
    id: 'fr-midtown-brokerage', kind: 'normal', title: 'The Brokerage',
    description: 'Screens everywhere, a line of retirees at the counter, and a broker who insists this stock is different.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'finance:trading-floor',
  },
  {
    id: 'fr-midtown-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Before the notary will hand you the keys, they want proof of insurance — and the agent shows you a detailed flood-risk map of your future street.',
    // No auto cover at this window: both crash tiles are behind a pawn
    // standing here, so a policy sold at this desk could never pay out.
    // The broker sells what this stretch of road can actually bill for.
    effect: { type: 'buyInsurance', kinds: ['home', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office',
  },
  // The only payday in this stretch too — see fr-main-payday-1. Harshening it
  // zeroed Very Hard's income for the whole run between the marriage fork and
  // the home-buying fork, so it stays unconditional.
  payday('fr-midtown-payday', 'Your pay lands the same week your apartment deposit is due.'),
  {
    id: 'fr-midtown-joint-account', kind: 'normal', title: 'The Joint Account',
    description: 'You merge your bank accounts at a formal appointment. For the first time, someone else\'s spending is now, unavoidably, your problem too.',
    effect: { type: 'household', reason: 'The joint account, settled up' },
    tone: 'purple', icon: 'finance:bank-visit',
  },
  {
    id: 'fr-midtown-bonus', kind: 'payday', title: 'Year-End Bonus',
    description: 'Your December pay slip comes with an extra page: a bonus based on what you earn, so everyone at the table opens a different number.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season',
  },
  {
    id: 'fr-midtown-raise', kind: 'normal', title: 'Mid-Career Raise',
    description: 'A quiet word by the elevator, a new number on your pay slip, and a firm handshake on the way out.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk',
  },
  setback('veryHard', 'fr-midtown-rate-rise', 'Rate Rise',
    'Your fixed mortgage rate expires without ceremony, and every monthly bill in the house moves along with it.',
    { type: 'payMoney', amount: 14_000, reason: 'Rates go the wrong way' },
    'slate', 'space:market-crash'),
]

const HOME_BUYING: SpaceContent = {
  id: 'fr-notary', kind: 'stop', title: 'The Notary\'s Office',
  description: 'A home is not officially yours until a notary reads the entire deed aloud, in a wood-panelled office. Their fee is really more of a tax, and it is yours to pay too.',
  effect: { type: 'buyHouse' },
  tone: 'gold', icon: 'space:house-hunting',
}

/** Speculation Street: startups, margin, and a broker with beautiful cufflinks. */
const SPECULATION_STREET: readonly SpaceContent[] = [
  {
    id: 'fr-risky-startup', kind: 'normal', title: 'Startup Bet',
    description: 'You put your savings into a friend\'s startup at a big Paris accelerator. Roll to see what comes back.',
    effect: { type: 'spinForMoney', perPip: 3_100, reason: 'Startup investment payout' },
    tone: 'pink', icon: 'space:startup-bet',
  },
  {
    id: 'fr-risky-bad-tip', kind: 'normal', title: 'Bad Stock Tip',
    description: 'Your "sure thing" stock tanks in a week. You buy the table dinner to make up for recommending it in the first place.',
    effect: { type: 'payEach', amount: 2_000, reason: 'Bad stock tip' },
    tone: 'pink', icon: 'space:stock-tip',
  },
  {
    id: 'fr-risky-casino', kind: 'normal', title: 'The Casino Weekend',
    description: 'A weekend at a seaside casino goes perfectly: you quit while you are ahead, which nobody there has ever managed before.',
    effect: { type: 'collectFromEach', amount: 2_500, reason: 'One perfect evening' },
    tone: 'pink', icon: 'space:poker-night',
  },
  {
    id: 'fr-risky-crash', kind: 'normal', title: 'Market Crash',
    description: 'The market drops hard and your portfolio takes the hit. An uncle mentions, again, that land never lets you down.',
    effect: { type: 'payMoney', amount: 9_000, reason: 'Market crash' },
    tone: 'pink', icon: 'space:market-crash',
  },
  setback('hard', 'fr-risky-aftershock', 'Aftershock',
    'The market drops even further than anyone expected — all in one afternoon.',
    { type: 'payMoney', amount: 16_000, reason: 'The market falls again' },
    'pink', 'space:market-crash'),
  {
    id: 'fr-risky-lottery', kind: 'normal', title: 'The Lottery Ticket',
    description: 'You buy a national lottery ticket from the newsstand everyone calls lucky. Roll to see if the luck was real.',
    effect: { type: 'spinForMoney', perPip: 5_500, reason: 'The national draw' },
    tone: 'pink', icon: 'space:lottery-ticket',
  },
  payday('fr-risky-payday', 'Your pay lands while your investments are busy doing badly.'),
  {
    id: 'fr-risky-swap', kind: 'normal', title: 'Rival Swap',
    description: 'A long lunch, one handshake, and you and the current leader trade bank balances.',
    effect: { type: 'swapMoneyWithLeader', reason: 'A deal with the front-runner' },
    tone: 'pink', icon: 'space:rival-swap',
  },
]

/** Prudence Street: the savings booklet, the loyalty card, the wool sock in the drawer. */
const PRUDENCE_STREET: readonly SpaceContent[] = [
  {
    id: 'fr-safe-points', kind: 'normal', title: 'Loyalty Points Payout',
    description: 'You have used your grocery loyalty card faithfully all year. Today it covers your entire shopping cart.',
    effect: { type: 'gainMoney', amount: 800, reason: 'The points pay out' },
    tone: 'green', icon: 'space:coupon-clipping',
  },
  payday('fr-safe-payday', 'Your pay lands on the 28th, just like it always has.', missedPayday(
    'veryHard',
    'Wages Withheld',
    'You are told, calmly, that a paperwork mix-up means this month\'s wages will arrive next month instead, along with a formal apology.',
    1_000,
    'Wages held over a month',
  )),
  setback('hard', 'fr-safe-excess', 'Policy Excess',
    'Even the careful road has an insurance claim on it sometimes, and the deductible is yours to pay.',
    { type: 'payMoney', amount: 1_000, reason: 'Policy excess' },
    'green', 'finance:insurance-office'),
  {
    id: 'fr-safe-budget', kind: 'normal', title: 'Budget Win',
    description: 'You keep a household budget faithfully for a whole year, and it turns out you saved more than you thought.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'You saved more than expected' },
    tone: 'green', icon: 'space:budget-win',
  },
  {
    id: 'fr-safe-refund', kind: 'normal', title: 'Tax Refund',
    description: 'A tax refund arrives right when you had forgotten to expect it, with a long letter explaining why.',
    effect: { type: 'gainMoney', amount: 1_400, reason: 'Tax refund' },
    tone: 'green', icon: 'space:refund-check',
  },
  {
    id: 'fr-safe-wool-sock', kind: 'normal', title: 'The Wool Sock',
    description: 'The old wool sock stuffed in the back of the drawer — the original French savings account — turns out to have grown, quietly, over the years.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'The sock pays out' },
    tone: 'green', icon: 'space:quiet-savings',
  },
  payday('fr-safe-payday-2', 'Another 28th, another quiet payday. That is the whole point.'),
  {
    id: 'fr-safe-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'Your steady, boring investments pay their steady, boring dividend — plus a small voucher for the highway rest-stop café.',
    effect: { type: 'stockDividend', perShare: 2_500, reason: 'Quarterly dividend' },
    tone: 'green', icon: 'space:dividend-day',
  },
]

/** The Sunset Years: the sharpest material on the board, played warm. */
const SUNSET_YEARS: readonly SpaceContent[] = [
  {
    id: 'fr-sunset-number', kind: 'stop', title: 'The Number',
    description: 'You do a quick, rough calculation: what would it take to stop working now, early, on your own terms? The number is smaller than you feared.',
    effect: { type: 'retireEarly' },
    tone: 'gold', icon: 'space:retirement-fund',
  },
  {
    id: 'fr-sunset-upgrade', kind: 'normal', title: 'Home Upgrade',
    description: 'The estate agent calls about something brighter, higher up, and just within reach. The top floor is free, and the view is worth it.',
    effect: { type: 'upgradeHouse' },
    tone: 'slate', icon: 'space:home-upgrade',
  },
  {
    id: 'fr-sunset-fire', kind: 'normal', title: 'House Fire',
    description: 'A pan left on the stove, a distracting phone call, and a kitchen that now needs rebuilding from the floor up.',
    effect: { type: 'payMoney', amount: 24_000, reason: 'Fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire',
  },
  setback('hard', 'fr-sunset-care', 'Care Costs',
    'Someone who once looked after you now needs looking after, and the care home\'s waiting list is longer than you hoped. You would pay any amount for this, and the bill is enormous.',
    { type: 'payMoney', amount: 20_000, reason: 'Caring for family' },
    'slate', 'space:family-portrait'),
  payday('fr-sunset-payday-1', 'One of your very last pay checks lands.'),
  {
    id: 'fr-sunset-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One last bold deal over dinner, and the current leader\'s fortune leaves the table with you instead.',
    effect: { type: 'swapMoneyWithLeader', reason: 'The eleventh-hour swap' },
    tone: 'slate', icon: 'space:rival-swap',
  },
  {
    id: 'fr-sunset-children-visit', kind: 'normal', title: 'The Children Visit',
    description: 'Your grown children come for Sunday lunch with a cake from the good bakery, and quietly leave an envelope of cash behind.',
    effect: { type: 'collectPerChild', amount: 4_000, reason: 'An envelope from each child' },
    tone: 'slate', icon: 'space:child-benefit',
  },
  {
    id: 'fr-sunset-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'Over good brandy, you talk the current leader out of their best story from years ago.',
    effect: { type: 'stealLifeTile', reason: 'A story changes hands' },
    tone: 'slate', icon: 'space:sticky-fingers',
  },
  {
    id: 'fr-sunset-last-title', kind: 'normal', title: 'One Last Title',
    description: 'One more promotion before you retire, if you can get it. Roll, and let this last review decide.',
    effect: { type: 'promotion', reason: 'The last review of your life' },
    tone: 'slate', icon: 'space:big-promotion',
  },
  payday('fr-sunset-payday-2', 'You stopped counting your paydays years ago. The 28th has not.'),
  setback('veryHard', 'fr-sunset-final-tax', 'Final Tax Bill',
    'One last letter from the tax office arrives just before you retire for good.',
    { type: 'payMoney', amount: 22_000, reason: 'Final tax bill' },
    'slate', 'space:refund-check'),
  flavour('fr-sunset-ahead', 'Sunset Ahead', 'The plane trees along the old road flicker by in the evening light — the same way they always have, on evenings you were too busy to notice.', 'slate', 'space:sunset-ahead'),
]

const RETIREMENT: SpaceContent = {
  id: 'fr-retirement', kind: 'retirement', title: 'Retirement Day',
  description: 'The last leaving party of them all, one final walk through the office with a cardboard box, and your first morning in forty years with nowhere to be. The pension you spent a lifetime protecting is finally yours.',
  effect: { type: 'retire' },
  tone: 'gold', icon: 'space:retirement',
}

// ---------------------------------------------------------------------------
// The route: start, four forks, four trunk runs, and retirement — the same
// grammar as every edition, with the summaries written as two uncles giving
// contradictory advice, because the argument at the table is the content.
// ---------------------------------------------------------------------------

const GRANDE_ECOLE_BRANCH: RouteBranch = {
  identity: {
    name: 'The Great Schools',
    summary: 'Two years of hard studying, one national exam, and a bill for the school it gets you into — due in full, before you earn a single euro. What the diploma buys you is a career ladder that mostly goes up, and a network of contacts for life.',
  },
  spaces: [...GRANDE_ECOLE_LANE, GRAD_FAIR],
}

const WORK_BRANCH: RouteBranch = {
  identity: {
    name: 'Straight to Work',
    summary: 'A trade school finds you an employer while the exam students are still studying. You are paid from day one, with no safety net — and the top of this ladder pays more than any diploma at this table.',
  },
  spaces: WORK_LANE,
}

const PERMANENT_BRANCH: RouteBranch = {
  identity: {
    name: 'The Permanent Contract',
    summary: 'Stay put. The CDI — France\'s famous permanent contract — raises your pay by seniority, pays a thirteenth month every December, and in exchange, decides where you live.',
  },
  spaces: PERMANENT_CONTRACT_ROAD,
}

const HOPPER_BRANCH: RouteBranch = {
  identity: {
    name: 'Job-Hopper Alley',
    summary: 'Leave. You sign a negotiated exit, take the payout, and draw a brand new salary from scratch — great if your last one was bad, risky if it was not.',
  },
  spaces: JOB_HOPPER_ALLEY,
}

const FAMILY_BRANCH: RouteBranch = {
  identity: {
    name: 'Family Lane',
    summary: 'School lists, music lessons, and a noisy house, with the government paying a monthly benefit and grown children visiting for Sunday lunch at the end. Fewer paydays, and every bill costs more.',
  },
  spaces: FAMILY_LANE,
}

const EXECUTIVE_BRANCH: RouteBranch = {
  identity: {
    name: 'The Executive Track',
    summary: 'You stop being paid for overtime, which is not the same as working less of it. The raises, bonuses, and corner office are real — so is the life you gave up for them.',
  },
  spaces: EXECUTIVE_TRACK,
}

const SPECULATION_BRANCH: RouteBranch = {
  identity: {
    name: 'Speculation Street',
    summary: 'Startups, margin trading, and a broker with beautiful cufflinks. If you are behind after buying a house, this is the road to catch up on. If you are ahead, think twice.',
  },
  spaces: SPECULATION_STREET,
}

const PRUDENCE_BRANCH: RouteBranch = {
  identity: {
    name: 'Prudence Street',
    summary: 'The savings account, the loyalty card, the old wool sock in the drawer. Nobody ever got rich here — but nobody ever got ruined either, which matters a lot if you are already winning.',
  },
  spaces: PRUDENCE_STREET,
}

export const ROUTE_FRANCE: RouteDefinition = {
  segments: [
    fork(START, GRANDE_ECOLE_BRANCH, WORK_BRANCH),
    run('the boulevard', BOULEVARD_EARLY),
    fork(MID_CAREER_FORK, PERMANENT_BRANCH, HOPPER_BRANCH),
    run('the boulevard, after the crossroads', BOULEVARD_LATE),
    fork(MARRIAGE, FAMILY_BRANCH, EXECUTIVE_BRANCH),
    run('midtown', MIDTOWN),
    fork(HOME_BUYING, SPECULATION_BRANCH, PRUDENCE_BRANCH),
    run('the sunset years', SUNSET_YEARS),
  ],
  terminal: RETIREMENT,
}
