import type { Career } from '../../model/types'

/**
 * Three shelves of research work, and the inversion turned over twice.
 *
 * The Researcher: Japan board turned the base game over once: there the
 * degree is the gamble and the safe road is the one that earns early. This
 * board keeps that and then turns it over again in the second half, because
 * that is what the country actually does:
 *
 * - **`basic` is the cadre shelf** — the engineering school's own road, taken
 *   by somebody who signed at the school's recruitment forum before they had
 *   graduated. It is the *safe* road at eighteen: salaried from the first
 *   tile, a good floor, no bill and three paydays banked before the other
 *   road has finished a thesis. It is also the **wide, exposed** shelf for the
 *   rest of the life — three-rung ladders, a top of €126,000, two ladders paid
 *   out of whatever the round or the mission left, and not one rung on it that
 *   the Layoff Notice cannot reach.
 * - **`graduate` is everything a doctorate opens that is not a permanent
 *   post** — the hourly lecturer paid by the class, the postdoctoral
 *   researcher on a contract with a date on it, and, at the far end, the
 *   private laboratory's director of research. It is the **widest** shelf on
 *   the board, €24,500 to €148,000, which is where the volatility of the
 *   opening fork physically lives: this is the shelf the road that pays the
 *   bill is dealt from.
 * - **`doctorate` is the fonctionnaire shelf** — the permanent posts won at
 *   the concours, and the whole point of the gated road. **The highest floor
 *   and the lowest ceiling of any shelf in this game.** Nobody on it ever
 *   scrapes by; nobody on it ever gets rich; not one of them can be laid off;
 *   and every single rung of the cadre shelf's *second* step already pays
 *   more than the best-paid post on it.
 *
 * That last sentence is the board's argument in one line, and it is the exact
 * opposite of the Researcher: Japan board's, where the permanent shelf's
 * *floor* stands above industry's ceiling. Japan buys security and comes out
 * ahead on money; France buys security and pays for it, every month, for
 * thirty years. Both are true of their own country and neither is true of the
 * other, which is the whole argument for the country axis existing.
 *
 * What makes the French bargain worth taking anyway is written in a field the
 * engine already had: `raiseStep`. A civil servant advances by seniority
 * whether or not anything happens — the step comes round, the grade moves up,
 * nobody has to ask — so every rung on this shelf raises at about nine per
 * cent where every other rung in the edition raises at five. The ceiling
 * stays low. The climb toward it is automatic, and over the back half of a
 * board that is real money.
 */

/**
 * How hard each step up is, in spins — and the sentence this board is built
 * on: **there is exactly one long-odds roll on it, and it is the concours.**
 *
 * The cadre climbs on time served, four times in six, like every other
 * industry ladder in this repository. The fonctionnaire climbs the same way
 * once the post is theirs, because after the concours the French research
 * career has no competitive step left in it at all — that is precisely what
 * the concours was for. The contract world in between climbs on `THE_NEXT_ONE`,
 * three times in six: a post ends, another is advertised, and you are one of
 * a dozen people who could do it.
 *
 * Nothing here rolls at five or six. The only roll on this board that does is
 * the gate on the concours lane (see `route.ts`), which is where the whole of
 * this life's risk has been compressed — a single entry competition in your
 * early thirties, sat twice, and then either a post for life or a career in
 * industry.
 */
const TIME_SERVED = 3 as const
const THE_NEXT_ONE = 4 as const

/**
 * The cadre shelf: the grande école's own road, and on this board both the
 * safe opening and the volatile ending.
 *
 * Nobody arrives here by accident. Two years of preparatory class, a national
 * entrance competition at twenty, three years at a school whose name opens
 * doors for forty years, and a contract signed at the school's recruitment
 * forum months before the diploma. The doctorate is not skipped on this road;
 * it is never considered, because nothing on the road requires one and the
 * people doing the hiring did not take one either.
 *
 * Its ladders run three rungs where the fonctionnaire's run two, its top is
 * half again as tall as that shelf's, and two of its ladders are paid out of
 * whatever the funding round or the client's mission left — which is what
 * makes the back half of this board industry-volatile, and what
 * `balance.test.ts` measures as a finishing spread a third wider than the
 * shelf behind the gate.
 */
