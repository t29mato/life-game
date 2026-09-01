import { describe, expect, it } from 'vitest'
import type { Career, House, LifeTile, Player, Stock } from '../model/types'
import {
  CASUAL_WAGE_PER_PIP,
  EARLY_LOAN_REPAYMENT,
  INSURANCE_PREMIUM,
  LOAN_PRINCIPAL,
  STARTING_MONEY,
} from '../model/constants'
import {
  AVERAGE_SPIN,
  addChildren,
  addInsurance,
  addLifeTiles,
  applyPayRaise,
  buyHouse,
  buyShares,
  createPlayer,
  creditPlayer,
  debitPlayer,
  divorcePlayer,
  expectedPayday,
  graduatePlayer,
  hasInsurance,
  isCoveredAgainst,
  loseCareer,
  marryPlayer,
  movePlayerTo,
  paydayKindOf,
  paydayPayFor,
  payPlayerSalary,
  removeLifeTile,
  repayLoan,
  retirePlayer,
  setCareer,
  setMoney,
  takeLoan,
  totalShares,
  tradeUpHouse,
} from './player'

const CAREER: Career = {
  id: 'career-test',
  title: 'Test Career',
  salary: 40_000,
  raiseStep: 5_000,
  requiresDegree: false,
  icon: 'space:payday',
  description: 'A career used only in tests.',
}

/** A trade whose weeks differ: the wheel decides what the packet is worth. */
const UNSTEADY_CAREER: Career = {
  id: 'career-test-unsteady',
  title: 'Test Unsteady Career',
  salary: 44_100,
  payPerPip: 12_600,
  raiseStep: 5_500,
  requiresDegree: false,
  icon: 'space:payday',
  description: 'An unsteady career used only in tests.',
}

const HOUSE: House = {
  id: 'house-test',
  name: 'Test House',
  price: 100_000,
  resaleRange: [80_000, 130_000],
  icon: 'space:payday',
  description: 'A house used only in tests.',
}

const BIGGER_HOUSE: House = {
  id: 'house-bigger',
  name: 'Bigger House',
  price: 250_000,
  resaleRange: [200_000, 300_000],
  icon: 'space:payday',
  description: 'A larger house used only in tests.',
}

const TILE_A: LifeTile = { id: 'tile-a', title: 'Tile A', value: 10_000, icon: 'space:payday' }
const TILE_B: LifeTile = { id: 'tile-b', title: 'Tile B', value: 20_000, icon: 'space:payday' }

const STOCK: Stock = {
  id: 'stock-test',
  name: 'Test Holdings',
  ticker: 'TST',
  price: 10_000,
  payoutRange: [4_000, 20_000],
  icon: 'space:payday',
  description: 'A stock used only in tests.',
}

const OTHER_STOCK: Stock = { ...STOCK, id: 'stock-other', ticker: 'OTH', price: 5_000 }

function basePlayer(overrides: Partial<Player> = {}): Player {
  return { ...createPlayer('p1', 'Alex', 'red', 'start', false), ...overrides }
}

describe('createPlayer', () => {
  it('creates a fresh player with starting money and empty state', () => {
    const player = createPlayer('p1', 'Alex', 'red', 'start', false)
    expect(player).toEqual({
      id: 'p1',
      name: 'Alex',
      color: 'red',
      spaceId: 'start',
      money: STARTING_MONEY,
      loans: 0,
      career: null,
      hasDegree: false,
      hasDoctorate: false,
      isMarried: false,
      children: 0,
      house: null,
      lifeTiles: [],
      stocks: [],
      insurance: [],
      isCpu: false,
      isRetired: false,
      retirementRank: null,
    })
  })

  it('marks a computer seat as such', () => {
    expect(createPlayer('p2', 'Robo', 'blue', 'start', true).isCpu).toBe(true)
  })
})

