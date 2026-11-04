import { FONT_IDS, FONT_WEIGHTS, TextFitError, centeredBaseline, contrastRatio, mixHex, roundCoordinate, wrapLines } from "@svgdiagram/diagram/web";
import { calculatePunnett } from "./punnettGenetics.js";

const TEXT_DARK = "#0f172a";
const TEXT_BODY = "#334155";
const TEXT_MUTED = "#64748b";

export const PUNNETT_PALETTES = Object.freeze([
  { id: "classic", label: "Classic", colors: ["#2563eb", "#0d9488", "#4f46e5", "#d97706"] },
  { id: "emerald", label: "Emerald", colors: ["#059669", "#10b981", "#047857", "#0d9488"] },
  { id: "violet", label: "Violet", colors: ["#7c3aed", "#a855f7", "#6d28d9", "#c026d3"] },
  { id: "amber", label: "Amber", colors: ["#d97706", "#f59e0b", "#b45309", "#ea580c"] },
  { id: "gray", label: "Gray", colors: Array(4).fill(TEXT_BODY) },
].map(Object.freeze));

export const PUNNETT_FILLS = Object.freeze({ tint: 0.14, outline: 0 });
export const PUNNETT_TEXT_SIZES = Object.freeze({ small: 0.9, medium: 1, large: 1.15 });
export const PUNNETT_BACKGROUNDS = Object.freeze(["white", "transparent"]);

const punnett = ({
  title = "Punnett square calculator",
  geneCount = 1,
  parent1 = "Aa",
  parent2 = "Aa",
  traitA = "",
  traitB = "",
  colors = PUNNETT_PALETTES[0].colors,
  fill = "tint",
  textSize = "medium",
  font = "inter",
  background = "white",
  worksheet = false,
} = {}) => ({
  title,
  geneCount: Number(geneCount) === 2 ? 2 : 1,
  parent1,
  parent2,
  traitA,
  traitB,
  colors: [...colors],
  fill,
  textSize,
  font,
  background,
  worksheet: Boolean(worksheet),
});

const example = (slug, spec) => ({ slug, title: spec.title, punnett: punnett(spec) });

export const DEFAULT_PUNNETT = punnett({
  title: "Monohybrid cross (Aa × Aa)",
  geneCount: 1,
  parent1: "Aa",
  parent2: "Aa",
  traitA: "Seed shape (A: Round, a: Wrinkled)",
});

export const PUNNETT_EXAMPLES = Object.freeze([
  example("monohybrid-heterozygous", {
    title: "Monohybrid cross (Aa × Aa)",
    geneCount: 1,
    parent1: "Aa",
    parent2: "Aa",
    traitA: "Seed shape (A: Round, a: Wrinkled)",
  }),
  example("monohybrid-test-cross", {
    title: "Monohybrid test cross (Aa × aa)",
    geneCount: 1,
    parent1: "Aa",
    parent2: "aa",
    traitA: "Flower color (A: Purple, a: White)",
  }),
  example("monohybrid-homozygous", {
    title: "Homozygous cross (AA × aa)",
    geneCount: 1,
    parent1: "AA",
    parent2: "aa",
    traitA: "Plant height (A: Tall, a: Dwarf)",
  }),
  example("dihybrid-heterozygous", {
    title: "Dihybrid cross (AaBb × AaBb)",
    geneCount: 2,
    parent1: "AaBb",
    parent2: "AaBb",
    traitA: "Seed shape (A: Round, a: Wrinkled)",
    traitB: "Seed color (B: Yellow, b: Green)",
  }),
  example("dihybrid-test-cross", {
    title: "Dihybrid test cross (AaBb × aabb)",
    geneCount: 2,
    parent1: "AaBb",
    parent2: "aabb",
    traitA: "Seed shape (A: Round, a: Wrinkled)",
    traitB: "Seed color (B: Yellow, b: Green)",
  }),
].map(Object.freeze));

const blank = (spec) => punnett({ title: "", fill: "outline", colors: PUNNETT_PALETTES[4].colors, ...spec, worksheet: true });

