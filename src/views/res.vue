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
const isBookmarked = ref(false); // STATE BARU: Cek status bookmark

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

// Iklan
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

// --- 3. META TAGS & HELPER ---
const updateMetaTags = () => {
    if (!dramaDetail.value.bookName) return;
    document.title = `Nonton ${dramaDetail.value.bookName} - Eps ${chapterIndex.value + 1}`;
};

// Cek apakah drama ini sudah ada di Daftarku
const checkBookmarkStatus = () => {
    const history = JSON.parse(localStorage.getItem('cena_history') || '[]');
    // Cek apakah bookId sudah ada di list
    isBookmarked.value = history.some(item => item.bookId === bookId);
};

// --- 4. CORE LOGIC (SAVE & LOAD) ---

// Fungsi Simpan ke LocalStorage (Dipakai Auto-save & Tombol Bookmark)
const saveToHistory = (manualClick = false) => {
    if (!dramaDetail.value.bookId) return;

    const newItem = {
        bookId: dramaDetail.value.bookId,
        bookName: dramaDetail.value.bookName,
        cover: dramaDetail.value.cover,
        tags: dramaDetail.value.tags,
        chapterIndex: chapterIndex.value,
        totalChapters: dramaDetail.value.episodeCount || 100,
        badge: dramaDetail.value.corner ? { text: dramaDetail.value.corner.name, color: dramaDetail.value.corner.color } : null,
        lastWatched: Date.now()
    };

    let history = JSON.parse(localStorage.getItem('cena_history') || '[]');

    // Hapus data lama agar yang baru naik ke atas
    history = history.filter(h => h.bookId !== newItem.bookId);

    // Masukkan ke paling atas
    history.unshift(newItem);

    // Simpan
    localStorage.setItem('cena_history', JSON.stringify(history.slice(0, 50)));

    // Update status bookmark UI
    isBookmarked.value = true;

    // Jika dipanggil dari tombol Bookmark, tampilkan Toast
    if (manualClick) {
        triggerToast('Berhasil ditambahkan ke Daftarku');
    }
};

const toggleBookmark = () => {
    // Panggil saveToHistory dengan flag manual=true untuk memunculkan toast
    saveToHistory(true);
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

            // Auto-save saat video load (agar history selalu update progres)
            // Note: Auto-save tidak memunculkan toast
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


// --- 6. SETTINGS & SHARE & TOAST ---

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

const shareTo = (platform) => {
    // ... (Sama seperti sebelumnya) ...
    showShareModal.value = false;
};

const copyLink = async () => {
    try {
        await navigator.clipboard.writeText(window.location.href);
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
    <div class="h-full w-full bg-black relative flex flex-col justify-center overflow-hidden"
        @mousemove="onUserInteract" @click="onUserInteract" @touchstart="onUserInteract">

        <video ref="videoRef" v-if="videoUrl" :src="videoUrl" class="w-full h-full object-cover cursor-pointer z-0"
            autoplay playsinline loop @click.stop="togglePlay" @timeupdate="onTimeUpdate"
            @loadedmetadata="onTimeUpdate"></video>

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
                    <span class="text-xs font-medium drop-shadow-md"
                        :class="isBookmarked ? 'text-[#FF2965]' : 'text-white'">
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
                    <div class="bg-white/10 backdrop-blur-md rounded-lg p-2 flex items-center gap-2 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
                        @click.stop="openAd(bannerAdData.target_url)">

                        <img v-if="bannerAdData.image_url" :src="bannerAdData.image_url"
                            class="w-8 h-8 rounded object-cover bg-gray-800" />

                        <div class="flex-1 min-w-0">
                            <p class="text-[10px] text-white font-bold truncate">{{ bannerAdData.title || 'Diskon
                                Spesial' }}</p>
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
                            <div class="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow scale-0 group-hover:scale-100 transition-transform duration-200"
                                :class="{ 'scale-100': progressPercent > 0 }"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showSettings" class="absolute inset-0 z-[60] bg-black/50" @click.self="showSettings = false">
            <div class="absolute bottom-0 w-full bg-[#1A1C24] rounded-t-2xl px-5 py-4 animate-slide-up text-white">
                <div class="flex justify-between items-center mb-6">
                    <div class="text-sm font-bold text-gray-400">Pengaturan</div>
                    <button @click="showSettings = false">
                        <X size="20" class="text-gray-400" />
                    </button>
                </div>
                <div v-if="settingsView === 'main'" class="flex flex-col gap-4 pb-4">
                    <div @click="settingsView = 'quality'" class="flex justify-between items-center py-2">
                        <div class="flex items-center gap-3">
                            <Monitor size="20" class="text-gray-400" /><span class="font-medium text-sm">Kualitas
                                Video</span>
                        </div>
                        <div class="flex items-center gap-1 text-gray-400 text-sm"><span>{{ currentQualityLabel
                                }}</span>
                            <ChevronRight size="16" />
                        </div>
                    </div>
                    <div @click="settingsView = 'speed'" class="flex justify-between items-center py-2">
                        <div class="flex items-center gap-3">
                            <Settings size="20" class="text-gray-400" /><span
                                class="font-medium text-sm">Kecepatan</span>
                        </div>
                        <div class="flex items-center gap-1 text-gray-400 text-sm"><span>{{ playbackRate }}x</span>
                            <ChevronRight size="16" />
                        </div>
                    </div>
                </div>
                <div v-else-if="settingsView === 'speed'" class="flex flex-col gap-2 pb-2">
                    <div v-for="r in [0.75, 1.0, 1.25, 1.5, 2.0]" :key="r" @click="setPlaybackSpeed(r)"
                        class="p-3 rounded-lg" :class="playbackRate === r ? 'bg-gray-800 text-[#FF2965]' : 'text-gray-300'">{{
                        r }}x</div>
                </div>
                <div v-else-if="settingsView === 'quality'" class="flex flex-col gap-2 pb-2">
                    <div v-for="q in qualities" :key="q.quality" @click="changeQuality(q)" class="p-3 rounded-lg"
                        :class="currentQualityLabel === q.quality + 'p' ? 'bg-gray-800 text-[#FF2965]' : 'text-gray-300'">{{
                        q.quality }}p</div>
                </div>
            </div>
        </div>

        <div v-if="showEpisodeModal" class="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            @click.self="showEpisodeModal = false">
            <div
                class="absolute bottom-0 w-full bg-[#1A1C24] rounded-t-2xl animate-slide-up text-white flex flex-col max-h-[85vh]">
                <div class="p-4 border-b border-gray-800 flex justify-between"><span class="font-bold">Daftar
                        Episode</span><button @click="showEpisodeModal = false">
                        <X size="20" />
                    </button></div>
                <div class="p-4 grid grid-cols-6 gap-3 overflow-y-auto">
                    <button v-for="ch in chunkedEpisodes[episodePage] || []" :key="ch.chapterId"
                        @click="changeEpisode(ch.chapterIndex)"
                        class="aspect-square rounded flex items-center justify-center text-sm font-medium"
                        :class="chapterIndex === ch.chapterIndex ? 'bg-[#FF2965] text-white' : 'bg-[#23252B] text-gray-300'">{{
                        ch.chapterIndex+1 }}</button>
                </div>
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

.no-scrollbar::-webkit-scrollbar {
    display: none;
}

.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