describe('setMoney', () => {
  it('replaces cash outright without touching loans', () => {
    const player = basePlayer({ money: 1_000, loans: 2 })
    const result = setMoney(player, 90_000)
    expect(result.money).toBe(90_000)
    expect(result.loans).toBe(2)
    expect(player.money).toBe(1_000)
  })

  it('can set a player into the red', () => {
    expect(setMoney(basePlayer(), -5_000).money).toBe(-5_000)
  })
})

describe('loseCareer', () => {
  it('clears the career so paydays drop to casual shifts', () => {
    const player = basePlayer({ career: CAREER })
    const result = loseCareer(player)
    expect(result.career).toBeNull()
    expect(payPlayerSalary(result, 5).money).toBe(result.money + CASUAL_WAGE_PER_PIP * 5)
    expect(player.career).toEqual(CAREER)
  })

  it('is harmless for a player who was already out of work', () => {
    const player = basePlayer({ career: null })
    expect(loseCareer(player).career).toBeNull()
  })
})

describe('buyShares', () => {
  it('debits the price per share and records the holding', () => {
    const player = basePlayer({ money: 50_000 })
    const result = buyShares(player, STOCK, 2)
    expect(result.money).toBe(50_000 - 20_000)
    expect(result.stocks).toEqual([{ stockId: 'stock-test', shares: 2 }])
    expect(player.stocks).toEqual([])
  })

  it('tops up an existing holding rather than adding a second row', () => {
    const player = basePlayer({ money: 50_000, stocks: [{ stockId: 'stock-test', shares: 1 }] })
    const result = buyShares(player, STOCK, 3)
    expect(result.stocks).toEqual([{ stockId: 'stock-test', shares: 4 }])
  })

  it('keeps holdings in different stocks apart', () => {
    const bought = buyShares(basePlayer({ money: 50_000 }), STOCK, 1)
    const result = buyShares(bought, OTHER_STOCK, 2)
    expect(result.stocks).toEqual([
      { stockId: 'stock-test', shares: 1 },
      { stockId: 'stock-other', shares: 2 },
    ])
  })

  it('auto-borrows when the player cannot cover the purchase', () => {
    const player = basePlayer({ money: 0, loans: 0 })
    const result = buyShares(player, STOCK, 1)
    expect(result.loans).toBeGreaterThan(0)
    expect(result.stocks).toEqual([{ stockId: 'stock-test', shares: 1 }])
  })

  it('is a no-op for zero shares', () => {
    const player = basePlayer({ money: 50_000 })
    expect(buyShares(player, STOCK, 0)).toEqual(player)
  })

  it('throws for a negative share count', () => {
    expect(() => buyShares(basePlayer(), STOCK, -1)).toThrow()
  })
})

describe('totalShares', () => {
  it('sums every share across every holding', () => {
    const player = basePlayer({
      stocks: [
        { stockId: 'stock-test', shares: 2 },
        { stockId: 'stock-other', shares: 3 },
      ],
    })
    expect(totalShares(player)).toBe(5)
  })

  it('is zero for a player holding nothing', () => {
    expect(totalShares(basePlayer())).toBe(0)
  })
})

describe('addInsurance', () => {
  it('adds the policy and charges its premium', () => {
    const player = basePlayer({ money: 100_000 })
    const result = addInsurance(player, 'home')
    expect(result.insurance).toEqual(['home'])
    expect(result.money).toBe(100_000 - INSURANCE_PREMIUM.home)
    expect(player.insurance).toEqual([])
  })

  it('charges nothing and changes nothing when the cover is already held', () => {
    const insured = addInsurance(basePlayer({ money: 100_000 }), 'auto')
    const again = addInsurance(insured, 'auto')
    expect(again).toEqual(insured)
    expect(again.insurance).toEqual(['auto'])
  })

  it('lets a player stack different kinds of cover', () => {
    const result = addInsurance(addInsurance(basePlayer({ money: 200_000 }), 'home'), 'life')
    expect(result.insurance).toEqual(['home', 'life'])
    expect(result.money).toBe(200_000 - INSURANCE_PREMIUM.home - INSURANCE_PREMIUM.life)
  })

  it('auto-borrows for a premium the player cannot afford', () => {
    const result = addInsurance(basePlayer({ money: 0 }), 'life')
    expect(result.insurance).toEqual(['life'])
    expect(result.loans).toBeGreaterThan(0)
  })
})

