import { FONT_IDS, FONT_WEIGHTS, TextFitError, centeredBaseline, roundCoordinate, wrapLines } from "@svgdiagram/diagram/web";
import { calculateDotPlot } from "./dotPlotMath.js";

const TEXT_DARK = "#0f172a";
const TEXT_BODY = "#334155";
const TEXT_MUTED = "#64748b";
const AXIS = "#334155";
const TICK = "#475569";
const GUIDE = "#94a3b8";
const PAPER = "#ffffff";

export const DOT_PLOT_LIMITS = Object.freeze({
  title: 80,
  xLabel: 64,
  value: 64,
  maxObservations: 200,
  maxTicks: 101,
});

const PALETTE_COLORS = (primary) => Object.freeze([primary]);

export const DOT_PLOT_PALETTES = Object.freeze([
  { id: "classic", label: "Classic", colors: PALETTE_COLORS("#2563eb") },
  { id: "emerald", label: "Emerald", colors: PALETTE_COLORS("#059669") },
  { id: "violet", label: "Violet", colors: PALETTE_COLORS("#7c3aed") },
  { id: "amber", label: "Amber", colors: PALETTE_COLORS("#d97706") },
  { id: "gray", label: "Gray", colors: PALETTE_COLORS("#334155") },
  { id: "crimson", label: "Crimson", colors: PALETTE_COLORS("#e11d48") },
].map(Object.freeze));

export const DOT_PLOT_TEXT_SIZES = Object.freeze({ small: 0.9, medium: 1, large: 1.15 });
export const DOT_PLOT_BACKGROUNDS = Object.freeze(["white", "transparent"]);

const MIN_CANVAS = 680;
const MAX_CANVAS = 1680;
const MARGIN = 40;
const TOP = 24;
const BOTTOM = 20;
const LABEL_GAP = 8;
const MIN_TICK_GAP = 7;
const WRITE_WIDTH = 32;
const AXIS_STROKE = 2;
const TICK_STROKE = 1.5;
const CREDIT = "Made with svgdiagram.ai";

