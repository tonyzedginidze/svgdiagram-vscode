import { ACCENT_PALETTE, DEFAULT_PALETTE, FONT_IDS, FONT_WEIGHTS, TextFitError, centeredBaseline, roundCoordinate, wrapLines } from "@svgdiagram/diagram/web";
import { calculateScatterRegression, getScatterBounds, getScatterCornerBounds, parseScatterData } from "./scatterPlotMath.js";

export const SCATTER_PLOT_LIMITS = Object.freeze({
  title: 80,
  axisLabel: 40,
  maxPoints: 500,
});

export const SCATTER_PLOT_PALETTES = Object.freeze([
  { id: "classic", label: "Classic", colors: Object.freeze([DEFAULT_PALETTE[0], "#1d4ed8", "#3b82f6"]) },
  ...ACCENT_PALETTE.map((accent) => Object.freeze({
    id: accent.id,
    label: accent.id.charAt(0).toUpperCase() + accent.id.slice(1),
    colors: Object.freeze([accent.color, DEFAULT_PALETTE[1], DEFAULT_PALETTE[2]]),
  })),
]);

export const SCATTER_PLOT_TEXT_SIZES = Object.freeze({ small: 0.9, medium: 1, large: 1.15 });
export const SCATTER_PLOT_BACKGROUNDS = Object.freeze(["white", "transparent"]);

const CANVAS_WIDTH = 760;
const MARGIN_LEFT_MIN = 75;
const MARGIN_RIGHT = 30;
const MARGIN_TOP = 24;
const MARGIN_BOTTOM = 20;
const CREDIT = "Made with svgdiagram.ai";
const CREDIT_URL = "https://svgdiagram.ai";

const BASE_STYLES = Object.freeze({
  title: { size: 18, weight: 700, lineSpacing: 24 },
  axisLabel: { size: 13, weight: 600, lineSpacing: 18 },
  tickLabel: { size: 11, weight: 400, lineSpacing: 15 },
  pointLabel: { size: 10, weight: 500, lineSpacing: 14 },
  statsHeader: { size: 12, weight: 700, lineSpacing: 16 },
  statsText: { size: 11, weight: 400, lineSpacing: 15 },
  small: { size: 11, weight: 400, lineSpacing: 15 },
  worksheet: { size: 12, weight: 700, lineSpacing: 16 },
});

const even = (val) => Math.ceil(val / 2) * 2;
const measuredWeight = (weight) => (weight >= 600 ? FONT_WEIGHTS.bold : FONT_WEIGHTS.regular);
const scaled = (style, factor) => {
  const size = Math.round(style.size * factor * 2) / 2;
  const lineSpacing = Math.max(size + 2, Math.round(style.lineSpacing * factor));
  return { size, weight: style.weight, lineSpacing };
};
const widthOf = (text, style, measureText) => measureText(text, { size: style.size, weight: measuredWeight(style.weight) });

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
  return { x1: roundCoordinate(x1), x2: roundCoordinate(x2), y: roundCoordinate(y), stroke: "#94a3b8", strokeWidth: 1.25, dash: "4 3" };
}

function blockBounds(block) {
  if (!block) return null;
  if (block.vertical) {
    const half = (block.style?.lineSpacing || 18) / 2;
    return { left: block.x - half, right: block.x + half, top: block.top - block.width / 2, bottom: block.top + block.width / 2 };
  }
  const left = block.anchor === "middle" ? block.x - block.width / 2 : block.anchor === "end" ? block.x - block.width : block.x;
  return { left, right: left + block.width, top: block.top, bottom: block.top + block.height };
}

function assertInside(width, height, blocks) {
  for (const block of blocks) {
    const bounds = blockBounds(block);
    if (!bounds) continue;
    if (bounds.left < -0.5 || bounds.right > width + 0.5 || bounds.top < -0.5 || bounds.bottom > height + 0.5) {
      throw new TextFitError("Text in this scatter plot exceeds the canvas boundaries. Shorten the text or labels.");
    }
  }
}

function boxesOverlap(a, b) {
  return a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
}

