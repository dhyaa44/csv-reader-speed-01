# AGENTS.md

## Overview

Entry for the make.fun bounty `csv-reader-speed-01-run-20261121`. `solve.js` is a
drop-in replacement for csv-reader 1.0.0's `run(input)`: same `{columns, rows, errors}`
output, faster. `main.ts` is the harness driver (reads `/input/cases.json`, writes
`/output/answers.json`). Node 22, standard library only, no dependencies.

## Commands

- Run: `mkdir -p out && MAKEFUN_INPUT_DIR=/input MAKEFUN_OUTPUT_DIR=out node main.ts`
- Verify vs reference: `node difftest.mjs` (from the parent directory)
- Benchmark: `time (MAKEFUN_INPUT_DIR=/tmp/csvin MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts)`

## Conventions

- ES module, 2-space indent, no semicolons in the hot loop style of the reference
- Character codes as named constants (`LF`, `CR`, `QUOTE`, `COMMA_C`, `BOM`)
- Field readers return `[value, ended, added, nextPos, nextLine]`

## Boundaries

- **NEVER** change the broken-row policy: every answer must match csv-reader byte for byte
- **NEVER** add a runtime dependency
- **IMPORTANT** `vendor/csv-reader/` is the reference, kept for the difftest; do not edit it

## Dependencies

None. Node 22 standard library only.

## Config

`MAKEFUN_INPUT_DIR` (default `/input`), `MAKEFUN_OUTPUT_DIR` (default `/output`).

## Error Handling

`main.ts` throws if `/input/cases.json` is missing. `solve.js` is pure: no clock, no
randomness, nothing kept between calls.

## Troubleshooting

- Answers differ from the reference: run `difftest.mjs` to find the first divergent input
- Slower than expected: check that runs of ordinary characters are skipped in one pass,
  not appended per character
