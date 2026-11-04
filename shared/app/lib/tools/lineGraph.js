import { ACCENT_PALETTE, DEFAULT_PALETTE, FONT_IDS, FONT_WEIGHTS, TextFitError, centeredBaseline, roundCoordinate, wrapLines } from "@svgdiagram/diagram/web";
import { LINE_GRAPH_LIMITS as MATH_LIMITS, calculateLineGraph } from "./lineGraphMath.js";

const TEXT_DARK = "#0f172a";
const TEXT_MUTED = "#64748b";
const CREDIT_TEXT = "Made with svgdiagram.ai";
const CREDIT_URL = "https://svgdiagram.ai";

export const LINE_GRAPH_LIMITS = Object.freeze({
  title: 80,
  xAxisLabel: 60,
  yAxisLabel: 60,
  data: 100_000,
  maxRows: MATH_LIMITS.maxRows,
  maxSeries: MATH_LIMITS.maxSeries,
});

export const LINE_GRAPH_PALETTES = Object.freeze([
  { id: "classic", label: "Classic", colors: Object.freeze([DEFAULT_PALETTE[0], "#dc2626", DEFAULT_PALETTE[3], DEFAULT_PALETTE[2], DEFAULT_PALETTE[1], "#0891b2"]) },
  { id: "vivid", label: "Vivid", colors: Object.freeze([ACCENT_PALETTE[0].color, "#ea580c", ACCENT_PALETTE[3].color, "#e11d48", ACCENT_PALETTE[1].color, ACCENT_PALETTE[4].color]) },
  { id: "ocean", label: "Ocean", colors: Object.freeze([ACCENT_PALETTE[4].color, "#0d9488", DEFAULT_PALETTE[0], ACCENT_PALETTE[3].color, ACCENT_PALETTE[0].color, "#0891b2"]) },
  { id: "warm", label: "Warm", colors: Object.freeze(["#e11d48", ACCENT_PALETTE[2].color, "#ca8a04", "#b91c1c", ACCENT_PALETTE[1].color, "#c026d3"]) },
  { id: "slate", label: "Slate", colors: Object.freeze(["#334155", ACCENT_PALETTE[5].color, "#64748b", "#0f172a", "#1e293b", "#94a3b8"]) },
  { id: "emerald", label: "Emerald", colors: Object.freeze([ACCENT_PALETTE[3].color, "#0d9488", "#15803d", ACCENT_PALETTE[4].color, ACCENT_PALETTE[2].color, ACCENT_PALETTE[1].color]) },
]);

export const LINE_GRAPH_TEXT_SIZES = Object.freeze({ small: 0.9, medium: 1, large: 1.15 });
export const LINE_GRAPH_BACKGROUNDS = Object.freeze(["white", "transparent"]);

const CANVAS_WIDTH = 760;
const MARGIN_X = 36;
const MARGIN_TOP = 24;
const MARGIN_BOTTOM = 24;
const SECTION_GAP = 14;

