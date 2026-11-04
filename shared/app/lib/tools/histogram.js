import { FONT_IDS, FONT_WEIGHTS, TextFitError, centeredBaseline, roundCoordinate, wrapLines } from "@svgdiagram/diagram/web";
import { HISTOGRAM_MATH_LIMITS, calculateHistogram } from "./histogramMath.js";

const TEXT_DARK = "#0f172a";
const TEXT_MUTED = "#64748b";
const AXIS_COLOR = "#334155";
const GRID_COLOR = "#e2e8f0";
const GUIDE_COLOR = "#94a3b8";

export const HISTOGRAM_LIMITS = Object.freeze({
  title: 80,
  xAxisLabel: 60,
  yAxisLabel: 60,
  data: 50_000,
  bins: HISTOGRAM_MATH_LIMITS.bins,
});

export const HISTOGRAM_PALETTES = Object.freeze([
  { id: "classic", label: "Classic", colors: ["#2563eb", "#1d4ed8", "#dbeafe"] },
  { id: "emerald", label: "Emerald", colors: ["#059669", "#047857", "#d1fae5"] },
  { id: "violet", label: "Violet", colors: ["#7c3aed", "#6d28d9", "#ede9fe"] },
  { id: "amber", label: "Amber", colors: ["#d97706", "#b45309", "#fef3c7"] },
  { id: "slate", label: "Slate", colors: ["#475569", "#334155", "#f1f5f9"] },
  { id: "rose", label: "Rose", colors: ["#e11d48", "#be123c", "#ffe4e6"] },
].map(Object.freeze));

export const HISTOGRAM_BIN_MODES = Object.freeze(["auto", "count", "width"]);
export const HISTOGRAM_TEXT_SIZES = Object.freeze({ small: 0.9, medium: 1, large: 1.15 });
export const HISTOGRAM_BACKGROUNDS = Object.freeze(["white", "transparent"]);

const CANVAS_WIDTH = 720;
const MARGIN_X = 36;
const MARGIN_TOP = 24;
const MARGIN_BOTTOM = 24;
const SECTION_GAP = 14;
const CREDIT_TEXT = "Made with svgdiagram.ai";

const BASE_STYLES = Object.freeze({
  title: { size: 18, weight: 700, lineSpacing: 24 },
  axisLabel: { size: 13, weight: 600, lineSpacing: 18 },
  tick: { size: 11, weight: 400, lineSpacing: 15 },
  countLabel: { size: 11, weight: 700, lineSpacing: 15 },
  caption: { size: 11, weight: 400, lineSpacing: 15 },
  worksheet: { size: 12, weight: 600, lineSpacing: 16 },
});

const measuredWeight = (weight) => (weight >= 600 ? FONT_WEIGHTS.bold : FONT_WEIGHTS.regular);

const scaledStyle = (style, factor) => {
  const size = Math.round(style.size * factor * 2) / 2;
  const lineSpacing = Math.max(size + 2, Math.round(style.lineSpacing * factor));
  return { size, weight: style.weight, lineSpacing };
};

const widthOf = (text, style, measureText) => measureText(text, { size: style.size, weight: measuredWeight(style.weight) });

const colorsOf = (colors) => {
  const fallback = HISTOGRAM_PALETTES[0].colors;
  if (!Array.isArray(colors) || colors.length < 2) return [...fallback];
  if (colors.some((color) => typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color))) return [...fallback];
  return [...colors];
};

