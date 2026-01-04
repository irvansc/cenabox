<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import { useAdsStore } from '../stores/ads';
import BottomNav from '../components/BottomNav.vue';
import NativeAdCard from '../components/ads/NativeAdCard.vue';
import FloatingBanner from '../components/ads/FloatingBanner.vue';
import {
  Play, TrendingUp, Sparkles, Grid, Star, Flame,
  Search, ArrowLeft, X, ScanSearch
} from 'lucide-vue-next';
import Skeleton from '../components/ui/Skeleton.vue';
const router = useRouter();
const adsStore = useAdsStore();

// --- STATE MOBILE UTAMA ---
const activeTab = ref('foryou');
const rankSubTab = ref('trend');
const loading = ref(false);

const newList = ref([]);
const rawRecommendList = ref([]);
const popularList = ref([]);
const rawGridData = ref([]);

// --- STATE PENCARIAN (SEARCH) ---
const showSearchModal = ref(false);
const searchQuery = ref('');
const searchSuggestions = ref([]);
const searchResults = ref([]);
const isSearching = ref(false);
const searchMode = ref('idle'); // 'idle', 'suggest', 'result'
const searchInputRef = ref(null);
let searchTimeout = null;

// --- COMPUTED DATA ---
const recommendListWithAds = computed(() => adsStore.injectAds(rawRecommendList.value));
const gridDataWithAds = computed(() => adsStore.injectAds(rawGridData.value));

// --- FILTER STATE ---
const activeGenre = ref(1357);
const filterState = ref({ region: 'Semua', type: 'Semua', access: 'Semua', genre: 1357, sort: 1 });
const filterOptions = {
  regions: ['Semua', 'China', 'Amerika', 'Korea Selatan', 'Jepang'],
  types: ['Semua', 'Sulih Suara', 'Hanya Subtitle'],
  access: ['Semua', 'Anggota Saja'],
  genres: [{ id: 1357, name: 'Semua' }, { id: 1, name: 'Romansa' }, { id: 2, name: 'Wanita Kuat' }, { id: 3, name: 'Pria Dominan' }, { id: 4, name: 'Balas Dendam' }, { id: 5, name: 'CEO' }, { id: 6, name: 'Keluarga' }, { id: 7, name: 'Komedi' }],
  sorts: [{ id: 1, name: 'Terpopuler' }, { id: 2, name: 'Terbaru' }]
};

// --- FETCH DATA UTAMA ---
const fetchData = async (tab) => {
  activeTab.value = tab;
  loading.value = true;
  rawGridData.value = [];
  try {
    if (tab === 'foryou') {
      const [resNew, resForYou, resRank] = await Promise.all([
        api.getNewReleases(), api.getForYou(), api.getRank()
      ]);
      if (resNew.data.success) newList.value = resNew.data.data.list;
      if (resForYou.data.success) rawRecommendList.value = resForYou.data.data.list;
      if (resRank.data.success) popularList.value = resRank.data.data.list;
    } else {
      let response;
      if (tab === 'new') response = await api.getNewReleases();
      else if (tab === 'rank') {
        if (rankSubTab.value === 'trend') response = await api.getRank();
        else if (rankSubTab.value === 'search') response = await api.getForYou();
        else if (rankSubTab.value === 'new_rank') response = await api.getNewReleases();
      }
      else if (tab === 'category') response = await api.getCategory(filterState.value.genre, filterState.value.sort);
      if (response && response.data.success) rawGridData.value = response.data.data.list;
    }
  } catch (error) { console.error(error); }
  finally { loading.value = false; }
};

const applyFilter = (key, value) => { filterState.value[key] = value; fetchData('category'); };
const changeRankSubTab = (subTab) => { rankSubTab.value = subTab; fetchData('rank'); };
const goToPlayer = (bookId) => { router.push(`/player/${bookId}/0`); };


// --- LOGIKA PENCARIAN (SEARCH LOGIC) ---

