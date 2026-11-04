import { FONT_IDS, FONT_WEIGHTS, TextFitError, centeredBaseline, roundCoordinate, wrapLines } from "@svgdiagram/diagram/web";
import { calculateNumberLine, parseNumberLineValue } from "./numberLineMath.js";

const TEXT_DARK = "#0f172a";
const TEXT_BODY = "#334155";
const TEXT_MUTED = "#64748b";
const AXIS = "#334155";
const TICK = "#475569";
const GUIDE = "#94a3b8";
const PAPER = "#ffffff";

export const NUMBER_LINE_LIMITS = Object.freeze({
  title: 80,
  value: 64,
  label: 48,
  maxPoints: 12,
  maxIntervals: 4,
});

const PALETTE_COLORS = (point, intervals) => Object.freeze([point, ...intervals]);

export const NUMBER_LINE_PALETTES = Object.freeze([
  { id: "classic", label: "Classic", colors: PALETTE_COLORS("#2563eb", ["#0d9488", "#d97706", "#7c3aed", "#e11d48"]) },
  { id: "emerald", label: "Emerald", colors: PALETTE_COLORS("#059669", ["#0284c7", "#d97706", "#7c3aed", "#e11d48"]) },
  { id: "violet", label: "Violet", colors: PALETTE_COLORS("#7c3aed", ["#db2777", "#0891b2", "#d97706", "#4f46e5"]) },
  { id: "amber", label: "Amber", colors: PALETTE_COLORS("#d97706", ["#2563eb", "#0d9488", "#7c3aed", "#e11d48"]) },
  { id: "gray", label: "Gray", colors: PALETTE_COLORS("#334155", ["#64748b", "#0f766e", "#b45309", "#6d28d9"]) },
].map(Object.freeze));

export const NUMBER_LINE_LABEL_FORMATS = Object.freeze(["auto", "decimal", "fraction"]);
export const NUMBER_LINE_TEXT_SIZES = Object.freeze({ small: 0.9, medium: 1, large: 1.15 });
export const NUMBER_LINE_BACKGROUNDS = Object.freeze(["white", "transparent"]);

const MIN_CANVAS = 680;
const MAX_CANVAS = 1680;
const MARGIN = 40;
const TOP = 24;
const BOTTOM = 20;
const LABEL_GAP = 8;
const MIN_TICK_GAP = 7;
const WRITE_WIDTH = 32;
const POINT_LABEL_WIDTH = 160;
const LANE_H = 26;
const END_R = 5.5;
const END_STROKE = 1.75;
const POINT_R = 5.5;
const POINT_STROKE = 2;
const AXIS_STROKE = 2;
const TICK_STROKE = 1.5;
const CREDIT = "Made with svgdiagram.ai";

const BASE_STYLES = Object.freeze({
  title: { size: 18, weight: 700, lineSpacing: 24 },
  tick: { size: 13, weight: 400, lineSpacing: 17 },
  point: { size: 12, weight: 700, lineSpacing: 16 },
  caption: { size: 11, weight: 400, lineSpacing: 15 },
  small: { size: 11, weight: 400, lineSpacing: 15 },
  worksheet: { size: 12, weight: 700, lineSpacing: 16 },
});

const even = (value) => Math.ceil(value / 2) * 2;
const ordinal = (value) => {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
};
const measuredWeight = (weight) => (weight >= 600 ? FONT_WEIGHTS.bold : FONT_WEIGHTS.regular);
const scaled = (style, factor) => {
  const size = Math.round(style.size * factor * 2) / 2;
  const lineSpacing = Math.max(size + 2, Math.round(style.lineSpacing * factor));
  return { size, weight: style.weight, lineSpacing };
};
const widthOf = (text, style, measureText) => measureText(text, { size: style.size, weight: measuredWeight(style.weight) });

const pointOf = (point) => ({
  value: typeof point?.value === "string" ? point.value.slice(0, NUMBER_LINE_LIMITS.value) : "",
  label: typeof point?.label === "string" ? point.label.slice(0, NUMBER_LINE_LIMITS.label) : "",
});