function assertTickLabelsSeparated(items, axis) {
  const boxes = items.map((item) => blockBounds(item.block)).filter(Boolean);
  for (let index = 0; index < boxes.length - 1; index += 1) {
    if (boxesOverlap(boxes[index], boxes[index + 1])) {
      throw new TextFitError(`Worksheet ${axis} tick labels would overlap. Use corners that leave room between the end labels and the grid labels.`);
    }
  }
}

const scatterSpec = ({
  title = "",
  xAxisLabel = "",
  yAxisLabel = "",
  dataText = "",
  showBestFit = true,
  showPointLabels = false,
  showStats = true,
  colors = SCATTER_PLOT_PALETTES[0].colors,
  textSize = "medium",
  font = "inter",
  background = "white",
  worksheet = false,
} = {}) => ({
  title,
  xAxisLabel,
  yAxisLabel,
  dataText,
  showBestFit: Boolean(showBestFit),
  showPointLabels: Boolean(showPointLabels),
  showStats: Boolean(showStats),
  colors: [...colors].slice(0, 3),
  textSize,
  font,
  background,
  worksheet: Boolean(worksheet),
});

const specimen = (slug, spec) => ({ slug, title: spec.title || "Scatter Plot", scatter: scatterSpec(spec) });

export const DEFAULT_SCATTER_PLOT = scatterSpec({
  title: "Synthetic Sample: Study Hours vs. Exam Score",
  xAxisLabel: "Study Time (Hours)",
  yAxisLabel: "Exam Score (%)",
  dataText: `x, y, label
1.5, 55, Sample A
2.0, 62, Sample B
2.5, 68, Sample C
3.0, 70, Sample D
3.5, 76, Sample E
4.0, 82, Sample F
4.5, 85, Sample G
5.0, 91, Sample H
5.5, 94, Sample I
6.0, 98, Sample J`,
  showBestFit: true,
  showPointLabels: false,
  showStats: true,
});

export const SCATTER_PLOT_EXAMPLES = Object.freeze([
  specimen("positive-linear", DEFAULT_SCATTER_PLOT),
  specimen("perfect-positive", {
    title: "Synthetic Sample: Perfect Positive Linear (y = x)",
    xAxisLabel: "X Variable",
    yAxisLabel: "Y Variable",
    dataText: `x, y, label
1, 1, Point 1
2, 2, Point 2
3, 3, Point 3
4, 4, Point 4
5, 5, Point 5`,
    showBestFit: true,
    showPointLabels: true,
    showStats: true,
  }),
  specimen("perfect-negative", {
    title: "Synthetic Sample: Perfect Negative Linear (y = 6 - x)",
    xAxisLabel: "X Value",
    yAxisLabel: "Y Value",
    dataText: `x, y, label
1, 5, P1
2, 4, P2
3, 3, P3
4, 2, P4
5, 1, P5`,
    showBestFit: true,
    showPointLabels: true,
    showStats: true,
  }),
  specimen("weak-correlation", {
    title: "Synthetic Sample: Weak Linear Correlation",
    xAxisLabel: "Hours of TV",
    yAxisLabel: "Quiz Result",
    dataText: `x, y, label
1, 2, Sample 1
2, 4, Sample 2
3, 1, Sample 3
4, 5, Sample 4
5, 3, Sample 5`,
    showBestFit: true,
    showPointLabels: true,
    showStats: true,
  }),
]);

const blank = (spec) => specimen(spec.slug, {
  showBestFit: false,
  showPointLabels: false,
  showStats: false,
  ...spec,
  worksheet: true,
});

export const SCATTER_PLOT_BLANKS = Object.freeze([
  blank({
    slug: "blank-scatter",
    title: "First quadrant, 0 to 10",
    xAxisLabel: "Independent Variable (X)",
    yAxisLabel: "Dependent Variable (Y)",
    dataText: `x, y
0, 0
10, 10`,
  }),
  blank({
    slug: "four-quadrant",
    title: "Four quadrants, -10 to 10",
    xAxisLabel: "X",
    yAxisLabel: "Y",
    dataText: `x, y
-10, -10
10, 10`,
  }),
  blank({
    slug: "hours-score",
    title: "Time (hours) and score",
    xAxisLabel: "Time (hours)",
    yAxisLabel: "Score",
    dataText: `x, y
0, 0
10, 100`,
  }),
]);

