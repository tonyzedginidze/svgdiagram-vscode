import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { dirname, resolve } from 'node:path';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
const messages = {};
if (new Set(Object.values(messages).map(message => message.id)).size !== Object.keys(messages).length) throw new Error('Translation message ID collision');
const base = resolve(import.meta.dirname, '..');
const web = resolve(base, 'shared/app');
const output = resolve(base, '.data/app');
const licenseSources = await Bun.file(resolve(base, 'scripts/licenses/sources.json')).json();
export async function bundleApp({ entry = resolve(base, 'src/main.js'), outputDirectory = output, aliases = {}, globalName = 'SVGDiagramCanva', translations = messages, format = 'iife', external = [], scriptFile = 'app.js', cssFile = null } = {}) {
const result = await build({ root: base, configFile: false, define: { 'process.env.NODE_ENV': JSON.stringify('production') }, plugins: [{ name: 'shared-maker-imports', enforce: 'pre', transform(source, id) {
  if (!id.startsWith(web) || !id.endsWith('.vue')) return;
  const names = [...new Set([...source.matchAll(/<FeaturesTools(\w+)/g)].map(match => match[1]))];
  return source.replace('<script setup>', `<script setup>\nimport { computed } from 'vue';\n${names.map(name => `import FeaturesTools${name} from '${web}/components/features/tools/${name}.vue';`).join('\n')}`);
}}, vue()], resolve: { alias: { '~': web, '@': web, ...aliases } }, build: { write: false, lib: { entry, name: globalName, formats: [format] }, cssCodeSplit: false, rollupOptions: { external, output: { inlineDynamicImports: true, exports: format === 'cjs' ? 'default' : 'auto' } } } });
const files = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output);
const script = files.filter(file => file.type === 'chunk').map(file => file.code).join('\n');
const css = files.filter(file => file.type === 'asset' && file.fileName.endsWith('.css')).map(file => file.source).join('\n');
const licenses = new Map();
const dependencyVersions = {};
for (const id of files.filter(file => file.type === 'chunk').flatMap(file => Object.keys(file.modules))) {
  if (!id.includes('/node_modules/')) continue;
  let directory = dirname(id.split('?')[0].replace(/^\0/, ''));
  while (directory.includes('/node_modules/')) {
    const manifest = Bun.file(resolve(directory, 'package.json'));
    if (await manifest.exists()) {
      const metadata = await manifest.json();
      const key = `${metadata.name}@${metadata.version}`;
      if (metadata.name) dependencyVersions[key] = metadata.version;
      if (metadata.name && !licenses.has(key)) {
        let text = '';
        for (const name of (await readdir(directory)).filter(name => /^(licen[cs]e|copying)(\.|$)/i.test(name)).sort()) {
          const file = Bun.file(resolve(directory, name));
          if (await file.exists()) { text = await file.text(); break; }
        }
        const source = licenseSources[`${metadata.name}@${metadata.version}`];
        if (!text && source) text = await Bun.file(resolve(base, 'scripts/licenses', source.file)).text();
        if (!text) throw new Error(`Missing bundled dependency license: ${metadata.name}`);
        licenses.set(key, `${metadata.name} ${metadata.version}\n${text}`);
      }
      break;
    }
    directory = dirname(directory);
  }
}
const notices = [...licenses.values()].join('\n\n');
await mkdir(outputDirectory, { recursive: true });
await writeFile(resolve(outputDirectory, 'THIRD_PARTY_NOTICES.txt'), notices);
await writeFile(resolve(outputDirectory, 'dependencies.json'), JSON.stringify(dependencyVersions, null, 2));
const injectedStyle = cssFile ? '' : `(()=>{const style=document.createElement('style');style.textContent=${JSON.stringify(css)};document.head.appendChild(style)})();\n`;
await writeFile(resolve(outputDirectory, scriptFile), `/*!\n${notices.replaceAll('*/', '* /')}\n*/\n${injectedStyle}${script}`);
if (cssFile) await writeFile(resolve(outputDirectory, cssFile), css);
if (Object.keys(translations).length) await writeFile(resolve(outputDirectory, 'messages_en.json'), JSON.stringify(Object.fromEntries(Object.entries(translations).map(([, { id, defaultMessage, description }]) => [id, { defaultMessage, description }])), null, 2));
console.log(`Prepared ${outputDirectory}; JavaScript ${script.length} characters; ${Object.keys(translations).length} translation messages.`);

}
