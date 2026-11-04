const MAX_INPUT_LENGTH = 100_000;
const MAX_POINTS = 500;
const MAX_ABSOLUTE_VALUE = 1e12;

function parseCsvRow(text) {
  const fields = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
        closedQuote = true;
      } else {
        field += character;
      }
    } else if (character === ",") {
      fields.push(field);
      field = "";
      closedQuote = false;
    } else if (character === '"') {
      if (field.trim() || closedQuote) return { error: "Unexpected quote in row." };
      field = "";
      quoted = true;
    } else {
      if (closedQuote && !/\s/.test(character)) return { error: "Unexpected text after a quoted field." };
      field += character;
    }
  }

  if (quoted) return { error: "Unclosed quoted field." };
  fields.push(field);
  return { fields };
}

function isHeader(fields) {
  return fields.length === 2 && fields[0].trim().toLowerCase() === "x" && fields[1].trim().toLowerCase() === "y"
    || fields.length === 3 && fields[0].trim().toLowerCase() === "x" && fields[1].trim().toLowerCase() === "y" && fields[2].trim().toLowerCase() === "label";
}

function parseCoordinate(value, field) {
  const text = value.trim();
  if (!text) throw new Error(`${field} value is empty.`);
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) {
    throw new Error(`${field} must use decimal or scientific numeric notation.`);
  }
  const number = Number(text);
  if (!Number.isFinite(number)) throw new Error(`${field} must be a finite number.`);
  if (Math.abs(number) > MAX_ABSOLUTE_VALUE) throw new Error(`${field} must be between -1e12 and 1e12.`);
  return number;
}

export function parseScatterData(text) {
  const points = [];
  const errors = [];

  if (typeof text !== "string") {
    return { points, errors: [{ line: 1, message: "Input must be text." }] };
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return { points, errors: [{ line: 1, message: `Input may contain at most ${MAX_INPUT_LENGTH} characters.` }] };
  }

  const lines = text.split(/\r?\n/);
  const firstDataLine = lines.find((line) => line.trim() !== "");
  const delimiter = firstDataLine?.includes("\t") ? "\t" : ",";
  let headerChecked = false;

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    if (!line.trim()) continue;

    let fields;
    if (delimiter === "\t") {
      fields = line.split("\t");
    } else {
      const parsed = parseCsvRow(line);
      if (parsed.error) {
        errors.push({ line: lineNumber, message: parsed.error });
        headerChecked = true;
        continue;
      }
      fields = parsed.fields;
    }

    if (!headerChecked) {
      headerChecked = true;
      if (isHeader(fields)) continue;
    }

    if (fields.length < 2 || fields.length > 3) {
      errors.push({ line: lineNumber, message: "Row must contain x, y, and optionally a label." });
      continue;
    }

    try {
      const x = parseCoordinate(fields[0], "X");
      const y = parseCoordinate(fields[1], "Y");
      const label = fields.length === 3 ? fields[2].trim() : "";
      points.push({ x, y, label });
      if (points.length > MAX_POINTS) {
        return {
          points: [],
          errors: [{ line: lineNumber, message: `Input may contain at most ${MAX_POINTS} points.` }],
        };
      }
    } catch (error) {
      errors.push({ line: lineNumber, message: error.message });
    }
  }

  return { points, errors };
}

export function calculateScatterRegression(points) {
  const unavailable = (status, message) => ({ slope: null, intercept: null, rSquared: null, status, message });
  if (!Array.isArray(points) || points.length < 2) {
    return unavailable("insufficient", "At least two points are required.");
  }
  if (points.some((point) => !point || !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
    return unavailable("numeric-error", "Points must contain finite x and y values.");
  }

  const firstX = points[0].x;
  const firstY = points[0].y;
  const constantX = points.every((point) => point.x === firstX);
  const constantY = points.every((point) => point.y === firstY);
  if (constantX) return unavailable("constant-x", "Regression is unavailable when all x values are equal.");

  const count = points.length;
  const meanOffsetX = points.reduce((sum, point) => sum + (point.x - firstX) / count, 0);
  const meanOffsetY = points.reduce((sum, point) => sum + (point.y - firstY) / count, 0);
  let xx = 0;
  let yy = 0;
  let xy = 0;
  for (const point of points) {
    const centeredX = (point.x - firstX) - meanOffsetX;
    const centeredY = (point.y - firstY) - meanOffsetY;
    xx += centeredX * centeredX;
    yy += centeredY * centeredY;
    xy += centeredX * centeredY;
  }

  if (![meanOffsetX, meanOffsetY, xx, yy, xy].every(Number.isFinite)) {
    return unavailable("numeric-error", "Regression could not be calculated safely.");
  }
  if (xx === 0 || (yy === 0 && !constantY)) {
    return unavailable("numeric-error", "Regression could not be calculated safely.");
  }

  const slope = xy / xx;
  const intercept = firstY + meanOffsetY - slope * (firstX + meanOffsetX);
  if (!Number.isFinite(slope) || !Number.isFinite(intercept)) {
    return unavailable("numeric-error", "Regression could not be calculated safely.");
  }
  if (constantY) {
    return { slope, intercept, rSquared: null, status: "constant-y", message: "Y values are constant; R-squared is unavailable." };
  }

  const rSquared = Math.max(0, Math.min(1, (xy * xy) / (xx * yy)));
  if (!Number.isFinite(rSquared)) return unavailable("numeric-error", "Regression could not be calculated safely.");
  return { slope, intercept, rSquared, status: "ok", message: "" };
}

function paddedBounds(min, max) {
  const span = max - min;
  const padding = span === 0 ? Math.max(Math.abs(min) * 0.05, 1) : span * 0.05;
  return [min - padding, max + padding];
}

function finiteScatterPoints(points) {
  return Array.isArray(points)
    ? points.filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y))
    : [];
}

// Worksheet corners are the exact minimum and maximum of the supplied points. Solved plots keep padded bounds.
export function getScatterCornerBounds(points) {
  const finitePoints = finiteScatterPoints(points);
  if (!finitePoints.length) return { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };

  const xValues = finitePoints.map((point) => point.x);
  const yValues = finitePoints.map((point) => point.y);
  return {
    xMin: Math.min(...xValues),
    xMax: Math.max(...xValues),
    yMin: Math.min(...yValues),
    yMax: Math.max(...yValues),
  };
}

export function getScatterBounds(points) {
  const finitePoints = finiteScatterPoints(points);
  if (!finitePoints.length) return { xMin: -1, xMax: 1, yMin: -1, yMax: 1 };

  const xValues = finitePoints.map((point) => point.x);
  const yValues = finitePoints.map((point) => point.y);
  const [xMin, xMax] = paddedBounds(Math.min(...xValues), Math.max(...xValues));
  const [yMin, yMax] = paddedBounds(Math.min(...yValues), Math.max(...yValues));
  return { xMin, xMax, yMin, yMax };
}
