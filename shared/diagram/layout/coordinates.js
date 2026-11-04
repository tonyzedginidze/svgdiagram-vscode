// Rounds a derived coordinate to hundredths, so float noise such as 105.71764705882354 does not reach the SVG.
export function roundCoordinate(value) {
  return Math.round(value * 100) / 100;
}

// Rounds a size up to the next even whole number, so its half (a centered child's offset) stays on whole pixels.
export function evenCeil(value) {
  return Math.ceil(value / 2) * 2;
}
