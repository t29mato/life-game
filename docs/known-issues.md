# Known issues

Not bugs in the shipped game — things found while investigating something
else, deliberately not chased further, recorded here so nobody rediscovers
them the hard way.

Nothing currently open. The one entry this file used to carry — tightening
the board's row spacing (`ROW_STEP < 3`) colliding two tiles onto one
coordinate — was fixed rather than merely investigated; see the fix in
`src/domain/board/createBoard.ts` (`LayoutState`, `freeRowY`, `freeBranchY`)
and its regression coverage in `createBoard.test.ts`, closed via GitHub
issue #5.
