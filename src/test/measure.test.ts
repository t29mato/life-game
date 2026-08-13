import { appendFileSync, writeFileSync } from 'node:fs'
import { describe, it } from 'vitest'
import { createGameStore } from '../application/createGameStore'
import { decideCpuCommand } from '../application/cpu/decideCpuCommand'
import { createInMemoryRepository, createInMemoryStatsRepository, createSeededRandom } from '../application/testing/fakes'
import { createBoard } from '../domain/board/createBoard'
import type { BoardLength, Difficulty, PlayerColor } from '../domain/model/types'
const OUT = '/private/tmp/claude-501/-Users-t29mato-proj-life-game/42ffb994-8367-470a-b581-682e912836ae/scratchpad/z.txt'
try { writeFileSync(OUT, '') } catch { /* first writer wins */ }
const log = (l: string) => appendFileSync(OUT, l + '\n')
interface O { boardLength?: BoardLength; difficulty?: Difficulty; laneBySeat?: readonly string[]; cpu?: boolean }
const play = (seed: number, n: number, bias: number, o: O = {}) => {
  const store = createGameStore({ random: createSeededRandom(seed), repository: createInMemoryRepository(), stats: createInMemoryStatsRepository() })
  const colors: PlayerColor[] = ['red', 'blue', 'green', 'yellow']
  store.dispatch({ type: 'startGame', config: { boardLength: o.boardLength ?? 'standard', ...(o.difficulty ? { difficulty: o.difficulty } : {}),
    players: Array.from({ length: n }, (_, i) => ({ name: `P${i}`, color: colors[i] as PlayerColor, isCpu: !!o.cpu })) } })
  let d = 0; const picks: string[] = []
  while (store.getState().phase !== 'gameOver' && d < 5_000) {
    const st = store.getState()
    if (o.cpu) {
      if (st.phase === 'moving') { store.dispatch({ type: 'settle' }); d += 1; continue }
      const c = decideCpuCommand(st)!
      if (c.type === 'choose' && st.pendingDecision?.kind === 'branch') { const l = st.board.spaces[c.optionId]?.lane?.name; if (l) picks.push(l) }
      store.dispatch(c); d += 1; continue
    }
    switch (st.phase) {
      case 'awaitingSpin': store.dispatch({ type: 'spin' }); break
      case 'moving': store.dispatch({ type: 'settle' }); break
      case 'awaitingDecision': {
        const off = st.pendingDecision?.options ?? []
        const ins = off.find((x) => st.board.spaces[x.id]?.lane?.name === o.laneBySeat?.[st.currentPlayerIndex])
        store.dispatch({ type: 'choose', optionId: (ins ?? off[bias % off.length]!).id }); break
      }
      case 'resolved': store.dispatch({ type: 'endTurn' }); break
      default: throw new Error('stalled')
    }
    d += 1
  }
  return { state: store.getState(), picks }
}
const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / x.length
const sd = (x: number[]) => Math.sqrt(mean(x.map((v) => (v - mean(x)) ** 2)))
describe('Z', () => {
  it('forks', () => {
    for (const [label, o, cnt, np] of [['standard 2p', {}, 300, 2], ['short', { boardLength: 'short' as const }, 120, 2],
      ['long', { boardLength: 'long' as const }, 120, 2], ['hard', { difficulty: 'hard' as const }, 120, 2],
      ['veryHard', { difficulty: 'veryHard' as const }, 120, 2], ['4p', {}, 120, 4]] as [string, O, number, number][]) {
      const lanes = Array.from({ length: np }, (_, i) => (i % 2 === 0 ? 'College Lane' : 'Straight to Work'))
      const c: number[] = []; const w: number[] = []; let wins = 0
      for (let s = 1; s <= cnt; s += 1) {
        const { state } = play(s, np, s, { ...o, laneBySeat: lanes })
        const r = state.results!
        state.players.forEach((p, i) => { const t = r.standings.find((x) => x.playerId === p.id)!.total; (i % 2 === 0 ? c : w).push(t) })
        if (state.players.findIndex((p) => p.id === r.winnerId) % 2 === 0) wins += 1
      }
      log(`${label.padEnd(12)} college ${((wins / cnt) * 100).toFixed(1)}%   sd W/C ${(sd(w) / sd(c)).toFixed(3)}`)
    }
  }, 900_000)
  it('session length and board shape', () => {
    for (const len of ['short', 'standard', 'long'] as const) {
      const turns: number[] = []
      for (let s = 1; s <= 60; s += 1) turns.push(play(s, 3, s, { boardLength: len }).state.turn)
      const b = createBoard(len)
      const spaces = Object.values(b.spaces)
      log(`${len.padEnd(9)} turns mean ${mean(turns).toFixed(1)}  board ${b.width}x${b.height} (aspect ${(b.width / b.height).toFixed(2)})  ${spaces.length} spaces`)
    }
  }, 900_000)
  it('cpu', () => {
    const tally = new Map<string, number>(); let kids = 0; let seats = 0
    for (let s = 1; s <= 200; s += 1) {
      const { state, picks } = play(s, 3, s, { cpu: true })
      for (const p of picks) tally.set(p, (tally.get(p) ?? 0) + 1)
      for (const p of state.players) { seats += 1; kids += p.children }
    }
    log('')
    for (const [k, v] of [...tally.entries()].sort((a, b) => b[1] - a[1])) log(`  ${k.padEnd(20)} ${v}`)
    log(`children/seat ${(kids / seats).toFixed(2)}`)
  }, 900_000)
})
