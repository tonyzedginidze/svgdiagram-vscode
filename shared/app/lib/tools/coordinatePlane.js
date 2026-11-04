import { FONT_IDS, FONT_WEIGHTS, TextFitError, centeredBaseline, roundCoordinate, wrapLines } from "@svgdiagram/diagram/web";
import { calculateCoordinatePlane, COORDINATE_PLANE_MATH_LIMITS } from "./coordinatePlaneMath.js";

const TEXT_DARK = "#0f172a";
const TEXT_BODY = "#334155";
const TEXT_MUTED = "#64748b";
const GRID_LINE = "#cbd5e1";
const AXIS_LINE = "#1e293b";
const PAPER = "#ffffff";
const CREDIT = "Made with svgdiagram.ai";

export const COORDINATE_PLANE_LIMITS = Object.freeze({
  title: 80,
  axisName: 40,
  label: 32,
  maxPoints: 20,
  maxAbsoluteCoordinate: COORDINATE_PLANE_MATH_LIMITS.maxAbsoluteCoordinate,
});

const PALETTE_COLORS = (primary, line) => Object.freeze([primary, line]);

export const COORDINATE_PLANE_PALETTES = Object.freeze([
  { id: "classic", label: "Classic", colors: PALETTE_COLORS("#2563eb", "#0284c7") },
  { id: "emerald", label: "Emerald", colors: PALETTE_COLORS("#059669", "#0d9488") },
  { id: "violet", label: "Violet", colors: PALETTE_COLORS("#7c3aed", "#4f46e5") },
  { id: "amber", label: "Amber", colors: PALETTE_COLORS("#d97706", "#b45309") },
  { id: "slate", label: "Slate", colors: PALETTE_COLORS("#0f172a", "#475569") },
].map(Object.freeze));

export const COORDINATE_PLANE_TEXT_SIZES = Object.freeze({ small: 0.9, medium: 1, large: 1.15 });
export const COORDINATE_PLANE_BACKGROUNDS = Object.freeze(["white", "transparent"]);
export const COORDINATE_PLANE_MODES = Object.freeze(["plane", "paper"]);

const BASE_STYLES = Object.freeze({
  title: { size: 18, weight: 700, lineSpacing: 24 },
  axisName: { size: 13, weight: 600, lineSpacing: 17 },
  tick: { size: 11, weight: 500, lineSpacing: 15 },
  point: { size: 12, weight: 700, lineSpacing: 16 },
  small: { size: 11, weight: 400, lineSpacing: 15 },
  worksheet: { size: 12, weight: 700, lineSpacing: 16 },
});

const measuredWeight = (weight) => (weight >= 600 ? FONT_WEIGHTS.bold : FONT_WEIGHTS.regular);
const scaled = (style, factor) => {
  const size = Math.round(style.size * factor * 2) / 2;
  const lineSpacing = Math.max(size + 2, Math.round(style.lineSpacing * factor));
  return { size, weight: style.weight, lineSpacing };
};
const widthOf = (text, style, measureText) => measureText(String(text), { size: style.size, weight: measuredWeight(style.weight) });

const normalizeBool = (value, field, defaultValue) => {
  if (value === undefined) return defaultValue;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`Invalid boolean for ${field}`);
};

const pointOf = (point) => {
  if (!point || typeof point !== "object" || Array.isArray(point)) {
    throw new Error("Invalid point object");
  }
  let x = "";
  if (typeof point.x === "string") x = point.x;
  else if (typeof point.x === "number" && Number.isFinite(point.x)) x = String(point.x);
  else if (point.x !== undefined && point.x !== "") throw new Error("Invalid x coordinate");

  let y = "";
  if (typeof point.y === "string") y = point.y;
  else if (typeof point.y === "number" && Number.isFinite(point.y)) y = String(point.y);
  else if (point.y !== undefined && point.y !== "") throw new Error("Invalid y coordinate");

  let label = "";
  if (typeof point.label === "string") label = point.label.slice(0, COORDINATE_PLANE_LIMITS.label);
  else if (typeof point.label === "number") label = String(point.label).slice(0, COORDINATE_PLANE_LIMITS.label);
  else if (point.label !== undefined && point.label !== null && point.label !== "") throw new Error("Invalid point label");

  return { x, y, label };
};

