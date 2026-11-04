const MAX_TOKEN_DIGITS = 12;
const MAX_ABSOLUTE_VALUE = 1_000_000n;
const MAX_TICKS = 101;
const MAX_POINTS = 12;
const MAX_INTERVALS = 4;
const REPEATING_DECIMAL_PLACES = 6;

function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b) [a, b] = [b, a % b];
  return a || 1n;
}

function rational(numerator, denominator = 1n) {
  if (denominator === 0n) throw new Error("A fraction denominator cannot be zero.");
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = gcd(numerator, denominator);
  return { n: (numerator / divisor) * sign, d: (denominator / divisor) * sign };
}

function add(left, right) {
  return rational(left.n * right.d + right.n * left.d, left.d * right.d);
}

function subtract(left, right) {
  return rational(left.n * right.d - right.n * left.d, left.d * right.d);
}

function multiply(left, right) {
  return rational(left.n * right.n, left.d * right.d);
}

function compare(left, right) {
  const difference = left.n * right.d - right.n * left.d;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function absoluteWithinLimit(value) {
  return (value.n < 0n ? -value.n : value.n) <= MAX_ABSOLUTE_VALUE * value.d;
}

function checkDigitLength(text) {
  if (text.length > MAX_TOKEN_DIGITS) {
    throw new Error(`Number values may contain at most ${MAX_TOKEN_DIGITS} digits per integer part.`);
  }
}

function parseInteger(text, field) {
  const digits = text.replace(/^[+-]/, "");
  checkDigitLength(digits);
  try {
    return BigInt(text);
  } catch {
    throw new Error(`${field} must be a valid integer.`);
  }
}

function expandNumber(value) {
  const text = String(value);
  const match = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(text);
  if (!match) throw new Error("Number value must be finite and representable as a decimal.");

  const [, sign, whole, fraction = "", exponentText = "0"] = match;
  const exponent = Number(exponentText);
  const digits = whole + fraction;
  const point = whole.length + exponent;
  if (point <= 0) return `${sign}0.${"0".repeat(-point)}${digits}`;
  if (point >= digits.length) return `${sign}${digits}${"0".repeat(point - digits.length)}`;
  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`;
}

function decimalRational(text, field) {
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) throw new Error(`${field} must be a signed integer or decimal.`);
  const [, sign, whole, fraction = ""] = match;
  checkDigitLength(whole);
  if (fraction) checkDigitLength(fraction);
  const denominator = 10n ** BigInt(fraction.length);
  const numerator = BigInt(whole + fraction) * (sign === "-" ? -1n : 1n);
  return rational(numerator, denominator);
}

function ensureValueLimit(value, field) {
  if (!absoluteWithinLimit(value)) throw new Error(`${field} must be between -1,000,000 and 1,000,000.`);
  return value;
}

function parseRational(value, field = "Value") {
  let text;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${field} must be finite.`);
    text = expandNumber(value);
  } else if (typeof value === "string") {
    text = value.trim().replace(/−/g, "-");
  } else {
    throw new Error(`${field} must be a number or numeric text.`);
  }

  let parsed;
  let match = /^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(text);
  if (match) {
    const [, wholeText, numeratorText, denominatorText] = match;
    const whole = parseInteger(wholeText, field);
    const numerator = parseInteger(numeratorText, field);
    const denominator = parseInteger(denominatorText, field);
    if (denominator === 0n) throw new Error(`${field} fraction denominator cannot be zero.`);
    if (numerator >= denominator) throw new Error(`${field} mixed-number fraction must be proper.`);
    parsed = rational(whole * denominator + (whole < 0n || wholeText.startsWith("-") ? -numerator : numerator), denominator);
  } else {
    match = /^([+-]?\d+)\s*\/\s*(\d+)$/.exec(text);
    if (match) {
      const [, numeratorText, denominatorText] = match;
      const numerator = parseInteger(numeratorText, field);
      const denominator = parseInteger(denominatorText, field);
      if (denominator === 0n) throw new Error(`${field} fraction denominator cannot be zero.`);
      parsed = rational(numerator, denominator);
    } else {
      parsed = decimalRational(text, field);
    }
  }

  return ensureValueLimit(parsed, field);
}

function canonical(value) {
  return value.d === 1n ? String(value.n) : `${value.n}/${value.d}`;
}

function terminatingDecimal(value) {
  let denominator = value.d;
  let twos = 0;
  let fives = 0;
  while (denominator % 2n === 0n) {
    denominator /= 2n;
    twos += 1;
  }
  while (denominator % 5n === 0n) {
    denominator /= 5n;
    fives += 1;
  }
  if (denominator !== 1n) return null;

  const places = Math.max(twos, fives);
  const scaled = value.n * (2n ** BigInt(places - twos)) * (5n ** BigInt(places - fives));
  return decimalFromScaledInteger(scaled, places);
}