export function histogramSpec({
  title = "",
  data = "",
  binMode = "auto",
  binCount = "8",
  binWidth = "5",
  binStart = "",
  xAxisLabel = "",
  yAxisLabel = "",
  showCounts = true,
  colors = HISTOGRAM_PALETTES[0].colors,
  textSize = "medium",
  font = "inter",
  background = "white",
  worksheet = false,
} = {}) {
  return {
    title: typeof title === "string" ? title.slice(0, HISTOGRAM_LIMITS.title) : "",
    data: typeof data === "string" ? data : "",
    binMode: HISTOGRAM_BIN_MODES.includes(binMode) ? binMode : "auto",
    binCount: String(binCount ?? "8"),
    binWidth: String(binWidth ?? "5"),
    binStart: String(binStart ?? ""),
    xAxisLabel: typeof xAxisLabel === "string" ? xAxisLabel.slice(0, HISTOGRAM_LIMITS.xAxisLabel) : "",
    yAxisLabel: typeof yAxisLabel === "string" ? yAxisLabel.slice(0, HISTOGRAM_LIMITS.yAxisLabel) : "",
    showCounts: Boolean(showCounts),
    colors: colorsOf(colors),
    textSize: Object.keys(HISTOGRAM_TEXT_SIZES).includes(textSize) ? textSize : "medium",
    font: FONT_IDS.includes(font) ? font : "inter",
    background: HISTOGRAM_BACKGROUNDS.includes(background) ? background : "white",
    worksheet: Boolean(worksheet),
  };
}

const specimen = (slug, spec) => ({ slug, title: spec.title || "Histogram", histogram: histogramSpec(spec) });

export const DEFAULT_HISTOGRAM = histogramSpec({
  title: "Exam score distribution",
  data: "45, 52, 58, 61, 63, 65, 67, 70, 71, 72, 74, 75, 75, 78, 80, 81, 82, 83, 85, 87, 88, 90, 92, 95, 98",
  binMode: "auto",
  binCount: "8",
  binWidth: "10",
  binStart: "40",
  xAxisLabel: "Test score",
  yAxisLabel: "Frequency",
  showCounts: true,
});

export const HISTOGRAM_EXAMPLES = Object.freeze([
  specimen("sample", DEFAULT_HISTOGRAM),
  specimen("temperatures", {
    title: "Winter daily low temperatures (°C)",
    data: "-12.5, -10.2, -9.8, -8.1, -7.5, -6.0, -5.4, -4.8, -3.2, -2.1, -1.5, -0.8, 0.5, 1.2, 2.4, 3.1, 4.0",
    binMode: "width",
    binWidth: "3",
    binStart: "-15",
    xAxisLabel: "Temperature (°C)",
    yAxisLabel: "Days",
    colors: HISTOGRAM_PALETTES[1].colors,
  }),
  specimen("response-times", {
    title: "API response latency (ms)",
    data: "12, 14, 15, 15, 16, 18, 19, 20, 20, 21, 22, 25, 28, 30, 35, 42, 50, 65, 85, 120",
    binMode: "count",
    binCount: "6",
    xAxisLabel: "Latency (ms)",
    yAxisLabel: "Request count",
    colors: HISTOGRAM_PALETTES[2].colors,
  }),
  specimen("small-sample", {
    title: "Plant height growth (cm)",
    data: "8, 11, 12, 14, 15, 15, 18, 19, 21",
    binMode: "auto",
    xAxisLabel: "Height (cm)",
    yAxisLabel: "Plant count",
    colors: HISTOGRAM_PALETTES[3].colors,
  }),
].map(Object.freeze));

const blank = (spec) => specimen(spec.slug, {
  colors: HISTOGRAM_PALETTES[4].colors,
  yAxisLabel: "Frequency",
  showCounts: false,
  ...spec,
  worksheet: true,
});

export const HISTOGRAM_BLANKS = Object.freeze([
  blank({
    slug: "worksheet",
    title: "Equal-width bins, 0 to 50",
    data: "10, 15, 20, 25, 30, 35, 40, 45, 50",
    binMode: "width",
    binWidth: "10",
    binStart: "0",
    xAxisLabel: "Value",
  }),
  blank({
    slug: "temperature-worksheet",
    title: "Temperature bins, -15 to 5",
    data: "-12, 2",
    binMode: "width",
    binWidth: "5",
    binStart: "-15",
    xAxisLabel: "Temperature (°C)",
  }),
  blank({
    slug: "decimal-worksheet",
    title: "Measurement bins, 0 to 5 by 0.5",
    data: "0.2, 4.8",
    binMode: "width",
    binWidth: "0.5",
    binStart: "0",
    xAxisLabel: "Length (cm)",
  }),
].map(Object.freeze));

