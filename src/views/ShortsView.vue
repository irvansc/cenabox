<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import BottomNav from '../components/BottomNav.vue';
import {
  Search, Bookmark, AlignJustify, Share2,
  ChevronRight, Play, ListVideo
} from 'lucide-vue-next';

const router = useRouter();
const videoList = ref([]);
const loading = ref(true);
const videoRefs = ref([]);

// --- FETCH DATA ---
const fetchFeed = async () => {
  loading.value = true;
  try {
    const response = await api.getRank();
    if (response.data.success) {
      videoList.value = response.data.data.list.map(item => ({
        ...item,
        videoUrl: null,
        isPlaying: false,
        progress: 0 // PERBAIKAN 1: Mulai dari 0
      }));
      if (videoList.value.length > 0) loadVideoUrl(0);
    }
  } catch (error) { console.error(error); }
  finally { loading.value = false; }
};

const loadVideoUrl = async (index) => {
  const item = videoList.value[index];
  if (!item || item.videoUrl) return;
  try {
    const res = await api.getStreamUrl(item.bookId, 0);
    if (res.data.success) item.videoUrl = res.data.data.videoUrl;
  } catch (e) { }
};

// PERBAIKAN 2: Fungsi Update Progress Bar
const updateProgress = (event, index) => {
  const { currentTime, duration } = event.target;
  if (duration > 0) {
    videoList.value[index].progress = (currentTime / duration) * 100;
  }
};

const onScroll = (el) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const index = parseInt(entry.target.dataset.index);
      if (entry.isIntersecting) {
        loadVideoUrl(index);
        if (index + 1 < videoList.value.length) loadVideoUrl(index + 1);
        playVideo(index);
      } else {
        pauseVideo(index);
      }
    });
  }, { threshold: 0.6 });
  if (el) observer.observe(el);
};

const playVideo = (index) => {
  const videoEl = videoRefs.value[index];
  if (videoEl && videoList.value[index].videoUrl) {
    videoEl.play().catch(() => { });
    videoList.value[index].isPlaying = true;
  }
};

const pauseVideo = (index) => {
  const videoEl = videoRefs.value[index];
  if (videoEl) {
    videoEl.pause();
    videoList.value[index].isPlaying = false;
  }
};

const togglePlay = (index) => {
  const item = videoList.value[index];
  if (item.isPlaying) pauseVideo(index); else playVideo(index);
};

const goToFullPlayer = (bookId) => {
  router.push(`/player/${bookId}/0`);
};

onMounted(() => fetchFeed());
</script>

<template>
  <div class="bg-black h-screen w-full relative overflow-hidden">

    <div v-if="loading" class="flex items-center justify-center h-full text-white">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF2965]"></div>
    </div>

    <div v-else class="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth">
      <div v-for="(item, index) in videoList" :key="item.bookId" :data-index="index"
        :ref="(el) => { if (el) onScroll(el) }" class="h-full w-full snap-center relative bg-[#1A1C24]">
        <video :ref="(el) => { if (el) videoRefs[index] = el }" :src="item.videoUrl" :poster="item.cover"
          class="h-full w-full object-cover" loop playsinline @click="togglePlay(index)"
          @timeupdate="updateProgress($event, index)"></video>

        <div v-if="!item.isPlaying"
          class="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
          <Play size="60" class="text-white/50 fill-white/50" />
        </div>

        <div class="absolute top-4 right-4 z-20 p-2 bg-black/20 backdrop-blur-sm rounded-full">
          <Search size="20" class="text-white" />
        </div>

        <div
          class="absolute inset-0 pointer-events-none flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent">

          <div class="absolute right-3 bottom-28 flex flex-col gap-6 items-center pointer-events-auto z-20">
            <div class="flex flex-col items-center gap-1">
              <Bookmark size="32" class="text-white drop-shadow-md" stroke-width="1.5" />
              <span class="text-xs font-medium text-white drop-shadow-md">{{ item.playCount || '24K' }}</span>
            </div>
            <div class="flex flex-col items-center gap-1" @click="goToFullPlayer(item.bookId)">
              <AlignJustify size="32" class="text-white drop-shadow-md cursor-pointer" stroke-width="1.5" />
              <span class="text-xs font-medium text-white drop-shadow-md">Episode</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <Share2 size="32" class="text-white drop-shadow-md" stroke-width="1.5" />
              <span class="text-xs font-medium text-white drop-shadow-md">Bagikan</span>
            </div>
          </div>

          <div class="w-full pl-4 pr-16 pb-[60px] pointer-events-auto" @click="goToFullPlayer(item.bookId)">
            <div class="flex items-center gap-1 mb-2">
              <h3 class="text-white font-bold text-[17px] drop-shadow-md line-clamp-1 leading-tight">{{ item.bookName }}
              </h3>
              <ChevronRight size="18" class="text-white/80" />
            </div>
            <p class="text-gray-200 text-[13px] line-clamp-2 leading-snug mb-3 drop-shadow-md font-light w-[90%]">
              {{ item.introduction || 'Tonton drama seru ini sekarang full episode di aplikasi CenaBox.' }}
            </p>
            <div class="flex items-center justify-between w-full pr-4 mt-2 mb-2">
              <div class="flex items-center gap-2">
                <ListVideo size="16" class="text-gray-300" />
                <span class="text-xs font-medium text-gray-300 tracking-wide">EP.1 / EP.{{ item.chapterCount || '60'
                }}</span>
              </div>
              <ChevronRight size="16" class="text-gray-400" />
            </div>
          </div>

          <div class="absolute bottom-[58px] left-0 w-full h-[2px] bg-white/20">
            <div class="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-100 ease-linear"
              :style="{ width: item.progress + '%' }"></div>
          </div>

        </div>
      </div>
    </div>

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
</style>
