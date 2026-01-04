<script setup>
import { computed } from 'vue';
import AdScriptRenderer from './AdScriptRenderer.vue'; // IMPORT INI

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
});

// Cek apakah iklan tipe gambar (custom) atau script (network)
const isCustom = computed(() => props.data.ad_source === 'custom');
const isNetwork = computed(() => props.data.ad_source === 'network');

const openLink = () => {
  if (isCustom.value && props.data.target_url) {
    window.open(props.data.target_url, '_blank');
  }
};
</script>

<template>
  <div class="w-full rounded-xl overflow-hidden bg-[#1A1C24] relative group">

    <div v-if="isCustom" @click="openLink" class="cursor-pointer">
      <div class="relative aspect-[16/9] w-full">
        <img :src="props.data.image_url" class="w-full h-full object-cover" />
        <div class="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">AD</div>
      </div>
      <div v-if="props.data.title" class="p-2">
        <h3 class="text-white text-xs font-bold line-clamp-1">{{ props.data.title }}</h3>
      </div>
    </div>

    <div v-else-if="isNetwork" class="w-full">
      <div class="relative w-full">
        <AdScriptRenderer :scriptCode="props.data.script_code" />

        <div class="absolute top-0 right-0 bg-gray-200 text-gray-600 text-[9px] px-1">AD</div>
      </div>
    </div>

  </div>
</template>
