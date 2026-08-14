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
  ...flavour(EVERY_BOARD, 'bo-start', 'Start of Life', 'Your journey begins one bright cold morning on the rim of the high city, the whole valley of lights below and the mountain keeping an eye on you.', 'slate', 'space:start-of-life'),
  kind: 'start',
}

/**
 * University Lane: the public university is nearly free by the credit and
 * expensive by the calendar — five years, the entrance exam, the photocopies,
 * the thesis defended in front of your entire extended family. The tuition
 * stop and the loan tile carry the same measured weight as every edition's.
 */
const UNIVERSITY_LANE: readonly SpaceContent[] = [
  flavour(STANDARD_UP, 'bo-uni-move-in', 'A Room in the City', 'Your first rented room holds a bed, a hotplate, a poster of the national team, and every ambition you have.', 'blue', 'space:move-in-day', {
    from: 'hard',
    description: 'Your first rented room holds a bed and a hotplate — and the landlady would like two months up front, plus a reference from somebody she already knows.',
    effect: { type: 'payMoney', amount: 1_400, reason: 'Two months up front' },
  }),
  {
    id: 'bo-uni-entrance', kind: 'stop', title: 'The Entrance Exam',
    description: 'One Monday morning, three thousand hopefuls, one gymnasium of desks. You pass — and then come five years of fees, photocopies, materials and city rent, due before anyone shows you the library.',
    effect: { type: 'payMoney', amount: 0, reason: 'Five years of a degree' },
    tone: 'blue', icon: 'space:tuition-bill', tier: EVERY_BOARD, unscaled: true,
    amountFrom: 'collegeTuition',
  },
  flavour(LONG_ONLY, 'bo-uni-photocopies', 'The Photocopy Shop', 'Nobody buys the textbook. There is a shop by the gate that has photocopied it for thirty years, and a hot corn drink at dawn to read it over.', 'blue', 'space:late-night-study', {
    from: 'hard',
    description: 'Nobody buys the textbook — but the shop by the gate charges by the page, and this semester runs to eleven hundred pages.',
    effect: { type: 'payMoney', amount: 500, reason: 'A semester by the page' },
  }),
  setback('veryHard', STANDARD_UP, 'bo-uni-laptop', 'Laptop Dies',
    'The laptop dies mid-sentence, two days before the thesis is due, taking chapter four with it. The replacement is urgent, imported, and priced accordingly.',
    { type: 'payMoney', amount: 3_000, reason: 'Emergency laptop' },
    'blue', 'space:late-night-study'),
  {
    id: 'bo-uni-lab-keys', kind: 'normal', title: 'The Lab Keys',
    description: 'You mark first-year problem sets, hold the lab keys, and run the projector nobody else can start — and the faculty actually pays for it.',
    effect: { type: 'gainMoney', amount: 9_000, reason: 'Faculty assistant hours' },
    tone: 'blue', icon: 'space:campus-job', tier: EVERY_BOARD,
  },
  setback('hard', EVERY_BOARD, 'bo-uni-lost-carnet', 'The Lost ID Card',
    'Your identity card vanishes somewhere on a minibus, and replacing it takes two offices, four queues, one notary, and fees at every desk.',
    { type: 'payMoney', amount: 2_500, reason: 'Reissuing every document' },
    'blue', 'finance:bank-visit'),
  flavour(LONG_ONLY, 'bo-uni-group-project', 'The Group Presentation', 'Five names on the cover, one person doing the slides. The giant printed banner is, somehow, also your responsibility.', 'blue', 'space:group-project', {
    from: 'hard',
    description: 'Five names on the cover, one person doing the slides — and the print shop charges by the square metre for the giant banner all five of you are graded on.',
    effect: { type: 'payMoney', amount: 400, reason: 'The banner, printed huge' },
  }),
  {
    id: 'bo-uni-scholarship', kind: 'normal', title: 'The Merit Scholarship',
    description: 'The faculty\'s excellence scholarship lands on your grades of all grades, and it covers a serious chunk of the years remaining.',
    effect: { type: 'gainMoney', amount: 24_000, reason: 'Merit scholarship' },
    tone: 'blue', icon: 'space:scholarship-win', tier: STANDARD_UP,
  },
  {
    id: 'bo-uni-bread-weeks', kind: 'normal', title: 'Bread and Api Weeks',
    description: 'Dinner is fresh rolls and hot purple-corn drink from the corner stand for a fortnight, and the grocery bill still stings.',
    effect: { type: 'payMoney', amount: 600, reason: 'Groceries on a student budget' },
    tone: 'blue', icon: 'space:grocery-run', tier: LONG_ONLY,
  },
  flavour(STANDARD_UP, 'bo-uni-finals', 'Finals Week', 'Five exams in four days, and the photocopied notes of three different generations spread across one bed.', 'blue', 'space:finals-week', {
    from: 'hard',
    description: 'Five exams in four days, and a crash course you panic-buy for the one subject whose professor grades like a hailstorm.',
    effect: { type: 'payMoney', amount: 1_600, reason: 'The crash course' },
  }),
  {
    id: 'bo-uni-internship', kind: 'normal', title: 'The Internship',
    description: 'A summer of stapling reports at a development agency ends with a stipend far more generous than the stapling deserved.',
    effect: { type: 'gainMoney', amount: 5_000, reason: 'Internship stipend' },
    tone: 'blue', icon: 'space:new-skills', tier: LONG_ONLY,
  },
  {
    id: 'bo-uni-pitch', kind: 'normal', title: 'Pitch Night',
    description: 'You pitch your dorm-room idea at a startup night in the lowland boom city — spin to see who bites.',
    effect: { type: 'spinForMoney', perPip: 400, reason: 'Pitch night winnings' },
    tone: 'blue', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'bo-uni-exchange', kind: 'normal', title: 'The Exchange Semester',
    description: 'A semester over the border costs a fortune, rearranges how you see everything, and ruins you permanently for weak coffee.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'Semester abroad' },
    tone: 'blue', icon: 'space:weekend-trip', tier: STANDARD_UP,
  },
  {
    id: 'bo-uni-uncle', kind: 'normal', title: 'The Uncle\'s Ledger',
    description: 'The uncle who covered the years the scholarship did not would never, ever ask. You pay him back anyway, month by month, because that is how it works.',
    effect: { type: 'payMoney', amount: 5_000, reason: 'Paying the family back' },
    tone: 'blue', icon: 'finance:bank-visit', tier: STANDARD_UP,
  },
  {
    id: 'bo-uni-defence', kind: 'stop', title: 'The Thesis Defence',
    description: 'Three professors, one projector, and your entire extended family in the back rows dressed for a wedding. You pass, and the flowers arrive before the verdict is finished.',
    effect: { type: 'graduate' },
    tone: 'blue', icon: 'space:cap-and-gown', tier: EVERY_BOARD,
  },
]

const GRAD_FAIR: SpaceContent = {
  id: 'bo-grad-fair', kind: 'stop', title: 'The Professionals\' Fair',
  description: 'The degree is framed and the title goes in front of your name forever. Two firms want it on their letterhead; pick one.',
  effect: { type: 'chooseCareer', pool: 'graduate' },
  tone: 'gold', icon: 'space:grad-job-fair', tier: EVERY_BOARD,
}

/**
 * Straight to Work: the market takes you Monday. The lane's structural
 * promise — earning on tile one, paid before the students have unpacked —
 * is the informal economy's whole argument, and the rest of the lane is the
 * gamble the player asked for: a grill cart bet, a scratch card, and rent
 * that is due whatever the week did.
 */
