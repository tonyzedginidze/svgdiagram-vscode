export const PIE_CHART_LIMITS = Object.freeze({
  rows: 24,
  labelLength: 100,
  inputLength: 12_000,
});

const DECIMAL_PATTERN = /^\+?(?:\d+(?:\.\d*)?|\.\d+)$/;
const FULL_CIRCLE = Math.PI * 2;

function detectDelimiter(raw) {
  let quoted = false;
  let commas = 0;
  let tabs = 0;
  let recordHasText = false;

  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index];
    if (character === '"') {
      if (quoted && raw[index + 1] === '"') index += 1;
      else quoted = !quoted;
      if (!/\s/.test(character)) recordHasText = true;
    } else if (!quoted && (character === "\n" || character === "\r")) {
      if (recordHasText) break;
      commas = 0;
      tabs = 0;
      if (character === "\r" && raw[index + 1] === "\n") index += 1;
    } else {
      if (quoted) {
        if (!/\s/.test(character)) recordHasText = true;
      } else if (character === ",") {
        commas += 1;
      } else if (character === "\t") {
        tabs += 1;
      }
      if (!/\s/.test(character)) recordHasText = true;
    }
  }

  return tabs > 0 && (commas === 0 || tabs >= commas) ? "\t" : ",";
}

function parseDelimitedRows(raw, delimiter) {
  const records = [];
  let fields = [];
  let field = "";
  let quoted = false;
  let quoteClosed = false;
  let malformed = false;
  let rowNumber = 1;

  function finishField() {
    fields.push(field.trim());
    field = "";
    quoteClosed = false;
  }

  function finishRecord() {
    finishField();
    if (malformed) records.push({ rowNumber, error: `Row ${rowNumber} contains malformed quoting.` });
    else if (fields.some((value) => value !== "")) records.push({ rowNumber, fields });
    fields = [];
    field = "";
    quoted = false;
    quoteClosed = false;
    malformed = false;
    rowNumber += 1;
  }

  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index];
    if (quoted) {
      if (character === '"' && raw[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
        quoteClosed = true;
      } else {
        field += character;
      }
      continue;
    }

    if (character === delimiter) {
      finishField();
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && raw[index + 1] === "\n") index += 1;
      finishRecord();
    } else if (character === '"') {
      if (field.trim() || quoteClosed) malformed = true;
      else {
        field = "";
        quoted = true;
      }
    } else if (quoteClosed) {
      if (!/\s/.test(character)) malformed = true;
    } else {
      field += character;
    }
  }

  if (quoted) malformed = true;
  if (fields.length || field.trim() || malformed || quoteClosed) finishRecord();
  return records;
}

function parseValue(text, rowNumber) {
  if (!DECIMAL_PATTERN.test(text)) {
    return { error: `Row ${rowNumber} value must be a nonnegative decimal number.` };
  }

  const value = Number(text);
  if (!Number.isFinite(value)) return { error: `Row ${rowNumber} value must be finite.` };
  if (value === 0 && /[1-9]/.test(text)) {
    return { error: `Row ${rowNumber} value is smaller than supported numeric precision.` };
  }
  return { value };
}

export function parsePieChartData(raw) {
  const rows = [];
  const errors = [];

  if (typeof raw !== "string") {
    return { rows, errors: ["Data must be text."] };
  }
  if (raw.length > PIE_CHART_LIMITS.inputLength) {
    return { rows, errors: [`Data may contain at most ${PIE_CHART_LIMITS.inputLength} characters.`] };
  }
  if (!raw.trim()) return { rows, errors: ["Enter at least one category and value."] };

  const records = parseDelimitedRows(raw, detectDelimiter(raw));
  if (!records.length) return { rows, errors: ["Enter at least one category and value."] };

  let startIndex = 0;
  const firstFields = records[0].fields;
  if (firstFields && firstFields.length === 2) {
    const first = firstFields[0].toLowerCase();
    const second = firstFields[1].toLowerCase();
    if ((first === "label" || first === "category") && second === "value") startIndex = 1;
  }

  for (let index = startIndex; index < records.length; index += 1) {
    const record = records[index];
    if (record.error) {
      errors.push(record.error);
      continue;
    }
    const { rowNumber, fields } = record;
    if (index - startIndex >= PIE_CHART_LIMITS.rows) {
      errors.push(`Row ${rowNumber} exceeds the maximum of ${PIE_CHART_LIMITS.rows} categories.`);
      continue;
    }
    if (fields.length !== 2) {
      errors.push(`Row ${rowNumber} must contain exactly a label and value.`);
      continue;
    }
    const [label, valueText] = fields;
    if (!label) {
      errors.push(`Row ${rowNumber} is missing a label.`);
      continue;
    }
    if (label.length > PIE_CHART_LIMITS.labelLength) {
      errors.push(`Row ${rowNumber} label may contain at most ${PIE_CHART_LIMITS.labelLength} characters.`);
      continue;
    }
    if (!valueText) {
      errors.push(`Row ${rowNumber} is missing a value.`);
      continue;
    }
    const parsed = parseValue(valueText, rowNumber);
    if (parsed.error) {
      errors.push(parsed.error);
      continue;
    }
    rows.push({ label, value: parsed.value });
  }

  if (!rows.length && !errors.length) errors.push("Enter at least one category and value.");
  return { rows, errors };
}