const intervalOf = (interval) => ({
  from: typeof interval?.from === "string" ? interval.from.slice(0, NUMBER_LINE_LIMITS.value) : "",
  to: typeof interval?.to === "string" ? interval.to.slice(0, NUMBER_LINE_LIMITS.value) : "",
  startClosed: interval?.startClosed !== false,
  endClosed: interval?.endClosed !== false,
});

const colorsOf = (colors) => {
  const fallback = NUMBER_LINE_PALETTES[0].colors;
  if (!Array.isArray(colors) || colors.length < fallback.length) return [...fallback];
  const next = colors.slice(0, fallback.length);
  if (next.some((color) => typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color))) return [...fallback];
  return next;
};

const lineSpec = ({
  title = "",
  min = "0",
  max = "10",
  step = "1",
  labelFormat = "auto",
  points = [],
  intervals = [],
  colors = NUMBER_LINE_PALETTES[0].colors,
  textSize = "medium",
  font = "inter",
  background = "white",
  worksheet = false,
} = {}) => ({
  title,
  min,
  max,
  step,
  labelFormat,
  points: points.map(pointOf),
  intervals: intervals.map(intervalOf),
  colors: colorsOf(colors),
  textSize,
  font,
  background,
  worksheet: Boolean(worksheet),
});

const specimen = (slug, spec) => ({ slug, title: spec.title || "Number line", line: lineSpec(spec) });

export const DEFAULT_NUMBER_LINE = lineSpec({
  title: "Whole numbers",
  min: "0",
  max: "10",
  step: "1",
  points: [{ value: "6", label: "Six" }],
});

export const NUMBER_LINE_EXAMPLES = Object.freeze([
  specimen("whole", DEFAULT_NUMBER_LINE),
  specimen("negative", {
    title: "Negative numbers",
    min: "-8",
    max: "3",
    step: "1",
    points: [{ value: "-2", label: "Marked" }],
  }),
  specimen("fractions", {
    title: "Fractions and mixed numbers",
    min: "0",
    max: "2",
    step: "1/2",
    labelFormat: "fraction",
    points: [{ value: "1 1/2", label: "One and a half" }],
  }),
  specimen("intervals", {
    title: "Open and closed intervals",
    min: "0",
    max: "8",
    step: "1",
    intervals: [
      { from: "1", to: "4", startClosed: true, endClosed: true },
      { from: "3", to: "6", startClosed: false, endClosed: true },
    ],
  }),
  specimen("twos", {
    title: "Counting by twos",
    min: "-3",
    max: "9",
    step: "2",
    points: [{ value: "4", label: "" }],
  }),
].map(Object.freeze));

const blank = (spec) => lineSpec({
  colors: NUMBER_LINE_PALETTES[4].colors,
  points: [],
  intervals: [],
  worksheet: true,
  ...spec,
  worksheet: true,
});

export const NUMBER_LINE_BLANKS = Object.freeze([
  specimen("blank", blank({
    title: "Number line worksheet",
    min: "0",
    max: "10",
    step: "1",
  })),
  specimen("negative-worksheet", blank({
    title: "Negative number line worksheet",
    min: "-5",
    max: "5",
    step: "1",
  })),
  specimen("fourths-worksheet", blank({
    title: "Label by fourths from 0 to 1",
    min: "0",
    max: "1",
    step: "1/4",
    labelFormat: "fraction",
  })),
].map(Object.freeze));

export const NUMBER_LINE_FIGURES = Object.freeze([
  specimen("parts", {
    title: "Parts of a number line",
    min: "0",
    max: "6",
    step: "1",
    points: [{ value: "2", label: "Point" }],
    intervals: [{ from: "4", to: "6", startClosed: true, endClosed: false }],
  }),
].map(Object.freeze));

export const numberLineBySlug = (slug) => [...NUMBER_LINE_EXAMPLES, ...NUMBER_LINE_BLANKS, ...NUMBER_LINE_FIGURES].find((item) => item.slug === slug);
export const numberLineImage = (slug) => `/images/tools/number-line-${slug}.svg`;

