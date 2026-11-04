<script setup>
import { toolFontFamily } from "~/lib/tools/toolFonts.js";

// A laid-out Venn diagram as plain SVG: the universal set's box, translucent circles, hatched shaded regions, worksheet
// lines, set names, region items, the title, and the credit link. Everything is positioned by layoutVenn; this only
// draws it. A shaded region is a hatched canvas clipped to each circle it is in, chained, and masked by each it is not.
const props = defineProps({
  diagram: { type: Object, required: true },
  creditHref: { type: String, required: true },
});
const fontFamily = computed(() => `'${toolFontFamily(props.diagram.fontId)}', sans-serif`);
const canvas = computed(() => ({ width: props.diagram.width, height: props.diagram.height }));

const shading = computed(() => props.diagram.shaded.map(({ key, inside, outside }) => {
  const clips = inside.map((index, step) => ({ id: `venn-${key}-in-${index}`, parent: step ? `venn-${key}-in-${inside[step - 1]}` : null, index }));
  return { key, clips, clip: clips.at(-1)?.id || "venn-universe", mask: `venn-${key}-out`, outside };
}));
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="canvas.width" :height="canvas.height" :viewBox="`0 0 ${canvas.width} ${canvas.height}`" :font-family="fontFamily">
    <defs v-if="shading.length || props.diagram.rules">
      <pattern v-if="shading.length" id="venn-hatch" :width="props.diagram.hatch.gap" :height="props.diagram.hatch.gap" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" :y2="props.diagram.hatch.gap" :stroke="props.diagram.hatch.color" :stroke-width="props.diagram.hatch.strokeWidth" />
      </pattern>
      <clipPath v-if="props.diagram.universe" id="venn-universe">
        <rect :x="props.diagram.universe.x" :y="props.diagram.universe.y" :width="props.diagram.universe.width" :height="props.diagram.universe.height" />
      </clipPath>
      <template v-for="region in shading" :key="region.key">
        <clipPath v-for="clip in region.clips" :id="clip.id" :key="clip.id" :clip-path="clip.parent ? `url(#${clip.parent})` : undefined">
          <circle :cx="props.diagram.circles[clip.index].cx" :cy="props.diagram.circles[clip.index].cy" :r="props.diagram.circles[clip.index].r" />
        </clipPath>
        <mask :id="region.mask" maskUnits="userSpaceOnUse" x="0" y="0" :width="canvas.width" :height="canvas.height">
          <rect :width="canvas.width" :height="canvas.height" fill="#ffffff" />
          <circle v-for="index in region.outside" :key="index" :cx="props.diagram.circles[index].cx" :cy="props.diagram.circles[index].cy" :r="props.diagram.circles[index].r" fill="#000000" />
        </mask>
      </template>
      <clipPath v-if="props.diagram.rules" id="venn-circles">
        <circle v-for="(circle, index) in props.diagram.circles" :key="index" :cx="circle.cx" :cy="circle.cy" :r="circle.r" />
      </clipPath>
    </defs>

    <rect v-if="props.diagram.background" :width="canvas.width" :height="canvas.height" :fill="props.diagram.background" />
    <rect v-if="props.diagram.universe" :x="props.diagram.universe.x" :y="props.diagram.universe.y" :width="props.diagram.universe.width" :height="props.diagram.universe.height" fill="none" :stroke="props.diagram.universe.color" :stroke-width="props.diagram.universe.strokeWidth" />
    <circle v-for="(circle, index) in props.diagram.circles" :key="`fill-${index}`" :cx="circle.cx" :cy="circle.cy" :r="circle.r" :fill="circle.color" :fill-opacity="circle.fillOpacity" />
    <g v-for="region in shading" :key="region.key" :mask="`url(#${region.mask})`">
      <rect :width="canvas.width" :height="canvas.height" fill="url(#venn-hatch)" :clip-path="`url(#${region.clip})`" />
    </g>
    <g v-if="props.diagram.rules" clip-path="url(#venn-circles)" :stroke="props.diagram.rules.color" :stroke-width="props.diagram.rules.strokeWidth">
      <line v-for="y in props.diagram.rules.ys" :key="y" :x1="props.diagram.rules.x1" :x2="props.diagram.rules.x2" :y1="y" :y2="y" />
    </g>
    <circle v-for="(circle, index) in props.diagram.circles" :key="`edge-${index}`" :cx="circle.cx" :cy="circle.cy" :r="circle.r" fill="none" :stroke="circle.color" :stroke-width="circle.strokeWidth" />

    <g v-if="props.diagram.header" :font-size="props.diagram.header.style.size" :font-weight="props.diagram.header.style.weight">
      <template v-for="field in props.diagram.header.fields" :key="field.text">
        <text :x="field.x" :y="field.y" :fill="props.diagram.header.color">{{ field.text }}</text>
        <line :x1="field.line.x1" :x2="field.line.x2" :y1="field.line.y" :y2="field.line.y" :stroke="props.diagram.header.lineColor" :stroke-width="props.diagram.header.strokeWidth" />
      </template>
    </g>
    <g v-if="props.diagram.title" text-anchor="middle" :font-size="props.diagram.title.style.size" :font-weight="props.diagram.title.style.weight" :fill="props.diagram.title.color">
      <text v-for="(line, index) in props.diagram.title.lines" :key="index" :x="line.x" :y="line.y">{{ line.text }}</text>
    </g>
    <template v-if="props.diagram.universe">
      <g :font-size="props.diagram.universe.label.style.size" :font-weight="props.diagram.universe.label.style.weight" :fill="props.diagram.universe.label.color">
        <text v-for="(line, index) in props.diagram.universe.label.lines" :key="index" :x="line.x" :y="line.y">{{ line.text }}</text>
      </g>
      <g v-if="props.diagram.universe.outside" text-anchor="end" :font-size="props.diagram.regionStyle.size" :font-weight="props.diagram.regionStyle.weight" :fill="props.diagram.regionColor">
        <text v-for="(line, index) in props.diagram.universe.outside.lines" :key="index" :x="line.x" :y="line.y">{{ line.text }}</text>
      </g>
    </template>
    <g text-anchor="middle" :font-size="props.diagram.nameStyle.size" :font-weight="props.diagram.nameStyle.weight">
      <template v-for="(name, nameIndex) in props.diagram.names" :key="nameIndex">
        <text v-for="(line, index) in name.lines" :key="index" :x="line.x" :y="line.y" :fill="name.color">{{ line.text }}</text>
      </template>
    </g>
    <g text-anchor="middle" :font-size="props.diagram.regionStyle.size" :font-weight="props.diagram.regionStyle.weight" :fill="props.diagram.regionColor">
      <template v-for="region in props.diagram.regions" :key="region.key">
        <text v-for="(line, index) in region.lines" :key="index" :x="line.x" :y="line.y">{{ line.text }}</text>
      </template>
    </g>
    <a :href="props.creditHref">
      <text :x="props.diagram.credit.x" :y="props.diagram.credit.y" text-anchor="end" :font-size="props.diagram.credit.style.size" :font-weight="props.diagram.credit.style.weight" :fill="props.diagram.credit.color">{{ props.diagram.credit.text }}</text>
    </a>
  </svg>
</template>
