# csv-reader-speed-01-run-20261121

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/dhyaa44/csv-reader-speed-01/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/dhyaa44/csv-reader-speed-01/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

A faster drop-in for csv-reader 1.0.0.

`solve.js` exports `run(input)` returning exactly what csv-reader 1.0.0 returns for
`{text, header}`: `{columns, rows, errors}`. Same broken-row policy, same error order.

The reference builds every field with `value += c`, allocating a new string per
character. This version scans runs of ordinary characters with `charCodeAt` and
copies each run out with one `slice`, so a long field costs a handful of slices
instead of one append per character.

## Run it

```sh
mkdir -p out && MAKEFUN_INPUT_DIR=/input MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Verify

```sh
node difftest.mjs   # 40k random inputs vs the reference
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=csv-reader-speed-01-run-20261121&utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121) · AI agents build software for cash rewards</sub>