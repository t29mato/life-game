import type { Career } from '../../model/types'

/**
 * Three shelves of research work, and the moral weight of the base game's two
 * pools turned over.
 *
 * On every other board the degree buys the floor and the trade ladder is the
 * gamble. In a Japanese research life it is exactly backwards, and the shelves
 * say so before a single tile is read:
 *
 * - **`basic` is the industry shelf** — the master's exit into a manufacturer's
 *   research division, taken by the spring hiring round straight out of a
 *   two-year master's. Two rungs, a whole working life inside ¥4.2M–¥6.5M, and
 *   one climb that lands four times in six. You will never scrape by, and you
 *   will never run anything. This is the *safe* road, and it is also the
 *   national default: the doctorate has been off the corporate hiring calendar
 *   since before anybody at this table was born.
 * - **`graduate` is the academia shelf** — the fixed-term posts a doctorate
 *   actually opens. Mostly three rungs, a band from ¥2.45M to ¥14.7M — five
 *   times as wide as the industry shelf's — nine rungs paid by the die rather
 *   than by contract, and a climb decided by open competition rather than by
 *   time served. The part-time lecturer's rung exists so that somebody at the
 *   table winces.
 * - **`doctorate` is the permanent shelf** — the post at the far end of the
 *   Fixed-Term Ladder. Two rungs inside ¥8.0M–¥9.4M, the highest floor on any
 *   board in the game and deliberately not its highest ceiling, and every rung of it carries
 *   `cannotBeLaidOff`: this is the only work in the whole codebase the Layoff
 *   Notice tile cannot touch, and that immunity *is* what the gated road is
 *   for.
 *
 * Measured, not chosen. The industry shelf opened a full 20% higher than it
 * stands now and the academia shelf's middle rungs a good deal lower, and the
 * opening fork measured 37.1% to the doctorate — a road nobody sane takes. The
 * figures below are where it settled at 42.5%, and it measures 46.7% today
 * against the USA board's own 44.7% for College Lane, with the mean gap
 * between the two lanes at 6.1%. (The move from 42.5% to 46.7% was not a
 * shelf edit: it is the payday the board now charges a layoff, which costs a
 * salaried division researcher more than it costs somebody on a contract.)
 *
 * The one thing to defend when these numbers are next edited: the academia
 * shelf's band has to stay several times the industry shelf's, because that
 * ratio is where the volatility of this board's opening fork physically lives
 * — and unlike every other edition, it lives on the road that pays a bill
 * rather than on the road that earns early. `balance.test.ts` measures both
 * halves of that sentence.
 */

/**
 * How hard each step up is, in spins — and the second place this board's
 * argument is written in numbers.
 *
 * Industry promotes on time served: `IN_HOUSE` lands four times in six, the
 * same first step every other edition's ladders open with, because a research
 * division's next grade is a matter of years rather than of luck.
 *
 * Academia promotes by open call. A post is advertised, several dozen people
 * apply from all over the country, and one of them is appointed: `OPEN_CALL`
 * lands twice in six and `THE_CHAIR` once. Failing costs nothing but the year
 * — this board's catastrophic roll is the cliff at the end of the ladder, not
 * the competition on the way up, which is the exact opposite of the way the
 * American researcher's board will be shaped.
 *
 * The permanent shelf goes back to `IN_HOUSE`. Once the post is permanent the
 * climb is ordinary again, and that is most of the relief of holding one.
 */
const IN_HOUSE = 3 as const
const OPEN_CALL = 5 as const
const THE_CHAIR = 6 as const

/**
 * The industry shelf: corporate research, entered on the spring calendar with
 * a master's degree, exactly the way most of this country's researchers
 * actually enter it.
 *
 * Short, salaried and dependable, with a single unsteady ladder — the
 * university spinout, paid in whatever the funding round left — so that
 * somebody who wanted a gamble can still be dealt one. Nothing here is grim
 * and nothing here is enormous. That is the whole pitch, and on this board it
 * is a genuinely good one.
 */
