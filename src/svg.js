export function svgDataUrl(svg) {
  const bytes = new TextEncoder().encode(svg);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

export function cleanSvg(svg) {
  if (typeof svg !== 'string' || svg.length > 2000000 || /<!DOCTYPE/i.test(svg)) throw new Error('invalid_svg');
  const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = document.documentElement;
  if (root.localName !== 'svg' || root.namespaceURI !== 'http://www.w3.org/2000/svg' || document.querySelector('parsererror')) throw new Error('invalid_svg');
  root.querySelectorAll('a').forEach(anchor => anchor.remove());
  [root, ...root.querySelectorAll('*')].forEach(node => {
    if (node.namespaceURI !== root.namespaceURI || /^(script|foreignObject|iframe|object|embed|animate|animateMotion|animateTransform|set|discard)$/i.test(node.localName)) throw new Error('invalid_svg');
    for (const attr of [...node.attributes]) {
      if (/^on/i.test(attr.name) || (['href', 'xlink:href', 'src'].includes(attr.name) && !attr.value.startsWith('#'))) throw new Error('invalid_svg');
      if (['vector-effect','tabindex','lang','transform-origin'].includes(attr.name)) node.removeAttribute(attr.name);
      if (['style', 'fill', 'stroke', 'filter', 'clip-path', 'mask', 'cursor', 'marker-start', 'marker-mid', 'marker-end'].includes(attr.name)) validateStyles(attr.value);
    }
    if (node.localName === 'style') validateStyles(node.textContent);
  });
  const [,, width, height] = (root.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
  const w = Number(root.getAttribute('width')) || width, h = Number(root.getAttribute('height')) || height;
  if (!(w > 0 && h > 0 && w * h <= 16000000)) throw new Error('invalid_svg');
  root.setAttribute('width', w); root.setAttribute('height', h);
  return new XMLSerializer().serializeToString(root);
}

function validateStyles(css) {
  if (/\\|\/\*|@import|expression\s*\(/i.test(css)) throw new Error('invalid_svg');
  for (const match of css.matchAll(/url\s*\(\s*['"]?([^)'"\s]+)['"]?\s*\)/gi)) {
    if (!match[1].startsWith('#') && !/^data:font\/(woff2?|ttf|otf);base64,[A-Za-z0-9+/=]+$/i.test(match[1])) throw new Error('invalid_svg');
  }
}
