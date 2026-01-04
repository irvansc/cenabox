<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import NativeAdCard from '../components/ads/NativeAdCard.vue';
import { Play, TrendingUp, Sparkles, Grid, Star, Search, User, Globe, ChevronRight } from 'lucide-vue-next';

const router = useRouter();
const loading = ref(false);
const newList = ref([]);
const recommendList = ref([]);
const popularList = ref([]);
const activeTab = ref('foryou');

const heroDrama = computed(() => recommendList.value.length > 0 ? recommendList.value[0] : null);

const fetchData = async () => {
  loading.value = true;
  try {
    const [resNew, resForYou, resRank] = await Promise.all([
      api.getNewReleases(), api.getForYou(), api.getRank()
    ]);
    if (resNew.data.success) newList.value = resNew.data.data.list;
    if (resForYou.data.success) recommendList.value = resForYou.data.data.list;
    if (resRank.data.success) popularList.value = resRank.data.data.list;
  } catch (error) { console.error(error); }
  finally { loading.value = false; }
};

const goToPlayer = (bookId) => {
  router.push(`/player/${bookId}/0`);
};

onMounted(() => { fetchData(); });
</script>

<template>
  <div class="bg-[#0F1014] min-h-screen text-white font-sans">

    <header
      class="fixed top-0 w-full bg-[#0F1014]/90 backdrop-blur-md z-50 border-b border-gray-800 px-10 py-4 flex items-center justify-between">
      <div class="flex items-center gap-12">
        <div class="text-3xl font-black italic tracking-tighter cursor-pointer text-white">
          Cena<span class="text-[#FF2965]">Box</span>
        </div>
        <nav class="flex gap-8 text-sm font-medium text-gray-300">
          <a href="#" class="text-[#FF2965] font-bold">Beranda</a>
          <a href="#" class="hover:text-white transition-colors">Kategori</a>
          <a href="#" class="hover:text-white transition-colors">Peringkat</a>
          <a href="#" class="hover:text-white transition-colors">Aplikasi</a>
        </nav>
      </div>
      <div class="flex items-center gap-6">
        <div class="relative">
          <input type="text" placeholder="Cari judul drama..."
            class="bg-[#1A1C24] border border-gray-700 text-sm rounded-full pl-10 pr-4 py-2 w-64 focus:outline-none focus:border-[#FF2965] text-white">
          <Search size="16" class="absolute left-3.5 top-2.5 text-gray-400" />
        </div>
        <div
          class="w-9 h-9 rounded-full bg-gray-800 hover:bg-[#FF2965] flex items-center justify-center transition-colors cursor-pointer text-white">
          <User size="18" />
        </div>
      </div>
    </header>

    <div class="pt-[80px]">
      <div v-if="loading" class="flex justify-center py-40">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF2965]"></div>
      </div>
      <div v-else>

        <div v-if="heroDrama" class="px-10 py-6 animate-fade-in">
          <div
            class="w-full h-[500px] relative rounded-2xl overflow-hidden shadow-2xl group cursor-pointer border border-gray-800"
            @click="goToPlayer(heroDrama.bookId)">
            <div class="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110"
              :style="{ backgroundImage: `url(${heroDrama.cover})` }"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-[#0F1014] via-[#0F1014]/90 to-transparent z-10"></div>
            <div class="relative z-20 h-full flex items-center px-12 gap-10">
              <img :src="heroDrama.cover"
                class="h-[400px] w-[280px] object-cover rounded-xl shadow-lg border border-gray-600 group-hover:scale-105 transition-transform duration-500">
              <div class="max-w-2xl">
                <h1 class="text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg">{{ heroDrama.bookName }}
                </h1>
                <div class="flex items-center gap-3 mb-6">
                  <span class="bg-[#FF2965] text-white text-xs px-2 py-1 rounded font-bold">TOP 1</span>
                  <span class="text-gray-300 text-sm border border-gray-600 px-2 py-0.5 rounded">{{
                    heroDrama.chapterCount || 60 }} Episode</span>
                  <span class="text-yellow-500 text-sm flex items-center gap-1">
                    <Star size="14" fill="currentColor" /> 4.9
                  </span>
                </div>
                <p class="text-gray-300 text-lg leading-relaxed line-clamp-3 mb-8 font-light">{{ heroDrama.introduction
                }}</p>
                <button
                  class="bg-[#FF2965] hover:bg-[#d61e50] text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-pink-500/20">
                  <Play size="20" fill="white" /> MULAI NONTON
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="px-10 mt-10 space-y-12">

          <div>
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-bold text-white">Rekomendasi Drama</h2>
              <button class="text-sm text-gray-400 hover:text-white flex items-center">Lainnya
                <ChevronRight size="16" />
              </button>
            </div>
            <div class="grid grid-cols-6 gap-6">
              <div v-for="item in recommendList" :key="item.bookId" class="group cursor-pointer"
                @click="goToPlayer(item.bookId)">
                <div
                  class="aspect-[3/4] rounded-xl overflow-hidden bg-gray-800 relative shadow-md group-hover:ring-2 ring-[#FF2965] transition-all">
                  <img :src="item.cover"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy" />
                </div>
                <h3
                  class="text-sm text-gray-200 mt-3 line-clamp-1 font-medium group-hover:text-[#FF2965] transition-colors">
                  {{ item.bookName }}</h3>
                <p class="text-xs text-gray-500 mt-1">{{ item.tags?.[0] || 'Drama' }}</p>
              </div>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-bold text-white">Sedang Populer</h2>
            </div>
            <div class="grid grid-cols-6 gap-6">
              <div v-for="(item, index) in popularList.slice(0, 6)" :key="item.bookId" class="group cursor-pointer"
                @click="goToPlayer(item.bookId)">
                <div
                  class="aspect-[3/4] rounded-xl overflow-hidden bg-gray-800 relative shadow-md group-hover:ring-2 ring-[#FF2965] transition-all">
                  <img :src="item.cover"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy" />
                  <div
                    class="absolute top-0 left-0 w-10 h-10 bg-[#FF2965] flex items-center justify-center text-white font-bold text-lg rounded-br-xl shadow-lg z-10">
                    {{ index + 1 }}</div>
                </div>
                <h3
                  class="text-sm text-gray-200 mt-3 line-clamp-1 font-medium group-hover:text-[#FF2965] transition-colors">
                  {{ item.bookName }}</h3>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <footer class="bg-[#0a0a0c] border-t border-gray-800 pt-16 pb-10 px-10 mt-20">
      <div class="grid grid-cols-4 gap-8 mb-12">
        <div>
          <h4 class="text-white font-bold mb-6 text-lg">CenaBox</h4>
          <p class="text-gray-400 text-sm leading-relaxed">Platform streaming drama terbaik.</p>
        </div>
        <div>
          <h4 class="text-white font-bold mb-6">Tentang</h4>
          <ul class="space-y-3 text-sm text-gray-400">
            <li>Tentang Kami</li>
            <li>Kebijakan Privasi</li>
          </ul>
        </div>
        <div>
          <h4 class="text-white font-bold mb-6">Bantuan</h4>
          <ul class="space-y-3 text-sm text-gray-400">
            <li>Pusat Bantuan</li>
            <li>Hubungi Kami</li>
          </ul>
        </div>
        <div>
          <h4 class="text-white font-bold mb-6">Sosial</h4>
          <div class="flex gap-4 text-gray-400">FB • IG • TT</div>
        </div>
      </div>
      <div class="text-center text-xs text-gray-600 border-t border-gray-800 pt-8">© 2024 CenaBox. All rights reserved.
      </div>
    </footer>

  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}
</style>