export const PUNNETT_BLANKS = Object.freeze([
  { slug: "worksheet-2x2", title: "Monohybrid genetics worksheet", punnett: blank({ title: "Monohybrid genetics worksheet", geneCount: 1, parent1: "Aa", parent2: "Aa" }) },
  { slug: "worksheet-4x4", title: "Dihybrid genetics worksheet", punnett: blank({ title: "Dihybrid genetics worksheet", geneCount: 2, parent1: "AaBb", parent2: "AaBb" }) },
].map(Object.freeze));

export const PUNNETT_FIGURES = Object.freeze([
  example("regions-monohybrid", {
    title: "Monohybrid cross ratios",
    geneCount: 1,
    parent1: "Aa",
    parent2: "Aa",
    traitA: "Seed shape",
  }),
  example("regions-dihybrid", {
    title: "Dihybrid 9:3:3:1 ratio",
    geneCount: 2,
    parent1: "AaBb",
    parent2: "AaBb",
    traitA: "Seed shape",
    traitB: "Seed color",
  }),
  example("test-cross", {
    title: "Test cross 1:1 outcome",
    geneCount: 1,
    parent1: "Aa",
    parent2: "aa",
    traitA: "Flower color",
  }),
].map(Object.freeze));

export const punnettBySlug = (slug) => [...PUNNETT_EXAMPLES, ...PUNNETT_BLANKS, ...PUNNETT_FIGURES].find((item) => item.slug === slug);
export const punnettImage = (slug) => `/images/tools/punnett-${slug}.svg`;

export function normalizePunnett(raw = {}) {
  const defaults = DEFAULT_PUNNETT;
  return punnett({
    title: typeof raw.title === "string" ? raw.title.slice(0, 80) : defaults.title,
    geneCount: raw.geneCount === 2 ? 2 : 1,
    parent1: typeof raw.parent1 === "string" ? raw.parent1 : defaults.parent1,
    parent2: typeof raw.parent2 === "string" ? raw.parent2 : defaults.parent2,
    traitA: typeof raw.traitA === "string" ? raw.traitA.slice(0, 60) : "",
    traitB: typeof raw.traitB === "string" ? raw.traitB.slice(0, 60) : "",
    colors: Array.isArray(raw.colors) && raw.colors.length >= 3 ? raw.colors.slice(0, 4) : defaults.colors,
    fill: Object.keys(PUNNETT_FILLS).includes(raw.fill) ? raw.fill : defaults.fill,
    textSize: Object.keys(PUNNETT_TEXT_SIZES).includes(raw.textSize) ? raw.textSize : defaults.textSize,
    font: FONT_IDS.includes(raw.font) ? raw.font : defaults.font,
    background: PUNNETT_BACKGROUNDS.includes(raw.background) ? raw.background : defaults.background,
    worksheet: Boolean(raw.worksheet),
  });
}

function readableInk(color) {
  let ink = color;
  for (let step = 1; contrastRatio(ink, "#ffffff") < 4.5 && step <= 20; step++) ink = mixHex(color, "#000000", step / 20);
  return ink;
}

function formatPercent(prob) {
  const pct = Math.round(prob * 1000) / 10;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}

function formatFraction(prob) {
  const denominator = 16;
  const num = Math.round(prob * denominator);
  if (num === 0) return "0";
  if (prob === 1) return "1";
  if (prob === 0.5) return "1/2";
  if (prob === 0.25) return "1/4";
  if (prob === 0.75) return "3/4";
  return `${num}/16`;
}

