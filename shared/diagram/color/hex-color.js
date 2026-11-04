export const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function channels(hex) {
  const digits = hex.length === 4 ? [...hex.slice(1)].map((digit) => digit + digit).join("") : hex.slice(1);
  return [0, 2, 4].map((offset) => Number.parseInt(digits.slice(offset, offset + 2), 16));
}

// Blends a #rgb or #rrggbb color toward another by amount (0 keeps the color, 1 gives the other), returning #rrggbb.
export function mixHex(hex, other, amount) {
  const target = channels(other);
  return `#${channels(hex).map((channel, index) => Math.round(channel + (target[index] - channel) * amount).toString(16).padStart(2, "0")).join("")}`;
}

function channelLuminance(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const [red, green, blue] = channels(hex).map(channelLuminance);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

// Whether two #rgb or #rrggbb colors are the same color, whatever their spelling.
export function sameHex(first, second) {
  return channels(first).every((channel, index) => channel === channels(second)[index]);
}

// WCAG relative luminance and contrast ratio.
export function contrastRatio(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

// How finely an ink is searched toward a stronger one.
const INK_STEPS = 20;

// The ink mixed toward a stronger one as little as holds target contrast on fill: the ink itself when it already does,
// and toward when even that falls short.
export function readableInk(ink, toward, fill, target = 4.5) {
  for (let step = 0; step < INK_STEPS; step += 1) {
    const candidate = mixHex(ink, toward, step / INK_STEPS);
    if (contrastRatio(candidate, fill) >= target) return candidate;
  }
  return toward;
}

// Conservative contrast across interpolated colors, including intermediate channel combinations.
export function minimumContrast(ink, colors) {
  const values = colors.map(channels);
  const bound = (select) => `#${[0, 1, 2].map((index) => select(...values.map((value) => value[index])).toString(16).padStart(2, "0")).join("")}`;
  const low = luminance(bound(Math.min));
  const high = luminance(bound(Math.max));
  const foreground = luminance(ink);
  if (foreground >= low && foreground <= high) return 1;
  return foreground > high ? (foreground + 0.05) / (high + 0.05) : (low + 0.05) / (foreground + 0.05);
}

// The hue of a #rgb or #rrggbb color in degrees (0–360), or null for a gray, which has none.
export function hueOf(hex) {
  const [red, green, blue] = channels(hex).map((channel) => channel / 255);
  const max = Math.max(red, green, blue);
  const spread = max - Math.min(red, green, blue);
  if (spread === 0) return null;
  const sector = max === red ? ((green - blue) / spread + 6) % 6 : max === green ? (blue - red) / spread + 2 : (red - green) / spread + 4;
  return sector * 60;
}
