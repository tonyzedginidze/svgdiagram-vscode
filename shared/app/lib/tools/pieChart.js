import { ACCENT_PALETTE, DEFAULT_PALETTE, FONT_IDS, FONT_WEIGHTS, TextFitError, centeredBaseline, contrastRatio, roundCoordinate, wrapLines } from "@svgdiagram/diagram/web";
import { PIE_CHART_LIMITS as MATH_LIMITS, calculatePieChart, parsePieChartData, pieSlicePath } from "./pieChartMath.js";

const TEXT_DARK = "#0f172a";
const TEXT_MUTED = "#64748b";
const CREDIT_TEXT = "Made with svgdiagram.ai";

export const PIE_CHART_LIMITS = Object.freeze({
  title: 80,
  dataText: MATH_LIMITS.inputLength,
  rows: MATH_LIMITS.rows,
  labelLength: MATH_LIMITS.labelLength,
});

export const PIE_CHART_PALETTES = Object.freeze([
  {
    id: "classic",
    label: "Classic",
    colors: Object.freeze([DEFAULT_PALETTE[0], "#3b82f6", "#60a5fa", "#93c5fd", "#1d4ed8", "#1e40af", "#64748b", "#94a3b8"]),
  },
  ...ACCENT_PALETTE.map((accent) =>
    Object.freeze({
      id: accent.id,
      label: accent.id.charAt(0).toUpperCase() + accent.id.slice(1),
      colors: Object.freeze([accent.color, "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]),
    })
  ),
].map(Object.freeze));

export const PIE_CHART_TYPES = Object.freeze(["pie", "donut"]);
export const PIE_CHART_TEXT_SIZES = Object.freeze({ small: 0.9, medium: 1, large: 1.15 });
export const PIE_CHART_BACKGROUNDS = Object.freeze(["white", "transparent"]);

const CANVAS_WIDTH = 720;
const MARGIN_X = 36;
const MARGIN_TOP = 24;
const MARGIN_BOTTOM = 24;
const SECTION_GAP = 16;

const BASE_STYLES = Object.freeze({
  title: { size: 18, weight: 700, lineSpacing: 24 },
  sliceLabel: { size: 11, weight: 700, lineSpacing: 15 },
  donutCenterLabel: { size: 11, weight: 400, lineSpacing: 15 },
  donutCenterValue: { size: 16, weight: 700, lineSpacing: 20 },
  legendLabel: { size: 12, weight: 700, lineSpacing: 16 },
  legendValue: { size: 12, weight: 400, lineSpacing: 16 },
  caption: { size: 11, weight: 400, lineSpacing: 15 },
  worksheet: { size: 12, weight: 700, lineSpacing: 16 },
});

const measuredWeight = (weight) => (weight >= 600 ? FONT_WEIGHTS.bold : FONT_WEIGHTS.regular);

const scaledStyle = (style, factor) => {
  const size = Math.round(style.size * factor * 2) / 2;
  const lineSpacing = Math.max(size + 2, Math.round(style.lineSpacing * factor));
  return { size, weight: measuredWeight(style.weight), lineSpacing };
};

const widthOf = (text, style, measureText) => measureText(text, { size: style.size, weight: measuredWeight(style.weight) });

const colorsOf = (colors) => {
  const fallback = PIE_CHART_PALETTES[0].colors;
  if (!Array.isArray(colors) || colors.length === 0) return [...fallback];
  const valid = colors.filter((color) => typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color));
  return valid.length > 0 ? valid : [...fallback];
};

export function pieChartSpec({
  title = "",
  chartType = "pie",
  donutRatio = 0.5,
  dataText = "",
  showPercentages = true,
  showValues = true,
  colors = PIE_CHART_PALETTES[0].colors,
  textSize = "medium",
  font = "inter",
  background = "white",
  worksheet = false,
} = {}) {
  return {
    title: typeof title === "string" ? title.slice(0, PIE_CHART_LIMITS.title) : "",
    chartType: PIE_CHART_TYPES.includes(chartType) ? chartType : "pie",
    donutRatio: typeof donutRatio === "number" && Number.isFinite(donutRatio) ? Math.min(0.75, Math.max(0.25, donutRatio)) : 0.5,
    dataText: typeof dataText === "string" ? dataText : "",
    showPercentages: Boolean(showPercentages),
    showValues: Boolean(showValues),
    colors: colorsOf(colors),
    textSize: Object.keys(PIE_CHART_TEXT_SIZES).includes(textSize) ? textSize : "medium",
    font: FONT_IDS.includes(font) ? font : "inter",
    background: PIE_CHART_BACKGROUNDS.includes(background) ? background : "white",
    worksheet: Boolean(worksheet),
  };
}

const specimen = (slug, spec) => ({ slug, title: spec.title || "Pie Chart", pieChart: pieChartSpec(spec) });

export const DEFAULT_PIE_CHART = pieChartSpec({
  title: "Favorite School Subjects",
  chartType: "pie",
  donutRatio: 0.5,
  dataText: "Math, 28\nScience, 24\nEnglish, 18\nHistory, 14\nArt, 16",
  showPercentages: true,
  showValues: true,
  colors: PIE_CHART_PALETTES[1].colors,
});

export const PIE_CHART_EXAMPLES = Object.freeze([
  specimen("sample", DEFAULT_PIE_CHART),
  specimen("household-budget", {
    title: "Monthly Household Budget",
    chartType: "pie",
    dataText: "Housing, 1200\nFood, 500\nUtilities, 250\nTransportation, 300\nSavings, 400\nEntertainment, 150",
    showPercentages: true,
    showValues: true,
    colors: PIE_CHART_PALETTES[0].colors,
  }),
  specimen("browser-market-share", {
    title: "Classroom Web Browsers (Sample Data)",
    chartType: "donut",
    donutRatio: 0.55,
    dataText: "Chrome, 65\nSafari, 18\nEdge, 6\nFirefox, 4\nOpera, 3\nOther, 4",
    showPercentages: true,
    showValues: true,
    colors: PIE_CHART_PALETTES[4].colors,
  }),
].map(Object.freeze));

const blank = (spec) =>
  specimen(spec.slug, {
    colors: PIE_CHART_PALETTES[5].colors,
    showPercentages: false,
    showValues: false,
    ...spec,
    worksheet: true,
  });

export const PIE_CHART_BLANKS = Object.freeze([
  blank({
    slug: "blank-4-slice",
    title: "4-Category Pie Chart Worksheet",
    chartType: "pie",
    dataText: "Category A, 25\nCategory B, 25\nCategory C, 25\nCategory D, 25",
  }),
  blank({
    slug: "blank-6-slice-donut",
    title: "6-Category Donut Chart Worksheet",
    chartType: "donut",
    donutRatio: 0.5,
    dataText: "Section 1, 10\nSection 2, 10\nSection 3, 10\nSection 4, 10\nSection 5, 10\nSection 6, 10",
  }),
].map(Object.freeze));

export const PIE_CHART_FIGURES = Object.freeze([
  specimen("parts", {
    title: "Parts of a Pie Chart",
    chartType: "pie",
    dataText: "Slice A, 40\nSlice B, 30\nSlice C, 20\nSlice D, 10",
    showPercentages: true,
    showValues: true,
    colors: PIE_CHART_PALETTES[3].colors,
  }),
].map(Object.freeze));

export const pieChartBySlug = (slug) =>
  [...PIE_CHART_EXAMPLES, ...PIE_CHART_BLANKS, ...PIE_CHART_FIGURES].find((item) => item.slug === slug);

export const pieChartImage = (slug) => `/images/tools/pie-chart-${slug}.svg`;

export function normalizePieChart(raw = {}) {
  const defaults = DEFAULT_PIE_CHART;
  const isObj = raw && typeof raw === "object";
  return pieChartSpec({
    title: isObj && typeof raw.title === "string" ? raw.title.slice(0, PIE_CHART_LIMITS.title) : defaults.title,
    chartType: isObj && PIE_CHART_TYPES.includes(raw.chartType) ? raw.chartType : defaults.chartType,
    donutRatio: isObj && typeof raw.donutRatio === "number" ? raw.donutRatio : defaults.donutRatio,
    dataText: isObj && typeof raw.dataText === "string" ? raw.dataText : (isObj && raw.dataText != null ? String(raw.dataText) : defaults.dataText),
    showPercentages: isObj && raw.showPercentages !== undefined ? Boolean(raw.showPercentages) : defaults.showPercentages,
    showValues: isObj && raw.showValues !== undefined ? Boolean(raw.showValues) : defaults.showValues,
    colors: colorsOf(isObj ? raw.colors : undefined),
    textSize: isObj && Object.keys(PIE_CHART_TEXT_SIZES).includes(raw.textSize) ? raw.textSize : defaults.textSize,
    font: isObj && FONT_IDS.includes(raw.font) ? raw.font : defaults.font,
    background: isObj && PIE_CHART_BACKGROUNDS.includes(raw.background) ? raw.background : defaults.background,
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
    style: { size: style.size, weight: measuredWeight(style.weight), lineSpacing: style.lineSpacing },
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
    style: { size: style.size, weight: measuredWeight(style.weight), lineSpacing: style.lineSpacing },
    color,
    lines: [{ text, x: roundCoordinate(x), y: centeredBaseline(top, style) }],
  };
}

function formatNumber(num) {
  if (num === 0) return "0";
  if (Math.abs(num) < 1e-10) return num.toExponential(4);
  const str = String(num);
  if (str.length <= 8 && !str.includes("e")) return str;
  return String(Number(num.toPrecision(6)));
}

function pointInSector(px, py, cx, cy, innerR, outerR, startAngle, endAngle) {
  const dx = px - cx;
  const dy = py - cy;
  const distSq = dx * dx + dy * dy;
  const minR = innerR > 0 ? innerR + 2 : 0;
  const maxR = outerR - 2;

  if (minR > 0 && distSq < minR * minR) return false;
  if (distSq > maxR * maxR) return false;

  let angle = Math.atan2(dx, -dy);
  if (angle < 0) angle += Math.PI * 2;

  const span = endAngle - startAngle;
  if (span >= Math.PI * 2 - 1e-6) return true;

  let diff = angle - startAngle;
  while (diff < 0) diff += Math.PI * 2;
  while (diff >= Math.PI * 2) diff -= Math.PI * 2;

  return diff <= span;
}

function sliceTextFitsSector(cx, cy, textX, textY, textW, textH, innerR, outerR, startAngle, endAngle) {
  const halfW = textW / 2;
  const halfH = textH / 2;
  const corners = [
    [textX - halfW, textY - halfH],
    [textX + halfW, textY - halfH],
    [textX - halfW, textY + halfH],
    [textX + halfW, textY + halfH],
  ];
  return corners.every(([px, py]) => pointInSector(px, py, cx, cy, innerR, outerR, startAngle, endAngle));
}

export function layoutPieChart(state, measureText) {
  const spec = normalizePieChart(state);

  const parsed = parsePieChartData(spec.dataText);
  if (parsed.errors.length > 0) {
    throw new TextFitError(parsed.errors[0]);
  }

  const calculated = calculatePieChart(parsed.rows);
  if (!calculated.valid) {
    throw new TextFitError(calculated.errors[0] || "Invalid pie chart data.");
  }

  const scaleFactor = PIE_CHART_TEXT_SIZES[spec.textSize] || 1;
  const titleStyle = scaledStyle(BASE_STYLES.title, scaleFactor);
  const sliceLabelStyle = scaledStyle(BASE_STYLES.sliceLabel, scaleFactor);
  const donutCenterLabelStyle = scaledStyle(BASE_STYLES.donutCenterLabel, scaleFactor);
  const donutCenterValueStyle = scaledStyle(BASE_STYLES.donutCenterValue, scaleFactor);
  const legendLabelStyle = scaledStyle(BASE_STYLES.legendLabel, scaleFactor);
  const legendValueStyle = scaledStyle(BASE_STYLES.legendValue, scaleFactor);
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
    const dateWidth = widthOf(dateText, worksheetStyle, measureText);
    worksheetHeader = {
      nameLine: lineBlock({ text: nameText, x: MARGIN_X, top: currentY, style: worksheetStyle, color: TEXT_DARK, anchor: "start", measureText }),
      dateLine: lineBlock({ text: dateText, x: canvasWidth - MARGIN_X - dateWidth, top: currentY, style: worksheetStyle, color: TEXT_DARK, anchor: "start", measureText }),
    };
    currentY += worksheetStyle.lineSpacing + SECTION_GAP;
  }

  const chartTop = currentY;

  // Chart circle geometry
  const chartOuterRadius = roundCoordinate(130 * Math.min(1.15, Math.max(0.85, scaleFactor)));
  const isDonut = spec.chartType === "donut";
  const chartInnerRadius = isDonut ? roundCoordinate(chartOuterRadius * spec.donutRatio) : 0;
  const chartCenterX = roundCoordinate(MARGIN_X + chartOuterRadius + 20);

  // Measure Legend items first to determine total content height and value column alignment
  const legendX = roundCoordinate(chartCenterX + chartOuterRadius + 36);
  const legendMaxWidth = roundCoordinate(canvasWidth - legendX - MARGIN_X);

  if (legendMaxWidth < 120) {
    throw new TextFitError("The canvas width is too narrow to display the chart legend.");
  }

  // Pre-calculate legend values to reserve adequate width for value column
  const legendValues = calculated.slices.map((slice) => {
    if (spec.worksheet) return "";
    const parts = [];
    if (spec.showValues) parts.push(formatNumber(slice.value));
    if (spec.showPercentages) parts.push(`(${slice.percent.toFixed(1)}%)`);
    return parts.join(" ");
  });

  const maxValueWidth = legendValues.reduce((max, str) => {
    if (!str) return max;
    const w = widthOf(str, legendValueStyle, measureText);
    return Math.max(max, w);
  }, 0);

  const swatchSize = 12;
  const swatchGap = 10;
  const valueGap = maxValueWidth > 0 ? 12 : 0;
  const labelMaxWidth = Math.max(40, legendMaxWidth - (swatchSize + swatchGap) - maxValueWidth - valueGap);

  let legendY = 0;
  const itemGap = 8;
  const palette = spec.colors;

  const legendItems = calculated.slices.map((slice, index) => {
    const color = spec.worksheet ? "none" : palette[index % palette.length];
    const itemTop = legendY;

    const swatchX = legendX;
    const swatchY = itemTop + Math.round((legendLabelStyle.lineSpacing - swatchSize) / 2);
    const labelX = swatchX + swatchSize + swatchGap;

    const labelBlock = textBlock({
      text: slice.label,
      x: labelX,
      top: itemTop,
      maxWidth: labelMaxWidth,
      style: legendLabelStyle,
      color: TEXT_DARK,
      anchor: "start",
      measureText,
    });

    const valueStr = legendValues[index];
    let valueBlock = null;
    if (valueStr) {
      valueBlock = lineBlock({
        text: valueStr,
        x: legendX + legendMaxWidth,
        top: itemTop,
        style: legendValueStyle,
        color: TEXT_MUTED,
        anchor: "end",
        measureText,
      });
    }

    const itemHeight = Math.max(labelBlock.height, valueBlock ? valueBlock.height : legendLabelStyle.lineSpacing);
    legendY += itemHeight + itemGap;

    return {
      index,
      label: slice.label,
      color,
      swatchX,
      swatchY,
      swatchSize,
      labelBlock,
      valueBlock,
    };
  });

  const legendHeight = legendY > 0 ? legendY - itemGap : 0;
  const chartDiameter = chartOuterRadius * 2;
  const contentHeight = Math.max(chartDiameter, legendHeight);
  const chartCenterY = roundCoordinate(chartTop + contentHeight / 2);

  // Slices layout & exact rectangular corner sector fit + contrast check
  const slices = calculated.slices.map((slice, index) => {
    const color = spec.worksheet ? "none" : palette[index % palette.length];
    const path = pieSlicePath(chartCenterX, chartCenterY, chartOuterRadius, chartInnerRadius, slice.startAngle, slice.endAngle);
    const span = slice.endAngle - slice.startAngle;

    let sliceText = null;
    let textX = 0;
    let textY = 0;
    let textColor = "#ffffff";

    if (!spec.worksheet && spec.showPercentages && span > 0) {
      const candidateStr = `${slice.percent.toFixed(1)}%`;
      const textW = widthOf(candidateStr, sliceLabelStyle, measureText);
      const textH = sliceLabelStyle.lineSpacing;

      const midR = chartInnerRadius > 0 ? (chartOuterRadius + chartInnerRadius) / 2 : chartOuterRadius * 0.65;
      const candidateX = roundCoordinate(chartCenterX + midR * Math.sin(slice.midAngle));
      const candidateY = roundCoordinate(chartCenterY - midR * Math.cos(slice.midAngle));

      // Verify exact 4 corners of text bounding box fall inside slice sector
      if (sliceTextFitsSector(chartCenterX, chartCenterY, candidateX, candidateY, textW, textH, chartInnerRadius, chartOuterRadius, slice.startAngle, slice.endAngle)) {
        sliceText = candidateStr;
        textX = candidateX;
        textY = candidateY;
        const whiteContrast = contrastRatio(color, "#ffffff");
        textColor = whiteContrast >= 3 ? "#ffffff" : TEXT_DARK;
      }
    }

    return {
      index,
      label: slice.label,
      value: slice.value,
      percent: slice.percent,
      startAngle: slice.startAngle,
      endAngle: slice.endAngle,
      midAngle: slice.midAngle,
      color,
      path,
      sliceText,
      textX,
      textY,
      textColor,
    };
  });

  // Donut center total metric (omit if measured block cannot fit inside hole at normal font size)
  let donutCenterText = null;
  if (isDonut && !spec.worksheet && chartInnerRadius >= 28) {
    const totalStr = formatNumber(calculated.total);
    const valWidth = widthOf(totalStr, donutCenterValueStyle, measureText);
    const lblWidth = widthOf("Total", donutCenterLabelStyle, measureText);
    const maxHoleTextWidth = chartInnerRadius * 1.6;
    const totalBlockHeight = donutCenterLabelStyle.lineSpacing + donutCenterValueStyle.lineSpacing;

    if (valWidth <= maxHoleTextWidth && lblWidth <= maxHoleTextWidth && totalBlockHeight <= chartInnerRadius * 1.8) {
      donutCenterText = {
        label: lineBlock({
          text: "Total",
          x: chartCenterX,
          top: chartCenterY - donutCenterLabelStyle.lineSpacing,
          style: donutCenterLabelStyle,
          color: TEXT_MUTED,
          anchor: "middle",
          measureText,
        }),
        value: lineBlock({
          text: totalStr,
          x: chartCenterX,
          top: chartCenterY + 2,
          style: donutCenterValueStyle,
          color: TEXT_DARK,
          anchor: "middle",
          measureText,
        }),
      };
    }
  }

  // Update legend items vertical positions
  legendItems.forEach((item) => {
    item.swatchY = roundCoordinate(chartTop + item.swatchY);
    item.labelBlock.top = roundCoordinate(chartTop + item.labelBlock.top);
    item.labelBlock.lines.forEach((line, idx) => {
      line.y = centeredBaseline(item.labelBlock.top + idx * legendLabelStyle.lineSpacing, legendLabelStyle);
    });
    if (item.valueBlock) {
      item.valueBlock.top = roundCoordinate(chartTop + item.valueBlock.top);
      item.valueBlock.lines.forEach((line) => {
        line.y = centeredBaseline(item.valueBlock.top, legendValueStyle);
      });
    }
  });

  currentY = chartTop + contentHeight + SECTION_GAP;

  // Credit Line
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
  if (totalHeight > 900) {
    throw new TextFitError("The diagram layout exceeds maximum canvas height. Reduce categories or shorten labels.");
  }

  return {
    width: canvasWidth,
    height: totalHeight,
    background: spec.background === "white" ? "#ffffff" : "transparent",
    fontId: spec.font,
    titleBlock,
    worksheetHeader,
    chartCenterX,
    chartCenterY,
    chartOuterRadius,
    chartInnerRadius,
    chartType: spec.chartType,
    slices,
    donutCenterText,
    legendItems,
    creditBlock,
    sliceLabelStyle,
    total: calculated.total,
    worksheet: spec.worksheet,
  };
}
