// The bundled font families and the script subsets Fontsource splits each face into, as plain data, so a browser page
// can name and load the same faces the engine embeds.
const FONT_FAMILIES = Object.freeze([
  { id: "inter", cssName: "Inter", packageName: "@fontsource/inter", filePrefix: "inter" },
  { id: "source-sans-3", cssName: "Source Sans 3", packageName: "@fontsource/source-sans-3", filePrefix: "source-sans-3" },
  { id: "archivo", cssName: "Archivo", packageName: "@fontsource/archivo", filePrefix: "archivo" },
  { id: "barlow-condensed", cssName: "Barlow Condensed", packageName: "@fontsource/barlow-condensed", filePrefix: "barlow-condensed" },
].map(Object.freeze));

export const FONT_IDS = Object.freeze(FONT_FAMILIES.map((family) => family.id));

// Latin covers English and Western European text; latin-ext adds the rest of the Latin script (Central European,
// Baltic, Turkish, Vietnamese letters beyond Latin-1). The ranges are Fontsource's.
export const FONT_SUBSETS = Object.freeze([
  {
    id: "latin",
    unicodeRange: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  },
  {
    id: "latin-ext",
    unicodeRange: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
  },
].map(Object.freeze));

const SUBSET_RANGES = new Map(FONT_SUBSETS.map(({ id, unicodeRange }) => [id, unicodeRange.split(",").map((range) => {
  const [start, end = start] = range.replace(/^U\+/, "").split("-").map((hex) => Number.parseInt(hex, 16));
  return Object.freeze([start, end]);
})]));

// Whether a subset's declared ranges cover a code point.
export const subsetCovers = (subsetId, codePoint) => SUBSET_RANGES.get(subsetId).some(([start, end]) => codePoint >= start && codePoint <= end);

// The subsets a text needs: always the primary one, plus each other subset that covers a character the primary lacks.
export function fontSubsetsFor(text) {
  const [primary] = FONT_SUBSETS;
  const needed = new Set([primary.id]);
  for (const character of text) {
    const codePoint = character.codePointAt(0);
    if (subsetCovers(primary.id, codePoint)) continue;
    const subset = FONT_SUBSETS.find(({ id }) => subsetCovers(id, codePoint));
    if (subset) needed.add(subset.id);
  }
  return needed;
}

// A bundled family by id, with the package and file prefix its faces load from.
export function fontFamily(id = "inter") {
  const family = FONT_FAMILIES.find((candidate) => candidate.id === id);
  if (!family) throw new RangeError(`Unsupported font family: ${id}`);
  return family;
}

// A bundled family by the CSS name an SVG embeds it under.
export function fontIdForCssName(cssName) {
  const family = FONT_FAMILIES.find((candidate) => candidate.cssName.toLowerCase() === cssName.toLowerCase());
  if (!family) throw new RangeError(`Unsupported font family: ${cssName}`);
  return family.id;
}

export function resolveFont(id = "inter") {
  const { cssName } = fontFamily(id);
  return { id, cssName };
}
