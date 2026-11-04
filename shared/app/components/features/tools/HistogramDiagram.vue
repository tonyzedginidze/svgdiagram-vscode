<script setup>
import { toolFontFamily } from "~/lib/tools/toolFonts.js";

const props = defineProps({
  diagram: { type: Object, required: true },
  creditHref: { type: String, required: true },
});

const fontStyle = computed(() => ({ fontFamily: `"${toolFontFamily(props.diagram.fontId)}", sans-serif` }));
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" :viewBox="`0 0 ${props.diagram.width} ${props.diagram.height}`" class="h-auto w-full max-w-full select-none" :style="fontStyle">
    <!-- Background -->
    <rect v-if="props.diagram.background !== 'transparent'" x="0" y="0" :width="props.diagram.width" :height="props.diagram.height" :fill="props.diagram.background" />

    <!-- Title Block -->
    <g v-if="props.diagram.titleBlock">
      <text v-for="(line, index) in props.diagram.titleBlock.lines" :key="`title-${index}`" :x="line.x" :y="line.y" :text-anchor="props.diagram.titleBlock.anchor" :font-size="props.diagram.titleBlock.style.size" :font-weight="props.diagram.titleBlock.style.weight" :fill="props.diagram.titleBlock.color">
        {{ line.text }}
      </text>
    </g>

    <!-- Worksheet Header -->
    <g v-if="props.diagram.worksheetHeader">
      <text v-for="(line, index) in props.diagram.worksheetHeader.nameLine.lines" :key="`name-${index}`" :x="line.x" :y="line.y" :font-size="props.diagram.worksheetHeader.nameLine.style.size" :font-weight="props.diagram.worksheetHeader.nameLine.style.weight" :fill="props.diagram.worksheetHeader.nameLine.color">
        {{ line.text }}
      </text>
      <text v-for="(line, index) in props.diagram.worksheetHeader.dateLine.lines" :key="`date-${index}`" :x="line.x" :y="line.y" :font-size="props.diagram.worksheetHeader.dateLine.style.size" :font-weight="props.diagram.worksheetHeader.dateLine.style.weight" :fill="props.diagram.worksheetHeader.dateLine.color">
        {{ line.text }}
      </text>
    </g>

    <!-- Horizontal Grid Lines & Y Ticks -->
    <g>
      <g v-for="(yTick, index) in props.diagram.yTicksBlocks" :key="`grid-${index}`">
        <!-- Grid line across chart -->
        <line :x1="props.diagram.yAxisX" :y1="yTick.y" :x2="props.diagram.chartRight" :y2="yTick.y" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3 3" />
        <!-- Tick mark on Y axis -->
        <line :x1="props.diagram.yAxisX - 4" :y1="yTick.y" :x2="props.diagram.yAxisX" :y2="yTick.y" stroke="#475569" stroke-width="1.25" />
        <!-- Tick label -->
        <text v-for="(line, lIndex) in yTick.block.lines" :key="`ytick-lbl-${index}-${lIndex}`" :x="line.x" :y="line.y" text-anchor="end" :font-size="yTick.block.style.size" :font-weight="yTick.block.style.weight" :fill="yTick.block.color">
          {{ line.text }}
        </text>
      </g>
    </g>

    <!-- Bars -->
    <g>
      <g v-for="bar in props.diagram.bars" :key="`bar-${bar.index}`">
        <!-- Continuous adjacent bar rect -->
        <rect :x="bar.x" :y="bar.y" :width="bar.width" :height="bar.height" :fill="bar.frame ? 'none' : bar.fill" :fill-opacity="bar.frame ? 0 : 0.85" :stroke="bar.stroke" stroke-width="1" />
        <!-- Count label above bar -->
        <g v-if="bar.countBlock">
          <text v-for="(line, lIndex) in bar.countBlock.lines" :key="`count-${bar.index}-${lIndex}`" :x="line.x" :y="line.y" text-anchor="middle" :font-size="bar.countBlock.style.size" :font-weight="bar.countBlock.style.weight" :fill="bar.countBlock.color">
            {{ line.text }}
          </text>
        </g>
      </g>
    </g>

    <!-- Y-Axis Line -->
    <line :x1="props.diagram.yAxisX" :y1="props.diagram.chartTop" :x2="props.diagram.yAxisX" :y2="props.diagram.chartBottom" stroke="#334155" stroke-width="1.75" />

    <!-- X-Axis Line -->
    <line :x1="props.diagram.yAxisX" :y1="props.diagram.chartBottom" :x2="props.diagram.chartRight" :y2="props.diagram.chartBottom" stroke="#334155" stroke-width="1.75" />

    <!-- X-Axis Edge Ticks and Labels -->
    <g>
      <g v-for="(edge, index) in props.diagram.edgeTicks" :key="`edge-${index}`">
        <!-- Tick mark on X axis -->
        <line :x1="edge.x" :y1="props.diagram.chartBottom" :x2="edge.x" :y2="props.diagram.chartBottom + 5" stroke="#475569" stroke-width="1.25" />
        <!-- Edge label -->
        <g v-if="edge.block">
          <text v-for="(line, lIndex) in edge.block.lines" :key="`edge-lbl-${index}-${lIndex}`" :x="line.x" :y="line.y" text-anchor="middle" :font-size="edge.block.style.size" :font-weight="edge.block.style.weight" :fill="edge.block.color">
            {{ line.text }}
          </text>
        </g>
      </g>
    </g>

    <!-- X-Axis Title Label -->
    <g v-if="props.diagram.xAxisLabelBlock">
      <text v-for="(line, index) in props.diagram.xAxisLabelBlock.lines" :key="`xaxis-${index}`" :x="line.x" :y="line.y" text-anchor="middle" :font-size="props.diagram.xAxisLabelBlock.style.size" :font-weight="props.diagram.xAxisLabelBlock.style.weight" :fill="props.diagram.xAxisLabelBlock.color">
        {{ line.text }}
      </text>
    </g>

    <!-- Y-Axis Title Label (Rotated) -->
    <g v-if="props.diagram.yAxisLabelBlock">
      <text :x="props.diagram.yAxisLabelBlock.x" :y="props.diagram.yAxisLabelBlock.y" :transform="`rotate(-90, ${props.diagram.yAxisLabelBlock.x}, ${props.diagram.yAxisLabelBlock.y})`" text-anchor="middle" :font-size="props.diagram.yAxisLabelBlock.style.size" :font-weight="props.diagram.yAxisLabelBlock.style.weight" fill="#0f172a">
        {{ props.diagram.yAxisLabelBlock.text }}
      </text>
    </g>

    <!-- Credit Footer -->
    <g v-if="props.diagram.creditBlock">
      <a :href="props.creditHref" target="_blank" rel="noopener">
        <text v-for="(line, index) in props.diagram.creditBlock.lines" :key="`credit-${index}`" :x="line.x" :y="line.y" text-anchor="end" :font-size="props.diagram.creditBlock.style.size" :font-weight="props.diagram.creditBlock.style.weight" :fill="props.diagram.creditBlock.color">
          {{ line.text }}
        </text>
      </a>
    </g>
  </svg>
</template>
