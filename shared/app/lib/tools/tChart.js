import { FONT_IDS, FONT_WEIGHTS, TextFitError, centeredBaseline, contrastRatio, mixHex, roundCoordinate, wrapLines } from "@svgdiagram/diagram/web";

const TEXT_DARK = "#0f172a";
const TEXT_BODY = "#334155";
const TEXT_MUTED = "#64748b";
const RULE = "#cbd5e1";
const STEM = "#475569";
const GUIDE = "#94a3b8";

export const T_CHART_LIMITS = Object.freeze({ title: 80, heading: 40, cell: 140, minRows: 1, maxRows: 12 });

export const T_CHART_PALETTES = Object.freeze([
  { id: "classic", label: "Classic", colors: ["#2563eb", "#0d9488"] },
  { id: "emerald", label: "Emerald", colors: ["#059669", "#047857"] },
  { id: "violet", label: "Violet", colors: ["#7c3aed", "#c026d3"] },
  { id: "amber", label: "Amber", colors: ["#d97706", "#ea580c"] },
  { id: "gray", label: "Gray", colors: ["#334155", "#64748b"] },
].map(Object.freeze));

export const T_CHART_FILLS = Object.freeze({ tint: 0.12, outline: 0 });
export const T_CHART_TEXT_SIZES = Object.freeze({ small: 0.9, medium: 1, large: 1.15 });
export const T_CHART_BACKGROUNDS = Object.freeze(["white", "transparent"]);

const CANVAS_MIN = 680;
const MARGIN = 36;
const CONTENT_INSET = 80;
const TOP = 24;
const BOTTOM = 20;
const GUTTER = 14;
const HEADER_PAD = 12;
const ROW_PAD = 10;
const MIN_HEADER = 44;
const MIN_ROW = 36;
const MIN_WRITE = 48;
const SECTION_GAP = 16;
const CREDIT = "Made with svgdiagram.ai";
const LINE_INK = 5;

const BASE_STYLES = Object.freeze({
  title: { size: 20, weight: 700, lineSpacing: 26 },
  heading: { size: 16, weight: 700, lineSpacing: 20 },
  cell: { size: 13, weight: 400, lineSpacing: 18 },
  small: { size: 11, weight: 400, lineSpacing: 15 },
  worksheet: { size: 12, weight: 600, lineSpacing: 16 },
});

const even = (value) => Math.ceil(value / 2) * 2;
const measuredWeight = (weight) => (weight >= 600 ? FONT_WEIGHTS.bold : FONT_WEIGHTS.regular);
const scaled = (style, factor) => {
  const size = Math.round(style.size * factor * 2) / 2;
  const lineSpacing = Math.max(size, Math.round(style.lineSpacing * factor) + Math.round(LINE_INK * factor));
  return { size, weight: style.weight, lineSpacing };
};
const widthOf = (text, style, measureText) => measureText(text, { size: style.size, weight: measuredWeight(style.weight) });

const rowOf = (row) => ({
  left: typeof row?.left === "string" ? row.left.slice(0, T_CHART_LIMITS.cell) : "",
  right: typeof row?.right === "string" ? row.right.slice(0, T_CHART_LIMITS.cell) : "",
});

const chart = ({
  title = "",
  leftHeading = "",
  rightHeading = "",
  rows = [{ left: "", right: "" }],
  colors = T_CHART_PALETTES[0].colors,
  fill = "tint",
  textSize = "medium",
  font = "inter",
  background = "white",
  worksheet = false,
} = {}) => ({
  title,
  leftHeading,
  rightHeading,
  rows: (Array.isArray(rows) && rows.length ? rows : [{ left: "", right: "" }]).slice(0, T_CHART_LIMITS.maxRows).map(rowOf),
  colors: [...colors].slice(0, 2),
  fill,
  textSize,
  font,
  background,
  worksheet: Boolean(worksheet),
});

const specimen = (slug, spec) => ({ slug, title: spec.title || spec.leftHeading || "T-chart", chart: chart(spec) });

