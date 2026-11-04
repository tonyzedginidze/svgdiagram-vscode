<script setup>
defineProps({
  block: { type: Object, default: null },
});
</script>

<template>
  <g v-if="block" :text-anchor="block.anchor" :font-size="block.style.size" :font-weight="block.style.weight" :fill="block.color">
    <text v-for="(line, index) in block.lines" :key="index" :x="line.x" :y="line.y">{{ line.text }}</text>
  </g>
</template>
