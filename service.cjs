const API = 'https://svgdiagram.ai/rest/v1/generations';
const path = require('node:path');
const { realpath } = require('node:fs/promises');

async function generateDiagram(key, prompt, signal, request = fetch) {
  const response = await request(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, design: 'auto' }),
    signal
  });
  let body;
  try { body = await response.json(); } catch { throw new Error(`SVG Diagram returned an unreadable response (HTTP ${response.status}).`); }
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : `SVG Diagram returned HTTP ${response.status}.`);
  if (typeof body.item?.svg !== 'string' || !/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(body.item.svg)) throw new Error('SVG Diagram returned no valid SVG.');
  return body.item.svg;
}

function markdownImage(relativePath) {
  return `![Diagram](${relativePath.split('/').map(encodeURIComponent).join('/')})`;
}

async function relativeImagePath(documentPath, imagePath) {
  const [document, image] = await Promise.all([realpath(documentPath), realpath(imagePath)]);
  const relative = path.relative(path.dirname(document), image);
  if (path.isAbsolute(relative)) throw new Error('The diagram is on a different drive. Insert a reference manually.');
  return relative.split(path.sep).join('/');
}

module.exports = { generateDiagram, markdownImage, relativeImagePath };
