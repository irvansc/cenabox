<script setup>
import { ref, computed } from 'vue';
import { X } from 'lucide-vue-next';
import { useAdsStore } from '../../stores/ads'; // Sesuaikan path store Anda
// Pastikan path import ini benar mengarah ke file AdScriptRenderer.vue yang baru dibuat
import AdScriptRenderer from './AdScriptRenderer.vue';

const adsStore = useAdsStore();
const isVisible = ref(true);

// Ambil 1 iklan floating pertama yang aktif dari Store
const bannerData = computed(() => {
  const ads = adsStore.floatingAds;
  return ads && ads.length > 0 ? ads[0] : null;
});
</script>

<template>
  <div v-if="isVisible && bannerData"
    class="fixed bottom-[70px] left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px] animate-fade-up">

    <div
      class="relative bg-[#1A1C24] rounded-lg shadow-2xl border border-gray-700 overflow-hidden min-h-[50px] flex items-center justify-center">

      <button @click="isVisible = false"
        class="absolute top-0 right-0 bg-black/60 text-white rounded-bl p-1 hover:bg-red-500 z-50">
        <X size="14" />
      </button>

      <a v-if="bannerData.ad_source === 'custom'" :href="bannerData.target_url" target="_blank"
        class="flex p-2 items-center gap-3 w-full">
        <img :src="bannerData.image_url" class="w-full h-12 object-cover rounded" />
      </a>

      <div v-else class="w-full flex justify-center items-center bg-white/5 p-1 min-h-[50px]">
        <AdScriptRenderer :scriptCode="bannerData.script_code" />
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-up {
  animation: fade-up 0.5s ease-out forwards;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
