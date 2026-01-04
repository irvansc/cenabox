<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { supabase } from '../../lib/supabase'; // Sesuaikan path jika menggunakan ../lib/supabase
import {
  Users, Video, Activity, Server, Clock, RefreshCw, Power,
  CheckCircle, AlertCircle, Megaphone
} from 'lucide-vue-next';

// --- STATE UTAMA ---
const isLoading = ref(true);
const stats = ref({
  totalUsers: 0,
  totalDrama: 124,
  apiHits: 854020,
  serverStatus: 'Online',
  cpuUsage: 12,
  memoryUsage: 45
});

// --- LOG SYSTEM ---
const recentLogs = ref([
  { id: 1, type: 'System', msg: 'Dashboard diakses', time: 'Baru saja', status: 'info' }
]);

const addLog = (msg, type = 'System') => {
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  recentLogs.value.unshift({ id: Date.now(), type, msg, time, status: 'info' });
  if (recentLogs.value.length > 5) recentLogs.value.pop();
};

// --- MAINTENANCE STATE ---
const isMaintenance = ref(false);
const toggling = ref(false);

// --- TOAST NOTIFICATION STATE ---
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success'); // 'success' or 'error'

const triggerToast = (msg, type = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => showToast.value = false, 3000);
};

// --- FETCH DATA ---
const fetchRealStats = async () => {
  try {
    // 1. Ambil Total User
    const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    if (!error) stats.value.totalUsers = count;

    // 2. Cek Status Maintenance
    const { data: maintData } = await supabase.from('app_settings').select('maintenance_mode').eq('id', 1).single();
    if (maintData) isMaintenance.value = maintData.maintenance_mode;

  } catch (err) {
    console.error(err);
    triggerToast("Gagal memuat data server", "error");
  } finally {
    isLoading.value = false;
  }
};

// --- ACTION: MAINTENANCE ---
const toggleMaintenance = async () => {
  toggling.value = true;
  const newState = !isMaintenance.value;

  try {
    const { error } = await supabase
      .from('app_settings')
      .update({ maintenance_mode: newState })
      .eq('id', 1);

    if (error) throw error;

    isMaintenance.value = newState;
    addLog(newState ? 'Mode Maintenance DIAKTIFKAN' : 'Mode Maintenance DINONAKTIFKAN', 'Admin');
    triggerToast(newState ? "🔴 Aplikasi sekarang mode MAINTENANCE" : "🟢 Aplikasi sekarang ONLINE");

  } catch (err) {
    triggerToast("Gagal update status: " + err.message, "error");
  } finally {
    toggling.value = false;
  }
};

// --- REALTIME & SIMULATION ---
const subscribeToUsers = () => {
  supabase.channel('public:profiles')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
      stats.value.totalUsers++;
      addLog('Pengguna baru mendaftar', 'User');
    })
    .subscribe();
};

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
  <div class="relative min-h-full">

    <header class="flex justify-between items-center mb-10">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          Dashboard Overview
          <span v-if="isLoading" class="text-xs font-normal text-gray-500 flex items-center gap-1">
            <RefreshCw class="animate-spin" size="12" /> Syncing...
          </span>
        </h1>
        <p class="text-gray-500 text-sm mt-1 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full animate-pulse"
            :class="isMaintenance ? 'bg-red-500' : 'bg-green-500'"></span>
          {{ isMaintenance ? 'Mode Maintenance Aktif' : 'Sistem Berjalan Normal' }}
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
        <p class="text-xs text-green-500 mt-2 flex items-center gap-1"><span
            class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Data Realtime</p>
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
        <p class="text-xs text-[#FF2965] mt-2 flex items-center gap-1 animate-pulse">Live Traffic</p>
      </div>
      <div class="bg-[#1A1C24] p-6 rounded-2xl border border-gray-800 relative overflow-hidden group">
        <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Video size="60"
            class="text-purple-500" /></div>
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
          <Clock size="18" class="text-gray-400" /> Log Aktivitas
        </h3>
        <div class="flex flex-col gap-3">
          <div v-for="log in recentLogs" :key="log.id"
            class="flex items-center justify-between p-3 rounded-lg bg-[#0F1014] border border-gray-800 hover:border-gray-700 transition-colors animate-fade-in">
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
          <p class="text-xs text-gray-400 mb-6">Kelola fitur utama aplikasi.</p>
          <div class="space-y-3">

            <router-link to="/admin/ads"
              class="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 border border-gray-700 hover:border-[#FF2965]">
              <Megaphone size="16" /> Kelola Iklan & Cuan
            </router-link>

            <button @click="toggleMaintenance" :disabled="toggling"
              class="w-full py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 border relative overflow-hidden group"
              :class="isMaintenance
                ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                : 'bg-green-500/10 border-green-500 text-green-500 hover:bg-green-500 hover:text-white'">
              <RefreshCw v-if="toggling" class="animate-spin" size="16" />
              <Power v-else size="16" />
              {{ isMaintenance ? 'Matikan Maintenance' : 'Aktifkan Maintenance' }}
            </button>

          </div>
        </div>
        <div class="bg-gray-800/30 p-4 rounded-xl mt-4">
          <div class="flex justify-between items-center mb-1">
            <p class="text-xs text-gray-400">Status Aplikasi</p>
            <span class="w-2 h-2 rounded-full"
              :class="isMaintenance ? 'bg-red-500 animate-pulse' : 'bg-green-500'"></span>
          </div>
          <p class="text-sm font-mono font-bold" :class="isMaintenance ? 'text-red-400' : 'text-green-400'">
            {{ isMaintenance ? 'OFFLINE (MAINTENANCE)' : 'ONLINE (LIVE)' }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="showToast" class="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-down">
      <div
        class="bg-[#1A1C24] text-white px-6 py-3 rounded-full shadow-2xl border border-gray-700 flex items-center gap-3">
        <CheckCircle v-if="toastType === 'success'" size="20" class="text-green-500" />
        <AlertCircle v-else size="20" class="text-red-500" />
        <span class="text-sm font-medium">{{ toastMessage }}</span>
      </div>
    </div>

  </div>
</template>

<style scoped>
@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.animate-fade-in-down {
  animation: fade-in-down 0.3s ease-out forwards;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