const BASE_STYLES = Object.freeze({
  title: { size: 18, weight: 700, lineSpacing: 24 },
  xLabel: { size: 13, weight: 700, lineSpacing: 18 },
  tick: { size: 13, weight: 400, lineSpacing: 17 },
  summary: { size: 11, weight: 400, lineSpacing: 15 },
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

const colorsOf = (colors) => {
  const fallback = DOT_PLOT_PALETTES[0].colors;
  if (!Array.isArray(colors) || colors.length < fallback.length) return [...fallback];
  const next = colors.slice(0, fallback.length);
  if (next.some((color) => typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color))) return [...fallback];
  return next;
};

const plotSpec = ({
  title = "",
  xLabel = "",
  data = "",
  min = "",
  max = "",
  step = "",
  colors = DOT_PLOT_PALETTES[0].colors,
  textSize = "medium",
  font = "inter",
  background = "white",
  worksheet = false,
} = {}) => ({
  title,
  xLabel,
  data,
  min,
  max,
  step,
  colors: colorsOf(colors),
  textSize,
  font,
  background,
  worksheet: Boolean(worksheet),
});

const specimen = (slug, spec) => ({ slug, title: spec.title || "Dot plot", plot: plotSpec(spec) });

export const DEFAULT_DOT_PLOT = plotSpec({
  title: "Books read",
  xLabel: "Books per student",
  data: "0, 1, 1, 2, 2, 2, 3, 3, 4, 5",
  min: "",
  max: "",
  step: "",
});

export const DOT_PLOT_EXAMPLES = Object.freeze([
  specimen("books", DEFAULT_DOT_PLOT),
  specimen("temperatures", {
    title: "Daily low temperatures (°C)",
    xLabel: "Temperature (°C)",
    data: "-4, -3, -3, -2, -2, -2, -1, 0, 0, 1, 2",
    min: "-5",
    max: "3",
    step: "1",
  }),
  specimen("lengths", {
    title: "Seedling growth (cm)",
    xLabel: "Height (cm)",
    data: "1.2, 1.5, 1.5, 1.8, 2.0, 2.0, 2.0, 2.3, 2.5",
    min: "1.0",
    max: "3.0",
    step: "0.5",
  }),
  specimen("scores", {
    title: "Math quiz scores",
    xLabel: "Score (out of 10)",
    data: "5, 6, 7, 7, 8, 8, 8, 8, 9, 9, 10, 10",
    min: "4",
    max: "10",
    step: "1",
  }),
  specimen("pets", {
    title: "Pets per household",
    xLabel: "Number of pets",
    data: "0, 0, 0, 1, 1, 1, 1, 2, 2, 3, 4",
    min: "0",
    max: "5",
    step: "1",
  }),
].map(Object.freeze));

const blank = (spec) => plotSpec({
  colors: DOT_PLOT_PALETTES[4].colors,
  data: "",
  worksheet: true,
  ...spec,
  worksheet: true,
});

export const DOT_PLOT_BLANKS = Object.freeze([
  specimen("blank", blank({
    title: "Dot plot worksheet",
    xLabel: "Value",
    min: "0",
    max: "10",
    step: "1",
  })),
  specimen("negative-worksheet", blank({
    title: "Negative numbers dot plot",
    xLabel: "Temperature (°C)",
    min: "-5",
    max: "5",
    step: "1",
  })),
  specimen("decimal-worksheet", blank({
    title: "Measurement dot plot worksheet",
    xLabel: "Length (cm)",
    min: "0",
    max: "5",
    step: "0.5",
  })),
].map(Object.freeze));

export const DOT_PLOT_FIGURES = Object.freeze([
  specimen("parts", {
    title: "Parts of a dot plot",
    xLabel: "Number of items",
    data: "1, 2, 2, 3, 3, 3, 4, 5",
    min: "0",
    max: "6",
    step: "1",
  }),
].map(Object.freeze));

export const dotPlotBySlug = (slug) => [...DOT_PLOT_EXAMPLES, ...DOT_PLOT_BLANKS, ...DOT_PLOT_FIGURES].find((item) => item.slug === slug);
export const dotPlotImage = (slug) => `/images/tools/dot-plot-${slug}.svg`;

export function normalizeDotPlot(raw = {}) {
  const defaults = DEFAULT_DOT_PLOT;
  return plotSpec({
    title: typeof raw.title === "string" ? raw.title.slice(0, DOT_PLOT_LIMITS.title) : defaults.title,
    xLabel: typeof raw.xLabel === "string" ? raw.xLabel.slice(0, DOT_PLOT_LIMITS.xLabel) : defaults.xLabel,
    data: typeof raw.data === "string" ? raw.data : defaults.data,
    min: typeof raw.min === "string" ? raw.min.slice(0, DOT_PLOT_LIMITS.value) : defaults.min,
    max: typeof raw.max === "string" ? raw.max.slice(0, DOT_PLOT_LIMITS.value) : defaults.max,
    step: typeof raw.step === "string" ? raw.step.slice(0, DOT_PLOT_LIMITS.value) : defaults.step,
    colors: colorsOf(raw.colors),
    textSize: Object.keys(DOT_PLOT_TEXT_SIZES).includes(raw.textSize) ? raw.textSize : defaults.textSize,
    font: FONT_IDS.includes(raw.font) ? raw.font : defaults.font,
    background: DOT_PLOT_BACKGROUNDS.includes(raw.background) ? raw.background : defaults.background,
    worksheet: Boolean(raw.worksheet),
  });
}

export function dotPlotCalculationConfig(spec) {
  const worksheet = Boolean(spec.worksheet);
  let min = spec.min.trim();
  let max = spec.max.trim();
  let step = spec.step.trim();
  let data = spec.data;

  if (worksheet) {
    const needsBounds = !min || !max || isNaN(Number(min)) || isNaN(Number(max));
    if (needsBounds) {
      if (data.trim()) {
        try {
          const autoCalc = calculateDotPlot({ data, min, max, step, blank: false });
          min = min || String(autoCalc.min);
          max = max || String(autoCalc.max);
          if (!step && autoCalc.step) {
            const stepStr = String(autoCalc.step);
            const decimals = stepStr.includes(".") ? stepStr.split(".")[1].length : 0;
            if (decimals <= 6) step = stepStr;
          }
        } catch {
          min = min || "0";
          max = max || "10";
          step = step || "1";
        }
      } else {
        min = min || "0";
        max = max || "10";
        step = step || "1";
      }
    }
    data = "";
  }

  return {
    data,
    min,
    max,
    step,
    blank: worksheet,
  };
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

function axisLengthFor(ticks, indexes, widths, groups, dotDiameter) {
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
  if (groups && groups.length > 1) {
    for (let index = 1; index < groups.length; index += 1) {
      const span = groups[index].position - groups[index - 1].position;
      if (span > 0) length = Math.max(length, dotDiameter / span);
    }
  }
  return length;
}

function fitTickLabels(ticks, widths, side, { allowThinning, groups, dotDiameter }) {
  const maxAxis = MAX_CANVAS - side * 2;
  const strides = allowThinning ? Array.from({ length: Math.max(ticks.length - 1, 1) }, (_, index) => index + 1) : [1];
  for (const stride of strides) {
    const indexes = labeledIndexes(ticks.length, stride);
    const length = axisLengthFor(ticks, indexes, widths, groups, dotDiameter);
    if (length <= maxAxis) return { stride, length, indexes };
  }
  if (groups && groups.length > 1) {
    throw new TextFitError("Distinct observation values are too close together to draw separate dot stacks within the supported width. Narrower manual axis bounds or fewer distinct values may help.");
  }
  if (allowThinning) {
    throw new TextFitError("Tick labels are too long to fit. Use a larger step or a shorter range.");
  }
  throw new TextFitError("These ticks are too close. Increase the step or shorten the range.");
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
      throw new TextFitError("This dot plot does not fit in its drawing. Shorten a label or adjust step.");
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
      if (overlaps) throw new TextFitError("Tick labels would overlap. Use a larger step or a shorter axis range.");
    }
  }
}