export const DEFAULT_T_CHART = chart({
  title: "City and country life",
  leftHeading: "City",
  rightHeading: "Country",
  rows: [
    { left: "Buses and trains", right: "Open fields" },
    { left: "Tall buildings", right: "Houses and farms" },
    { left: "Busy streets", right: "Quiet roads" },
    { left: "Shops close together", right: "Shops farther apart" },
  ],
});

export const T_CHART_EXAMPLES = Object.freeze([
  specimen("city-country", DEFAULT_T_CHART),
  specimen("pros-cons", {
    title: "Group projects",
    leftHeading: "Pros",
    rightHeading: "Cons",
    rows: [
      { left: "Share the work", right: "Harder to schedule" },
      { left: "Hear other ideas", right: "Uneven effort" },
      { left: "Practice explaining", right: "Disagreements take time" },
    ],
  }),
  specimen("fact-opinion", {
    title: "Talking about a story",
    leftHeading: "Fact",
    rightHeading: "Opinion",
    rows: [
      { left: "The story has three chapters", right: "The ending feels hopeful" },
      { left: "The main character is a baker", right: "The baker is brave" },
      { left: "A storm arrives in chapter two", right: "The storm is the best part" },
    ],
  }),
  specimen("before-after", {
    title: "Revising a sentence",
    leftHeading: "Before",
    rightHeading: "After",
    rows: [
      { left: "The dog ran.", right: "The wet dog raced across the yard." },
      { left: "It was fun.", right: "Everyone laughed at the mud." },
    ],
  }),
].map(Object.freeze));

const blank = (spec) => chart({ fill: "outline", colors: T_CHART_PALETTES[4].colors, worksheet: true, ...spec, worksheet: true });

export const T_CHART_BLANKS = Object.freeze([
  specimen("blank", blank({
    title: "T-chart worksheet",
    leftHeading: "",
    rightHeading: "",
    rows: Array.from({ length: 6 }, () => ({ left: "", right: "" })),
  })),
  specimen("pros-cons-worksheet", blank({
    title: "Pros and cons worksheet",
    leftHeading: "Pros",
    rightHeading: "Cons",
    rows: Array.from({ length: 6 }, () => ({ left: "", right: "" })),
  })),
  specimen("fact-opinion-worksheet", blank({
    title: "Fact and opinion worksheet",
    leftHeading: "Fact",
    rightHeading: "Opinion",
    rows: Array.from({ length: 6 }, () => ({ left: "", right: "" })),
  })),
].map(Object.freeze));

export const T_CHART_FIGURES = Object.freeze([
  specimen("parts", {
    title: "Parts of a T-chart",
    leftHeading: "One side",
    rightHeading: "The other side",
    rows: [
      { left: "A short entry", right: "Its own entry" },
      { left: "Lists can differ in length", right: "" },
    ],
  }),
  specimen("fact-opinion-figure", T_CHART_EXAMPLES[2].chart),
].map(Object.freeze));

export const tChartBySlug = (slug) => [...T_CHART_EXAMPLES, ...T_CHART_BLANKS, ...T_CHART_FIGURES].find((item) => item.slug === slug);
export const tChartImage = (slug) => `/images/tools/t-chart-${slug}.svg`;

export function normalizeTChart(raw = {}) {
  const defaults = DEFAULT_T_CHART;
  const rows = Array.isArray(raw.rows) ? raw.rows.map(rowOf).slice(0, T_CHART_LIMITS.maxRows) : defaults.rows;
  return chart({
    title: typeof raw.title === "string" ? raw.title.slice(0, T_CHART_LIMITS.title) : defaults.title,
    leftHeading: typeof raw.leftHeading === "string" ? raw.leftHeading.slice(0, T_CHART_LIMITS.heading) : defaults.leftHeading,
    rightHeading: typeof raw.rightHeading === "string" ? raw.rightHeading.slice(0, T_CHART_LIMITS.heading) : defaults.rightHeading,
    rows: rows.length ? rows : [{ left: "", right: "" }],
    colors: Array.isArray(raw.colors) && raw.colors.length >= 2 ? raw.colors.slice(0, 2) : defaults.colors,
    fill: Object.keys(T_CHART_FILLS).includes(raw.fill) ? raw.fill : defaults.fill,
    textSize: Object.keys(T_CHART_TEXT_SIZES).includes(raw.textSize) ? raw.textSize : defaults.textSize,
    font: FONT_IDS.includes(raw.font) ? raw.font : defaults.font,
    background: T_CHART_BACKGROUNDS.includes(raw.background) ? raw.background : defaults.background,
    worksheet: Boolean(raw.worksheet),
  });
}