const CANVAS_MIN = 680;
const CONTENT_INSET = 80;
const MARGIN = 40;
const TOP = 24;
const SECTION_GAP = 36;
const BOTTOM = 20;
const HEADER_COL = 90;
const HEADER_ROW_MIN = 44;
const COL_PAD = 8;
const CELL_PAD_X = 12;
const CELL_PAD_Y = 10;
const CELL_GAP = 4;
const CARD_PAD = 14;
const LABEL_VALUE_GAP = 12;
const SWATCH = 10;
const SWATCH_GAP = 6;
const MIN_ROW = 22;
const CARD_BOTTOM = 12;
const HEADER_DIVIDER_GAP = 8;
const AFTER_DIVIDER = 10;
const WORKSHEET_FIELD_GAP = 40;
const WORKSHEET_LINE_GAP = 8;
const ASSUMPTIONS = "Assumes complete dominance and independent assortment. Results are probabilities, not guaranteed outcomes.";
const CREDIT = "Made with svgdiagram.ai";
const GRID_STROKE = "#cbd5e1";
const CARD_FILL = "#f8fafc";
const CARD_STROKE = "#e2e8f0";
const RULE = "#94a3b8";
const PARENT = "#475569";
const GAMETE = "#1e293b";
const VALUE = "#475569";

const BASE_STYLES = Object.freeze({
  title: { size: 20, weight: 700, lineSpacing: 26 },
  parent: { size: 12, weight: 600, lineSpacing: 16 },
  gamete: { size: 15, weight: 700, lineSpacing: 18 },
  gameteProb: { size: 11, weight: 400, lineSpacing: 14 },
  genotype: { size: 18, weight: 700, lineSpacing: 22 },
  cellMeta: { size: 11, weight: 500, lineSpacing: 14 },
  heading: { size: 13, weight: 700, lineSpacing: 18 },
  ratio: { size: 12, weight: 600, lineSpacing: 16 },
  genoLabel: { size: 13, weight: 700, lineSpacing: 18 },
  genoValue: { size: 12, weight: 500, lineSpacing: 16 },
  phenoLabel: { size: 12, weight: 600, lineSpacing: 16 },
  phenoValue: { size: 12, weight: 500, lineSpacing: 16 },
  trait: { size: 11, weight: 400, lineSpacing: 15 },
  small: { size: 11, weight: 400, lineSpacing: 15 },
  worksheet: { size: 12, weight: 600, lineSpacing: 16 },
});

const even = (value) => Math.ceil(value / 2) * 2;
const measuredWeight = (weight) => (weight >= 600 ? FONT_WEIGHTS.bold : FONT_WEIGHTS.regular);
// Ink past a cap-centered line box. Source Sans 3 needs about 4px; the other bundled faces fit inside it.
const LINE_INK = 5;
const scaled = (style, factor) => {
  const size = Math.round(style.size * factor * 2) / 2;
  const lineSpacing = Math.round(style.lineSpacing * factor) + Math.round(LINE_INK * factor);
  return { size, weight: style.weight, lineSpacing: Math.max(size, lineSpacing) };
};
const widthOf = (text, style, measureText) => measureText(text, { size: style.size, weight: measuredWeight(style.weight) });
const longestWord = (text, style, measureText) => Math.max(0, ...String(text).split(/\s+/).filter(Boolean).map((word) => widthOf(word, style, measureText)));

function textBlock({ text, x, top, maxWidth, style, color, anchor, measureText, opacity = 1, user = false }) {
  const wrapStyle = { size: style.size, weight: measuredWeight(style.weight), lineSpacing: style.lineSpacing };
  let wrapped;
  try {
    wrapped = wrapLines(text, { style: wrapStyle, maxWidth, measureText });
  } catch (error) {
    if (user && error instanceof TextFitError) throw new TextFitError(`A word in "${text}" is too long to fit. Shorten it or add a space.`);
    throw error;
  }
  const renderStyle = { size: style.size, weight: style.weight, lineSpacing: style.lineSpacing };
  return {
    x: roundCoordinate(x),
    top: roundCoordinate(top),
    maxWidth: roundCoordinate(maxWidth),
    width: roundCoordinate(wrapped.width),
    height: roundCoordinate(wrapped.height),
    anchor,
    style: renderStyle,
    color,
    opacity,
    lines: wrapped.lines.map((line, index) => ({
      text: line,
      x: roundCoordinate(x),
      y: centeredBaseline(top + index * renderStyle.lineSpacing, renderStyle),
    })),
  };
}

