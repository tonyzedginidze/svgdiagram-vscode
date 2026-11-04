import { DEFAULT_PALETTE, FONT_IDS, INK, TYPE_SCALE, TextFitError, centeredBaseline, contrastRatio, mixHex, roundCoordinate, wrapLines } from "@svgdiagram/diagram/web";

export const VENN_SET_KEYS = Object.freeze(["a", "b", "c"]);
// The region outside every circle, inside the universal set's box.
export const VENN_OUTSIDE = "outside";
export const VENN_BACKGROUNDS = Object.freeze(["white", "transparent"]);
// Tinted circles, or outlines only, which print with little ink and leave room to write.
export const VENN_FILLS = Object.freeze({ tint: 0.14, outline: 0 });
// Text scale for a slide or a printed page read from across a room.
export const VENN_TEXT_SIZES = Object.freeze({ small: 0.9, medium: 1, large: 1.25 });
export const VENN_LIMITS = Object.freeze({ title: 80, name: 40, region: 600, universe: 40, list: 20000 });
// Regions typed one by one, or lists compared to find what each set alone and each overlap holds.
export const VENN_SOURCES = Object.freeze(["regions", "lists"]);
// Compared lists draw their items, or only how many fall in each region, which suits long lists.
export const VENN_SHOWS = Object.freeze(["items", "counts"]);
export const VENN_PALETTES = Object.freeze([
  { id: "classic", label: "Classic", colors: DEFAULT_PALETTE.slice(0, 3) },
  { id: "cool", label: "Cool", colors: ["#06b6d4", "#6366f1", "#10b981"] },
  { id: "warm", label: "Warm", colors: ["#f59e0b", "#f43f5e", "#8b5cf6"] },
  { id: "primary", label: "Primary", colors: ["#dc2626", "#2563eb", "#ca8a04"] },
  { id: "gray", label: "Gray", colors: Array(3).fill(INK.body) },
].map(Object.freeze));
const HEX = /^#[0-9a-f]{6}$/i;

// The regions of a two- or three-set diagram, each named by the sets it belongs to, in the order the inputs list them.
export const VENN_REGIONS = Object.freeze({
  2: Object.freeze(["a", "b", "ab"]),
  3: Object.freeze(["a", "b", "c", "ab", "ac", "bc", "abc"]),
});
const REGION_KEYS = Object.freeze([...VENN_REGIONS[3], VENN_OUTSIDE]);

const venn = ({ title, names, regions = {}, lists = [], colors = VENN_PALETTES[0].colors, fill = "tint", shaded = [], universe = null, worksheet = false, show = "items" }) => ({
  title,
  count: names.length,
  names: [...names, "Set C"].slice(0, 3),
  colors: [...colors],
  source: lists.length ? "lists" : "regions",
  regions: { ...Object.fromEntries(REGION_KEYS.map((key) => [key, ""])), ...regions },
  lists: [...lists, "", "", ""].slice(0, 3),
  ignoreCase: true,
  show,
  shaded,
  universe: { show: Boolean(universe), name: universe ?? "U" },
  worksheet,
  fill,
  textSize: "medium",
  font: "inter",
  background: "white",
});
const example = (slug, spec) => ({ slug, title: spec.title, venn: venn(spec) });