export function normalizeNumberLine(raw = {}) {
  const defaults = DEFAULT_NUMBER_LINE;
  return lineSpec({
    title: typeof raw.title === "string" ? raw.title.slice(0, NUMBER_LINE_LIMITS.title) : defaults.title,
    min: typeof raw.min === "string" ? raw.min.slice(0, NUMBER_LINE_LIMITS.value) : defaults.min,
    max: typeof raw.max === "string" ? raw.max.slice(0, NUMBER_LINE_LIMITS.value) : defaults.max,
    step: typeof raw.step === "string" ? raw.step.slice(0, NUMBER_LINE_LIMITS.value) : defaults.step,
    labelFormat: NUMBER_LINE_LABEL_FORMATS.includes(raw.labelFormat) ? raw.labelFormat : defaults.labelFormat,
    points: Array.isArray(raw.points) ? raw.points.slice(0, 20).map(pointOf) : defaults.points,
    intervals: Array.isArray(raw.intervals) ? raw.intervals.slice(0, 8).map(intervalOf) : defaults.intervals,
    colors: colorsOf(raw.colors),
    textSize: Object.keys(NUMBER_LINE_TEXT_SIZES).includes(raw.textSize) ? raw.textSize : defaults.textSize,
    font: FONT_IDS.includes(raw.font) ? raw.font : defaults.font,
    background: NUMBER_LINE_BACKGROUNDS.includes(raw.background) ? raw.background : defaults.background,
    worksheet: Boolean(raw.worksheet),
  });
}

// The calculation input. Empty custom labels are omitted so the math module supplies the formatted value.
// Worksheet mode draws the range only; filled points and intervals would be answers.
export function numberLineCalculationConfig(spec) {
  const worksheet = Boolean(spec.worksheet);
  return {
    min: spec.min,
    max: spec.max,
    step: spec.step,
    labelFormat: spec.labelFormat,
    points: worksheet ? [] : spec.points.map((point) => ({
      value: point.value,
      ...(point.label.trim() ? { label: point.label.trim() } : {}),
    })),
    intervals: worksheet ? [] : spec.intervals.map((interval) => ({
      from: interval.from,
      to: interval.to,
      startClosed: interval.startClosed !== false,
      endClosed: interval.endClosed !== false,
    })),
  };
}

function displayOf(canonicalValue, format) {
  const parsed = parseNumberLineValue(canonicalValue);
  if (format === "fraction") return parsed.fraction;
  if (format === "decimal") return parsed.decimal;
  const roundTrip = parseNumberLineValue(parsed.decimal);
  return roundTrip.value === parsed.value ? parsed.decimal : parsed.fraction;
}

function labelWasRounded(canonicalValue, label) {
  if (!canonicalValue.includes("/")) return false;
  try {
    return parseNumberLineValue(label).value !== canonicalValue;
  } catch {
    return false;
  }
}

function textBlock({ text, x, top, maxWidth, style, color, anchor, measureText }) {
  const wrapStyle = { size: style.size, weight: measuredWeight(style.weight), lineSpacing: style.lineSpacing };
  let wrapped;
  try {
    wrapped = wrapLines(text, { style: wrapStyle, maxWidth, measureText });
  } catch (error) {
    if (error instanceof TextFitError) throw new TextFitError(`A word in "${text}" is too long to fit. Shorten it or add a space.`);
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
    lines: [{ text, x: roundCoordinate(x), y: centeredBaseline(top, style) }],
  };
}

function guide(x1, x2, y) {
  return { x1: roundCoordinate(x1), x2: roundCoordinate(x2), y: roundCoordinate(y), stroke: GUIDE, strokeWidth: 1.25, dash: "4 3" };
}

function labeledIndexes(count, stride) {
  const indexes = [];
  for (let index = 0; index < count; index += stride) indexes.push(index);
  if (indexes[indexes.length - 1] !== count - 1) indexes.push(count - 1);
  return indexes;
}