describe('hasInsurance', () => {
  it('reports the policies held and only those', () => {
    const player = basePlayer({ insurance: ['home'] })
    expect(hasInsurance(player, 'home')).toBe(true)
    expect(hasInsurance(player, 'auto')).toBe(false)
    expect(hasInsurance(player, 'life')).toBe(false)
  })
})

describe('isCoveredAgainst', () => {
  it('waives a fire only for a home policy', () => {
    expect(isCoveredAgainst(basePlayer({ insurance: ['home'] }), 'fire')).toBe(true)
    expect(isCoveredAgainst(basePlayer({ insurance: ['auto'] }), 'fire')).toBe(false)
  })

  it('waives an accident only for an auto policy', () => {
    expect(isCoveredAgainst(basePlayer({ insurance: ['auto'] }), 'accident')).toBe(true)
    expect(isCoveredAgainst(basePlayer({ insurance: ['home'] }), 'accident')).toBe(false)
  })

  it('never lets a life policy cover a hazard', () => {
    const player = basePlayer({ insurance: ['life'] })
    expect(isCoveredAgainst(player, 'fire')).toBe(false)
    expect(isCoveredAgainst(player, 'accident')).toBe(false)
  })

  it('covers nothing for an uninsured player', () => {
    expect(isCoveredAgainst(basePlayer(), 'fire')).toBe(false)
    expect(isCoveredAgainst(basePlayer(), 'accident')).toBe(false)
  })
})

describe('takeLoan', () => {
  it('hands over the principal and counts the debt', () => {
    const player = basePlayer({ money: 1_000, loans: 1 })
    const result = takeLoan(player)
    expect(result.money).toBe(1_000 + LOAN_PRINCIPAL)
    expect(result.loans).toBe(2)
    expect(player.loans).toBe(1)
  })
})

describe('repayLoan', () => {
  it('clears one loan for the early-repayment price', () => {
    const player = basePlayer({ money: 60_000, loans: 2 })
    const result = repayLoan(player)
    expect(result.loans).toBe(1)
    expect(result.money).toBe(60_000 - EARLY_LOAN_REPAYMENT)
  })

  it('leaves a debt-free player completely alone', () => {
    const player = basePlayer({ money: 60_000, loans: 0 })
    expect(repayLoan(player)).toEqual(player)
  })

  it('never drives the loan count below zero, even when it has to borrow to pay', () => {
    const result = repayLoan(basePlayer({ money: 0, loans: 1 }))
    expect(result.loans).toBeGreaterThanOrEqual(0)
  })
})

describe('removeLifeTile', () => {
  it('drops the named tile', () => {
    const player = basePlayer({ lifeTiles: [TILE_A, TILE_B] })
    const result = removeLifeTile(player, 'tile-a')
    expect(result.lifeTiles).toEqual([TILE_B])
    expect(player.lifeTiles).toEqual([TILE_A, TILE_B])
  })

  it('takes only one copy when the player holds the same story twice', () => {
    const player = basePlayer({ lifeTiles: [TILE_A, TILE_A, TILE_B] })
    expect(removeLifeTile(player, 'tile-a').lifeTiles).toEqual([TILE_A, TILE_B])
  })

  it('leaves the player untouched when they never held it', () => {
    const player = basePlayer({ lifeTiles: [TILE_B] })
    expect(removeLifeTile(player, 'tile-a')).toEqual(player)
  })

  it('leaves an empty collection empty', () => {
    const player = basePlayer({ lifeTiles: [] })
    expect(removeLifeTile(player, 'tile-a').lifeTiles).toEqual([])
  })
})

