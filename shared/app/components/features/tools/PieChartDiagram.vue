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

    <!-- Slices -->
    <g>
      <path v-for="slice in props.diagram.slices" :key="`slice-${slice.index}`" :d="slice.path" :fill="slice.color" :stroke="props.diagram.worksheet ? '#64748b' : '#ffffff'" stroke-width="1.5" stroke-linejoin="round" />
    </g>

    <!-- Inner Slice Percentage Text -->
    <g>
      <template v-for="slice in props.diagram.slices" :key="`slicetxt-${slice.index}`">
        <text v-if="slice.sliceText" :x="slice.textX" :y="slice.textY" text-anchor="middle" dominant-baseline="central" :font-size="props.diagram.sliceLabelStyle.size" :font-weight="props.diagram.sliceLabelStyle.weight" :fill="slice.textColor">
          {{ slice.sliceText }}
        </text>
      </template>
    </g>

    <!-- Donut Center Text -->
    <g v-if="props.diagram.donutCenterText">
      <text v-for="(line, index) in props.diagram.donutCenterText.label.lines" :key="`donut-lbl-${index}`" :x="line.x" :y="line.y" text-anchor="middle" :font-size="props.diagram.donutCenterText.label.style.size" :font-weight="props.diagram.donutCenterText.label.style.weight" :fill="props.diagram.donutCenterText.label.color">
        {{ line.text }}
      </text>
      <text v-for="(line, index) in props.diagram.donutCenterText.value.lines" :key="`donut-val-${index}`" :x="line.x" :y="line.y" text-anchor="middle" :font-size="props.diagram.donutCenterText.value.style.size" :font-weight="props.diagram.donutCenterText.value.style.weight" :fill="props.diagram.donutCenterText.value.color">
        {{ line.text }}
      </text>
    </g>

    <!-- Legend Items -->
    <g>
      <g v-for="item in props.diagram.legendItems" :key="`legend-${item.index}`">
        <!-- Swatch -->
        <rect :x="item.swatchX" :y="item.swatchY" :width="item.swatchSize" :height="item.swatchSize" rx="2" :fill="item.color" :stroke="props.diagram.worksheet ? '#64748b' : 'none'" stroke-width="1.25" />
        <!-- Label text lines -->
        <text v-for="(line, index) in item.labelBlock.lines" :key="`l-lbl-${item.index}-${index}`" :x="line.x" :y="line.y" text-anchor="start" :font-size="item.labelBlock.style.size" :font-weight="item.labelBlock.style.weight" :fill="item.labelBlock.color">
          {{ line.text }}
        </text>
        <!-- Value text lines -->
        <g v-if="item.valueBlock">
          <text v-for="(line, index) in item.valueBlock.lines" :key="`l-val-${item.index}-${index}`" :x="line.x" :y="line.y" text-anchor="end" :font-size="item.valueBlock.style.size" :font-weight="item.valueBlock.style.weight" :fill="item.valueBlock.color">
            {{ line.text }}
          </text>
        </g>
      </g>
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
