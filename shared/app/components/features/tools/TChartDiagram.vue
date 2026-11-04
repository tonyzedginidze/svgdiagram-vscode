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
        <FeaturesToolsTChartText :block="field.label" />
        <line :x1="field.line.x1" :x2="field.line.x2" :y1="field.line.y" :y2="field.line.y" :stroke="field.line.stroke" :stroke-width="field.line.strokeWidth" :stroke-dasharray="field.line.dash" />
      </template>
    </g>

    <FeaturesToolsTChartText :block="props.diagram.title" />

    <g>
      <rect :x="props.diagram.chart.header.left.x" :y="props.diagram.chart.header.left.y" :width="props.diagram.chart.header.left.width" :height="props.diagram.chart.header.left.height" :fill="props.diagram.chart.header.left.fill" :fill-opacity="props.diagram.chart.header.left.fillOpacity" />
      <rect :x="props.diagram.chart.header.right.x" :y="props.diagram.chart.header.right.y" :width="props.diagram.chart.header.right.width" :height="props.diagram.chart.header.right.height" :fill="props.diagram.chart.header.right.fill" :fill-opacity="props.diagram.chart.header.right.fillOpacity" />
      <rect :x="props.diagram.chart.x" :y="props.diagram.chart.y" :width="props.diagram.chart.width" :height="props.diagram.chart.height" fill="none" :stroke="props.diagram.chart.stroke" :stroke-width="props.diagram.chart.strokeWidth" />
      <line :x1="props.diagram.chart.crossbar.x1" :x2="props.diagram.chart.crossbar.x2" :y1="props.diagram.chart.crossbar.y" :y2="props.diagram.chart.crossbar.y" :stroke="props.diagram.chart.crossbar.stroke" :stroke-width="props.diagram.chart.crossbar.strokeWidth" />
      <line :x1="props.diagram.chart.stem.x" :x2="props.diagram.chart.stem.x" :y1="props.diagram.chart.stem.y1" :y2="props.diagram.chart.stem.y2" :stroke="props.diagram.chart.stem.stroke" :stroke-width="props.diagram.chart.stem.strokeWidth" />
      <FeaturesToolsTChartText :block="props.diagram.chart.header.leftHeading" />
      <FeaturesToolsTChartText :block="props.diagram.chart.header.rightHeading" />
      <line v-if="props.diagram.chart.header.leftGuide" :x1="props.diagram.chart.header.leftGuide.x1" :x2="props.diagram.chart.header.leftGuide.x2" :y1="props.diagram.chart.header.leftGuide.y" :y2="props.diagram.chart.header.leftGuide.y" :stroke="props.diagram.chart.header.leftGuide.stroke" :stroke-width="props.diagram.chart.header.leftGuide.strokeWidth" :stroke-dasharray="props.diagram.chart.header.leftGuide.dash" />
      <line v-if="props.diagram.chart.header.rightGuide" :x1="props.diagram.chart.header.rightGuide.x1" :x2="props.diagram.chart.header.rightGuide.x2" :y1="props.diagram.chart.header.rightGuide.y" :y2="props.diagram.chart.header.rightGuide.y" :stroke="props.diagram.chart.header.rightGuide.stroke" :stroke-width="props.diagram.chart.header.rightGuide.strokeWidth" :stroke-dasharray="props.diagram.chart.header.rightGuide.dash" />

      <g v-for="(row, index) in props.diagram.chart.rows" :key="index">
        <line v-if="index < props.diagram.chart.rows.length - 1" :x1="row.separator.x1" :x2="row.separator.x2" :y1="row.separator.y" :y2="row.separator.y" :stroke="row.separator.stroke" :stroke-width="row.separator.strokeWidth" />
        <FeaturesToolsTChartText :block="row.left" />
        <FeaturesToolsTChartText :block="row.right" />
        <line v-if="row.leftGuide" :x1="row.leftGuide.x1" :x2="row.leftGuide.x2" :y1="row.leftGuide.y" :y2="row.leftGuide.y" :stroke="row.leftGuide.stroke" :stroke-width="row.leftGuide.strokeWidth" :stroke-dasharray="row.leftGuide.dash" />
        <line v-if="row.rightGuide" :x1="row.rightGuide.x1" :x2="row.rightGuide.x2" :y1="row.rightGuide.y" :y2="row.rightGuide.y" :stroke="row.rightGuide.stroke" :stroke-width="row.rightGuide.strokeWidth" :stroke-dasharray="row.rightGuide.dash" />
      </g>
    </g>

    <a :href="props.creditHref">
      <FeaturesToolsTChartText :block="props.diagram.credit" />
    </a>
  </svg>
</template>
