export const LINE_GRAPH_LIMITS = Object.freeze({ maxRows: 120, maxSeries: 6 });

const MAX_INPUT_LENGTH = 100_000;
const MAX_TICKS = 40;
const NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

function detectDelimiter(text) {
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (!quoted && (character === "\n" || character === "\r")) {
      break;
    } else if (!quoted && (character === "," || character === "\t")) {
      return character === "\t" ? "\t" : ",";
    }
  }
  return ",";
}

function parseDelimitedRows(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  let closedQuote = false;
  let rowHasContent = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
        closedQuote = true;
      } else {
        cell += character;
      }
      rowHasContent = true;
      continue;
    }

    if (character === delimiter) {
      row.push(cell);
      cell = "";
      closedQuote = false;
      rowHasContent = true;
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      closedQuote = false;
      rowHasContent = false;
    } else if (character === '"') {
      if (cell.trim() || closedQuote) throw new Error("Unexpected quote in data.");
      cell = "";
      quoted = true;
      rowHasContent = true;
    } else {
      if (closedQuote && !/\s/.test(character)) throw new Error("Unexpected text after a quoted cell.");
      cell += character;
      if (!/\s/.test(character)) rowHasContent = true;
    }
  }

  if (quoted) throw new Error("Unclosed quoted cell in data.");
  if (rowHasContent || row.length || cell) {
    row.push(cell);
    rows.push(row);
  }
  if (!rows.length) throw new Error("Enter a header row and at least one data row.");
  return rows;
}