// Worked examples the page shows and loads into the maker, the first of which opens by default. Each example and blank
// has an image, the maker's own SVG download of it, at public/images/tools/venn-<slug>.svg.
export const VENN_EXAMPLES = Object.freeze([
  example("plant-animal-cells", {
    title: "Plant and animal cells",
    names: ["Plant cell", "Animal cell"],
    regions: {
      a: "Cell wall\nChloroplasts\nLarge central vacuole",
      b: "Centrioles\nLysosomes\nSmall vacuoles",
      ab: "Nucleus\nCell membrane\nMitochondria\nRibosomes\nCytoplasm",
    },
  }),
  example("mitosis-meiosis", {
    title: "Mitosis and meiosis",
    names: ["Mitosis", "Meiosis"],
    regions: {
      a: "One division\nTwo daughter cells\nIdentical to the parent\nGrowth and repair",
      b: "Two divisions\nFour daughter cells\nGenetically different\nCrossing over\nMakes gametes",
      ab: "DNA copied first\nProphase, metaphase, anaphase, telophase\nIn eukaryotic cells",
    },
  }),
  example("dna-rna", {
    title: "DNA and RNA",
    names: ["DNA", "RNA"],
    regions: {
      a: "Double strand\nDeoxyribose sugar\nThymine\nStores genetic code",
      b: "Single strand\nRibose sugar\nUracil\nCarries code to ribosomes",
      ab: "Nucleic acids\nMade of nucleotides\nPhosphate backbone\nAdenine, guanine, cytosine",
    },
  }),
  example("sports-survey", {
    title: "Sports played by 30 students",
    names: ["Soccer", "Basketball"],
    regions: { a: "8", b: "6", ab: "4", outside: "12" },
    universe: "Class of 30",
  }),
  example("club-members", {
    title: "Chess club and robotics club",
    names: ["Chess club", "Robotics club"],
    lists: ["Ana\nBen\nChen\nDana\nEli\nFatima", "chen\nDana\nGrace\nHugo\nIvan\nBen"],
    colors: VENN_PALETTES[1].colors,
  }),
  example("remote-office-work", {
    title: "Remote and office work",
    names: ["Remote", "Office"],
    regions: {
      a: "No commute\nFlexible hours\nOwn workspace",
      b: "Face-to-face time\nShared equipment\nClear end to the day",
      ab: "Team meetings\nDeadlines\nSame tools and chat",
    },
    colors: VENN_PALETTES[1].colors,
  }),
  example("product-team-skills", {
    title: "Product team skills",
    names: ["Design", "Engineering", "Product"],
    regions: {
      a: "Visual design\nBranding",
      b: "Writing code\nCode review",
      c: "Roadmap\nPricing",
      ab: "Prototyping\nDesign systems",
      ac: "User research",
      bc: "Technical specs\nEstimates",
      abc: "Shipping features",
    },
  }),
].map(Object.freeze));

// Blank diagrams to print and fill in by hand, or to open in the maker and type in: gray outlines, which print the same
// on any printer.
const blank = (spec) => venn({ title: "", regions: {}, colors: VENN_PALETTES[4].colors, fill: "outline", ...spec });
export const VENN_BLANKS = Object.freeze([
  { slug: "blank-two-circles", title: "Blank 2-circle Venn diagram", venn: blank({ names: ["", ""] }) },
  { slug: "blank-three-circles", title: "Blank 3-circle Venn diagram", venn: blank({ names: ["", "", ""] }) },
  { slug: "worksheet-two-circles", title: "Compare and contrast worksheet", venn: blank({ title: "Compare and contrast", names: ["", ""], worksheet: true }) },
  { slug: "worksheet-three-circles", title: "3-circle Venn worksheet", venn: blank({ title: "Compare and contrast", names: ["", "", ""], worksheet: true }) },
].map(Object.freeze));

// Figures beside the page's sections: the regions of two and three sets, and the four shadings math asks for. Shading
// figures leave the title to their caption, as they sit in sets of four.
const REGION_FIGURE_COLORS = VENN_PALETTES[0].colors;
const shading = (slug, title, shaded) => example(slug, { title, names: ["A", "B"], shaded, universe: "U", colors: VENN_PALETTES[4].colors, fill: "outline" });
export const VENN_FIGURES = Object.freeze([
  example("regions-two", { title: "Two sets, three regions", names: ["A", "B"], regions: { a: "Only A", b: "Only B", ab: "A and B" }, colors: REGION_FIGURE_COLORS }),
  example("regions-three", {
    title: "Three sets, seven regions",
    names: ["A", "B", "C"],
    regions: { a: "Only A", b: "Only B", c: "Only C", ab: "A and B", ac: "A and C", bc: "B and C", abc: "All three" },
    colors: REGION_FIGURE_COLORS,
  }),
  shading("shading-union", "A or B", ["a", "b", "ab"]),
  shading("shading-intersection", "A and B", ["ab"]),
  shading("shading-complement", "Not A", ["b", VENN_OUTSIDE]),
  shading("shading-difference", "A but not B", ["a"]),
].map((figure) => Object.freeze({ ...figure, venn: { ...figure.venn, title: "" } })));