// Width so centered labels on the chosen ticks stay LABEL_GAP apart, and so consecutive ticks stay visually separate.
// A tick-count limit is not this function: callers still have to thin or reject when the width will not fit.
function axisLengthFor(ticks, indexes, widths) {
  let length = 160;
  for (let index = 1; index < indexes.length; index += 1) {
    const left = indexes[index - 1];
    const right = indexes[index];
    const span = ticks[right].position - ticks[left].position;
    if (span <= 0) continue;
    const need = widths[left] / 2 + widths[right] / 2 + LABEL_GAP;
    length = Math.max(length, need / span);
  }
  for (let index = 1; index < ticks.length; index += 1) {
    const span = ticks[index].position - ticks[index - 1].position;
    if (span > 0) length = Math.max(length, MIN_TICK_GAP / span);
  }
  return length;
}

function fitTickLabels(ticks, widths, side, { allowThinning }) {
  const maxAxis = MAX_CANVAS - side * 2;
  const strides = allowThinning ? Array.from({ length: Math.max(ticks.length - 1, 1) }, (_, index) => index + 1) : [1];
  for (const stride of strides) {
    const indexes = labeledIndexes(ticks.length, stride);
    const length = axisLengthFor(ticks, indexes, widths);
    if (length <= maxAxis) return { stride, length, indexes };
  }
  if (allowThinning) {
    throw new TextFitError("Tick labels are too long to fit. Use a larger step or a shorter range.");
  }
  throw new TextFitError("These ticks are too close for writing lines. Increase the step or shorten the range.");
}

function closurePhrase(interval) {
  if (interval.startClosed && interval.endClosed) return "both ends included";
  if (!interval.startClosed && !interval.endClosed) return "neither end included";
  if (interval.startClosed) return "start included, end not";
  return "start not included, end included";
}

function assignLanes(intervals) {
  const lanes = [];
  return intervals.map((interval, index) => {
    let lane = 0;
    while (lanes[lane]?.some((other) => interval.start <= other.end && other.start <= interval.end)) lane += 1;
    lanes[lane] ||= [];
    lanes[lane].push(interval);
    return { ...interval, index, lane };
  });
}

function requireComplete(spec) {
  if (!spec.worksheet) {
    spec.points.forEach((point, index) => {
      if (!point.value.trim()) throw new TextFitError(`Point ${index + 1} needs a value.`);
    });
    spec.intervals.forEach((interval, index) => {
      if (!interval.from.trim() || !interval.to.trim()) throw new TextFitError(`Interval ${index + 1} needs a start and an end.`);
    });
  }
}

function blockBounds(block) {
  if (!block) return null;
  const left = block.anchor === "middle" ? block.x - block.width / 2 : block.anchor === "end" ? block.x - block.width : block.x;
  return { left, right: left + block.width, top: block.top, bottom: block.top + block.height };
}

function assertInside(width, height, blocks) {
  for (const block of blocks) {
    const bounds = blockBounds(block);
    if (!bounds) continue;
    if (bounds.left < -0.5 || bounds.right > width + 0.5 || bounds.top < -0.5 || bounds.bottom > height + 0.5) {
      throw new TextFitError("This number line does not fit in its drawing. Shorten a label or use a larger step.");
    }
  }
}

function assertSeparated(blocks) {
  const boxes = blocks.map(blockBounds).filter(Boolean);
  for (let left = 0; left < boxes.length; left += 1) {
    for (let right = left + 1; right < boxes.length; right += 1) {
      const a = boxes[left];
      const b = boxes[right];
      const overlaps = a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
      if (overlaps) throw new TextFitError("Tick labels would overlap. Use a larger step or a shorter range.");
    }
  }
}