function lineBlock({ text, x, top, style, color, anchor, measureText, opacity = 1 }) {
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
    opacity,
    lines: [{ text, x: roundCoordinate(x), y: centeredBaseline(top, style) }],
  };
}

function moveBlock(block, top) {
  return {
    ...block,
    top: roundCoordinate(top),
    lines: block.lines.map((line, index) => ({
      ...line,
      y: centeredBaseline(top + index * block.style.lineSpacing, block.style),
    })),
  };
}

function gameteProbabilityLabel(gamete, showProbability) {
  return showProbability && gamete.probability < 1 ? `(${formatPercent(gamete.probability)})` : "";
}

function gameteStack(gamete, style, probStyle, showProbability) {
  return style.lineSpacing + (gameteProbabilityLabel(gamete, showProbability) ? probStyle.lineSpacing : 0);
}

function placeGamete(gamete, { x, top, height, styles, measureText, showProbability }) {
  const stack = gameteStack(gamete, styles.gamete, styles.gameteProb, showProbability);
  const stackTop = top + (height - stack) / 2;
  const prob = gameteProbabilityLabel(gamete, showProbability);
  return {
    label: lineBlock({ text: gamete.label, x, top: stackTop, style: styles.gamete, color: GAMETE, anchor: "middle", measureText }),
    prob: prob ? lineBlock({ text: prob, x, top: stackTop + styles.gamete.lineSpacing, style: styles.gameteProb, color: TEXT_MUTED, anchor: "middle", measureText }) : null,
  };
}

function cardNeed({ rows, heading, ratio, labelLeft, labelStyle, valueStyle, headingStyle, ratioStyle, measureText }) {
  const valueWidth = Math.ceil(Math.max(...rows.map((row) => widthOf(row.value, valueStyle, measureText))));
  const labelWord = Math.max(...rows.map((row) => longestWord(row.label, labelStyle, measureText)));
  const headingWord = longestWord(heading, headingStyle, measureText);
  const ratioWidth = Math.ceil(widthOf(ratio, ratioStyle, measureText));
  const labelNeed = labelLeft + labelWord + LABEL_VALUE_GAP + valueWidth + CARD_PAD;
  const headingNeed = CARD_PAD + headingWord + LABEL_VALUE_GAP + ratioWidth + CARD_PAD;
  return Math.max(labelNeed, headingNeed) + 1;
}

