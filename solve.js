// A faster csv-reader 1.0.0 drop-in.
//
// The reference builds every field with `value += c`, allocating a new string per
// character. This keeps the identical broken-row policy and error order, but copies
// each run of characters out in one slice, so a long field costs a handful of slices
// instead of one append per character.

const COMMA = 0;
const LINE_BREAK = 1;
const END = 2;

const LF = 10;
const CR = 13;
const QUOTE = 34;
const COMMA_C = 44;
const BOM = 0xfeff;

/** The reading of one CSV input, {text, header}: {columns, rows, errors}. */
export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const n = text.length;

  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;

  let pos = 0;
  let line = 1;
  if (n > 0 && text.charCodeAt(0) === BOM) pos = 1;

  let recordLine = 1;
  let recordRow = null;

  const err = (code) => {
    errors.push({ code, line: recordLine, row: recordRow });
  };

  // Reads unquoted characters onto `start` up to the next comma or line break.
  // Returns [value, ended, added, nextPos, nextLine].
  const readUnquoted = (seed) => {
    let i = pos;
    let pieceStart = i;
    let value = typeof seed === 'string' ? seed : '';
    let added = 0;
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === COMMA_C) {
        value += text.slice(pieceStart, i);
        added += i - pieceStart;
        return [value, COMMA, added, i + 1, line];
      }
      if (c === LF) {
        value += text.slice(pieceStart, i);
        added += i - pieceStart;
        return [value, LINE_BREAK, added, i + 1, line + 1];
      }
      if (c === CR) {
        if (i + 1 < n && text.charCodeAt(i + 1) === LF) {
          value += text.slice(pieceStart, i);
          added += i - pieceStart;
          return [value, LINE_BREAK, added, i + 2, line + 1];
        }
        // A CR not followed by LF is dropped.
        value += text.slice(pieceStart, i);
        added += i - pieceStart;
        err('stray_cr');
        i++;
        pieceStart = i;
        continue;
      }
      // Skip the run of ordinary characters.
      while (i < n) {
        const d = text.charCodeAt(i);
        if (d === COMMA_C || d === CR || d === LF) break;
        i++;
      }
    }
    value += text.slice(pieceStart, i);
    added += i - pieceStart;
    return [value, END, added, i, line];
  };

  // Reads a quoted field whose opening quote is at pos.
  // Returns [value, ended, added, nextPos, nextLine].
  const readQuoted = () => {
    const open = pos;
    const openLine = line;
    let i = open + 1;
    let pieceStart = i;
    let value = '';
    let added = 0;
    let closed = false;
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === QUOTE) {
        if (i + 1 < n && text.charCodeAt(i + 1) === QUOTE) {
          // A doubled quote is one literal quote: keep the run, drop one quote.
          value += text.slice(pieceStart, i) + '"';
          added += i - pieceStart + 1;
          i += 2;
          pieceStart = i;
          continue;
        }
        value += text.slice(pieceStart, i);
        added += i - pieceStart;
        i++;
        closed = true;
        break;
      }
      if (c === CR) {
        // CRLF and a lone CR inside quotes are each one LF.
        value += text.slice(pieceStart, i) + '\n';
        added += i - pieceStart + 1;
        line++;
        i += i + 1 < n && text.charCodeAt(i + 1) === LF ? 2 : 1;
        pieceStart = i;
        continue;
      }
      if (c === LF) line++;
      i++;
    }
    if (!closed) {
      // The quote never closes: it is a literal character, and the text after it is
      // read again as an unquoted field.
      pos = open + 1;
      line = openLine;
      err('unterminated_quote');
      return readUnquoted('"');
    }
    pos = i;
    if (pos >= n) return [value, END, added, pos, line];
    const c = text.charCodeAt(pos);
    if (c === COMMA_C) return [value, COMMA, added, pos + 1, line];
    if (c === LF) return [value, LINE_BREAK, added, pos + 1, line + 1];
    if (c === CR && pos + 1 < n && text.charCodeAt(pos + 1) === LF) {
      return [value, LINE_BREAK, added, pos + 2, line + 1];
    }
    // What follows the closing quote is appended as it stands, up to the next comma
    // or line break.
    const junk = readUnquoted(value);
    if (junk[2] > 0) err('quote_junk');
    return junk;
  };

  while (true) {
    // Lines with no characters are no records.
    while (pos < n) {
      const c = text.charCodeAt(pos);
      if (c === LF) { pos++; line++; }
      else if (c === CR && pos + 1 < n && text.charCodeAt(pos + 1) === LF) { pos += 2; line++; }
      else break;
    }
    if (pos >= n) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let field;
    let quoted;
    do {
      quoted = text.charCodeAt(pos) === QUOTE;
      field = quoted ? readQuoted() : readUnquoted('');
      fields.push(field[0]);
      pos = field[3];
      line = field[4];
    } while (field[1] === COMMA);

    // A line that held only stray CRs is left with no characters: no record (its
    // stray_cr errors stay).
    if (fields.length === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }
  return { columns: header ? (columns ?? []) : null, rows, errors };
}