export const HISTOGRAM_FIGURES = Object.freeze([
  specimen("parts", {
    title: "Parts of a histogram",
    data: "10, 15, 22, 28, 31, 35, 38, 42, 45, 48, 52, 58",
    binMode: "count",
    binCount: "5",
    xAxisLabel: "Score interval",
    yAxisLabel: "Frequency",
  }),
].map(Object.freeze));

export const histogramBySlug = (slug) => [...HISTOGRAM_EXAMPLES, ...HISTOGRAM_BLANKS, ...HISTOGRAM_FIGURES].find((item) => item.slug === slug);
export const histogramImage = (slug) => `/images/tools/histogram-${slug}.svg`;

export function normalizeHistogram(raw = {}) {
  const defaults = DEFAULT_HISTOGRAM;
  const isObj = raw && typeof raw === "object";
  return histogramSpec({
    title: isObj && typeof raw.title === "string" ? raw.title.slice(0, HISTOGRAM_LIMITS.title) : defaults.title,
    data: isObj && typeof raw.data === "string" ? raw.data : (isObj && raw.data != null ? String(raw.data) : defaults.data),
    binMode: isObj && HISTOGRAM_BIN_MODES.includes(raw.binMode) ? raw.binMode : defaults.binMode,
    binCount: String(isObj ? (raw.binCount ?? defaults.binCount) : defaults.binCount),
    binWidth: String(isObj ? (raw.binWidth ?? defaults.binWidth) : defaults.binWidth),
    binStart: String(isObj ? (raw.binStart ?? defaults.binStart) : defaults.binStart),
    xAxisLabel: isObj && typeof raw.xAxisLabel === "string" ? raw.xAxisLabel.slice(0, HISTOGRAM_LIMITS.xAxisLabel) : defaults.xAxisLabel,
    yAxisLabel: isObj && typeof raw.yAxisLabel === "string" ? raw.yAxisLabel.slice(0, HISTOGRAM_LIMITS.yAxisLabel) : defaults.yAxisLabel,
    showCounts: isObj && raw.showCounts !== undefined ? Boolean(raw.showCounts) : defaults.showCounts,
    colors: colorsOf(isObj ? raw.colors : undefined),
    textSize: isObj && Object.keys(HISTOGRAM_TEXT_SIZES).includes(raw.textSize) ? raw.textSize : defaults.textSize,
    font: isObj && FONT_IDS.includes(raw.font) ? raw.font : defaults.font,
    background: isObj && HISTOGRAM_BACKGROUNDS.includes(raw.background) ? raw.background : defaults.background,
    worksheet: Boolean(isObj && raw.worksheet),
  });
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

function formatEdgeLabels(edges) {
  const distinctVals = new Set(edges);
  if (distinctVals.size <= 1) return edges.map(String);

  const defaultFormatted = edges.map((num) => {
    if (Math.abs(num) < 1e-10) return "0";
    const str = String(num);
    if (str.length <= 8 && !str.includes("e")) return str;
    return String(Number(num.toPrecision(6)));
  });

  if (new Set(defaultFormatted).size === distinctVals.size) {
    return defaultFormatted;
  }

  const sorted = [...distinctVals].sort((a, b) => a - b);
  let minGap = Infinity;
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1] - sorted[i];
    if (gap > 0 && gap < minGap) minGap = gap;
  }

  const maxMag = Math.max(...edges.map((n) => Math.abs(n)));

  if (minGap < 1e-4 || maxMag > 1e9) {
    for (let p = 2; p <= 8; p++) {
      const formatted = edges.map((num) => num.toPrecision(p));
      if (new Set(formatted).size === distinctVals.size) return formatted;
    }
  }

  for (let d = 0; d <= 10; d++) {
    const formatted = edges.map((num) => num.toFixed(d));
    if (new Set(formatted).size === distinctVals.size) return formatted;
  }

  return edges.map(String);
}

