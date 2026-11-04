<script setup>
import { toolFontFamily } from "~/lib/tools/toolFonts.js";

const props = defineProps({
  diagram: { type: Object, required: true },
  creditHref: { type: String, required: true },
});

const fontFamily = computed(() => `'${toolFontFamily(props.diagram.fontId)}', sans-serif`);
const canvas = computed(() => ({ width: props.diagram.width, height: props.diagram.height }));
const cards = computed(() => (props.diagram.summary ? [props.diagram.summary.genotypes, props.diagram.summary.phenotypes] : []));
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="canvas.width" :height="canvas.height" :viewBox="`0 0 ${canvas.width} ${canvas.height}`" :font-family="fontFamily">
    <rect v-if="props.diagram.background" :width="canvas.width" :height="canvas.height" :fill="props.diagram.background" />

    <g v-if="props.diagram.header">
      <template v-for="field in props.diagram.header.fields" :key="field.label.lines[0].text">
        <FeaturesToolsPunnettText :block="field.label" />
        <line :x1="field.line.x1" :x2="field.line.x2" :y1="field.line.y" :y2="field.line.y" :stroke="field.line.stroke" :stroke-width="field.line.strokeWidth" :stroke-dasharray="field.line.dash" />
      </template>
    </g>

    <FeaturesToolsPunnettText :block="props.diagram.title" />
    <FeaturesToolsPunnettText :block="props.diagram.parentTop" />
    <FeaturesToolsPunnettText :block="props.diagram.parentLeft" />

    <template v-for="(header, index) in props.diagram.colHeaders" :key="`col-${index}`">
      <FeaturesToolsPunnettText :block="header.label" />
      <FeaturesToolsPunnettText :block="header.prob" />
    </template>
    <template v-for="(header, index) in props.diagram.rowHeaders" :key="`row-${index}`">
      <FeaturesToolsPunnettText :block="header.label" />
      <FeaturesToolsPunnettText :block="header.prob" />
    </template>

    <rect :x="props.diagram.grid.frame.x" :y="props.diagram.grid.frame.y" :width="props.diagram.grid.frame.width" :height="props.diagram.grid.frame.height" fill="none" :stroke="props.diagram.grid.frame.stroke" :stroke-width="props.diagram.grid.frame.strokeWidth" :rx="props.diagram.grid.frame.rx" />

    <g v-for="cell in props.diagram.cells" :key="`cell-${cell.row}-${cell.column}`">
      <rect :x="cell.x" :y="cell.y" :width="cell.width" :height="cell.height" :fill="cell.fill" :fill-opacity="cell.fillOpacity" :stroke="cell.stroke" :stroke-width="cell.strokeWidth" />
      <FeaturesToolsPunnettText :block="cell.genotype" />
      <FeaturesToolsPunnettText :block="cell.meta" />
      <line v-if="cell.rule" :x1="cell.rule.x1" :x2="cell.rule.x2" :y1="cell.rule.y" :y2="cell.rule.y" :stroke="cell.rule.stroke" :stroke-width="cell.rule.strokeWidth" :stroke-dasharray="cell.rule.dash" />
    </g>

    <template v-if="props.diagram.summary">
      <g v-for="card in cards" :key="card.heading.lines[0].text">
        <rect :x="card.x" :y="card.y" :width="card.width" :height="card.height" :fill="card.fill" :stroke="card.stroke" :stroke-width="card.strokeWidth" :rx="card.rx" />
        <line :x1="card.divider.x1" :x2="card.divider.x2" :y1="card.divider.y" :y2="card.divider.y" :stroke="card.divider.stroke" :stroke-width="card.divider.strokeWidth" />
        <FeaturesToolsPunnettText :block="card.heading" />
        <FeaturesToolsPunnettText :block="card.ratio" />
        <FeaturesToolsPunnettText v-for="(trait, index) in card.traits" :key="`trait-${index}`" :block="trait" />
        <g v-for="(row, index) in card.rows" :key="`row-${index}`">
          <rect v-if="row.swatch" :x="row.swatch.x" :y="row.swatch.y" :width="row.swatch.width" :height="row.swatch.height" :rx="row.swatch.rx" :fill="row.swatch.color" />
          <FeaturesToolsPunnettText :block="row.label" />
          <FeaturesToolsPunnettText :block="row.value" />
        </g>
      </g>
    </template>

    <FeaturesToolsPunnettText :block="props.diagram.assumptions" />
    <a :href="props.creditHref">
      <FeaturesToolsPunnettText :block="props.diagram.credit" />
    </a>
  </svg>
</template>
