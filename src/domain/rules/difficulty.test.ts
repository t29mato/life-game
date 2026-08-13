import { describe, expect, it } from 'vitest'

import { EARLY_LOAN_REPAYMENT, LOAN_PRINCIPAL, LOAN_REPAYMENT } from '../model/constants'
import type { Difficulty, SpaceEffect } from '../model/types'
import {
  DIFFICULTIES,
  difficultyProfile,
  earlyLoanRepaymentFor,
  harshenEffect,
  loanRepaymentFor,
  scaleResale,
  scaleStockPayout,
} from './difficulty'

const ALL: readonly Difficulty[] = DIFFICULTIES

describe('DIFFICULTIES', () => {
  it('lists the three settings from kindest to cruellest', () => {
    expect(DIFFICULTIES).toEqual(['normal', 'hard', 'veryHard'])
  })
})

describe('difficultyProfile', () => {
  it('leaves normal as the game already plays', () => {
    const profile = difficultyProfile('normal')
    expect(profile.gainScale).toBe(1)
    expect(profile.lossScale).toBe(1)
    expect(profile.resaleScale).toBe(1)
    expect(profile.stockScale).toBe(1)
    expect(profile.loanRepayment).toBe(LOAN_REPAYMENT)
    expect(profile.earlyLoanRepayment).toBe(EARLY_LOAN_REPAYMENT)
  })

  it('thins the windfalls and fattens the bills as it climbs', () => {
    const [normal, hard, veryHard] = ALL.map((difficulty) => difficultyProfile(difficulty))
    expect(hard!.gainScale).toBeLessThan(normal!.gainScale)
    expect(veryHard!.gainScale).toBeLessThan(hard!.gainScale)
    expect(hard!.lossScale).toBeGreaterThan(normal!.lossScale)
    expect(veryHard!.lossScale).toBeGreaterThan(hard!.lossScale)
  })

  it('charges more for a loan as it climbs, and never less than the principal', () => {
    const repayments = ALL.map((d) => difficultyProfile(d).loanRepayment)
    expect(repayments[1]).toBeGreaterThan(repayments[0]!)
    expect(repayments[2]).toBeGreaterThan(repayments[1]!)
    for (const repayment of repayments) expect(repayment).toBeGreaterThan(LOAN_PRINCIPAL)
  })

  it('always keeps early repayment cheaper than settling at retirement', () => {
    for (const difficulty of ALL) {
      const profile = difficultyProfile(difficulty)
      expect(profile.earlyLoanRepayment).toBeLessThan(profile.loanRepayment)
      expect(profile.earlyLoanRepayment).toBeGreaterThan(0)
    }
  })

  it('pays less for a house and for a share as it climbs', () => {
    const resale = ALL.map((d) => difficultyProfile(d).resaleScale)
    const stock = ALL.map((d) => difficultyProfile(d).stockScale)
    expect(resale[1]).toBeLessThan(resale[0]!)
    expect(resale[2]).toBeLessThan(resale[1]!)
    expect(stock[1]).toBeLessThan(stock[0]!)
    expect(stock[2]).toBeLessThan(stock[1]!)
    // Nothing is ever worth nothing: a home always sells for something.
    for (const scale of [...resale, ...stock]) expect(scale).toBeGreaterThan(0.5)
  })

  it('falls back to normal for anything it does not recognise', () => {
    // A save written before difficulty existed reloads with the field missing.
    expect(difficultyProfile(undefined)).toEqual(difficultyProfile('normal'))
    expect(difficultyProfile('impossible' as Difficulty)).toEqual(difficultyProfile('normal'))
  })
})

describe('loanRepaymentFor / earlyLoanRepaymentFor', () => {
  it('reads the profile for a difficulty', () => {
    expect(loanRepaymentFor('normal')).toBe(LOAN_REPAYMENT)
    expect(earlyLoanRepaymentFor('normal')).toBe(EARLY_LOAN_REPAYMENT)
    expect(loanRepaymentFor('veryHard')).toBe(difficultyProfile('veryHard').loanRepayment)
  })
})

