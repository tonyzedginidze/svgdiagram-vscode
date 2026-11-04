import { TextFitError } from "./text-fit-error.js";

function breakWord(word, maxWidth, style, measureText) {
  const pieces = [];
  let piece = "";
  for (const character of word) {
    const candidate = piece + character;
    if (measureText(candidate, style) <= maxWidth || !piece) piece = candidate;
    else {
      pieces.push(piece);
      piece = character;
    }
  }
  return piece ? [...pieces, piece] : pieces;
}

// A word's break opportunities fall after hyphens and slashes: "ci/cd-ready" becomes ["ci/", "cd-", "ready"].
const segmentsOf = (word) => word.match(/[^-/]*[-/]+|[^-/]+$/g);

const ELLIPSIS = "\u2026";

// Keeps the first maxLines lines, ending the last with an ellipsis that still fits maxWidth by dropping characters.
function truncateLines(lines, maxLines, maxWidth, style, measureText) {
  if (lines.length <= maxLines) return lines;
  let characters = [...lines[maxLines - 1]];
  const ending = () => `${characters.join("").trimEnd()}${ELLIPSIS}`;
  while (characters.length && maxWidth !== undefined && measureText(ending(), style) > maxWidth) characters = characters.slice(0, -1);
  return [...lines.slice(0, maxLines - 1), ending()];
}

const LONG_WORD_MODES = Object.freeze(["reject", "segments", "break"]);

// Greedy measured wrapping. A word wider than the line is rejected; with longWords "segments" it splits after its
// hyphens and slashes and a segment still too wide is rejected; with "break" that segment also breaks by character. With
// maxLines, text past that many lines is cut and the last line ends with an ellipsis.
export function wrapText(text, { maxWidth, style, measureText, longWords = "reject", maxLines }) {
  if (!LONG_WORD_MODES.includes(longWords)) throw new RangeError(`Unsupported longWords mode: ${longWords}`);
  if (maxLines !== undefined && (!Number.isInteger(maxLines) || maxLines < 1)) throw new RangeError("maxLines must be a positive whole number");
  const lines = [];
  for (const paragraph of String(text ?? "").split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    if (maxWidth === undefined) {
      lines.push(words.join(" "));
      continue;
    }
    let line = "";
    for (const word of words) {
      const wordWidth = measureText(word, style);
      if (wordWidth > maxWidth) {
        if (longWords === "reject") {
          throw new TextFitError(`Unbreakable word "${word}" (${wordWidth.toFixed(1)}px) exceeds available width of ${maxWidth}px`);
        }
        segmentsOf(word).forEach((segment, index) => {
          const candidate = line ? `${line}${index ? "" : " "}${segment}` : segment;
          if (measureText(candidate, style) <= maxWidth) {
            line = candidate;
            return;
          }
          if (line) lines.push(line);
          const segmentWidth = measureText(segment, style);
          if (longWords === "segments" && segmentWidth > maxWidth) {
            const part = segment === word ? `Word "${word}" is` : `Word "${word}" splits at its hyphens and slashes, but "${segment}" is`;
            throw new TextFitError(`${part} ${segmentWidth.toFixed(1)}px wide, wider than the ${maxWidth}px line; widen the line or shorten the word`);
          }
          const pieces = breakWord(segment, maxWidth, style, measureText);
          lines.push(...pieces.slice(0, -1));
          line = pieces.at(-1);
        });
        continue;
      }
      const candidate = line ? `${line} ${word}` : word;
      if (!line || measureText(candidate, style) <= maxWidth) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return maxLines === undefined ? lines : truncateLines(lines, maxLines, maxWidth, style, measureText);
}