const colorsOf = (colors) => {
  const fallback = COORDINATE_PLANE_PALETTES[0].colors;
  if (!Array.isArray(colors) || colors.length < fallback.length) return [...fallback];
  const next = colors.slice(0, fallback.length);
  if (next.some((color) => typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color))) return [...fallback];
  return next;
};

const planeSpec = ({
  title = "",
  xMin = "-5",
  xMax = "5",
  yMin = "-5",
  yMax = "5",
  step = "1",
  xAxisName = "x",
  yAxisName = "y",
  showTickLabels = true,
  connectPoints = true,
  mode = "plane",
  points = [],
  colors = COORDINATE_PLANE_PALETTES[0].colors,
  textSize = "medium",
  font = "inter",
  background = "white",
  worksheet = false,
} = {}) => ({
  title,
  xMin,
  xMax,
  yMin,
  yMax,
  step,
  xAxisName,
  yAxisName,
  showTickLabels: Boolean(showTickLabels),
  connectPoints: Boolean(connectPoints),
  mode: COORDINATE_PLANE_MODES.includes(mode) ? mode : "plane",
  points: points.map(pointOf),
  colors: colorsOf(colors),
  textSize,
  font,
  background,
  worksheet: Boolean(worksheet),
});

const specimen = (slug, spec) => ({ slug, title: spec.title || "Coordinate plane", plane: planeSpec(spec) });

export const DEFAULT_COORDINATE_PLANE = planeSpec({
  title: "Four-quadrant coordinate plane",
  xMin: "-5",
  xMax: "5",
  yMin: "-5",
  yMax: "5",
  step: "1",
  xAxisName: "x",
  yAxisName: "y",
  showTickLabels: true,
  connectPoints: true,
  mode: "plane",
  points: [
    { x: "3", y: "4", label: "A (3, 4)" },
    { x: "-2", y: "3", label: "B (-2, 3)" },
    { x: "-4", y: "-3", label: "C (-4, -3)" },
    { x: "2", y: "-4", label: "D (2, -4)" },
  ],
});

export const COORDINATE_PLANE_EXAMPLES = Object.freeze([
  specimen("four-quadrants", DEFAULT_COORDINATE_PLANE),
  specimen("first-quadrant", {
    title: "First quadrant grid",
    xMin: "0",
    xMax: "10",
    yMin: "0",
    yMax: "10",
    step: "1",
    xAxisName: "x",
    yAxisName: "y",
    points: [
      { x: "2", y: "3", label: "P1" },
      { x: "5", y: "8", label: "P2" },
      { x: "8", y: "4", label: "P3" },
    ],
    connectPoints: true,
  }),
  specimen("asymmetric", {
    title: "Asymmetric grid bounds",
    xMin: "-2",
    xMax: "8",
    yMin: "-6",
    yMax: "4",
    step: "1",
    xAxisName: "Time (s)",
    yAxisName: "Height (m)",
    points: [
      { x: "0", y: "-4", label: "Start" },
      { x: "4", y: "2", label: "Peak" },
      { x: "7", y: "-2", label: "End" },
    ],
    connectPoints: true,
  }),
  specimen("decimal-grid", {
    title: "Decimal grid step",
    xMin: "-2",
    xMax: "2",
    yMin: "-2",
    yMax: "2",
    step: "0.5",
    xAxisName: "x",
    yAxisName: "y",
    points: [
      { x: "0.5", y: "1.5", label: "P1" },
      { x: "-1.5", y: "-0.5", label: "P2" },
    ],
    connectPoints: false,
  }),
].map(Object.freeze));

const blank = (spec) =>
  planeSpec({
    colors: COORDINATE_PLANE_PALETTES[4].colors,
    points: [],
    worksheet: true,
    ...spec,
  });

export const COORDINATE_PLANE_BLANKS = Object.freeze([
  specimen("blank-four-quadrants", blank({
    title: "Four-quadrant coordinate plane worksheet",
    xMin: "-5",
    xMax: "5",
    yMin: "-5",
    yMax: "5",
    step: "1",
    mode: "plane",
  })),
  specimen("blank-first-quadrant", blank({
    title: "First-quadrant coordinate plane worksheet",
    xMin: "0",
    xMax: "10",
    yMin: "0",
    yMax: "10",
    step: "1",
    mode: "plane",
  })),
  specimen("blank-graph-paper", blank({
    title: "Graph paper grid",
    xMin: "-10",
    xMax: "10",
    yMin: "-10",
    yMax: "10",
    step: "1",
    mode: "paper",
  })),
].map(Object.freeze));

