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
 * The Bolivia route: the same measured skeleton, and an entirely Bolivian life.
 *
 * Structurally this board is the USA board, tile for tile: same tiers, same
 * stops, same hardship placements, same hazard tags, same payday count per
 * lane, every sum ×1 (see `economy.ts` for why one is the honest factor).
 * That is deliberate and load-bearing — the skeleton is where two years of
 * measured balance lives, and what a country gets to change is everything
 * the player actually reads: which life happens on each tile, and in which
 * words.
 *
 * The voice rule, applied on every tile below: **wit travels; vocabulary
 * does not.** The joke is the situation, described concretely enough to
 * explain itself; a Spanish or Aymara word appears only where the sentence
 * teaches it in passing (a salteña, a cholet), and never carries the tile
 * alone. And one rule this edition adds for itself: a market stall is an
 * ambition, never a hardship — the board's misfortunes are hail, traffic
 * and paperwork, not the work people are proud of.
 */

const START: SpaceContent = {
  ...flavour('bo-start', 'Start of Life', 'Your journey begins one bright cold morning on the rim of the high city, the whole valley of lights below and the mountain keeping an eye on you.', 'slate', 'space:start-of-life'),
  kind: 'start',
}

/**
 * University Lane: the public university is nearly free by the credit and
 * expensive by the calendar — five years, the entrance exam, the photocopies,
 * the thesis defended in front of your entire extended family. The tuition
 * stop and the loan tile carry the same measured weight as every edition's.
 */
const UNIVERSITY_LANE: readonly SpaceContent[] = [
  // Has to stay the fork's first step — see usa/route.ts college-1.
  flavour('bo-uni-move-in', 'A Room in the City', 'Your first rented room holds a bed, a hotplate, a poster of the national team, and every ambition you have.', 'blue', 'space:move-in-day', {
    from: 'hard',
    description: 'Your first rented room holds a bed and a hotplate — and the landlady would like two months up front, plus a reference from somebody she already knows.',
    effect: { type: 'payMoney', amount: 1_400, reason: 'Two months up front' },
  }),
  {
    id: 'bo-uni-entrance', kind: 'event', title: 'The Entrance Exam',
    description: 'One Monday morning, three thousand hopefuls, one gymnasium of desks. You pass — and then come five years of fees, photocopies, materials and city rent, due before anyone shows you the library.',
    effect: { type: 'tuition', reason: 'Five years of a degree' },
    tone: 'blue', icon: 'space:tuition-bill',
  },
  {
    id: 'bo-uni-lab-keys', kind: 'normal', title: 'The Lab Keys',
    description: 'You mark first-year problem sets, hold the lab keys, and run the projector nobody else can start — and the faculty actually pays for it.',
    effect: { type: 'gainMoney', amount: 9_000, reason: 'Faculty assistant hours' },
    tone: 'blue', icon: 'space:campus-job',
  },
  setback('hard', 'bo-uni-lost-carnet', 'The Lost ID Card',
    'Your identity card vanishes somewhere on a minibus, and replacing it takes two offices, four queues, one notary, and fees at every desk.',
    { type: 'payMoney', amount: 300, reason: 'Reissuing every document' },
    'blue', 'finance:bank-visit'),
  {
    id: 'bo-uni-scholarship', kind: 'normal', title: 'The Merit Scholarship',
    description: 'Your grades earn you the faculty\'s top scholarship, and it covers a serious chunk of the years remaining.',
    effect: { type: 'gainMoney', amount: 24_000, reason: 'Merit scholarship' },
    tone: 'blue', icon: 'space:scholarship-win',
  },
  flavour('bo-uni-finals', 'Finals Week', 'Five exams in four days, and the photocopied notes of three different generations spread across one bed.', 'blue', 'space:finals-week', {
    from: 'hard',
    description: 'Five exams in four days, and a crash course you panic-buy for the one subject whose professor grades hardest of all.',
    effect: { type: 'payMoney', amount: 1_600, reason: 'The crash course' },
  }),
  {
    id: 'bo-uni-defence', kind: 'event', title: 'The Thesis Defence',
    description: 'Three professors, one projector, and your entire extended family in the back rows dressed for a wedding. You pass, and the flowers arrive before the verdict is finished.',
    effect: { type: 'graduate' },
    tone: 'blue', icon: 'space:cap-and-gown',
  },
  {
    id: 'bo-uni-farewell', kind: 'normal', title: 'The Empty Room',
    description: 'You pack four years into two boxes and hand the key back to the landlady who fed you half of them.',
    effect: { type: 'none' },
    tone: 'blue', icon: 'space:cap-and-gown',
  },
]