const WORK_LANE: readonly SpaceContent[] = [
  {
    id: 'bo-market-monday', kind: 'stop', title: 'Monday at the Market',
    description: 'Your aunt has a stall, and the stall next to hers needs a pair of hands. By Friday you know every price in the hall and you are being paid — years before the students earn a thing.',
    effect: { type: 'chooseCareer', pool: 'basic' },
    tone: 'gold', icon: 'space:first-job-fair', tier: EVERY_BOARD,
  },
  {
    id: 'bo-work-first-pay', kind: 'normal', title: 'First Week\'s Takings',
    description: 'Your first real money lands in your hand, folded small. Following custom, you buy the family Sunday lunch with it, and they let you pay with visible pride.',
    effect: { type: 'gainMoney', amount: 2_000, reason: 'First week\'s takings' },
    tone: 'orange', icon: 'space:first-paycheck', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'bo-work-payday-1', 'A full month\'s work in your pocket while your classmates are still queueing to enrol.', missedPayday(
    'veryHard',
    'Paid at Month\'s End',
    'Nobody mentioned that the first month is paid at the end of the second, and the hotplate does not care.',
    900,
    'A month of living on nothing',
  )),
  {
    id: 'bo-work-moving-out', kind: 'stop', title: 'Moving Out',
    description: 'You are earning, so you are expected to be housed: a deposit, a first month up front, a mattress, and a two-ring stove you carry up four flights yourself.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'Deposit and first month' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD, unscaled: true,
  },
  {
    id: 'bo-work-association', kind: 'stop', title: 'The Association Fee',
    description: 'Nobody trades on this row without joining the traders\' association: an entry fee, a folder of stamps, and a monthly quota the treasurer collects in person.',
    effect: { type: 'payMoney', amount: 1_500, reason: 'Joining the association' },
    tone: 'orange', icon: 'space:rent-due', tier: EVERY_BOARD, appearsFrom: 'hard',
  },
  {
    id: 'bo-work-feria-sunday', kind: 'normal', title: 'Feria Sunday',
    description: 'The giant open-air market swells to twice the city on Sundays, and a stall in the right row sells everything it can carry.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'Sunday takings' },
    tone: 'orange', icon: 'space:overtime-shift', tier: STANDARD_UP,
  },
  {
    id: 'bo-work-grill-bet', kind: 'normal', title: 'The Grill Cart Bet',
    description: 'Every boliviano you have goes into a second-hand cart, a grill, and a peanut sauce recipe your grandmother priced at one favour — spin to see what the night corner does.',
    effect: { type: 'spinForMoney', perPip: 2_000, reason: 'What the grill cart took' },
    tone: 'orange', icon: 'career:food-truck-owner', tier: STANDARD_UP,
  },
  setback('veryHard', STANDARD_UP, 'bo-work-late-rent', 'Late Rent',
    'The rent goes in four days late, and the landlady\'s nephew is on the doorstep before your apology is.',
    { type: 'payMoney', amount: 2_500, reason: 'Late rent penalty' },
    'orange', 'space:rent-due'),
  payday(EVERY_BOARD, 'bo-work-payday-2', 'Another month, another fold of notes, and still nobody has ever asked to see a certificate.', missedPayday(
    'hard',
    'Blockade Week',
    'A road blockade seals the pass for eight days. Nothing arrives, nothing sells, and everyone stands at their stalls discussing it at length.',
    1_200,
    'A week the roads were closed',
  )),
  flavour(LONG_ONLY, 'bo-work-licence', 'The Professional Licence', 'A weekend course, one written test, and a driver\'s licence category your boss treats like a knighthood.', 'orange', 'space:new-skills', {
    from: 'hard',
    description: 'A weekend course, one written test, and a licence category your boss treats like a knighthood — with the course fee yours to find.',
    effect: { type: 'payMoney', amount: 800, reason: 'Course fee' },
  }),
  flavour(STANDARD_UP, 'bo-work-caseras', 'The Regulars', 'You have regulars now — customers who come to you and nobody else, get the little extra on top of every sale, and expect the same forever. This is the local equivalent of a credit rating, and it is better.', 'orange', 'space:steady-hustle'),
  payday(EVERY_BOARD, 'bo-work-payday-3', 'Three months in, and the folded notes have stopped feeling like a surprise.'),
  {
    id: 'bo-work-fiesta-crates', kind: 'normal', title: 'Fiesta Weekend',
    description: 'Two days hauling crates and rigging lights for the neighbourhood\'s patron saint pays better than it has any right to.',
    effect: { type: 'gainMoney', amount: 900, reason: 'Fiesta weekend work' },
    tone: 'orange', icon: 'space:side-hustle', tier: LONG_ONLY,
  },
  {
    id: 'bo-work-scratch', kind: 'normal', title: 'Scratch Card',
    description: 'Bought at the kiosk with the change from the salteña, scratched against the kiosk itself — spin for what is under the foil.',
    effect: { type: 'spinForMoney', perPip: 1_200, reason: 'Under the foil' },
    tone: 'orange', icon: 'space:lottery-ticket', tier: LONG_ONLY,
  },
  {
    id: 'bo-work-fares', kind: 'normal', title: 'The Commute',
    description: 'Two minibuses and a cable car each way, every day, one small fare at a time. It adds up the way rain does.',
    effect: { type: 'payMoney', amount: 400, reason: 'A month of fares' },
    tone: 'orange', icon: 'space:car-trouble', tier: LONG_ONLY,
  },
  {
    id: 'bo-work-mind-the-row', kind: 'normal', title: 'Minding the Row',
    description: 'The stall holders\' meeting needs somebody to hold the keys, open the row at six, and keep the book. Spin: it might as well be you.',
    effect: { type: 'promotion', reason: 'Somebody has to hold the keys' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: LONG_ONLY,
  },
]

/**
 * Market Street, first half: the years between the first wage and the first
 * serious question about where the wage comes from.
 */
const MARKET_STREET_EARLY: readonly SpaceContent[] = [
  flavour(STANDARD_UP, 'bo-main-apartment', 'Apartment Hunt', 'You sign for a place described as "with projection", which means the rebar for the next floor is included in the view.', 'slate', 'space:apartment-hunt', {
    from: 'hard',
    description: 'You sign for a place described as "with projection" — and the landlord would have preferred the local custom of two years\' rent up front, so the monthly deposit is priced to make the point.',
    effect: { type: 'payMoney', amount: 2_200, reason: 'Deposit and agent\'s fee' },
  }),
  {
    id: 'bo-main-probation', kind: 'normal', title: 'Probation Review',
    description: 'Three months in, the boss watches you work a whole morning without saying anything at all. Then she says something. Spin.',
    effect: { type: 'promotion', reason: 'The end of probation' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'bo-main-mercado-run', kind: 'normal', title: 'The Mercado Run',
    description: 'You go for potatoes and come home with a full bag, a free handful of herbs on top, and somehow less money than the arithmetic allows.',
    effect: { type: 'payMoney', amount: 800, reason: 'The market got you' },
    tone: 'slate', icon: 'space:grocery-run', tier: LONG_ONLY,
  },
  {
    id: 'bo-main-bank', kind: 'normal', title: 'Bank Visit',
    description: 'The queue wraps the block twice, moves with geological patience, and the teller asks warmly how the money is treating you.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit', tier: EVERY_BOARD,
  },
  {
    id: 'bo-main-remittance', kind: 'normal', title: 'An Envelope from Madrid',
    description: 'Your sister has been working in Spain for three years. A transfer arrives with a voice note attached, and the voice note is longer than the money.',
    effect: { type: 'gainMoney', amount: 1_500, reason: 'A remittance from abroad' },
    tone: 'slate', icon: 'space:side-hustle', tier: LONG_ONLY,
  },
  {
    id: 'bo-main-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'The broker unrolls a laminated map of your neighbourhood marked for hail, landslide and lightning. It is thorough, recent, and quietly terrifying.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office', tier: EVERY_BOARD,
  },
  {
    id: 'bo-main-burnout', kind: 'normal', title: 'Burnout',
    description: 'A year of the day job, the evening job and the Sunday stall, and one Monday morning you simply cannot get up. The work does not wait.',
    effect: { type: 'loseCareer', reason: 'Run empty, and the work did not wait' },
    tone: 'orange', icon: 'space:steady-hustle', tier: STANDARD_UP,
  },
  {
    id: 'bo-main-futsal', kind: 'normal', title: 'The Futsal League',
    description: 'You join the neighbourhood five-a-side league. The registration is modest; the post-match rounds are not.',
    effect: { type: 'payMoney', amount: 400, reason: 'League season' },
    tone: 'slate', icon: 'space:gym-membership', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'bo-main-payday-1', 'The month\'s money lands, minus nothing for once. The best moment of the week.', missedPayday(
    'hard',
    'Payday, Eventually',
    'A bank holiday, a strike, and a system upgrade conspire in the same week, and the month\'s money arrives when it arrives.',
    1_500,
    'Bridging the late month',
  )),
  {
    id: 'bo-main-stock-tip', kind: 'normal', title: 'Stock Tip',
    description: 'A cousin swears by a share he read about on the overnight bus. The brokerage is open until six.',
    effect: { type: 'buyStock' },
    tone: 'slate', icon: 'space:stock-tip', tier: EVERY_BOARD,
  },
  {
    id: 'bo-main-old-car', kind: 'normal', title: 'The Old Car Coughs',
    description: 'The car clears its throat on the steepest street in the city, and the mechanic listens to it the way a doctor listens to a chest.',
    effect: { type: 'payMoney', amount: 1_200, reason: 'The mechanic\'s verdict' },
    tone: 'slate', icon: 'space:car-trouble', tier: LONG_ONLY,
  },
  {
    id: 'bo-main-yungas-weekend', kind: 'normal', title: 'Down to the Valleys',
    description: 'A weekend down the mountain into the warm green valleys empties your wallet, fills your camera roll, and sends you home with a crate of oranges.',
    effect: { type: 'payMoney', amount: 600, reason: 'A weekend in the warm' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'bo-main-intersection', kind: 'normal', title: 'The Intersection',
    description: 'A minibus and your bumper hold a brief negotiation at an uncontrolled corner, and the bodyshop\'s quote arrives faster than the police ever would.',
    effect: { type: 'payMoney', amount: 2_400, reason: 'Bodyshop bill', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: EVERY_BOARD,
  },
  setback('veryHard', EVERY_BOARD, 'bo-main-motorway-pileup', 'Fog on the Motorway',
    'Fog rolls over the rim of the high city, brake lights bloom, and four vehicles concertina on the toll road. Everyone walks away; the invoices do not.',
    { type: 'payMoney', amount: 14_000, reason: 'Pileup repairs', hazard: 'accident' },
    'slate', 'space:fender-bender'),
  setback('hard', EVERY_BOARD, 'bo-main-dentist', 'Dentist Bill',
    'One filling, one gold crown your aunt insists is an investment, and one invoice that stings rather more than the drill did.',
    { type: 'payMoney', amount: 5_000, reason: 'Dental work' },
    'slate', 'space:gym-membership'),
  {
    id: 'bo-main-market-prang', kind: 'normal', title: 'The Loading Bay',
    description: 'Somebody reverses a delivery van into your door outside the market and leaves a note that reads, in full, "sorry, ask for Freddy".',
    effect: { type: 'payMoney', amount: 2_600, reason: 'Door and wing repairs', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'bo-main-frying-night', kind: 'normal', title: 'Frying Night',
    description: 'A pan of oil for the doughnuts, one distracted minute at the door, and a kitchen ceiling the exact colour of strong black tea.',
    effect: { type: 'payMoney', amount: 6_000, reason: 'Kitchen fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'bo-main-praise', kind: 'normal', title: 'The Good Month',
    description: 'The boss counts the month\'s book twice, looks up, and adds a fold of notes to your pay without a word. Words are not how she says things.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'A bonus for the good month' },
    tone: 'slate', icon: 'space:good-review', tier: LONG_ONLY,
  },
  {
    id: 'bo-main-alasita', kind: 'normal', title: 'The Miniature Fair',
    description: 'At the January fair you buy your dreams in miniature — a tiny house, a tiny degree, a tiny wad of banknotes — and have them blessed at noon sharp. Everyone swears by it, and nobody explains it.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'slate', icon: 'space:lucky-find', tier: EVERY_BOARD,
  },
]

/**
 * The mid-career crossroads: the payroll or your own account. In a country
 * where most working life is informal, this is the fork with a relative on
 * each side of the argument. The junction halts movement, as every fork must.
 */
const MID_CAREER_FORK: SpaceContent = {
  id: 'bo-crossroads', kind: 'stop', title: 'Five Years In',
  description: 'Five years of steady work, and two voices at Sunday lunch: your mother says keep the payroll and the pension, your cousin says nobody ever got rich working for somebody else. The road forks here.',
  effect: { type: 'none' },
  tone: 'orange', icon: 'space:networking-night', tier: EVERY_BOARD,
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
    description: 'Nobody has left this office in a decade, so the desk above yours only comes free when somebody finally retires. Spin to see whether this was the year.',
    effect: { type: 'promotion', reason: 'The desk above came free' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'bo-payroll-aguinaldo', kind: 'payday', title: 'The Christmas Wage',
    description: 'By law, December pays twice: a whole thirteenth wage lands with the holidays, and in a good year the government decrees a fourteenth. Nobody abroad believes you.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  {
    id: 'bo-payroll-transfer', kind: 'normal', title: 'The Transfer Order',
    description: 'The lowland office. Next month. The company decided in the capital; you found out on Friday. Your apartment, your league team and your favourite lunch house are now souvenirs, and the moving truck is yours to pay for.',
    effect: { type: 'payMoney', amount: 3_000, reason: 'Relocating for the company' },
    tone: 'orange', icon: 'space:apartment-hunt', tier: STANDARD_UP,
  },
  {
    id: 'bo-payroll-icy-curve', kind: 'normal', title: 'The Icy Curve',
    description: 'Forty minutes over the rim for nine years, and one July morning the same gentle curve at four thousand metres finds you before you find it.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'Commuter write-off', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'bo-payroll-plaque', kind: 'normal', title: 'Twenty Years, One Plaque',
    description: 'Two decades on the books earns you an engraved plaque, a round of speeches, and the permanent right to begin sentences with "when the office was still downtown".',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'orange', icon: 'space:lucky-find', tier: LONG_ONLY,
  },
  {
    id: 'bo-payroll-collection', kind: 'normal', title: 'The Office Collection',
    description: 'You start the envelope going round for a colleague\'s fiesta sponsorship, which makes the shortfall at the end of it — there is always a shortfall — yours.',
    effect: { type: 'payEach', amount: 600, reason: 'Making up the collection' },
    tone: 'orange', icon: 'space:surprise-bonus', tier: LONG_ONLY,
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
    id: 'bo-own-account', kind: 'stop', title: 'Your Own Account',
    description: 'You hand back the badge with the next thing already planned. Your mother is horrified; your cousin buys the first round. The new work comes with a new number attached.',
    effect: { type: 'careerChange', reason: 'You went out on your own account', compulsory: true },
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    id: 'bo-own-first-contract', kind: 'payday', title: 'The First Big Contract',
    description: 'Your first client on your own account pays on delivery, in full, in cash — and it lands like a whole month\'s wage that nobody above you took a slice of.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  {
    id: 'bo-own-paperwork', kind: 'normal', title: 'The Paperwork',
    description: 'Three weeks of queues between the badge and the business: the tax number, the municipal licence, the stamps, the stamps on the stamps. Every desk charges, and none of them hurries.',
    effect: { type: 'payMoney', amount: 3_000, reason: 'Three weeks of licences and stamps' },
    tone: 'orange', icon: 'space:rent-due', tier: STANDARD_UP,
  },
  {
    id: 'bo-own-van', kind: 'normal', title: 'The Business Van',
    description: 'You buy the second-hand van the business needs and drive it home yourself, learning its exact width from a colonial-era gateway.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'Van and gateway repairs', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'bo-own-day-rates', kind: 'normal', title: 'Day Rates',
    description: 'A season of working by the day, invoiced by the day, teaches you exactly what the old boss was quietly worth — spin for how many of the days were good ones.',
    effect: { type: 'spinForMoney', perPip: 1_200, reason: 'A season of day rates' },
    tone: 'orange', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'bo-own-despedida', kind: 'normal', title: 'The Send-Off',
    description: 'The old workplace throws you a farewell that runs to a second venue. The card is enormous, the collection is generous, and everyone claims they always knew you would leave.',
    effect: { type: 'collectFromEach', amount: 700, reason: 'The farewell collection' },
    tone: 'orange', icon: 'space:poker-night', tier: LONG_ONLY,
  },
]

/** Market Street, second half: the review, the layoff, and the goldsmiths' window. */
const MARKET_STREET_LATE: readonly SpaceContent[] = [
  {
    id: 'bo-main-review', kind: 'stop', title: 'The Review',
    description: 'A small back room, two people with the year\'s ledger open between them, and one question: are you ready to run more than you run now? Spin, and hear what they say.',
    effect: { type: 'promotion', reason: 'Your review came round' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'bo-main-family-plan', kind: 'normal', title: 'The Family Plan',
    description: 'Somehow you are paying the phone credit, the streaming, and the data top-ups for your entire extended family. Nobody remembers agreeing to this, least of all you.',
    effect: { type: 'payMoney', amount: 300, reason: 'Everyone\'s top-ups' },
    tone: 'slate', icon: 'space:streaming-bill', tier: LONG_ONLY,
  },
  {
    id: 'bo-main-raise-talk', kind: 'normal', title: 'Pay Raise Talk',
    description: 'You raise the subject sideways, over api, the way it is done — and to your shock the new number arrives before the cups are cleared.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk', tier: STANDARD_UP,
  },
  setback('veryHard', EVERY_BOARD, 'bo-main-tax-audit', 'Tax Audit',
    'A very formal letter, a long afternoon with a shoebox of receipts, and a figure at the bottom that has clearly already been decided.',
    { type: 'payMoney', amount: 15_000, reason: 'Tax audit settlement' },
    'slate', 'space:refund-check'),
  {
    id: 'bo-main-contract-ends', kind: 'normal', title: 'Contract Ends',
    description: 'The contract everyone swore blind would renew in January is, very quietly, not renewed. The farewell cake is excellent.',
    effect: { type: 'loseCareer', reason: 'Contract not renewed' },
    tone: 'orange', icon: 'space:layoff-notice', tier: EVERY_BOARD, appearsFrom: 'hard',
  },
  {
    id: 'bo-main-layoff', kind: 'normal', title: 'The Restructuring',
    description: 'The whole floor is called into one meeting with a consultant from the capital, and afterwards your badge stops working.',
    effect: { type: 'loseCareer', reason: 'Restructured out' },
    tone: 'orange', icon: 'space:layoff-notice', tier: EVERY_BOARD,
  },
  {
    id: 'bo-main-career-fair', kind: 'stop', title: 'The Hiring Fair',
    description: 'A hall of booths, free pens, a brass band warming up outside for an unrelated reason, and two offers you have to pick between.',
    effect: { type: 'careerChange', reason: 'A fresh start at the hiring fair' },
    tone: 'orange', icon: 'space:career-fair-return', tier: EVERY_BOARD,
  },
  {
    id: 'bo-main-yapa', kind: 'normal', title: 'The Little Extra',
    description: 'Every seller you are loyal to tops the bag up free — a handful here, an extra roll there. A year of it, you calculate one idle evening, adds up to real money.',
    effect: { type: 'gainMoney', amount: 400, reason: 'A year of little extras' },
    tone: 'slate', icon: 'space:coupon-clipping', tier: LONG_ONLY,
  },
  setback('hard', LONG_ONLY, 'bo-main-tow-truck', 'The Tow Truck',
    'Eleven minutes in a no-parking zone that was a parking zone last month, and the municipal tow truck with immaculate timing.',
    { type: 'payMoney', amount: 1_200, reason: 'Fine and release fee' },
    'slate', 'space:car-trouble'),
  {
    id: 'bo-main-challa', kind: 'normal', title: 'The Blessing Party',
    description: 'The new stall gets its blessing: petals, confetti, a splash of beer for the earth, and every neighbour toasting your luck at your expense. Worth every centavo.',
    effect: { type: 'payEach', amount: 600, reason: 'You hosted the blessing' },
    tone: 'slate', icon: 'space:neighborhood-bbq', tier: LONG_ONLY,
    harsher: {
      from: 'hard',
      description: 'The new stall gets its blessing: petals, confetti, a splash of beer for the earth — and then a band arrives that somebody definitely hired, and the toasting runs to nightfall at your expense.',
      effect: { type: 'payEach', amount: 1_200, reason: 'The blessing found a band' },
    },
  },
  {
    id: 'bo-main-high-season', kind: 'normal', title: 'High Season',
    description: 'Six weeks of fiesta-season trade end with a cash box you have to count twice.',
    effect: { type: 'gainMoney', amount: 2_000, reason: 'High season takings' },
    tone: 'slate', icon: 'space:overtime-shift', tier: LONG_ONLY,
  },
  {
    id: 'bo-main-godparent', kind: 'normal', title: 'Godparent of Everything',
    description: 'This year you are named godparent of a baptism, a graduation and a roof-raising — an honour each time, and a gift each time, for everyone at the table.',
    effect: { type: 'payEach', amount: 800, reason: 'An honour, and a gift, each' },
    tone: 'slate', icon: 'space:surprise-bonus', tier: EVERY_BOARD,
  },
  {
    id: 'bo-main-old-deposit', kind: 'normal', title: 'The Returned Deposit',
    description: 'A deposit you had written off years ago comes back with an apology and, astonishingly, a little interest.',
    effect: { type: 'gainMoney', amount: 700, reason: 'The deposit returns' },
    tone: 'slate', icon: 'space:refund-check', tier: LONG_ONLY,
  },
  {
    id: 'bo-main-prima', kind: 'payday', title: 'The Profit Bonus',
    description: 'The firm posts a profit, and the law says the profit is shared: a whole extra wage lands, and nobody had to ask.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:surprise-bonus', tier: LONG_ONLY,
    harsher: missedPayday(
      'veryHard',
      'Thanks, Verbally',
      'The firm posts a loss instead, and the annual bonus is replaced by a heartfelt memo about the year\'s headwinds.',
      900,
      'A memo about headwinds',
    ),
  },
  {
    id: 'bo-main-pasanaku', kind: 'normal', title: 'Pasanaku Month',
    description: 'The savings pool you and the neighbours pay into every month comes round the circle at last — this month, the whole pot is yours.',
    effect: { type: 'collectFromEach', amount: 500, reason: 'The pool comes round to you' },
    tone: 'slate', icon: 'space:poker-night', tier: STANDARD_UP,
  },
  flavour(LONG_ONLY, 'bo-main-goldsmiths', 'The Goldsmiths\' Arcade', 'You linger a little too long in the arcade where every window is rings, under a hand-painted sign insisting on instalment plans.', 'slate', 'space:ring-shopping'),
]

const MARRIAGE: SpaceContent = {
  id: 'bo-wedding', kind: 'stop', title: 'Wedding Day',
  description: 'The registry office on Thursday, the church on Saturday, and then the fiesta — where every guest is godparent of something, from the cake to the band, and the sponsorships are announced out loud to applause.',
  effect: { type: 'getMarried' },
  tone: 'pink', icon: 'space:wedding-day', tier: EVERY_BOARD,
}

/** Family Lane: the beats every Bolivian parent knows, in order of arrival. */
const FAMILY_LANE: readonly SpaceContent[] = [
  {
    id: 'bo-family-nursery', kind: 'normal', title: 'Nursery Setup',
    description: 'You paint the nursery a cheerful yellow, assemble a crib at midnight, and accept a hand-knitted mountain of impossibly small clothes from every aunt at once.',
    effect: { type: 'payMoney', amount: 2_000, reason: 'Nursery setup' },
    tone: 'purple', icon: 'space:nursery-setup', tier: EVERY_BOARD,
  },
  {
    id: 'bo-family-new-baby', kind: 'stop', title: 'New Baby',
    description: 'A tiny new roommate arrives, and is immediately declared by four separate grandmothers to look exactly like four separate people.',
    effect: { type: 'haveChildren', count: 1 },
    tone: 'purple', icon: 'space:new-baby', tier: EVERY_BOARD,
  },
  {
    id: 'bo-family-lake-trip', kind: 'normal', title: 'The Lake Holiday',
    description: 'Three days at the lakeside shrine town: paddle boats, trout lunches, and the car blessed with petals and beer on the way home. Everyone agrees it was worth it.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'The lake holiday' },
    tone: 'purple', icon: 'space:family-vacation', tier: LONG_ONLY,
  },
  setback('hard', EVERY_BOARD, 'bo-family-childcare', 'Childcare Bill',
    'A nursery place for every small person in the house, and a monthly total you read twice.',
    { type: 'payPerChild', amount: 5_000, reason: 'Childcare per child' },
    'purple', 'space:nursery-setup'),
  setback('veryHard', STANDARD_UP, 'bo-family-academy', 'The After-School Academy',
    'Every child now attends a second school that begins when the first one ends, and patience, it turns out, is billed hourly.',
    { type: 'payPerChild', amount: 5_000, reason: 'Academy fees per child' },
    'purple', 'space:school-fees'),
  {
    id: 'bo-family-school-list', kind: 'normal', title: 'The School List',
    description: 'The uniform, the white smock, the gym kit, and a supply list with forty-one items — each child\'s name to be sewn, not written, into every single one by Monday.',
    effect: { type: 'payPerChild', amount: 3_000, reason: 'The school list per child' },
    tone: 'purple', icon: 'space:school-fees', tier: EVERY_BOARD,
  },
  {
    id: 'bo-family-parade', kind: 'normal', title: 'The Civic Parade',
    description: 'Your child is chosen to carry the school banner at the independence parade, and you film every single second of the ninety they are visible.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:school-play', tier: EVERY_BOARD,
  },
  {
    id: 'bo-family-van-gatepost', kind: 'normal', title: 'The Family Van',
    description: 'Reversing off the drive with three children adjudicating loudly behind you, into the one gatepost that has never once moved.',
    effect: { type: 'payMoney', amount: 3_200, reason: 'Van bodywork', hazard: 'accident' },
    tone: 'purple', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'bo-family-charango', kind: 'normal', title: 'Charango Lessons',
    description: 'The little ten-string guitar is louder than its size suggests, and so is the teacher\'s optimism. There is real promise in there somewhere.',
    effect: { type: 'payMoney', amount: 900, reason: 'Charango lessons' },
    tone: 'purple', icon: 'space:piano-lessons', tier: LONG_ONLY,
  },
  {
    id: 'bo-family-twins', kind: 'normal', title: 'Twins',
    description: 'The technician goes quiet at the scan, turns the screen around, and holds up two fingers. Four grandmothers begin knitting simultaneously in four districts.',
    effect: { type: 'haveChildren', count: 2 },
    tone: 'purple', icon: 'space:second-baby', tier: EVERY_BOARD,
  },
  {
    id: 'bo-family-first-dance', kind: 'normal', title: 'The First Parade Dance',
    description: 'Your children dance in the neighbourhood\'s carnival entrance for the first time, in costumes their grandmother spent a month on, and the whole street claps them past.',
    effect: { type: 'gainLifeTiles', count: 1 },
    tone: 'purple', icon: 'space:soccer-season', tier: STANDARD_UP,
  },
  {
    id: 'bo-family-school-bono', kind: 'normal', title: 'The School Bonus',
    description: 'A government deposit arrives for every child who finished the school year — collected at the bank, in a queue made entirely of proud parents.',
    effect: { type: 'collectPerChild', amount: 1_500, reason: 'School bonus per child' },
    tone: 'purple', icon: 'space:child-benefit', tier: STANDARD_UP,
  },
  flavour(STANDARD_UP, 'bo-family-portrait', 'Studio Portrait', 'Everyone actually smiles at the same time, in matching outfits nobody will admit to choosing — the studio frames it before you can change your mind.', 'purple', 'space:family-portrait', {
    from: 'veryHard',
    description: 'Everyone smiles at the same time exactly once, and the studio charges for the whole afternoon, the album, and the commemorative calendars.',
    effect: { type: 'payMoney', amount: 1_100, reason: 'The full photo package' },
  }),
  payday(STANDARD_UP, 'bo-family-payday', 'The month\'s money lands somewhere between the school run and bath time, and is spent in roughly the same window.'),
  {
    id: 'bo-family-back-to-work', kind: 'normal', title: 'Back to Work',
    description: 'You come back from parental leave able to run a day on four hours\' sleep and three deadlines, and you make sure the new number reflects it.',
    effect: { type: 'payRaise' },
    tone: 'purple', icon: 'space:pay-raise-talk', tier: LONG_ONLY,
  },
  {
    id: 'bo-family-third', kind: 'normal', title: 'Another Arrival',
    description: 'The van is officially too small, and nobody minds in the slightest.',
    effect: { type: 'haveChildren', count: 1 },
    tone: 'purple', icon: 'space:new-baby', tier: LONG_ONLY,
  },
]

/** Career Track: the work is real and so are the raises. */
const CAREER_TRACK: readonly SpaceContent[] = [
  {
    id: 'bo-fast-shortlist', kind: 'normal', title: 'The Shortlist',
    description: 'Your name is on the shortlist for the job above yours, and so are two others, one of whom is the director\'s nephew. Spin.',
    effect: { type: 'promotion', reason: 'On the shortlist' },
    tone: 'orange', icon: 'space:big-promotion', tier: STANDARD_UP,
  },
  {
    id: 'bo-fast-fiesta-contact', kind: 'normal', title: 'The Committee Contact',
    description: 'You serve on a fiesta committee with half the chamber of commerce, and a conversation over the beer order turns into a referral worth real money.',
    effect: { type: 'gainMoney', amount: 1_200, reason: 'Referral bonus' },
    tone: 'orange', icon: 'space:networking-night', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'bo-fast-payday-1', 'The overtime finally shows up in the envelope.'),
  {
    id: 'bo-fast-headhunted', kind: 'normal', title: 'Headhunted',
    description: 'A rival firm has been asking about you at the trade fair, and the call comes with two offers, a deadline, and your current salary already known to the centavo.',
    effect: { type: 'careerChange', reason: 'Headhunted for something new' },
    tone: 'orange', icon: 'space:headhunted', tier: EVERY_BOARD,
  },
  {
    id: 'bo-fast-hire-car', kind: 'normal', title: 'The Client\'s City',
    description: 'An unfamiliar lowland city, a hire car, and a roundabout that works on principles nobody explained at the rental desk.',
    effect: { type: 'payMoney', amount: 3_200, reason: 'Hire car excess', hazard: 'accident' },
    tone: 'orange', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'bo-fast-client-win', kind: 'normal', title: 'Client Win',
    description: 'You land the account everyone said was impossible, and shake hands at a depth of formality reserved for exactly this occasion.',
    effect: { type: 'gainMoney', amount: 3_000, reason: 'Client win bonus' },
    tone: 'orange', icon: 'space:client-win', tier: STANDARD_UP,
  },
  {
    id: 'bo-fast-trade-fair', kind: 'normal', title: 'The Trade Fair Talk',
    description: 'Your talk at the great lowland trade fair makes the rounds of three industries in a week, and the organisers of the next three fairs would like your calendar.',
    effect: { type: 'gainMoney', amount: 4_400, reason: 'Speaking fees' },
    tone: 'orange', icon: 'space:conference-talk', tier: STANDARD_UP,
  },
  setback('hard', EVERY_BOARD, 'bo-fast-burnout', 'Burnout Leave',
    'Six weeks signed off with a doctor\'s note, and the envelope is a great deal lighter by the time you walk back in.',
    { type: 'payMoney', amount: 12_000, reason: 'Unpaid leave' },
    'orange', 'space:steady-hustle'),
  {
    id: 'bo-fast-reorg', kind: 'normal', title: 'The Reorganisation',
    description: 'A consultant flies in for a week, the org chart is redrawn over a weekend, and on Monday your name is in a different box with a different title under it. Nobody asked you; nobody asked anybody.',
    effect: { type: 'careerChange', reason: 'Reorganised into a new role', compulsory: true },
    tone: 'orange', icon: 'space:career-fair-return', tier: EVERY_BOARD, appearsFrom: 'veryHard',
  },
  {
    id: 'bo-fast-brokerage', kind: 'normal', title: 'The Brokerage Call',
    description: 'The bonus is burning a hole in your pocket, and the broker has been leaving voicemails with exclamation marks in them.',
    effect: { type: 'buyStock' },
    tone: 'orange', icon: 'finance:trading-floor', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'bo-fast-payday-2', 'Another month down, another envelope in.', missedPayday(
    'hard',
    'Bonus Clawback',
    'Last year\'s bonus is reassessed by an auditor in another city, and reassessed downwards.',
    6_000,
    'Bonus clawed back',
  )),
  {
    id: 'bo-fast-year-end', kind: 'normal', title: 'Bonus Season',
    description: 'The year closed better than anyone admitted in the meetings, and the extra envelope is thick enough that you count it twice behind a closed door.',
    effect: { type: 'gainMoney', amount: 5_000, reason: 'Year-end bonus' },
    tone: 'orange', icon: 'space:bonus-season', tier: STANDARD_UP,
  },
  flavour(LONG_ONLY, 'bo-fast-corner-office', 'The Corner Office', 'You finally get a door that closes, a window that opens, and a view of the mountain that makes visitors lose their train of thought.', 'orange', 'space:corner-office', {
    from: 'hard',
    description: 'You finally get a door that closes and a window that opens — and an empty room behind them that is yours to furnish.',
    effect: { type: 'payMoney', amount: 1_800, reason: 'Furnishing the office' },
  }),
  {
    id: 'bo-fast-board-seat', kind: 'normal', title: 'Board Seat',
    description: 'A chair has come free at the long table on the top floor. Spin to find out whose name ends up on the door.',
    effect: { type: 'promotion', reason: 'A chair at the long table' },
    tone: 'orange', icon: 'space:corner-office', tier: STANDARD_UP,
  },
  {
    id: 'bo-fast-retention', kind: 'normal', title: 'Retention Offer',
    description: 'You mention, lightly, over lunch, that somebody else has been in touch. The counter-offer arrives before the soup does.',
    effect: { type: 'payRaise' },
    tone: 'orange', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  {
    id: 'bo-fast-partner-share', kind: 'normal', title: 'The Partner Share',
    description: 'Years of building somebody else\'s firm turn, at last, into a written percentage of it — and the percentage turns into an actual number in an actual account.',
    effect: { type: 'gainMoney', amount: 7_000, reason: 'The partner share pays out' },
    tone: 'orange', icon: 'space:bonus-season', tier: LONG_ONLY,
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
    tone: 'slate', icon: 'finance:trading-floor', tier: EVERY_BOARD,
  },
  {
    id: 'bo-midtown-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'Every share you hold posts its cheque — and the brewery adds a shareholder crate of its own lager, which is the part you tell people about.',
    effect: { type: 'stockDividend', perShare: 3_000, reason: 'Quarterly dividend' },
    tone: 'slate', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'bo-midtown-parrillada', kind: 'normal', title: 'The Promotion Barbecue',
    description: 'You got the promotion, so custom is clear: you host the barbecue for the whole floor, and somebody\'s cousin arrives with a guitar and no plans.',
    effect: { type: 'payEach', amount: 800, reason: 'You hosted the whole floor' },
    tone: 'slate', icon: 'space:neighborhood-bbq', tier: STANDARD_UP,
  },
  {
    id: 'bo-midtown-heater', kind: 'normal', title: 'The Old Heater',
    description: 'The high-city night drops below freezing, the ancient electric heater rises to the occasion, and the curtain gets involved. The bedroom needs repainting from the ceiling down.',
    effect: { type: 'payMoney', amount: 5_600, reason: 'Bedroom fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'bo-midtown-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Before anyone hands you a set of house keys, someone would like a word about cover — and unrolls a hazard map of your hillside that is thorough, recent, and quietly terrifying.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'slate', icon: 'finance:insurance-office', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'bo-midtown-payday', 'The month\'s money lands the week the deposit on a house is due.', missedPayday(
    'veryHard',
    'Pay Frozen',
    'A pay freeze is announced on the very morning the deposit was supposed to land.',
    2_000,
    'Nothing to draw on this month',
  )),
  {
    id: 'bo-midtown-wiring', kind: 'normal', title: 'Wiring Fault',
    description: 'The house was wired floor by floor, by three different electricians, in three different decades. At two in the morning, the decades disagree.',
    effect: { type: 'payMoney', amount: 5_600, reason: 'Electrical fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'bo-midtown-llama', kind: 'normal', title: 'The Llama',
    description: 'It steps onto the high-plains highway at dusk, considers you with the calm of a creature that has right of way, and walks on. The bumper does not walk on.',
    effect: { type: 'payMoney', amount: 3_600, reason: 'Front end rebuilt', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'bo-midtown-pitch', kind: 'normal', title: 'The Big Pitch',
    description: 'You present to the whole ownership at once and the room nods slowly, which here is a standing ovation. Spin to find out whether nodding means the job that runs it.',
    effect: { type: 'promotion', reason: 'You won the room' },
    tone: 'orange', icon: 'space:client-win', tier: STANDARD_UP,
  },
  {
    id: 'bo-midtown-shared-purse', kind: 'normal', title: 'The Shared Purse',
    description: 'The money is pooled now — the wage, the stall\'s takings, and the dollar envelope taped behind the wardrobe that officially does not exist. Settling the month is a summit meeting.',
    effect: { type: 'household', reason: 'The shared purse, settled up' },
    tone: 'purple', icon: 'finance:bank-visit', tier: EVERY_BOARD,
  },
  {
    id: 'bo-midtown-aguinaldo', kind: 'payday', title: 'December Pays Twice',
    description: 'The thirteenth wage lands with the holidays, sized to what each of you earns rather than to what anybody promised, and the whole country goes shopping the same weekend.',
    effect: { type: 'payday' },
    tone: 'green', icon: 'space:bonus-season', tier: EVERY_BOARD,
  },
  {
    id: 'bo-midtown-raise', kind: 'normal', title: 'Mid-Career Raise',
    description: 'A quiet word by the lift, a new number, and a handshake of exactly matched firmness on the way out.',
    effect: { type: 'payRaise' },
    tone: 'slate', icon: 'space:pay-raise-talk', tier: EVERY_BOARD,
  },
  setback('veryHard', EVERY_BOARD, 'bo-midtown-dollar-jump', 'The Dollar Jumps',
    'The dollar stops being a fact and becomes a rumour: the street rate leaves the official one behind, and everything imported reprices by Thursday.',
    { type: 'payMoney', amount: 14_000, reason: 'Everything imported reprices' },
    'slate', 'space:market-crash'),
  setback('hard', LONG_ONLY, 'bo-midtown-columns', 'The Builder\'s Report',
    'Before the next floor goes up, a proper engineer looks at the columns the first builder swore by. The report costs money, and so does what the report says.',
    { type: 'payMoney', amount: 8_000, reason: 'Reinforcing the columns' },
    'slate', 'space:house-hunting'),
  {
    id: 'bo-midtown-salt-flat-trip', kind: 'normal', title: 'The Salt Flat Trip',
    description: 'You finally do the tourist thing in your own country: a jeep, a salt horizon, and forty perspective photographs of the family standing on a dinosaur that is actually a saucepan.',
    effect: { type: 'payMoney', amount: 700, reason: 'The salt flat weekend' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'bo-midtown-flota-month', kind: 'normal', title: 'The Overnight Bus Month',
    description: 'Four cities in five days by overnight coach, semi-reclining, and every one of the receipts is yours until the expense forms clear.',
    effect: { type: 'payMoney', amount: 1_500, reason: 'Travel expenses' },
    tone: 'slate', icon: 'space:weekend-trip', tier: LONG_ONLY,
  },
  {
    id: 'bo-midtown-bank', kind: 'normal', title: 'Bank Visit',
    description: 'The branch manager now greets you by name and waves you past the queue, which earns you looks you can feel between your shoulders.',
    effect: { type: 'bank' },
    tone: 'slate', icon: 'finance:bank-visit', tier: LONG_ONLY,
  },
  flavour(LONG_ONLY, 'bo-midtown-viewings', 'Six Lots in One Saturday', 'Six half-built houses in one Saturday, each with more rebar and more promise than the last, and you liked the second one best all along.', 'slate', 'space:house-hunting', {
    from: 'hard',
    description: 'Six half-built houses in one Saturday, and a tank of fuel, three fresh-squeezed juices and a parking fee to show for the day.',
    effect: { type: 'payMoney', amount: 600, reason: 'A Saturday of viewings' },
  }),
]

const HOME_BUYING: SpaceContent = {
  id: 'bo-buying-walls', kind: 'stop', title: 'Buying the Walls',
  description: 'A Saturday of viewings from adobe courtyard to mirrored cholet, with everyone advising you at once. Here, you buy the walls first and the dream grows a floor at a time.',
  effect: { type: 'buyHouse' },
  tone: 'gold', icon: 'space:house-hunting', tier: EVERY_BOARD,
}

/** The Dollar Road: imports, hoarded greenbacks, and a cousin with a plan. */
const DOLLAR_ROAD: readonly SpaceContent[] = [
  {
    id: 'bo-risky-container', kind: 'normal', title: 'The Container Bet',
    description: 'Your cousin knows a man at the free port on the coast, and your savings fill one shared container — spin to see what the market thinks of the instinct.',
    effect: { type: 'spinForMoney', perPip: 2_000, reason: 'The container comes in' },
    tone: 'pink', icon: 'space:startup-bet', tier: EVERY_BOARD,
  },
  {
    id: 'bo-risky-bad-tip', kind: 'normal', title: 'Bad Stock Tip',
    description: 'The "sure thing" you announced to the whole table over dice night loses half its value in a week, and honour demands you buy everyone dinner about it.',
    effect: { type: 'payEach', amount: 2_000, reason: 'Bad stock tip' },
    tone: 'pink', icon: 'space:stock-tip', tier: EVERY_BOARD,
  },
  {
    id: 'bo-risky-cacho', kind: 'normal', title: 'Dice Night',
    description: 'The leather cup, five dice, and the national bar game played for friendly stakes — and you roll the five-of-a-kind at the exact moment it matters most.',
    effect: { type: 'collectFromEach', amount: 2_500, reason: 'Dice night winnings' },
    tone: 'pink', icon: 'space:poker-night', tier: EVERY_BOARD,
  },
  {
    id: 'bo-risky-boom-ends', kind: 'normal', title: 'The Boom Ends',
    description: 'The commodity your whole position leans on goes out of fashion on three continents in one quarter, and your portfolio winces.',
    effect: { type: 'payMoney', amount: 9_000, reason: 'The boom ends' },
    tone: 'pink', icon: 'space:market-crash', tier: EVERY_BOARD,
  },
  setback('hard', EVERY_BOARD, 'bo-risky-aftershock', 'Aftershock',
    'The market finds a lower floor than anyone believed it had, and finds it inside a single afternoon.',
    { type: 'payMoney', amount: 16_000, reason: 'The market falls again' },
    'pink', 'space:market-crash'),
  setback('veryHard', LONG_ONLY, 'bo-risky-wipeout', 'Margin Wipeout',
    'The leveraged position is closed for you at the worst hour of the night, and nobody asks first.',
    { type: 'payMoney', amount: 20_000, reason: 'Position closed out' },
    'pink', 'space:market-crash'),
  {
    id: 'bo-risky-pickup', kind: 'normal', title: 'One Careful Week',
    description: 'You buy the imported pickup you promised yourself at seventeen, and introduce it to a colonial kerbstone before the plates arrive.',
    effect: { type: 'payMoney', amount: 5_000, reason: 'Alloys, arch and pride', hazard: 'accident' },
    tone: 'pink', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'bo-risky-lottery', kind: 'normal', title: 'The Christmas Lottery',
    description: 'You queue at the kiosk everyone swears is lucky, because the lucky kiosk is famously lucky. Spin for what the queue was worth.',
    effect: { type: 'spinForMoney', perPip: 3_500, reason: 'The Christmas draw' },
    tone: 'pink', icon: 'space:lottery-ticket', tier: EVERY_BOARD,
  },
  {
    id: 'bo-risky-old-stake', kind: 'normal', title: 'The Old Stake',
    description: 'A stake you had honestly forgotten finally pays off, and everyone at the table chips in envy.',
    effect: { type: 'collectFromEach', amount: 2_000, reason: 'Surprise windfall' },
    tone: 'pink', icon: 'space:surprise-bonus', tier: STANDARD_UP,
  },
  {
    id: 'bo-risky-customs-auction', kind: 'normal', title: 'The Customs Auction',
    description: 'Seized goods go under the hammer at the customs yard, sight mostly unseen, and your paddle goes up one crate too many.',
    effect: { type: 'payMoney', amount: 6_000, reason: 'Auction overspend' },
    tone: 'pink', icon: 'space:bidding-war', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'bo-risky-payday', 'The month\'s money lands while your investments are busy misbehaving.'),
  {
    id: 'bo-risky-margin-call', kind: 'normal', title: 'Margin Call',
    description: 'The broker calls before breakfast, addresses you by your full formal name for the first time ever, and the rest of the sentence hardly matters.',
    effect: { type: 'payMoney', amount: 4_000, reason: 'Margin call' },
    tone: 'pink', icon: 'space:market-crash', tier: LONG_ONLY,
  },
  {
    id: 'bo-risky-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One handshake over a long lunch, one signature before the coffee, and you and the front-runner trade bank balances.',
    effect: { type: 'swapMoneyWithLeader', reason: 'A deal with the front-runner' },
    tone: 'pink', icon: 'space:rival-swap', tier: EVERY_BOARD,
  },
  {
    id: 'bo-risky-new-floor-party', kind: 'normal', title: 'The New Floor Party',
    description: 'The house grows a floor, so the floor gets a party: a band on the unfinished slab, petals and beer for the walls, and every single tab on you.',
    effect: { type: 'payEach', amount: 1_500, reason: 'The whole new floor, on you' },
    tone: 'pink', icon: 'space:neighborhood-bbq', tier: LONG_ONLY,
  },
  {
    id: 'bo-risky-angel', kind: 'normal', title: 'Angel Investing',
    description: 'Three young founders, three borrowed garages, three cheques with your signature on them — spin to find out which garage was a company all along.',
    effect: { type: 'spinForMoney', perPip: 1_500, reason: 'Angel investment return' },
    tone: 'pink', icon: 'space:startup-bet', tier: LONG_ONLY,
  },
  {
    id: 'bo-risky-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The wild end of your portfolio posts the quarter of its life, and you retell the numbers at dice night until somebody makes you stop.',
    effect: { type: 'stockDividend', perShare: 4_000, reason: 'Bumper dividend' },
    tone: 'pink', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'bo-risky-hot-tip', kind: 'normal', title: 'Hot Stock Tip',
    description: 'A man with a magnificent watch lowers his voice at the lunch counter and shares something "not yet public". The watch, you note, is doing a great deal of the persuading.',
    effect: { type: 'buyStock' },
    tone: 'pink', icon: 'space:stock-tip', tier: LONG_ONLY,
  },
]

/** Steady Street: the notebook, the savings pool, and the tin under the bed. */
const STEADY_STREET: readonly SpaceContent[] = [
  {
    id: 'bo-safe-market-timing', kind: 'normal', title: 'Market Arithmetic',
    description: 'You know which afternoon the prices drop, which stall rounds down, and which seller owes you a favour. This week, the knowledge pays for the whole basket.',
    effect: { type: 'gainMoney', amount: 800, reason: 'Knowing the market' },
    tone: 'green', icon: 'space:coupon-clipping', tier: EVERY_BOARD,
  },
  {
    id: 'bo-safe-potato-patch', kind: 'normal', title: 'The Potato Patch',
    description: 'The family plot outside town comes through: a sack of potatoes, a bundle of herbs, and the deep satisfaction of a grocery trip skipped.',
    effect: { type: 'gainMoney', amount: 600, reason: 'The plot provides' },
    tone: 'green', icon: 'space:garden-harvest', tier: LONG_ONLY,
  },
  payday(EVERY_BOARD, 'bo-safe-payday', 'The month\'s money arrives on the day it always has, which is the whole idea.', missedPayday(
    'veryHard',
    'Wages Withheld',
    'A cell in a spreadsheet somewhere means this month\'s wages will arrive next month instead.',
    1_000,
    'Wages held over a month',
  )),
  setback('hard', EVERY_BOARD, 'bo-safe-excess', 'Policy Excess',
    'The careful road has claim forms too, and the small print on yours contains a figure called the excess that turns out to be neither small nor print.',
    { type: 'payMoney', amount: 4_000, reason: 'Policy excess' },
    'green', 'finance:insurance-office'),
  setback('veryHard', STANDARD_UP, 'bo-safe-hail', 'Hail on the Roof',
    'A February hailstorm turns the street white in twenty minutes and finds every weak sheet in the tin roof. The man with the ladder is booked until Thursday.',
    { type: 'payMoney', amount: 9_000, reason: 'Roof repairs' },
    'green', 'space:house-hunting'),
  setback('hard', LONG_ONLY, 'bo-safe-fridge', 'Fridge Gives Up',
    'It hums, it rattles, it stops. Everything in the freezer, including the good trout, goes in the bin by lunchtime.',
    { type: 'payMoney', amount: 3_000, reason: 'A new fridge' },
    'green', 'space:grocery-run'),
  {
    id: 'bo-safe-trolley', kind: 'normal', title: 'Trolley Dent',
    description: 'A supermarket trolley rolls the full width of the car park, on a slope nobody can find afterwards, to reach your driver\'s door. Every witness was studying the sky.',
    effect: { type: 'payMoney', amount: 3_000, reason: 'Panel and paint', hazard: 'accident' },
    tone: 'green', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  {
    id: 'bo-safe-notebook', kind: 'normal', title: 'The Household Notebook',
    description: 'You keep the household accounts in a ruled notebook for a whole year, column by column, and the notebook quietly wins.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'The notebook balances ahead' },
    tone: 'green', icon: 'space:budget-win', tier: EVERY_BOARD,
  },
  {
    id: 'bo-safe-fixed-deposit', kind: 'normal', title: 'The Fixed Deposit Matures',
    description: 'The five-year fixed deposit matures. The interest is real, the ceremony at the counter is oddly moving, and you sign it straight into another one.',
    effect: { type: 'gainMoney', amount: 1_200, reason: 'Five years of interest' },
    tone: 'green', icon: 'space:interest-payout', tier: STANDARD_UP,
  },
  {
    id: 'bo-safe-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'A rival leaves their proudest keepsake unattended by the juice stand, and your hand hovers over it.',
    effect: { type: 'stealLifeTile', reason: 'A keepsake changes hands' },
    tone: 'green', icon: 'space:sticky-fingers', tier: STANDARD_UP,
  },
  {
    id: 'bo-safe-qr-cashback', kind: 'normal', title: 'The Payment App Promo',
    description: 'The QR payment app\'s cashback campaign, discovered on its final weekend, applied retroactively to everything you were going to buy anyway.',
    effect: { type: 'gainMoney', amount: 900, reason: 'Campaign cashback' },
    tone: 'green', icon: 'space:cashback-bonus', tier: LONG_ONLY,
  },
  {
    id: 'bo-safe-neighbour-repays', kind: 'normal', title: 'The Neighbour Repays',
    description: 'A loan you made in a hard year and never once mentioned comes back across the courtyard, wrapped in a cloth, with a cake on top.',
    effect: { type: 'gainMoney', amount: 1_400, reason: 'An old kindness returns' },
    tone: 'green', icon: 'space:refund-check', tier: EVERY_BOARD,
  },
  {
    id: 'bo-safe-mattress-dollars', kind: 'normal', title: 'The Envelope Grows',
    description: 'Nothing dramatic happens — the dollar envelope taped behind the wardrobe just quietly gets thicker, the way it has since your grandmother taught you where to tape it.',
    effect: { type: 'gainMoney', amount: 1_000, reason: 'Quiet savings' },
    tone: 'green', icon: 'space:quiet-savings', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'bo-safe-payday-2', 'Another month, another quiet fold of notes. Steady is a strategy.'),
  {
    id: 'bo-safe-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The steady half of your portfolio posts its steady little cheque, plus the brewery\'s shareholder crate.',
    effect: { type: 'stockDividend', perShare: 2_500, reason: 'Quarterly dividend' },
    tone: 'green', icon: 'space:dividend-day', tier: EVERY_BOARD,
  },
  {
    id: 'bo-safe-insurance', kind: 'normal', title: 'Insurance Office',
    description: 'Late is better than never, and the broker is delighted to unroll the hail map for you again.',
    effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
    tone: 'green', icon: 'finance:insurance-office', tier: LONG_ONLY,
  },
  flavour(LONG_ONLY, 'bo-safe-apthapi', 'The Shared Table', 'The neighbourhood spreads its cloths end to end in the courtyard and everyone tips their pot into the middle — potatoes, corn, cheese, and the unspoken contest over whose chilli sauce goes first.', 'green', 'space:neighborhood-bbq', {
    from: 'hard',
    description: 'The neighbourhood spreads its cloths end to end in the courtyard — and you, it turns out, are this year\'s organising committee, which means the tent deposit is yours.',
    effect: { type: 'payMoney', amount: 700, reason: 'The committee finds you' },
  }),
]

/** Sunset Years: the sharpest material on the board, played warm. */
const SUNSET_YEARS: readonly SpaceContent[] = [
  {
    id: 'bo-sunset-number', kind: 'stop', title: 'The Envelope Arithmetic',
    description: 'One evening you spread it all on the table: the pension statement, what the business would fetch, the dollar envelope. The number at the bottom is smaller than you feared — and it does not withdraw itself.',
    effect: { type: 'retireEarly' },
    tone: 'gold', icon: 'space:retirement-fund', tier: EVERY_BOARD,
  },
  {
    id: 'bo-sunset-one-more-floor', kind: 'normal', title: 'One More Floor',
    description: 'The builder who did the last floor calls about the next one: the columns will take it, the view would be magnificent, and he happens to be free.',
    effect: { type: 'upgradeHouse' },
    tone: 'slate', icon: 'space:home-upgrade', tier: EVERY_BOARD,
  },
  {
    id: 'bo-sunset-storeroom-fire', kind: 'normal', title: 'The Storeroom',
    description: 'A decade of stock, one old fuse, and a storeroom that needs rebuilding from the shelves up.',
    effect: { type: 'payMoney', amount: 12_000, reason: 'Storeroom fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: EVERY_BOARD,
  },
  setback('veryHard', STANDARD_UP, 'bo-sunset-san-juan', 'The Midwinter Bonfire',
    'On the coldest night of the year the whole city lights bonfires, as it always has — and this year, the fence was closer than it looked.',
    { type: 'payMoney', amount: 16_000, reason: 'Bonfire night damage', hazard: 'fire' },
    'slate', 'space:house-fire'),
  setback('hard', EVERY_BOARD, 'bo-sunset-parents', 'Caring for Your Parents',
    'Somebody who once carried you up four flights of market stairs now needs carrying. You would never count the cost. The invoice counts it anyway.',
    { type: 'payMoney', amount: 20_000, reason: 'Caring for family' },
    'slate', 'space:family-portrait'),
  {
    id: 'bo-sunset-workshop-fire', kind: 'normal', title: 'Workshop Fire',
    description: 'The shed full of stock for the little side business goes up in eleven minutes flat, along with the little side business.',
    effect: { type: 'payMoney', amount: 7_000, reason: 'Workshop fire damage', hazard: 'fire' },
    tone: 'slate', icon: 'space:house-fire', tier: STANDARD_UP,
  },
  {
    id: 'bo-sunset-bollard', kind: 'normal', title: 'The New Bollard',
    description: 'The market installs a bollard where no bollard has ever stood, and you formally introduce the rear bumper to it twice in one month.',
    effect: { type: 'payMoney', amount: 3_800, reason: 'Rear bumper, again', hazard: 'accident' },
    tone: 'slate', icon: 'space:fender-bender', tier: STANDARD_UP,
  },
  payday(EVERY_BOARD, 'bo-sunset-payday-1', 'One of the very last envelopes lands.'),
  {
    id: 'bo-sunset-dividend', kind: 'normal', title: 'Dividend Day',
    description: 'The shares you bought decades ago and stubbornly refused every panic finally pay out together, like a harvest you planted before the children were born.',
    effect: { type: 'stockDividend', perShare: 4_000, reason: 'Annual dividend' },
    tone: 'slate', icon: 'space:dividend-day', tier: STANDARD_UP,
  },
  {
    id: 'bo-sunset-swap', kind: 'normal', title: 'Rival Swap',
    description: 'One final audacious deal over a very long lunch, and the leader watches their fortune shake hands and leave with you.',
    effect: { type: 'swapMoneyWithLeader', reason: 'The eleventh-hour swap' },
    tone: 'slate', icon: 'space:rival-swap', tier: EVERY_BOARD,
  },
  {
    id: 'bo-sunset-children-send', kind: 'normal', title: 'The Children Provide',
    description: 'Every grown-up child arrives for Sunday lunch with something for the house — and the one working abroad wires her share with a voice note longer than the transfer.',
    effect: { type: 'collectPerChild', amount: 4_000, reason: 'From each child' },
    tone: 'slate', icon: 'space:child-benefit', tier: EVERY_BOARD,
  },
  {
    id: 'bo-sunset-fund', kind: 'normal', title: 'Fund Blows Up',
    description: 'The clever fund you retired on writes to its investors. The first paragraph is about market conditions, the second is about lessons learned, and the number is in the third.',
    effect: { type: 'payMoney', amount: 16_000, reason: 'The fund you retired on' },
    tone: 'slate', icon: 'space:market-crash', tier: STANDARD_UP,
  },
  {
    id: 'bo-sunset-sticky', kind: 'normal', title: 'Sticky Fingers',
    description: 'Over the good coffee, you begin talking the front-runner out of their finest story.',
    effect: { type: 'stealLifeTile', reason: 'A story changes hands' },
    tone: 'slate', icon: 'space:sticky-fingers', tier: EVERY_BOARD,
  },
  {
    id: 'bo-sunset-last-title', kind: 'normal', title: 'One Last Title',
    description: 'The association wants to make you honorary president before you go, if the vote lands. Spin, and let the last election of your life decide it.',
    effect: { type: 'promotion', reason: 'The last election of your life' },
    tone: 'slate', icon: 'space:big-promotion', tier: EVERY_BOARD,
  },
  payday(EVERY_BOARD, 'bo-sunset-payday-2', 'You stopped counting the paydays years ago; the calendar has not.'),
  {
    id: 'bo-sunset-farewell', kind: 'normal', title: 'The Farewell',
    description: 'The association, the block, and two generations of regulars all insist on throwing you a farewell, and all insist on paying.',
    effect: { type: 'collectFromEach', amount: 3_000, reason: 'Leaving gifts' },
    tone: 'slate', icon: 'space:surprise-bonus', tier: STANDARD_UP,
  },
  {
    id: 'bo-sunset-kermesse', kind: 'normal', title: 'The Fundraiser Fair',
    description: 'You run the food stand at the school fundraiser, and the takings are far better than anybody predicted. They always are when you run it.',
    effect: { type: 'gainMoney', amount: 1_100, reason: 'The stand\'s takings' },
    tone: 'green', icon: 'space:garage-sale', tier: LONG_ONLY,
  },
  {
    id: 'bo-sunset-clear-out', kind: 'normal', title: 'The Great Clear-Out',
    description: 'Forty years of the back room goes to the Sunday feria, and strangers pay real money for the things you nearly threw away.',
    effect: { type: 'gainMoney', amount: 700, reason: 'The back room sells' },
    tone: 'green', icon: 'space:yard-sale', tier: LONG_ONLY,
  },
  {
    id: 'bo-sunset-appraisal', kind: 'normal', title: 'The Old Trunk',
    description: 'The family trunk is finally opened, and the antiques dealer goes very quiet at one of the bundles — spin for the appraisal.',
    effect: { type: 'spinForMoney', perPip: 900, reason: 'The appraisal' },
    tone: 'slate', icon: 'space:garage-sale', tier: LONG_ONLY,
  },
  {
    id: 'bo-sunset-sit-down', kind: 'normal', title: 'The Sit-Down',
    description: 'You both go through a year of the notebook at the kitchen table, and the shared purse is finally audited in both directions. There is a coat to discuss.',
    effect: { type: 'household', reason: 'The notebook, audited both ways' },
    tone: 'purple', icon: 'space:quiet-savings', tier: LONG_ONLY,
  },
  {
    id: 'bo-sunset-last-draw', kind: 'normal', title: 'One Last Ticket',
    description: 'One final ticket from the famously lucky kiosk on the way out the door — spin for the payout.',
    effect: { type: 'spinForMoney', perPip: 3_500, reason: 'One last ticket' },
    tone: 'slate', icon: 'space:lottery-ticket', tier: STANDARD_UP,
  },
  setback('veryHard', EVERY_BOARD, 'bo-sunset-final-tax', 'Final Tax Bill',
    'One last formal envelope from the tax office arrives before the shutters come down for good.',
    { type: 'payMoney', amount: 22_000, reason: 'Final tax bill' },
    'slate', 'space:refund-check'),
  flavour(EVERY_BOARD, 'bo-sunset-ahead', 'Sunset Ahead', 'From the rooftop, the mountain turns rose-gold at dusk, the way it has every evening you were too busy to look.', 'slate', 'space:sunset-ahead'),
]

const RETIREMENT: SpaceContent = {
  id: 'bo-retirement', kind: 'retirement', title: 'Retirement Day',
  description: 'You hand over the keys — to the office, the stall, or both — get covered in confetti by people who love you, and wake up to the first Monday in forty years with nowhere to be.',
  effect: { type: 'retire' },
  tone: 'gold', icon: 'space:retirement', tier: EVERY_BOARD,
}

// ---------------------------------------------------------------------------
// The route: start, four forks, four trunk runs, and retirement — the same
// grammar as every edition, with the summaries written as the two relatives
// at Sunday lunch, because the argument at the table is the content.
// ---------------------------------------------------------------------------

const UNIVERSITY_BRANCH: RouteBranch = {
  identity: {
    name: 'University Lane',
    summary: 'Five years, an entrance exam, and a thesis defended in front of your whole family in their Sunday best. The bill is the years themselves, paid before you earn a thing — and the title it buys goes in front of your name forever. Dependable, never enormous.',
  },
  spaces: [...UNIVERSITY_LANE, GRAD_FAIR],
}

const WORK_BRANCH: RouteBranch = {
  identity: {
    name: 'Straight to Work',
    summary: 'The market takes you Monday and pays you Friday, years before the students earn a thing. No safety net, and a trade that is really a business at three sizes — the bottom is hard graft, and the top out-earns every graduate at this table.',
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
    summary: 'School lists, charango practice, and a house full of noise, with every grown-up child providing at the end. Far fewer paydays, and every bill arrives multiplied.',
  },
  spaces: FAMILY_LANE,
}

const CAREER_BRANCH: RouteBranch = {
  identity: {
    name: 'Career Track',
    summary: 'The raises are real, and so are the bonuses, the board seat and the corner office with the mountain view. The life you might have had is itemised separately.',
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