// Every ready diagram the page shows, by slug, and the image the maker drew of it.
export const vennBySlug = (slug) => [...VENN_EXAMPLES, ...VENN_BLANKS, ...VENN_FIGURES].find((item) => item.slug === slug);
export const vennImage = (slug) => `/images/tools/venn-${slug}.svg`;

export const DEFAULT_VENN = VENN_EXAMPLES[0].venn;

function requireText(value, limit, what) {
  if (typeof value !== "string") throw new TypeError(`${what} must be text`);
  return value.slice(0, limit);
}

function requireChoice(value, choices, what) {
  if (!choices.includes(value)) throw new RangeError(`Unknown ${what}: ${value}`);
  return value;
}

// Venn inputs from an untrusted source (a shared link), checked and cut to the input limits.
export function normalizeVenn(input) {
  if (!input || typeof input !== "object") throw new TypeError("A Venn diagram must be an object");
  if (!Array.isArray(input.names) || input.names.length !== 3) throw new TypeError("A Venn diagram names 3 sets");
  if (!Array.isArray(input.colors) || input.colors.length !== 3 || !input.colors.every((color) => HEX.test(color))) throw new TypeError("A Venn diagram has 3 #rrggbb colors");
  if (!input.regions || typeof input.regions !== "object") throw new TypeError("A Venn diagram needs its regions");
  if (!Array.isArray(input.shaded) || !input.shaded.every((key) => REGION_KEYS.includes(key))) throw new TypeError("Shaded regions must be region keys");
  if (!input.universe || typeof input.universe.show !== "boolean") throw new TypeError("A Venn diagram needs its universal set");
  if (typeof input.worksheet !== "boolean") throw new TypeError("Worksheet must be true or false");
  if (!Array.isArray(input.lists) || input.lists.length !== 3) throw new TypeError("A Venn diagram has 3 lists");
  if (typeof input.ignoreCase !== "boolean") throw new TypeError("Ignore case must be true or false");
  return {
    title: requireText(input.title, VENN_LIMITS.title, "The title"),
    count: requireChoice(input.count, [2, 3], "set count"),
    names: input.names.map((name) => requireText(name, VENN_LIMITS.name, "A set name")),
    colors: input.colors.map((color) => color.toLowerCase()),
    source: requireChoice(input.source, VENN_SOURCES, "source"),
    regions: Object.fromEntries(REGION_KEYS.map((key) => [key, requireText(input.regions[key], VENN_LIMITS.region, "A region")])),
    lists: input.lists.map((list) => requireText(list, VENN_LIMITS.list, "A list")),
    ignoreCase: input.ignoreCase,
    show: requireChoice(input.show, VENN_SHOWS, "display"),
    shaded: [...new Set(input.shaded)],
    universe: { show: input.universe.show, name: requireText(input.universe.name, VENN_LIMITS.universe, "The universal set's name") },
    worksheet: input.worksheet,
    fill: requireChoice(input.fill, Object.keys(VENN_FILLS), "fill"),
    textSize: requireChoice(input.textSize, Object.keys(VENN_TEXT_SIZES), "text size"),
    font: requireChoice(input.font, FONT_IDS, "font"),
    background: requireChoice(input.background, VENN_BACKGROUNDS, "background"),
  };
}

// A list's items: one per line, or, on a single line, separated by commas, semicolons, or tabs.
export function listItems(text) {
  const lines = text.split(/\r?\n/);
  return (lines.length > 1 ? lines : text.split(/[,;\t]/)).map((item) => item.replace(/\s+/g, " ").trim()).filter(Boolean);
}

// Compares the sets' lists: which region each distinct item falls in (an item in A and C only falls in ac), how many
// distinct items each set has, and how many there are in all. Items match ignoring repeated spaces, and case when the
// diagram ignores it; each keeps the spelling it first appeared with.
export function compareVennLists(venn) {
  const setIndexes = Array.from({ length: venn.count }, (_, index) => index);
  const items = new Map();
  setIndexes.forEach((index) => listItems(venn.lists[index]).forEach((item) => {
    const key = venn.ignoreCase ? item.toLowerCase() : item;
    if (!items.has(key)) items.set(key, { item, sets: new Set() });
    items.get(key).sets.add(index);
  }));
  const regions = Object.fromEntries(VENN_REGIONS[venn.count].map((key) => [key, []]));
  for (const { item, sets } of items.values()) regions[[...sets].sort().map((index) => VENN_SET_KEYS[index]).join("")].push(item);
  const sizes = setIndexes.map((index) => [...items.values()].filter(({ sets }) => sets.has(index)).length);
  return { regions, sizes, unique: items.size };
}

