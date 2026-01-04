<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { supabase } from '../../lib/supabase';
import { Users, Video, Activity, Server, Clock, RefreshCw } from 'lucide-vue-next';
import { useRoute } from 'vue-router';

const route = useRoute(); // Untuk cek halaman aktif

// --- STATE ---
const isLoading = ref(true);
const stats = ref({
  totalUsers: 0,
  totalDrama: 124,
  apiHits: 854020,
  serverStatus: 'Online',
  cpuUsage: 12,
  memoryUsage: 45
});

const recentLogs = ref([]);

// --- FETCH DATA ---
const fetchRealStats = async () => {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (!error) stats.value.totalUsers = count;

    // Log dummy / real
    recentLogs.value = [
      { id: 1, type: 'Login', msg: 'Admin login detected', time: 'Baru saja', status: 'info' }
    ];

  } catch (err) {
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

// --- REALTIME SUBSCRIPTION ---
const subscribeToUsers = () => {
  supabase
    .channel('public:profiles')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
      stats.value.totalUsers++;
    })
    .subscribe();
};

// --- ANIMASI DUMMY ---
let liveInterval = null;
const startLiveSimulation = () => {
  liveInterval = setInterval(() => {
    stats.value.apiHits += Math.floor(Math.random() * 5);
    stats.value.cpuUsage = 10 + Math.floor(Math.random() * 30);
  }, 2000);
};



const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num);

onMounted(() => {
  fetchRealStats();
  subscribeToUsers();
  startLiveSimulation();
});

onUnmounted(() => {
  if (liveInterval) clearInterval(liveInterval);
  supabase.removeAllChannels();
});
</script>

<template>

  <header class="flex justify-between items-center mb-10">
    <div>
      <h1 class="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
        Dashboard Overview
        <span v-if="isLoading" class="text-xs font-normal text-gray-500 flex items-center gap-1">
          <RefreshCw class="animate-spin" size="12" /> Syncing...
        </span>
      </h1>
      <p class="text-gray-500 text-sm mt-1 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Sistem Berjalan Normal
      </p>
    </div>
    <div class="flex items-center gap-4 bg-[#1A1C24] p-2 pr-4 rounded-full border border-gray-800">
      <div
        class="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF2965] to-orange-500 flex items-center justify-center text-white font-bold">
        A</div>
      <div class="text-right">
        <p class="text-white text-sm font-bold">Super Admin</p>
        <p class="text-gray-500 text-[10px]">admin@cenabox.com</p>
      </div>
    </div>
  </header>

  <div class="grid grid-cols-4 gap-6 mb-8">
    <div class="bg-[#1A1C24] p-6 rounded-2xl border border-gray-800 relative overflow-hidden group">
      <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Users size="60" class="text-blue-500" />
      </div>
      <div class="flex items-center gap-3 mb-2">
        <div class="p-2 bg-blue-500/10 rounded-lg text-blue-500">
          <Users size="20" />
        </div>
        <p class="text-gray-400 text-sm font-medium">Total Pengguna</p>
      </div>
      <p class="text-3xl font-bold text-white mt-2">{{ formatNumber(stats.totalUsers) }}</p>
      <p class="text-xs text-green-500 mt-2 flex items-center gap-1">
        <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Data Realtime
      </p>
    </div>

    <div
      class="bg-[#1A1C24] p-6 rounded-2xl border border-gray-800 relative overflow-hidden group border-b-2 border-b-[#FF2965]">
      <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Activity size="60" class="text-[#FF2965]" />
      </div>
      <div class="flex items-center gap-3 mb-2">
        <div class="p-2 bg-[#FF2965]/10 rounded-lg text-[#FF2965]">
          <Activity size="20" />
        </div>
        <p class="text-gray-400 text-sm font-medium">Total API Hits</p>
      </div>
      <p class="text-3xl font-bold text-white mt-2 font-mono">{{ formatNumber(stats.apiHits) }}</p>
      <p class="text-xs text-[#FF2965] mt-2 flex items-center gap-1 animate-pulse">
        Live Traffic
      </p>
    </div>

    <div class="bg-[#1A1C24] p-6 rounded-2xl border border-gray-800 relative overflow-hidden group">
      <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Video size="60" class="text-purple-500" />
      </div>
      <div class="flex items-center gap-3 mb-2">
        <div class="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Video size="20" /></div>
        <p class="text-gray-400 text-sm font-medium">Total Drama</p>
      </div>
      <p class="text-3xl font-bold text-white mt-2">{{ stats.totalDrama }}</p>
      <p class="text-xs text-gray-500 mt-2">12 Kategori Aktif</p>
    </div>

    <div class="bg-[#1A1C24] p-6 rounded-2xl border border-gray-800 relative overflow-hidden group">
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 bg-green-500/10 rounded-lg text-green-500">
          <Server size="20" />
        </div>
        <p class="text-gray-400 text-sm font-medium">Status Server</p>
      </div>
      <div class="space-y-3">
        <div>
          <div class="flex justify-between text-xs text-gray-400 mb-1"><span>CPU</span> <span>{{ stats.cpuUsage
              }}%</span></div>
          <div class="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-green-500 transition-all duration-500" :style="{ width: stats.cpuUsage + '%' }">
            </div>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-xs text-gray-400 mb-1"><span>RAM</span> <span>{{ stats.memoryUsage
              }}%</span></div>
          <div class="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-blue-500" :style="{ width: stats.memoryUsage + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-6">
    <div class="col-span-2 bg-[#1A1C24] rounded-2xl border border-gray-800 p-6">
      <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Clock size="18" class="text-gray-400" /> Aktivitas Terbaru
      </h3>
      <div class="flex flex-col gap-3">
        <div v-for="log in recentLogs" :key="log.id"
          class="flex items-center justify-between p-3 rounded-lg bg-[#0F1014] border border-gray-800 hover:border-gray-700 transition-colors">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-full bg-blue-500/10 text-blue-500">
              <Activity size="16" />
            </div>
            <div>
              <p class="text-sm text-white font-medium">{{ log.msg }}</p>
              <p class="text-xs text-gray-500 uppercase font-bold">{{ log.type }}</p>
            </div>
          </div>
          <span class="text-xs text-gray-500">{{ log.time }}</span>
        </div>
      </div>
    </div>

    <div
      class="col-span-1 bg-gradient-to-br from-[#1A1C24] to-[#0F1014] rounded-2xl border border-gray-800 p-6 flex flex-col justify-between">
      <div>
        <h3 class="text-lg font-bold text-white mb-2">Pusat Kendali</h3>
        <p class="text-xs text-gray-400 mb-6">Akses cepat ke fitur manajemen.</p>
        <div class="space-y-3">
          <button
            class="w-full py-3 bg-[#FF2965] hover:bg-[#d61e50] text-white rounded-lg text-sm font-bold transition-colors">
            + Upload Episode
          </button>
          <router-link to="/admin/ads"
            class="block w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold transition-colors text-center">
            Kelola Iklan
          </router-link>
        </div>
      </div>
      <div class="bg-gray-800/30 p-4 rounded-xl mt-4">
        <p class="text-xs text-gray-400 mb-1">Database</p>
        <p class="text-sm font-mono text-white">PostgreSQL (Supabase)</p>
      </div>
    </div>
  </div>


</template>