const GRAD_FAIR: SpaceContent = {
  id: 'bo-grad-fair', kind: 'event', title: 'The Professionals\' Fair',
  description: 'The degree is framed and the title goes in front of your name forever. Two firms want it on their letterhead; pick one.',
  effect: { type: 'chooseCareer', pool: 'graduate' },
  tone: 'gold', icon: 'space:grad-job-fair',
}

/**
 * Straight to Work: the market takes you the moment you show up. The lane's structural
 * promise — earning on tile one, paid before the students have unpacked —
 * is the informal economy's whole argument, and the rest of the lane is the
 * gamble the player asked for: a grill cart bet, a scratch card, and rent
 * that is due whatever the week did.
 */
const WORK_LANE: readonly SpaceContent[] = [
  {
    id: 'bo-market-monday', kind: 'event', title: 'Monday at the Market',
    description: 'Your aunt has a stall, and the stall next to hers needs a pair of hands. You know every price in the hall before your first break, and you are being paid — years before the students earn a thing.',
    effect: { type: 'chooseCareer', pool: 'basic' },
    tone: 'gold', icon: 'space:first-job-fair',
  },
  {
    id: 'bo-work-first-pay', kind: 'normal', title: 'First Week\'s Takings',
    description: 'Your first real money lands in your hand, folded small. Following custom, you buy the family Sunday lunch with it, and they let you pay with visible pride.',
    effect: { type: 'gainMoney', amount: 2_000, reason: 'First week\'s takings' },
    footnote: 'One week at the stall, not a month — the first full month\'s money is the next Payday square.',
    tone: 'orange', icon: 'space:first-paycheck',
  },
  payday('bo-work-payday-1', 'A full month\'s work in your pocket while your classmates are still queueing to enrol.', missedPayday(
    'veryHard',
    'Paid at Month\'s End',
    'Nobody mentioned that the first month is paid at the end of the second, and the hotplate does not care.',
    900,
    'A month of living on nothing',
  )),
  {
    id: 'bo-work-moving-out', kind: 'event', title: 'Moving Out',
    description: 'You are earning, so you are expected to be housed: a deposit, a first month up front, a mattress, and a two-ring stove you carry up four flights yourself.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'Deposit and first month' },
    tone: 'orange', icon: 'space:rent-due', unscaled: true,
  },
  {
    id: 'bo-work-first-night', kind: 'normal', title: 'First Night In',
    description: 'You unpack by candlelight because the landlady still has not fixed the wiring on your floor.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:rent-due',
  },
  {
    id: 'bo-work-association', kind: 'event', title: 'The Association Fee',
    description: 'Nobody trades on this row without joining the traders\' association: an entry fee, a folder of stamps, and a monthly quota the treasurer collects in person.',
    effect: { type: 'payMoney', amount: 1_500, reason: 'Joining the association' },
    tone: 'orange', icon: 'space:rent-due', appearsFrom: 'hard',
  },
  payday('bo-work-payday-2', 'Another month, another fold of notes, and still nobody has ever asked to see a certificate.', missedPayday(
    'hard',
    'Blockade Week',
    'A road blockade seals the pass for eight days. Nothing arrives, nothing sells, and everyone stands at their stalls discussing it at length.',
    1_200,
    'A week the roads were closed',
  )),
  payday('bo-work-payday-3', 'Three months in, and the folded notes have stopped feeling like a surprise.'),
]

/**
 * Market Street, first half: the years between the first wage and the first
 * serious question about where the wage comes from.
 */
