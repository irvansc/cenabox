<script setup>
defineProps({
  type: { type: String, default: 'rect' }, // 'rect', 'circle', 'text'
  width: { type: String, default: '100%' },
  height: { type: String, default: '20px' },
  className: { type: String, default: '' }
});
</script>

<template>
  <div class="animate-pulse bg-gray-800 rounded" :class="[
    className,
    { 'rounded-full': type === 'circle' },
    { 'rounded-md': type === 'rect' },
    { 'rounded-sm': type === 'text' }
  ]" :style="{ width: width, height: height }"></div>
</template>