function decimalFromScaledInteger(value, places) {
  const negative = value < 0n;
  const digits = String(negative ? -value : value).padStart(places + 1, "0");
  if (!places) return `${negative ? "-" : ""}${digits}`;
  const whole = digits.slice(0, -places);
  const fraction = digits.slice(-places).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function displayDecimal(value) {
  const exact = terminatingDecimal(value);
  if (exact !== null) return exact;

  const scale = 10n ** BigInt(REPEATING_DECIMAL_PLACES);
  const numerator = value.n * scale;
  const negative = numerator < 0n;
  const absolute = negative ? -numerator : numerator;
  const rounded = (absolute * 2n + value.d) / (2n * value.d);
  return decimalFromScaledInteger(negative ? -rounded : rounded, REPEATING_DECIMAL_PLACES);
}

function parseFormat(format) {
  if (format !== "auto" && format !== "decimal" && format !== "fraction") {
    throw new Error('Label format must be "auto", "decimal", or "fraction".');
  }
  return format;
}

function formatValue(value, format) {
  if (format === "fraction") return canonical(value);
  if (format === "decimal") return displayDecimal(value);
  return terminatingDecimal(value) ?? canonical(value);
}

function valueResult(value) {
  return {
    value: canonical(value),
    number: Number(value.n) / Number(value.d),
    decimal: displayDecimal(value),
    fraction: canonical(value),
  };
}

function positionOf(value, min, span) {
  const position = multiply(subtract(value, min), rational(span.d, span.n));
  return Number(position.n) / Number(position.d);
}

function requireArray(value, field, maximum) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array.`);
  if (value.length > maximum) throw new Error(`${field} may contain at most ${maximum} entries.`);
  return value;
}

export function parseNumberLineValue(input) {
  return valueResult(parseRational(input));
}

export function calculateNumberLine(configuration = {}) {
  if (!configuration || typeof configuration !== "object" || Array.isArray(configuration)) {
    throw new Error("Number line configuration must be an object.");
  }

  const min = parseRational(configuration.min, "Minimum");
  const max = parseRational(configuration.max, "Maximum");
  const step = parseRational(configuration.step, "Step");
  if (compare(min, max) >= 0) throw new Error("Minimum must be less than maximum.");
  if (step.n <= 0n) throw new Error("Step must be greater than zero.");

  const labelFormat = parseFormat(configuration.labelFormat ?? "auto");
  const pointsInput = requireArray(configuration.points ?? [], "Points", MAX_POINTS);
  const intervalsInput = requireArray(configuration.intervals ?? [], "Intervals", MAX_INTERVALS);
  const span = subtract(max, min);

  const ticks = [];
  let tick = min;
  while (compare(tick, max) <= 0) {
    if (ticks.length >= MAX_TICKS) throw new Error(`Number line would exceed the maximum of ${MAX_TICKS} ticks.`);
    ticks.push({ value: canonical(tick), position: positionOf(tick, min, span), label: formatValue(tick, labelFormat) });
    tick = add(tick, step);
  }

  const points = pointsInput.map((point, index) => {
    if (!point || typeof point !== "object" || Array.isArray(point)) throw new Error(`Point ${index + 1} must be an object.`);
    const value = parseRational(point.value, `Point ${index + 1}`);
    if (compare(value, min) < 0 || compare(value, max) > 0) throw new Error(`Point ${index + 1} must be within the number line bounds.`);
    if (point.label !== undefined && typeof point.label !== "string") throw new Error(`Point ${index + 1} label must be text.`);
    return {
      value: canonical(value),
      position: positionOf(value, min, span),
      label: point.label ?? formatValue(value, labelFormat),
    };
  });

  const intervals = intervalsInput.map((interval, index) => {
    if (!interval || typeof interval !== "object" || Array.isArray(interval)) throw new Error(`Interval ${index + 1} must be an object.`);
    const from = parseRational(interval.from, `Interval ${index + 1} start`);
    const to = parseRational(interval.to, `Interval ${index + 1} end`);
    if (compare(from, min) < 0 || compare(from, max) > 0 || compare(to, min) < 0 || compare(to, max) > 0) {
      throw new Error(`Interval ${index + 1} endpoints must be within the number line bounds.`);
    }
    if (compare(from, to) >= 0) throw new Error(`Interval ${index + 1} start must be less than its end.`);
    const startClosed = interval.startClosed ?? true;
    const endClosed = interval.endClosed ?? true;
    if (typeof startClosed !== "boolean" || typeof endClosed !== "boolean") {
      throw new Error(`Interval ${index + 1} endpoint closure flags must be true or false.`);
    }
    return {
      from: canonical(from),
      to: canonical(to),
      start: positionOf(from, min, span),
      end: positionOf(to, min, span),
      startClosed,
      endClosed,
    };
  });

  return {
    min: canonical(min),
    max: canonical(max),
    step: canonical(step),
    ticks,
    points,
    intervals,
    labelFormat,
  };
}