function layoutCard({ cardX, cardY, cardWidth, headingText, ratioText, rows, traits, labelLeft, labelStyle, valueStyle, styles, measureText, outline }) {
  const right = cardX + cardWidth - CARD_PAD;
  const contentLeft = cardX + CARD_PAD;
  const valueWidth = Math.ceil(Math.max(...rows.map((row) => widthOf(row.value, valueStyle, measureText))));
  const valueLeft = right - valueWidth;
  const labelMax = valueLeft - LABEL_VALUE_GAP - (cardX + labelLeft);
  if (labelMax <= 0) throw new TextFitError("A probability is too wide for its summary card.");
  const ratioWidth = Math.ceil(widthOf(ratioText, styles.ratio, measureText));
  const headingMax = right - (ratioWidth + LABEL_VALUE_GAP) - contentLeft;
  if (headingMax <= 0) throw new TextFitError("A ratio is too wide for its summary card.");

  const headingTop = cardY + CARD_PAD;
  const heading = textBlock({ text: headingText, x: contentLeft, top: headingTop, maxWidth: headingMax, style: styles.heading, color: TEXT_DARK, anchor: "start", measureText });
  const headerHeight = Math.max(heading.height, styles.ratio.lineSpacing);
  const ratio = lineBlock({
    text: ratioText,
    x: right,
    top: headingTop + (headerHeight - styles.ratio.lineSpacing) / 2,
    style: styles.ratio,
    color: VALUE,
    anchor: "end",
    measureText,
  });
  const dividerY = roundCoordinate(headingTop + headerHeight + HEADER_DIVIDER_GAP);
  let cursor = dividerY + AFTER_DIVIDER;
  const traitBlocks = traits.map((trait) => {
    const placed = textBlock({ text: trait, x: contentLeft, top: cursor, maxWidth: cardWidth - CARD_PAD * 2, style: styles.trait, color: TEXT_MUTED, anchor: "start", measureText, user: true });
    cursor = placed.top + placed.height + 2;
    return placed;
  });
  if (traitBlocks.length) cursor += 6;

  const placedRows = rows.map((row) => {
    const label = textBlock({ text: row.label, x: cardX + labelLeft, top: cursor, maxWidth: labelMax, style: labelStyle, color: GAMETE, anchor: "start", measureText });
    const value = lineBlock({ text: row.value, x: right, top: cursor, style: valueStyle, color: VALUE, anchor: "end", measureText });
    const rowHeight = Math.max(MIN_ROW, label.height, value.height, row.color ? SWATCH : 0);
    const placed = {
      y: roundCoordinate(cursor),
      height: roundCoordinate(rowHeight),
      label: moveBlock(label, cursor + (rowHeight - label.height) / 2),
      value: moveBlock(value, cursor + (rowHeight - value.height) / 2),
      swatch: row.color ? {
        x: roundCoordinate(contentLeft),
        y: roundCoordinate(cursor + (rowHeight - SWATCH) / 2),
        width: SWATCH,
        height: SWATCH,
        color: outline ? TEXT_MUTED : row.color,
        rx: 2,
      } : null,
    };
    cursor += rowHeight;
    return placed;
  });

  return {
    x: roundCoordinate(cardX),
    y: roundCoordinate(cardY),
    width: roundCoordinate(cardWidth),
    height: roundCoordinate(cursor + CARD_BOTTOM - cardY),
    fill: CARD_FILL,
    stroke: CARD_STROKE,
    strokeWidth: 1.5,
    rx: 6,
    dividerY: roundCoordinate(dividerY - cardY),
    divider: { x1: roundCoordinate(contentLeft), x2: roundCoordinate(right), y: dividerY, stroke: CARD_STROKE, strokeWidth: 1 },
    heading,
    ratio,
    traits: traitBlocks,
    rows: placedRows,
  };
}