export const CADRE_CAREERS: readonly Career[] = [
  // --- the group's research division ---------------------------------------
  {
    id: 'career-frr-research-engineer',
    title: 'Research Engineer',
    salary: 40_000,
    raiseStep: 2_100,
    requiresDegree: false,
    icon: 'career:robotics-engineer',
    description: 'Works on the thing that ships in four years, in a laboratory with a canteen, a works council and somebody else choosing the question.',
    promotesTo: 'career-frr-rd-manager',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-rd-manager',
    title: 'R&D Manager',
    salary: 82_000,
    raiseStep: 4_200,
    requiresDegree: false,
    icon: 'career:robotics-engineer',
    description: 'Fourteen people, six projects, and a budget that has to survive the group\'s November arbitration in Paris.',
    promotesTo: 'career-frr-technical-director',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-technical-director',
    title: 'Technical Director',
    salary: 126_000,
    raiseStep: 6_400,
    requiresDegree: false,
    icon: 'career:robotics-engineer',
    description: 'Decides what the group will know how to make in ten years, and is held to it by people who will have moved on in three.',
  },
  // --- the laboratory of a very large pharmaceutical company ----------------
  {
    id: 'career-frr-clinical-project-manager',
    title: 'Clinical Project Manager',
    salary: 44_000,
    raiseStep: 2_300,
    requiresDegree: false,
    icon: 'career:surgeon',
    description: 'Runs a trial across nine hospitals in four countries, and knows the name of every research nurse in all of them.',
    promotesTo: 'career-frr-head-of-clinical-operations',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-head-of-clinical-operations',
    title: 'Head of Clinical Operations',
    salary: 86_000,
    raiseStep: 4_400,
    requiresDegree: false,
    icon: 'career:surgeon',
    description: 'Stops two of the company\'s four favourite programmes a year, politely, with a table of numbers nobody can argue with.',
  },
  // --- the patent office ---------------------------------------------------
  {
    id: 'career-frr-patent-engineer',
    title: 'Patent Engineer',
    salary: 38_000,
    raiseStep: 2_000,
    requiresDegree: false,
    icon: 'career:corporate-lawyer',
    description: 'Reads the invention, then the four hundred inventions that came before it, then writes one careful claim in two languages.',
    promotesTo: 'career-frr-patent-attorney',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-patent-attorney',
    title: 'Patent Attorney',
    salary: 88_000,
    raiseStep: 4_500,
    requiresDegree: false,
    icon: 'career:corporate-lawyer',
    description: 'Holds the firm\'s best idea inside twenty lines of prose a competitor\'s lawyer in Munich cannot walk around.',
  },
  // --- the data floor ------------------------------------------------------
  {
    id: 'career-frr-data-scientist',
    title: 'Data Scientist',
    salary: 42_000,
    raiseStep: 2_200,
    requiresDegree: false,
    icon: 'career:software-engineer',
    description: 'Turns twelve years of factory logs into one number the executive committee can act on, and then explains it twice.',
    promotesTo: 'career-frr-lead-data-scientist',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-lead-data-scientist',
    title: 'Lead Data Scientist',
    salary: 82_000,
    raiseStep: 4_200,
    requiresDegree: false,
    icon: 'career:software-engineer',
    description: 'Picks which six of the division\'s forty ideas get a year each, and defends the choice every quarter.',
    promotesTo: 'career-frr-chief-data-officer',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-chief-data-officer',
    title: 'Chief Data Officer',
    salary: 120_000,
    raiseStep: 6_100,
    requiresDegree: false,
    icon: 'career:software-engineer',
    description: 'Sits on the executive committee, says "we do not have that data" out loud, and is right often enough to be listened to.',
  },
  // --- the aerospace programme ---------------------------------------------
  {
    id: 'career-frr-systems-engineer',
    title: 'Systems Engineer',
    salary: 41_000,
    raiseStep: 2_100,
    requiresDegree: false,
    icon: 'career:aerospace-engineer',
    description: 'Holds in one document every way eleven subsystems could disagree with each other at four hundred kilometres up.',
    promotesTo: 'career-frr-programme-chief-engineer',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-programme-chief-engineer',
    title: 'Programme Chief Engineer',
    salary: 84_000,
    raiseStep: 4_300,
    requiresDegree: false,
    icon: 'career:aerospace-engineer',
    description: 'Signs the page that says it will work, and is in the control room at three in the morning to watch it.',
  },
  // --- the reactor ---------------------------------------------------------
  {
    id: 'career-frr-reactor-physicist',
    title: 'Reactor Physicist',
    salary: 43_000,
    raiseStep: 2_200,
    requiresDegree: false,
    icon: 'career:geologist',
    description: 'Knows what the core is doing to a precision that would frighten you, and finds the whole subject extremely calming.',
    promotesTo: 'career-frr-safety-director',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-safety-director',
    title: 'Safety Director',
    salary: 89_000,
    raiseStep: 4_500,
    requiresDegree: false,
    icon: 'career:geologist',
    description: 'Answers to a regulator that can stop a fleet, and has never once been tempted to round a number in the right direction.',
  },
  // --- the food group's laboratory -----------------------------------------
  {
    id: 'career-frr-food-science-engineer',
    title: 'Food Science Engineer',
    salary: 35_000,
    raiseStep: 1_800,
    requiresDegree: false,
    icon: 'career:pastry-chef',
    description: 'Spends a year making a biscuit behave the same in Lille in February and in Marseille in August, and succeeds.',
    promotesTo: 'career-frr-head-of-product-development',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-head-of-product-development',
    title: 'Head of Product Development',
    salary: 82_000,
    raiseStep: 4_200,
    requiresDegree: false,
    icon: 'career:pastry-chef',
    description: 'Kills nine ideas a year in a tasting room and has learned to do it without anybody crying.',
  },
  // --- the deep-tech spinout: paid out of the round -------------------------
  {
    id: 'career-frr-spinout-engineer',
    title: 'Spinout Engineer',
    salary: 42_000,
    payPerPip: 12_000,
    raiseStep: 2_200,
    requiresDegree: false,
    icon: 'career:rocket-engineer',
    description: 'Eleven of you, a licence from a public laboratory, and a payroll that depends on a round, which depends on one slide.',
    promotesTo: 'career-frr-spinout-chief-scientist',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-spinout-chief-scientist',
    title: 'Spinout Chief Scientist',
    salary: 94_500,
    payPerPip: 27_000,
    raiseStep: 4_800,
    requiresDegree: false,
    icon: 'career:rocket-engineer',
    description: 'Owns the science and a slice of the company, and has learned to read a term sheet as carefully as a referee report.',
  },
  // --- the consultancy: paid by the mission --------------------------------
  {
    id: 'career-frr-scientific-consultant',
    title: 'Scientific Consultant',
    salary: 49_000,
    payPerPip: 14_000,
    raiseStep: 2_500,
    requiresDegree: false,
    icon: 'career:product-manager',
    description: 'Sells four months of exactly what you know to a firm that has just discovered it needs it. Good years and thin ones look very different.',
    promotesTo: 'career-frr-consulting-partner',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-consulting-partner',
    title: 'Consulting Partner',
    salary: 94_500,
    payPerPip: 27_000,
    raiseStep: 4_800,
    requiresDegree: false,
    icon: 'career:product-manager',
    description: 'Brings in the work, hands it to people fifteen years younger, and is paid what the year happened to bring in.',
  },
  // --- callings ------------------------------------------------------------
  {
    id: 'career-frr-lycee-physics-teacher',
    title: 'Lycée Physics Teacher',
    salary: 35_000,
    raiseStep: 2_100,
    requiresDegree: false,
    icon: 'career:professor',
    description: 'The person half the researchers at this table would name if you asked who mattered most. There is no promotion from this and there was never going to be.',
    isCalling: true,
  },
  {
    id: 'career-frr-museum-instrument-maker',
    title: 'Museum Instrument Maker',
    salary: 37_000,
    raiseStep: 2_200,
    requiresDegree: false,
    icon: 'career:workshop-owner',
    description: 'Rebuilds an eighteenth-century orrery so that it turns again, correctly, for the first time in ninety years. Nobody has offered you a better job, because there is not one.',
    isCalling: true,
  },
]