describe('tradeUpHouse', () => {
  it('credits the old house at its price and debits the new one', () => {
    const player = basePlayer({ money: 200_000, house: HOUSE })
    const result = tradeUpHouse(player, BIGGER_HOUSE)
    expect(result.house).toEqual(BIGGER_HOUSE)
    expect(result.money).toBe(200_000 + HOUSE.price - BIGGER_HOUSE.price)
    expect(player.house).toEqual(HOUSE)
  })

  it('is an ordinary purchase for a player who never bought a house', () => {
    const player = basePlayer({ money: 300_000, house: null })
    const result = tradeUpHouse(player, BIGGER_HOUSE)
    expect(result.house).toEqual(BIGGER_HOUSE)
    expect(result.money).toBe(300_000 - BIGGER_HOUSE.price)
    expect(result.loans).toBe(0)
  })

  it('auto-borrows when the difference is more than the player has', () => {
    const player = basePlayer({ money: 0, house: HOUSE })
    const result = tradeUpHouse(player, BIGGER_HOUSE)
    expect(result.house).toEqual(BIGGER_HOUSE)
    expect(result.loans).toBeGreaterThan(0)
  })
})

describe('creditPlayer', () => {
  it('adds cash without mutating the input', () => {
    const player = basePlayer({ money: 1_000 })
    const result = creditPlayer(player, 500)
    expect(result.money).toBe(1_500)
    expect(player.money).toBe(1_000)
  })

  it('is a no-op for a zero amount', () => {
    const player = basePlayer({ money: 1_000 })
    expect(creditPlayer(player, 0).money).toBe(1_000)
  })
})

describe('debitPlayer', () => {
  it('subtracts cash when there is enough to cover it', () => {
    const player = basePlayer({ money: 1_000 })
    const result = debitPlayer(player, 400)
    expect(result.money).toBe(600)
    expect(result.loans).toBe(0)
  })

  it('does not mutate the input player', () => {
    const player = basePlayer({ money: 1_000 })
    debitPlayer(player, 400)
    expect(player.money).toBe(1_000)
    expect(player.loans).toBe(0)
  })

  it('throws for a negative amount', () => {
    const player = basePlayer({ money: 1_000 })
    expect(() => debitPlayer(player, -1)).toThrow()
  })

  it('takes exactly the loans needed to cover a big bill, e.g. 3 for $5k paying $50k', () => {
    const player = basePlayer({ money: 5_000, loans: 0 })
    const result = debitPlayer(player, 50_000)
    // 5000 -> +20000=25000 -> +20000=45000 -> +20000=65000 (enough) -> -50000=15000
    expect(result.loans).toBe(3)
    expect(result.money).toBe(5_000 + LOAN_PRINCIPAL * 3 - 50_000)
  })

  it('takes no loan when cash exactly covers the bill', () => {
    const player = basePlayer({ money: 1_000 })
    const result = debitPlayer(player, 1_000)
    expect(result.money).toBe(0)
    expect(result.loans).toBe(0)
  })

  it('takes exactly one loan when short by a small amount', () => {
    const player = basePlayer({ money: 1_000 })
    const result = debitPlayer(player, 1_500)
    expect(result.loans).toBe(1)
    expect(result.money).toBe(1_000 + LOAN_PRINCIPAL - 1_500)
  })

  it('accumulates on top of existing loans', () => {
    const player = basePlayer({ money: 0, loans: 2 })
    const result = debitPlayer(player, 10_000)
    expect(result.loans).toBe(3)
  })
})

describe('paydayKindOf', () => {
  it('calls a salaried job steady', () => {
    expect(paydayKindOf(basePlayer({ career: CAREER }))).toBe('salary')
  })

  it('calls a job with pay per pip variable', () => {
    expect(paydayKindOf(basePlayer({ career: UNSTEADY_CAREER }))).toBe('variable')
  })

  it('calls having no job at all casual', () => {
    expect(paydayKindOf(basePlayer({ career: null }))).toBe('casual')
  })
})

