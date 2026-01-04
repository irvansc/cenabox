<script setup>
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
// import { useAuthStore } from './stores/auth';
import { useAdsStore } from './stores/ads';
onMounted(() => {
  // const authStore = useAuthStore();
  // authStore.initialize();
});
onMounted(() => {
  const adsStore = useAdsStore();
  adsStore.fetchActiveAds();
});
</script>

<template>
  <div class="bg-[#0F1014] min-h-screen text-white font-sans antialiased overflow-x-hidden">
    <RouterView />
  </div>
</template>

<style>
/* Reset dasar */
body {
  margin: 0;
  padding: 0;
  background-color: #0F1014;
  color: white;
}

/* Scrollbar Kustom (Agar terlihat bagus di Desktop) */
::-webkit-scrollbar {
  width: 8px;
  /* Sedikit lebih lebar untuk Desktop */
}

::-webkit-scrollbar-track {
  background: #1A1C24;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #FF2965;
  /* Aksen Pink saat di-hover */
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
