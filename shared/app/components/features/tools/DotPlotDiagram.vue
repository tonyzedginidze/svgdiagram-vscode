<script setup>
import { toolFontFamily } from "~/lib/tools/toolFonts.js";

const props = defineProps({
  diagram: { type: Object, required: true },
  creditHref: { type: String, required: true },
});

const fontFamily = computed(() => `'${toolFontFamily(props.diagram.fontId)}', sans-serif`);
const canvas = computed(() => ({ width: props.diagram.width, height: props.diagram.height }));
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="canvas.width" :height="canvas.height" :viewBox="`0 0 ${canvas.width} ${canvas.height}`" :font-family="fontFamily">
    <rect v-if="props.diagram.background" :width="canvas.width" :height="canvas.height" :fill="props.diagram.background" />

    <g v-if="props.diagram.nameDate">
      <template v-for="field in props.diagram.nameDate.fields" :key="field.label.lines[0].text">
        <FeaturesToolsDotPlotText :block="field.label" />
        <line :x1="field.line.x1" :x2="field.line.x2" :y1="field.line.y" :y2="field.line.y" :stroke="field.line.stroke" :stroke-width="field.line.strokeWidth" :stroke-dasharray="field.line.dash" />
      </template>
    </g>

    <FeaturesToolsDotPlotText :block="props.diagram.title" />

    <g v-for="(dot, index) in props.diagram.dots" :key="`dot-${index}`">
      <circle :cx="dot.cx" :cy="dot.cy" :r="dot.r" :fill="dot.fill" :stroke="dot.stroke" :stroke-width="dot.strokeWidth" />
    </g>

    <line :x1="props.diagram.axis.x1" :x2="props.diagram.axis.x2" :y1="props.diagram.axis.y" :y2="props.diagram.axis.y" :stroke="props.diagram.axis.stroke" :stroke-width="props.diagram.axis.strokeWidth" stroke-linecap="butt" />
    <line v-for="(tick, index) in props.diagram.axis.ticks" :key="`tick-${index}`" :x1="tick.x" :x2="tick.x" :y1="tick.y1" :y2="tick.y2" :stroke="tick.stroke" :stroke-width="tick.strokeWidth" stroke-linecap="butt" />

    <template v-for="(tick, index) in props.diagram.axis.ticks" :key="`tick-label-${index}`">
      <FeaturesToolsDotPlotText :block="tick.label" />
      <line v-if="tick.guide" :x1="tick.guide.x1" :x2="tick.guide.x2" :y1="tick.guide.y" :y2="tick.guide.y" :stroke="tick.guide.stroke" :stroke-width="tick.guide.strokeWidth" :stroke-dasharray="tick.guide.dash" />
    </template>

    <FeaturesToolsDotPlotText :block="props.diagram.xLabel" />

    <FeaturesToolsDotPlotText v-for="(note, index) in props.diagram.footnotes" :key="`note-${index}`" :block="note" />

    <a :href="props.creditHref">
      <FeaturesToolsDotPlotText :block="props.diagram.credit" />
    </a>
  </svg>
</template>