export function layoutDotPlot(spec, measureText) {
  if (typeof measureText !== "function") throw new TypeError("layoutDotPlot requires measureText");
  const worksheet = Boolean(spec.worksheet);
  if (!worksheet && !spec.data.trim()) {
    throw new TextFitError("Enter at least one observation.");
  }

  let calculated;
  try {
    calculated = calculateDotPlot(dotPlotCalculationConfig(spec));
  } catch (error) {
    throw new TextFitError(error instanceof Error ? error.message : "The dot plot could not be calculated.");
  }

  const factor = DOT_PLOT_TEXT_SIZES[spec.textSize] || 1;
  const styles = Object.fromEntries(Object.entries(BASE_STYLES).map(([name, style]) => [name, scaled(style, factor)]));

  const dotRadius = roundCoordinate(6.5 * factor);
  const dotDiameter = dotRadius * 2;
  const dotSpacing = roundCoordinate(dotRadius * 2 + 2.5);

  const labelWidths = calculated.ticks.map((tick) => widthOf(tick.label, styles.tick, measureText));
  const firstHalf = labelWidths[0] / 2;
  const lastHalf = labelWidths[labelWidths.length - 1] / 2;
  const side = Math.max(MARGIN, Math.ceil(firstHalf) + 12, Math.ceil(lastHalf) + 12, 24);
  const fitted = fitTickLabels(calculated.ticks, labelWidths, side, {
    allowThinning: true,
    groups: worksheet ? null : calculated.groups,
    dotDiameter,
  });
  const width = even(Math.min(MAX_CANVAS, Math.max(MIN_CANVAS, side * 2 + fitted.length)));
  const axisX = side;
  const axisLength = width - side * 2;
  const xAt = (position) => roundCoordinate(axisX + position * axisLength);
  const labeled = new Set(fitted.indexes);

  if (!worksheet && calculated.groups.length > 1) {
    for (let i = 1; i < calculated.groups.length; i += 1) {
      const x1 = xAt(calculated.groups[i - 1].position);
      const x2 = xAt(calculated.groups[i].position);
      if (x2 - x1 < dotDiameter - 0.5) {
        throw new TextFitError("Distinct observation values are too close together to draw separate dot stacks within the supported width. Narrower manual axis bounds or fewer distinct values may help.");
      }
    }
  }

  const maxStackCount = worksheet ? 0 : calculated.maxCount;
  const dotsStackHeight = worksheet ? roundCoordinate(5 * dotSpacing + 20) : (maxStackCount > 0 ? roundCoordinate((maxStackCount - 1) * dotSpacing + dotDiameter + 20) : 24);

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

  const dotsAreaTop = y;
  const axisY = roundCoordinate(dotsAreaTop + dotsStackHeight);
  y = axisY;

  const tickDrop = worksheet ? 7 : 9;
  const tickLabelTop = axisY + tickDrop + 4;
  const tickStepDistance = calculated.ticks.length > 1 ? Math.abs(xAt(calculated.ticks[1].position) - xAt(calculated.ticks[0].position)) : WRITE_WIDTH;
  const canFitGuide = worksheet && tickStepDistance >= WRITE_WIDTH - 2;

  const ticks = calculated.ticks.map((tick, index) => {
    const x = xAt(tick.position);
    const showLabel = labeled.has(index);
    const drop = showLabel ? tickDrop : 5;
    return {
      x,
      y1: roundCoordinate(axisY),
      y2: roundCoordinate(axisY + drop),
      stroke: TICK,
      strokeWidth: TICK_STROKE,
      label: showLabel ? lineBlock({ text: tick.label, x, top: tickLabelTop, style: styles.tick, color: TEXT_BODY, anchor: "middle", measureText }) : null,
      guide: canFitGuide ? guide(x - WRITE_WIDTH / 2, x + WRITE_WIDTH / 2, axisY + tickDrop + styles.tick.lineSpacing + 10) : null,
    };
  });

  const hasGuides = worksheet && ticks.some((t) => t.guide);
  let xLabelTop = tickLabelTop + styles.tick.lineSpacing + (hasGuides ? 18 : 6);

  const xLabel = spec.xLabel.trim()
    ? textBlock({ text: spec.xLabel.trim(), x: width / 2, top: xLabelTop, maxWidth: width - 80, style: styles.xLabel, color: TEXT_DARK, anchor: "middle", measureText })
    : null;

  y = xLabel ? xLabelTop + xLabel.height + 12 : xLabelTop + styles.tick.lineSpacing + 8;

  const dots = [];
  if (!worksheet) {
    const dotMarginBottom = 10;
    for (const group of calculated.groups) {
      const gx = xAt(group.position);
      for (let k = 0; k < group.count; k += 1) {
        const cy = roundCoordinate(axisY - dotMarginBottom - dotRadius - k * dotSpacing);
        dots.push({
          cx: gx,
          cy,
          r: dotRadius,
          fill: spec.colors[0],
          stroke: PAPER,
          strokeWidth: 1.25,
        });
      }
    }
  }

  const footnotes = [];
  if (!worksheet && calculated.count > 0) {
    const summaryText = `n = ${calculated.count} observation${calculated.count === 1 ? "" : "s"} across ${calculated.distinctCount} distinct value${calculated.distinctCount === 1 ? "" : "s"}.`;
    const block = textBlock({ text: summaryText, x: MARGIN, top: y, maxWidth: width - MARGIN * 2, style: styles.summary, color: TEXT_MUTED, anchor: "start", measureText });
    footnotes.push(block);
    y += block.height + 4;
  }
  if (!worksheet && fitted.stride > 1) {
    const noteText = `Tick labels show every ${ordinal(fitted.stride)} mark. Unlabeled marks are still ${calculated.step} apart.`;
    const block = textBlock({ text: noteText, x: MARGIN, top: y, maxWidth: width - MARGIN * 2, style: styles.small, color: TEXT_MUTED, anchor: "start", measureText });
    footnotes.push(block);
    y += block.height + 4;
  }

  if (footnotes.length) y += 4;

  const credit = lineBlock({ text: CREDIT, x: width - MARGIN, top: y, style: styles.small, color: TEXT_MUTED, anchor: "end", measureText });
  y += credit.height + BOTTOM;
  const height = even(y);

  if (height > MAX_CANVAS) {
    throw new TextFitError("Dot stacks are too tall for the canvas. Reduce the number of repeated observations or adjust text size.");
  }

  const tickLabels = ticks.map((t) => t.label).filter(Boolean);
  assertSeparated(tickLabels);
  assertInside(width, height, [
    title,
    xLabel,
    credit,
    ...tickLabels,
    ...footnotes,
    ...(nameDate?.fields.map((f) => f.label) || []),
  ]);

  return {
    width,
    height,
    background: spec.background === "transparent" ? null : PAPER,
    fontId: spec.font,
    worksheet,
    nameDate,
    title,
    xLabel,
    axis: {
      x1: roundCoordinate(axisX),
      x2: roundCoordinate(axisX + axisLength),
      y: roundCoordinate(axisY),
      stroke: AXIS,
      strokeWidth: AXIS_STROKE,
      ticks,
    },
    dots,
    footnotes,
    credit,
  };
}