function allocatePercentages(rows, total) {
  const positive = rows.map((row, index) => ({
    index,
    exact: row.value / total * 1000,
  })).filter(({ exact }) => exact > 0);
  const units = Array(rows.length).fill(0);
  let assigned = 0;

  for (const entry of positive) {
    units[entry.index] = Math.floor(entry.exact);
    assigned += units[entry.index];
  }
  positive.sort((left, right) => {
    const remainderDifference = (right.exact - Math.floor(right.exact)) - (left.exact - Math.floor(left.exact));
    return remainderDifference || left.index - right.index;
  });
  for (let index = 0; index < Math.max(0, 1000 - assigned); index += 1) {
    units[positive[index % positive.length].index] += 1;
  }
  if (assigned > 1000) {
    positive.reverse();
    for (let index = 0; index < assigned - 1000; index += 1) {
      const entry = positive.find(({ index: rowIndex }) => units[rowIndex] > 0);
      units[entry.index] -= 1;
    }
  }
  return units.map((value) => value / 10);
}

export function calculatePieChart(rows) {
  const errors = [];
  if (!Array.isArray(rows)) {
    return { valid: false, errors: ["Pie chart rows must be an array."], total: 0, slices: [] };
  }
  if (rows.length === 0) errors.push("Enter at least one category and value.");
  if (rows.length > PIE_CHART_LIMITS.rows) errors.push(`A pie chart may contain at most ${PIE_CHART_LIMITS.rows} categories.`);

  const normalizedRows = [];
  for (const [index, row] of rows.entries()) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      errors.push(`Row ${index + 1} must contain a label and value.`);
      continue;
    }
    if (typeof row.label !== "string" || !row.label.trim()) {
      errors.push(`Row ${index + 1} is missing a label.`);
      continue;
    }
    const label = row.label.trim();
    if (label.length > PIE_CHART_LIMITS.labelLength) {
      errors.push(`Row ${index + 1} label may contain at most ${PIE_CHART_LIMITS.labelLength} characters.`);
      continue;
    }
    if (typeof row.value !== "number" || !Number.isFinite(row.value) || row.value < 0) {
      errors.push(`Row ${index + 1} value must be a finite nonnegative number.`);
      continue;
    }
    normalizedRows.push({ label, value: row.value });
  }

  const total = normalizedRows.reduce((sum, row) => sum + row.value, 0);
  if (!Number.isFinite(total)) errors.push("The total value exceeds the supported numeric range.");
  if (total === 0) errors.push("At least one value must be greater than zero.");
  if (errors.length) return { valid: false, errors, total: Number.isFinite(total) ? total : 0, slices: [] };

  const percentages = allocatePercentages(normalizedRows, total);
  let angle = 0;
  const lastPositiveIndex = normalizedRows.findLastIndex((row) => row.value > 0);
  const slices = normalizedRows.map(({ label, value }, index) => {
    const startAngle = angle;
    const endAngle = value === 0
      ? angle
      : index === lastPositiveIndex
        ? FULL_CIRCLE
        : angle + value / total * FULL_CIRCLE;
    angle = endAngle;
    return {
      label,
      value,
      percent: percentages[index],
      startAngle,
      endAngle,
      midAngle: startAngle + (endAngle - startAngle) / 2,
    };
  });
  return { valid: true, errors, total, slices };
}

function pointOnCircle(cx, cy, radius, angle) {
  return [cx + radius * Math.sin(angle), cy - radius * Math.cos(angle)];
}

function circlePath(cx, cy, radius, startAngle, sweep) {
  const middleAngle = startAngle + sweep * Math.PI;
  const [startX, startY] = pointOnCircle(cx, cy, radius, startAngle);
  const [middleX, middleY] = pointOnCircle(cx, cy, radius, middleAngle);
  const [endX, endY] = pointOnCircle(cx, cy, radius, startAngle + sweep * FULL_CIRCLE);
  const direction = sweep > 0 ? 1 : 0;
  return `M ${startX} ${startY} A ${radius} ${radius} 0 0 ${direction} ${middleX} ${middleY} A ${radius} ${radius} 0 0 ${direction} ${endX} ${endY}`;
}

export function pieSlicePath(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
  const parameters = [cx, cy, outerRadius, innerRadius, startAngle, endAngle];
  if (!parameters.every(Number.isFinite) || outerRadius <= 0 || innerRadius < 0 || innerRadius >= outerRadius) return "";
  const span = endAngle - startAngle;
  if (span === 0) return "";

  if (Math.abs(span) >= FULL_CIRCLE - 1e-12) {
    const outer = circlePath(cx, cy, outerRadius, startAngle, Math.sign(span));
    if (innerRadius === 0) return `${outer} Z`;
    const inner = circlePath(cx, cy, innerRadius, startAngle, -Math.sign(span));
    return `${outer} ${inner} Z`;
  }

  const sweep = span > 0 ? 1 : 0;
  const largeArc = Math.abs(span) > Math.PI ? 1 : 0;
  const [outerStartX, outerStartY] = pointOnCircle(cx, cy, outerRadius, startAngle);
  const [outerEndX, outerEndY] = pointOnCircle(cx, cy, outerRadius, endAngle);
  if (innerRadius === 0) {
    return `M ${cx} ${cy} L ${outerStartX} ${outerStartY} A ${outerRadius} ${outerRadius} 0 ${largeArc} ${sweep} ${outerEndX} ${outerEndY} Z`;
  }

  const [innerEndX, innerEndY] = pointOnCircle(cx, cy, innerRadius, endAngle);
  const [innerStartX, innerStartY] = pointOnCircle(cx, cy, innerRadius, startAngle);
  return `M ${outerStartX} ${outerStartY} A ${outerRadius} ${outerRadius} 0 ${largeArc} ${sweep} ${outerEndX} ${outerEndY} L ${innerEndX} ${innerEndY} A ${innerRadius} ${innerRadius} 0 ${largeArc} ${sweep ? 0 : 1} ${innerStartX} ${innerStartY} Z`;
}
