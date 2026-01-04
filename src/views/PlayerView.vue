<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';

// --- IMPORT UNTUK IKLAN ---
import { useAdsStore } from '../stores/ads';
import NativeAdCard from '../components/ads/NativeAdCard.vue';

import {
  ChevronLeft, ChevronRight, Share2, AlignJustify, Bookmark, MoreVertical,
  X, Check, Settings, Monitor, Lock, Link, Facebook, Twitter,
  ShoppingBag, Play
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const adsStore = useAdsStore();
const bookId = route.params.bookId;
const chapterIndex = ref(parseInt(route.params.chapterIndex) || 0);

// --- 1. STATE & VARIABLES ---
const videoRef = ref(null);
const videoUrl = ref('');
const qualities = ref([]);
const currentQualityLabel = ref('Auto');
const dramaDetail = ref({});
const chapterList = ref([]);
const isLoading = ref(true);

// Player State
const isPlaying = ref(true);
const currentTime = ref(0);
const duration = ref(0);
const progressPercent = ref(0);
const playbackRate = ref(1.0);
const isBookmarked = ref(false); // Status Bookmark Visual

// UI State
const showControls = ref(true);
let controlsTimeout = null;
const showToast = ref(false);
const toastMessage = ref('');

// Modals State
const showSettings = ref(false);
const settingsView = ref('main');
const showEpisodeModal = ref(false);
const showShareModal = ref(false);

// Episode Tab State
const activeTab = ref('episode');
const episodePage = ref(0);
const itemsPerPage = 30;

// --- STATE KHUSUS IKLAN ---
const showPauseAd = ref(false);

// --- 2. COMPUTED PROPERTIES (LOGIC) ---

const chunkedEpisodes = computed(() => {
  const chunks = [];
  if (!chapterList.value) return [];
  for (let i = 0; i < chapterList.value.length; i += itemsPerPage) {
    chunks.push(chapterList.value.slice(i, i + itemsPerPage));
  }
  return chunks;
});

const paginationLabels = computed(() => {
  return chunkedEpisodes.value.map((_, index) => {
    const start = index * itemsPerPage + 1;
    const end = Math.min((index + 1) * itemsPerPage, chapterList.value.length);
    return `${start}-${end}`;
  });
});

const pauseAdData = computed(() => {
  const ads = adsStore.nativeAds;
  if (!ads || ads.length === 0) return null;
  return ads[Math.floor(Math.random() * ads.length)];
});

const bannerAdData = computed(() => {
  const ads = adsStore.floatingAds;
  if (!ads || ads.length === 0) return null;
  return ads[0];
});

const openAd = (url) => {
  if (url) window.open(url, '_blank');
};

// --- 3. META TAGS & STATUS CHECK ---
const updateMetaTags = () => {
  if (!dramaDetail.value.bookName) return;
  document.title = `Nonton ${dramaDetail.value.bookName} - Eps ${chapterIndex.value + 1}`;
};

// Cek status bookmark saat pertama kali load
const checkBookmarkStatus = () => {
  const history = JSON.parse(localStorage.getItem('cena_history') || '[]');
  const item = history.find(item => item.bookId === bookId);
  // Jika item ada DAN property 'bookmarked' bernilai true, maka ikon menyala
  isBookmarked.value = item ? (item.bookmarked === true) : false;
};

// --- 4. CORE LOGIC (SAVE & LOAD) ---

// FUNGSI UTAMA: Simpan ke History & Handle Bookmark
const saveToHistory = (manualClick = false) => {
  if (!dramaDetail.value.bookId) return;

  // 1. Ambil data lama
  let history = JSON.parse(localStorage.getItem('cena_history') || '[]');

  // 2. Cari apakah drama ini sudah pernah ditonton
  const existingItem = history.find(h => h.bookId === dramaDetail.value.bookId);

  // 3. Tentukan status 'bookmarked'
  let newBookmarkState = false;

  if (manualClick) {
    // Jika tombol diklik -> Toggle status (atau set True)
    // Di sini kita set TRUE agar sesuai request "masuk ke daftarku"
    // Jika ingin toggle (klik lagi untuk hapus), ganti jadi: !isBookmarked.value
    newBookmarkState = !isBookmarked.value; // Toggle behavior
  } else {
    // Jika auto-save (sedang nonton) -> Pertahankan status yang lama
    // Jangan ubah jadi true kalau user belum pernah klik bookmark
    newBookmarkState = existingItem ? existingItem.bookmarked : false;
  }

  // 4. Buat Object Baru
  const newItem = {
    bookId: dramaDetail.value.bookId,
    bookName: dramaDetail.value.bookName,
    cover: dramaDetail.value.cover,
    tags: dramaDetail.value.tags,
    chapterIndex: chapterIndex.value,
    totalChapters: dramaDetail.value.episodeCount || 100,
    badge: dramaDetail.value.corner ? { text: dramaDetail.value.corner.name, color: dramaDetail.value.corner.color } : null,
    lastWatched: Date.now(),
    bookmarked: newBookmarkState // Simpan status bookmark ini
  };

  // 5. Update List (Hapus data lama, masukkan yang baru di paling atas)
  history = history.filter(h => h.bookId !== newItem.bookId);
  history.unshift(newItem);
  localStorage.setItem('cena_history', JSON.stringify(history.slice(0, 50)));

  // 6. Update UI
  isBookmarked.value = newBookmarkState;

  // 7. Notifikasi Toast (Hanya jika diklik manual)
  if (manualClick) {
    const msg = newBookmarkState ? 'Ditambahkan ke Daftarku' : 'Dihapus dari Daftarku';
    triggerToast(msg);
  }
};

const toggleBookmark = () => {
  saveToHistory(true); // Flag manual = true
};

const loadDetail = async () => {
  try {
    const resDetail = await api.getDetail(bookId);
    if (resDetail.data.success) {
      dramaDetail.value = resDetail.data.data;
      updateMetaTags();
      checkBookmarkStatus(); // Cek status awal
    }
    const resChapters = await api.getChapters(bookId);
    if (resChapters.data.success) {
      chapterList.value = resChapters.data.data.chapterList;
      episodePage.value = Math.floor(chapterIndex.value / itemsPerPage);
    }
  } catch (error) {
    console.error("Error loading detail:", error);
  }
};

const loadVideo = async (index) => {
  isLoading.value = true;
  videoUrl.value = '';
  showPauseAd.value = false;
  try {
    const res = await api.getStreamUrl(bookId, index);
    if (res.data.success) {
      videoUrl.value = res.data.data.videoUrl;
      updateMetaTags();

      // Auto-save history saat video dimuat (manualClick = false)
      // Ini TIDAK akan mengubah status bookmark jadi pink
      saveToHistory(false);

      if (res.data.data.qualities) {
        qualities.value = res.data.data.qualities;
        const def = qualities.value.find(q => q.isDefault) || qualities.value[0];
        currentQualityLabel.value = def ? `${def.quality}p` : 'Auto';
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await loadDetail();
  await loadVideo(chapterIndex.value);
  resetControlsTimer();
});

onUnmounted(() => {
  clearTimeout(controlsTimeout);
});


// --- 5. PLAYER CONTROLS ---

const resetControlsTimer = () => {
  showControls.value = true;
  clearTimeout(controlsTimeout);

  const isAnyModalOpen = showSettings.value || showEpisodeModal.value || showShareModal.value;

  if (isPlaying.value && !isAnyModalOpen && !showPauseAd.value) {
    controlsTimeout = setTimeout(() => {
      showControls.value = false;
    }, 5000);
  }
};

const onUserInteract = () => {
  resetControlsTimer();
};

const togglePlay = () => {
  if (!videoRef.value) return;
  if (videoRef.value.paused) {
    videoRef.value.play();
    isPlaying.value = true;
    showPauseAd.value = false;
  } else {
    videoRef.value.pause();
    isPlaying.value = false;
    setTimeout(() => { showPauseAd.value = true; }, 200);
  }
  resetControlsTimer();
};

const onTimeUpdate = () => {
  if (!videoRef.value) return;
  currentTime.value = videoRef.value.currentTime;
  duration.value = videoRef.value.duration;
  progressPercent.value = (currentTime.value / duration.value) * 100;
};

const seekVideo = (event) => {
  if (!videoRef.value) return;
  const progressBar = event.currentTarget;
  const rect = progressBar.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const newTime = (clickX / rect.width) * videoRef.value.duration;
  videoRef.value.currentTime = newTime;
  resetControlsTimer();
};

const changeEpisode = (index) => {
  chapterIndex.value = index;
  loadVideo(index);
  showEpisodeModal.value = false;
};


// --- 6. SETTINGS & SHARE (KODE ASLI DIKEMBALIKAN) ---

const setPlaybackSpeed = (speed) => {
  playbackRate.value = speed;
  if (videoRef.value) videoRef.value.playbackRate = speed;
  showSettings.value = false;
  settingsView.value = 'main';
};

const changeQuality = (q) => {
  const lastTime = videoRef.value ? videoRef.value.currentTime : 0;
  const wasPlaying = videoRef.value ? !videoRef.value.paused : true;

  videoUrl.value = q.videoPath;
  currentQualityLabel.value = `${q.quality}p`;

  setTimeout(() => {
    if (videoRef.value) {
      videoRef.value.currentTime = lastTime;
      videoRef.value.playbackRate = playbackRate.value;
      if (wasPlaying) videoRef.value.play();
    }
  }, 100);

  showSettings.value = false;
  settingsView.value = 'main';
};

// --- FUNGSI SHARE LENGKAP ---
const shareTo = (platform) => {
  const currentUrl = window.location.href;
  const title = dramaDetail.value.bookName || 'Drama Seru';
  const episode = chapterIndex.value + 1;
  const message = `🎬 *${title}*\n🔥 Sedang tayang Episode ${episode}\n\nNonton gratis sekarang: 👇\n`;

  const textEncoded = encodeURIComponent(message);
  const urlEncoded = encodeURIComponent(currentUrl);

  let shareUrl = '';
  switch (platform) {
    case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${textEncoded}%20${urlEncoded}`; break;
    case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}`; break;
    case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${textEncoded}&url=${urlEncoded}`; break;
    case 'telegram': shareUrl = `https://t.me/share/url?url=${urlEncoded}&text=${textEncoded}`; break;
  }

  if (shareUrl) window.open(shareUrl, '_blank');
  showShareModal.value = false;
};

const copyLink = async () => {
  try {
    const title = dramaDetail.value.bookName || 'Drama';
    const textToCopy = `Nonton ${title} Episode ${chapterIndex.value + 1}: ${window.location.href}`;
    await navigator.clipboard.writeText(textToCopy);
    triggerToast('Link berhasil disalin!');
    showShareModal.value = false;
  } catch (err) {
    triggerToast('Gagal menyalin link');
  }
};

const triggerToast = (msg) => {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => showToast.value = false, 3000);
};

watch([showSettings, showEpisodeModal, showShareModal], ([s1, s2, s3]) => {
  if (s1 || s2 || s3) {
    showControls.value = true;
    clearTimeout(controlsTimeout);
  } else if (isPlaying.value) {
    resetControlsTimer();
  }
});
</script>

<template>
  <div class="h-full w-full bg-black relative flex flex-col justify-center overflow-hidden" @mousemove="onUserInteract"
    @click="onUserInteract" @touchstart="onUserInteract">

    <video ref="videoRef" v-if="videoUrl" :src="videoUrl" class="w-full h-full object-cover cursor-pointer z-0" autoplay
      playsinline loop @click.stop="togglePlay" @timeupdate="onTimeUpdate" @loadedmetadata="onTimeUpdate"></video>

    <div v-else class="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-900 z-0">
      <span v-if="isLoading" class="animate-pulse">Memuat Video...</span>
      <span v-else class="text-xs px-8 text-center">Video tidak tersedia.</span>
    </div>

    <div v-if="!isPlaying && showPauseAd && pauseAdData"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-overlay"
      @click.self="togglePlay">

      <div class="w-[80%] max-w-[300px] relative transform transition-all duration-300 scale-100 hover:scale-105">
        <button @click.stop="showPauseAd = false"
          class="absolute -top-4 -right-2 bg-white text-black rounded-full p-2 shadow-xl z-50">
          <X size="20" />
        </button>

        <div class="rounded-xl overflow-hidden shadow-2xl border border-white/20">
          <NativeAdCard :data="pauseAdData" />
        </div>

        <div class="text-center mt-6">
          <button @click="togglePlay"
            class="bg-[#FF2965] hover:bg-[#d61e50] text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg shadow-pink-500/30 transition-all active:scale-95 flex items-center gap-2 mx-auto">
            <Play size="18" fill="white" /> LANJUT NONTON
          </button>
        </div>
      </div>
    </div>


    <div class="transition-opacity duration-500 ease-in-out"
      :class="{ 'opacity-0 pointer-events-none': !showControls && isPlaying, 'opacity-100': showControls || !isPlaying }">

      <div class="absolute inset-0 pointer-events-none flex flex-col justify-between z-10">
        <div class="h-32 bg-gradient-to-b from-black/60 to-transparent"></div>
        <div class="h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      </div>

      <div class="absolute top-0 w-full p-4 pt-8 flex justify-between items-start z-50 pointer-events-auto">
        <div class="flex items-center gap-1 text-white drop-shadow-md">
          <button @click="router.back()" class="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft size="28" />
          </button>
          <span class="text-lg font-medium tracking-wide">EP.{{ chapterIndex + 1 }}</span>
        </div>
        <button @click.stop="showSettings = true; settingsView = 'main'"
          class="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors text-white drop-shadow-md relative z-50 cursor-pointer">
          <MoreVertical size="26" />
        </button>
      </div>

      <div class="absolute right-4 bottom-24 z-40 flex flex-col gap-6 items-center pointer-events-auto">
        <div @click.stop="toggleBookmark"
          class="flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition-transform">
          <Bookmark size="32" stroke-width="1.5"
            :class="isBookmarked ? 'text-[#FF2965] fill-[#FF2965]' : 'text-white'" />
          <span class="text-xs font-medium drop-shadow-md" :class="isBookmarked ? 'text-[#FF2965]' : 'text-white'">
            {{ isBookmarked ? 'Tersimpan' : 'Daftarku' }}
          </span>
        </div>

        <div @click.stop="showEpisodeModal = true"
          class="flex flex-col items-center gap-1 text-white cursor-pointer hover:scale-110 transition-transform">
          <AlignJustify size="32" stroke-width="1.5" />
          <span class="text-xs font-medium drop-shadow-md">Episode</span>
        </div>
        <div @click.stop="showShareModal = true"
          class="flex flex-col items-center gap-1 text-white cursor-pointer hover:scale-110 transition-transform">
          <Share2 size="32" stroke-width="1.5" />
          <span class="text-xs font-medium drop-shadow-md">Bagikan</span>
        </div>

        <div v-if="bannerAdData" @click.stop="openAd(bannerAdData.target_url)"
          class="flex flex-col items-center gap-1 text-[#FF2965] cursor-pointer hover:scale-110 transition-transform animate-pulse mt-2">
          <ShoppingBag size="32" stroke-width="1.5" />
          <span class="text-xs font-medium drop-shadow-md">Promo</span>
        </div>
      </div>

      <div class="absolute bottom-0 left-0 w-full px-4 pb-6 z-40 pointer-events-auto">

        <div v-if="showControls && bannerAdData" class="mb-3 w-[70%] animate-fade-in-up">
          <div
            class="bg-white/10 backdrop-blur-md rounded-lg p-2 flex items-center gap-2 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
            @click.stop="openAd(bannerAdData.target_url)">

            <img v-if="bannerAdData.image_url" :src="bannerAdData.image_url"
              class="w-8 h-8 rounded object-cover bg-gray-800" />

            <div class="flex-1 min-w-0">
              <p class="text-[10px] text-white font-bold truncate">{{ bannerAdData.title || 'Diskon Spesial' }}</p>
              <p class="text-[9px] text-gray-300 truncate">Klik untuk info lengkap</p>
            </div>
            <div class="bg-[#FF2965] text-[8px] px-1.5 py-0.5 rounded text-white font-bold">AD</div>
          </div>
        </div>

        <div class="flex items-center gap-2 mb-2 w-3/4">
          <h2 class="text-white font-bold text-lg leading-tight drop-shadow-md line-clamp-1">
            {{ dramaDetail.bookName }}
          </h2>
          <ChevronRight size="18" class="text-white/80 mt-1" />
        </div>
        <div class="w-[85%] mb-4">
          <p class="text-gray-200 text-[13px] leading-snug line-clamp-2 drop-shadow-sm font-light">
            {{ dramaDetail.introduction }}
          </p>
        </div>

        <div class="w-full py-2 cursor-pointer group" @click.stop="seekVideo">
          <div class="w-full h-[2px] bg-white/30 rounded-full relative overflow-visible">
            <div class="h-full bg-white rounded-full relative" :style="{ width: progressPercent + '%' }">
              <div
                class="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow scale-0 group-hover:scale-100 transition-transform duration-200"
                :class="{ 'scale-100': progressPercent > 0 }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSettings" class="absolute inset-0 z-[60] bg-black/50" @click.self="showSettings = false">
      <div class="absolute bottom-0 w-full bg-[#1A1C24] rounded-t-2xl px-5 py-4 animate-slide-up text-white">
        <div class="flex justify-between items-center mb-6">
          <div class="text-sm font-bold text-gray-400">
            <span v-if="settingsView === 'main'">Pengaturan Pemutaran</span>
            <span v-else @click="settingsView = 'main'" class="flex items-center gap-1 cursor-pointer hover:text-white">
              <ChevronLeft size="16" /> Kembali
            </span>
          </div>
          <button @click="showSettings = false">
            <X size="20" class="text-gray-400" />
          </button>
        </div>

        <div v-if="settingsView === 'main'" class="flex flex-col gap-4 pb-4">
          <div @click="settingsView = 'quality'"
            class="flex justify-between items-center py-2 active:opacity-70 cursor-pointer">
            <div class="flex items-center gap-3">
              <Monitor size="20" class="text-gray-400" /><span class="font-medium text-sm">Kualitas Video</span>
            </div>
            <div class="flex items-center gap-1 text-gray-400 text-sm"><span
                class="bg-gray-800 px-1.5 py-0.5 rounded text-xs font-bold border border-gray-700">HD</span><span>{{
                  currentQualityLabel }}</span>
              <ChevronRight size="16" />
            </div>
          </div>
          <div @click="settingsView = 'speed'"
            class="flex justify-between items-center py-2 active:opacity-70 cursor-pointer">
            <div class="flex items-center gap-3">
              <Settings size="20" class="text-gray-400" /><span class="font-medium text-sm">Kecepatan</span>
            </div>
            <div class="flex items-center gap-1 text-gray-400 text-sm"><span>{{ playbackRate }}x</span>
              <ChevronRight size="16" />
            </div>
          </div>
        </div>

        <div v-else-if="settingsView === 'speed'" class="flex flex-col gap-2 pb-2">
          <div v-for="rate in [0.75, 1.0, 1.25, 1.5, 2.0]" :key="rate" @click="setPlaybackSpeed(rate)"
            class="flex justify-between items-center p-3 rounded-lg cursor-pointer"
            :class="playbackRate === rate ? 'bg-gray-800 text-[#FF2965]' : 'text-gray-300 hover:bg-gray-800'">
            <span class="font-medium">{{ rate }}x</span>
            <Check v-if="playbackRate === rate" size="16" />
          </div>
        </div>

        <div v-else-if="settingsView === 'quality'" class="flex flex-col gap-2 pb-2">
          <div v-for="q in qualities" :key="q.quality" @click="changeQuality(q)"
            class="flex justify-between items-center p-3 rounded-lg cursor-pointer"
            :class="currentQualityLabel === q.quality + 'p' ? 'bg-gray-800 text-[#FF2965]' : 'text-gray-300 hover:bg-gray-800'">
            <span class="font-medium">{{ q.quality }}p <span v-if="q.isVipEquity"
                class="text-[10px] bg-yellow-600 text-white px-1 rounded ml-2">VIP</span></span>
            <Check v-if="currentQualityLabel === q.quality + 'p'" size="16" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEpisodeModal" class="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm"
      @click.self="showEpisodeModal = false">
      <div
        class="absolute bottom-0 w-full bg-[#1A1C24] rounded-t-2xl animate-slide-up text-white flex flex-col max-h-[85vh]">
        <div class="relative p-4 flex gap-3 border-b border-gray-800">
          <img :src="dramaDetail.cover" class="w-16 h-20 object-cover rounded-md shadow-lg" />
          <div class="flex-1 pt-1">
            <h3 class="font-bold text-base leading-tight mb-1">{{ dramaDetail.bookName }}</h3>
            <p class="text-xs text-gray-400 mb-1">{{ dramaDetail.playCount || '2.2M' }} kali ditonton</p>
            <p class="text-xs text-gray-500">⭐ 4.8 (1.9K) Rating ></p>
          </div>
          <button @click="showEpisodeModal = false" class="absolute top-4 right-4 bg-gray-700/50 rounded-full p-1">
            <X size="16" class="text-gray-300" />
          </button>
        </div>

        <div class="flex px-4 pt-4 border-b border-gray-800/50">
          <button @click="activeTab = 'deskripsi'" class="pb-2 mr-6 text-sm font-medium transition-colors relative"
            :class="activeTab === 'deskripsi' ? 'text-white' : 'text-gray-500'">Deskripsi<div
              v-if="activeTab === 'deskripsi'"
              class="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full"></div></button>
          <button @click="activeTab = 'episode'" class="pb-2 text-sm font-bold transition-colors relative"
            :class="activeTab === 'episode' ? 'text-white' : 'text-gray-500'">Episode<div v-if="activeTab === 'episode'"
              class="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full"></div></button>
        </div>

        <div v-if="activeTab === 'episode'" class="flex-1 overflow-hidden flex flex-col">
          <div class="flex gap-4 px-4 py-3 overflow-x-auto no-scrollbar border-b border-gray-800/30">
            <button v-for="(label, idx) in paginationLabels" :key="idx" @click="episodePage = idx"
              class="text-xs py-1 px-3 rounded-full whitespace-nowrap transition-colors"
              :class="episodePage === idx ? 'bg-gray-700 text-white font-medium' : 'text-gray-500 hover:text-gray-300'">{{
                label }}</button>
          </div>
          <div class="p-4 grid grid-cols-6 gap-3 overflow-y-auto max-h-[50vh] content-start">
            <button v-for="chapter in chunkedEpisodes[episodePage] || []" :key="chapter.chapterId"
              @click="changeEpisode(chapter.chapterIndex)"
              class="aspect-square rounded flex items-center justify-center relative transition-all"
              :class="chapterIndex === chapter.chapterIndex ? 'bg-[#2A2D35]' : 'bg-[#23252B] hover:bg-[#2A2D35]'">
              <div v-if="chapterIndex === chapter.chapterIndex" class="flex items-end gap-[2px] h-3">
                <div class="w-[3px] bg-[#FF2965] animate-music-bar-1"></div>
                <div class="w-[3px] bg-[#FF2965] animate-music-bar-2"></div>
                <div class="w-[3px] bg-[#FF2965] animate-music-bar-3"></div>
              </div>
              <span v-else class="text-sm font-medium"
                :class="chapterIndex === chapter.chapterIndex ? 'text-[#FF2965]' : 'text-gray-300'">{{
                  chapter.chapterIndex + 1 }}</span>
              <div v-if="chapter.isCharge === 1 && chapterIndex !== chapter.chapterIndex"
                class="absolute top-1 right-1">
                <Lock size="8" class="text-gray-500" />
              </div>
            </button>
          </div>
        </div>

        <div v-else class="p-5 overflow-y-auto max-h-[50vh] text-gray-300 text-sm leading-relaxed">
          <p class="font-bold text-white mb-2">Sinopsis:</p>{{ dramaDetail.introduction }}
          <div class="mt-4 flex flex-wrap gap-2"><span v-for="tag in dramaDetail.tags" :key="tag"
              class="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded"># {{ tag }}</span></div>
        </div>
      </div>
    </div>

    <div v-if="showShareModal" class="absolute inset-0 z-[60] bg-black/50" @click.self="showShareModal = false">
      <div class="absolute bottom-0 w-full bg-[#1A1C24] rounded-t-2xl px-5 py-6 animate-slide-up text-white">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-base font-bold">Bagikan ke</h3>
          <button @click="showShareModal = false">
            <X size="20" class="text-gray-400" />
          </button>
        </div>
        <div class="grid grid-cols-4 gap-4 mb-6">
          <button @click="shareTo('whatsapp')" class="flex flex-col items-center gap-2">
            <div class="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center"><svg
                xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"
                stroke="none">
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg></div>
            <span class="text-xs text-gray-400">WhatsApp</span>
          </button>
          <button @click="shareTo('facebook')" class="flex flex-col items-center gap-2">
            <div class="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center">
              <Facebook size="24" fill="white" stroke-width="0" />
            </div>
            <span class="text-xs text-gray-400">Facebook</span>
          </button>
          <button @click="shareTo('telegram')" class="flex flex-col items-center gap-2">
            <div class="w-12 h-12 rounded-full bg-[#229ED9] flex items-center justify-center"><svg
                xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"
                stroke="none">
                <path
                  d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg></div>
            <span class="text-xs text-gray-400">Telegram</span>
          </button>
          <button @click="shareTo('twitter')" class="flex flex-col items-center gap-2">
            <div class="w-12 h-12 rounded-full bg-black border border-gray-700 flex items-center justify-center">
              <Twitter size="20" fill="white" stroke-width="0" />
            </div>
            <span class="text-xs text-gray-400">X</span>
          </button>
        </div>
        <button @click="copyLink"
          class="w-full bg-[#2A2D35] py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#32363F] transition-colors">
          <Link size="20" class="text-gray-300" /><span class="font-medium text-sm">Salin Tautan</span>
        </button>
      </div>
    </div>

    <div v-if="showToast"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] bg-black/80 px-6 py-3 rounded-full text-white text-sm animate-fade-in border border-gray-700 flex items-center gap-2 shadow-2xl backdrop-blur-sm">
      <Check size="16" class="text-green-500" /> {{ toastMessage }}
    </div>

  </div>
</template>

<style scoped>
/* Animasi Slide Up untuk Modal */
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out forwards;
}

/* Animasi Fade In KHUSUS TOAST */
@keyframes fade-in-toast {
  from {
    opacity: 0;
    transform: translate(-50%, -40%);
  }

  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

.animate-fade-in {
  animation: fade-in-toast 0.2s ease-out forwards;
}

/* Animasi Fade Overlay Iklan */
@keyframes fade-overlay {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.animate-fade-overlay {
  animation: fade-overlay 0.3s ease-out forwards;
}

/* Animasi Fade Up untuk Banner */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.4s ease-out;
}

/* Utility Scrollbar */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Animasi Music Bar */
@keyframes music-bar {

  0%,
  100% {
    height: 20%;
  }

  50% {
    height: 100%;
  }
}

.animate-music-bar-1 {
  animation: music-bar 0.6s infinite ease-in-out;
  height: 60%;
}

.animate-music-bar-2 {
  animation: music-bar 0.6s 0.2s infinite ease-in-out;
  height: 40%;
}

.animate-music-bar-3 {
  animation: music-bar 0.6s 0.4s infinite ease-in-out;
  height: 80%;
}
</style>