export const COORDINATE_PLANE_FIGURES = Object.freeze([
  specimen("parts", {
    title: "Parts of a coordinate plane",
    xMin: "-5",
    xMax: "5",
    yMin: "-5",
    yMax: "5",
    step: "1",
    points: [{ x: "3", y: "2", label: "(3, 2)" }],
    connectPoints: false,
  }),
].map(Object.freeze));

export const coordinatePlaneBySlug = (slug) =>
  [...COORDINATE_PLANE_EXAMPLES, ...COORDINATE_PLANE_BLANKS, ...COORDINATE_PLANE_FIGURES].find((item) => item.slug === slug);

export const coordinatePlaneImage = (slug) => `/images/tools/coordinate-plane-${slug}.svg`;

export function normalizeCoordinatePlane(raw = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid coordinate plane state");
  }
  const defaults = DEFAULT_COORDINATE_PLANE;

  const showTickLabels = normalizeBool(raw.showTickLabels, "showTickLabels", defaults.showTickLabels);
  const connectPoints = normalizeBool(raw.connectPoints, "connectPoints", defaults.connectPoints);
  const worksheet = normalizeBool(raw.worksheet, "worksheet", defaults.worksheet);

  if (raw.points !== undefined) {
    if (!Array.isArray(raw.points)) throw new Error("Points must be an array");
    if (raw.points.length > COORDINATE_PLANE_LIMITS.maxPoints) {
      throw new Error(`Points array exceeds max limit`);
    }
  }

  const parseStr = (val, field, maxLen, fallback) => {
    if (val === undefined) return fallback;
    if (typeof val === "string") return maxLen ? val.slice(0, maxLen) : val;
    if (typeof val === "number" && Number.isFinite(val)) return String(val);
    throw new Error(`Invalid text for ${field}`);
  };

  const mode = raw.mode === undefined ? defaults.mode : (COORDINATE_PLANE_MODES.includes(raw.mode) ? raw.mode : (() => { throw new Error("Invalid mode"); })());
  const textSize = raw.textSize === undefined ? defaults.textSize : (Object.keys(COORDINATE_PLANE_TEXT_SIZES).includes(raw.textSize) ? raw.textSize : (() => { throw new Error("Invalid textSize"); })());
  const font = raw.font === undefined ? defaults.font : (FONT_IDS.includes(raw.font) ? raw.font : (() => { throw new Error("Invalid font"); })());
  const background = raw.background === undefined ? defaults.background : (COORDINATE_PLANE_BACKGROUNDS.includes(raw.background) ? raw.background : (() => { throw new Error("Invalid background"); })());

  return planeSpec({
    title: parseStr(raw.title, "title", COORDINATE_PLANE_LIMITS.title, defaults.title),
    xMin: parseStr(raw.xMin, "xMin", null, defaults.xMin),
    xMax: parseStr(raw.xMax, "xMax", null, defaults.xMax),
    yMin: parseStr(raw.yMin, "yMin", null, defaults.yMin),
    yMax: parseStr(raw.yMax, "yMax", null, defaults.yMax),
    step: parseStr(raw.step, "step", null, defaults.step),
    xAxisName: parseStr(raw.xAxisName, "xAxisName", COORDINATE_PLANE_LIMITS.axisName, defaults.xAxisName),
    yAxisName: parseStr(raw.yAxisName, "yAxisName", COORDINATE_PLANE_LIMITS.axisName, defaults.yAxisName),
    showTickLabels,
    connectPoints,
    mode,
    points: Array.isArray(raw.points) ? raw.points.map(pointOf) : defaults.points,
    colors: colorsOf(raw.colors),
    textSize,
    font,
    background,
    worksheet,
  });
}

export function coordinatePlaneCalculationConfig(spec) {
  const worksheet = Boolean(spec.worksheet);
  const isPaper = spec.mode === "paper";

  return {
    xMin: spec.xMin,
    xMax: spec.xMax,
    yMin: spec.yMin,
    yMax: spec.yMax,
    step: spec.step,
    mode: spec.mode,
    connectPoints: spec.connectPoints,
    points: worksheet || isPaper ? [] : spec.points.map((pt) => ({ x: pt.x, y: pt.y, label: pt.label })),
  };
}

