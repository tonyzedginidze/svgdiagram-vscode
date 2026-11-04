const DECIMAL_PLACES = 6;
const SCALE = 10n ** 12n;
const INPUT_SCALE = 10n ** BigInt(DECIMAL_PLACES);
const MAX_VALUE = 1_000_000n * SCALE;
const MAX_OBSERVATIONS = 200;
const MAX_TICKS = 101;

const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;
const DATA_PATTERN = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:(?:\s*(?:,|;)\s*|\s+)[+-]?(?:\d+(?:\.\d+)?|\.\d+))*$/;

function parseDecimal(value, field) {
  if (typeof value !== "string" || !DECIMAL_PATTERN.test(value.trim())) {
    throw new Error(`${field} must be a signed integer or decimal (scientific notation and fractions are not supported).`);
  }

  const text = value.trim();
  const unsigned = text.replace(/^[+-]/, "");
  const [whole = "0", fraction = ""] = unsigned.split(".");
  if (fraction.length > DECIMAL_PLACES) {
    throw new Error(`${field} may have at most ${DECIMAL_PLACES} decimal places.`);
  }

  const wholeDigits = (whole || "0").replace(/^0+/, "") || "0";
  if (wholeDigits.length > 7) throw new Error(`${field} must be between -1,000,000 and 1,000,000.`);
  const digits = `${wholeDigits}${fraction.padEnd(DECIMAL_PLACES, "0")}`;
  const magnitude = BigInt(digits) * (SCALE / INPUT_SCALE);
  const scaled = text.startsWith("-") ? -magnitude : magnitude;
  if (scaled < -MAX_VALUE || scaled > MAX_VALUE) {
    throw new Error(`${field} must be between -1,000,000 and 1,000,000.`);
  }
  return scaled;
}

function parseData(data) {
  if (typeof data !== "string") throw new Error("Data must be text containing numbers.");
  const text = data.trim();
  if (!text) throw new Error("Enter at least one observation.");
  if (/(?:^|[;\s])[+-]?\d{1,3},\d{3}(?=\.|$|[,;\s])/.test(text)) {
    throw new Error("Thousands grouping is not supported; use commas only between observations.");
  }
  if (!DATA_PATTERN.test(text)) {
    throw new Error("Data must contain signed integers or decimals separated by commas, semicolons, or whitespace; empty or invalid values are not allowed.");
  }

  const tokens = text.split(/\s*(?:,|;)\s*|\s+/);
  if (tokens.length > MAX_OBSERVATIONS) {
    throw new Error(`Data may contain at most ${MAX_OBSERVATIONS} observations.`);
  }
  return tokens.map((token, index) => parseDecimal(token, `Observation ${index + 1}`));
}

function formatDecimal(value) {
  if (value === 0n) return "0";
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / SCALE;
  const fractional = String(absolute % SCALE).padStart(12, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fractional ? `.${fractional}` : ""}`;
}

function niceStep(span) {
  const target = span > 0n ? (span + 4n) / 5n : 1n;
  let power = 1n;
  while (power * 10n <= target) power *= 10n;
  for (const factor of [1n, 2n, 5n, 10n]) {
    const candidate = factor * power;
    if (candidate >= target) return candidate;
  }
  return 10n * power;
}

function floorTo(value, step) {
  let quotient = value / step;
  if (value < 0n && value % step !== 0n) quotient -= 1n;
  return quotient * step;
}

function ceilTo(value, step) {
  return -floorTo(-value, step);
}

function position(value, min, span) {
  return Number(value - min) / Number(span);
}

function isBlank(value) {
  return value === "" || value === null || value === undefined;
}

export function calculateDotPlot(configuration = {}) {
  if (!configuration || typeof configuration !== "object" || Array.isArray(configuration)) {
    throw new Error("Dot plot configuration must be an object.");
  }

  const { data, min = "", max = "", step = "", blank = false } = configuration;
  if (typeof blank !== "boolean") throw new Error("Blank must be true or false.");

  const observations = blank ? [] : parseData(data);
  if (blank && (isBlank(min) || isBlank(max))) {
    throw new Error("Blank plots require manual minimum and maximum values.");
  }

  const minValue = isBlank(min) ? null : parseDecimal(min, "Minimum");
  const maxValue = isBlank(max) ? null : parseDecimal(max, "Maximum");
  let stepValue = isBlank(step) ? null : parseDecimal(step, "Step");
  if (stepValue !== null && stepValue <= 0n) throw new Error("Step must be greater than zero.");
  if (minValue !== null && maxValue !== null && minValue >= maxValue) {
    throw new Error("Minimum must be less than maximum.");
  }

  const observedMin = observations.length ? observations.reduce((a, b) => a < b ? a : b) : null;
  const observedMax = observations.length ? observations.reduce((a, b) => a > b ? a : b) : null;
  if (stepValue === null) {
    const range = minValue !== null && maxValue !== null
      ? maxValue - minValue
      : minValue !== null
        ? observedMax - minValue
        : maxValue !== null
          ? maxValue - observedMin
          : observedMax - observedMin;
    const usefulRange = range > 0n ? range : (observedMax < 0n ? -observedMax : observedMax) / 5n || SCALE;
    stepValue = niceStep(usefulRange);
  }

  let axisMin = minValue ?? floorTo(observedMin, stepValue);
  let axisMax = maxValue ?? ceilTo(observedMax, stepValue);
  if (observations.length && axisMin === axisMax) {
    if (minValue !== null && maxValue === null) axisMax += stepValue * 2n;
    else if (maxValue !== null && minValue === null) axisMin -= stepValue * 2n;
    else if (minValue === null && maxValue === null) {
      axisMin -= stepValue * 2n;
      axisMax += stepValue * 2n;
    }
  }
  if (axisMin >= axisMax) throw new Error("Minimum must be less than maximum.");
  if (observations.some((value) => value < axisMin || value > axisMax)) {
    throw new Error("Axis bounds must contain every observation.");
  }

  const span = axisMax - axisMin;
  const ticks = [];
  for (let value = axisMin; value <= axisMax; value += stepValue) {
    if (ticks.length >= MAX_TICKS) throw new Error(`Axis would exceed the maximum of ${MAX_TICKS} ticks.`);
    const label = formatDecimal(value);
    ticks.push({ value: label, label, position: position(value, axisMin, span) });
  }

  const counts = new Map();
  for (const value of observations) counts.set(value, (counts.get(value) ?? 0) + 1);
  const groups = [...counts]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([value, count]) => {
      const label = formatDecimal(value);
      return { value: label, label, position: position(value, axisMin, span), count };
    });
  const count = observations.length;

  return {
    min: formatDecimal(axisMin),
    max: formatDecimal(axisMax),
    step: formatDecimal(stepValue),
    ticks,
    groups,
    count,
    maxCount: groups.reduce((maximum, group) => Math.max(maximum, group.count), 0),
    distinctCount: groups.length,
  };
}
