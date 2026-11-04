import { dirname, resolve } from 'node:path';
import { bundleApp } from './bundle-app.js';
const base = resolve(import.meta.dirname, '..');
const vue = dirname(Bun.resolveSync('vue/package.json', base));
await bundleApp({ entry: resolve(base, 'src/main.js'), outputDirectory: resolve(base, 'media'), aliases: { vue, '@svgdiagram/diagram/web': resolve(base, 'shared/diagram/web.js') }, globalName: 'SVGDiagramVSCode', translations: {}, scriptFile: 'makers.js', cssFile: 'makers.css' });