/**
 * Everything a doctorate opens that is not a permanent post — and the widest
 * shelf on the board.
 *
 * This is where the road that pays the bill is dealt from, and it is where
 * this board's opening fork gets its volatility. The bottom is genuinely
 * grim: an hourly lecturer paid by the class, at three universities, invoicing
 * for work done eight months ago. The top is the tallest thing on the board —
 * a private laboratory's director of research, out-earning every permanent
 * post in the country by a distance nobody in the public sector likes
 * discussing.
 *
 * Nine of these rungs are paid by the die, because a contract with a date on
 * it is exactly what soft money looks like from the inside. The clinic is
 * salaried the whole way up, which is its own bitter joke: medicine pays even
 * inside a university.
 *
 * Everything here climbs at `THE_NEXT_ONE` — one post ends, another is
 * advertised, and you are one of a dozen who could do it. It is not the
 * concours. Nothing on this shelf is.
 */
export const CONTRACT_CAREERS: readonly Career[] = [
  // --- the lecture hall: the grimmest bottom rung on the board --------------
  {
    id: 'career-frr-hourly-lecturer',
    title: 'Hourly Lecturer',
    salary: 24_500,
    payPerPip: 7_000,
    raiseStep: 1_300,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'Paid by the class, at three universities, on trains between them — and invoiced eight months in arrears, which everybody agrees is a scandal and nobody fixes.',
    promotesTo: 'career-frr-temporary-lecturer',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-temporary-lecturer',
    title: 'Temporary Lecturer',
    salary: 45_500,
    payPerPip: 13_000,
    raiseStep: 2_400,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'One university, one desk, one year, renewable once. Two hundred first-years who assume you have always been here.',
    promotesTo: 'career-frr-contract-professor',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-contract-professor',
    title: 'Contract Professor',
    salary: 70_000,
    raiseStep: 3_600,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'A real chair at a private school, on a real contract, with a real end date that everybody is far too polite to mention.',
  },
  // --- the laboratory ------------------------------------------------------
  {
    id: 'career-frr-postdoc',
    title: 'Postdoctoral Researcher',
    salary: 31_500,
    payPerPip: 9_000,
    raiseStep: 1_700,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'Three years, one question, and a grant that runs out slightly before the answer does. Everyone tells you the next one will be permanent.',
    promotesTo: 'career-frr-project-leader',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-project-leader',
    title: 'Project Leader',
    salary: 59_500,
    payPerPip: 17_000,
    raiseStep: 3_100,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'Your own budget line, your own doctoral student, and a project that ends on a date printed in the grant agreement.',
    promotesTo: 'career-frr-institute-group-leader',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-institute-group-leader',
    title: 'Institute Group Leader',
    salary: 105_000,
    raiseStep: 5_400,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'A private institute with an endowment, eleven people, and a five-year renewable mandate that has been renewed twice.',
  },
  // --- the field station ---------------------------------------------------
  {
    id: 'career-frr-station-assistant',
    title: 'Station Research Assistant',
    salary: 28_000,
    payPerPip: 8_000,
    raiseStep: 1_500,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'Counts things in cold water for somebody else\'s paper, six months a year, and would not swap it for an office in Paris.',
    promotesTo: 'career-frr-station-scientist',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-station-scientist',
    title: 'Station Scientist',
    salary: 56_000,
    payPerPip: 16_000,
    raiseStep: 2_900,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'Runs the survey that has run every year since 1958, and the good years and the broken-boat years pay differently.',
    promotesTo: 'career-frr-station-director',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-station-director',
    title: 'Station Director',
    salary: 98_000,
    raiseStep: 5_000,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'Keeps a building on a headland, three boats and one irreplaceable data series alive, mostly by writing letters to the region.',
  },
  // --- the clinic ----------------------------------------------------------
  {
    id: 'career-frr-clinical-fellow',
    title: 'Clinical Research Fellow',
    salary: 92_000,
    raiseStep: 4_700,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Sees patients four days a week and writes the study on the fifth, which is a seven-day week described optimistically.',
    promotesTo: 'career-frr-trial-physician',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-trial-physician',
    title: 'Trial Physician',
    salary: 116_000,
    raiseStep: 5_900,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Holds the arm of the study that decides whether the treatment is real, and signs every page of it.',
    promotesTo: 'career-frr-trial-centre-director',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-trial-centre-director',
    title: 'Trial Centre Director',
    salary: 140_000,
    raiseStep: 7_100,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Runs forty trials across eleven hospitals, and is the reason a country\'s worth of patients gets asked at all.',
  },
  // --- the communications desk ---------------------------------------------
  {
    id: 'career-frr-science-journalist',
    title: 'Science Journalist',
    salary: 59_500,
    payPerPip: 17_000,
    raiseStep: 3_100,
    requiresDegree: true,
    icon: 'career:journalist',
    description: 'Explains the preprint on the eight o\'clock news. The preprint is sometimes retracted the following week; the clip never is.',
    promotesTo: 'career-frr-science-editor',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-science-editor',
    title: 'Science Editor',
    salary: 84_000,
    payPerPip: 24_000,
    raiseStep: 4_300,
    requiresDegree: true,
    icon: 'career:writer',
    description: 'Decides which four of the week\'s two hundred results the country hears about, and is thanked for it about as often as a referee is.',
    promotesTo: 'career-frr-documentary-producer',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-documentary-producer',
    title: 'Documentary Producer',
    salary: 119_000,
    payPerPip: 34_000,
    raiseStep: 6_100,
    requiresDegree: true,
    icon: 'career:record-producer',
    description: 'Turns a decade of somebody\'s fieldwork into ninety minutes that teachers will show for twenty years. The rights renew; the commissions do not.',
  },
  // --- the private laboratory: the tallest ladder on the board ---------------
  {
    id: 'career-frr-private-lab-engineer',
    title: 'Research Engineer, Private Lab',
    salary: 88_000,
    raiseStep: 4_500,
    requiresDegree: true,
    icon: 'career:robotics-engineer',
    description: 'A doctorate is worth something here, which after five years of being told otherwise is a strange morning.',
    promotesTo: 'career-frr-private-lab-manager',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-private-lab-manager',
    title: 'Head of Laboratory',
    salary: 115_000,
    raiseStep: 5_900,
    requiresDegree: true,
    icon: 'career:robotics-engineer',
    description: 'Runs the laboratory the group bought from a university spinout, and keeps every one of its people from being reorganised into a product team.',
    promotesTo: 'career-frr-director-of-research',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-director-of-research',
    title: 'Director of Research',
    salary: 148_000,
    raiseStep: 7_500,
    requiresDegree: true,
    icon: 'career:agency-owner',
    description: 'Decides what a company with sixty thousand employees will try to know next, and out-earns every professor in the Republic without ever mentioning it.',
  },
  // --- the platform --------------------------------------------------------
  {
    id: 'career-frr-instrument-scientist',
    title: 'Instrument Scientist',
    salary: 80_000,
    raiseStep: 4_100,
    requiresDegree: true,
    icon: 'career:mechanic',
    description: 'Keeps the machine everybody\'s results depend on inside its tolerance, and is thanked in the acknowledgements at best.',
    promotesTo: 'career-frr-platform-head',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-platform-head',
    title: 'Head of the Platform',
    salary: 101_000,
    raiseStep: 5_200,
    requiresDegree: true,
    icon: 'career:workshop-owner',
    description: 'Four instruments, one booking calendar, and the diplomatic skill to run it without a single professor writing to the president of the university.',
  },
  // --- the corridor the money comes down -----------------------------------
  {
    id: 'career-frr-research-administrator',
    title: 'Research Administrator',
    salary: 72_000,
    raiseStep: 3_700,
    requiresDegree: true,
    icon: 'career:ministry-official',
    description: 'Has read every call for proposals in Europe and knows which three your laboratory could actually win.',
    promotesTo: 'career-frr-laboratory-manager',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-laboratory-manager',
    title: 'Laboratory Manager',
    salary: 96_000,
    raiseStep: 4_900,
    requiresDegree: true,
    icon: 'career:product-manager',
    description: 'Runs ninety people on eleven grants with four supervising bodies, and knows what all four of them will say before they say it.',
    promotesTo: 'career-frr-centre-manager',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-centre-manager',
    title: 'Centre Manager',
    salary: 126_000,
    raiseStep: 6_400,
    requiresDegree: true,
    icon: 'career:agency-owner',
    description: 'Holds a ten-year national programme together across six sites and two ministries, and has the mobile number of everybody who matters.',
  },
  // --- the sensory laboratory ----------------------------------------------
  {
    id: 'career-frr-sensory-scientist',
    title: 'Sensory Scientist',
    salary: 70_000,
    raiseStep: 3_600,
    requiresDegree: true,
    icon: 'career:pastry-chef',
    description: 'Trains a panel of twelve people to agree, in numbers, about what a thing tastes of. It works, which nobody outside the field believes.',
    promotesTo: 'career-frr-sensory-lab-head',
    promotionSpin: THE_NEXT_ONE,
  },
  {
    id: 'career-frr-sensory-lab-head',
    title: 'Head of the Sensory Laboratory',
    salary: 96_000,
    raiseStep: 4_900,
    requiresDegree: true,
    icon: 'career:pastry-chef',
    description: 'Half the country\'s cellars and creameries send you their problems, and the answer is usually temperature.',
  },
  // --- callings ------------------------------------------------------------
  {
    id: 'career-frr-curator-of-beetles',
    title: 'Curator of Beetles',
    salary: 64_000,
    raiseStep: 3_900,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'There are four hundred thousand species and somebody has to love every one of them. There is no promotion from this and there was never going to be.',
    isCalling: true,
  },
  {
    id: 'career-frr-programme-officer',
    title: 'Programme Officer',
    salary: 88_000,
    raiseStep: 5_400,
    requiresDegree: true,
    icon: 'career:ministry-official',
    description: 'Reads two hundred proposals a year and funds twelve dreams. Turned down a laboratory of their own to do it, and has never once been sorry.',
    isCalling: true,
  },
]