const MARKET_STREET_EARLY: readonly SpaceContent[] = [
  {
    id: 'bo-main-probation', kind: 'normal', title: 'Probation Review',
    description: 'Three months in, the boss watches you work a whole morning without saying anything at all. Then she says something. Roll.',
    effect: { type: 'promotion', reason: 'The end of probation' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
  {
    id: 'bo-main-bank', kind: 'normal', title: 'Bank Visit',
    description: 'The queue wraps the block twice, moves incredibly slowly, and the teller asks warmly how the money is treating you.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit',
  },
  {
    id: 'bo-main-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'The broker unrolls a laminated map of your neighbourhood marked for hail, landslide and lightning. It is thorough, recent, and quietly terrifying.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office',
  },
  // The only payday in this stretch — see usa/route.ts main-6. Harshening it
  // zeroed every player's income for this whole run on Hard and Very Hard, so
  // it stays unconditional rather than joining every other lane's pattern of
  // harshening one of several paydays and leaving another alone.
  payday('bo-main-payday-1', 'The month\'s money lands, minus nothing for once. The best moment of the week.'),
  {
    id: 'bo-main-stock-tip', kind: 'normal', title: 'Stock Tip',
    description: 'A cousin swears by a share he read about on the overnight bus. The brokerage is open until six.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'space:stock-tip',
  },
  {
    id: 'bo-main-intersection', kind: 'normal', title: 'The Intersection',
    description: 'A minibus and your near side hold a short, loud negotiation at an uncontrolled corner, and the bodyshop\'s quote arrives faster than the police ever would.',
    effect: { type: 'payMoney', amount: 9_000, reason: 'Bodyshop bill', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender',
  },
  setback('veryHard', 'bo-main-motorway-pileup', 'Fog on the Motorway',
    'Fog rolls over the rim of the high city, brake lights bloom, and four vehicles crush together on the toll road. Everyone walks away; the invoices do not.',
    { type: 'payMoney', amount: 16_000, reason: 'Pileup repairs', hazard: 'accident' },
    'slate', 'space:fender-bender'),
  setback('hard', 'bo-main-dentist', 'Dentist Bill',
    'One filling, one gold crown your aunt insists is an investment, and one invoice that stings rather more than the drill did.',
    { type: 'payMoney', amount: 5_000, reason: 'Dental work' },
    'slate', 'space:gym-membership'),
  {
    id: 'bo-main-alasita', kind: 'normal', title: 'The Miniature Fair',
    description: 'At the January fair you buy your dreams in miniature — a tiny house, a tiny degree, a tiny wad of banknotes — and have them blessed at noon sharp. Everyone swears by it, and nobody explains it.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'slate', icon: 'space:lucky-find',
  },
]

/**
 * The mid-career crossroads: the payroll or your own account. In a country
 * where most working life is informal, this is the fork with a relative on
 * each side of the argument. The junction halts movement, as every fork must.
 */
const MID_CAREER_FORK: SpaceContent = {
  id: 'bo-crossroads', kind: 'normal', title: 'Five Years In',
  description: 'Five years of steady work, and two voices at Sunday lunch: your mother says keep the payroll and the pension, your cousin says nobody ever got rich working for somebody else. The road forks here.',
  effect: { type: 'none' },
  tone: 'orange', icon: 'space:networking-night',
}

/**
 * Payroll Road: the formal economy's whole pitch — the raise arrives because
 * you were still on the books to receive it, and December brings a
 * thirteenth wage by law. Everything it costs is a thing the company
 * decided on your behalf.
 */
const PAYROLL_ROAD: readonly SpaceContent[] = [
  {
    id: 'bo-payroll-seniority', kind: 'normal', title: 'The Seniority List',
    description: 'Nobody has left this office in a decade, so the desk above yours only comes free when somebody finally retires. Roll to see whether this was the year.',
    effect: { type: 'promotion', reason: 'The desk above came free' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
]

/**
 * Own-Account Alley: the raise arrives because you left. Going independent
 * is the national default, not a rebellion — a compulsory re-draw at the
 * head, and a stretch of paperwork where the licence fees find you between
 * incomes.
 */
const OWN_ACCOUNT_ALLEY: readonly SpaceContent[] = [
  {
    id: 'bo-own-lookout', kind: 'normal', title: 'Word Gets Around',
    description: 'You start putting the word out at the end of every visit, and the calls start coming back before the badge is even handed in.',
    effect: { type: 'none' },
    tone: 'orange', icon: 'space:headhunted',
  },
  {
    id: 'bo-own-account', kind: 'event', title: 'Your Own Account',
    description: 'You hand back the badge with the next thing already planned. Your mother is horrified; your cousin buys the first round. The new work comes with a new number attached.',
    effect: { type: 'careerChange', reason: 'You went out on your own account', compulsory: true },
    tone: 'orange', icon: 'space:headhunted',
  },
  {
    id: 'bo-own-first-contract', kind: 'payday', title: 'The First Big Contract',
    description: 'Your first client on your own account pays on delivery, in full, in cash — and it lands like a whole month\'s wage that nobody above you took a slice of.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season',
  },
]

/** Market Street, second half: the review, the layoff, and the goldsmiths' window. */
const MARKET_STREET_LATE: readonly SpaceContent[] = [
  {
    id: 'bo-main-review', kind: 'event', title: 'The Review',
    description: 'A small back room, two people with the year\'s ledger open between them, and one question: are you ready to run more than you run now? Roll, and hear what they say.',
    effect: { type: 'promotion', reason: 'Your review came round' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
  setback('veryHard', 'bo-main-tax-audit', 'Tax Audit',
    'A very formal letter, a long afternoon with a shoebox of receipts, and a figure at the bottom that has clearly already been decided.',
    { type: 'payMoney', amount: 15_000, reason: 'Tax audit settlement' },
    'slate', 'space:refund-check'),
  {
    id: 'bo-main-contract-ends', kind: 'normal', title: 'Contract Ends',
    description: 'The contract everyone swore blind would renew in January is, very quietly, not renewed. The farewell cake is excellent.',
    effect: { type: 'loseCareer', reason: 'Contract not renewed' },
    tone: 'orange', icon: 'space:layoff-notice', appearsFrom: 'hard',
  },
  {
    id: 'bo-main-layoff', kind: 'normal', title: 'The Restructuring',
    description: 'The whole floor is called into one meeting with a consultant from the capital, and afterwards your badge stops working.',
    effect: { type: 'loseCareer', reason: 'Restructured out' },
    tone: 'orange', icon: 'space:layoff-notice',
  },
  {
    id: 'bo-main-career-fair', kind: 'stop', title: 'The Hiring Fair',
    description: 'A hall of booths, free pens, a brass band warming up outside for an unrelated reason, and two offers you have to pick between.',
    effect: { type: 'careerChange', reason: 'A fresh start at the hiring fair' },
    tone: 'orange', icon: 'space:career-fair-return',
  },
  {
    id: 'bo-main-godparent', kind: 'normal', title: 'Godparent of Everything',
    description: 'This year you are named godparent of a baptism, a graduation and a roof-raising — an honour each time, and a gift each time, for everyone at the table.',
    effect: { type: 'payEach', amount: 800, reason: 'An honour, and a gift, each' },
    tone: 'slate', icon: 'space:surprise-bonus',
  },
]

const MARRIAGE: SpaceContent = {
  id: 'bo-wedding', kind: 'event', title: 'Wedding Day',
  description: 'The registry office on Thursday, the church on Saturday, and then the fiesta — where every guest is godparent of something, from the cake to the band, and the sponsorships are announced out loud to applause.',
  effect: { type: 'getMarried' },
  tone: 'pink', icon: 'space:wedding-day',
}

/** Family Lane: the beats every Bolivian parent knows, in order of arrival. */
const FAMILY_LANE: readonly SpaceContent[] = [
  {
    id: 'bo-family-nursery', kind: 'normal', title: 'Nursery Setup',
    description: 'You paint the nursery a cheerful yellow, assemble a crib at midnight, and accept a hand-knitted mountain of impossibly small clothes from every aunt at once.',
    effect: { type: 'payMoney', amount: 2_000, reason: 'Nursery setup' },
    tone: 'purple', icon: 'space:nursery-setup',
  },
  {
    id: 'bo-family-new-baby', kind: 'event', title: 'New Baby',
    description: 'A tiny new roommate arrives, and is immediately declared by four separate grandmothers to look exactly like four separate people.',
    effect: { type: 'haveChildren', count: 1, celebrationPerPip: 600 },
    tone: 'purple', icon: 'space:new-baby',
  },
  setback('hard', 'bo-family-childcare', 'Childcare Bill',
    'A nursery place for every small person in the house, and a monthly total you read twice.',
    { type: 'payPerChild', amount: 5_000, reason: 'Childcare per child' },
    'purple', 'space:nursery-setup'),
  {
    id: 'bo-family-school-list', kind: 'normal', title: 'The School List',
    description: 'The uniform, the white smock, the gym kit, and a supply list with forty-one items — each child\'s name to be sewn, not written, into every single one before the first day.',
    effect: { type: 'payPerChild', amount: 3_000, reason: 'The school list per child' },
    tone: 'purple', icon: 'space:school-fees',
  },
  {
    id: 'bo-family-parade', kind: 'normal', title: 'The Civic Parade',
    description: 'Your child is chosen to carry the school banner at the independence parade, and you film all ninety seconds they are visible.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:school-play',
  },
  {
    id: 'bo-family-twins', kind: 'normal', title: 'Twins',
    description: 'The technician goes quiet at the scan, turns the screen around, and holds up two fingers. Four grandmothers begin knitting simultaneously in four districts.',
    effect: { type: 'haveChildren', count: 2, celebrationPerPip: 1_100 },
    tone: 'purple', icon: 'space:second-baby',
  },
]

/** Career Track: the work is real and so are the raises. */
const CAREER_TRACK: readonly SpaceContent[] = [
  payday('bo-fast-payday-1', 'The overtime finally shows up in the envelope.'),
  {
    id: 'bo-fast-headhunted', kind: 'normal', title: 'Headhunted',
    description: 'A rival firm has been asking about you at the trade fair, and the call comes with two offers, a deadline, and your current salary already known to the centavo.',
    effect: { type: 'careerChange', reason: 'Headhunted for something new' },
    tone: 'orange', icon: 'space:headhunted',
  },
  setback('hard', 'bo-fast-burnout', 'Burnout Leave',
    'Six weeks signed off with a doctor\'s note, and the envelope is a great deal lighter by the time you walk back in.',
    { type: 'payMoney', amount: 12_000, reason: 'Unpaid leave' },
    'orange', 'space:steady-hustle'),
  {
    id: 'bo-fast-payday-severance', kind: 'payday', title: 'Year-End Payroll',
    description: 'The year winds down, and whatever this job pays lands in your account one more time before everything changes again.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', appearsFrom: 'veryHard',
  },
  {
    id: 'bo-fast-reorg', kind: 'normal', title: 'The Reorganisation',
    description: 'A consultant flies in, the org chart is redrawn behind a closed door, and your name comes back in a different box with a different title under it. Nobody asked you; nobody asked anybody.',
    effect: { type: 'careerChange', reason: 'Reorganised into a new role', compulsory: true },
    tone: 'orange', icon: 'space:career-fair-return', appearsFrom: 'veryHard',
  },
  {
    id: 'bo-fast-brokerage', kind: 'normal', title: 'The Brokerage Call',
    description: 'You are itching to spend the bonus, and the broker has been leaving voicemails with exclamation marks in them.',
    effect: { type: 'buyStock' },
    tone: 'orange', icon: 'finance:trading-floor',
  },
  payday('bo-fast-payday-2', 'Another month down, another envelope in.', missedPayday(
    'hard',
    'Bonus Clawback',
    'Last year\'s bonus is reassessed by an auditor in another city, and reassessed downwards.',
    6_000,
    'Bonus clawed back',
  )),
  {
    id: 'bo-fast-retention', kind: 'normal', title: 'Retention Offer',
    description: 'You mention, lightly, over lunch, that somebody else has been in touch. The counter-offer arrives before the soup does.',
    effect: { type: 'payRaise' },
    tone: 'orange', icon: 'space:pay-raise-talk',
  },
]

/**
 * Midtown: the money act. The insurance office sells what the high city
 * actually fears, the household tiles learn about the shared purse, and the
 * trunk carries the hazards so that everybody — not half the table — walks
 * them.
 */
const MIDTOWN: readonly SpaceContent[] = [
  {
    id: 'bo-midtown-brokerage', kind: 'normal', title: 'The Brokerage',
    description: 'Screens everywhere, a queue of pensioners at the counter, and a broker who insists this one is different.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'finance:trading-floor',
  },
  {
    id: 'bo-midtown-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Before anyone hands you a set of house keys, someone would like a word about cover — and unrolls a hazard map of your hillside that is thorough, recent, and quietly terrifying.',
    // No auto cover at this window: both crash tiles are behind a pawn
    // standing here, so a policy sold at this desk could never pay out.
    // The broker sells what this stretch of road can actually bill for.
    effect: { type: 'buyInsurance', kinds: ['home', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office',
  },
  // The only payday in this stretch too — see bo-main-payday-1. Harshening it
  // zeroed Very Hard's income for the whole run between the marriage fork and
  // the home-buying fork, so it stays unconditional.
  payday('bo-midtown-payday', 'The month\'s money lands the week the deposit on a house is due.'),
  {
    id: 'bo-midtown-shared-purse', kind: 'normal', title: 'The Shared Purse',
    description: 'The money is pooled now — the wage, the stall\'s takings, and the dollar envelope taped behind the wardrobe that officially does not exist. Settling the month is a summit meeting.',
    effect: { type: 'household', reason: 'The shared purse, settled up' },
    tone: 'purple', icon: 'finance:bank-visit',
  },
  {
    id: 'bo-midtown-aguinaldo', kind: 'payday', title: 'December Pays Twice',
    description: 'The thirteenth wage lands with the holidays, sized to what each of you earns rather than to what anybody promised, and the whole country goes shopping the same weekend.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season',
  },
  {
    id: 'bo-midtown-raise', kind: 'normal', title: 'Mid-Career Raise',
    description: 'A quiet word by the lift, a new number, and a handshake of exactly matched firmness on the way out.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk',
  },
  setback('veryHard', 'bo-midtown-dollar-jump', 'The Dollar Jumps',
    'The dollar stops being a fact and becomes a rumour: the street rate leaves the official one behind, and everything imported reprices overnight.',
    { type: 'payMoney', amount: 14_000, reason: 'Everything imported reprices' },
    'slate', 'space:market-crash'),
]

const HOME_BUYING: SpaceContent = {
  id: 'bo-buying-walls', kind: 'stop', title: 'Buying the Walls',
  description: 'A Saturday of viewings from adobe courtyard to mirrored cholet, with everyone advising you at once. Here, you buy the walls first and the dream grows a floor at a time.',
  effect: { type: 'buyHouse' },
  tone: 'gold', icon: 'space:house-hunting',
}

/** The Dollar Road: imports, hoarded greenbacks, and a cousin with a plan. */
const DOLLAR_ROAD: readonly SpaceContent[] = [
  {
    id: 'bo-risky-container', kind: 'normal', title: 'The Container Bet',
    description: 'Your cousin knows a man at the free port on the coast, and your savings fill one shared container — roll to see what the market thinks of the instinct.',
    effect: { type: 'spinForMoney', perPip: 3_100, reason: 'The container comes in' },
    tone: 'pink', icon: 'space:startup-bet',
  },
  {
    id: 'bo-risky-bad-tip', kind: 'normal', title: 'Bad Stock Tip',
    description: 'The "sure thing" you announced to the whole table over dice night loses half its value in a week, and honour demands you buy everyone dinner about it.',
    effect: { type: 'payEach', amount: 2_000, reason: 'Bad stock tip' },
    tone: 'pink', icon: 'space:stock-tip',
  },
  {
    id: 'bo-risky-cacho', kind: 'normal', title: 'Dice Night',
    description: 'The leather cup, five dice, and the national bar game played for friendly stakes — and you roll the five-of-a-kind at the exact moment it matters most.',
    effect: { type: 'collectFromEach', amount: 2_500, reason: 'Dice night winnings' },
    tone: 'pink', icon: 'space:poker-night',
  },
  {
    id: 'bo-risky-boom-ends', kind: 'normal', title: 'The Boom Ends',
    description: 'The commodity your whole portfolio depends on goes out of fashion on three continents in one quarter, and you lose money fast.',
    effect: { type: 'payMoney', amount: 9_000, reason: 'The boom ends' },
    tone: 'pink', icon: 'space:market-crash',
  },
  setback('hard', 'bo-risky-aftershock', 'Aftershock',
    'The market finds a lower floor than anyone believed it had, and finds it inside a single afternoon.',
    { type: 'payMoney', amount: 16_000, reason: 'The market falls again' },
    'pink', 'space:market-crash'),
  {
    id: 'bo-risky-lottery', kind: 'normal', title: 'The Christmas Lottery',
    description: 'You queue at the kiosk everyone swears is lucky, because the lucky kiosk is famously lucky. Roll for what the queue was worth.',
    effect: { type: 'spinForMoney', perPip: 5_500, reason: 'The Christmas draw' },
    tone: 'pink', icon: 'space:lottery-ticket',
  },
  payday('bo-risky-payday', 'The month\'s money lands while your investments are busy misbehaving.'),
  {
    id: 'bo-risky-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One handshake over a long lunch, one signature before the coffee, and you and the front-runner trade bank balances.',
    effect: { type: 'swapMoneyWithLeader', reason: 'A deal with the front-runner' },
    tone: 'pink', icon: 'space:rival-swap',
  },
]

/** Steady Street: the notebook, the savings pool, and the tin under the bed. */
const STEADY_STREET: readonly SpaceContent[] = [
  {
    id: 'bo-safe-market-timing', kind: 'normal', title: 'Market Arithmetic',
    description: 'You know which afternoon the prices drop, which stall rounds down, and which seller owes you a favour. Today, the knowledge pays for the whole basket.',
    effect: { type: 'gainMoney', amount: 800, reason: 'Knowing the market' },
    tone: 'green', icon: 'space:coupon-clipping',
  },
  payday('bo-safe-payday', 'The month\'s money arrives on the day it always has, which is the whole idea.', missedPayday(
    'veryHard',
    'Wages Withheld',
    'A cell in a spreadsheet somewhere means this month\'s wages will arrive next month instead.',
    1_000,
    'Wages held over a month',
  )),
  setback('hard', 'bo-safe-excess', 'Policy Excess',
    'The careful road has claim forms too, and the fine print on yours hides a fee called the excess — and it is far from small.',
    { type: 'payMoney', amount: 1_000, reason: 'Policy excess' },
    'green', 'finance:insurance-office'),
  {
    id: 'bo-safe-notebook', kind: 'normal', title: 'The Household Notebook',
    description: 'You keep the household accounts in a ruled notebook for a whole year, column by column, and the notebook quietly wins.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'The notebook balances ahead' },
    tone: 'green', icon: 'space:budget-win',
  },
  {
    id: 'bo-safe-neighbour-repays', kind: 'normal', title: 'The Neighbour Repays',
    description: 'A loan you made in a hard year and never once mentioned comes back across the courtyard, wrapped in a cloth, with a cake on top.',
    effect: { type: 'gainMoney', amount: 1_400, reason: 'An old kindness returns' },
    tone: 'green', icon: 'space:refund-check',
  },
  {
    id: 'bo-safe-mattress-dollars', kind: 'normal', title: 'The Envelope Grows',
    description: 'Nothing dramatic happens — the dollar envelope taped behind the wardrobe just quietly gets thicker, the way it has since your grandmother taught you where to tape it.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'Quiet savings' },
    tone: 'green', icon: 'space:quiet-savings',
  },
  payday('bo-safe-payday-2', 'Another month, another quiet fold of notes. Steady is a strategy.'),
  {
    id: 'bo-safe-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The steady half of your portfolio posts its steady little cheque, plus the brewery\'s shareholder crate.',
    effect: { type: 'stockDividend', perShare: 2_500, reason: 'Quarterly dividend' },
    tone: 'green', icon: 'space:dividend-day',
  },
]

/** Sunset Years: the sharpest material on the board, played warm. */
const SUNSET_YEARS: readonly SpaceContent[] = [
  {
    id: 'bo-sunset-number', kind: 'stop', title: 'The Envelope Arithmetic',
    description: 'One evening you spread it all on the table: the pension statement, what the business would fetch, the dollar envelope. The number at the bottom is smaller than you feared — and it does not withdraw itself.',
    effect: { type: 'retireEarly' },
    tone: 'gold', icon: 'space:retirement-fund',
  },
  {
    id: 'bo-sunset-one-more-floor', kind: 'normal', title: 'One More Floor',
    description: 'The builder who did the last floor calls about the next one: the columns will take it, the view would be magnificent, and he happens to be free.',
    effect: { type: 'upgradeHouse' },
    tone: 'slate', icon: 'space:home-upgrade',
  },
  {
    id: 'bo-sunset-storeroom-fire', kind: 'normal', title: 'The Storeroom',
    description: 'A decade of stock, one old fuse, and a storeroom that needs rebuilding from the shelves up.',
    effect: { type: 'payMoney', amount: 24_000, reason: 'Storeroom fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire',
  },
  setback('hard', 'bo-sunset-parents', 'Caring for Your Parents',
    'Somebody who once carried you up four flights of market stairs now needs carrying. You would never count the cost. The invoice counts it anyway.',
    { type: 'payMoney', amount: 20_000, reason: 'Caring for family' },
    'slate', 'space:family-portrait'),
  payday('bo-sunset-payday-1', 'One of the very last envelopes lands.'),
  {
    id: 'bo-sunset-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One last bold deal over a very long lunch, and the leader\'s fortune ends up in your pocket instead of theirs.',
    effect: { type: 'swapMoneyWithLeader', reason: 'The last-minute swap' },
    tone: 'slate', icon: 'space:rival-swap',
  },
  {
    id: 'bo-sunset-children-send', kind: 'normal', title: 'The Children Provide',
    description: 'Every grown-up child arrives for Sunday lunch with something for the house — and the one working abroad wires her share with a voice note longer than the transfer.',
    effect: { type: 'collectPerChild', amount: 4_000, reason: 'From each child' },
    tone: 'slate', icon: 'space:child-benefit',
  },
  {
    id: 'bo-sunset-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'Over the good coffee, you begin talking the front-runner out of their finest story.',
    effect: { type: 'stealLifeTile', reason: 'A story changes hands' },
    tone: 'slate', icon: 'space:sticky-fingers',
  },
  {
    id: 'bo-sunset-last-title', kind: 'normal', title: 'One Last Title',
    description: 'The association wants to make you honorary president before you go, if the vote lands. Roll, and let the last election of your life decide it.',
    effect: { type: 'promotion', reason: 'The last election of your life' },
    tone: 'slate', icon: 'space:big-promotion',
  },
  payday('bo-sunset-payday-2', 'You stopped counting the paydays years ago; the calendar has not.'),
  setback('veryHard', 'bo-sunset-final-tax', 'Final Tax Bill',
    'One last formal envelope from the tax office arrives before the shutters come down for good.',
    { type: 'payMoney', amount: 22_000, reason: 'Final tax bill' },
    'slate', 'space:refund-check'),
  flavour('bo-sunset-ahead', 'Sunset Ahead', 'From the rooftop, the mountain turns rose-gold at dusk, the way it has every evening you were too busy to look.', 'slate', 'space:sunset-ahead'),
]

const RETIREMENT: SpaceContent = {
  id: 'bo-retirement', kind: 'retirement', title: 'Retirement Day',
  description: 'You hand over the keys — to the office, the stall, or both — get covered in confetti by people who love you, and wake up to the first morning in forty years with nowhere to be.',
  effect: { type: 'retire' },
  tone: 'gold', icon: 'space:retirement',
}

// ---------------------------------------------------------------------------
// The route: start, four forks, four trunk runs, and retirement — the same
// grammar as every edition, with the summaries written as the two relatives
// at Sunday lunch, because the argument at the table is the content.
// ---------------------------------------------------------------------------

const UNIVERSITY_BRANCH: RouteBranch = {
  identity: {
    name: 'University Lane',
    summary: 'Five years, an entrance exam, and a thesis defended in front of your whole family in their best clothes. The bill is the years themselves, paid before you earn a thing — and the title it buys goes in front of your name forever. Dependable, never enormous.',
  },
  spaces: [...UNIVERSITY_LANE, GRAD_FAIR],
}

const WORK_BRANCH: RouteBranch = {
  identity: {
    name: 'Straight to Work',
    summary: 'The market takes you the day you show up and pays you years before the students earn a thing. No safety net, and a trade that is really a business at three sizes — the bottom is hard graft, and the top out-earns every graduate at this table.',
  },
  spaces: WORK_LANE,
}

const PAYROLL_BRANCH: RouteBranch = {
  identity: {
    name: 'Payroll Road',
    summary: 'Stay on the books. The pension accrues, December pays double by law, and the raises come by seniority, slowly and without fail. The company also decides which city you live in.',
  },
  spaces: PAYROLL_ROAD,
}

const OWN_ACCOUNT_BRANCH: RouteBranch = {
  identity: {
    name: 'Own-Account Alley',
    summary: 'Go out on your own account, like most of the country before you. You trade the pension for the whole price of your own work — glorious if you drew badly the first time, and a real risk if you did not.',
  },
  spaces: OWN_ACCOUNT_ALLEY,
}

const FAMILY_BRANCH: RouteBranch = {
  identity: {
    name: 'Family Lane',
    summary: 'School lists, charango practice, and a house full of noise, with every grown-up child giving something back at the end. Far fewer paydays, and every bill arrives multiplied.',
  },
  spaces: FAMILY_LANE,
}

const CAREER_BRANCH: RouteBranch = {
  identity: {
    name: 'Career Track',
    summary: 'The raises are real, and so are the bonuses, the board seat and the corner office with the mountain view. What you gave up for all of it is written down on the other lane.',
  },
  spaces: CAREER_TRACK,
}

const DOLLAR_BRANCH: RouteBranch = {
  identity: {
    name: 'The Dollar Road',
    summary: 'Containers, margin, hoarded dollars and a cousin with a plan. Whoever is behind at the house should be here; whoever is ahead should think hard about it.',
  },
  spaces: DOLLAR_ROAD,
}

const STEADY_BRANCH: RouteBranch = {
  identity: {
    name: 'Steady Street',
    summary: 'The notebook, the savings pool, the fixed deposit, and the envelope taped behind the wardrobe. Nobody ever got rich down here, or ruined — which is worth a great deal if you are already winning.',
  },
  spaces: STEADY_STREET,
}

export const ROUTE_BOLIVIA: RouteDefinition = {
  segments: [
    fork(START, UNIVERSITY_BRANCH, WORK_BRANCH),
    run('market street', MARKET_STREET_EARLY),
    fork(MID_CAREER_FORK, PAYROLL_BRANCH, OWN_ACCOUNT_BRANCH),
    run('market street, after the crossroads', MARKET_STREET_LATE),
    fork(MARRIAGE, FAMILY_BRANCH, CAREER_BRANCH),
    run('midtown', MIDTOWN),
    fork(HOME_BUYING, DOLLAR_BRANCH, STEADY_BRANCH),
    run('sunset years', SUNSET_YEARS),
  ],
  terminal: RETIREMENT,
}