function parseCellNumber(text, rowNumber, seriesName) {
  const value = text.trim();
  if (!value) return null;
  if (!NUMBER_PATTERN.test(value)) {
    throw new Error(`Row ${rowNumber}, “${seriesName}” must be a finite decimal or scientific number, or blank.`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Row ${rowNumber}, “${seriesName}” must be a finite number.`);
  if (number === 0 && /[1-9]/.test(value.replace(/[eE].*$/, ""))) {
    throw new Error(`Row ${rowNumber}, “${seriesName}” is too small to represent safely.`);
  }
  return number;
}

export function parseLineGraphData(dataText) {
  if (typeof dataText !== "string") throw new Error("Data must be text.");
  if (dataText.length > MAX_INPUT_LENGTH) throw new Error(`Data may contain at most ${MAX_INPUT_LENGTH} characters.`);
  const rows = parseDelimitedRows(dataText, detectDelimiter(dataText));
  const headers = rows[0].map((header) => header.trim());
  if (headers.length < 2 || !headers[0]) throw new Error("The first row must contain a category label and at least one series name.");
  if (headers.length - 1 > LINE_GRAPH_LIMITS.maxSeries) {
    throw new Error(`Data may contain at most ${LINE_GRAPH_LIMITS.maxSeries} series.`);
  }

  const seen = new Set();
  for (const name of headers.slice(1)) {
    if (!name) throw new Error("Every series must have a non-empty header name.");
    const normalized = name.toLocaleLowerCase();
    if (seen.has(normalized)) throw new Error(`Series header “${name}” is duplicated.`);
    seen.add(normalized);
  }
  if (rows.length - 1 > LINE_GRAPH_LIMITS.maxRows) {
    throw new Error(`Data may contain at most ${LINE_GRAPH_LIMITS.maxRows} rows.`);
  }
  if (rows.length < 2) throw new Error("Enter at least one data row after the header.");

  const labels = [];
  const series = headers.slice(1).map((name) => ({ name, values: [] }));
  for (const [index, row] of rows.slice(1).entries()) {
    const rowNumber = index + 2;
    if (row.length !== headers.length) {
      throw new Error(`Row ${rowNumber} has ${row.length} columns; expected ${headers.length}.`);
    }
    const label = row[0].trim();
    if (!label) throw new Error(`Row ${rowNumber} has an empty category label.`);
    labels.push(label);
    for (let column = 1; column < row.length; column += 1) {
      series[column - 1].values.push(parseCellNumber(row[column], rowNumber, series[column - 1].name));
    }
  }
  for (const item of series) {
    if (item.values.every((value) => value === null)) throw new Error(`Series “${item.name}” must contain at least one numeric value.`);
  }
  return { labels, series, rowCount: labels.length };
}

function parseScaleValue(value, field) {
  if (typeof value !== "string" && typeof value !== "number") throw new Error(`${field} must be a finite number.`);
  const text = String(value).trim();
  if (!text || !NUMBER_PATTERN.test(text)) throw new Error(`${field} must be a finite decimal or scientific number.`);
  const number = Number(text);
  if (!Number.isFinite(number)) throw new Error(`${field} must be finite.`);
  if (number === 0 && /[1-9]/.test(text.replace(/[eE].*$/, ""))) throw new Error(`${field} is too small to represent safely.`);
  return number;
}

function niceStep(rawStep) {
  if (!(rawStep > 0) || !Number.isFinite(rawStep)) throw new Error("The data range cannot be represented by a safe axis scale.");
  const power = 10 ** Math.floor(Math.log10(rawStep));
  if (!(power > 0) || !Number.isFinite(power)) throw new Error("The data range exceeds safe axis precision.");
  const fraction = rawStep / power;
  const multiplier = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  const step = multiplier * power;
  if (!(step > 0) || !Number.isFinite(step)) throw new Error("The data range exceeds safe axis precision.");
  return step;
}

export function getLineGraphScale(values, { min = "", max = "", step = "" } = {}) {
  if (!Array.isArray(values) || !values.length || values.some((value) => value !== null && !Number.isFinite(value))) {
    throw new Error("Y-axis data must contain finite numbers.");
  }
  const finiteValues = values.filter((value) => value !== null);
  if (!finiteValues.length) throw new Error("At least one finite value is required to calculate the Y-axis.");
  const dataMin = Math.min(...finiteValues);
  const dataMax = Math.max(...finiteValues);
  const hasMin = min !== "" && min != null;
  const hasMax = max !== "" && max != null;
  const hasStep = step !== "" && step != null;
  let axisMin = hasMin ? parseScaleValue(min, "Y minimum") : Math.min(dataMin, 0);
  let axisMax = hasMax ? parseScaleValue(max, "Y maximum") : Math.max(dataMax, 0);
  if (axisMin > dataMin || axisMax < dataMax) throw new Error("Y-axis bounds must enclose every finite data value.");
  if (axisMin === axisMax && !hasMin && !hasMax) {
    axisMin = -1;
    axisMax = 1;
  }

  if (!hasStep) {
    const span = axisMax - axisMin;
    let rawStep;
    if (span === 0) rawStep = Math.max(Math.abs(axisMin) * 0.2, 1) / 5;
    else rawStep = span / 5;
    let tickStep = niceStep(rawStep);
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const candidateMin = hasMin ? axisMin : Math.floor(axisMin / tickStep) * tickStep;
      const candidateMax = hasMax ? axisMax : Math.ceil(axisMax / tickStep) * tickStep;
      const count = Math.floor((candidateMax - candidateMin) / tickStep + 1e-10) + 1;
      if (count <= MAX_TICKS && Number.isSafeInteger(Math.round(candidateMin / tickStep)) && Number.isSafeInteger(Math.round(candidateMax / tickStep))) {
        axisMin = candidateMin;
        axisMax = candidateMax;
        break;
      }
      tickStep = niceStep(tickStep * 2);
      if (attempt === 15) throw new Error("The data range cannot be represented with a safe number of Y-axis ticks.");
    }
    step = tickStep;
  } else {
    step = parseScaleValue(step, "Y-axis step");
    if (step <= 0) throw new Error("Y-axis step must be greater than zero.");
  }

  if (!(axisMin < axisMax)) throw new Error("Y-axis minimum must be less than its maximum.");
  const span = axisMax - axisMin;
  if (!Number.isFinite(span) || !(span > 0)) throw new Error("Y-axis bounds exceed safe numeric precision.");
  if (hasStep && (axisMax - axisMin) / step > MAX_TICKS - 1) {
    throw new Error(`Y-axis step would create more than ${MAX_TICKS} ticks.`);
  }
  const startIndex = Math.ceil(axisMin / step - 1e-12);
  const endIndex = Math.floor(axisMax / step + 1e-12);
  if (!Number.isSafeInteger(startIndex) || !Number.isSafeInteger(endIndex) || endIndex < startIndex) {
    throw new Error("Y-axis tick positions exceed safe numeric precision.");
  }
  if (endIndex - startIndex + 1 > MAX_TICKS) throw new Error(`Y-axis step would create more than ${MAX_TICKS} ticks.`);
  const ticks = [];
  for (let index = startIndex; index <= endIndex; index += 1) {
    const tick = index * step;
    if (!Number.isFinite(tick) || (ticks.length && !(tick > ticks[ticks.length - 1]))) {
      throw new Error("Y-axis ticks cannot be represented safely at this scale.");
    }
    ticks.push(Object.is(tick, -0) ? 0 : tick);
  }
  if (!ticks.length) throw new Error("Y-axis bounds and step do not include a representable tick.");
  return { min: axisMin, max: axisMax, step, ticks };
}

export function calculateLineGraph(state = {}) {
  if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("Line graph state must be an object.");
  if (state.mode != null && state.mode !== "graph" && state.mode !== "worksheet") {
    throw new Error('Mode must be "graph" or "worksheet".');
  }
  const parsed = parseLineGraphData(state.dataText);
  const values = parsed.series.flatMap((item) => item.values).filter((value) => value !== null);
  const yScale = getLineGraphScale(values, { min: state.yMin ?? "", max: state.yMax ?? "", step: state.yStep ?? "" });
  return { ...parsed, yScale };
}