describe('scaleResale / scaleStockPayout', () => {
  it('leaves a normal game paying exactly what was rolled', () => {
    expect(scaleResale(123_000, 'normal')).toBe(123_000)
    expect(scaleStockPayout(41_000, 'normal')).toBe(41_000)
  })

  it('shaves what a harder game pays out, in whole thousands', () => {
    const rolled = 200_000
    for (const difficulty of ['hard', 'veryHard'] as const) {
      const paid = scaleResale(rolled, difficulty)
      expect(paid).toBeLessThan(rolled)
      expect(paid % 1_000).toBe(0)
    }
  })

  it('never turns a payout negative', () => {
    expect(scaleResale(0, 'veryHard')).toBe(0)
    expect(scaleStockPayout(1_000, 'veryHard')).toBeGreaterThanOrEqual(0)
  })
})

describe('harshenEffect', () => {
  const gain: SpaceEffect = { type: 'gainMoney', amount: 10_000, reason: 'A windfall' }
  const loss: SpaceEffect = { type: 'payMoney', amount: 10_000, reason: 'A bill' }

  it('leaves every effect untouched on normal', () => {
    for (const effect of [gain, loss]) {
      expect(harshenEffect(effect, 'normal')).toEqual(effect)
    }
  })

  it('shrinks what the board gives and grows what the board takes', () => {
    const harshGain = harshenEffect(gain, 'veryHard')
    const harshLoss = harshenEffect(loss, 'veryHard')
    expect(harshGain.type === 'gainMoney' && harshGain.amount).toBeLessThan(10_000)
    expect(harshLoss.type === 'payMoney' && harshLoss.amount).toBeGreaterThan(10_000)
  })

  it('keeps the reason and the hazard tag intact', () => {
    const hazard: SpaceEffect = { type: 'payMoney', amount: 12_000, reason: 'Fire damage', hazard: 'fire' }
    const harsher = harshenEffect(hazard, 'hard')
    expect(harsher.type === 'payMoney' && harsher.reason).toBe('Fire damage')
    expect(harsher.type === 'payMoney' && harsher.hazard).toBe('fire')
  })

  it('scales every money-carrying effect the board can hold', () => {
    const cases: readonly SpaceEffect[] = [
      { type: 'gainMoney', amount: 1_000, reason: 'r' },
      { type: 'payMoney', amount: 1_000, reason: 'r' },
      { type: 'collectFromEach', amount: 1_000, reason: 'r' },
      { type: 'payEach', amount: 1_000, reason: 'r' },
      { type: 'spinForMoney', perPip: 1_000, reason: 'r' },
      { type: 'stockDividend', perShare: 1_000, reason: 'r' },
      { type: 'payPerChild', amount: 1_000, reason: 'r' },
      { type: 'collectPerChild', amount: 1_000, reason: 'r' },
    ]
    for (const effect of cases) {
      expect(harshenEffect(effect, 'veryHard'), `${effect.type} was not scaled`).not.toEqual(effect)
    }
  })

  it('leaves the effects that carry no board money exactly alone', () => {
    const untouched: readonly SpaceEffect[] = [
      { type: 'none' },
      { type: 'payday' },
      { type: 'payRaise' },
      { type: 'graduate' },
      { type: 'getMarried' },
      { type: 'retire' },
      { type: 'buyHouse' },
      { type: 'bank' },
      { type: 'gainLifeTiles', count: 1 },
      { type: 'haveChildren', count: 1 },
    ]
    for (const effect of untouched) {
      expect(harshenEffect(effect, 'veryHard')).toEqual(effect)
    }
  })

  it('rounds money to something a board tile can print', () => {
    const scaled = harshenEffect({ type: 'payMoney', amount: 1_234, reason: 'r' }, 'hard')
    expect(scaled.type === 'payMoney' && scaled.amount % 100).toBe(0)
  })

  it('never rounds a real bill away to nothing', () => {
    const scaled = harshenEffect({ type: 'gainMoney', amount: 300, reason: 'r' }, 'veryHard')
    expect(scaled.type === 'gainMoney' && scaled.amount).toBeGreaterThan(0)
  })
})
