import interLatin400 from "@fontsource/inter/files/inter-latin-400-normal.woff2?url";
import interLatin700 from "@fontsource/inter/files/inter-latin-700-normal.woff2?url";
import interLatinExt400 from "@fontsource/inter/files/inter-latin-ext-400-normal.woff2?url";
import interLatinExt700 from "@fontsource/inter/files/inter-latin-ext-700-normal.woff2?url";
import sourceSans3Latin400 from "@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff2?url";
import sourceSans3Latin700 from "@fontsource/source-sans-3/files/source-sans-3-latin-700-normal.woff2?url";
import sourceSans3LatinExt400 from "@fontsource/source-sans-3/files/source-sans-3-latin-ext-400-normal.woff2?url";
import sourceSans3LatinExt700 from "@fontsource/source-sans-3/files/source-sans-3-latin-ext-700-normal.woff2?url";
import archivoLatin400 from "@fontsource/archivo/files/archivo-latin-400-normal.woff2?url";
import archivoLatin700 from "@fontsource/archivo/files/archivo-latin-700-normal.woff2?url";
import archivoLatinExt400 from "@fontsource/archivo/files/archivo-latin-ext-400-normal.woff2?url";
import archivoLatinExt700 from "@fontsource/archivo/files/archivo-latin-ext-700-normal.woff2?url";
import barlowCondensedLatin400 from "@fontsource/barlow-condensed/files/barlow-condensed-latin-400-normal.woff2?url";
import barlowCondensedLatin700 from "@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2?url";
import barlowCondensedLatinExt400 from "@fontsource/barlow-condensed/files/barlow-condensed-latin-ext-400-normal.woff2?url";
import barlowCondensedLatinExt700 from "@fontsource/barlow-condensed/files/barlow-condensed-latin-ext-700-normal.woff2?url";
import { FONT_SUBSETS, FONT_WEIGHTS, fontSubsetsFor, resolveFont } from "@svgdiagram/diagram/web";

// The bundled faces a tool draws with, by font, subset, and weight: the regular and bold weights of the type scale.
const FACE_URLS = {
  "inter": { "latin": { 400: interLatin400, 700: interLatin700 }, "latin-ext": { 400: interLatinExt400, 700: interLatinExt700 } },
  "source-sans-3": { "latin": { 400: sourceSans3Latin400, 700: sourceSans3Latin700 }, "latin-ext": { 400: sourceSans3LatinExt400, 700: sourceSans3LatinExt700 } },
  "archivo": { "latin": { 400: archivoLatin400, 700: archivoLatin700 }, "latin-ext": { 400: archivoLatinExt400, 700: archivoLatinExt700 } },
  "barlow-condensed": { "latin": { 400: barlowCondensedLatin400, 700: barlowCondensedLatin700 }, "latin-ext": { 400: barlowCondensedLatinExt400, 700: barlowCondensedLatinExt700 } },
};
const WEIGHTS = Object.values(FONT_WEIGHTS);
const [PRIMARY_SUBSET] = FONT_SUBSETS;
async function fontBytes(url) {
  if (url.startsWith('data:')) {
    const separator = url.indexOf(',');
    if (separator < 0 || !url.slice(0, separator).endsWith(';base64')) throw new Error('Bundled font data must be base64 encoded');
    return Uint8Array.from(atob(url.slice(separator + 1)), character => character.charCodeAt(0));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Font file returned ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

// A tool's own family name for a bundled font, so its faces never mix with the site's web fonts of the same name.
export const toolFontFamily = (fontId) => `svgdiagram ${resolveFont(fontId).cssName}`;

const loads = new Map();

// Adds the font's faces to the document once and resolves when text can be measured and drawn in them.
export function loadToolFont(fontId) {
  if (!loads.has(fontId)) {
    const family = toolFontFamily(fontId);
    const faces = [];
    loads.set(fontId, Promise.all(FONT_SUBSETS.flatMap(({ id, unicodeRange }) => WEIGHTS.map(async weight => ({ bytes: await fontBytes(FACE_URLS[fontId][id][weight]), weight, unicodeRange })))).then(definitions => {
      for (const { bytes, weight, unicodeRange } of definitions) {
        const face = new FontFace(family, bytes, { weight: String(weight), unicodeRange });
        faces.push(face);
        document.fonts.add(face);
      }
      return Promise.all(faces.map(face => face.load()));
    }).catch((error) => {
      loads.delete(fontId);
      faces.forEach((face) => document.fonts.delete(face));
      throw error;
    }));
  }
  return loads.get(fontId);
}

let measureContext = null;

// Text width in a loaded font, in the measureText shape the engine's wrapping takes.
export function toolMeasureText(fontId) {
  const family = toolFontFamily(fontId);
  measureContext ||= document.createElement("canvas").getContext("2d");
  return (text, { size, weight }) => {
    measureContext.font = `${weight} ${size}px "${family}"`;
    return measureContext.measureText(text).width;
  };
}

const encodedFaces = new Map();

async function encodedFace(url) {
  if (!encodedFaces.has(url)) {
    encodedFaces.set(url, fontBytes(url).then(bytes => {
      let binary = "";
      for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
      return btoa(binary);
    }).catch((error) => {
      encodedFaces.delete(url);
      throw error;
    }));
  }
  return encodedFaces.get(url);
}

// The @font-face CSS a downloaded SVG embeds for its text: the primary subset last and without a range, so it renders
// every character it has, as the preview measured it; latin-ext only when the text needs it.
export async function embeddedFontCss(fontId, text) {
  const family = toolFontFamily(fontId);
  const subsets = fontSubsetsFor(text);
  const faces = FONT_SUBSETS.filter(({ id }) => subsets.has(id)).sort((a, b) => Number(a.id === PRIMARY_SUBSET.id) - Number(b.id === PRIMARY_SUBSET.id));
  const rules = await Promise.all(faces.flatMap(({ id, unicodeRange }) => WEIGHTS.map(async (weight) => {
    const data = await encodedFace(FACE_URLS[fontId][id][weight]);
    const range = id === PRIMARY_SUBSET.id ? "" : `;unicode-range:${unicodeRange}`;
    return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${data}) format('woff2');font-style:normal;font-weight:${weight}${range}}`;
  })));
  return rules.join("");
}
