import { configure, getConfig, prettyDOM } from '@testing-library/dom'
import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

import { markBoardLegendSeen } from '@presentation/components/BoardLegend/seen'

/**
 * --- why `waitFor` was costing whole seconds a poll -------------------------
 *
 * `waitFor` re-runs its callback on a 50 ms interval *and* on every DOM
 * mutation the container sees. Anything this app animates — a die tumbling,
 * a car hopping, a toast sliding in — writes a style attribute per frame, so
 * a wait that spans one die throw is re-checked dozens of times.
 *
 * That would be fine if a check were cheap. It was not. Testing Library's
 * default `getElementError` pretty-prints the *entire container* into the
 * error message, and a `getBy*` inside a `waitFor` callback throws on every
 * poll until the thing finally appears. The container here is the whole
 * document, and this app's document is an 86-space SVG board, about 5,500 nodes.
 * Measured on this machine, one failing `screen.getByText(/^Rolled$/)` cost
 * **635 ms**, of which ~470 ms was serialising a DOM dump that nothing was
 * ever going to read — the poll before it threw the message away and polled
 * again.
 *
 * The bill landed on the two slowest tests in `App.test.tsx`: 20 polls,
 * 12.7 s of the test's 15.4 s spent inside the callback, against a `waitFor`
 * budget of 15 s. A ~15% margin on a *quiet* machine, which is why the file
 * came up red at random whenever several agent sessions were running at once
 * (issue #45). Worse, the polling is synchronous: while a poll is
 * pretty-printing, the app's own timers and animation frames cannot run, so
 * an expensive poll *delays the very thing it is waiting for* and then bills
 * the delay to the same budget.
 *
 * So: while Testing Library has told us it is in an "expensive diagnostics
 * off" section — which is exactly the `waitFor`/`findBy*` polling loop, see
 * `runWithExpensiveErrorDiagnosticsDisabled` in dom-testing-library — the
 * error carries the message and nothing else. The moment that flag is back
 * off, which includes a `waitFor`'s *final* timeout error and every ordinary
 * one-shot `getBy*`, the full DOM dump comes back. Nothing about what a
 * failure tells you changes; only the ones nobody sees get cheaper.
 *
 * `_disableExpensiveErrorDiagnostics` is underscore-private, and if a future
 * dom-testing-library drops it this reads `undefined` and we simply pay for
 * the dump again — slower tests, never wrong ones. That is the right way for
 * this to break.
 */
configure({
  getElementError(message, container) {
    const inCheapPollingLoop = (getConfig() as { _disableExpensiveErrorDiagnostics?: boolean })
      ._disableExpensiveErrorDiagnostics
    const error = new Error(
      inCheapPollingLoop === true
        ? (message ?? undefined)
        : [message, `Ignored nodes: comments, ${getConfig().defaultIgnore}\n${prettyDOM(container)}`]
            .filter(Boolean)
            .join('\n\n'),
    )
    error.name = 'TestingLibraryElementError'
    return error
  },
})

/**
 * The board's key is a once-in-a-lifetime card: it goes up over the board on
 * a player's very first game and never again. In a fresh jsdom every test is
 * a first game, so without this every test that mounts the app would open
 * with a modal it never asked for.
 *
 * Marked seen by default, and any test that actually cares about the card
 * clears the flag itself — the same shape as starting a game on a browser
 * that has played before, which is what almost every test is really about.
 */
beforeEach(() => {
  markBoardLegendSeen()
})
