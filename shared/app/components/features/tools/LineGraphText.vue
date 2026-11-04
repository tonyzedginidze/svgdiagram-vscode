<script setup>
defineProps({
  block: { type: Object, default: null },
  transform: { type: String, default: null },
});
</script>

<template>
  <g v-if="block" :transform="transform" :text-anchor="block.anchor || 'start'" :font-size="block.style?.size" :font-weight="block.style?.weight" :fill="block.color || '#334155'">
    <text v-for="(line, index) in block.lines" :key="index" :x="line.x" :y="line.y">{{ line.text }}</text>
  </g>
</template>