/**
 * The fonctionnaire shelf: the posts won at the concours, and the safest work
 * on this board by a distance nothing else comes close to.
 *
 * Reached exactly one way — the gated road, and the competition at the end of
 * it — and it buys precisely one thing. Not money: the cadre shelf's second
 * rung already beats the best-paid post here, and everybody on this shelf
 * knows it, because they were at school with the people on that one. What it
 * buys is that **no committee, no funder, no reorganisation and no Layoff
 * Notice can ever end it.** Every rung carries `cannotBeLaidOff`, and that
 * immunity is the entire return on the road.
 *
 * Two rungs, climbed on time served, and the largest `raiseStep` in the
 * edition: the grade advances by seniority whether or not anything happens,
 * which is the one thing about this career that is genuinely automatic.
 *
 * Compare the Researcher: Japan board's permanent shelf, which does the
 * opposite: its floor stands *above* the industry shelf's ceiling. A Japanese
 * permanent post is safety and a raise; a French one is safety and a bill,
 * paid monthly, for the rest of a working life.
 */
const FONCTIONNAIRE_POSTS: readonly Career[] = [
  {
    id: 'career-frr-state-research-scientist',
    title: 'State Research Scientist',
    salary: 70_000,
    raiseStep: 6_300,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'The appointment is national, permanent, and made by a panel that met for one afternoon. You read the letter four times, and then once more the next morning.',
    promotesTo: 'career-frr-state-research-director',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-state-research-director',
    title: 'State Research Director',
    salary: 78_000,
    raiseStep: 7_000,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'Runs a team of eleven on a salary a former classmate\'s deputy earns, and would not swap the question for either of their jobs.',
  },
  {
    id: 'career-frr-university-lecturer',
    title: 'University Lecturer',
    salary: 68_000,
    raiseStep: 6_100,
    requiresDegree: true,
    icon: 'career:professor',
    description: '192 hours of teaching a year, a laboratory in the evenings, and a post that no reorganisation in the Republic can take off you.',
    promotesTo: 'career-frr-full-professor',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-full-professor',
    title: 'Full Professor',
    salary: 76_000,
    raiseStep: 6_800,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'Runs the laboratory, chairs the committee, sits on four juries a year in four other cities, and lets six other people put their names first.',
  },
  {
    id: 'career-frr-staff-research-engineer',
    title: 'Staff Research Engineer',
    salary: 69_000,
    raiseStep: 6_200,
    requiresDegree: true,
    icon: 'career:mechanic',
    description: 'The permanent post the machine actually needed, won at a competition with eighty applicants for it, and the machine has not failed since.',
    promotesTo: 'career-frr-principal-research-engineer',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-principal-research-engineer',
    title: 'Principal Research Engineer',
    salary: 77_000,
    raiseStep: 6_900,
    requiresDegree: true,
    icon: 'career:mechanic',
    description: 'Designs the instrument three laboratories will build their next decade on, and signs off the drawings personally.',
  },
  {
    id: 'career-frr-assistant-astronomer',
    title: 'Assistant Astronomer',
    salary: 71_000,
    raiseStep: 6_400,
    requiresDegree: true,
    icon: 'career:geologist',
    description: 'A permanent post at an observatory, with service duties, teaching duties, and a mountain you are contractually obliged to visit.',
    promotesTo: 'career-frr-astronomer',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-astronomer',
    title: 'Astronomer',
    salary: 79_000,
    raiseStep: 7_100,
    requiresDegree: true,
    icon: 'career:geologist',
    description: 'Has an instrument, a decade of nights and a catalogue with a number in its name, and explains error bars to committees, patiently, for the ninth time.',
  },
  {
    id: 'career-frr-hospital-researcher',
    title: 'Hospital Researcher',
    salary: 72_000,
    raiseStep: 6_500,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'A ward, a teaching round and a research day, all of them permanent, none of them quiet.',
    promotesTo: 'career-frr-head-of-department',
    promotionSpin: TIME_SERVED,
  },
  {
    id: 'career-frr-head-of-department',
    title: 'Head of Department',
    salary: 80_000,
    raiseStep: 7_200,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Takes the cases the other hospitals send on, writes the paper about how it went, and signs the duty roster at midnight.',
  },
]

/**
 * Stamped rather than written out ten times, so the shelf's whole promise
 * cannot be broken by adding an eleventh post and forgetting the flag. The
 * permanence is a property of *being on this shelf* — of the appointment
 * being made by the state rather than by an employer — and not of any one
 * post.
 */
export const FONCTIONNAIRE_CAREERS: readonly Career[] = FONCTIONNAIRE_POSTS.map((career) => ({
  ...career,
  cannotBeLaidOff: true,
}))
