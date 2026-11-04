const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { generateDiagram, markdownImage, relativeImagePath } = require('../service.cjs');

test('sends only the supplied prompt to the generation endpoint', async () => {
  let sent;
  const svg = await generateDiagram('secret', 'A to B', undefined, async (url, options) => {
    sent = { url, options };
    return { ok: true, json: async () => ({ item: { svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>' } }) };
  });
  assert.match(svg, /^<svg/);
  assert.equal(sent.options.headers.Authorization, 'Bearer secret');
  assert.deepEqual(JSON.parse(sent.options.body), { prompt: 'A to B', design: 'auto' });
});

test('surfaces service errors and rejects missing SVG', async () => {
  await assert.rejects(generateDiagram('key', 'prompt', undefined, async () => ({ ok: false, status: 402, json: async () => ({ error: 'No credits' }) })), /No credits/);
  await assert.rejects(generateDiagram('key', 'prompt', undefined, async () => ({ ok: true, json: async () => ({ item: { svg: null } }) })), /no valid SVG/);
});

test('encodes Markdown image paths', () => {
  assert.equal(markdownImage('../images/my chart.svg'), '![Diagram](../images/my%20chart.svg)');
});

test('relative paths resolve equivalent symlinked and real workspace paths', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'svgdiagram-path-'));
  try {
    const actual = path.join(directory, 'actual');
    await fs.mkdir(actual);
    await fs.symlink(actual, path.join(directory, 'alias'));
    await fs.writeFile(path.join(actual, 'note.md'), '');
    await fs.writeFile(path.join(actual, 'image.svg'), '');
    assert.equal(await relativeImagePath(path.join(directory, 'alias', 'note.md'), path.join(actual, 'image.svg')), 'image.svg');
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
