const MAX_DECIMAL_PLACES = 12;

export const COORDINATE_PLANE_MATH_LIMITS = Object.freeze({
  maxAbsoluteCoordinate: 10_000,
  maxGridIntervalsPerAxis: 100,
  maxPoints: 20,
  maxDecimalPlaces: MAX_DECIMAL_PLACES,
});

function parseDecimal(value, field) {
  if (typeof value !== "string") throw new Error(`${field} must be a decimal number.`);

  const text = value.trim();
  const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))$/.exec(text);
  if (!match) throw new Error(`${field} must be a finite decimal (fractions and scientific notation are not supported).`);

  const [, sign, whole = "0", fractionAfterWhole, fractionAfterDot] = match;
  const fraction = fractionAfterWhole ?? fractionAfterDot ?? "";
  if (fraction.length > MAX_DECIMAL_PLACES) {
    throw new Error(`${field} may have at most ${MAX_DECIMAL_PLACES} decimal places.`);
  }

  return {
    coefficient: BigInt(`${whole}${fraction}`) * (sign === "-" ? -1n : 1n),
    places: fraction.length,
  };
}

function toScale(decimal, scale) {
  return decimal.coefficient * 10n ** BigInt(scale - decimal.places);
}

function asNumber(value, scale) {
  const result = Number(value) / Number(scale);
  return Object.is(result, -0) ? 0 : result;
}

function formatScaled(value, places) {
  const negative = value < 0n;
  const digits = (negative ? -value : value).toString().padStart(places + 1, "0");
  if (places === 0) return `${negative ? "-" : ""}${digits}`;

  const whole = digits.slice(0, -places);
  const fraction = digits.slice(-places).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function requireObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Coordinate plane specification must be an object.");
  }
}

function ceilDivide(numerator, denominator) {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return remainder > 0n ? quotient + 1n : quotient;
}

function ticksBetween(min, max, step, minBound, span, scalePlaces, axis) {
  if (max - min > step * BigInt(COORDINATE_PLANE_MATH_LIMITS.maxGridIntervalsPerAxis)) {
    throw new Error(`${axis} range may span at most ${COORDINATE_PLANE_MATH_LIMITS.maxGridIntervalsPerAxis} grid intervals at the selected step.`);
  }

  const ticks = [];
  let tick = ceilDivide(min, step) * step;
  while (tick <= max) {
    ticks.push({
      label: formatScaled(tick, scalePlaces),
      position: Number(tick - minBound) / Number(span),
      isZero: tick === 0n,
    });
    tick += step;
  }
  return ticks;
}

export function calculateCoordinatePlane(spec) {
  requireObject(spec);
  if (spec.mode !== "plane" && spec.mode !== "paper") {
    throw new Error('Mode must be "plane" or "paper".');
  }
  if (typeof spec.connectPoints !== "boolean") {
    throw new Error("Connect points must be true or false.");
  }
  if (!Array.isArray(spec.points)) throw new Error("Points must be an array.");
  if (spec.points.length > COORDINATE_PLANE_MATH_LIMITS.maxPoints) {
    throw new Error(`Points may contain at most ${COORDINATE_PLANE_MATH_LIMITS.maxPoints} rows.`);
  }

  const parsedBounds = {
    xMin: parseDecimal(spec.xMin, "X minimum"),
    xMax: parseDecimal(spec.xMax, "X maximum"),
    yMin: parseDecimal(spec.yMin, "Y minimum"),
    yMax: parseDecimal(spec.yMax, "Y maximum"),
    step: parseDecimal(spec.step, "Step"),
  };
  const parsedPoints = spec.points.map((point, index) => {
    if (!point || typeof point !== "object" || Array.isArray(point)) {
      throw new Error(`Point ${index + 1} must be an object.`);
    }
    if (typeof point.x !== "string" || typeof point.y !== "string" || typeof point.label !== "string") {
      throw new Error(`Point ${index + 1} coordinates and label must be text.`);
    }
    const xEmpty = point.x.trim() === "";
    const yEmpty = point.y.trim() === "";
    const labelEmpty = point.label.trim() === "";
    if (xEmpty && yEmpty && labelEmpty) return null;
    if (spec.mode === "paper") {
      throw new Error("Graph-paper mode cannot contain points. Switch to plane mode to use points.");
    }
    if (xEmpty || yEmpty) throw new Error(`Point ${index + 1} must have both an x and y coordinate.`);
    return {
      x: parseDecimal(point.x, `Point ${index + 1} x coordinate`),
      y: parseDecimal(point.y, `Point ${index + 1} y coordinate`),
      label: point.label,
      index,
    };
  });

  const scalePlaces = Math.max(
    ...Object.values(parsedBounds).map(({ places }) => places),
    ...parsedPoints.filter(Boolean).flatMap(({ x, y }) => [x.places, y.places]),
  );
  const scale = 10n ** BigInt(scalePlaces);
  const values = Object.fromEntries(Object.entries(parsedBounds).map(([key, value]) => [key, toScale(value, scalePlaces)]));
  const coordinateLimit = BigInt(COORDINATE_PLANE_MATH_LIMITS.maxAbsoluteCoordinate) * scale;

  for (const [field, value] of Object.entries(values)) {
    if (field === "step") continue;
    if (value < -coordinateLimit || value > coordinateLimit) {
      throw new Error(`${field === "xMin" || field === "xMax" ? "X" : "Y"} bounds must be between -${COORDINATE_PLANE_MATH_LIMITS.maxAbsoluteCoordinate} and ${COORDINATE_PLANE_MATH_LIMITS.maxAbsoluteCoordinate}.`);
    }
  }
  if (values.xMin >= values.xMax) throw new Error("X minimum must be less than X maximum.");
  if (values.yMin >= values.yMax) throw new Error("Y minimum must be less than Y maximum.");
  if (values.step <= 0n) throw new Error("Step must be greater than zero.");

  const xSpan = values.xMax - values.xMin;
  const ySpan = values.yMax - values.yMin;
  const xTicks = ticksBetween(values.xMin, values.xMax, values.step, values.xMin, xSpan, scalePlaces, "X");
  const yTicks = ticksBetween(values.yMin, values.yMax, values.step, values.yMin, ySpan, scalePlaces, "Y");
  const points = parsedPoints.filter(Boolean).map(({ x, y, label, index }) => {
    const xValue = toScale(x, scalePlaces);
    const yValue = toScale(y, scalePlaces);
    if (xValue < values.xMin || xValue > values.xMax || yValue < values.yMin || yValue > values.yMax) {
      throw new Error(`Point ${index + 1} must be within both axis bounds.`);
    }
    return {
      label,
      xPosition: Number(xValue - values.xMin) / Number(xSpan),
      yPosition: Number(yValue - values.yMin) / Number(ySpan),
    };
  });

  return {
    xSpan: asNumber(xSpan, scale),
    ySpan: asNumber(ySpan, scale),
    step: asNumber(values.step, scale),
    stepLabel: formatScaled(values.step, scalePlaces),
    xTicks,
    yTicks,
    points,
    xAxisPosition: values.yMin <= 0n && values.yMax >= 0n ? Number(-values.yMin) / Number(ySpan) : null,
    yAxisPosition: values.xMin <= 0n && values.xMax >= 0n ? Number(-values.xMin) / Number(xSpan) : null,
  };
}
