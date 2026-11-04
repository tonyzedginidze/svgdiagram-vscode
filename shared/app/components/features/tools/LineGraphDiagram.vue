<script setup>
import { toolFontFamily } from "~/lib/tools/toolFonts.js";

const props = defineProps({
  diagram: { type: Object, required: true },
  creditHref: { type: String, default: "https://svgdiagram.ai" },
});

const fontFamily = computed(() => `'${toolFontFamily(props.diagram.fontId)}', sans-serif`);
const canvas = computed(() => ({ width: props.diagram.width, height: props.diagram.height }));
const fillBg = computed(() => props.diagram.background || "transparent");
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="canvas.width" :height="canvas.height" :viewBox="`0 0 ${canvas.width} ${canvas.height}`" :font-family="fontFamily">
    <!-- Background -->
    <rect v-if="props.diagram.background && props.diagram.background !== 'transparent'" :width="canvas.width" :height="canvas.height" :fill="fillBg" />

    <!-- Worksheet Header -->
    <g v-if="props.diagram.worksheetHeader">
      <FeaturesToolsLineGraphText :block="props.diagram.worksheetHeader.nameLine" />
      <FeaturesToolsLineGraphText :block="props.diagram.worksheetHeader.dateLine" />
    </g>

    <!-- Title -->
    <FeaturesToolsLineGraphText :block="props.diagram.titleBlock" />

    <!-- Grid lines -->
    <g v-if="props.diagram.showGrid" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2,2">
      <!-- Horizontal grid lines -->
      <line v-for="(tick, idx) in props.diagram.yTicksBlocks" :key="`hgrid-${idx}`" :x1="props.diagram.yAxisX" :x2="props.diagram.chartRight" :y1="tick.y" :y2="tick.y" />
      <!-- Vertical grid lines -->
      <line v-for="(tick, idx) in props.diagram.categoryTicks" :key="`vgrid-${idx}`" :x1="tick.cx" :x2="tick.cx" :y1="props.diagram.chartTop" :y2="props.diagram.chartBottom" />
    </g>

    <!-- Plot Border Frame -->
    <rect :x="props.diagram.yAxisX" :y="props.diagram.chartTop" :width="props.diagram.chartWidth" :height="props.diagram.chartHeight" fill="none" stroke="#94a3b8" stroke-width="1.5" />

    <!-- Y Axis Ticks & Labels -->
    <g>
      <g v-for="(tick, idx) in props.diagram.yTicksBlocks" :key="`ytick-${idx}`">
        <line :x1="props.diagram.yAxisX - 5" :x2="props.diagram.yAxisX" :y1="tick.y" :y2="tick.y" stroke="#334155" stroke-width="1.5" />
        <FeaturesToolsLineGraphText :block="tick.block" />
      </g>
    </g>

    <!-- X Axis Ticks & Category Labels -->
    <g>
      <g v-for="(tick, idx) in props.diagram.categoryTicks" :key="`xtick-${idx}`">
        <line :x1="tick.cx" :x2="tick.cx" :y1="props.diagram.chartBottom" :y2="props.diagram.chartBottom + 5" stroke="#334155" stroke-width="1.5" />
        <FeaturesToolsLineGraphText v-if="tick.block" :block="tick.block" />
      </g>
    </g>

    <!-- Stride Disclosure Note -->
    <FeaturesToolsLineGraphText v-if="props.diagram.strideDisclosureBlock" :block="props.diagram.strideDisclosureBlock" />

    <!-- Axis Labels -->
    <FeaturesToolsLineGraphText :block="props.diagram.xAxisLabelBlock" />
    <g v-if="props.diagram.yAxisLabelBlock">
      <FeaturesToolsLineGraphText :block="props.diagram.yAxisLabelBlock" :transform="`rotate(-90 ${props.diagram.yAxisLabelBlock.x} ${props.diagram.yAxisLabelBlock.lines[0].y})`" />
    </g>

    <!-- Series Lines & Markers (Suppressed in Worksheet Mode) -->
    <g v-if="!props.diagram.worksheet">
      <g v-for="(s, sIdx) in props.diagram.seriesList" :key="`series-${sIdx}`">
        <!-- Connected Path Segments -->
        <path v-for="(p, pIdx) in s.paths" :key="`path-${sIdx}-${pIdx}`" :d="p.d" :stroke="s.color" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round" />

        <!-- Data Point Markers -->
        <g v-if="props.diagram.showMarkers">
          <circle v-for="(pt, ptIdx) in s.allPoints" :key="`marker-${sIdx}-${ptIdx}`" :cx="pt.cx" :cy="pt.cy" r="4.5" :fill="s.color" stroke="#ffffff" stroke-width="1.5" />
        </g>
        <!-- Isolated Singleton Points (drawn even when showMarkers is false so observations are not hidden) -->
        <g v-else-if="s.singletons && s.singletons.length">
          <circle v-for="(pt, ptIdx) in s.singletons" :key="`single-${sIdx}-${ptIdx}`" :cx="pt.cx" :cy="pt.cy" r="4.5" :fill="s.color" stroke="#ffffff" stroke-width="1.5" />
        </g>
      </g>
    </g>

    <!-- Legend (Suppressed in Worksheet Mode) -->
    <g v-if="props.diagram.legendBlock && !props.diagram.worksheet">
      <g v-for="(item, itemIdx) in props.diagram.legendBlock.items" :key="`lg-${itemIdx}`">
        <rect :x="item.badgeX" :y="item.badgeY - 5" width="12" height="10" rx="2" :fill="item.color" />
        <FeaturesToolsLineGraphText :block="item.block" />
      </g>
    </g>

    <!-- Credit Footer Link -->
    <a :href="props.creditHref" target="_blank" rel="noopener">
      <FeaturesToolsLineGraphText :block="props.diagram.creditBlock" class="hover:underline cursor-pointer" />
    </a>
  </svg>
</template>
