<script setup>
import Skeleton from '../components/ui/Skeleton.vue';
import { Construction } from 'lucide-vue-next';
</script>

<template>
  <div class="min-h-screen bg-[#0F1014] relative overflow-hidden font-sans">

    <div class="opacity-30 pointer-events-none p-4 space-y-6">
      <div class="flex justify-between items-center mb-6">
        <Skeleton width="100px" height="24px" />
        <Skeleton type="circle" width="36px" height="36px" />
      </div>

      <div class="space-y-4">
        <Skeleton width="100%" height="200px" className="rounded-xl" />
        <div class="grid grid-cols-3 gap-3">
          <Skeleton v-for="i in 6" :key="i" width="100%" height="140px" />
        </div>
      </div>
    </div>

    <div
      class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm px-6 text-center">

      <div
        class="w-24 h-24 bg-[#1A1C24] rounded-full flex items-center justify-center mb-6 shadow-2xl border border-gray-800 animate-bounce">
        <Construction size="40" class="text-[#FF2965]" />
      </div>

      <h1 class="text-3xl font-black text-white mb-2 tracking-tight">
        Sedang <span class="text-[#FF2965]">Maintenance</span>
      </h1>

      <p class="text-gray-300 text-sm max-w-xs leading-relaxed">
        Kami sedang meningkatkan performa server untuk pengalaman nonton yang lebih baik.
      </p>

      <div
        class="mt-8 flex items-center gap-2 text-xs text-gray-500 bg-black/40 px-4 py-2 rounded-full border border-gray-800">
        <span class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
        Estimasi selesai: Segera
      </div>

    </div>

  </div>
</template>
