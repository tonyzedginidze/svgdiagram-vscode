import { contrastRatio, mixHex } from "./hex-color.js";
import { INK } from "./ink.js";

// The accent palette from the styling guide, in the order designs cycle it: saturated enough to read and similar in
// strength. Violet follows indigo, so a blue accent's first companion stays calm and on brand; slate comes last as the
// quietest.
export const ACCENT_PALETTE = Object.freeze([
  Object.freeze({ id: "indigo", color: "#6366f1" }),
  Object.freeze({ id: "violet", color: "#8b5cf6" }),
  Object.freeze({ id: "amber", color: "#f59e0b" }),
  Object.freeze({ id: "emerald", color: "#10b981" }),
  Object.freeze({ id: "cyan", color: "#06b6d4" }),
  Object.freeze({ id: "slate", color: "#64748b" }),
]);

// The theme's palette when none is chosen: the product blue, then violet, amber, and emerald from the accent palette.
export const DEFAULT_PALETTE = Object.freeze(["#2563eb", "#8b5cf6", "#f59e0b", "#10b981"]);

// A palette accent's color by its id, such as emerald.
export function paletteColor(id) {
  const found = ACCENT_PALETTE.find((accent) => accent.id === id);
  if (!found) throw new RangeError(`Unknown palette accent: ${id}. Expected one of: ${ACCENT_PALETTE.map((accent) => accent.id).join(", ")}`);
  return found.color;
}

// The pale wash of any accent on the theme's cards, for icon tiles and badge surfaces behind the full-strength accent.
export function accentTint(color, theme) {
  return mixHex(color, theme.colors.surface, theme.mix.tint);
}

// The three visible faces of a projected solid in one hue: a lit top, the base on the left, a shaded right. Light and
// shade come from the theme's lightest and darkest roles, which swap on Dark, so the top stays the brightest face.
export function prismFaceFills(base, theme) {
  const [light, shade] = theme.mode === "dark" ? [theme.colors.strong, theme.colors.surface] : [theme.colors.surface, theme.colors.strong];
  return { top: mixHex(base, light, 0.35), left: base, right: mixHex(base, shade, 0.12) };
}

// A shade of any accent that reads on its own tint (amber on pale amber): deeper on a light theme, lighter on a dark one.
export function accentShade(color, theme) {
  return mixHex(color, theme.colors.contrast, theme.mix.shade);
}

// One accent per item: the accent for every item, or, with colors "palette", the theme's palette cycled from offset so
// neighboring items differ.
export function itemColors(count, { accent, colors, palette, offset = 0 }) {
  if (colors !== "palette") return Array.from({ length: count }, () => accent);
  if (!Array.isArray(palette) || !palette.length) throw new TypeError("Palette item colors need the theme's palette");
  return Array.from({ length: count }, (_, index) => palette[(index + offset) % palette.length]);
}

// How far toward the theme's card surface a repeated palette color moves on its last cycle.
const SERIES_REPEAT_FURTHEST = 0.5;

// One distinct color per chart series, keyed by a legend or label rather than position: the palette in order, and on
// each later cycle the same colors stepped toward the theme's card surface, so a fifth series never repeats the first.
export function seriesColors(count, { palette, theme }) {
  if (!Array.isArray(palette) || !palette.length) throw new TypeError("Series colors need the theme's palette");
  const cycles = Math.ceil(count / palette.length);
  return Array.from({ length: count }, (_, index) => {
    const cycle = Math.floor(index / palette.length);
    const color = palette[index % palette.length];
    return cycle ? mixHex(color, theme.colors.surface, (SERIES_REPEAT_FURTHEST * cycle) / Math.max(1, cycles - 1)) : color;
  });
}

// count shades of one accent from faintest to deepest: the first is mixed faintest of the way to the theme's card
// surface, the last deepest of the way (the accent itself by default), for levels, layers, and stages that deepen in
// order.
export function rampColors(accent, count, { faintest, deepest = 0, theme }) {
  if (!Number.isInteger(count) || count < 2) throw new RangeError("A color ramp needs at least two shades");
  if (!(deepest >= 0 && deepest < faintest)) throw new RangeError("A color ramp's deepest mix must be from 0 up to its faintest");
  return Array.from({ length: count }, (_, index) => mixHex(accent, theme.colors.surface, deepest + (faintest - deepest) * (1 - index / (count - 1))));
}

// Solid fills choose ink with at least 4.5:1 contrast, including small labels.
export function textOn(fill) {
  return contrastRatio(fill, INK.white) >= 4.5 ? INK.white : contrastRatio(fill, INK.strong) >= 4.5 ? INK.strong : "#000000";
}

// Tones that carry meaning, so their colors are fixed rather than taken from the accent. The palette has no red, so
// negative is rose.
export const STATUS_TONES = Object.freeze({
  positive: paletteColor("emerald"),
  warning: paletteColor("amber"),
  negative: "#f43f5e",
  neutral: paletteColor("slate"),
});
export const STATUS_TONE_IDS = Object.freeze(Object.keys(STATUS_TONES));

// The ways a primitive is painted in one accent: tint puts it on its pale tint, solid fills with it, and outline borders a
// surface with it.
export const PAINT_VARIANTS = Object.freeze(["tint", "solid", "outline"]);

// Every color a primitive painted in color with variant needs (docs/primitives.md, Color): its fill,
// border, icon, and text, from the accent and the theme alone. An outline fills with the theme's card surface.
export function accentPaint(color, variant, theme) {
  if (!PAINT_VARIANTS.includes(variant)) throw new RangeError(`Unsupported paint variant: ${variant}. Expected one of: ${PAINT_VARIANTS.join(", ")}`);
  if (variant === "solid") return { fill: color, border: color, icon: textOn(color), text: textOn(color) };
  const fill = variant === "tint" ? accentTint(color, theme) : theme.colors.surface;
  const toward = contrastRatio(fill, "#000000") > contrastRatio(fill, "#ffffff") ? "#000000" : "#ffffff";
  const readable = (original, minimum) => {
    let result = original;
    for (let step = 1; contrastRatio(result, fill) < minimum && step <= 20; step++) result = mixHex(original, toward, step / 20);
    return result;
  };
  return { fill, border: color, icon: readable(color, 3), text: readable(accentShade(color, theme), 4.5) };
}
