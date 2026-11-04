// The two weights the bundled fonts ship; every text is drawn in one of them.
export const FONT_WEIGHTS = Object.freeze({ regular: 400, bold: 700 });

// The text styles every block of text is drawn in, from the small uppercase eyebrow to a card's title. A layout of several
// parts combines them (TITLE_BLOCK_STYLE, KEY_VALUE_STYLE). The only text sized outside the scale is a one-line label set
// inside a sized shape (a Pill's, a Badge's, a Marker's, a Badge's count), whose size lives in its size table because it
// scales with the shape.
export const TYPE_SCALE = Object.freeze({
  display: Object.freeze({ size: 32, weight: FONT_WEIGHTS.bold, lineSpacing: 38 }),
  eyebrow: Object.freeze({ size: 11, weight: FONT_WEIGHTS.bold, lineSpacing: 16 }),
  title: Object.freeze({ size: 14, weight: FONT_WEIGHTS.bold, lineSpacing: 18 }),
  body: Object.freeze({ size: 13, weight: FONT_WEIGHTS.regular, lineSpacing: 18 }),
  bodyStrong: Object.freeze({ size: 13, weight: FONT_WEIGHTS.bold, lineSpacing: 18 }),
  small: Object.freeze({ size: 12, weight: FONT_WEIGHTS.regular, lineSpacing: 16 }),
  smallStrong: Object.freeze({ size: 12, weight: FONT_WEIGHTS.bold, lineSpacing: 16 }),
});
