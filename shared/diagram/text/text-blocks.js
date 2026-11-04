import { roundCoordinate } from "../layout/coordinates.js";
import { FONT_WEIGHTS, TYPE_SCALE } from "./type-scale.js";
import { wrapText } from "./wrap-text.js";

// The height of a capital or a digit per unit of font size.
export const CAP_HEIGHT = 0.72;

// The baseline that centers a line's capitals in a box of lineSpacing starting at top, so a block of lines centers on a
// point by its box.
export function centeredBaseline(top, { size, lineSpacing }) {
  return roundCoordinate(top + (lineSpacing + size * CAP_HEIGHT) / 2);
}

const WEIGHTS = Object.values(FONT_WEIGHTS);

function requireStyle(style) {
  const { size, weight = FONT_WEIGHTS.regular, lineSpacing, letterSpacing } = style ?? {};
  if (![size, lineSpacing].every(Number.isFinite) || size <= 0 || lineSpacing < size) {
    throw new RangeError("Text style needs a positive size and a lineSpacing of at least the size");
  }
  if (!WEIGHTS.includes(weight)) throw new RangeError(`Text style weight must be a design weight (FONT_WEIGHTS): ${WEIGHTS.join(" or ")}`);
  if (letterSpacing === undefined) return { size, weight, lineSpacing };
  if (!Number.isFinite(letterSpacing)) throw new RangeError("Text style letterSpacing must be a finite number");
  return { size, weight, lineSpacing, letterSpacing };
}

// What measureText needs from a style: its size, weight, and letter spacing when it has one.
const measuredStyle = ({ size, weight, letterSpacing }) => (letterSpacing === undefined ? { size, weight } : { size, weight, letterSpacing });

// A block of already broken lines in a style ({ size, weight?, lineSpacing, letterSpacing? }): width is its widest line
// and height its line boxes.
export function measureLines(lines, { style, measureText }) {
  const checked = requireStyle(style);
  return {
    lines,
    style: checked,
    width: Math.max(0, ...lines.map((line) => measureText(line, measuredStyle(checked)))),
    height: lines.length * checked.lineSpacing,
  };
}

// The wrap width for text: maxWidth, widened up to wordCap when its longest word is wider, so a centered title keeps a
// long word whole instead of breaking it.
export function wordFitWidth(text, style, { maxWidth, wordCap, measureText }) {
  if (wordCap === undefined) return maxWidth;
  const longest = Math.max(...String(text).split(/\s+/).map((word) => measureText(word, style)));
  return Math.min(wordCap, Math.max(maxWidth, Math.ceil(longest)));
}

// The text and width every wrap takes: a non-empty string and a positive finite width; what names the caller.
function requireWrap(text, maxWidth, what) {
  if (typeof text !== "string" || !text.trim()) throw new TypeError(`${what} text must be a non-empty string`);
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) throw new RangeError(`${what} maxWidth must be a positive finite number`);
}

// Wraps text in style to maxWidth and measures the block. A word wider than a line splits after its hyphens and slashes,
// never between letters: a part still too wide throws, since a column of letters is never a layout. With wordCap, lines
// may widen up to wordCap before a word splits, and with maxLines, text past that many lines ends in an ellipsis.
export function wrapLines(text, { style, maxWidth, wordCap, measureText, maxLines }) {
  requireWrap(text, maxWidth, "wrapLines");
  const measured = measuredStyle(requireStyle(style));
  const width = wordFitWidth(text, measured, { maxWidth, wordCap, measureText });
  return measureLines(wrapText(text, { maxWidth: width, style: measured, measureText, longWords: "segments", maxLines }), { style, measureText });
}

// Uppercases and wraps an eyebrow, the small bold header over a title, a column, or a group, to maxWidth (widened up to
// wordCap for one long word).
export function wrapEyebrow(text, { maxWidth, wordCap, measureText }) {
  return wrapLines(text.toUpperCase(), { style: TYPE_SCALE.eyebrow, maxWidth, wordCap, measureText });
}

// A bold title with an optional muted description under it, the text of most callouts and cards, and an optional small
// uppercase eyebrow over the title.
export const TITLE_BLOCK_STYLE = Object.freeze({
  title: TYPE_SCALE.title,
  description: TYPE_SCALE.small,
  gap: 2,
  eyebrow: TYPE_SCALE.eyebrow,
  eyebrowGap: 4,
});

// Wraps an optional uppercased eyebrow, a title, and an optional description to maxWidth and measures them stacked. A
// style takes every part it leaves out from TITLE_BLOCK_STYLE. maxLines ({ title?, description? }) cuts a part to that
// many lines, ending in an ellipsis, as wrapLines' maxLines does, and wordCap lets each part widen for a long word as
// wrapLines' wordCap does.
export function wrapTitleBlock({ eyebrow, title, description }, { maxWidth, wordCap, measureText, style = TITLE_BLOCK_STYLE, maxLines = {} }) {
  requireWrap(title, maxWidth, "wrapTitleBlock");
  const unknown = Object.keys(maxLines).find((part) => part !== "title" && part !== "description");
  if (unknown) throw new RangeError(`wrapTitleBlock maxLines takes title and description, not ${unknown}`);
  const parts = { ...TITLE_BLOCK_STYLE, ...style };
  const wrap = (text, partStyle, lines) => wrapLines(text, { style: partStyle, maxWidth, wordCap, measureText, maxLines: lines });
  const eyebrowLines = eyebrow ? wrap(eyebrow.toUpperCase(), parts.eyebrow) : null;
  const titleLines = wrap(title, parts.title, maxLines.title);
  if (maxLines.description !== undefined && !description) throw new TypeError("wrapTitleBlock maxLines.description needs a description");
  const descriptionLines = description ? wrap(description, parts.description, maxLines.description) : null;
  return {
    eyebrow: eyebrowLines,
    eyebrowGap: parts.eyebrowGap,
    title: titleLines,
    description: descriptionLines,
    gap: parts.gap,
    width: Math.max(eyebrowLines?.width ?? 0, titleLines.width, descriptionLines?.width ?? 0),
    height: (eyebrowLines ? eyebrowLines.height + parts.eyebrowGap : 0) + titleLines.height + (descriptionLines ? parts.gap + descriptionLines.height : 0),
  };
}
