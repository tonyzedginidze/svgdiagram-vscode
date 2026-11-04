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
        <FeaturesToolsNumberLineText :block="field.label" />
        <line :x1="field.line.x1" :x2="field.line.x2" :y1="field.line.y" :y2="field.line.y" :stroke="field.line.stroke" :stroke-width="field.line.strokeWidth" :stroke-dasharray="field.line.dash" />
      </template>
    </g>

    <FeaturesToolsNumberLineText :block="props.diagram.title" />

    <g v-for="(interval, index) in props.diagram.intervals" :key="`interval-${index}`">
      <rect v-if="interval.bar.width > 0" :x="interval.bar.x" :y="interval.bar.y" :width="interval.bar.width" :height="interval.bar.height" :fill="interval.bar.fill" rx="2" />
      <circle :cx="interval.start.cx" :cy="interval.start.cy" :r="interval.start.r" :fill="interval.start.fill" :stroke="interval.start.stroke" :stroke-width="interval.start.strokeWidth" />
      <circle :cx="interval.end.cx" :cy="interval.end.cy" :r="interval.end.r" :fill="interval.end.fill" :stroke="interval.end.stroke" :stroke-width="interval.end.strokeWidth" />
    </g>

    <line :x1="props.diagram.axis.x1" :x2="props.diagram.axis.x2" :y1="props.diagram.axis.y" :y2="props.diagram.axis.y" :stroke="props.diagram.axis.stroke" :stroke-width="props.diagram.axis.strokeWidth" stroke-linecap="butt" />
    <line v-for="(tick, index) in props.diagram.axis.ticks" :key="`tick-${index}`" :x1="tick.x" :x2="tick.x" :y1="tick.y1" :y2="tick.y2" :stroke="tick.stroke" :stroke-width="tick.strokeWidth" stroke-linecap="butt" />

    <g v-for="(point, index) in props.diagram.points" :key="`point-${index}`">
      <circle :cx="point.cx" :cy="point.cy" :r="point.r" :fill="point.fill" :stroke="point.stroke" :stroke-width="point.strokeWidth" />
    </g>

    <template v-for="(tick, index) in props.diagram.axis.ticks" :key="`tick-label-${index}`">
      <FeaturesToolsNumberLineText :block="tick.label" />
      <line v-if="tick.guide" :x1="tick.guide.x1" :x2="tick.guide.x2" :y1="tick.guide.y" :y2="tick.guide.y" :stroke="tick.guide.stroke" :stroke-width="tick.guide.strokeWidth" :stroke-dasharray="tick.guide.dash" />
    </template>

    <FeaturesToolsNumberLineText v-for="(point, index) in props.diagram.points" :key="`point-label-${index}`" :block="point.label" />

    <g v-for="(item, index) in props.diagram.legend" :key="`legend-${index}`">
      <rect :x="item.swatch.x" :y="item.swatch.y" :width="item.swatch.width" :height="item.swatch.height" :rx="item.swatch.rx" :fill="item.swatch.fill" />
      <FeaturesToolsNumberLineText :block="item.label" />
    </g>

    <FeaturesToolsNumberLineText v-for="(note, index) in props.diagram.footnotes" :key="`note-${index}`" :block="note" />

    <a :href="props.creditHref">
      <FeaturesToolsNumberLineText :block="props.diagram.credit" />
    </a>
  </svg>
</template>
