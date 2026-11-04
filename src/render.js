import { embeddedFontCss, loadToolFont, toolMeasureText } from '~/lib/tools/toolFonts.js';

export async function prepareMaker(maker, state) {
  const snapshot = JSON.parse(JSON.stringify(state, (_, value) => {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Maker numbers must be finite');
    return value;
  }));
  await loadToolFont(snapshot.font);
  const fontCss = await embeddedFontCss(snapshot.font, JSON.stringify(snapshot));
  const diagram = { ...maker.layout(snapshot, toolMeasureText(snapshot.font)), fontId: snapshot.font };
  return { diagram, fontCss };
}
