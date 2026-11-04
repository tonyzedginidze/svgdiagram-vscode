<script setup>
import { toolFontFamily } from "~/lib/tools/toolFonts.js";

const props = defineProps({
  diagram: { type: Object, required: true },
  creditHref: { type: String, default: "https://svgdiagram.ai" },
});

const fontFamily = computed(() => `'${toolFontFamily(props.diagram.fontId)}', sans-serif`);
const canvas = computed(() => ({ width: props.diagram.width, height: props.diagram.height }));
const fillBg = computed(() => (props.diagram.background ? "#ffffff" : "transparent"));
const mainColor = computed(() => props.diagram.colors[0] || "#2563eb");
const accentColor = computed(() => props.diagram.colors[1] || "#1d4ed8");
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="canvas.width" :height="canvas.height" :viewBox="`0 0 ${canvas.width} ${canvas.height}`" :font-family="fontFamily">
    <!-- Background -->
    <rect v-if="props.diagram.background" :width="canvas.width" :height="canvas.height" :fill="fillBg" />

    <!-- Worksheet Header (Name & Date fields) -->
    <g v-if="props.diagram.nameDate">
      <template v-for="(field, idx) in props.diagram.nameDate.fields" :key="`field-${idx}`">
        <FeaturesToolsScatterPlotText :block="field.label" />
        <line :x1="field.line.x1" :x2="field.line.x2" :y1="field.line.y" :y2="field.line.y" :stroke="field.line.stroke" :stroke-width="field.line.strokeWidth" :stroke-dasharray="field.line.dash" />
      </template>
    </g>

    <!-- Title -->
    <FeaturesToolsScatterPlotText :block="props.diagram.title" />

    <!-- Clip Path for Plot Area (clips best-fit line) -->
    <defs>
      <clipPath id="scatter-plot-area">
        <rect :x="props.diagram.plot.left" :y="props.diagram.plot.top" :width="props.diagram.plot.width" :height="props.diagram.plot.height" />
      </clipPath>
    </defs>

    <!-- Grid lines -->
    <g stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2,2">
      <line v-for="(tick, idx) in props.diagram.xTicks" :key="`vgrid-${idx}`" :x1="tick.cx" :x2="tick.cx" :y1="props.diagram.plot.top" :y2="props.diagram.plot.bottom" />
      <line v-for="(tick, idx) in props.diagram.yTicks" :key="`hgrid-${idx}`" :x1="props.diagram.plot.left" :x2="props.diagram.plot.right" :y1="tick.cy" :y2="tick.cy" />
    </g>

    <!-- Plot Frame / Main Axes -->
    <rect :x="props.diagram.plot.left" :y="props.diagram.plot.top" :width="props.diagram.plot.width" :height="props.diagram.plot.height" fill="none" stroke="#94a3b8" stroke-width="1.5" />

    <!-- X Ticks & Labels -->
    <g>
      <g v-for="(tick, idx) in props.diagram.xTicks" :key="`xtick-${idx}`">
        <line :x1="tick.cx" :x2="tick.cx" :y1="props.diagram.plot.bottom" :y2="props.diagram.plot.bottom + 5" stroke="#334155" stroke-width="1.5" />
        <FeaturesToolsScatterPlotText :block="tick.block" />
      </g>
    </g>

    <!-- Y Ticks & Labels -->
    <g>
      <g v-for="(tick, idx) in props.diagram.yTicks" :key="`ytick-${idx}`">
        <line :x1="props.diagram.plot.left - 5" :x2="props.diagram.plot.left" :y1="tick.cy" :y2="tick.cy" stroke="#334155" stroke-width="1.5" />
        <FeaturesToolsScatterPlotText :block="tick.block" />
      </g>
    </g>

    <!-- Axis Titles -->
    <FeaturesToolsScatterPlotText :block="props.diagram.xAxisLabelBlock" />

    <g v-if="props.diagram.yAxisLabelBlock">
      <FeaturesToolsScatterPlotText :block="props.diagram.yAxisLabelBlock" :transform="`rotate(-90 ${props.diagram.yAxisLabelBlock.x} ${props.diagram.yAxisLabelBlock.top})`" />
    </g>

    <!-- Best-fit Linear Trendline -->
    <g v-if="props.diagram.bestFitLine" clip-path="url(#scatter-plot-area)">
      <line :x1="props.diagram.bestFitLine.x1" :y1="props.diagram.bestFitLine.y1" :x2="props.diagram.bestFitLine.x2" :y2="props.diagram.bestFitLine.y2" :stroke="accentColor" stroke-width="2.5" stroke-dasharray="6,4" />
    </g>

    <!-- Points -->
    <g v-for="point in props.diagram.points" :key="`pt-${point.index}`">
      <circle :cx="point.cx" :cy="point.cy" r="5.5" :fill="mainColor" stroke="#ffffff" stroke-width="1.5" />
      <FeaturesToolsScatterPlotText v-if="point.labelBlock" :block="point.labelBlock" />
    </g>

    <!-- Statistics Panel (Positioned Outside / Below Plot Area) -->
    <g v-if="props.diagram.statsCard">
      <rect :x="props.diagram.statsCard.x" :y="props.diagram.statsCard.y" :width="props.diagram.statsCard.width" :height="props.diagram.statsCard.height" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
      <FeaturesToolsScatterPlotText :block="props.diagram.statsCard.title" />
      <FeaturesToolsScatterPlotText v-for="(item, idx) in props.diagram.statsCard.items" :key="`stat-${idx}`" :block="item" />
    </g>

    <!-- Footnotes -->
    <FeaturesToolsScatterPlotText v-for="(fn, idx) in props.diagram.footnotes" :key="`fn-${idx}`" :block="fn" />

    <!-- Credit Footer Link -->
    <a :href="props.creditHref" target="_blank" rel="noopener">
      <FeaturesToolsScatterPlotText :block="props.diagram.credit" class="hover:underline cursor-pointer" />
    </a>
  </svg>
</template>