describe('paydayPayFor', () => {
  it('ignores the spin for a salaried job', () => {
    const player = basePlayer({ career: CAREER })
    expect(paydayPayFor(player, 1)).toBe(CAREER.salary)
    expect(paydayPayFor(player, 6)).toBe(CAREER.salary)
  })

  it('multiplies pay per pip by the spin for unsteady work', () => {
    const player = basePlayer({ career: UNSTEADY_CAREER })
    expect(paydayPayFor(player, 3)).toBe(UNSTEADY_CAREER.payPerPip! * 3)
    expect(paydayPayFor(player, 6)).toBe(UNSTEADY_CAREER.payPerPip! * 6)
  })

  it('pays the casual wage per pip while between jobs', () => {
    const player = basePlayer({ career: null })
    expect(paydayPayFor(player, 5)).toBe(CASUAL_WAGE_PER_PIP * 5)
  })

  it('never pays nothing, whatever the spin and whoever the player is', () => {
    for (const career of [CAREER, UNSTEADY_CAREER, null]) {
      for (const spin of [1, 3, 6] as const) {
        expect(paydayPayFor(basePlayer({ career }), spin)).toBeGreaterThan(0)
      }
    }
  })
})

describe('expectedPayday', () => {
  it('is the salary for any job, steady or not — that is what salary means', () => {
    expect(expectedPayday(basePlayer({ career: CAREER }))).toBe(CAREER.salary)
    expect(expectedPayday(basePlayer({ career: UNSTEADY_CAREER }))).toBe(UNSTEADY_CAREER.salary)
  })

  it('is the casual wage over an average spin while between jobs', () => {
    expect(expectedPayday(basePlayer({ career: null }))).toBe(CASUAL_WAGE_PER_PIP * AVERAGE_SPIN)
  })

  it('sits within a rounding step of what an unsteady job really averages', () => {
    // `salary` is only honest for unsteady work while `payPerPip` stays near
    // `salary / AVERAGE_SPIN`; this is what keeps the panel's figure true.
    const average = UNSTEADY_CAREER.payPerPip! * AVERAGE_SPIN
    expect(Math.abs(average - UNSTEADY_CAREER.salary) / UNSTEADY_CAREER.salary).toBeLessThan(0.01)
  })
})

describe('payPlayerSalary', () => {
  it('pays the career salary, whatever the spin was', () => {
    const player = basePlayer({ money: 0, career: CAREER })
    expect(payPlayerSalary(player, 2).money).toBe(CAREER.salary)
  })

  it('pays the spin against pay per pip for unsteady work', () => {
    const player = basePlayer({ money: 0, career: UNSTEADY_CAREER })
    expect(payPlayerSalary(player, 4).money).toBe(UNSTEADY_CAREER.payPerPip! * 4)
  })

  it('pays casual shifts to a player with no job rather than nothing', () => {
    const player = basePlayer({ money: 500, career: null })
    expect(payPlayerSalary(player, 6).money).toBe(500 + CASUAL_WAGE_PER_PIP * 6)
  })
})

describe('applyPayRaise', () => {
  it('increases salary by raiseStep, replacing the career object immutably', () => {
    const player = basePlayer({ career: CAREER })
    const result = applyPayRaise(player)
    expect(result.career).toEqual({ ...CAREER, salary: CAREER.salary + CAREER.raiseStep })
    expect(player.career).toEqual(CAREER)
  })

  it('raises the pay per pip alongside the salary, so a raise is worth something on unsteady work', () => {
    const player = basePlayer({ career: UNSTEADY_CAREER })
    const raised = applyPayRaise(player).career!
    expect(raised.salary).toBe(UNSTEADY_CAREER.salary + UNSTEADY_CAREER.raiseStep)
    expect(raised.payPerPip).toBe(
      UNSTEADY_CAREER.payPerPip! + Math.round(UNSTEADY_CAREER.raiseStep / AVERAGE_SPIN),
    )
    // And the headline figure stays honest after the raise, too.
    expect(Math.abs(raised.payPerPip! * AVERAGE_SPIN - raised.salary) / raised.salary).toBeLessThan(0.01)
  })

  it('is a no-op when unemployed', () => {
    const player = basePlayer({ career: null })
    const result = applyPayRaise(player)
    expect(result.career).toBeNull()
  })
})

