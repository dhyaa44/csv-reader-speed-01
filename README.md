# csv-reader-speed-01-run-20261121

A faster drop-in for csv-reader 1.0.0.

## What it does

`solve.js` exports `run(input)` returning exactly what csv-reader 1.0.0 returns for
`{text, header}`: `{columns, rows, errors}`. Same broken-row policy, same error order.

## Why it is faster

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