// Lays the square out from measured text. Parent 1 stays on top and parent 2 on the left by projecting the
// calculation (whose rows are parent 1) without changing it. Every text block owns its wrapped lines; a word that
// cannot break throws instead of being clipped.
export function layoutPunnett(spec, measureText) {
  if (typeof measureText !== "function") throw new TypeError("layoutPunnett requires measureText");
  let calc;
  try {
    calc = calculatePunnett({ geneCount: spec.geneCount, parent1: spec.parent1, parent2: spec.parent2 });
  } catch (err) {
    throw new TextFitError(`Invalid genotype input: ${err.message}`);
  }

  const factor = PUNNETT_TEXT_SIZES[spec.textSize] || 1;
  const styles = Object.fromEntries(Object.entries(BASE_STYLES).map(([name, style]) => [name, scaled(style, factor)]));
  const isWorksheet = spec.worksheet;
  const showGameteProbability = !isWorksheet;
  const isOutline = spec.fill === "outline" || isWorksheet;
  const colGametes = calc.gametes1;
  const rowGametes = calc.gametes2;
  const colCount = colGametes.length;
  const rowCount = rowGametes.length;
  const projected = calc.cells.map((cell) => ({
    row: cell.column,
    column: cell.row,
    genotype: cell.genotype,
    phenotype: cell.phenotype,
    probability: cell.probability,
  }));
  const phenotypeColor = new Map(calc.phenotypes.map((phenotype, index) => [phenotype.label, spec.colors[index % spec.colors.length]]));
  const probText = (probability) => `${formatPercent(probability)} (${formatFraction(probability)})`;

  const gameteHeaderWidth = (gamete) => {
    const probability = gameteProbabilityLabel(gamete, showGameteProbability);
    return Math.max(widthOf(gamete.label, styles.gamete, measureText), probability ? widthOf(probability, styles.gameteProb, measureText) : 0);
  };
  const colHeaderWidths = colGametes.map(gameteHeaderWidth);
  const rowHeaderWidths = rowGametes.map(gameteHeaderWidth);
  const parentLeftText = `Parent 2 (Left): ${calc.parent2}`;
  const headerColWidth = even(Math.max(HEADER_COL, longestWord(parentLeftText, styles.parent, measureText) + COL_PAD * 2, ...rowHeaderWidths.map((width) => width + COL_PAD * 2)));
  const cellContentWidths = isWorksheet ? [0] : projected.map((cell) => Math.max(
    widthOf(cell.genotype, styles.genotype, measureText),
    widthOf(`${cell.phenotype} · ${probText(cell.probability)}`, styles.cellMeta, measureText),
  ));
  const minCellWidth = spec.geneCount === 2 ? (colCount <= 2 ? 130 : 110) : (colCount <= 1 ? 160 : 135);
  const minCellHeight = spec.geneCount === 2 ? (rowCount <= 2 ? 85 : 75) : (rowCount <= 1 ? 100 : 88);
  const cellWidth = even(Math.max(minCellWidth, ...colHeaderWidths.map((width) => width + CELL_PAD_X * 2), ...cellContentWidths.map((width) => width + CELL_PAD_X * 2)));
  const parentLeftWrap = wrapLines(parentLeftText, {
    style: { size: styles.parent.size, weight: measuredWeight(styles.parent.weight), lineSpacing: styles.parent.lineSpacing },
    maxWidth: headerColWidth - COL_PAD * 2,
    measureText,
  });
  const colHeaderHeight = Math.max(...colGametes.map((gamete) => gameteStack(gamete, styles.gamete, styles.gameteProb, showGameteProbability)));
  const rowHeaderHeight = Math.max(...rowGametes.map((gamete) => gameteStack(gamete, styles.gamete, styles.gameteProb, showGameteProbability)));
  const headerRowHeight = even(Math.max(HEADER_ROW_MIN, parentLeftWrap.height + COL_PAD * 2, colHeaderHeight + COL_PAD * 2));
  const contentStack = styles.genotype.lineSpacing + CELL_GAP + styles.cellMeta.lineSpacing;
  const cellHeight = even(Math.max(minCellHeight, isWorksheet ? 0 : contentStack + CELL_PAD_Y * 2, rowHeaderHeight + COL_PAD * 2));
  const gridWidth = headerColWidth + colCount * cellWidth;

  const genotypeRows = calc.genotypes.map((genotype) => ({ label: genotype.label, value: probText(genotype.probability) }));
  const phenotypeRows = calc.phenotypes.map((phenotype) => ({ label: phenotype.label, value: probText(phenotype.probability), color: phenotypeColor.get(phenotype.label) }));
  const traits = [
    spec.traitA.trim() ? `${calc.loci[0]}: ${spec.traitA.trim()}` : "",
    spec.geneCount === 2 && spec.traitB.trim() ? `${calc.loci[1]}: ${spec.traitB.trim()}` : "",
  ].filter(Boolean);
  const genotypeRatio = `Ratio: ${calc.genotypeRatio}`;
  const phenotypeRatio = `Ratio: ${calc.phenotypeRatio}`;
  const summaryCanvas = isWorksheet ? 0 : Math.ceil(Math.max(
    cardNeed({ rows: genotypeRows, heading: "Genotype Probabilities", ratio: genotypeRatio, labelLeft: CARD_PAD, labelStyle: styles.genoLabel, valueStyle: styles.genoValue, headingStyle: styles.heading, ratioStyle: styles.ratio, measureText }),
    cardNeed({ rows: phenotypeRows, heading: "Phenotype Probabilities", ratio: phenotypeRatio, labelLeft: CARD_PAD + SWATCH + SWATCH_GAP, labelStyle: styles.phenoLabel, valueStyle: styles.phenoValue, headingStyle: styles.heading, ratioStyle: styles.ratio, measureText }),
  ) * 2 + 100);
  const canvasWidth = even(Math.max(CANVAS_MIN, gridWidth + CONTENT_INSET, summaryCanvas));
  const groupX = (canvasWidth - gridWidth) / 2;
  const gridX = groupX + headerColWidth;

  let y = TOP;
  let header = null;
  if (isWorksheet) {
    const fieldWidth = (canvasWidth - MARGIN * 2 - WORKSHEET_FIELD_GAP) / 2;
    const fields = ["Name:", "Date:"].map((label, index) => {
      const x = MARGIN + index * (fieldWidth + WORKSHEET_FIELD_GAP);
      const labelWidth = widthOf(label, styles.worksheet, measureText);
      const block = lineBlock({ text: label, x, top: y, style: styles.worksheet, color: TEXT_BODY, anchor: "start", measureText });
      return {
        label: block,
        line: {
          x1: roundCoordinate(x + labelWidth + WORKSHEET_LINE_GAP),
          x2: roundCoordinate(Math.max(x + fieldWidth, x + labelWidth + WORKSHEET_LINE_GAP + 24)),
          y: roundCoordinate(block.lines[0].y + 2),
          stroke: RULE,
          strokeWidth: 1.5,
          dash: "4 2",
        },
      };
    });
    header = { fields };
    y += styles.worksheet.lineSpacing + 16;
  }

  const title = spec.title.trim()
    ? textBlock({ text: spec.title.trim(), x: canvasWidth / 2, top: y, maxWidth: canvasWidth - CONTENT_INSET, style: styles.title, color: TEXT_DARK, anchor: "middle", measureText, user: true })
    : null;
  if (title) y += title.height + 12;

  const parentTop = textBlock({
    text: `Parent 1 (Top): ${calc.parent1}`,
    x: canvasWidth / 2,
    top: y,
    maxWidth: canvasWidth - CONTENT_INSET,
    style: styles.parent,
    color: PARENT,
    anchor: "middle",
    measureText,
  });
  y += parentTop.height + 8;

  const headerY = y;
  const gridTopY = headerY + headerRowHeight;
  const parentLeft = textBlock({
    text: parentLeftText,
    x: groupX + headerColWidth / 2,
    top: headerY + (headerRowHeight - parentLeftWrap.height) / 2,
    maxWidth: headerColWidth - COL_PAD * 2,
    style: styles.parent,
    color: PARENT,
    anchor: "middle",
    measureText,
  });
  const colHeaders = colGametes.map((gamete, index) => placeGamete(gamete, {
    x: gridX + index * cellWidth + cellWidth / 2,
    top: headerY,
    height: headerRowHeight,
    styles,
    measureText,
    showProbability: showGameteProbability,
  }));
  const rowHeaders = rowGametes.map((gamete, index) => placeGamete(gamete, {
    x: groupX + headerColWidth / 2,
    top: gridTopY + index * cellHeight,
    height: cellHeight,
    styles,
    measureText,
    showProbability: showGameteProbability,
  }));
  const cells = projected.map((cell) => {
    const x = gridX + cell.column * cellWidth;
    const cellY = gridTopY + cell.row * cellHeight;
    const color = phenotypeColor.get(cell.phenotype) || spec.colors[0];
    const ink = readableInk(color);
    const placed = {
      row: cell.row,
      column: cell.column,
      x: roundCoordinate(x),
      y: roundCoordinate(cellY),
      width: cellWidth,
      height: cellHeight,
      fill: color,
      fillOpacity: isOutline ? 0 : PUNNETT_FILLS[spec.fill] || 0.14,
      stroke: GRID_STROKE,
      strokeWidth: 1.5,
      genotype: null,
      meta: null,
      rule: null,
    };
    if (isWorksheet) {
      placed.rule = {
        x1: roundCoordinate(x + 12),
        x2: roundCoordinate(x + cellWidth - 12),
        y: roundCoordinate(cellY + cellHeight / 2),
        stroke: CARD_STROKE,
        strokeWidth: 1.2,
        dash: "3 3",
      };
      return placed;
    }
    const stackTop = cellY + (cellHeight - contentStack) / 2;
    placed.genotype = lineBlock({ text: cell.genotype, x: x + cellWidth / 2, top: stackTop, style: styles.genotype, color: isOutline ? TEXT_DARK : ink, anchor: "middle", measureText });
    placed.meta = lineBlock({
      text: `${cell.phenotype} · ${probText(cell.probability)}`,
      x: x + cellWidth / 2,
      top: stackTop + styles.genotype.lineSpacing + CELL_GAP,
      style: styles.cellMeta,
      color: isOutline ? PARENT : ink,
      anchor: "middle",
      measureText,
      opacity: 0.85,
    });
    return placed;
  });

  y = gridTopY + rowCount * cellHeight + SECTION_GAP;
  let summary = null;
  if (!isWorksheet) {
    const cardWidth = (canvasWidth - 100) / 2;
    const genotypes = layoutCard({
      cardX: 40,
      cardY: y,
      cardWidth,
      headingText: "Genotype Probabilities",
      ratioText: genotypeRatio,
      rows: genotypeRows,
      traits: [],
      labelLeft: CARD_PAD,
      labelStyle: styles.genoLabel,
      valueStyle: styles.genoValue,
      styles,
      measureText,
      outline: isOutline,
    });
    const phenotypes = layoutCard({
      cardX: 60 + cardWidth,
      cardY: y,
      cardWidth,
      headingText: "Phenotype Probabilities",
      ratioText: phenotypeRatio,
      rows: phenotypeRows,
      traits,
      labelLeft: CARD_PAD + SWATCH + SWATCH_GAP,
      labelStyle: styles.phenoLabel,
      valueStyle: styles.phenoValue,
      styles,
      measureText,
      outline: isOutline,
    });
    const panelHeight = roundCoordinate(Math.max(genotypes.height, phenotypes.height));
    genotypes.height = panelHeight;
    phenotypes.height = panelHeight;
    summary = {
      y: roundCoordinate(y),
      height: panelHeight,
      cardWidth: roundCoordinate(cardWidth),
      genotypes,
      phenotypes,
    };
    y += summary.height + 16;
  }

  const assumptions = isWorksheet ? null : textBlock({
    text: ASSUMPTIONS,
    x: canvasWidth / 2,
    top: y,
    maxWidth: canvasWidth - CONTENT_INSET,
    style: styles.small,
    color: TEXT_MUTED,
    anchor: "middle",
    measureText,
  });
  if (assumptions) y += assumptions.height + 8;
  const credit = lineBlock({ text: CREDIT, x: canvasWidth - MARGIN, top: y, style: styles.small, color: TEXT_MUTED, anchor: "end", measureText });
  y += credit.height + BOTTOM;

  return {
    width: canvasWidth,
    height: even(y),
    background: spec.background === "transparent" ? null : "#ffffff",
    fontId: spec.font,
    worksheet: isWorksheet,
    outline: isOutline,
    header,
    title,
    parentTop,
    parentLeft,
    grid: {
      x: roundCoordinate(groupX),
      y: roundCoordinate(headerY),
      gridX: roundCoordinate(gridX),
      gridTopY: roundCoordinate(gridTopY),
      width: gridWidth,
      height: headerRowHeight + rowCount * cellHeight,
      cols: colCount,
      rows: rowCount,
      cellWidth,
      cellHeight,
      headerColWidth,
      headerRowHeight,
      frame: {
        x: roundCoordinate(gridX),
        y: roundCoordinate(gridTopY),
        width: colCount * cellWidth,
        height: rowCount * cellHeight,
        rx: 4,
        stroke: GRID_STROKE,
        strokeWidth: 2,
      },
    },
    colHeaders,
    rowHeaders,
    cells,
    summary,
    assumptions,
    credit,
  };
}