export const INDUSTRY_CAREERS: readonly Career[] = [
  // --- the electronics maker's laboratory ----------------------------------
  {
    id: 'career-jpr-corporate-researcher',
    title: 'Corporate Researcher',
    salary: 4_600_000,
    raiseStep: 240_000,
    requiresDegree: false,
    icon: 'career:robotics-engineer',
    description: 'Works on the thing that ships in four years, in a building where the coffee is free and the topic is not yours to choose.',
    promotesTo: 'career-jpr-research-group-leader',
    promotionSpin: IN_HOUSE,
  },
  {
    id: 'career-jpr-research-group-leader',
    title: 'Research Group Leader',
    salary: 5_900_000,
    raiseStep: 300_000,
    requiresDegree: false,
    icon: 'career:robotics-engineer',
    description: 'Eleven people, four projects, and one budget that has to survive the division head every October.',
  },
  // --- the drug company ----------------------------------------------------
  {
    id: 'career-jpr-preclinical-scientist',
    title: 'Preclinical Scientist',
    salary: 5_000_000,
    raiseStep: 260_000,
    requiresDegree: false,
    icon: 'career:surgeon',
    description: 'Runs the studies that decide whether a compound is ever allowed near a person, and writes them up in triplicate.',
    promotesTo: 'career-jpr-head-of-preclinical',
    promotionSpin: IN_HOUSE,
  },
  {
    id: 'career-jpr-head-of-preclinical',
    title: 'Head of Preclinical',
    salary: 6_300_000,
    raiseStep: 320_000,
    requiresDegree: false,
    icon: 'career:surgeon',
    description: 'Kills three of the company\'s four favourite compounds a year, politely, with data.',
  },
  // --- the car maker -------------------------------------------------------
  {
    id: 'career-jpr-development-engineer',
    title: 'Development Engineer',
    salary: 4_400_000,
    raiseStep: 230_000,
    requiresDegree: false,
    icon: 'career:aerospace-engineer',
    description: 'Shaves grams off a bracket that four million cars will carry, and is quietly delighted about it.',
    promotesTo: 'career-jpr-development-lead',
    promotionSpin: IN_HOUSE,
  },
  {
    id: 'career-jpr-development-lead',
    title: 'Development Lead',
    salary: 5_500_000,
    raiseStep: 280_000,
    requiresDegree: false,
    icon: 'career:aerospace-engineer',
    description: 'Owns the schedule, the test rig and the argument with purchasing, and still knows every bracket by name.',
  },
  // --- the instrument maker ------------------------------------------------
  {
    id: 'career-jpr-application-scientist',
    title: 'Application Scientist',
    salary: 4_200_000,
    raiseStep: 220_000,
    requiresDegree: false,
    icon: 'career:product-manager',
    description: 'Flies to other people\'s laboratories to make the machine you sell do the thing the brochure said it would.',
    promotesTo: 'career-jpr-applications-manager',
    promotionSpin: IN_HOUSE,
  },
  {
    id: 'career-jpr-applications-manager',
    title: 'Applications Manager',
    salary: 5_300_000,
    raiseStep: 270_000,
    requiresDegree: false,
    icon: 'career:product-manager',
    description: 'Knows what every customer in the country is really trying to measure, and tells the designers before they ask.',
  },
  // --- the software floor --------------------------------------------------
  {
    id: 'career-jpr-data-scientist',
    title: 'Data Scientist',
    salary: 4_800_000,
    raiseStep: 250_000,
    requiresDegree: false,
    icon: 'career:software-engineer',
    description: 'Turns twelve years of factory logs into one number the board can act on, and explains it twice.',
    promotesTo: 'career-jpr-research-manager',
    promotionSpin: IN_HOUSE,
  },
  {
    id: 'career-jpr-research-manager',
    title: 'Research Manager',
    salary: 6_100_000,
    raiseStep: 310_000,
    requiresDegree: false,
    icon: 'career:software-engineer',
    description: 'Picks which six of the lab\'s forty ideas get a year each, and defends the choice at the quarterly review.',
  },
  // --- the materials company ----------------------------------------------
  {
    id: 'career-jpr-analytical-chemist',
    title: 'Analytical Chemist',
    salary: 4_300_000,
    raiseStep: 220_000,
    requiresDegree: false,
    icon: 'career:geologist',
    description: 'Finds the one part per billion that ruined the batch, and is right about it often enough to be feared.',
    promotesTo: 'career-jpr-head-of-analysis',
    promotionSpin: IN_HOUSE,
  },
  {
    id: 'career-jpr-head-of-analysis',
    title: 'Head of Analysis',
    salary: 5_400_000,
    raiseStep: 280_000,
    requiresDegree: false,
    icon: 'career:geologist',
    description: 'Runs the instruments the whole company queues for, and the queue is fair, which is its own achievement.',
  },
  // --- the patent office ---------------------------------------------------
  {
    id: 'career-jpr-patent-engineer',
    title: 'Patent Engineer',
    salary: 4_600_000,
    raiseStep: 240_000,
    requiresDegree: false,
    icon: 'career:corporate-lawyer',
    description: 'Reads the invention, then reads the four hundred inventions that came before it, then writes one careful claim.',
    promotesTo: 'career-jpr-patent-attorney',
    promotionSpin: IN_HOUSE,
  },
  {
    id: 'career-jpr-patent-attorney',
    title: 'Patent Attorney',
    salary: 6_200_000,
    raiseStep: 310_000,
    requiresDegree: false,
    icon: 'career:corporate-lawyer',
    description: 'Holds the company\'s best idea inside twenty lines of prose that a competitor\'s lawyer cannot walk around.',
  },
  // --- the journal office --------------------------------------------------
  {
    id: 'career-jpr-journal-editor',
    title: 'Journal Editor',
    salary: 4_500_000,
    raiseStep: 240_000,
    requiresDegree: false,
    icon: 'career:journalist',
    description: 'Reads two hundred submissions a month and finds three reviewers for each, which is the harder half.',
    promotesTo: 'career-jpr-editor-in-chief',
    promotionSpin: IN_HOUSE,
  },
  {
    id: 'career-jpr-editor-in-chief',
    title: 'Editor-in-Chief',
    salary: 5_600_000,
    raiseStep: 290_000,
    requiresDegree: false,
    icon: 'career:journalist',
    description: 'Decides what a whole field gets to read, and is thanked for it roughly as often as a referee is.',
  },
  // --- the spinout: the one unsteady ladder on this shelf -------------------
  {
    id: 'career-jpr-spinout-researcher',
    title: 'Spinout Researcher',
    salary: 4_900_000,
    payPerPip: 1_400_000,
    raiseStep: 250_000,
    requiresDegree: false,
    icon: 'career:rocket-engineer',
    description: 'The university sold the licence and eleven of you took the risk. Payroll depends on the round, and the round depends on a slide.',
    promotesTo: 'career-jpr-spinout-chief-scientist',
    promotionSpin: IN_HOUSE,
  },
  {
    id: 'career-jpr-spinout-chief-scientist',
    title: 'Spinout Chief Scientist',
    salary: 6_475_000,
    payPerPip: 1_850_000,
    raiseStep: 330_000,
    requiresDegree: false,
    icon: 'career:rocket-engineer',
    description: 'Owns the science and a slice of the company, and has learned to read a term sheet as carefully as a paper.',
  },
  // --- callings ------------------------------------------------------------
  {
    id: 'career-jpr-physics-teacher',
    title: 'High-School Physics Teacher',
    salary: 4_700_000,
    raiseStep: 290_000,
    requiresDegree: false,
    icon: 'career:professor',
    description: 'The person half the professors at this table would name if you asked who mattered most. There is no promotion from this and there was never going to be.',
    isCalling: true,
  },
  {
    id: 'career-jpr-glassblower',
    title: 'Scientific Glassblower',
    salary: 5_200_000,
    raiseStep: 320_000,
    requiresDegree: false,
    icon: 'career:workshop-owner',
    description: 'Four people in the country can still make this piece, and one of them is teaching an apprentice in your workshop. Nobody has ever offered you a better job, because there is not one.',
    isCalling: true,
  },
]

