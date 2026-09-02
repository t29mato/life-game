import type { InsuranceKind, Money } from './types'
import { USA_ECONOMY } from '../edition/usa/economy'

/**
 * The USA edition's money, under the names the codebase already knows.
 *
 * Every figure below now lives on `EconomyConstants` (see
 * `src/domain/edition/types.ts`), because a second edition counts in a
 * different unit and every one of these is tuned against the others. What
 * survives here is the *reading*: `WEDDING_GIFT` says what it is, and
 * `edition.economy.weddingGift` says it more clumsily in the twenty modules
 * that only ever meant the one board.
 *
 * The rule that keeps this honest: **the engine reads money from the edition,
 * never from this module.** These names are for tests, for panels rendering a
 * player with no game around them, and for defaults on functions whose callers
 * have no edition to hand. A rule that consults `LOAN_PRINCIPAL` directly is a
 * rule that will charge a Japanese player in dollars.
 */

/** Cash every player starts with. */
export const STARTING_MONEY: Money = USA_ECONOMY.startingMoney

/** Principal received per loan taken. */
export const LOAN_PRINCIPAL: Money = USA_ECONOMY.loanPrincipal

/** Repaid per loan at retirement: principal plus interest. */
export const LOAN_REPAYMENT: Money = USA_ECONOMY.loanRepayment.normal

/** Wedding gift each other player hands the newlywed. */
export const WEDDING_GIFT: Money = USA_ECONOMY.weddingGift


/** Bonus for the first player to retire; each later place gets half of the one before. */
export const FIRST_RETIREMENT_BONUS: Money = USA_ECONOMY.firstRetirementBonus

/**
 * Casual pay per pip while between jobs. A player with no career used to
 * collect nothing at all on a payday, which made unemployment a dead stretch
 * of turns; now they pick up shifts, and the wheel decides how good the week
 * was. Deliberately well under any real salary — it keeps you fed, not rich.
 */
export const CASUAL_WAGE_PER_PIP: Money = USA_ECONOMY.casualWagePerPip

/** Premium charged once when a policy is taken out. */
export const INSURANCE_PREMIUM: Record<InsuranceKind, Money> = { ...USA_ECONOMY.insurancePremium }

/** What a life policy matures into at the final scoring, low face to high. */
export const LIFE_INSURANCE_MATURITY: readonly [Money, Money] = USA_ECONOMY.lifeInsuranceMaturity

/** Cost to repay a single loan early at the bank — cheaper than `LOAN_REPAYMENT`. */
export const EARLY_LOAN_REPAYMENT: Money = USA_ECONOMY.earlyLoanRepayment.normal

// --- Engine constants -------------------------------------------------------
// Not money, and not a country's business: these are rules, and they are the
// same rules on every board.

/** Shares bought per purchase at a stock space. */
export const SHARES_PER_PURCHASE = 1

/**
 * How many faces the die has — every roll in the game is one throw of it.
 *
 * Written once because half a dozen rules average over the faces rather than
 * over a hypothesis: an expected child, an expected marriage, an expected
 * tuition bill. Each of those used to sum a hand-written `[1..10]`, and ten
 * hand-written copies of a fact are ten places for it to go stale the day the
 * wheel became a die.
 */
export const SPIN_FACES = 6
