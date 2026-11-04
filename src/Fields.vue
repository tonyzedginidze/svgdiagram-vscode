<script setup>
import { makerFields } from './makers.js';
import { resolveFont } from '@svgdiagram/diagram/web';
const props = defineProps({ state: { type: Object, required: true }, parent: { type: String, default: '' }, setCount: { type: Number, default: 3 } });
function update(key, value) { props.state[key] = value; }
</script>
<template>
  <div class="sd-fields">
    <template v-for="field in makerFields(state, parent, setCount)" :key="field.key">
      <fieldset v-if="field.key === 'shaded'" class="sd-group">
        <legend>{{ field.label }}</legend>
        <label v-for="region in field.options" :key="region" class="sd-check"><input v-model="state.shaded" type="checkbox" :value="region" />{{ field.optionLabels[region] }}</label>
      </fieldset>
      <fieldset v-else-if="Array.isArray(field.value)" class="sd-group">
        <legend>{{ field.label }}</legend>
        <div v-for="(item, index) in field.value.slice(0, field.count)" :key="index" class="sd-row">
          <Fields v-if="typeof item === 'object'" :state="item" :parent="field.key" :set-count="setCount" />
          <label v-else class="sd-field">
            <span>{{ field.label }} {{ index + 1 }}</span>
            <input v-if="field.key === 'colors'" v-model="state[field.key][index]" type="color" :aria-label="`${field.label} ${index + 1}`" />
            <textarea v-else-if="field.multiline" v-model="state[field.key][index]" rows="4" :maxlength="field.maxLength" />
            <input v-else v-model="state[field.key][index]" type="text" :maxlength="field.maxLength" />
          </label>
          <button v-if="!field.fixed" type="button" :disabled="field.value.length <= field.minimum" @click="field.value.splice(index, 1)">Remove {{ index + 1 }}</button>
        </div>
        <button v-if="!field.fixed" type="button" :disabled="field.value.length >= field.maximum" @click="field.value.push(structuredClone(field.item))">Add {{ field.label.toLowerCase() }}</button>
      </fieldset>
      <fieldset v-else-if="field.value !== null && typeof field.value === 'object'" class="sd-group">
        <legend>{{ field.label }}</legend><Fields :state="field.value" :parent="field.key" :set-count="setCount" />
      </fieldset>
      <label v-else-if="typeof field.value === 'boolean'" class="sd-check"><input type="checkbox" :checked="field.value" @change="update(field.key, $event.target.checked)" />{{ field.label }}</label>
      <label v-else class="sd-field">
        <span>{{ field.label }}</span>
        <select v-if="field.options" :value="field.value" @change="update(field.key, typeof field.value === 'number' ? Number($event.target.value) : $event.target.value)">
          <option v-for="option in field.options" :key="option" :value="option">{{ field.key === 'font' ? resolveFont(option).cssName : String(option).replaceAll('-', ' ') }}</option>
        </select>
        <textarea v-else-if="field.multiline" :value="field.value" rows="5" :maxlength="field.maxLength" @input="update(field.key, $event.target.value)" />
        <input v-else :type="typeof field.value === 'number' ? 'number' : 'text'" :value="field.value" :maxlength="field.maxLength" :step="field.key === 'donutRatio' ? 0.05 : undefined" @input="update(field.key, typeof field.value === 'number' ? Number($event.target.value) : $event.target.value)" />
      </label>
    </template>
  </div>
</template>
