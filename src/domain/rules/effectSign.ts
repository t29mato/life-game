import type { SpaceEffect } from '../model/types'

/**
 * Which way a tile moves the player's money, stated once so every part of the
 * interface can agree about it.
 *
 * A playtester's verdict on the board was that its pictures did not predict
 * its effects — a rising chart that opened the bank, a coin on a tile that
 * charged $1,800. The fix has two halves: the picture (see
 * `presentation/icons/effectVocabulary.ts`) and the colour. This is the colour
 * half's single source of truth. Warm for money in, red for money out, purple
 * for a real decision, and nothing at all for a tile that only tells a story.
 *
 * `choice` outranks the money: the bank both lends and is repaid at, a house
 * is bought, a job is taken — what a player needs to know before they land is
 * that something will be *asked* of them, not which way the cash might go.
 */
export type EffectSign = 'gain' | 'cost' | 'choice' | 'neutral'

export function effectSign(effect: SpaceEffect): EffectSign {
  switch (effect.type) {
    // Money in, every time, no press required.
    case 'gainMoney':
    case 'payday':
    case 'payRaise':
    case 'collectFromEach':
    case 'collectPerChild':
    case 'stockDividend':
    case 'spinForMoney':
    case 'gainLifeTiles':
    case 'promotion':
    case 'stealLifeTile':
      return 'gain'

    // Money out, every time.
    case 'payMoney':
    case 'payEach':
    case 'payPerChild':
    case 'tuition':
    case 'loseCareer':
    case 'divorce':
      return 'cost'

    // Something is asked of the player before anything happens.
    case 'bank':
    case 'buyStock':
    case 'buyInsurance':
    case 'buyHouse':
    case 'upgradeHouse':
    case 'chooseCareer':
    case 'careerChange':
    case 'retireEarly':
      return 'choice'

    /*
     * Everything else. A wedding, a graduation, a new arrival and the last
     * year of a working life all move money, but none of them is *about* the
     * money — they get their own glyph and the milestone's own gold, and
     * painting them red or green would be the board shouting the smaller half
     * of the news. `tradeYear` and `household` are here for a harder reason:
     * both are symmetric about the die's middle, so a colour promising either
     * direction would be a lie half the time.
     */
    case 'none':
    case 'graduate':
    case 'doctorate':
    case 'getMarried':
    case 'haveChildren':
    case 'household':
    case 'tradeYear':
    case 'retire':
    case 'swapMoneyWithLeader':
      return 'neutral'
  }
}
