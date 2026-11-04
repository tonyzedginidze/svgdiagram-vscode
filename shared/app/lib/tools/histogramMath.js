export const HISTOGRAM_MATH_LIMITS = Object.freeze({
  observations: 10_000,
  bins: 60,
  absoluteValue: 1e12,
  minimumResolution: 1e-12,
});

const NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

function tokenizeHistogramData(raw) {
  if (typeof raw !== "string") throw new Error("Data must be text.");

  // Commas and whitespace are delimiters, so thousands-grouped values are intentionally unsupported.
  if (/(?:^|\s)[+-]?\d{1,3}(?:,\d{3})+(?:$|\s)/.test(raw.trim())) {
    throw new Error("Thousands separators are ambiguous; use one observation per comma or whitespace-delimited number.");
  }
  const tokens = raw.trim().split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) throw new Error("Enter at least one numeric observation.");
  if (tokens.length > HISTOGRAM_MATH_LIMITS.observations) {
    throw new Error(`Data may contain at most ${HISTOGRAM_MATH_LIMITS.observations} observations.`);
  }
  return tokens;
}

function parseNumber(value, field) {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error(`${field} must be a number.`);
  }
  const text = String(value).trim();
  if (!text || !NUMBER_PATTERN.test(text)) throw new Error(`${field} must be a valid number.`);
  const exact = decimalParts(text, field);
  const number = Number(text);
  if (!Number.isFinite(number)) throw new Error(`${field} must be finite.`);
  if (exact.coefficient !== 0n && number === 0) throw new Error(`${field} is smaller than the supported precision.`);
  if (Math.abs(number) > HISTOGRAM_MATH_LIMITS.absoluteValue) {
    throw new Error(`${field} must be between -${HISTOGRAM_MATH_LIMITS.absoluteValue} and ${HISTOGRAM_MATH_LIMITS.absoluteValue}.`);
  }
  if (number !== 0 && Math.abs(number) < HISTOGRAM_MATH_LIMITS.minimumResolution) {
    throw new Error(`${field} is smaller than the supported precision.`);
  }
  return number;
}

function decimalParts(value, field) {
  const text = String(value).trim();
  const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(text);
  if (!match) throw new Error(`${field} must be a valid number.`);
  const [, sign, whole = "", fraction = "", exponentText = "0"] = match;
  const digits = `${whole || "0"}${fraction}`;
  if (digits.length > 64) throw new Error(`${field} exceeds the supported numeric precision.`);
  const coefficient = BigInt(digits || "0") * (sign === "-" ? -1n : 1n);
  if (coefficient === 0n) return { coefficient, power: 0 };
  const exponent = Number(exponentText);
  const power = exponent - fraction.length;
  if (!Number.isSafeInteger(power) || Math.abs(power) > 24) {
    throw new Error(`${field} exceeds the supported numeric precision.`);
  }
  return { coefficient, power };
}

function decimalScale(values, fields) {
  const parts = values.map((value, index) => decimalParts(value, fields[index]));
  return Math.max(0, ...parts.map(({ power }) => -power));
}

function scaleDecimals(values, fields) {
  const scale = decimalScale(values, fields);
  return values.map((value, index) => {
    const { coefficient, power } = decimalParts(value, fields[index]);
    return coefficient * 10n ** BigInt(power + scale);
  });
}