// The text each region draws: typed, or found by comparing the lists, as items or as a count.
function regionTexts(venn) {
  if (venn.source === "regions") return venn.regions;
  const { regions } = compareVennLists(venn);
  const shown = Object.fromEntries(Object.entries(regions).map(([key, items]) => [key, venn.show === "counts" ? String(items.length) : items.join("\n")]));
  return { ...venn.regions, ...shown };
}

// Switching how regions are filled carries the content over: lists become the regions they fill, and regions become
// each set's list of everything in its circle.
export function regionsFromLists(venn) {
  return { ...venn.regions, ...Object.fromEntries(Object.entries(compareVennLists(venn).regions).map(([key, items]) => [key, items.join("\n")])) };
}
export function listsFromRegions(venn) {
  return VENN_SET_KEYS.map((setKey) => VENN_REGIONS[venn.count].filter((key) => key.includes(setKey)).flatMap((key) => itemsOf(venn.regions[key])).join("\n"));
}

// Circle centers and region anchors on a unit radius. Two sets overlap by half a radius each; three sit on a triangle
// whose pairwise and triple regions leave room for a short list.
const GEOMETRY = {
  2: {
    centers: [[-0.5, 0], [0.5, 0]],
    anchors: { a: [-1, 0], b: [1, 0], ab: [0, 0] },
    textWidth: 130,
  },
  3: {
    centers: [[-0.51, -0.51 / Math.sqrt(3)], [0.51, -0.51 / Math.sqrt(3)], [0, 1.02 / Math.sqrt(3)]],
    anchors: { a: [-0.9, -0.5], b: [0.9, -0.5], c: [0, 1.1], ab: [0, -0.75], ac: [-0.65, 0.375], bc: [0.65, 0.375], abc: [0, 0] },
    textWidth: 110,
  },
};
const MEMBERSHIP = { a: [true, false, false], b: [false, true, false], c: [false, false, true], ab: [true, true, false], ac: [true, false, true], bc: [false, true, true], abc: [true, true, true] };
const SPACING = Object.freeze({ margin: 24, regionPadding: 10, itemGap: 4, nameGap: 8, titleGap: 16, creditGap: 12, minRadius: 110, maxRadius: 4096, universePadding: 16, universeInset: 10, headerGap: 20, ruleGap: 28 });
const TITLE_STYLE = Object.freeze({ size: 22, weight: TYPE_SCALE.title.weight, lineSpacing: 28 });
const COUNT_STYLE = Object.freeze({ size: 20, weight: TYPE_SCALE.title.weight, lineSpacing: 26 });
const NUMBER = /^[-+]?\d+(?:[.,]\d+)*%?$/;
const CREDIT_STYLE = Object.freeze({ size: 10, weight: TYPE_SCALE.small.weight, lineSpacing: 14 });
// The worksheet's Name and Date lines: a label and a line to write on, as wide as the diagram allows.
const WORKSHEET = Object.freeze({ fields: ["Name", "Date"], fieldGap: 24, labelGap: 6, minLine: 90, minWidth: 420 });
const WORD_CAP = 1.6;
const STROKES = Object.freeze({ circle: 1.5, universe: 1.5, rule: 1, hatch: 1.5, hatchGap: 7 });
const VENN_CREDIT = "Made with svgdiagram.ai";

const itemsOf = (text) => text.split("\n").map((item) => item.trim()).filter(Boolean);
const scaled = (style, factor) => ({ size: Math.round(style.size * factor * 2) / 2, weight: style.weight, lineSpacing: Math.round(style.lineSpacing * factor) });