// 1. Buka Modal & Fokus Input
const openSearch = () => {
  showSearchModal.value = true;
  nextTick(() => {
    if (searchInputRef.value) searchInputRef.value.focus();
  });
};

const closeSearch = () => {
  showSearchModal.value = false;
  searchQuery.value = '';
  searchMode.value = 'idle';
  searchResults.value = [];
};

// 2. Watcher untuk Autocomplete (Debounce)
watch(searchQuery, (newVal) => {
  if (searchTimeout) clearTimeout(searchTimeout);

  if (!newVal.trim()) {
    searchMode.value = 'idle';
    return;
  }

  // Delay 400ms agar tidak spam API setiap ketikan
  searchTimeout = setTimeout(async () => {
    if (searchMode.value !== 'result') { // Jangan suggest jika user sudah tekan enter
      searchMode.value = 'suggest';
      try {
        const res = await api.getSuggest(newVal);
        if (res.data.success) {
          searchSuggestions.value = res.data.data.suggestList || [];
        }
      } catch (e) { console.error(e); }
    }
  }, 400);
});

// 3. Eksekusi Pencarian
const doSearch = async (keyword) => {
  if (!keyword) return;

  // Set UI State
  searchQuery.value = keyword;
  searchMode.value = 'result';
  isSearching.value = true;
  searchResults.value = [];

  try {
    const res = await api.search(keyword);
    if (res.data.success) {
      searchResults.value = res.data.data.list || [];
    }
  } catch (e) {
    console.error(e);
  } finally {
    isSearching.value = false;
  }
};

onMounted(() => { fetchData('foryou'); });
</script>