function formatScaledDecimal(value, scale) {
  const negative = value < 0n;
  const digits = String(negative ? -value : value).padStart(scale + 1, "0");
  const whole = scale ? digits.slice(0, -scale) : digits;
  const fraction = scale ? digits.slice(-scale).replace(/0+$/, "") : "";
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function parseHistogramData(raw) {
  return tokenizeHistogramData(raw).map((token, index) => parseNumber(token, `Observation ${index + 1}`));
}

function makeEdges(edges) {
  if (edges.some((edge) => !Number.isFinite(edge) || Math.abs(edge) > HISTOGRAM_MATH_LIMITS.absoluteValue)) {
    throw new Error("Requested bin edges exceed the supported numeric range.");
  }
  for (let index = 1; index < edges.length; index += 1) {
    if (!(edges[index] > edges[index - 1])) {
      throw new Error("Requested bins exceed the supported numeric precision.");
    }
  }
  return edges;
}

function calculateBinCount(configuration, values, min, max, exact) {
  const { binMode, binCount, binWidth } = configuration;
  if (binMode === "count") {
    const count = parseNumber(binCount, "Bin count");
    if (!Number.isSafeInteger(count) || count < 1 || count > HISTOGRAM_MATH_LIMITS.bins) {
      throw new Error(`Bin count must be an integer from 1 to ${HISTOGRAM_MATH_LIMITS.bins}.`);
    }
    return count;
  }
  if (binMode === "width") {
    const width = parseNumber(binWidth, "Bin width");
    if (width <= 0) throw new Error("Bin width must be greater than zero.");
    const widthText = String(binWidth).trim();
    const hasOrigin = configuration.binStart !== "" && configuration.binStart != null;
    let originText;
    if (hasOrigin) {
      originText = String(configuration.binStart).trim();
      parseNumber(originText, "Bin start");
    } else {
      const defaultScale = decimalScale([widthText, exact.minText], ["Bin width", "Minimum observation"]);
      let [widthScaled, minScaled] = scaleDecimals([widthText, exact.minText], ["Bin width", "Minimum observation"]);
      let originScale = defaultScale;
      if (widthScaled % 2n !== 0n) {
        widthScaled *= 10n;
        minScaled *= 10n;
        originScale += 1;
      }
      originText = formatScaledDecimal(minScaled - widthScaled / 2n, originScale);
    }
    const [originInt, widthInt, minInt, maxInt] = scaleDecimals([originText, widthText, exact.minText, exact.maxText], ["Bin start", "Bin width", "Minimum observation", "Maximum observation"]);
    if (originInt > minInt) throw new Error("Bin start must be less than or equal to the minimum observation.");
    const origin = parseNumber(originText, "Bin start");
    const distance = maxInt - originInt;
    const count = Math.max(1, Number((distance + widthInt - 1n) / widthInt));
    if (!Number.isSafeInteger(count) || count > HISTOGRAM_MATH_LIMITS.bins) {
      throw new Error(`Bin width would create more than ${HISTOGRAM_MATH_LIMITS.bins} bins.`);
    }
    return { count, width, origin, originText, widthText };
  }
  if (binMode !== "auto") throw new Error('Bin mode must be "auto", "count", or "width".');
  return Math.min(HISTOGRAM_MATH_LIMITS.bins, Math.max(1, Math.ceil(Math.sqrt(values.length))));
}

export function calculateHistogram({ data, binMode = "auto", binCount = "8", binWidth = "5", binStart = "" } = {}) {
  const tokens = tokenizeHistogramData(data);
  const values = tokens.map((token, index) => parseNumber(token, `Observation ${index + 1}`));
  const exactDataValues = scaleDecimals(tokens, tokens.map((_, index) => `Observation ${index + 1}`));
  const minIndex = exactDataValues.reduce((best, value, index) => value < exactDataValues[best] ? index : best, 0);
  const maxIndex = exactDataValues.reduce((best, value, index) => value > exactDataValues[best] ? index : best, 0);
  const minExact = exactDataValues[minIndex];
  const maxExact = exactDataValues[maxIndex];
  const min = values[minIndex];
  const max = values[maxIndex];
  if (minExact !== maxExact && min === max) {
    throw new Error("Distinct observations collapse to the same numeric value; their data range cannot be represented for drawing.");
  }
  const configuration = { binMode, binCount, binWidth, binStart };
  const exact = { minText: tokens[minIndex], maxText: tokens[maxIndex] };
  const selected = calculateBinCount(configuration, values, min, max, exact);

  let count;
  let width;
  let origin;
  let originText;
  let widthText;
  if (typeof selected === "object") {
    ({ count, width, origin, originText, widthText } = selected);
  } else {
    count = selected;
    if (minExact === maxExact) {
      const span = Math.max(1, Math.abs(min) * 0.1);
      width = span / count;
      origin = min - span / 2;
    } else {
      width = (max - min) / count;
      origin = min;
    }
  }

  if (!(width > 0) || !Number.isFinite(width) || width < HISTOGRAM_MATH_LIMITS.minimumResolution) {
    throw new Error("The data range is smaller than the supported bin precision.");
  }
  let edges;
  let exactValues;
  if (binMode === "width") {
    const exactTokens = [originText, widthText, ...tokens];
    const exactScale = Math.max(0, ...exactTokens.map((text, index) => -decimalParts(text, index < 2 ? (index === 0 ? "Bin start" : "Bin width") : `Observation ${index - 1}`).power));
    const scaled = scaleDecimals(exactTokens, exactTokens.map((_, index) => index === 0 ? "Bin start" : index === 1 ? "Bin width" : `Observation ${index - 1}`));
    const originInt = scaled[0];
    const widthInt = scaled[1];
    exactValues = scaled.slice(2);
    edges = Array.from({ length: count + 1 }, (_, index) => Number(originInt + widthInt * BigInt(index)) / 10 ** exactScale);
  } else if (minExact === maxExact) {
    edges = Array.from({ length: count + 1 }, (_, index) => origin + width * index);
    exactValues = [];
  } else {
    const scaled = exactDataValues;
    const scale = decimalScale(tokens, tokens.map((_, index) => `Observation ${index + 1}`));
    const low = minExact;
    const high = maxExact;
    const denominator = 10n ** BigInt(scale) * BigInt(count);
    edges = Array.from({ length: count + 1 }, (_, index) => index === count
      ? max
      : Number(low * BigInt(count) + (high - low) * BigInt(index)) / Number(denominator));
    exactValues = scaled;
  }
  makeEdges(edges);
  if (max > edges[edges.length - 1]) {
    if (binMode === "width") throw new Error("Bin width does not cover the maximum observation at supported precision.");
    throw new Error("The data range cannot be divided into stable bins at supported precision.");
  }
  if (min < edges[0]) throw new Error("The first bin edge excludes an observation.");

  const bins = edges.slice(0, -1).map((start, index) => ({
    start,
    end: edges[index + 1],
    count: 0,
    last: index === count - 1,
  }));
  for (let valueIndex = 0; valueIndex < values.length; valueIndex += 1) {
    const value = values[valueIndex];
    let index;
    if (binMode === "width") {
      const scaled = scaleDecimals([originText, widthText, tokens[valueIndex]], ["Bin start", "Bin width", `Observation ${valueIndex + 1}`]);
      index = Number((scaled[2] - scaled[0]) / scaled[1]);
    } else if (minExact === maxExact) {
      index = Math.min(count - 1, Math.floor((value - edges[0]) / width));
    } else {
      index = exactDataValues[valueIndex] === maxExact ? count - 1 : Number((exactDataValues[valueIndex] - minExact) * BigInt(count) / (maxExact - minExact));
    }
    if (index >= count) index = count - 1;
    if (value < edges[index] || (value >= edges[index + 1] && !bins[index].last) || (value > edges[index + 1] && bins[index].last)) {
      throw new Error("An observation falls outside the calculated bins at supported precision.");
    }
    bins[index].count += 1;
  }

  if (bins.reduce((total, bin) => total + bin.count, 0) !== values.length) {
    throw new Error("Could not assign every observation to a bin.");
  }
  return { values, count: values.length, min, max, bins, edges, binWidth: width, binCount: count, method: binMode };
}
