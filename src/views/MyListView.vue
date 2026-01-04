<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BottomNav from '../components/BottomNav.vue';
import { Trash2, SlidersHorizontal, PlayCircle, Clock } from 'lucide-vue-next';

const router = useRouter();
const activeTab = ref('watching'); // 'watching' atau 'history'
const historyList = ref([]);
const isEditMode = ref(false);

// --- 1. LOAD DATA DARI LOCALSTORAGE ---
const loadHistory = () => {
  const stored = localStorage.getItem('cena_history');
  if (stored) {
    historyList.value = JSON.parse(stored);
  } else {
    // KOSONG (Nanti terisi otomatis saat nonton)
    historyList.value = [];
  }
};

// --- 2. HAPUS DATA ---
const deleteItem = (index) => {
  historyList.value.splice(index, 1);
  localStorage.setItem('cena_history', JSON.stringify(historyList.value));
};

const clearAll = () => {
  if (confirm('Hapus semua riwayat tontonan?')) {
    historyList.value = [];
    localStorage.removeItem('cena_history');
    isEditMode.value = false;
  }
};

const goToPlayer = (item) => {
  if (isEditMode.value) return;
  router.push(`/player/${item.bookId}/${item.chapterIndex}`);
};

onMounted(() => {
  loadHistory();
});
</script>

<template>
  <div class="min-h-screen bg-[#0F1014] pb-24 text-white font-sans">

    <div class="fixed top-0 w-full z-20 bg-[#0F1014]/95 backdrop-blur-md pt-4 px-4 border-b border-gray-800">
      <div class="flex items-center justify-between mb-2">
        <div class="flex gap-6">
          <button @click="activeTab = 'watching'" class="pb-2 text-lg font-bold transition-all relative"
            :class="activeTab === 'watching' ? 'text-white' : 'text-gray-500'">
            Sedang Ditonton
            <div v-if="activeTab === 'watching'" class="absolute bottom-0 left-0 w-[60%] h-1 bg-white rounded-full">
            </div>
          </button>

          <button @click="activeTab = 'history'" class="pb-2 text-lg font-bold transition-all relative"
            :class="activeTab === 'history' ? 'text-white' : 'text-gray-500'">
            Riwayat
            <div v-if="activeTab === 'history'" class="absolute bottom-0 left-0 w-[60%] h-1 bg-white rounded-full">
            </div>
          </button>
        </div>

        <button v-if="historyList.length > 0" @click="isEditMode = !isEditMode"
          class="p-2 -mr-2 text-gray-400 hover:text-white transition-colors">
          <span v-if="isEditMode" class="text-xs font-bold text-[#FF2965]">SELESAI</span>
          <SlidersHorizontal v-else size="20" />
        </button>
      </div>
    </div>

    <div class="pt-[70px] px-4">

      <div v-if="historyList.length === 0" class="flex flex-col items-center justify-center py-32 text-gray-500">
        <div class="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <Clock size="32" class="opacity-50" />
        </div>
        <p class="text-sm font-medium">Belum ada riwayat tontonan.</p>
        <p class="text-xs text-gray-600 mt-1">Ayo mulai nonton drama seru!</p>
        <button @click="router.push('/')"
          class="mt-6 bg-[#FF2965] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-lg hover:bg-pink-600 transition-all">
          Cari Drama
        </button>
      </div>

      <div v-else class="flex flex-col gap-4 mt-2">

        <div v-if="isEditMode" class="flex justify-end animate-fade-in">
          <button @click="clearAll"
            class="text-xs text-red-500 font-bold flex items-center gap-1 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
            <Trash2 size="12" /> Hapus Semua
          </button>
        </div>

        <div v-for="(item, index) in historyList" :key="index"
          class="flex gap-3 relative group animate-fade-in cursor-pointer bg-[#1A1C24] p-2 rounded-xl border border-gray-800/50 hover:bg-[#22252e] transition-all"
          @click="goToPlayer(item)">

          <div class="w-[80px] aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
            <img :src="item.cover" class="w-full h-full object-cover" />

            <div v-if="item.badge"
              class="absolute top-0 left-0 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-br-md z-10"
              :style="{ backgroundColor: item.badge.color || '#3b82f6' }">
              {{ item.badge.text }}
            </div>

            <div v-if="!isEditMode"
              class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <PlayCircle size="24" class="text-white drop-shadow-md" />
            </div>
          </div>

          <div class="flex-1 py-1 flex flex-col justify-center min-w-0 pr-8">
            <h3 class="text-sm font-bold text-white line-clamp-2 leading-snug mb-1">{{ item.bookName }}</h3>

            <p class="text-[10px] text-gray-500 line-clamp-1 mb-2">
              {{ item.tags ? item.tags.slice(0, 3).join(', ') : 'Drama Seru' }}
            </p>

            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-[#FF2965]">
                EP.{{ item.chapterIndex + 1 }}
              </span>
              <span class="text-[10px] text-gray-500">/ Total {{ item.totalChapters || '??' }}</span>
            </div>
          </div>

          <div v-if="isEditMode" class="absolute right-3 top-1/2 -translate-y-1/2">
            <button @click.stop="deleteItem(index)"
              class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform active:scale-90">
              <Trash2 size="14" />
            </button>
          </div>

          <div v-else class="absolute right-3 top-1/2 -translate-y-1/2 opacity-30">
            <PlayCircle size="16" class="text-gray-400" />
          </div>

        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}
</style>