// Wraps text, turning a word too wide for its line into a message the visitor can act on.
function wrapInput(text, options) {
  try {
    return wrapLines(text, options);
  } catch (error) {
    if (error instanceof TextFitError) throw new TextFitError(`A word in "${text}" is too long to fit. Shorten it or add a space.`);
    throw error;
  }
}

// A list of items wrapped to a width and stacked, each line at its offset from the block's top.
function stackItems(items, { style, maxWidth, measureText }) {
  const lines = [];
  let top = 0, width = 0;
  items.forEach((item, index) => {
    if (index) top += SPACING.itemGap;
    const block = wrapInput(item, { style, maxWidth, wordCap: maxWidth * WORD_CAP, measureText });
    block.lines.forEach((text) => {
      lines.push({ text, top });
      top += style.lineSpacing;
    });
    width = Math.max(width, block.width);
  });
  return { lines, width, height: top };
}

// Whether every region's padded block sits inside its own circles and clear of the others at radius r.
function fitsAt(radius, { centers, anchors }, blocks) {
  return blocks.every(({ key, width, height }) => {
    const x = anchors[key][0] * radius, y = anchors[key][1] * radius;
    const halfWidth = width / 2 + SPACING.regionPadding, halfHeight = height / 2 + SPACING.regionPadding;
    return centers.every(([cx, cy], index) => {
      const dx = Math.abs(x - cx * radius), dy = Math.abs(y - cy * radius);
      if (MEMBERSHIP[key][index]) return Math.hypot(dx + halfWidth, dy + halfHeight) <= radius;
      return Math.hypot(Math.max(dx - halfWidth, 0), Math.max(dy - halfHeight, 0)) >= radius;
    });
  });
}

// The smallest radius, from minRadius, at which every region's text fits: doubled until it fits, then narrowed.
function fittingRadius(geometry, blocks, minRadius, tooMuch) {
  if (fitsAt(minRadius, geometry, blocks)) return minRadius;
  let low = minRadius, high = low * 2;
  while (!fitsAt(high, geometry, blocks)) {
    if (high >= SPACING.maxRadius) throw new TextFitError(tooMuch);
    low = high;
    high *= 2;
  }
  while (high - low > 0.5) {
    const middle = (low + high) / 2;
    if (fitsAt(middle, geometry, blocks)) high = middle;
    else low = middle;
  }
  return Math.ceil(high);
}

// A shade of a set color that reads as text on white: the color itself when it does, mixed toward black until it does.
function readableInk(color) {
  let ink = color;
  for (let step = 1; contrastRatio(ink, "#ffffff") < 4.5 && step <= 20; step++) ink = mixHex(color, "#000000", step / 20);
  return ink;
}

// Wrapped lines at x, from top down.
function placeLines(lines, { x, top, style }) {
  return lines.map((text, index) => ({ text, x: roundCoordinate(x), y: centeredBaseline(top + index * style.lineSpacing, style) }));
}