function readableInk(color) {
  let ink = color;
  for (let step = 1; contrastRatio(ink, "#ffffff") < 4.5 && step <= 20; step += 1) ink = mixHex(color, "#000000", step / 20);
  return ink;
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

// A two-column T-chart. Each row is as tall as its taller cell, text sits at the top of that row, and a word that
// cannot break throws instead of being clipped. Worksheets keep headings and writing lines, never filled entries.
export function layoutTChart(spec, measureText) {
  if (typeof measureText !== "function") throw new TypeError("layoutTChart requires measureText");
  const factor = T_CHART_TEXT_SIZES[spec.textSize] || 1;
  const styles = Object.fromEntries(Object.entries(BASE_STYLES).map(([name, style]) => [name, scaled(style, factor)]));
  const worksheet = Boolean(spec.worksheet);
  const outline = spec.fill === "outline" || worksheet;
  const canvasWidth = CANVAS_MIN;
  const chartX = MARGIN;
  const chartWidth = canvasWidth - MARGIN * 2;
  const columnWidth = (chartWidth - 2) / 2;
  const textWidth = columnWidth - GUTTER * 2;
  const stemX = chartX + columnWidth + 1;
  const [leftColor, rightColor] = spec.colors;
  const leftInk = readableInk(leftColor);
  const rightInk = readableInk(rightColor);
  const headingColor = (ink) => (outline ? TEXT_DARK : ink);
  const minHeader = Math.max(MIN_HEADER, Math.round(MIN_HEADER * factor));
  const minRow = Math.round((worksheet ? MIN_WRITE : MIN_ROW) * factor);

  const placeHeading = (text, columnX, top) => (text.trim()
    ? textBlock({ text: text.trim(), x: columnX + columnWidth / 2, top, maxWidth: textWidth, style: styles.heading, color: TEXT_DARK, anchor: "middle", measureText })
    : null);

  let y = TOP;
  let nameDate = null;
  if (worksheet) {
    const fieldWidth = (canvasWidth - MARGIN * 2 - 40) / 2;
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
    ? textBlock({ text: spec.title.trim(), x: canvasWidth / 2, top: y, maxWidth: canvasWidth - CONTENT_INSET, style: styles.title, color: TEXT_DARK, anchor: "middle", measureText })
    : null;
  if (title) y += title.height + 12;

  const chartTop = y;
  const leftHeadingMeasure = spec.leftHeading.trim()
    ? textBlock({ text: spec.leftHeading.trim(), x: 0, top: 0, maxWidth: textWidth, style: styles.heading, color: TEXT_DARK, anchor: "middle", measureText })
    : null;
  const rightHeadingMeasure = spec.rightHeading.trim()
    ? textBlock({ text: spec.rightHeading.trim(), x: 0, top: 0, maxWidth: textWidth, style: styles.heading, color: TEXT_DARK, anchor: "middle", measureText })
    : null;
  const headerHeight = even(Math.max(minHeader, (leftHeadingMeasure?.height ?? 0) + HEADER_PAD * 2, (rightHeadingMeasure?.height ?? 0) + HEADER_PAD * 2));
  const headingTop = chartTop + HEADER_PAD;
  const leftHeading = placeHeading(spec.leftHeading, chartX, headingTop);
  const rightHeading = placeHeading(spec.rightHeading, stemX + 1, headingTop);
  if (leftHeading) leftHeading.color = headingColor(leftInk);
  if (rightHeading) rightHeading.color = headingColor(rightInk);
  const headerGuideY = chartTop + headerHeight / 2;
  const leftHeaderGuide = worksheet && !leftHeading ? guide(chartX + GUTTER, chartX + columnWidth - GUTTER, headerGuideY) : null;
  const rightHeaderGuide = worksheet && !rightHeading ? guide(stemX + 1 + GUTTER, chartX + chartWidth - GUTTER, headerGuideY) : null;

  y = chartTop + headerHeight;
  const rows = spec.rows.map((row) => {
    const leftText = worksheet ? "" : row.left.trim();
    const rightText = worksheet ? "" : row.right.trim();
    const left = leftText ? textBlock({ text: leftText, x: chartX + GUTTER, top: y + ROW_PAD, maxWidth: textWidth, style: styles.cell, color: TEXT_BODY, anchor: "start", measureText }) : null;
    const right = rightText ? textBlock({ text: rightText, x: stemX + 1 + GUTTER, top: y + ROW_PAD, maxWidth: textWidth, style: styles.cell, color: TEXT_BODY, anchor: "start", measureText }) : null;
    const rowHeight = even(Math.max(minRow, (left?.height ?? 0) + ROW_PAD * 2, (right?.height ?? 0) + ROW_PAD * 2));
    const placed = {
      y: roundCoordinate(y),
      height: rowHeight,
      left,
      right,
      leftGuide: worksheet ? guide(chartX + GUTTER, chartX + columnWidth - GUTTER, y + rowHeight / 2) : null,
      rightGuide: worksheet ? guide(stemX + 1 + GUTTER, chartX + chartWidth - GUTTER, y + rowHeight / 2) : null,
      separator: { x1: roundCoordinate(chartX), x2: roundCoordinate(chartX + chartWidth), y: roundCoordinate(y + rowHeight), stroke: RULE, strokeWidth: 1 },
    };
    y += rowHeight;
    return placed;
  });
  const chartBottom = y;
  y += SECTION_GAP;
  const credit = lineBlock({ text: CREDIT, x: canvasWidth - MARGIN, top: y, style: styles.small, color: TEXT_MUTED, anchor: "end", measureText });
  y += credit.height + BOTTOM;

  return {
    width: canvasWidth,
    height: even(y),
    background: spec.background === "transparent" ? null : "#ffffff",
    fontId: spec.font,
    worksheet,
    outline,
    nameDate,
    title,
    chart: {
      x: roundCoordinate(chartX),
      y: roundCoordinate(chartTop),
      width: roundCoordinate(chartWidth),
      height: roundCoordinate(chartBottom - chartTop),
      stroke: RULE,
      strokeWidth: 1.5,
      stem: { x: roundCoordinate(stemX), y1: roundCoordinate(chartTop), y2: roundCoordinate(chartBottom), stroke: STEM, strokeWidth: 2 },
      crossbar: { x1: roundCoordinate(chartX), x2: roundCoordinate(chartX + chartWidth), y: roundCoordinate(chartTop + headerHeight), stroke: STEM, strokeWidth: 2 },
      header: {
        y: roundCoordinate(chartTop),
        height: headerHeight,
        left: { x: roundCoordinate(chartX), y: roundCoordinate(chartTop), width: roundCoordinate(columnWidth), height: headerHeight, fill: leftColor, fillOpacity: outline ? 0 : T_CHART_FILLS.tint },
        right: { x: roundCoordinate(stemX + 1), y: roundCoordinate(chartTop), width: roundCoordinate(columnWidth), height: headerHeight, fill: rightColor, fillOpacity: outline ? 0 : T_CHART_FILLS.tint },
        leftHeading,
        rightHeading,
        leftGuide: leftHeaderGuide,
        rightGuide: rightHeaderGuide,
      },
      rows,
    },
    credit,
  };
}