export function scatterPlotBySlug(slug) {
  return [...SCATTER_PLOT_EXAMPLES, ...SCATTER_PLOT_BLANKS].find((item) => item.slug === slug);
}

export const scatterPlotImage = (slug) => `/images/tools/scatter-plot-${slug}.svg`;

export function normalizeScatterPlot(raw) {
  if (!raw || typeof raw !== "object") return structuredClone(DEFAULT_SCATTER_PLOT);
  const palette = SCATTER_PLOT_PALETTES.find((p) => p.id === raw.palette) || SCATTER_PLOT_PALETTES[0];
  const textSize = SCATTER_PLOT_TEXT_SIZES[raw.textSize] ? raw.textSize : "medium";
  const font = FONT_IDS.includes(raw.font) ? raw.font : "inter";
  const background = SCATTER_PLOT_BACKGROUNDS.includes(raw.background) ? raw.background : "white";

  return scatterSpec({
    title: typeof raw.title === "string" ? raw.title.slice(0, SCATTER_PLOT_LIMITS.title) : DEFAULT_SCATTER_PLOT.title,
    xAxisLabel: typeof raw.xAxisLabel === "string" ? raw.xAxisLabel.slice(0, SCATTER_PLOT_LIMITS.axisLabel) : DEFAULT_SCATTER_PLOT.xAxisLabel,
    yAxisLabel: typeof raw.yAxisLabel === "string" ? raw.yAxisLabel.slice(0, SCATTER_PLOT_LIMITS.axisLabel) : DEFAULT_SCATTER_PLOT.yAxisLabel,
    dataText: typeof raw.dataText === "string" ? raw.dataText : DEFAULT_SCATTER_PLOT.dataText,
    showBestFit: raw.showBestFit !== false,
    showPointLabels: Boolean(raw.showPointLabels),
    showStats: raw.showStats !== false,
    colors: Array.isArray(raw.colors) ? raw.colors : palette.colors,
    textSize,
    font,
    background,
    worksheet: Boolean(raw.worksheet),
  });
}

function generateTicks(min, max, maxTicks = 6) {
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return [min];

  const roughStep = span / (maxTicks - 1);
  if (roughStep === 0) return [min];

  const exponent = Math.floor(Math.log10(roughStep));
  const fraction = roughStep / Math.pow(10, exponent);

  let niceFraction = 1;
  if (fraction >= 1.5 && fraction < 3) niceFraction = 2;
  else if (fraction >= 3 && fraction < 7) niceFraction = 5;
  else if (fraction >= 7) niceFraction = 10;

  const step = niceFraction * Math.pow(10, exponent);
  if (!Number.isFinite(step) || step <= 0) return [min, max];

  if (Math.abs(min / step) > 1e14) {
    const numSteps = Math.min(maxTicks - 1, 5);
    const ticks = [];
    for (let i = 0; i <= numSteps; i++) {
      ticks.push(min + i * (span / numSteps));
    }
    return ticks;
  }

  const startIdx = Math.floor(min / step);
  const endIdx = Math.ceil(max / step);
  const count = Math.min(Math.max(endIdx - startIdx, 1), 20);

  const ticks = [];
  for (let i = 0; i <= count; i++) {
    const val = (startIdx + i) * step;
    if (Number.isFinite(val)) {
      ticks.push(val);
    }
  }
  return ticks.length > 0 ? ticks : [min, max];
}