// Lays out a Venn diagram in one font: wraps each region's items, sizes the circles to fit them, and places set names
// beside their circles, the optional universal set's box with what lies outside every circle, the worksheet's lines,
// the title, and the credit. Every position is absolute; shaded regions are named by the circles they are in and out of.
export function layoutVenn(venn, measureText) {
  const factor = VENN_TEXT_SIZES[venn.textSize];
  const styles = { body: scaled(TYPE_SCALE.body, factor), name: scaled(TYPE_SCALE.title, factor), title: scaled(TITLE_STYLE, factor), count: scaled(COUNT_STYLE, factor) };
  const geometry = GEOMETRY[venn.count];
  const textWidth = geometry.textWidth * factor;
  const setIndexes = Array.from({ length: venn.count }, (_, index) => index);
  const texts = regionTexts(venn);
  const filled = VENN_REGIONS[venn.count].map((key) => ({ key, items: itemsOf(texts[key]) })).filter(({ items }) => items.length);
  // Regions that hold only numbers (counts) draw them large and bold, as a textbook does.
  const outsideItems = venn.universe.show ? itemsOf(texts[VENN_OUTSIDE]) : [];
  const numeric = filled.length > 0 && [...filled.flatMap(({ items }) => items), ...outsideItems].every((item) => NUMBER.test(item));
  const regionStyle = numeric ? styles.count : styles.body;
  const blocks = filled.map(({ key, items }) => ({ key, ...stackItems(items, { style: regionStyle, maxWidth: textWidth, measureText }) }));
  // A name's longest word fits between neighboring centers, so names never run into each other.
  const nameWords = setIndexes.flatMap((index) => venn.names[index].trim().split(/\s+/).filter(Boolean));
  const longestNameWord = Math.max(0, ...nameWords.map((word) => measureText(word, styles.name)));
  const tooMuch = venn.source === "lists" && venn.show === "items"
    ? "There are too many items to show in the circles. Show counts instead."
    : "There is too much text to fit. Shorten some items.";
  const radius = fittingRadius(geometry, blocks, Math.max(SPACING.minRadius, Math.ceil(longestNameWord + 2 * SPACING.nameGap)), tooMuch);
  const centers = geometry.centers.map(([x, y]) => [x * radius, y * radius]);

  // Set names sit above the upper circles and below the lower one.
  const names = setIndexes.filter((index) => venn.names[index].trim()).map((index) => {
    const [cx, cy] = centers[index];
    const below = cy > 0;
    const block = wrapLines(venn.names[index].trim(), { style: styles.name, maxWidth: (below ? 2 * radius : radius) - 2 * SPACING.nameGap, measureText });
    const top = below ? cy + radius + SPACING.nameGap : cy - radius - SPACING.nameGap - block.height;
    return { index, block, cx, top };
  });

  const circlesLeft = Math.min(...centers.map(([x]) => x - radius));
  const circlesRight = Math.max(...centers.map(([x]) => x + radius));
  const circlesTop = Math.min(...centers.map(([, y]) => y - radius));
  const circlesBottom = Math.max(...centers.map(([, y]) => y + radius));
  let left = circlesLeft, right = circlesRight;
  let top = Math.min(circlesTop, ...names.map((name) => name.top));
  let bottom = Math.max(circlesBottom, ...names.map((name) => name.top + name.block.height));

  // The universal set's box frames the circles and their names, with its name in the top corner and what lies outside
  // every circle in the bottom corner.
  let universe = null;
  if (venn.universe.show) {
    const label = wrapInput(venn.universe.name.trim() || "U", { style: styles.name, maxWidth: right - left, measureText });
    const outside = outsideItems.length ? stackItems(outsideItems, { style: regionStyle, maxWidth: textWidth * 1.4, measureText }) : null;
    const box = {
      left: left - SPACING.universePadding,
      right: right + SPACING.universePadding,
      top: top - SPACING.universePadding - label.height - SPACING.universeInset,
      bottom: bottom + SPACING.universePadding + (outside ? outside.height + SPACING.universeInset : 0),
    };
    universe = { label, outside, box };
    ({ left, right, top, bottom } = box);
  }

  const bodyWidth = right - left;
  const title = venn.title.trim() ? wrapInput(venn.title.trim(), { style: styles.title, maxWidth: Math.max(bodyWidth, 320), measureText }) : null;
  const credit = measureText(VENN_CREDIT, CREDIT_STYLE);
  const width = Math.ceil(Math.max(bodyWidth, title?.width ?? 0, credit, venn.worksheet ? WORKSHEET.minWidth : 0) + SPACING.margin * 2);
  const headerTop = SPACING.margin;
  const titleTop = headerTop + (venn.worksheet ? styles.body.lineSpacing + SPACING.headerGap : 0);
  const bodyTop = titleTop + (title ? title.height + SPACING.titleGap : 0);
  const offsetX = width / 2 - (left + right) / 2, offsetY = bodyTop - top;
  const at = (x, y) => [roundCoordinate(x + offsetX), roundCoordinate(y + offsetY)];
  const creditTop = bodyTop + (bottom - top) + SPACING.creditGap;
  const height = Math.ceil(creditTop + CREDIT_STYLE.lineSpacing + SPACING.margin / 2);

  // Name and Date share the header row, each a label and a line, splitting the width between them.
  const fieldWidth = (width - 2 * SPACING.margin - WORKSHEET.fieldGap) / WORKSHEET.fields.length;
  const header = venn.worksheet
    ? WORKSHEET.fields.map((field, index) => {
      const x = SPACING.margin + index * (fieldWidth + WORKSHEET.fieldGap);
      const lineStart = x + measureText(field, styles.body) + WORKSHEET.labelGap;
      const baseline = centeredBaseline(headerTop, styles.body);
      return { text: field, x, y: baseline, line: { x1: roundCoordinate(lineStart), x2: roundCoordinate(Math.max(x + fieldWidth, lineStart + WORKSHEET.minLine)), y: baseline + 2 } };
    })
    : [];
  const ruleSpacing = SPACING.ruleGap * factor;
  const rules = venn.worksheet
    ? Array.from({ length: Math.floor((circlesBottom - circlesTop) / ruleSpacing) }, (_, index) => roundCoordinate(circlesTop + (index + 1) * ruleSpacing + offsetY))
    : [];

  const [boxLeft, boxTop] = universe ? at(universe.box.left, universe.box.top) : [0, 0];
  const [boxRight, boxBottom] = universe ? at(universe.box.right, universe.box.bottom) : [0, 0];
  const regionKeys = [...VENN_REGIONS[venn.count], ...(universe ? [VENN_OUTSIDE] : [])];

  return {
    width,
    height,
    background: venn.background === "white" ? "#ffffff" : null,
    header: header.length ? { fields: header, style: styles.body, color: INK.body, lineColor: INK.faint, strokeWidth: STROKES.rule } : null,
    title: title ? { lines: placeLines(title.lines, { x: width / 2, top: titleTop, style: styles.title }), style: styles.title, color: INK.strong } : null,
    universe: universe ? {
      x: boxLeft, y: boxTop, width: roundCoordinate(boxRight - boxLeft), height: roundCoordinate(boxBottom - boxTop),
      color: INK.body, strokeWidth: STROKES.universe,
      label: { lines: placeLines(universe.label.lines, { x: boxLeft + SPACING.universeInset, top: boxTop + SPACING.universeInset, style: styles.name }), style: styles.name, color: INK.strong },
      outside: universe.outside ? {
        lines: universe.outside.lines.map((line) => ({ text: line.text, x: roundCoordinate(boxRight - SPACING.universeInset), y: centeredBaseline(boxBottom - SPACING.universeInset - universe.outside.height + line.top, regionStyle) })),
      } : null,
    } : null,
    circles: setIndexes.map((index) => {
      const [cx, cy] = at(...centers[index]);
      return { cx, cy, r: radius, color: venn.colors[index], fillOpacity: VENN_FILLS[venn.fill], strokeWidth: STROKES.circle };
    }),
    shaded: regionKeys.filter((key) => venn.shaded.includes(key)).map((key) => ({
      key,
      inside: key === VENN_OUTSIDE ? [] : setIndexes.filter((index) => MEMBERSHIP[key][index]),
      outside: key === VENN_OUTSIDE ? setIndexes : setIndexes.filter((index) => !MEMBERSHIP[key][index]),
    })),
    hatch: { color: INK.body, strokeWidth: STROKES.hatch, gap: STROKES.hatchGap },
    rules: rules.length ? { ys: rules, x1: roundCoordinate(circlesLeft + offsetX), x2: roundCoordinate(circlesRight + offsetX), color: INK.faint, strokeWidth: STROKES.rule } : null,
    names: names.map(({ index, block, cx, top: nameTop }) => ({ lines: placeLines(block.lines, { x: cx + offsetX, top: nameTop + offsetY, style: styles.name }), color: readableInk(venn.colors[index]) })),
    nameStyle: styles.name,
    regions: blocks.map(({ key, lines, height: blockHeight }) => {
      const [x, y] = at(geometry.anchors[key][0] * radius, geometry.anchors[key][1] * radius);
      return { key, lines: lines.map((line) => ({ text: line.text, x, y: centeredBaseline(y - blockHeight / 2 + line.top, regionStyle) })) };
    }),
    regionStyle,
    regionColor: INK.body,
    credit: { text: VENN_CREDIT, x: width - SPACING.margin, y: centeredBaseline(creditTop, CREDIT_STYLE), style: CREDIT_STYLE, color: INK.muted },
  };
}