function calculateYAxisTicks(maxCount) {
  const targetTicks = 5;
  const rawStep = maxCount / targetTicks;
  let step = 1;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const norm = rawStep / mag;
  if (norm <= 1) step = 1 * mag;
  else if (norm <= 2) step = 2 * mag;
  else if (norm <= 5) step = 5 * mag;
  else step = 10 * mag;

  step = Math.max(1, Math.round(step));
  const yMax = Math.max(step, Math.ceil(maxCount / step) * step);
  const ticks = [];
  for (let val = 0; val <= yMax; val += step) {
    ticks.push(val);
  }
  return { yMax, ticks, step };
}

export function layoutHistogram(state, measureText) {
  const spec = normalizeHistogram(state);
  let calcResult;
  try {
    calcResult = calculateHistogram({
      data: spec.data,
      binMode: spec.binMode,
      binCount: spec.binCount,
      binWidth: spec.binWidth,
      binStart: spec.binStart,
    });
  } catch (error) {
    throw new TextFitError(error instanceof Error ? error.message : "The histogram dataset could not be processed.");
  }

  const scaleFactor = HISTOGRAM_TEXT_SIZES[spec.textSize] || 1;
  const titleStyle = scaledStyle(BASE_STYLES.title, scaleFactor);
  const axisLabelStyle = scaledStyle(BASE_STYLES.axisLabel, scaleFactor);
  const tickStyle = scaledStyle(BASE_STYLES.tick, scaleFactor);
  const countStyle = scaledStyle(BASE_STYLES.countLabel, scaleFactor);
  const worksheetStyle = scaledStyle(BASE_STYLES.worksheet, scaleFactor);
  const captionStyle = scaledStyle(BASE_STYLES.caption, scaleFactor);

  const canvasWidth = CANVAS_WIDTH;
  let currentY = MARGIN_TOP;

  // Title Block
  let titleBlock = null;
  if (spec.title.trim()) {
    titleBlock = textBlock({
      text: spec.title.trim(),
      x: canvasWidth / 2,
      top: currentY,
      maxWidth: canvasWidth - MARGIN_X * 2,
      style: titleStyle,
      color: TEXT_DARK,
      anchor: "middle",
      measureText,
    });
    currentY += titleBlock.height + SECTION_GAP;
  }

  // Worksheet Header Line
  let worksheetHeader = null;
  if (spec.worksheet) {
    const nameText = "Name: ______________________";
    const dateText = "Date: ______________";
    const nameWidth = widthOf(nameText, worksheetStyle, measureText);
    const dateWidth = widthOf(dateText, worksheetStyle, measureText);
    worksheetHeader = {
      nameLine: lineBlock({ text: nameText, x: MARGIN_X, top: currentY, style: worksheetStyle, color: TEXT_DARK, anchor: "start", measureText }),
      dateLine: lineBlock({ text: dateText, x: canvasWidth - MARGIN_X - dateWidth, top: currentY, style: worksheetStyle, color: TEXT_DARK, anchor: "start", measureText }),
    };
    currentY += worksheetStyle.lineSpacing + SECTION_GAP;
  }

  // Y-axis tick calculation
  const maxCount = spec.worksheet ? 10 : Math.max(...calcResult.bins.map((b) => b.count), 1);
  const { yMax, ticks: yTicks } = calculateYAxisTicks(maxCount);

  let maxYTickWidth = 0;
  yTicks.forEach((tickVal) => {
    const w = widthOf(String(tickVal), tickStyle, measureText);
    if (w > maxYTickWidth) maxYTickWidth = w;
  });

  // Y-axis label space
  let yAxisLabelWidth = 0;
  let yAxisLabelBlock = null;
  if (spec.yAxisLabel.trim()) {
    const labelText = spec.yAxisLabel.trim();
    const w = widthOf(labelText, axisLabelStyle, measureText);
    yAxisLabelWidth = axisLabelStyle.lineSpacing + 8;
    yAxisLabelBlock = {
      text: labelText,
      width: w,
      height: axisLabelStyle.lineSpacing,
      style: axisLabelStyle,
    };
  }

  // Chart region coordinates
  const yAxisX = roundCoordinate(MARGIN_X + yAxisLabelWidth + maxYTickWidth + 10);
  const chartRight = roundCoordinate(canvasWidth - MARGIN_X - 16);
  const chartWidth = chartRight - yAxisX;
  const chartHeight = roundCoordinate(260 * scaleFactor);

  let chartTop = currentY;
  if (yAxisLabelBlock) {
    const minTop = currentY + Math.max(0, (yAxisLabelBlock.width - chartHeight) / 2);
    chartTop = Math.ceil(minTop);
  }
  chartTop = roundCoordinate(chartTop);
  const chartBottom = roundCoordinate(chartTop + chartHeight);

  // X-axis Edge ticks and labels
  const edges = calcResult.edges;
  const numBins = calcResult.bins.length;
  const barWidth = chartWidth / numBins;

  const formattedEdgeStrings = formatEdgeLabels(edges);
  const rawEdgeLabels = edges.map((edgeVal, index) => {
    const formatted = formattedEdgeStrings[index];
    const w = widthOf(formatted, tickStyle, measureText);
    const x = yAxisX + index * barWidth;
    return { index, edgeVal, formatted, width: w, x };
  });

  // Thin edge labels if needed
  let stride = 1;
  while (stride <= rawEdgeLabels.length) {
    let fit = true;
    for (let i = 0; i < rawEdgeLabels.length - stride; i += stride) {
      const current = rawEdgeLabels[i];
      const next = rawEdgeLabels[i + stride];
      if (next.x - current.x < (current.width / 2 + next.width / 2 + 6)) {
        fit = false;
        break;
      }
    }
    if (fit) break;
    stride += 1;
  }

  const edgeTicks = [];
  rawEdgeLabels.forEach((lbl, idx) => {
    const isPrimary = idx % stride === 0;
    let showText = isPrimary;
    if (idx === rawEdgeLabels.length - 1 && edgeTicks.length > 0) {
      const lastShown = edgeTicks.slice().reverse().find((t) => t.showText);
      if (lastShown && (lbl.x - lastShown.x < (lastShown.width / 2 + lbl.width / 2 + 4))) {
        showText = false;
      }
    }

    const block = showText
      ? lineBlock({
          text: lbl.formatted,
          x: lbl.x,
          top: chartBottom + 6,
          style: tickStyle,
          color: TEXT_MUTED,
          anchor: "middle",
          measureText,
        })
      : null;

    edgeTicks.push({
      x: roundCoordinate(lbl.x),
      edgeVal: lbl.edgeVal,
      formatted: lbl.formatted,
      showText,
      block,
      width: lbl.width,
    });
  });

  const tickLabelHeight = tickStyle.lineSpacing + 6;
  currentY = chartBottom + tickLabelHeight + 6;

  // X-axis Label Block
  let xAxisLabelBlock = null;
  if (spec.xAxisLabel.trim()) {
    xAxisLabelBlock = textBlock({
      text: spec.xAxisLabel.trim(),
      x: yAxisX + chartWidth / 2,
      top: currentY,
      maxWidth: chartWidth,
      style: axisLabelStyle,
      color: TEXT_DARK,
      anchor: "middle",
      measureText,
    });
    currentY += xAxisLabelBlock.height + SECTION_GAP;
  } else {
    currentY += SECTION_GAP;
  }

  // Y-axis tick visual blocks
  const yTicksBlocks = yTicks.map((tickVal) => {
    const yRatio = tickVal / yMax;
    const y = roundCoordinate(chartBottom - yRatio * chartHeight);
    const textStr = String(tickVal);
    const block = lineBlock({
      text: textStr,
      x: yAxisX - 6,
      top: y - tickStyle.lineSpacing / 2,
      style: tickStyle,
      color: TEXT_MUTED,
      anchor: "end",
      measureText,
    });
    return { tickVal, y, block };
  });

  // Bars Geometry
  const mainBarColor = spec.colors[0];
  const barStrokeColor = spec.colors[1] || mainBarColor;
  const countLabelColor = TEXT_DARK;

  const bars = calcResult.bins.map((bin, index) => {
    const x = roundCoordinate(yAxisX + index * barWidth);
    const w = roundCoordinate(barWidth);
    const frame = Boolean(spec.worksheet);
    const count = frame ? 0 : bin.count;
    const h = frame ? chartHeight : roundCoordinate((count / yMax) * chartHeight);
    const y = frame ? chartTop : roundCoordinate(chartBottom - h);

    let countBlock = null;
    if (spec.showCounts && !frame && count > 0) {
      const countStr = String(count);
      const countW = widthOf(countStr, countStyle, measureText);
      if (countW > w) {
        throw new TextFitError("Count labels are too wide to fit above the histogram bars. Turn off count labels or decrease bin count.");
      }
      countBlock = lineBlock({
        text: countStr,
        x: x + w / 2,
        top: Math.max(chartTop - countStyle.lineSpacing, y - countStyle.lineSpacing - 3),
        style: countStyle,
        color: countLabelColor,
        anchor: "middle",
        measureText,
      });
    }

    return {
      index,
      start: bin.start,
      end: bin.end,
      count,
      x,
      y,
      width: w,
      height: h,
      fill: frame ? "none" : mainBarColor,
      frame,
      stroke: barStrokeColor,
      countBlock,
    };
  });

  // Position Y-axis Label Block vertically centered alongside the chart
  if (yAxisLabelBlock) {
    yAxisLabelBlock.x = roundCoordinate(MARGIN_X + axisLabelStyle.lineSpacing / 2);
    yAxisLabelBlock.y = roundCoordinate(chartTop + chartHeight / 2);
    const labelBottom = yAxisLabelBlock.y + yAxisLabelBlock.width / 2 + MARGIN_BOTTOM;
    if (labelBottom > currentY) {
      currentY = labelBottom;
    }
  }

  // Credit Line
  const creditWidth = widthOf(CREDIT_TEXT, captionStyle, measureText);
  const creditBlock = lineBlock({
    text: CREDIT_TEXT,
    x: canvasWidth - MARGIN_X,
    top: currentY,
    style: captionStyle,
    color: TEXT_MUTED,
    anchor: "end",
    measureText,
  });
  currentY += captionStyle.lineSpacing + MARGIN_BOTTOM;

  const totalHeight = roundCoordinate(currentY);
  if (totalHeight > 800) {
    throw new TextFitError("The Y-axis label or layout exceeds maximum canvas height. Shorten the Y-axis label.");
  }

  return {
    width: canvasWidth,
    height: totalHeight,
    background: spec.background === "white" ? "#ffffff" : "transparent",
    fontId: spec.font,
    titleBlock,
    worksheetHeader,
    yAxisLabelBlock,
    xAxisLabelBlock,
    yAxisX,
    chartRight,
    chartTop,
    chartBottom,
    chartWidth,
    chartHeight,
    yTicksBlocks,
    edgeTicks,
    bars,
    creditBlock,
    method: calcResult.method,
    binWidth: calcResult.binWidth,
    binCount: calcResult.binCount,
    totalObservations: calcResult.count,
    minObservation: calcResult.min,
    maxObservation: calcResult.max,
    worksheet: spec.worksheet,
  };
}