const BASE_STYLES = Object.freeze({
  title: { size: 18, weight: 700, lineSpacing: 24 },
  axisLabel: { size: 13, weight: 600, lineSpacing: 18 },
  tick: { size: 11, weight: 400, lineSpacing: 15 },
  legend: { size: 11, weight: 500, lineSpacing: 15 },
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

const sanitizeColors = (colors) => {
  const fallback = LINE_GRAPH_PALETTES[0].colors;
  if (!Array.isArray(colors) || !colors.length) return [...fallback];
  const valid = colors.filter((color) => typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color));
  if (!valid.length) return [...fallback];
  while (valid.length < 6) {
    valid.push(fallback[valid.length % fallback.length]);
  }
  return valid.slice(0, 6);
};

export function lineGraphSpec({
  title = "",
  dataText = "",
  xAxisLabel = "",
  yAxisLabel = "",
  yMin = "",
  yMax = "",
  yStep = "",
  showGrid = true,
  showMarkers = true,
  showLegend = true,
  colors = LINE_GRAPH_PALETTES[0].colors,
  textSize = "medium",
  font = "inter",
  background = "white",
  worksheet = false,
} = {}) {
  return {
    title: typeof title === "string" ? title.slice(0, LINE_GRAPH_LIMITS.title) : "",
    dataText: typeof dataText === "string" ? dataText : "",
    xAxisLabel: typeof xAxisLabel === "string" ? xAxisLabel.slice(0, LINE_GRAPH_LIMITS.xAxisLabel) : "",
    yAxisLabel: typeof yAxisLabel === "string" ? yAxisLabel.slice(0, LINE_GRAPH_LIMITS.yAxisLabel) : "",
    yMin: typeof yMin === "string" || typeof yMin === "number" ? String(yMin ?? "") : "",
    yMax: typeof yMax === "string" || typeof yMax === "number" ? String(yMax ?? "") : "",
    yStep: typeof yStep === "string" || typeof yStep === "number" ? String(yStep ?? "") : "",
    showGrid: Boolean(showGrid),
    showMarkers: Boolean(showMarkers),
    showLegend: Boolean(showLegend),
    colors: sanitizeColors(colors),
    textSize: Object.keys(LINE_GRAPH_TEXT_SIZES).includes(textSize) ? textSize : "medium",
    font: FONT_IDS.includes(font) ? font : "inter",
    background: LINE_GRAPH_BACKGROUNDS.includes(background) ? background : "white",
    worksheet: Boolean(worksheet),
  };
}

const specimen = (slug, spec) => ({ slug, title: spec.title || "Line Graph", lineGraph: lineGraphSpec(spec) });

export const DEFAULT_LINE_GRAPH = lineGraphSpec({
  title: "Synthetic monthly temperature comparison",
  dataText: "Month,City A,City B\nJan,4,8\nFeb,6,9\nMar,10,12\nApr,15,16\nMay,19,20\nJun,23,24",
  xAxisLabel: "Month",
  yAxisLabel: "Temperature (°C)",
  showGrid: true,
  showMarkers: true,
  showLegend: true,
});

export const LINE_GRAPH_EXAMPLES = Object.freeze([
  specimen("sample", DEFAULT_LINE_GRAPH),
  specimen("revenue", {
    title: "Synthetic quarterly product revenue ($K)",
    dataText: "Quarter,Product North,Product South,Product East\nQ1,120,95,110\nQ2,140,105,125\nQ3,165,115,140\nQ4,190,130,160",
    xAxisLabel: "Quarter",
    yAxisLabel: "Revenue ($K)",
    colors: LINE_GRAPH_PALETTES[1].colors,
  }),
  specimen("missing-data", {
    title: "Synthetic daily sensor temperature readings",
    dataText: "Day,Sensor Alpha,Sensor Beta\nMon,12.5,18.2\nTue,15.0,\nWed,14.8,22.1\nThu,,25.4\nFri,18.2,24.0",
    xAxisLabel: "Day of week",
    yAxisLabel: "Reading (°C)",
    colors: LINE_GRAPH_PALETTES[2].colors,
  }),
  specimen("negative-values", {
    title: "Synthetic sub-zero climate monitoring",
    dataText: "Month,Station Alpha,Station Beta\nJan,-5.2,1.5\nFeb,-2.1,3.4\nMar,4.0,8.1\nApr,10.5,14.2\nMay,15.8,18.9",
    xAxisLabel: "Month",
    yAxisLabel: "Temperature (°C)",
    colors: LINE_GRAPH_PALETTES[3].colors,
  }),
].map(Object.freeze));

export const LINE_GRAPH_BLANKS = Object.freeze([
  specimen("worksheet", {
    title: "Line graph practice worksheet",
    dataText: "Month,Series 1,Series 2\nJan,10,20\nFeb,15,25\nMar,20,30\nApr,25,35\nMay,30,40\nJun,35,45",
    xAxisLabel: "Time period",
    yAxisLabel: "Value",
    colors: LINE_GRAPH_PALETTES[4].colors,
    worksheet: true,
  }),
].map(Object.freeze));

export const LINE_GRAPH_FIGURES = Object.freeze([
  specimen("parts", {
    title: "Anatomy of a line graph",
    dataText: "Month,Dataset A,Dataset B\nJan,5,10\nFeb,12,14\nMar,18,15\nApr,22,25\nMay,28,30",
    xAxisLabel: "Month",
    yAxisLabel: "Observation value",
    colors: LINE_GRAPH_PALETTES[0].colors,
  }),
].map(Object.freeze));

export const lineGraphBySlug = (slug) => [...LINE_GRAPH_EXAMPLES, ...LINE_GRAPH_BLANKS, ...LINE_GRAPH_FIGURES].find((item) => item.slug === slug);
export const lineGraphImage = (slug) => `/images/tools/line-graph-${slug}.svg`;

export function normalizeLineGraph(raw = {}) {
  const defaults = DEFAULT_LINE_GRAPH;
  const isObj = raw && typeof raw === "object";
  const palette = LINE_GRAPH_PALETTES.find((p) => p.id === raw?.palette) || LINE_GRAPH_PALETTES[0];
  return lineGraphSpec({
    title: isObj && typeof raw.title === "string" ? raw.title.slice(0, LINE_GRAPH_LIMITS.title) : defaults.title,
    dataText: isObj && typeof raw.dataText === "string" ? raw.dataText : (isObj && raw.dataText != null ? String(raw.dataText) : defaults.dataText),
    xAxisLabel: isObj && typeof raw.xAxisLabel === "string" ? raw.xAxisLabel.slice(0, LINE_GRAPH_LIMITS.xAxisLabel) : defaults.xAxisLabel,
    yAxisLabel: isObj && typeof raw.yAxisLabel === "string" ? raw.yAxisLabel.slice(0, LINE_GRAPH_LIMITS.yAxisLabel) : defaults.yAxisLabel,
    yMin: isObj && raw.yMin != null ? String(raw.yMin) : defaults.yMin,
    yMax: isObj && raw.yMax != null ? String(raw.yMax) : defaults.yMax,
    yStep: isObj && raw.yStep != null ? String(raw.yStep) : defaults.yStep,
    showGrid: isObj && raw.showGrid !== undefined ? Boolean(raw.showGrid) : defaults.showGrid,
    showMarkers: isObj && raw.showMarkers !== undefined ? Boolean(raw.showMarkers) : defaults.showMarkers,
    showLegend: isObj && raw.showLegend !== undefined ? Boolean(raw.showLegend) : defaults.showLegend,
    colors: Array.isArray(isObj ? raw.colors : undefined) ? raw.colors : palette.colors,
    textSize: isObj && Object.keys(LINE_GRAPH_TEXT_SIZES).includes(raw.textSize) ? raw.textSize : defaults.textSize,
    font: isObj && FONT_IDS.includes(raw.font) ? raw.font : defaults.font,
    background: isObj && LINE_GRAPH_BACKGROUNDS.includes(raw.background) ? raw.background : defaults.background,
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

function formatTick(val) {
  if (!Number.isFinite(val)) return "";
  if (val === 0 || Object.is(val, -0)) return "0";
  if (Math.abs(val) < 1e-4) return val.toExponential(2);
  const str = String(val);
  if (str.length <= 8 && !str.includes("e")) return str;
  return Number(val.toPrecision(6)).toString();
}

export function layoutLineGraph(state, measureText) {
  if (typeof measureText !== "function") throw new TypeError("layoutLineGraph requires measureText function");

  const spec = normalizeLineGraph(state);
  let calcResult;
  try {
    calcResult = calculateLineGraph(spec);
  } catch (error) {
    throw new TextFitError(error instanceof Error ? error.message : "The line graph data could not be processed.");
  }

  const scaleFactor = LINE_GRAPH_TEXT_SIZES[spec.textSize] || 1;
  const titleStyle = scaledStyle(BASE_STYLES.title, scaleFactor);
  const axisLabelStyle = scaledStyle(BASE_STYLES.axisLabel, scaleFactor);
  const tickStyle = scaledStyle(BASE_STYLES.tick, scaleFactor);
  const legendStyle = scaledStyle(BASE_STYLES.legend, scaleFactor);
  const worksheetStyle = scaledStyle(BASE_STYLES.worksheet, scaleFactor);
  const captionStyle = scaledStyle(BASE_STYLES.caption, scaleFactor);

  const canvasWidth = CANVAS_WIDTH;
  let currentY = MARGIN_TOP;

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

  let worksheetHeader = null;
  if (spec.worksheet) {
    const nameText = "Name: ______________________";
    const dateText = "Date: ______________";
    const dateWidth = widthOf(dateText, worksheetStyle, measureText);
    worksheetHeader = {
      nameLine: lineBlock({ text: nameText, x: MARGIN_X, top: currentY, style: worksheetStyle, color: TEXT_DARK, anchor: "start", measureText }),
      dateLine: lineBlock({ text: dateText, x: canvasWidth - MARGIN_X - dateWidth, top: currentY, style: worksheetStyle, color: TEXT_DARK, anchor: "start", measureText }),
    };
    currentY += worksheetStyle.lineSpacing + SECTION_GAP;
  }

  const yScale = calcResult.yScale;
  const yTicks = yScale.ticks;

  const formattedTicks = yTicks.map(formatTick);
  if (new Set(formattedTicks).size !== yTicks.length) {
    throw new TextFitError("Y-axis ticks cannot be formatted distinctly. Adjust Y scale bounds or step size.");
  }

  let maxYTickWidth = 0;
  formattedTicks.forEach((tickStr) => {
    const w = widthOf(tickStr, tickStyle, measureText);
    if (w > maxYTickWidth) maxYTickWidth = w;
  });

  let yAxisLabelWidth = 0;
  let yAxisLabelMeasuredWidth = 0;
  if (spec.yAxisLabel.trim()) {
    yAxisLabelMeasuredWidth = widthOf(spec.yAxisLabel.trim(), axisLabelStyle, measureText);
    yAxisLabelWidth = axisLabelStyle.lineSpacing + 10;
  }

  const labels = calcResult.labels;
  const categoryCount = labels.length;

  const categoryWidths = labels.map((label) => widthOf(label, tickStyle, measureText));
  const firstLabelWidth = categoryWidths[0] || 0;
  const lastLabelWidth = categoryWidths[categoryWidths.length - 1] || 0;

  let yAxisX = roundCoordinate(Math.max(MARGIN_X + yAxisLabelWidth + maxYTickWidth + 10, 12 + firstLabelWidth / 2));
  let chartRight = roundCoordinate(Math.min(canvasWidth - MARGIN_X - 16, canvasWidth - 12 - lastLabelWidth / 2));

  if (chartRight - yAxisX < 180) {
    throw new TextFitError("The category labels or axis ticks are too wide to fit within the chart. Shorten label text.");
  }

  const chartWidth = chartRight - yAxisX;

  let baseChartHeight = roundCoordinate(260 * scaleFactor);

  if (yTicks.length > 1) {
    const minTickSpacing = tickStyle.lineSpacing + 2;
    const ySpanVal = yScale.max - yScale.min;
    let minProjectedSpacing = Infinity;
    for (let i = 0; i < yTicks.length - 1; i++) {
      const stepVal = yTicks[i + 1] - yTicks[i];
      const spacingRatio = stepVal / ySpanVal;
      if (spacingRatio < minProjectedSpacing) minProjectedSpacing = spacingRatio;
    }
    if (minProjectedSpacing > 0) {
      const requiredHeightForSpacing = Math.ceil(minTickSpacing / minProjectedSpacing);
      if (requiredHeightForSpacing > baseChartHeight) {
        baseChartHeight = requiredHeightForSpacing;
      }
    }
  }

  if (yAxisLabelMeasuredWidth > 0) {
    if (yAxisLabelMeasuredWidth > baseChartHeight) {
      baseChartHeight = yAxisLabelMeasuredWidth;
    }
  }

  const chartHeight = roundCoordinate(baseChartHeight);
  let chartTop = currentY;
  if (yAxisLabelMeasuredWidth > 0 && !spec.title.trim()) {
    const requiredTopPad = Math.ceil(yAxisLabelMeasuredWidth / 2 + 10);
    if (chartTop < requiredTopPad) {
      chartTop = requiredTopPad;
    }
  }

  let yAxisLabelBlock = null;
  if (spec.yAxisLabel.trim()) {
    yAxisLabelBlock = lineBlock({
      text: spec.yAxisLabel.trim(),
      x: roundCoordinate(MARGIN_X + axisLabelStyle.lineSpacing / 2),
      top: roundCoordinate(chartTop + chartHeight / 2),
      style: axisLabelStyle,
      color: TEXT_DARK,
      anchor: "middle",
      measureText,
    });
  }

  const chartBottom = roundCoordinate(chartTop + chartHeight);

  const rawCategoryLabels = labels.map((label, index) => {
    const w = categoryWidths[index];
    if (w > chartWidth) {
      throw new TextFitError(`Category label "${label}" is too wide to fit on the X-axis.`);
    }
    const cx = categoryCount > 1
      ? yAxisX + index * (chartWidth / (categoryCount - 1))
      : yAxisX + chartWidth / 2;
    return { index, label, width: w, cx: roundCoordinate(cx) };
  });

  let stride = 1;
  while (stride <= rawCategoryLabels.length) {
    let fit = true;
    for (let i = 0; i < rawCategoryLabels.length - stride; i += stride) {
      const current = rawCategoryLabels[i];
      const next = rawCategoryLabels[i + stride];
      if (next.cx - current.cx < (current.width / 2 + next.width / 2 + 6)) {
        fit = false;
        break;
      }
    }
    if (fit) break;
    stride += 1;
  }

  const categoryTicks = [];
  rawCategoryLabels.forEach((lbl, idx) => {
    const isPrimary = idx % stride === 0;
    const block = isPrimary
      ? lineBlock({
          text: lbl.label,
          x: lbl.cx,
          top: chartBottom + 6,
          style: tickStyle,
          color: TEXT_MUTED,
          anchor: "middle",
          measureText,
        })
      : null;

    categoryTicks.push({
      index: idx,
      cx: lbl.cx,
      label: lbl.label,
      showText: isPrimary,
      block,
      width: lbl.width,
    });
  });

  const tickLabelHeight = tickStyle.lineSpacing + 6;
  currentY = chartBottom + tickLabelHeight + 6;

  let strideDisclosureBlock = null;
  if (stride > 1) {
    strideDisclosureBlock = lineBlock({
      text: `Showing 1 of every ${stride} category labels`,
      x: yAxisX + chartWidth / 2,
      top: currentY,
      style: captionStyle,
      color: TEXT_MUTED,
      anchor: "middle",
      measureText,
    });
    currentY += strideDisclosureBlock.height + 6;
  }

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

  const ySpan = yScale.max - yScale.min;
  const yTicksBlocks = yTicks.map((tickVal, index) => {
    const yRatio = (tickVal - yScale.min) / ySpan;
    const y = roundCoordinate(chartBottom - yRatio * chartHeight);
    const textStr = formattedTicks[index];
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

  const series = calcResult.series;
  const seriesList = spec.worksheet
    ? []
    : series.map((s, seriesIndex) => {
        const color = spec.colors[seriesIndex % spec.colors.length];
        const rawValues = s.values;

        const segments = [];
        let currentSegment = [];

        rawValues.forEach((val, labelIndex) => {
          if (val !== null && Number.isFinite(val)) {
            const cx = categoryTicks[labelIndex].cx;
            const yRatio = (val - yScale.min) / ySpan;
            const cy = roundCoordinate(chartBottom - yRatio * chartHeight);
            currentSegment.push({
              index: labelIndex,
              label: labels[labelIndex],
              value: val,
              cx,
              cy,
            });
          } else {
            if (currentSegment.length > 0) {
              segments.push(currentSegment);
              currentSegment = [];
            }
          }
        });
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
        }

        const paths = segments
          .filter((seg) => seg.length >= 2)
          .map((seg) => {
            const d = seg.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.cx},${p.cy}`).join(" ");
            return { d, points: seg };
          });

        const allPoints = segments.flat();
        const singletons = segments.filter((seg) => seg.length === 1).map((seg) => seg[0]);

        return {
          name: s.name,
          color,
          segments,
          paths,
          allPoints,
          singletons,
        };
      });

  let legendBlock = null;
  if (!spec.worksheet && spec.showLegend && series.length > 0) {
    const legendItems = seriesList.map((s) => {
      const itemWidth = widthOf(s.name, legendStyle, measureText) + 20;
      if (itemWidth > chartWidth) {
        throw new TextFitError(`Series name "${s.name}" is too long to fit in the legend. Shorten the series name.`);
      }
      return { name: s.name, color: s.color, width: itemWidth };
    });

    const totalLegendWidth = legendItems.reduce((sum, item) => sum + item.width + 16, -16);
    let legendRowTop = currentY;

    if (totalLegendWidth <= chartWidth) {
      let itemX = yAxisX + (chartWidth - totalLegendWidth) / 2;
      const items = legendItems.map((item) => {
        const x = roundCoordinate(itemX);
        const block = lineBlock({
          text: item.name,
          x: x + 20,
          top: legendRowTop,
          style: legendStyle,
          color: TEXT_DARK,
          anchor: "start",
          measureText,
        });
        itemX += item.width + 16;
        return { name: item.name, color: item.color, badgeX: x, badgeY: legendRowTop + legendStyle.lineSpacing / 2, block };
      });
      legendBlock = { items, height: legendStyle.lineSpacing };
      currentY += legendStyle.lineSpacing + SECTION_GAP;
    } else {
      const rows = [];
      let currentRow = [];
      let currentLineWidth = 0;

      legendItems.forEach((item) => {
        if (currentRow.length > 0 && currentLineWidth + item.width + 16 > chartWidth) {
          rows.push(currentRow);
          currentRow = [item];
          currentLineWidth = item.width;
        } else {
          currentRow.push(item);
          currentLineWidth += item.width + (currentRow.length > 1 ? 16 : 0);
        }
      });
      if (currentRow.length > 0) rows.push(currentRow);

      const items = [];
      rows.forEach((row, rowIndex) => {
        const rowLineWidth = row.reduce((sum, item) => sum + item.width + 16, -16);
        let itemX = yAxisX + (chartWidth - rowLineWidth) / 2;
        const rowTop = legendRowTop + rowIndex * (legendStyle.lineSpacing + 4);

        row.forEach((item) => {
          const x = roundCoordinate(itemX);
          const block = lineBlock({
            text: item.name,
            x: x + 20,
            top: rowTop,
            style: legendStyle,
            color: TEXT_DARK,
            anchor: "start",
            measureText,
          });
          items.push({ name: item.name, color: item.color, badgeX: x, badgeY: rowTop + legendStyle.lineSpacing / 2, block });
          itemX += item.width + 16;
        });
      });

      const totalLegendHeight = rows.length * (legendStyle.lineSpacing + 4) - 4;
      legendBlock = { items, height: totalLegendHeight };
      currentY += totalLegendHeight + SECTION_GAP;
    }
  }

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
    throw new TextFitError("The layout exceeds maximum canvas height. Shorten labels or reduce series count.");
  }

  // Complete Bounds Assertions (Text blocks, rotated Y title, legend badges, credit link)
  const marginMinX = 0;
  const marginMaxX = canvasWidth;

  if (titleBlock) {
    if (titleBlock.top < 0 || titleBlock.top + titleBlock.height > totalHeight) throw new TextFitError("Title block exceeds vertical canvas bounds.");
  }
  if (yAxisLabelBlock) {
    const rotatedHalfWidth = yAxisLabelBlock.width / 2;
    const rotatedMinY = yAxisLabelBlock.lines[0].y - rotatedHalfWidth;
    const rotatedMaxY = yAxisLabelBlock.lines[0].y + rotatedHalfWidth;
    if (rotatedMinY < 0 || rotatedMaxY > totalHeight) {
      throw new TextFitError("Y-axis label is too long to fit vertically on the canvas. Shorten Y-axis label.");
    }
    const rotatedMinX = yAxisLabelBlock.x - axisLabelStyle.lineSpacing / 2;
    if (rotatedMinX < marginMinX) throw new TextFitError("Y-axis label exceeds horizontal left canvas bound.");
  }
  if (xAxisLabelBlock) {
    if (xAxisLabelBlock.top + xAxisLabelBlock.height > totalHeight) throw new TextFitError("X-axis label exceeds vertical canvas bounds.");
  }
  if (legendBlock) {
    legendBlock.items.forEach((item) => {
      if (item.badgeX < marginMinX || item.badgeX + item.block.width + 20 > marginMaxX) {
        throw new TextFitError("Legend badge or text exceeds horizontal canvas bounds.");
      }
    });
  }
  if (creditBlock) {
    if (creditBlock.top + creditBlock.height > totalHeight) throw new TextFitError("Credit text exceeds vertical canvas bounds.");
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
    strideDisclosureBlock,
    yAxisX,
    chartRight,
    chartTop,
    chartBottom,
    chartWidth,
    chartHeight,
    yScale,
    yTicksBlocks,
    categoryTicks,
    stride,
    seriesList,
    legendBlock,
    creditBlock,
    creditUrl: CREDIT_URL,
    showGrid: spec.showGrid,
    showMarkers: spec.showMarkers,
    worksheet: spec.worksheet,
  };
}