function textBlock({ text, x, top, maxWidth, style, color, anchor, measureText }) {
  const wrapStyle = { size: style.size, weight: measuredWeight(style.weight), lineSpacing: style.lineSpacing };
  let wrapped;
  try {
    wrapped = wrapLines(String(text), { style: wrapStyle, maxWidth: Math.max(maxWidth, 10), measureText });
  } catch (error) {
    if (error instanceof TextFitError) throw new TextFitError(`Text "${text}" is too long to fit.`);
    throw error;
  }
  return {
    x: roundCoordinate(x),
    top: roundCoordinate(top),
    maxWidth: roundCoordinate(maxWidth),
    width: roundCoordinate(wrapped.width),
    height: roundCoordinate(wrapped.height),
    anchor,
    style: { size: style.size, weight: style.weight, lineSpacing: style.lineSpacing },
    color,
    lines: wrapped.lines.map((line, index) => ({
      text: line,
      x: roundCoordinate(x),
      y: centeredBaseline(top + index * style.lineSpacing, style),
    })),
  };
}

function lineBlock({ text, x, top, style, color, anchor, measureText }) {
  const width = widthOf(text, style, measureText);
  return {
    x: roundCoordinate(x),
    top: roundCoordinate(top),
    maxWidth: roundCoordinate(Math.max(width, 1)),
    width: roundCoordinate(width),
    height: roundCoordinate(style.lineSpacing),
    anchor,
    style: { size: style.size, weight: style.weight, lineSpacing: style.lineSpacing },
    color,
    lines: [{ text: String(text), x: roundCoordinate(x), y: centeredBaseline(top, style) }],
  };
}

function guide(x1, x2, y) {
  return { x1: roundCoordinate(x1), x2: roundCoordinate(x2), y: roundCoordinate(y), stroke: "#94a3b8", strokeWidth: 1.25, dash: "4 3" };
}

function getBlockBounds(block) {
  if (!block) return null;
  const left = block.anchor === "middle" ? block.x - block.width / 2 : block.anchor === "end" ? block.x - block.width : block.x;
  return { left, right: left + block.width, top: block.top, bottom: block.top + block.height };
}

function checkOverlap(b1, b2, margin = 2) {
  if (!b1 || !b2) return false;
  return (
    b1.left < b2.right + margin &&
    b1.right > b2.left - margin &&
    b1.top < b2.bottom + margin &&
    b1.bottom > b2.top - margin
  );
}