// Worksheet ticks stay inside the exact corners and always include both ends. Solved plots keep generateTicks,
// including values that fall outside the padded data range.
function ticksWithinBounds(min, max, maxTicks = 6) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return [min];
  if (max === min) return [min];

  const epsilon = Math.max(Math.abs(max - min) * 1e-9, 1e-12);
  const ticks = [];
  const push = (value) => {
    const snapped = Math.abs(value - min) <= epsilon ? min : Math.abs(value - max) <= epsilon ? max : value;
    if (snapped < min - epsilon || snapped > max + epsilon) return;
    if (ticks.some((existing) => Math.abs(existing - snapped) <= epsilon)) return;
    ticks.push(snapped);
  };

  push(min);
  for (const value of generateTicks(min, max, maxTicks)) push(value);
  push(max);
  ticks.sort((a, b) => a - b);
  return ticks;
}

function formatTick(val, span, minVal) {
  if (!Number.isFinite(val)) return "";
  if (val === 0) return "0";
  const absVal = Math.abs(val);

  if (minVal !== undefined && Math.abs(minVal) > 1e6 && span < Math.abs(minVal) * 1e-4) {
    const diff = val - minVal;
    if (diff === 0) return formatTick(minVal, span);
    return `+${diff.toExponential(2)}`;
  }

  if (absVal >= 1e6 || absVal < 1e-3) {
    return val.toExponential(3).replace(/\.0+e/, "e");
  }

  const decimals = Math.max(0, Math.min(8, Math.ceil(-Math.log10(span || 1)) + 1));
  const str = val.toFixed(decimals);
  if (str.includes(".")) {
    return str.replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1");
  }
  return str;
}

function formatCoefficient(val) {
  if (!Number.isFinite(val)) return "N/A";
  if (val === 0) return "0";
  const abs = Math.abs(val);
  if (abs < 0.0001 || abs >= 1e6) {
    return val.toExponential(4).replace(/\.0+e/, "e");
  }
  const str = val.toFixed(4);
  return str.includes(".") ? str.replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1") : str;
}