// A horizontal number line. Tick positions come from calculateNumberLine; this function only measures and places.
// Labels that cannot sit side by side widen the line, then drop to a regular stride that the footnote states.
export function layoutNumberLine(spec, measureText) {
  if (typeof measureText !== "function") throw new TypeError("layoutNumberLine requires measureText");
  requireComplete(spec);
  let calculated;
  try {
    calculated = calculateNumberLine(numberLineCalculationConfig(spec));
  } catch (error) {
    throw new TextFitError(error instanceof Error ? error.message : "The number line could not be calculated.");
  }

  const worksheet = Boolean(spec.worksheet);
  const lastTick = calculated.ticks[calculated.ticks.length - 1];
  if (worksheet && lastTick.value !== calculated.max) {
    throw new TextFitError("A worksheet needs the maximum to land on a tick. Change the maximum or the step.");
  }

  const factor = NUMBER_LINE_TEXT_SIZES[spec.textSize] || 1;
  const styles = Object.fromEntries(Object.entries(BASE_STYLES).map(([name, style]) => [name, scaled(style, factor)]));
  const format = calculated.labelFormat;
  const stepLabel = displayOf(calculated.step, format);
  const maxLabel = displayOf(calculated.max, format);

  const labelWidths = calculated.ticks.map((tick) => (worksheet ? WRITE_WIDTH : widthOf(tick.label, styles.tick, measureText)));
  const firstHalf = labelWidths[0] / 2;
  const lastHalf = labelWidths[labelWidths.length - 1] / 2;
  const side = Math.max(MARGIN, Math.ceil(firstHalf) + 12, Math.ceil(lastHalf) + 12, END_R + END_STROKE + 8);
  const fitted = fitTickLabels(calculated.ticks, labelWidths, side, { allowThinning: !worksheet });
  const width = even(Math.min(MAX_CANVAS, Math.max(MIN_CANVAS, side * 2 + fitted.length)));
  const axisX = side;
  const axisLength = width - side * 2;
  const xAt = (position) => roundCoordinate(axisX + position * axisLength);
  const labeled = new Set(fitted.indexes);
  const labeledValues = new Set(fitted.indexes.map((index) => calculated.ticks[index].value));

  const customLabels = worksheet ? [] : spec.points.map((point) => point.label.trim());
  const pointEntries = calculated.points.map((point, index) => {
    const custom = customLabels[index];
    const onLabeledTick = labeledValues.has(point.value);
    const drawnLabel = custom || (onLabeledTick ? "" : point.label);
    return { ...point, drawnLabel };
  });

  const measuredPoints = pointEntries.map((point) => {
    const x = xAt(point.position);
    if (!point.drawnLabel) return { ...point, x, anchorX: x, measured: null, row: 0 };
    const measured = textBlock({
      text: point.drawnLabel,
      x: 0,
      top: 0,
      maxWidth: Math.min(POINT_LABEL_WIDTH, width - 24),
      style: styles.point,
      color: TEXT_DARK,
      anchor: "middle",
      measureText,
    });
    const half = measured.width / 2;
    const anchorX = Math.min(Math.max(x, 12 + half), width - 12 - half);
    return { ...point, x, anchorX, measured, row: 0 };
  });
  const rows = [];
  measuredPoints.forEach((point) => {
    if (!point.measured) return;
    const left = point.anchorX - point.measured.width / 2 - 4;
    const right = point.anchorX + point.measured.width / 2 + 4;
    let row = 0;
    while (rows[row]?.some((box) => left < box.right && right > box.left)) row += 1;
    rows[row] ||= [];
    rows[row].push({ left, right, height: point.measured.height });
    point.row = row;
  });
  const rowHeights = rows.map((row) => Math.max(...row.map((box) => box.height)));
  const pointStackHeight = rowHeights.reduce((sum, height, index) => sum + height + (index ? 4 : 0), 0);

  const laneIntervals = worksheet ? [] : assignLanes(calculated.intervals);
  const laneCount = laneIntervals.reduce((max, interval) => Math.max(max, interval.lane + 1), 0);

  let y = TOP;
  let nameDate = null;
  if (worksheet) {
    const fieldWidth = (width - MARGIN * 2 - 40) / 2;
    const fields = ["Name:", "Date:"].map((label, index) => {
      const x = MARGIN + index * (fieldWidth + 40);
      const labelWidth = widthOf(label, styles.worksheet, measureText);
      const block = lineBlock({ text: label, x, top: y, style: styles.worksheet, color: TEXT_BODY, anchor: "start", measureText });
      return {
        label: block,
        line: guide(x + labelWidth + 8, Math.max(x + fieldWidth, x + labelWidth + 32), block.lines[0].y + 2),
      };
    });
    nameDate = { fields };
    y += styles.worksheet.lineSpacing + 16;
  }

  const title = spec.title.trim()
    ? textBlock({ text: spec.title.trim(), x: width / 2, top: y, maxWidth: width - 80, style: styles.title, color: TEXT_DARK, anchor: "middle", measureText })
    : null;
  if (title) y += title.height + 12;

  const labelsTop = y;
  if (pointStackHeight) y += pointStackHeight + 14;
  const intervalsTop = y;
  if (laneCount) y += laneCount * LANE_H + 8;
  else y += 4;
  const axisY = y;
  const tickDrop = worksheet ? 7 : 9;
  const labelTop = axisY + tickDrop + 4;

  const placedPoints = measuredPoints.map((point) => {
    if (!point.measured) {
      return {
        cx: point.x,
        cy: roundCoordinate(axisY),
        r: POINT_R,
        fill: spec.colors[0],
        stroke: PAPER,
        strokeWidth: POINT_STROKE,
        label: null,
      };
    }
    let rowTop = labelsTop;
    for (let row = rowHeights.length - 1; row > point.row; row -= 1) rowTop += rowHeights[row] + 4;
    const label = textBlock({
      text: point.drawnLabel,
      x: point.anchorX,
      top: rowTop,
      maxWidth: Math.min(POINT_LABEL_WIDTH, width - 24),
      style: styles.point,
      color: TEXT_DARK,
      anchor: "middle",
      measureText,
    });
    return {
      cx: point.x,
      cy: roundCoordinate(axisY),
      r: POINT_R,
      fill: spec.colors[0],
      stroke: PAPER,
      strokeWidth: POINT_STROKE,
      label,
    };
  });

  const placedIntervals = laneIntervals.map((interval) => {
    const color = spec.colors[1 + (interval.index % 4)];
    const cy = intervalsTop + interval.lane * LANE_H + LANE_H / 2;
    const x1 = xAt(interval.start);
    const x2 = xAt(interval.end);
    const barWidth = Math.max(0, x2 - x1 - END_R * 2);
    const circle = (x, closed) => ({
      cx: x,
      cy: roundCoordinate(cy),
      r: END_R,
      fill: closed ? color : PAPER,
      stroke: color,
      strokeWidth: END_STROKE,
    });
    return {
      color,
      bar: {
        x: roundCoordinate(x1 + END_R),
        y: roundCoordinate(cy - 2),
        width: roundCoordinate(barWidth),
        height: 4,
        fill: color,
      },
      start: circle(x1, interval.startClosed),
      end: circle(x2, interval.endClosed),
      caption: `${displayOf(interval.from, format)} to ${displayOf(interval.to, format)}, ${closurePhrase(interval)}`,
    };
  });

  const ticks = calculated.ticks.map((tick, index) => {
    const x = xAt(tick.position);
    const showLabel = !worksheet && labeled.has(index);
    const drop = showLabel || worksheet ? tickDrop : 5;
    return {
      x,
      y1: roundCoordinate(axisY),
      y2: roundCoordinate(axisY + drop),
      stroke: TICK,
      strokeWidth: TICK_STROKE,
      label: showLabel ? lineBlock({ text: tick.label, x, top: labelTop, style: styles.tick, color: TEXT_BODY, anchor: "middle", measureText }) : null,
      guide: worksheet ? guide(x - WRITE_WIDTH / 2, x + WRITE_WIDTH / 2, axisY + 22) : null,
    };
  });

  y = worksheet ? axisY + 32 : labelTop + styles.tick.lineSpacing;
  y += 8;

  const legend = [];
  if (placedIntervals.length) {
    const maxWidth = width - MARGIN * 2;
    let cursorX = MARGIN;
    let rowTop = y;
    let rowHeight = styles.caption.lineSpacing;
    const pending = [];
    const flush = () => {
      pending.forEach((entry) => {
        entry.swatch.y = roundCoordinate(rowTop + (rowHeight - 10) / 2);
        entry.label = textBlock({
          text: entry.caption,
          x: entry.labelX,
          top: rowTop + (rowHeight - entry.labelHeight) / 2,
          maxWidth: maxWidth - 16,
          style: styles.caption,
          color: TEXT_BODY,
          anchor: "start",
          measureText,
        });
        legend.push({ swatch: entry.swatch, label: entry.label });
      });
      pending.length = 0;
      y = rowTop + rowHeight + 6;
    };
    placedIntervals.forEach((interval) => {
      const measured = textBlock({
        text: interval.caption,
        x: 0,
        top: 0,
        maxWidth: maxWidth - 16,
        style: styles.caption,
        color: TEXT_BODY,
        anchor: "start",
        measureText,
      });
      const itemWidth = 16 + measured.width;
      if (pending.length && cursorX + itemWidth > width - MARGIN) {
        flush();
        cursorX = MARGIN;
        rowTop = y;
        rowHeight = styles.caption.lineSpacing;
      }
      pending.push({
        caption: interval.caption,
        labelX: cursorX + 16,
        labelHeight: measured.height,
        swatch: { x: roundCoordinate(cursorX), y: 0, width: 10, height: 10, fill: interval.color, rx: 2 },
      });
      rowHeight = Math.max(rowHeight, measured.height);
      cursorX += itemWidth + 16;
    });
    if (pending.length) flush();
    y += 4;
  }

  const notes = [];
  if (!worksheet && fitted.stride > 1) {
    const lastOnStride = (calculated.ticks.length - 1) % fitted.stride === 0;
    notes.push(lastOnStride
      ? `Tick labels show every ${ordinal(fitted.stride)} mark. Unlabeled marks are still ${stepLabel} apart.`
      : `Tick labels show every ${ordinal(fitted.stride)} mark, and the last tick. Unlabeled marks are still ${stepLabel} apart.`);
  }
  if (!worksheet && lastTick.value !== calculated.max) {
    notes.push(`The line ends at ${maxLabel}. The last tick is ${lastTick.label}.`);
  }
  if (!worksheet && format === "decimal" && calculated.ticks.some((tick) => labelWasRounded(tick.value, tick.label))) {
    notes.push("A decimal label is rounded to 6 places when the value does not terminate.");
  }
  if (placedIntervals.length) notes.push("A filled circle includes that number. An open circle does not.");

  const footnotes = notes.map((note) => {
    const block = textBlock({ text: note, x: MARGIN, top: y, maxWidth: width - MARGIN * 2, style: styles.small, color: TEXT_MUTED, anchor: "start", measureText });
    y += block.height + 4;
    return block;
  });
  if (footnotes.length) y += 4;

  const credit = lineBlock({ text: CREDIT, x: width - MARGIN, top: y, style: styles.small, color: TEXT_MUTED, anchor: "end", measureText });
  y += credit.height + BOTTOM;
  const height = even(y);

  const tickLabels = ticks.map((tick) => tick.label).filter(Boolean);
  assertSeparated(tickLabels);
  assertInside(width, height, [
    title,
    credit,
    ...tickLabels,
    ...placedPoints.map((point) => point.label),
    ...legend.map((item) => item.label),
    ...footnotes,
    ...(nameDate?.fields.map((field) => field.label) || []),
  ]);

  return {
    width,
    height,
    background: spec.background === "transparent" ? null : PAPER,
    fontId: spec.font,
    worksheet,
    nameDate,
    title,
    axis: {
      x1: roundCoordinate(axisX),
      x2: roundCoordinate(axisX + axisLength),
      y: roundCoordinate(axisY),
      stroke: AXIS,
      strokeWidth: AXIS_STROKE,
      ticks,
    },
    points: placedPoints,
    intervals: placedIntervals,
    legend,
    footnotes,
    credit,
  };
}