export function layoutCoordinatePlane(rawSpec, measureText) {
  if (typeof measureText !== "function") throw new TypeError("layoutCoordinatePlane requires measureText");

  const spec = normalizeCoordinatePlane(rawSpec);

  let calculated;
  try {
    calculated = calculateCoordinatePlane(coordinatePlaneCalculationConfig(spec));
  } catch (error) {
    throw new TextFitError(error instanceof Error ? error.message : "The coordinate plane could not be calculated.");
  }

  const factor = COORDINATE_PLANE_TEXT_SIZES[spec.textSize] || 1;
  const styles = Object.fromEntries(Object.entries(BASE_STYLES).map(([name, style]) => [name, scaled(style, factor)]));

  const isPaper = spec.mode === "paper";
  const worksheet = Boolean(spec.worksheet);

  // Exact physical scale & aspect ratio validation
  const xIntervals = calculated.xSpan / calculated.step;
  const yIntervals = calculated.ySpan / calculated.step;

  if (!Number.isFinite(xIntervals) || !Number.isFinite(yIntervals) || xIntervals <= 0 || yIntervals <= 0) {
    throw new TextFitError("Invalid grid dimensions.");
  }

  const aspect = calculated.xSpan / calculated.ySpan;
  if (aspect > 10 || aspect < 0.1) {
    throw new TextFitError("The grid aspect ratio is too extreme to render clearly.");
  }

  const targetPlotSize = 440;
  const maxIntervals = Math.max(xIntervals, yIntervals);
  const intervalPx = Math.max(12, Math.min(60, targetPlotSize / maxIntervals));

  const plotWidth = roundCoordinate(xIntervals * intervalPx);
  const plotHeight = roundCoordinate(yIntervals * intervalPx);

  if (plotWidth < 20 || plotHeight < 20) {
    throw new TextFitError("The grid dimensions are too small to render clearly.");
  }

  // Determine tick label strings
  const yTickStrings = !isPaper && spec.showTickLabels ? calculated.yTicks.map((t) => t.label) : [];
  const xTickStrings = !isPaper && spec.showTickLabels ? calculated.xTicks.map((t) => t.label) : [];

  const maxYTickLabelWidth = yTickStrings.length > 0
    ? Math.max(0, ...yTickStrings.map((t) => widthOf(t, styles.tick, measureText)))
    : 0;
  const maxXTickLabelWidth = xTickStrings.length > 0
    ? Math.max(0, ...xTickStrings.map((t) => widthOf(t, styles.tick, measureText)))
    : 0;

  const yAxisNameWidth = !isPaper && spec.yAxisName.trim() ? widthOf(spec.yAxisName.trim(), styles.axisName, measureText) : 0;
  const xAxisNameWidth = !isPaper && spec.xAxisName.trim() ? widthOf(spec.xAxisName.trim(), styles.axisName, measureText) : 0;

  const MARGIN = 32;
  let topY = 24;

  let nameDate = null;
  if (worksheet) {
    const fieldWidth = 240;
    const fields = ["Name:", "Date:"].map((label, index) => {
      const x = MARGIN + index * (fieldWidth + 40);
      const labelWidth = widthOf(label, styles.worksheet, measureText);
      const block = lineBlock({ text: label, x, top: topY, style: styles.worksheet, color: TEXT_BODY, anchor: "start", measureText });
      return {
        label: block,
        line: guide(x + labelWidth + 8, x + fieldWidth, block.lines[0].y + 2),
      };
    });
    nameDate = { fields };
    topY += styles.worksheet.lineSpacing + 16;
  }

  const titleBlock = spec.title.trim()
    ? textBlock({ text: spec.title.trim(), x: 0, top: topY, maxWidth: 600, style: styles.title, color: TEXT_DARK, anchor: "middle", measureText })
    : null;
  if (titleBlock) topY += titleBlock.height + 16;

  const yAxisNameHeight = !isPaper && spec.yAxisName.trim()
    ? styles.axisName.lineSpacing + styles.tick.lineSpacing / 2 + 8
    : 0;
  const leftExtra = Math.max(
    maxYTickLabelWidth + (yTickStrings.length > 0 ? 12 : 0),
    yAxisNameWidth > 0 ? yAxisNameWidth / 2 + 8 : 0
  );
  const xAxisNameGap = spec.xAxisName.trim() ? Math.max(16, maxXTickLabelWidth / 2 + 12) : 0;
  const rightExtra = Math.max(MARGIN, xAxisNameWidth + xAxisNameGap + MARGIN);

  const rawPlotLeft = Math.max(MARGIN + 12, leftExtra + MARGIN);
  const plotTop = roundCoordinate(topY + yAxisNameHeight);

  // Coordinate projection functions using normalized 0..1 positions
  const xToPx = (xPos) => roundCoordinate(rawPlotLeft + xPos * plotWidth);
  const yToPx = (yPos) => roundCoordinate(plotTop + (1 - yPos) * plotHeight);

  // True Axis Lines vs Grid Frame
  const showXAxis = !isPaper && calculated.xAxisPosition !== null;
  const showYAxis = !isPaper && calculated.yAxisPosition !== null;

  const xAxisYPx = showXAxis ? yToPx(calculated.xAxisPosition) : roundCoordinate(plotTop + plotHeight);
  const yAxisXPx = showYAxis ? xToPx(calculated.yAxisPosition) : rawPlotLeft;

  const hasOrigin = showXAxis && showYAxis;
  let originZeroLabel = null;
  if (!isPaper && spec.showTickLabels && hasOrigin) {
    originZeroLabel = lineBlock({ text: "0", x: yAxisXPx - 6, top: xAxisYPx + 4, style: styles.tick, color: TEXT_BODY, anchor: "end", measureText });
  }

  let xAxisNameBlock = null;
  let yAxisNameBlock = null;
  if (!isPaper && spec.xAxisName.trim()) {
    xAxisNameBlock = lineBlock({
      text: spec.xAxisName.trim(),
      x: rawPlotLeft + plotWidth + xAxisNameGap,
      top: xAxisYPx - styles.axisName.lineSpacing / 2,
      style: styles.axisName,
      color: TEXT_DARK,
      anchor: "start",
      measureText,
    });
  }
  if (!isPaper && spec.yAxisName.trim()) {
    const bottom = plotTop - styles.tick.lineSpacing / 2 - 8;
    yAxisNameBlock = lineBlock({
      text: spec.yAxisName.trim(),
      x: yAxisXPx,
      top: bottom - styles.axisName.lineSpacing,
      style: styles.axisName,
      color: TEXT_DARK,
      anchor: "middle",
      measureText,
    });
  }

  const createXTickBlocks = (stride) => {
    const zeroIndex = calculated.xTicks.findIndex((tick) => tick.isZero);
    const cadenceIndex = zeroIndex < 0 ? 0 : zeroIndex;
    return calculated.xTicks.flatMap((tick, index) => {
      if (Math.abs(index - cadenceIndex) % stride !== 0 || (hasOrigin && tick.isZero)) return [];
      const block = lineBlock({
        text: tick.label,
        x: xToPx(tick.position),
        top: (showXAxis ? xAxisYPx : plotTop + plotHeight) + 6,
        style: styles.tick,
        color: TEXT_BODY,
        anchor: "middle",
        measureText,
      });
      return [block];
    });
  };
  const createYTickBlocks = (stride) => {
    const zeroIndex = calculated.yTicks.findIndex((tick) => tick.isZero);
    const cadenceIndex = zeroIndex < 0 ? 0 : zeroIndex;
    return calculated.yTicks.flatMap((tick, index) => {
      if (Math.abs(index - cadenceIndex) % stride !== 0 || (hasOrigin && tick.isZero)) return [];
      return [lineBlock({
        text: tick.label,
        x: (showYAxis ? yAxisXPx : rawPlotLeft) - 8,
        top: yToPx(tick.position) - styles.tick.lineSpacing / 2,
        style: styles.tick,
        color: TEXT_BODY,
        anchor: "end",
        measureText,
      })];
    });
  };
  const blocksOverlap = (blocks) => {
    const bounds = blocks.map(getBlockBounds).filter(Boolean);
    for (let first = 0; first < bounds.length; first++) {
      for (let second = first + 1; second < bounds.length; second++) {
        if (checkOverlap(bounds[first], bounds[second], 2)) return true;
      }
    }
    return false;
  };
  const strideChoices = (ticks, createBlocks) => {
    const choices = [];
    for (let stride = 1; stride <= Math.max(1, ticks.length); stride++) {
      const blocks = createBlocks(stride);
      if (!blocksOverlap(blocks)) choices.push({ stride, blocks });
    }
    return choices;
  };

  let xStride = 1;
  let yStride = 1;
  let xTickLabels = [];
  let yTickLabels = [];
  if (!isPaper && spec.showTickLabels) {
    const fixedBlocks = [originZeroLabel, xAxisNameBlock, yAxisNameBlock].filter(Boolean);
    const xChoices = strideChoices(calculated.xTicks, createXTickBlocks);
    const yChoices = strideChoices(calculated.yTicks, createYTickBlocks);
    const pairs = [];
    for (const xChoice of xChoices) {
      for (const yChoice of yChoices) {
        const xCount = xChoice.blocks.length;
        const yCount = yChoice.blocks.length;
        const blocks = [...fixedBlocks, ...xChoice.blocks, ...yChoice.blocks];
        if (!blocksOverlap(blocks)) pairs.push({ xChoice, yChoice, shown: xCount + yCount });
      }
    }
    pairs.sort((first, second) => second.shown - first.shown
      || first.xChoice.stride + first.yChoice.stride - second.xChoice.stride - second.yChoice.stride
      || first.xChoice.stride - second.xChoice.stride
      || first.yChoice.stride - second.yChoice.stride);
    const chosen = pairs[0];
    if (!chosen) throw new TextFitError("Tick labels do not fit. Increase grid step, use smaller text, or hide tick labels.");
    xStride = chosen.xChoice.stride;
    yStride = chosen.yChoice.stride;
    xTickLabels = chosen.xChoice.blocks;
    yTickLabels = chosen.yChoice.blocks;
  }

  // Grid lines
  const xGridLines = calculated.xTicks.map((t) => ({
    x: xToPx(t.position),
    y1: plotTop,
    y2: roundCoordinate(plotTop + plotHeight),
  }));

  const yGridLines = calculated.yTicks.map((t) => ({
    y: yToPx(t.position),
    x1: rawPlotLeft,
    x2: roundCoordinate(rawPlotLeft + plotWidth),
  }));

  const reservedBoxes = [originZeroLabel, xAxisNameBlock, yAxisNameBlock, ...xTickLabels, ...yTickLabels]
    .map(getBlockBounds)
    .filter(Boolean);

  // Helper to update BOTH block.x AND line.x for all text lines
  const shiftBlock = (block, dx) => {
    if (!block) return;
    block.x = roundCoordinate(block.x + dx);
    if (block.lines) {
      block.lines.forEach((line) => {
        line.x = roundCoordinate(line.x + dx);
      });
    }
  };

  // Plotted Points & Obstacle-Based Candidate Placement
  const pointDots = [];
  const allDotBoxes = [];
  const pointLabels = [];
  const placedPointLabelBoxes = [];
  let connectPath = "";

  if (!isPaper && calculated.points.length > 0) {
    // 1. Precompute ALL dot obstacles (including unnamed points!)
    calculated.points.forEach((pt) => {
      const cx = xToPx(pt.xPosition);
      const cy = yToPx(pt.yPosition);
      allDotBoxes.push({ left: cx - 7, right: cx + 7, top: cy - 7, bottom: cy + 7 });
      pointDots.push({
        cx,
        cy,
        r: 5,
        fill: spec.colors[0],
        stroke: PAPER,
        strokeWidth: 2,
      });
    });

    if (spec.connectPoints && calculated.points.length >= 2) {
      connectPath = calculated.points
        .map((pt, i) => `${i === 0 ? "M" : "L"} ${xToPx(pt.xPosition)} ${yToPx(pt.yPosition)}`)
        .join(" ");
    }

    // 2. Place point labels avoiding all obstacles
    calculated.points.forEach((pt) => {
      if (!pt.label.trim()) return;

      const textStr = pt.label.trim();
      const cx = xToPx(pt.xPosition);
      const cy = yToPx(pt.yPosition);
      const dummy = textBlock({ text: textStr, x: 0, top: 0, maxWidth: 140, style: styles.point, color: TEXT_DARK, anchor: "start", measureText });

      const candidates = [
        { x: cx + 8, top: cy - dummy.height - 4, anchor: "start" }, // Top-Right
        { x: cx - 8, top: cy - dummy.height - 4, anchor: "end" },   // Top-Left
        { x: cx + 8, top: cy + 4, anchor: "start" },                // Bottom-Right
        { x: cx - 8, top: cy + 4, anchor: "end" },                  // Bottom-Left
        { x: cx, top: cy - dummy.height - 6, anchor: "middle" },   // Top-Center
        { x: cx, top: cy + 6, anchor: "middle" },                  // Bottom-Center
        { x: cx + 8, top: cy - dummy.height / 2, anchor: "start" }, // Mid-Right
        { x: cx - 8, top: cy - dummy.height / 2, anchor: "end" },   // Mid-Left
        { x: cx + 12, top: cy - dummy.height - 8, anchor: "start" },
        { x: cx - 12, top: cy - dummy.height - 8, anchor: "end" },
        { x: cx + 12, top: cy + 8, anchor: "start" },
        { x: cx - 12, top: cy + 8, anchor: "end" },
      ];

      let chosenBlock = null;

      for (const cand of candidates) {
        const block = textBlock({ text: textStr, x: cand.x, top: cand.top, maxWidth: 140, style: styles.point, color: TEXT_DARK, anchor: cand.anchor, measureText });
        const b = getBlockBounds(block);

        let collides = false;
        // Check plot bounds with generous margin for labels around edges
        if (b.left < rawPlotLeft - 32 || b.right > rawPlotLeft + plotWidth + 32 || b.top < plotTop - 32 || b.bottom > plotTop + plotHeight + 32) {
          collides = true;
        }
        // Check collision with any dot
        if (!collides && allDotBoxes.some((dot) => checkOverlap(b, dot, 0))) {
          collides = true;
        }
        // Check collision with reserved axis/tick/title labels
        if (!collides && reservedBoxes.some((r) => checkOverlap(b, r, 2))) {
          collides = true;
        }
        // Check collision with previously placed point labels
        if (!collides && placedPointLabelBoxes.some((p) => checkOverlap(b, p, 2))) {
          collides = true;
        }

        if (!collides) {
          chosenBlock = block;
          placedPointLabelBoxes.push(b);
          break;
        }
      }

      if (!chosenBlock) {
        throw new TextFitError(`Point label "${textStr}" could not be placed without overlap.`);
      }

      pointLabels.push(chosenBlock);
    });
  }

  // Structure Centering & Outer Bounds Shift
  const allLabelBoxes = [...reservedBoxes, ...placedPointLabelBoxes].filter(Boolean);
  const minLabelLeft = allLabelBoxes.length ? Math.min(...allLabelBoxes.map((b) => b.left)) : rawPlotLeft;
  const maxLabelRight = allLabelBoxes.length ? Math.max(...allLabelBoxes.map((b) => b.right)) : rawPlotLeft + plotWidth;

  const totalLeftBound = Math.min(rawPlotLeft - 10, rawPlotLeft - leftExtra, minLabelLeft);
  const totalRightBound = Math.max(rawPlotLeft + plotWidth + 10, rawPlotLeft + plotWidth + rightExtra, maxLabelRight);
  const structureWidth = totalRightBound - totalLeftBound;

  const totalWidth = Math.max(680, Math.ceil(structureWidth + MARGIN * 2));
  const shiftX = roundCoordinate((totalWidth - structureWidth) / 2 - totalLeftBound + rawPlotLeft);
  const plotLeft = shiftX;

  const dx = plotLeft - rawPlotLeft;

  // Apply shiftX (dx) updating BOTH block.x AND line.x for plot-relative elements
  xGridLines.forEach((l) => { l.x = roundCoordinate(l.x + dx); });
  yGridLines.forEach((l) => { l.x1 = roundCoordinate(l.x1 + dx); l.x2 = roundCoordinate(l.x2 + dx); });

  shiftBlock(originZeroLabel, dx);
  xTickLabels.forEach((b) => shiftBlock(b, dx));
  yTickLabels.forEach((b) => shiftBlock(b, dx));
  shiftBlock(xAxisNameBlock, dx);
  shiftBlock(yAxisNameBlock, dx);
  pointDots.forEach((d) => { d.cx = roundCoordinate(d.cx + dx); });
  pointLabels.forEach((b) => shiftBlock(b, dx));

  // SET title block.x AND every line.x = totalWidth/2, don't apply plot translation to title
  if (titleBlock) {
    const cx = roundCoordinate(totalWidth / 2);
    titleBlock.x = cx;
    if (titleBlock.lines) {
      titleBlock.lines.forEach((line) => {
        line.x = cx;
      });
    }
  }

  if (connectPath) {
    connectPath = calculated.points
      .map((pt, i) => `${i === 0 ? "M" : "L"} ${xToPx(pt.xPosition) + dx} ${yToPx(pt.yPosition)}`)
      .join(" ");
  }

  let bottomY = plotTop + plotHeight + (!isPaper && spec.showTickLabels ? 32 : 16);

  const notes = [];
  if (!isPaper && xStride > 1) {
    notes.push(`X-axis tick labels show every ${xStride} marks. Unlabeled marks are still ${calculated.stepLabel} units apart.`);
  }
  if (!isPaper && yStride > 1) {
    notes.push(`Y-axis tick labels show every ${yStride} marks. Unlabeled marks are still ${calculated.stepLabel} units apart.`);
  }

  const footnotes = notes.map((note) => {
    const block = textBlock({ text: note, x: MARGIN, top: bottomY, maxWidth: totalWidth - MARGIN * 2, style: styles.small, color: TEXT_MUTED, anchor: "start", measureText });
    bottomY += block.height + 4;
    return block;
  });

  const credit = lineBlock({ text: CREDIT, x: totalWidth - MARGIN, top: bottomY, style: styles.small, color: TEXT_MUTED, anchor: "end", measureText });
  bottomY += credit.height + 20;

  const totalHeight = roundCoordinate(bottomY);

  return {
    width: totalWidth,
    height: totalHeight,
    background: spec.background === "transparent" ? null : PAPER,
    fontId: spec.font,
    worksheet,
    mode: spec.mode,
    nameDate,
    title: titleBlock,
    grid: {
      left: plotLeft,
      top: plotTop,
      width: plotWidth,
      height: plotHeight,
      xLines: xGridLines,
      yLines: yGridLines,
    },
    axes: {
      show: !isPaper,
      showXAxis,
      showYAxis,
      color: AXIS_LINE,
      gridColor: GRID_LINE,
      xAxisY: xAxisYPx,
      yAxisX: roundCoordinate(yAxisXPx + dx),
      xAxisName: xAxisNameBlock,
      yAxisName: yAxisNameBlock,
      originZero: originZeroLabel,
      xTickLabels,
      yTickLabels,
    },
    points: {
      dots: pointDots,
      labels: pointLabels,
      connectPath,
      color: spec.colors[0],
      lineColor: spec.colors[1] || spec.colors[0],
    },
    footnotes,
    credit,
  };
}