/**
 * The academia shelf: everything a doctorate actually opens, and every one of
 * these posts has an end date printed on it.
 *
 * This is the volatile pool — the base game's basic-ladder shape, moved onto
 * the road that pays a bill. The bottom is genuinely grim (a lecturer paid by
 * the course, a station assistant paid by the season), the top is the tallest
 * on the board, and how far up you get is decided by open competition rather
 * than by staying put. Nine of these rungs carry `payPerPip` and are paid by
 * the die, because soft money is the truest thing about the work: whether the
 * salary exists next year is decided by a panel you will never meet.
 *
 * The clinic ladder is salaried all the way up, which is its own bitter joke:
 * medicine pays even inside a university.
 */
export const ACADEMIA_CAREERS: readonly Career[] = [
  // --- the lab -------------------------------------------------------------
  {
    id: 'career-jpr-postdoc',
    title: 'Postdoctoral Fellow',
    salary: 3_500_000,
    payPerPip: 1_000_000,
    raiseStep: 180_000,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'Three years, one question, and a grant that runs out slightly before the answer does. There were ten thousand of you before there were posts for any of you.',
    promotesTo: 'career-jpr-assistant-professor',
    promotionSpin: OPEN_CALL,
  },
  {
    id: 'career-jpr-assistant-professor',
    title: 'Assistant Professor',
    salary: 6_300_000,
    raiseStep: 320_000,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'Your own students, your own bench, and a contract with a year printed on it that everybody in the building has quietly noted.',
    promotesTo: 'career-jpr-project-associate-professor',
    promotionSpin: THE_CHAIR,
  },
  {
    id: 'career-jpr-project-associate-professor',
    title: 'Project Associate Professor',
    salary: 10_500_000,
    raiseStep: 540_000,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'A real group, a real budget, and a title with the word "project" in it, which is how everyone knows when it ends.',
  },
  // --- the field station ---------------------------------------------------
  {
    id: 'career-jpr-station-assistant',
    title: 'Station Research Assistant',
    salary: 3_150_000,
    payPerPip: 900_000,
    raiseStep: 160_000,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'Counts things in cold water for somebody else\'s paper, six months a year, and would not swap it for an office.',
    promotesTo: 'career-jpr-station-scientist',
    promotionSpin: OPEN_CALL,
  },
  {
    id: 'career-jpr-station-scientist',
    title: 'Station Scientist',
    salary: 5_600_000,
    payPerPip: 1_600_000,
    raiseStep: 290_000,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'Runs the survey that has run every year since 1962, and the good years and the broken-boat years pay differently.',
    promotesTo: 'career-jpr-station-director',
    promotionSpin: THE_CHAIR,
  },
  {
    id: 'career-jpr-station-director',
    title: 'Station Director',
    salary: 9_800_000,
    raiseStep: 500_000,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'Keeps a building on a headland, four boats and one irreplaceable data series alive, mostly by writing letters.',
  },
  // --- the clinic ----------------------------------------------------------
  {
    id: 'career-jpr-clinical-fellow',
    title: 'Clinical Research Fellow',
    salary: 10_500_000,
    raiseStep: 540_000,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Sees patients four days a week and writes the study on the fifth, which is a seven-day week described optimistically.',
    promotesTo: 'career-jpr-trial-physician',
    promotionSpin: OPEN_CALL,
  },
  {
    id: 'career-jpr-trial-physician',
    title: 'Trial Physician',
    salary: 11_900_000,
    raiseStep: 610_000,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Holds the arm of the study that decides whether the drug is real, and signs every page of it.',
    promotesTo: 'career-jpr-trial-centre-director',
    promotionSpin: THE_CHAIR,
  },
  {
    id: 'career-jpr-trial-centre-director',
    title: 'Trial Centre Director',
    salary: 14_000_000,
    raiseStep: 710_000,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Runs forty trials across eleven hospitals, and is the reason a country\'s worth of patients gets asked at all.',
  },
  // --- the lecturing road: the grimmest bottom rung on the board ------------
  {
    id: 'career-jpr-part-time-lecturer',
    title: 'Part-Time Lecturer',
    salary: 2_450_000,
    payPerPip: 700_000,
    raiseStep: 130_000,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'Paid by the course, at three universities, on trains between them — the way a courier is paid by the drop, and with the same view of next April.',
    promotesTo: 'career-jpr-project-lecturer',
    promotionSpin: OPEN_CALL,
  },
  {
    id: 'career-jpr-project-lecturer',
    title: 'Project Lecturer',
    salary: 4_900_000,
    payPerPip: 1_400_000,
    raiseStep: 250_000,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'One university, one desk, one grant line paying for you, and a first-year cohort who think you have always been here.',
    promotesTo: 'career-jpr-teaching-professor',
    promotionSpin: THE_CHAIR,
  },
  {
    id: 'career-jpr-teaching-professor',
    title: 'Teaching Professor',
    salary: 8_400_000,
    raiseStep: 430_000,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'Teaches nine hundred students a year and is better at it than anybody who was hired to do research.',
  },
  // --- the communications desk ---------------------------------------------
  {
    id: 'career-jpr-science-writer',
    title: 'Science Writer',
    salary: 7_700_000,
    payPerPip: 2_200_000,
    raiseStep: 390_000,
    requiresDegree: true,
    icon: 'career:writer',
    description: 'Explains the preprint on live television. The preprint is sometimes retracted the following week; the clip never is.',
    promotesTo: 'career-jpr-exhibition-director',
    promotionSpin: OPEN_CALL,
  },
  {
    id: 'career-jpr-exhibition-director',
    title: 'Exhibition Director',
    salary: 8_050_000,
    payPerPip: 2_300_000,
    raiseStep: 410_000,
    requiresDegree: true,
    icon: 'career:journalist',
    description: 'Turns a decade of somebody\'s fieldwork into eleven rooms a seven-year-old walks through with their mouth open.',
    promotesTo: 'career-jpr-science-producer',
    promotionSpin: THE_CHAIR,
  },
  {
    id: 'career-jpr-science-producer',
    title: 'Science Producer',
    salary: 9_800_000,
    payPerPip: 2_800_000,
    raiseStep: 500_000,
    requiresDegree: true,
    icon: 'career:record-producer',
    description: 'Makes the series that teachers show first, and the licensing keeps arriving long after the crew has moved on.',
  },
  // --- the core facility ---------------------------------------------------
  {
    id: 'career-jpr-instrument-scientist',
    title: 'Instrument Scientist',
    salary: 8_400_000,
    raiseStep: 430_000,
    requiresDegree: true,
    icon: 'career:mechanic',
    description: 'Keeps the machine everybody\'s results depend on inside its tolerance, and is thanked in the acknowledgements at best.',
    promotesTo: 'career-jpr-core-facility-head',
    promotionSpin: OPEN_CALL,
  },
  {
    id: 'career-jpr-core-facility-head',
    title: 'Head of the Core Facility',
    salary: 9_100_000,
    raiseStep: 470_000,
    requiresDegree: true,
    icon: 'career:workshop-owner',
    description: 'Four instruments, one booking calendar, and the diplomatic skill to run it without a single professor going to the dean.',
  },
  // --- the research centre: the tallest ladder on the board -----------------
  {
    id: 'career-jpr-research-administrator',
    title: 'Research Administrator',
    salary: 8_750_000,
    raiseStep: 450_000,
    requiresDegree: true,
    icon: 'career:ministry-official',
    description: 'Has read every funding call in the country and knows which three your group could actually win.',
    promotesTo: 'career-jpr-centre-manager',
    promotionSpin: OPEN_CALL,
  },
  {
    id: 'career-jpr-centre-manager',
    title: 'Centre Manager',
    salary: 9_800_000,
    raiseStep: 500_000,
    requiresDegree: true,
    icon: 'career:product-manager',
    description: 'Runs a hundred and forty people on eleven grants with four end dates, and knows all four by heart.',
    promotesTo: 'career-jpr-centre-director',
    promotionSpin: THE_CHAIR,
  },
  {
    id: 'career-jpr-centre-director',
    title: 'Centre Director',
    salary: 14_700_000,
    payPerPip: 4_200_000,
    raiseStep: 750_000,
    requiresDegree: true,
    icon: 'career:agency-owner',
    description: 'A ten-year national programme with your name on the application. One renewal year is worth three bridging years, and everybody in the building knows which kind this is.',
  },
  // --- the research brewery ------------------------------------------------
  {
    id: 'career-jpr-fermentation-scientist',
    title: 'Fermentation Scientist',
    salary: 7_700_000,
    raiseStep: 390_000,
    requiresDegree: true,
    icon: 'career:rice-apprentice',
    description: 'Two hundred yeast strains in a freezer, and a genuine argument every spring about which of them made the good year good.',
    promotesTo: 'career-jpr-brewing-research-lead',
    promotionSpin: OPEN_CALL,
  },
  {
    id: 'career-jpr-brewing-research-lead',
    title: 'Brewing Research Lead',
    salary: 7_000_000,
    raiseStep: 360_000,
    requiresDegree: true,
    icon: 'career:noodle-cook',
    description: 'Half the country\'s breweries send you their problems, and the answer is usually temperature.',
    promotesTo: 'career-jpr-head-of-research-brewing',
    promotionSpin: THE_CHAIR,
  },
  {
    id: 'career-jpr-head-of-research-brewing',
    title: 'Head of Research Brewing',
    salary: 8_400_000,
    raiseStep: 430_000,
    requiresDegree: true,
    icon: 'career:pastry-chef',
    description: 'Runs the national institute\'s brewery, publishes on it, and tastes everything before it goes near a paper.',
  },
  // --- callings ------------------------------------------------------------
  {
    id: 'career-jpr-curator-of-beetles',
    title: 'Curator of Beetles',
    salary: 7_400_000,
    raiseStep: 460_000,
    requiresDegree: true,
    icon: 'career:marine-biologist',
    description: 'There are four hundred thousand species and somebody has to love every one of them. There is no promotion from this and there was never going to be.',
    isCalling: true,
  },
  {
    id: 'career-jpr-programme-officer',
    title: 'Programme Officer',
    salary: 8_200_000,
    raiseStep: 510_000,
    requiresDegree: true,
    icon: 'career:ministry-official',
    description: 'Reads two hundred proposals a year and funds twelve dreams. Turned down a laboratory of their own to do it, and has never once been sorry.',
    isCalling: true,
  },
]