<template>
  <div class="pb-24 bg-[#0F1014] min-h-screen text-white">

    <header
      class="fixed top-0 w-full bg-[#0F1014]/95 backdrop-blur-md z-40 border-b border-gray-800 transition-all duration-300">
      <div class="px-4 py-3 flex items-center justify-between">
        <div class="text-xl font-black italic tracking-tighter">
          <span class="text-white">Cena</span><span class="text-[#FF2965]">Box</span>
        </div>

        <div class="flex items-center gap-3">
          <button @click="openSearch"
            class="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-[#FF2965] hover:bg-white/10 hover:border-[#FF2965]/50 transition-all active:scale-95">
            <ScanSearch size="18" stroke-width="2.5" />
          </button>

          <div
            class="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-xs border border-gray-600 overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User"
              class="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div class="px-4 flex gap-6 text-sm font-medium overflow-x-auto no-scrollbar">
        <button @click="fetchData('foryou')"
          :class="activeTab === 'foryou' ? 'text-white border-b-2 border-[#FF2965] pb-2' : 'text-gray-500 pb-2'">Untukmu</button>
        <button @click="fetchData('new')"
          :class="activeTab === 'new' ? 'text-white border-b-2 border-[#FF2965] pb-2' : 'text-gray-500 pb-2'">Terbaru</button>
        <button @click="fetchData('rank')"
          :class="activeTab === 'rank' ? 'text-white font-bold border-b-2 border-[#FF2965] pb-2' : 'text-gray-500 pb-2'">Daftar
          Peringkat</button>
        <button @click="fetchData('category')"
          :class="activeTab === 'category' ? 'text-white font-bold border-b-2 border-[#FF2965] pb-2' : 'text-gray-500 pb-2'">Kategori</button>
      </div>
    </header>

    <div class="mt-[110px]">
      <div v-if="loading" class="p-4 space-y-8 overflow-hidden">

        <div>
          <div class="flex justify-between mb-3">
            <Skeleton width="120px" height="20px" />
            <Skeleton width="60px" height="15px" />
          </div>
          <div class="flex gap-3 overflow-hidden">
            <div v-for="i in 4" :key="i" class="shrink-0">
              <Skeleton width="100px" height="133px" className="mb-2" />
              <Skeleton width="80px" height="10px" />
            </div>
          </div>
        </div>

        <div>
          <Skeleton width="150px" height="20px" className="mb-3" />
          <div class="grid grid-cols-3 gap-3">
            <div v-for="i in 6" :key="i">
              <Skeleton width="100%" height="140px" className="mb-2" />
              <Skeleton width="90%" height="10px" className="mb-1" />
              <Skeleton width="60%" height="10px" />
            </div>
          </div>
        </div>

      </div>
      <div v-else>
        <div v-if="activeTab === 'foryou'" class="flex flex-col gap-8">
          <div class="pl-4">
            <div class="flex items-center justify-between pr-4 mb-3">
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <Sparkles size="18" class="text-[#FF2965]" /> Baru Di Rilis
              </h2><button @click="fetchData('new')" class="text-xs text-gray-500 hover:text-white">Lihat Semua
                ></button>
            </div>
            <div class="flex gap-3 overflow-x-auto no-scrollbar pr-4">
              <div v-for="item in newList" :key="'new-' + item.bookId"
                class="min-w-[100px] w-[100px] cursor-pointer group" @click="goToPlayer(item.bookId)">
                <div class="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 relative shadow-lg">
                  <div
                    class="absolute top-0 right-0 bg-[#FF2965] text-[8px] px-1.5 py-0.5 rounded-bl-md text-white font-bold z-10">
                    NEW</div><img :src="item.cover" class="w-full h-full object-cover" loading="lazy" />
                </div>
                <h3 class="text-[11px] text-gray-300 mt-1.5 line-clamp-2 leading-tight group-hover:text-white">{{
                  item.bookName }}</h3>
              </div>
            </div>
          </div>
          <div class="px-3">
            <div class="flex items-center justify-between px-1 mb-3">
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <Grid size="18" class="text-purple-500" /> Rekomendasi
              </h2>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <template v-for="item in recommendListWithAds" :key="item.bookId">
                <NativeAdCard v-if="item.isAd" :data="item" />
                <div v-else class="relative cursor-pointer group" @click="goToPlayer(item.bookId)">
                  <div class="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 relative shadow-md"><img
                      :src="item.cover" class="w-full h-full object-cover" loading="lazy" />
                    <div class="absolute bottom-0 w-full bg-gradient-to-t from-black/90 to-transparent p-2 pt-6"><span
                        class="text-[9px] text-white flex items-center gap-1 font-medium">▶ {{ item.playCount }}</span>
                    </div>
                  </div>
                  <h3 class="text-[11px] text-gray-200 mt-1.5 line-clamp-2 leading-tight font-medium">{{ item.bookName
                  }}</h3>
                </div>
              </template>
            </div>
          </div>
          <div class="px-4 pb-4">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp size="18" class="text-orange-500" /> Sedang Populer
              </h2><button @click="fetchData('rank')" class="text-xs text-gray-500 hover:text-white">Cek Peringkat
                ></button>
            </div>
            <div class="flex flex-col gap-3">
              <div v-for="(item, index) in popularList.slice(0, 5)" :key="'pop-' + item.bookId"
                class="flex gap-3 bg-[#1A1C24] p-2.5 rounded-xl border border-gray-800 cursor-pointer hover:bg-[#22252e] transition-colors"
                @click="goToPlayer(item.bookId)">
                <div class="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <div
                    class="absolute top-0 left-0 bg-[#FF2965] w-5 h-5 flex items-center justify-center text-white font-bold text-[10px] rounded-br-md z-10">
                    {{ index + 1 }}</div><img :src="item.cover" class="w-full h-full object-cover" />
                </div>
                <div class="flex flex-col justify-center flex-1 min-w-0">
                  <h3 class="font-bold text-xs text-white line-clamp-1 mb-1">{{ item.bookName }}</h3>
                  <div class="flex items-center gap-2 mb-1"><span
                      class="text-[9px] bg-gray-700 px-1 py-0.5 rounded text-gray-300">{{ item.tags?.[0] || 'Drama'
                      }}</span><span class="text-[9px] text-yellow-500 flex items-center gap-0.5">
                      <Star size="8" fill="currentColor" /> 4.9
                    </span></div>
                  <p class="text-[10px] text-gray-500 line-clamp-1">Sedang trending minggu ini</p>
                </div>
                <div class="flex items-center px-1">
                  <Play size="16" class="text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'rank'">
          <div class="px-4 mb-4 pt-4 flex gap-2">
            <button @click="changeRankSubTab('trend')"
              class="px-4 py-1.5 rounded-full text-xs font-medium transition-all border"
              :class="rankSubTab === 'trend' ? 'bg-[#4A3B3B] text-[#D8B4B4] border-[#5E4B4B]' : 'bg-[#1A1C24] text-gray-500 border-gray-700'">Sedang
              Tren</button>
            <button @click="changeRankSubTab('search')"
              class="px-4 py-1.5 rounded-full text-xs font-medium transition-all border"
              :class="rankSubTab === 'search' ? 'bg-[#4A3B3B] text-[#D8B4B4] border-[#5E4B4B]' : 'bg-[#1A1C24] text-gray-500 border-gray-700'">Pencarian
              Populer</button>
            <button @click="changeRankSubTab('new_rank')"
              class="px-4 py-1.5 rounded-full text-xs font-medium transition-all border"
              :class="rankSubTab === 'new_rank' ? 'bg-[#4A3B3B] text-[#D8B4B4] border-[#5E4B4B]' : 'bg-[#1A1C24] text-gray-500 border-gray-700'">Terbaru</button>
          </div>
          <div class="px-4 flex flex-col gap-3 pb-8">
            <div v-for="(item, index) in rawGridData" :key="item.bookId" @click="goToPlayer(item.bookId)"
              class="flex items-center bg-[#1A1C24] p-3 rounded-xl border border-gray-800/50 cursor-pointer hover:bg-[#252833] transition-colors">
              <span class="text-2xl font-bold w-10 text-center text-white mr-2">{{ index + 1 }}</span>
              <div class="w-12 h-16 rounded-md overflow-hidden bg-gray-800 flex-shrink-0"><img :src="item.cover"
                  class="w-full h-full object-cover" /></div>
              <div class="flex-1 ml-3 min-w-0">
                <h3 class="text-sm font-bold text-white truncate">{{ item.bookName }}</h3>
                <p class="text-[11px] text-gray-400 mt-1 truncate">{{ item.tags && item.tags.length ? item.tags.slice(0,
                  2).join(', ') : 'Drama, Modern' }}</p>
              </div>
              <div class="flex items-center gap-1 text-white text-xs font-medium ml-2">
                <Flame size="14" class="text-white" fill="white" /><span>{{ item.playCount || '1.2M' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'category'">
          <div class="px-4 flex flex-col gap-3 mb-6 pt-4">
            <div class="flex gap-4 overflow-x-auto no-scrollbar items-center"><button v-for="r in filterOptions.regions"
                :key="r" @click="applyFilter('region', r)"
                class="text-xs whitespace-nowrap px-3 py-1 rounded-full transition-colors"
                :class="filterState.region === r ? 'bg-[#A81F45] text-white font-bold' : 'text-gray-400 hover:text-white'">{{
                  r
                }}</button></div>
            <div class="flex gap-4 overflow-x-auto no-scrollbar items-center"><button v-for="t in filterOptions.types"
                :key="t" @click="applyFilter('type', t)"
                class="text-xs whitespace-nowrap px-3 py-1 rounded-full transition-colors"
                :class="filterState.type === t ? 'bg-[#A81F45] text-white font-bold' : 'text-gray-400 hover:text-white'">{{
                  t
                }}</button></div>
            <div class="flex gap-4 overflow-x-auto no-scrollbar items-center"><button v-for="a in filterOptions.access"
                :key="a" @click="applyFilter('access', a)"
                class="text-xs whitespace-nowrap px-3 py-1 rounded-full transition-colors"
                :class="filterState.access === a ? 'bg-[#A81F45] text-white font-bold' : 'text-gray-400 hover:text-white'">{{
                  a
                }}</button></div>
            <div class="flex gap-4 overflow-x-auto no-scrollbar items-center"><button v-for="g in filterOptions.genres"
                :key="g.id" @click="applyFilter('genre', g.id)"
                class="text-xs whitespace-nowrap px-3 py-1 rounded-full transition-colors"
                :class="filterState.genre === g.id ? 'bg-[#A81F45] text-white font-bold' : 'text-gray-400 hover:text-white'">{{
                  g.name }}</button></div>
            <div class="flex gap-4 overflow-x-auto no-scrollbar items-center mt-1"><button
                v-for="s in filterOptions.sorts" :key="s.id" @click="applyFilter('sort', s.id)"
                class="text-xs whitespace-nowrap px-3 py-1 rounded-full transition-colors"
                :class="filterState.sort === s.id ? 'bg-[#A81F45] text-white font-bold' : 'text-gray-400 hover:text-white'">{{
                  s.name }}</button></div>
          </div>
          <div class="px-3">
            <div class="grid grid-cols-3 gap-3">
              <template v-for="(item, index) in gridDataWithAds" :key="item.bookId">
                <NativeAdCard v-if="item.isAd" :data="item" />
                <div v-else class="relative cursor-pointer group" @click="goToPlayer(item.bookId)">
                  <div class="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 relative shadow-lg">
                    <div v-if="item.corner"
                      class="absolute top-0 left-0 text-[9px] px-2 py-0.5 rounded-br-lg text-white font-bold z-10"
                      :style="{ backgroundColor: item.corner.color || '#FF2965' }">{{ item.corner.name }}</div>
                    <img :src="item.cover" class="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <h3 class="text-[11px] text-gray-200 mt-2 line-clamp-2 font-medium">{{ item.bookName }}</h3>
                </div>
              </template>
            </div>
          </div>
        </div>

        <div v-else class="px-3">
          <div class="mb-3 px-1 flex items-center gap-2">
            <h2 class="text-base font-bold capitalize">Rilis Terbaru</h2>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <template v-for="(item, index) in gridDataWithAds" :key="item.bookId">
              <NativeAdCard v-if="item.isAd" :data="item" />
              <div v-else class="relative cursor-pointer group" @click="goToPlayer(item.bookId)">
                <div class="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 relative shadow-lg">
                  <div v-if="item.corner"
                    class="absolute top-0 left-0 text-[9px] px-2 py-0.5 rounded-br-lg text-white font-bold z-10"
                    :style="{ backgroundColor: item.corner.color || '#FF2965' }">{{ item.corner.name }}</div>
                  <img :src="item.cover" class="w-full h-full object-cover" loading="lazy" />
                </div>
                <h3 class="text-[11px] text-gray-200 mt-2 line-clamp-2 font-medium">{{ item.bookName }}</h3>
              </div>
            </template>
          </div>
        </div>

      </div>
    </div>


    <div v-if="showSearchModal" class="fixed inset-0 z-[60] bg-[#0F1014] animate-fade-in flex flex-col">

      <div class="px-4 py-4 flex items-center gap-3 border-b border-gray-800/50 bg-[#0F1014]">
        <button @click="closeSearch" class="p-2 -ml-2 text-gray-400 hover:text-white">
          <ArrowLeft size="24" />
        </button>
        <div class="flex-1 relative">
          <input ref="searchInputRef" v-model="searchQuery" @keyup.enter="doSearch(searchQuery)" type="text"
            placeholder="Cari judul, aktor, atau genre..."
            class="w-full bg-[#1A1C24] text-white text-sm rounded-full py-2.5 pl-10 pr-10 focus:outline-none focus:ring-1 focus:ring-[#FF2965] placeholder-gray-500 border border-transparent focus:border-[#FF2965]/50 transition-all" />
          <Search size="16" class="absolute left-3.5 top-3 text-gray-400" />
          <button v-if="searchQuery" @click="searchQuery = ''"
            class="absolute right-3 top-2.5 text-gray-400 hover:text-white">
            <X size="16" />
          </button>
        </div>
        <button @click="doSearch(searchQuery)" class="text-[#FF2965] font-bold text-sm pl-1">Cari</button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">

        <div v-if="searchMode === 'idle'">
          <div class="mb-6">
            <h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Flame size="16" class="text-orange-500" /> Pencarian Populer
            </h3>
            <div class="flex flex-wrap gap-2">
              <button v-for="(item, idx) in popularList.slice(0, 8)" :key="idx" @click="doSearch(item.bookName)"
                class="px-3 py-1.5 bg-[#1A1C24] text-gray-300 text-xs rounded-full border border-gray-800 hover:border-[#FF2965] hover:text-[#FF2965] transition-colors line-clamp-1 max-w-[150px] truncate">
                {{ item.bookName }}
              </button>
              <button v-if="popularList.length === 0" @click="doSearch('CEO')"
                class="px-3 py-1.5 bg-[#1A1C24] text-gray-300 text-xs rounded-full border border-gray-800">CEO
                Dingin</button>
              <button v-if="popularList.length === 0" @click="doSearch('Romansa')"
                class="px-3 py-1.5 bg-[#1A1C24] text-gray-300 text-xs rounded-full border border-gray-800">Romansa</button>
            </div>
          </div>
        </div>

        <div v-else-if="searchMode === 'suggest'">
          <div v-if="searchSuggestions.length > 0" class="flex flex-col">
            <div v-for="item in searchSuggestions" :key="item.bookId" @click="doSearch(item.bookName)"
              class="flex items-center gap-3 py-3 border-b border-gray-800/50 cursor-pointer hover:bg-white/5 px-2 -mx-2 rounded-lg transition-colors">
              <Search size="16" class="text-gray-500" />
              <span class="text-sm text-gray-300 line-clamp-1"
                v-html="item.bookName.replace(new RegExp(`(${searchQuery})`, 'gi'), '<span class=\'text-[#FF2965] font-bold\'>$1</span>')"></span>
            </div>
          </div>
          <div v-else class="text-center py-10 text-gray-500 text-sm flex flex-col items-center">
            <Search size="30" class="mb-2 opacity-30" />
            Tidak ada saran ditemukan.
          </div>
        </div>

        <div v-else-if="searchMode === 'result'">

          <div v-if="isSearching" class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF2965]"></div>
          </div>

          <div v-else-if="searchResults.length > 0">
            <p class="text-xs text-gray-400 mb-4">Hasil untuk "<span class="text-white font-bold">{{ searchQuery
                }}</span>"
            </p>
            <div class="grid grid-cols-3 gap-3">
              <div v-for="item in searchResults" :key="item.bookId" class="relative cursor-pointer group"
                @click="goToPlayer(item.bookId)">
                <div class="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 relative shadow-lg">
                  <img :src="item.cover" class="w-full h-full object-cover" loading="lazy" />
                  <div
                    class="absolute top-0 right-0 bg-[#FF2965] text-[8px] px-1.5 py-0.5 rounded-bl-md text-white font-bold"
                    v-if="item.chapterCount > 0">{{ item.chapterCount }} EPS</div>
                </div>
                <h3 class="text-[11px] text-gray-200 mt-2 line-clamp-2 font-medium">{{ item.bookName }}</h3>
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center py-20 text-gray-500">
            <div class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 opacity-50">
              <Search size="30" />
            </div>
            <p class="text-sm font-bold text-gray-400">Drama tidak ditemukan.</p>
            <p class="text-xs mt-1">Coba kata kunci lain atau periksa ejaanmu.</p>
          </div>
        </div>

      </div>
    </div>

    <FloatingBanner />
    <BottomNav />
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Animasi Halus untuk Modal */
@keyframes fade-in-scale {
  from {
    opacity: 0;
    transform: scale(0.98);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in-scale 0.2s ease-out forwards;
}
</style>