describe('graduatePlayer', () => {
  it('sets hasDegree to true without mutating the input', () => {
    const player = basePlayer({ hasDegree: false })
    const result = graduatePlayer(player)
    expect(result.hasDegree).toBe(true)
    expect(player.hasDegree).toBe(false)
  })
})

describe('marryPlayer', () => {
  it('sets isMarried to true', () => {
    const player = basePlayer({ isMarried: false })
    expect(marryPlayer(player).isMarried).toBe(true)
    expect(player.isMarried).toBe(false)
  })
})

describe('divorcePlayer', () => {
  it('ends the marriage and sends every child with the departing partner', () => {
    const player = basePlayer({ isMarried: true, children: 3 })
    const result = divorcePlayer(player)
    expect(result.isMarried).toBe(false)
    expect(result.children).toBe(0)
    expect(player.isMarried).toBe(true)
    expect(player.children).toBe(3)
  })
})

describe('addChildren', () => {
  it('adds to the existing children count', () => {
    const player = basePlayer({ children: 1 })
    const result = addChildren(player, 2)
    expect(result.children).toBe(3)
    expect(player.children).toBe(1)
  })
})

describe('setCareer', () => {
  it('sets the career', () => {
    const player = basePlayer({ career: null })
    const result = setCareer(player, CAREER)
    expect(result.career).toEqual(CAREER)
    expect(player.career).toBeNull()
  })
})

describe('buyHouse', () => {
  it('debits the price and sets the house', () => {
    const player = basePlayer({ money: 150_000, house: null })
    const result = buyHouse(player, HOUSE)
    expect(result.house).toEqual(HOUSE)
    expect(result.money).toBe(150_000 - HOUSE.price)
  })

  it('auto-borrows when the player cannot afford it outright', () => {
    const player = basePlayer({ money: 0, loans: 0, house: null })
    const result = buyHouse(player, HOUSE)
    expect(result.house).toEqual(HOUSE)
    expect(result.loans).toBeGreaterThan(0)
  })
})

describe('addLifeTiles', () => {
  it('appends tiles to the existing collection', () => {
    const player = basePlayer({ lifeTiles: [TILE_A] })
    const result = addLifeTiles(player, [TILE_B])
    expect(result.lifeTiles).toEqual([TILE_A, TILE_B])
    expect(player.lifeTiles).toEqual([TILE_A])
  })

  it('supports adding multiple tiles at once', () => {
    const player = basePlayer({ lifeTiles: [] })
    const result = addLifeTiles(player, [TILE_A, TILE_B])
    expect(result.lifeTiles).toEqual([TILE_A, TILE_B])
  })
})

describe('movePlayerTo', () => {
  it('updates the players spaceId', () => {
    const player = basePlayer({ spaceId: 'start' })
    const result = movePlayerTo(player, 'main-1')
    expect(result.spaceId).toBe('main-1')
    expect(player.spaceId).toBe('start')
  })
})

describe('retirePlayer', () => {
  it('sets isRetired and the retirement rank', () => {
    const player = basePlayer({ isRetired: false, retirementRank: null })
    const result = retirePlayer(player, 2)
    expect(result.isRetired).toBe(true)
    expect(result.retirementRank).toBe(2)
    expect(player.isRetired).toBe(false)
  })
})