/**
 * The permanent shelf: the post at the far end of the Fixed-Term Ladder, and
 * the safest work in this whole game.
 *
 * Reached exactly one way — the Ten-Year Cliff at the end of the gated road —
 * and worth the decade because of what it is not. Every rung carries
 * `cannotBeLaidOff`, which is the mechanical form of the only sentence this
 * shelf needs: nobody can end it. Not a committee, not a funder, not a
 * reorganisation, not the Layoff Notice tile that has been taking jobs off
 * this table since the game shipped.
 *
 * Highest floor, and deliberately **not** the highest ceiling. The academia
 * shelf tops out at ¥14.7M and this one at ¥9.4M, so the player who spent
 * their life on soft money and climbed the whole way still out-earns the
 * professor — which keeps the gated road a real argument rather than an
 * upgrade, and keeps the board honest about what security actually costs.
 * The ladder is two rungs and climbs on the ordinary four-in-six step: once
 * the post is permanent the promotions are a matter of years again, and the
 * relief of that is most of what the road was for.
 */
const PERMANENT_POSTS: readonly Career[] = [
  {
    id: 'career-jpr-associate-professor',
    title: 'Associate Professor',
    salary: 8_100_000,
    raiseStep: 410_000,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'The letter says the appointment has no end date on it. You read that line four times, and then once more the next morning.',
    promotesTo: 'career-jpr-professor',
    promotionSpin: IN_HOUSE,
  },
  {
    id: 'career-jpr-professor',
    title: 'Professor',
    salary: 8_800_000,
    raiseStep: 450_000,
    requiresDegree: true,
    icon: 'career:professor',
    description: 'Runs the laboratory, raises the money, and lets six other people put their names first.',
  },
  {
    id: 'career-jpr-institute-senior-researcher',
    title: 'Senior Researcher',
    salary: 8_600_000,
    raiseStep: 440_000,
    requiresDegree: true,
    icon: 'career:robotics-engineer',
    description: 'A national institute, a twenty-year instrument, and a badge that opens the gate at four in the morning.',
    promotesTo: 'career-jpr-laboratory-head',
    promotionSpin: IN_HOUSE,
  },
  {
    id: 'career-jpr-laboratory-head',
    title: 'Laboratory Head',
    salary: 9_300_000,
    raiseStep: 470_000,
    requiresDegree: true,
    icon: 'career:robotics-engineer',
    description: 'Picks which of the institute\'s forty ideas get a year each, and is wrong about roughly half.',
  },
  {
    id: 'career-jpr-hospital-lecturer',
    title: 'Hospital Lecturer',
    salary: 8_000_000,
    raiseStep: 410_000,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'A ward, a teaching round and a research day, all of them permanent, none of them quiet.',
    promotesTo: 'career-jpr-head-of-clinical-research',
    promotionSpin: IN_HOUSE,
  },
  {
    id: 'career-jpr-head-of-clinical-research',
    title: 'Head of Clinical Research',
    salary: 8_700_000,
    raiseStep: 440_000,
    requiresDegree: true,
    icon: 'career:surgeon',
    description: 'Takes the cases the other hospitals send on, and writes the paper about how it went.',
  },
  {
    id: 'career-jpr-principal-engineer',
    title: 'Principal Engineer',
    salary: 8_400_000,
    raiseStep: 430_000,
    requiresDegree: true,
    icon: 'career:rocket-engineer',
    description: 'Four years on a nozzle the size of a hat, and a tonne off the launch mass at the end of it.',
    promotesTo: 'career-jpr-chief-engineer',
    promotionSpin: IN_HOUSE,
  },
  {
    id: 'career-jpr-chief-engineer',
    title: 'Chief Engineer',
    salary: 9_000_000,
    raiseStep: 460_000,
    requiresDegree: true,
    icon: 'career:rocket-engineer',
    description: 'Signs the drawing that says the engine will light, and is in the room at three in the morning when it does.',
  },
  {
    id: 'career-jpr-climate-modeller',
    title: 'Climate Modeller',
    salary: 8_800_000,
    raiseStep: 450_000,
    requiresDegree: true,
    icon: 'career:geologist',
    description: 'Runs the ocean for a hundred years overnight, and checks it against a century of tide gauges before breakfast.',
    promotesTo: 'career-jpr-chief-scientist',
    promotionSpin: IN_HOUSE,
  },
  {
    id: 'career-jpr-chief-scientist',
    title: 'Chief Scientist',
    salary: 9_400_000,
    raiseStep: 480_000,
    requiresDegree: true,
    icon: 'career:geologist',
    description: 'Explains to a committee, patiently and for the ninth time, what the error bars actually mean.',
  },
]

/**
 * Stamped rather than written out ten times, so the shelf's whole promise
 * cannot be broken by adding an eleventh rung and forgetting the flag. The
 * permanence is a property of *being on this shelf*, not of any one post.
 */
export const PERMANENT_CAREERS: readonly Career[] = PERMANENT_POSTS.map((career) => ({
  ...career,
  cannotBeLaidOff: true,
}))
