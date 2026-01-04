<script setup>
defineProps({
  data: Object
});

const handleClick = (ad) => {
  // Hanya jalankan klik manual jika tipe Custom (Gambar)
  if (ad.ad_source === 'custom' && ad.target_url) {
    window.open(ad.target_url, '_blank');
  }
  // Jika AdSense/Network, klik biasanya ditangani otomatis oleh script mereka
};
</script>

<template>
  <div class="relative cursor-pointer group w-full h-full" @click="handleClick(data)">

    <div v-if="data.ad_source === 'custom'"
      class="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 relative shadow-lg border border-gray-700/50">

      <div
        class="absolute top-0 right-0 bg-yellow-500/90 text-black text-[8px] px-2 py-0.5 rounded-bl-lg font-bold z-10">
        IKLAN
      </div>

      <img :src="data.image_url"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

      <div class="absolute bottom-0 w-full bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
        <h3 class="text-[11px] text-white font-bold line-clamp-1 leading-tight">
          {{ data.title }}
        </h3>
        <span class="text-[9px] text-gray-300 flex items-center gap-1">
          Kunjungi <span class="text-[#FF2965]">➜</span>
        </span>
      </div>
    </div>

    <div v-else
      class="aspect-[3/4] rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center border border-gray-800 relative">
      <div class="absolute top-0 right-0 bg-gray-700 text-[8px] text-white px-1 z-10">Ad</div>

      <div class="w-full h-full flex items-center justify-center overflow-hidden" v-html="data.script_code"></div>
    </div>

  </div>
</template>
