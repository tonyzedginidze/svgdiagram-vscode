// The browser entry: what the web app's standalone tools share with the engine (neutrals, palettes, fonts, the type
// scale, and measured text wrapping), with nothing that needs Node, fontkit, or React.
export { INK } from "./color/ink.js";
export { ACCENT_PALETTE, DEFAULT_PALETTE } from "./color/palette.js";
export { contrastRatio, mixHex } from "./color/hex-color.js";
export { FONT_IDS, FONT_SUBSETS, fontSubsetsFor, resolveFont } from "./fonts/font-families.js";
export { FONT_WEIGHTS, TYPE_SCALE } from "./text/type-scale.js";
export { centeredBaseline, wrapLines } from "./text/text-blocks.js";
export { roundCoordinate } from "./layout/coordinates.js";
export { TextFitError } from "./text/text-fit-error.js";
export { BROWSER_MAKERS } from './browser/maker-catalog.js';