export function layoutScatterPlot(state, measureText) {
  if (typeof measureText !== "function") throw new TypeError("layoutScatterPlot requires measureText");

  const spec = normalizeScatterPlot(state);
  const fontId = spec.font;
  const textScale = SCATTER_PLOT_TEXT_SIZES[spec.textSize] || 1;
  const worksheet = Boolean(spec.worksheet);

  const styles = {
    title: scaled(BASE_STYLES.title, textScale),
    axisLabel: scaled(BASE_STYLES.axisLabel, textScale),
    tickLabel: scaled(BASE_STYLES.tickLabel, textScale),
    pointLabel: scaled(BASE_STYLES.pointLabel, textScale),
    statsHeader: scaled(BASE_STYLES.statsHeader, textScale),
    statsText: scaled(BASE_STYLES.statsText, textScale),
    small: scaled(BASE_STYLES.small, textScale),
    worksheet: scaled(BASE_STYLES.worksheet, textScale),
  };

  const parsed = parseScatterData(spec.dataText);
  if (parsed.errors.length > 0) {
    const errMsgs = parsed.errors.map((e) => `Line ${e.line}: ${e.message}`).join("; ");
    throw new TextFitError(`Data error: ${errMsgs}`);
  }
  const points = parsed.points;

  if (points.length === 0) {
    throw new TextFitError("Data text contains no points.");
  }

  const bounds = worksheet ? getScatterCornerBounds(points) : getScatterBounds(points);
  const regression = calculateScatterRegression(points);

  const xTicks = worksheet ? ticksWithinBounds(bounds.xMin, bounds.xMax, 6) : generateTicks(bounds.xMin, bounds.xMax, 6);
  const yTicks = worksheet ? ticksWithinBounds(bounds.yMin, bounds.yMax, 6) : generateTicks(bounds.yMin, bounds.yMax, 6);

  const plotXMin = worksheet ? bounds.xMin : Math.min(bounds.xMin, xTicks[0]);
  const plotXMax = worksheet ? bounds.xMax : Math.max(bounds.xMax, xTicks[xTicks.length - 1]);
  const plotYMin = worksheet ? bounds.yMin : Math.min(bounds.yMin, yTicks[0]);
  const plotYMax = worksheet ? bounds.yMax : Math.max(bounds.yMax, yTicks[yTicks.length - 1]);

  const xSpan = plotXMax - plotXMin;
  const ySpan = plotYMax - plotYMin;
  if (worksheet) {
    const collapsed = [
      (!Number.isFinite(xSpan) || xSpan <= 0) && "X",
      (!Number.isFinite(ySpan) || ySpan <= 0) && "Y",
    ].filter(Boolean);
    if (collapsed.length) {
      throw new TextFitError(`A worksheet axis needs a positive range. These corners do not span ${collapsed.join(" or ")}.`);
    }
  }

  const yFormattedTicks = yTicks.map((val) => formatTick(val, ySpan, plotYMin));
  let maxYTickWidth = 0;
  yFormattedTicks.forEach((lbl) => {
    const w = widthOf(lbl, styles.tickLabel, measureText);
    if (w > maxYTickWidth) maxYTickWidth = w;
  });

  const plotLeft = Math.max(MARGIN_LEFT_MIN, Math.ceil(maxYTickWidth + 35));
  const plotRight = CANVAS_WIDTH - MARGIN_RIGHT;
  const plotWidth = plotRight - plotLeft;

  let y = MARGIN_TOP;
  let nameDate = null;

  if (worksheet) {
    const fieldWidth = (CANVAS_WIDTH - MARGIN_LEFT_MIN - MARGIN_RIGHT - 40) / 2;
    const fields = ["Name:", "Date:"].map((label, index) => {
      const fieldX = MARGIN_LEFT_MIN + index * (fieldWidth + 40);
      const labelWidth = widthOf(label, styles.worksheet, measureText);
      const block = lineBlock({ text: label, x: fieldX, top: y, style: styles.worksheet, color: "#334155", anchor: "start", measureText });
      return {
        label: block,
        line: guide(fieldX + labelWidth + 8, Math.max(fieldX + fieldWidth, fieldX + labelWidth + 32), block.lines[0].y + 2),
      };
    });
    nameDate = { fields };
    y += styles.worksheet.lineSpacing + 16;
  }

  const title = spec.title.trim()
    ? textBlock({
        text: spec.title.trim(),
        x: CANVAS_WIDTH / 2,
        top: y,
        maxWidth: CANVAS_WIDTH - plotLeft - MARGIN_RIGHT,
        style: styles.title,
        color: "#0f172a",
        anchor: "middle",
        measureText,
      })
    : null;

  if (title) y += title.height + 12;

  const plotHeight = 340;
  const plotTop = y;
  const plotBottom = plotTop + plotHeight;

  y = plotBottom;

  const toCanvasX = (valX) => {
    if (plotXMax === plotXMin) return plotLeft + plotWidth / 2;
    return plotLeft + ((valX - plotXMin) / (plotXMax - plotXMin)) * plotWidth;
  };
  const toCanvasY = (valY) => {
    if (plotYMax === plotYMin) return plotBottom - plotHeight / 2;
    return plotBottom - ((valY - plotYMin) / (plotYMax - plotYMin)) * plotHeight;
  };

  const xTickItems = xTicks.map((val) => {
    const cx = toCanvasX(val);
    const labelText = formatTick(val, xSpan, plotXMin);
    const labelBlock = lineBlock({ text: labelText, x: roundCoordinate(cx), top: plotBottom + 18, style: styles.tickLabel, color: "#334155", anchor: "middle", measureText });
    return { val, cx: roundCoordinate(cx), labelText, block: labelBlock };
  });

  const yTickItems = yTicks.map((val, idx) => {
    const cy = toCanvasY(val);
    const labelText = yFormattedTicks[idx];
    const labelBlock = lineBlock({ text: labelText, x: plotLeft - 9, top: cy - styles.tickLabel.size / 2, style: styles.tickLabel, color: "#334155", anchor: "end", measureText });
    return { val, cy: roundCoordinate(cy), labelText, block: labelBlock };
  });

  if (worksheet) {
    assertTickLabelsSeparated(xTickItems, "X");
    assertTickLabelsSeparated(yTickItems, "Y");
  }

  // Points mapping: in worksheet mode, suppress points completely
  const pointItems = worksheet
    ? []
    : points.map((p, idx) => {
        const cx = toCanvasX(p.x);
        const cy = toCanvasY(p.y);
        let labelBlock = null;

        if (spec.showPointLabels && p.label) {
          const labelWidth = widthOf(p.label, styles.pointLabel, measureText);
          if (labelWidth > CANVAS_WIDTH - 32) {
            throw new TextFitError(`Point label "${p.label}" is too long to fit. Shorten the label.`);
          }

          let anchor = "start";
          let labelX = cx + 7;
          if (cx + 7 + labelWidth > CANVAS_WIDTH - 16) {
            anchor = "end";
            labelX = cx - 7;
          }

          const leftEdge = anchor === "end" ? labelX - labelWidth : labelX;
          const rightEdge = anchor === "end" ? labelX : labelX + labelWidth;

          if (leftEdge < 16 || rightEdge > CANVAS_WIDTH - 16) {
            throw new TextFitError(`Point label "${p.label}" exceeds drawing boundary. Shorten the label.`);
          }

          labelBlock = textBlock({
            text: p.label,
            x: roundCoordinate(labelX),
            top: roundCoordinate(cy - styles.pointLabel.size / 2),
            maxWidth: Math.min(labelWidth + 10, CANVAS_WIDTH - 32),
            style: styles.pointLabel,
            color: "#475569",
            anchor,
            measureText,
          });
        }

        return {
          index: idx,
          x: p.x,
          y: p.y,
          label: p.label,
          cx: roundCoordinate(cx),
          cy: roundCoordinate(cy),
          labelBlock,
        };
      });

  // Best fit line: suppressed in worksheet mode
  let bestFitLine = null;
  if (!worksheet && spec.showBestFit && (regression.status === "ok" || regression.status === "constant-y")) {
    const { slope, intercept } = regression;
    const x1 = plotXMin;
    const y1 = slope * x1 + intercept;
    const x2 = plotXMax;
    const y2 = slope * x2 + intercept;

    const cx1 = toCanvasX(x1);
    const cy1 = toCanvasY(y1);
    const cx2 = toCanvasX(x2);
    const cy2 = toCanvasY(y2);

    bestFitLine = {
      x1: roundCoordinate(cx1),
      y1: roundCoordinate(cy1),
      x2: roundCoordinate(cx2),
      y2: roundCoordinate(cy2),
      slope: regression.slope,
      intercept: regression.intercept,
    };
  }

  y += 28;
  const xAxisY = y;
  let xAxisLabelBlock = null;
  if (spec.xAxisLabel.trim()) {
    xAxisLabelBlock = lineBlock({
      text: spec.xAxisLabel.trim(),
      x: (plotLeft + plotRight) / 2,
      top: xAxisY,
      style: styles.axisLabel,
      color: "#0f172a",
      anchor: "middle",
      measureText,
    });
    y += styles.axisLabel.lineSpacing + 8;
  }

  let yAxisLabelBlock = null;
  if (spec.yAxisLabel.trim()) {
    yAxisLabelBlock = lineBlock({
      text: spec.yAxisLabel.trim(),
      x: 18,
      top: (plotTop + plotBottom) / 2,
      style: styles.axisLabel,
      color: "#0f172a",
      anchor: "middle",
      measureText,
    });
    yAxisLabelBlock.vertical = true;
  }

  // Statistics Panel (Suppressed in worksheet mode)
  let statsCard = null;
  if (!worksheet && spec.showStats) {
    let rawItems = [];
    if (regression.status === "ok") {
      const eqStr = `y = ${formatCoefficient(regression.slope)}x ${regression.intercept >= 0 ? "+" : "-"} ${formatCoefficient(Math.abs(regression.intercept))}`;
      rawItems = [
        `Equation: ${eqStr}`,
        `Slope (m): ${formatCoefficient(regression.slope)}`,
        `Intercept (b): ${formatCoefficient(regression.intercept)}`,
        `R²: ${formatCoefficient(regression.rSquared)}`,
      ];
    } else if (regression.status === "constant-y") {
      rawItems = [
        `Equation: y = ${formatCoefficient(regression.intercept)}`,
        `Slope (m): 0`,
        `Intercept (b): ${formatCoefficient(regression.intercept)}`,
        `R²: N/A (Constant Y)`,
      ];
    } else if (regression.status === "constant-x") {
      rawItems = [`Linear Regression: N/A (Constant X)`];
    } else {
      rawItems = [`Linear Regression: ${regression.message || "Unavailable"}`];
    }

    y += 12;
    const cardTop = y;
    const cardTitleBlock = lineBlock({ text: "Linear Regression Statistics", x: plotLeft + 12, top: cardTop + 10, style: styles.statsHeader, color: "#0f172a", anchor: "start", measureText });

    const itemBlocks = rawItems.map((itemText, idx) => {
      const colX = plotLeft + 12 + (idx % 2 === 1 ? plotWidth / 2 : 0);
      const rowY = cardTop + 30 + Math.floor(idx / 2) * styles.statsText.lineSpacing;
      return lineBlock({ text: itemText, x: colX, top: rowY, style: styles.statsText, color: "#334155", anchor: "start", measureText });
    });

    const cardHeight = styles.statsHeader.lineSpacing + Math.ceil(rawItems.length / 2) * styles.statsText.lineSpacing + 20;
    y += cardHeight;

    statsCard = {
      x: plotLeft,
      y: roundCoordinate(cardTop),
      width: plotWidth,
      height: cardHeight,
      title: cardTitleBlock,
      items: itemBlocks,
    };
  }

  // Notes & Offset base notation
  const notes = [];
  if (Math.abs(plotXMin) > 1e6 && xSpan < Math.abs(plotXMin) * 1e-4) {
    notes.push(`X values are offset from base mark ${plotXMin}`);
  }
  if (Math.abs(plotYMin) > 1e6 && ySpan < Math.abs(plotYMin) * 1e-4) {
    notes.push(`Y values are offset from base mark ${plotYMin}`);
  }

  const footnoteBlocks = notes.map((note) => {
    y += 6;
    const block = textBlock({ text: note, x: plotLeft, top: y, maxWidth: plotWidth, style: styles.small, color: "#64748b", anchor: "start", measureText });
    y += block.height;
    return block;
  });

  y += 24;
  const credit = lineBlock({ text: CREDIT, x: plotRight, top: y, style: styles.small, color: "#64748b", anchor: "end", measureText });
  y += credit.height + MARGIN_BOTTOM;

  const height = even(y);

  // Assert bounds on all measured blocks
  const allBlocks = [
    title,
    credit,
    xAxisLabelBlock,
    yAxisLabelBlock,
    ...xTickItems.map((t) => t.block),
    ...yTickItems.map((t) => t.block),
    ...pointItems.map((p) => p.labelBlock).filter(Boolean),
    ...(statsCard ? [statsCard.title, ...statsCard.items] : []),
    ...footnoteBlocks,
    ...(nameDate ? nameDate.fields.map((f) => f.label) : []),
  ].filter(Boolean);

  assertInside(CANVAS_WIDTH, height, allBlocks);

  return {
    fontId,
    textSize: spec.textSize,
    background: spec.background === "transparent" ? null : "#ffffff",
    colors: spec.colors,
    width: CANVAS_WIDTH,
    height,
    styles,
    title,
    nameDate,
    plot: {
      left: roundCoordinate(plotLeft),
      right: roundCoordinate(plotRight),
      top: roundCoordinate(plotTop),
      bottom: roundCoordinate(plotBottom),
      width: roundCoordinate(plotWidth),
      height: roundCoordinate(plotHeight),
      xMin: plotXMin,
      xMax: plotXMax,
      yMin: plotYMin,
      yMax: plotYMax,
    },
    xTicks: xTickItems,
    yTicks: yTickItems,
    points: pointItems,
    bestFitLine,
    statsCard,
    regression,
    xAxisLabelBlock,
    yAxisLabelBlock,
    showPointLabels: spec.showPointLabels,
    worksheet,
    footnotes: footnoteBlocks,
    credit,
    creditUrl: CREDIT_URL,
  };
}
