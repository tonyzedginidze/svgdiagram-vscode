<script setup>
import { toolFontFamily } from "~/lib/tools/toolFonts.js";

const props = defineProps({
  diagram: { type: Object, required: true },
  creditHref: { type: String, required: true },
});

const fontFamily = computed(() => `'${toolFontFamily(props.diagram.fontId)}', sans-serif`);
const canvas = computed(() => ({ width: props.diagram.width, height: props.diagram.height }));
const grid = computed(() => props.diagram.grid);
const axes = computed(() => props.diagram.axes);
const points = computed(() => props.diagram.points);
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="canvas.width" :height="canvas.height" :viewBox="`0 0 ${canvas.width} ${canvas.height}`" :font-family="fontFamily">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" :fill="axes.color" />
      </marker>
    </defs>

    <rect v-if="props.diagram.background" :width="canvas.width" :height="canvas.height" :fill="props.diagram.background" />

    <!-- Name and Date for Worksheets -->
    <g v-if="props.diagram.nameDate">
      <template v-for="field in props.diagram.nameDate.fields" :key="field.label.lines[0].text">
        <FeaturesToolsCoordinatePlaneText :block="field.label" />
        <line :x1="field.line.x1" :x2="field.line.x2" :y1="field.line.y" :y2="field.line.y" :stroke="field.line.stroke" :stroke-width="field.line.strokeWidth" :stroke-dasharray="field.line.dash" />
      </template>
    </g>

    <!-- Title -->
    <FeaturesToolsCoordinatePlaneText :block="props.diagram.title" />

    <!-- Grid lines -->
    <g stroke-linecap="butt">
      <line v-for="(line, index) in grid.xLines" :key="`x-grid-${index}`" :x1="line.x" :x2="line.x" :y1="line.y1" :y2="line.y2" :stroke="axes.gridColor" stroke-width="1" />
      <line v-for="(line, index) in grid.yLines" :key="`y-grid-${index}`" :x1="line.x1" :x2="line.x2" :y1="line.y" :y2="line.y" :stroke="axes.gridColor" stroke-width="1" />
    </g>

    <!-- Grid outer border frame -->
    <rect :x="grid.left" :y="grid.top" :width="grid.width" :height="grid.height" fill="none" :stroke="axes.gridColor" stroke-width="1.5" />

    <!-- Main Axes (Plane mode) -->
    <g v-if="axes.show">
      <!-- X-axis line (only if y=0 is within visible grid bounds) -->
      <line v-if="axes.showXAxis" :x1="grid.left - 10" :x2="grid.left + grid.width + 10" :y1="axes.xAxisY" :y2="axes.xAxisY" :stroke="axes.color" stroke-width="2" marker-end="url(#arrow)" marker-start="url(#arrow)" />
      <!-- Y-axis line (only if x=0 is within visible grid bounds) -->
      <line v-if="axes.showYAxis" :x1="axes.yAxisX" :x2="axes.yAxisX" :y1="grid.top + grid.height + 10" :y2="grid.top - 10" :stroke="axes.color" stroke-width="2" marker-end="url(#arrow)" marker-start="url(#arrow)" />

      <!-- Axis Names -->
      <FeaturesToolsCoordinatePlaneText :block="axes.xAxisName" />
      <FeaturesToolsCoordinatePlaneText :block="axes.yAxisName" />

      <!-- Origin Zero label -->
      <FeaturesToolsCoordinatePlaneText :block="axes.originZero" />

      <!-- Tick Labels -->
      <FeaturesToolsCoordinatePlaneText v-for="(block, index) in axes.xTickLabels" :key="`xtick-${index}`" :block="block" />
      <FeaturesToolsCoordinatePlaneText v-for="(block, index) in axes.yTickLabels" :key="`ytick-${index}`" :block="block" />
    </g>

    <!-- Plotted Points and Connecting Path (Plane mode) -->
    <g v-if="points.dots.length">
      <!-- Connecting line path -->
      <path v-if="points.connectPath" :d="points.connectPath" fill="none" :stroke="points.lineColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Dots -->
      <circle v-for="(dot, index) in points.dots" :key="`dot-${index}`" :cx="dot.cx" :cy="dot.cy" :r="dot.r" :fill="dot.fill" :stroke="dot.stroke" :stroke-width="dot.strokeWidth" />

      <!-- Labels -->
      <FeaturesToolsCoordinatePlaneText v-for="(lbl, index) in points.labels" :key="`pt-lbl-${index}`" :block="lbl" />
    </g>

    <!-- Footnotes -->
    <FeaturesToolsCoordinatePlaneText v-for="(note, index) in props.diagram.footnotes" :key="`note-${index}`" :block="note" />

    <!-- Credit -->
    <a :href="props.creditHref">
      <FeaturesToolsCoordinatePlaneText :block="props.diagram.credit" />
    </a>
  </svg>
</template>
