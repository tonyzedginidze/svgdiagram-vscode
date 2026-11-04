<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { MAKERS } from './makers.js';
import Fields from './Fields.vue';
import { prepareMaker } from './render.js';
import { cleanSvg, svgDataUrl } from './svg.js';

const props = defineProps({ target: { type: String, required: true }, service: { type: Function, default: null }, insert: { type: Function, required: true }, makerOnly: { type: Boolean, default: false }, insertLabel: { type: String, default: 'Add to note' } });
const selected = ref(MAKERS[0].id);
const maker = computed(() => MAKERS.find(item => item.id === selected.value));
const state = ref(structuredClone(maker.value.initial));
const mode = ref('maker');
const diagram = ref(null);
const fontCss = ref('');
const preview = ref(null);
const problem = ref('');
const message = ref('');
const operation = ref(null);
const consent = ref(false);
const prompt = ref('');
const remaining = ref(null);
const aiSvg = ref('');
const aiUrl = computed(() => aiSvg.value ? svgDataUrl(aiSvg.value) : '');
const retry = ref(null);
let destroyed = false;
let revision = 0;
watch(selected, () => { state.value = structuredClone(maker.value.initial); message.value = ''; });
watch(state, async () => {
  const version = ++revision;
  diagram.value = null; problem.value = '';
  try {
    const prepared = await prepareMaker(maker.value, state.value);
    if (destroyed || version !== revision) return;
    fontCss.value = prepared.fontCss; diagram.value = prepared.diagram;
  } catch (error) { if (!destroyed && version === revision) problem.value = error.message; }
}, { deep: true, immediate: true });
onBeforeUnmount(() => { destroyed = true; revision++; });
watch(consent, async value => {
  if (!value || operation.value) return;
  operation.value = 'quota';
  try { const result = await props.service('quota'); if (!destroyed) remaining.value = result.remaining; }
  catch (error) { if (!destroyed) message.value = error.message; }
  finally { if (!destroyed) operation.value = null; }
});
async function generate(same = false) {
  if (operation.value || !consent.value || prompt.value.trim().length < 3 || remaining.value === 0) return;
  if (same && retry.value?.prompt !== prompt.value.trim()) { message.value = 'The prompt changed. Start a new generation.'; return; }
  operation.value = 'generate'; message.value = '';
  if (!same) retry.value = { actionId: crypto.randomUUID(), prompt: prompt.value.trim() };
  try {
    const result = await props.service('generations', retry.value);
    if (destroyed) return;
    aiSvg.value = cleanSvg(result.svg); remaining.value = result.remaining; retry.value = null;
    message.value = 'Ready. Review your diagram before adding it.';
  } catch (error) {
    if (!destroyed) { message.value = error.message; if (error.code === 'obsidian_trial_exhausted') remaining.value = 0; }
  } finally { if (!destroyed) operation.value = null; }
}
async function insert() {
  if (operation.value) return;
  operation.value = 'insert'; message.value = '';
  try {
    await nextTick();
    let svg = aiSvg.value;
    if (mode.value === 'maker') {
      if (!diagram.value || problem.value || !preview.value?.querySelector('svg')) throw new Error(problem.value || 'Wait for the preview.');
      const root = preview.value.querySelector('svg').cloneNode(true);
      root.setAttribute('width', diagram.value.width); root.setAttribute('height', diagram.value.height);
      const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      style.textContent = fontCss.value; root.prepend(style);
      svg = cleanSvg(new XMLSerializer().serializeToString(root).replace(/<!--[\s\S]*?-->/g, ''));
    }
    await props.insert({ svg, name: mode.value === 'maker' ? state.value.title || maker.value.label : prompt.value.trim() || 'AI diagram' });
  } catch (error) { if (!destroyed) message.value = error.message; }
  finally { if (!destroyed) operation.value = null; }
}
</script>
<template>
  <div class="sd-app">
    <nav v-if="!makerOnly" class="sd-tabs" aria-label="Creation method"><button :aria-pressed="mode === 'maker'" :disabled="!!operation" @click="mode = 'maker'; message = ''">Free makers</button><button :aria-pressed="mode === 'ai'" :disabled="!!operation" @click="mode = 'ai'; message = ''">AI generation</button></nav>
    <div class="sd-workspace">
      <fieldset class="sd-controls" :disabled="!!operation">
        <template v-if="mode === 'maker'">
          <label class="sd-field"><span>Diagram type</span><select v-model="selected" class="dropdown"><option v-for="item in MAKERS" :key="item.id" :value="item.id">{{ item.label }}</option></select></label>
          <label class="sd-field"><span>Start from an example</span><select :key="selected" class="dropdown" value="" @change="state = structuredClone(maker.examples[Number($event.target.value)].state)"><option value="" disabled>Choose an example</option><option v-for="(example,index) in maker.examples" :key="index" :value="index">{{ example.label }}</option></select></label>
          <Fields :state="state" :set-count="state.count || 3"/>
          <button @click="state = structuredClone(maker.initial)">Reset maker</button>
        </template>
        <template v-else>
          <div class="sd-ai-heading"><strong>Turn words into a diagram</strong><span class="sd-badge">{{ remaining === null ? '10 free' : `${remaining} left` }}</span></div>
          <p>10 free AI generations per installation. No SVG Diagram account needed. Failed generations aren’t counted.</p>
          <label class="sd-check sd-consent"><input v-model="consent" type="checkbox"/>Send my prompt and an anonymous installation ID to svgdiagram.ai to generate diagrams and track my allowance.</label>
          <label class="sd-field"><span>Describe your diagram</span><textarea v-model="prompt" maxlength="2000" rows="5" placeholder="Compare renewable and nonrenewable energy"/></label>
          <button class="mod-cta sd-wide" :disabled="!consent || prompt.trim().length < 3 || remaining === 0" @click="generate()">{{ operation === 'generate' ? 'Generating…' : 'Generate diagram' }}</button>
          <button v-if="retry" class="sd-wide" :disabled="!consent || retry.prompt !== prompt.trim()" @click="generate(true)">Retry same request</button>
          <p v-if="remaining === 0">Your AI allowance is used. Free makers stay unlimited.</p>
          <p class="sd-muted">Nothing from your vault is sent. <a href="https://svgdiagram.ai/privacy">Privacy</a> · <a href="https://svgdiagram.ai/terms">Terms</a></p>
        </template>
      </fieldset>
      <section class="sd-preview-panel" aria-label="Diagram preview">
        <div ref="preview" class="sd-preview">
          <template v-if="mode === 'maker'"><component :is="maker.component" v-if="diagram" :diagram="diagram" credit-href="https://svgdiagram.ai"/><component :is="'style'">{{ fontCss }}</component><p v-if="problem" role="alert">{{ problem }}</p><p v-else-if="!diagram">Preparing preview…</p></template>
          <img v-else-if="aiUrl" :src="aiUrl" alt="Generated diagram preview"/><p v-else>Your generated diagram will appear here.</p>
        </div>
        <p v-if="message" role="status" aria-live="polite" class="sd-notice">{{ message }}</p>
        <button class="mod-cta sd-wide" :disabled="!!operation || (mode === 'maker' ? !diagram || !!problem : !aiSvg)" @click="insert">{{ operation === 'insert' ? 'Adding…' : insertLabel }}</button>
        <p class="sd-muted">{{ target }}.</p>
      </section>
    </div>
  </div>
</template>
