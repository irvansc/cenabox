<script setup>
import { ref, onMounted } from 'vue';
import BottomNav from '../components/BottomNav.vue';
import { supabase } from '../lib/supabase';
import {
  LogOut, Gift, Heart, Lock, History, Crown, Bell, Mail, Loader2
} from 'lucide-vue-next';
import Skeleton from '../components/ui/Skeleton.vue';

// --- STATE ---
const isLoggedIn = ref(false);
const isLoading = ref(true);
const userData = ref({});

// --- 1. CEK STATUS LOGIN (SUPABASE REAL) ---
const checkLoginStatus = async () => {
  isLoading.value = true;

  // Cek sesi aktif saat ini
  const { data: { session } } = await supabase.auth.getSession();

  if (session && session.user) {
    setUserData(session.user);
  } else {
    isLoggedIn.value = false;
  }

  isLoading.value = false;

  // Listener untuk perubahan auth (Login/Logout otomatis update UI)
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session && session.user) {
      setUserData(session.user);
    } else {
      isLoggedIn.value = false;
      userData.value = {};
    }
  });
};

// Helper untuk set data dari object user Supabase
const setUserData = (user) => {
  isLoggedIn.value = true;
  userData.value = {
    // Supabase menyimpan data Google di user_metadata
    name: user.user_metadata.full_name || 'Pengguna CenaBox',
    email: user.email,
    avatar: user.user_metadata.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cena',
    id: user.id
  };
};

// --- 2. LOGIN DENGAN GOOGLE (SUPABASE) ---
const handleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirect kembali ke halaman profile ini setelah login sukses
        redirectTo: window.location.origin + '/profile'
      }
    });
    if (error) throw error;
  } catch (error) {
    alert('Gagal login: ' + error.message);
  }
};

// --- 3. LOGOUT (SUPABASE) ---
const handleLogout = async () => {
  if (confirm('Keluar dari akun?')) {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      isLoggedIn.value = false;
      userData.value = {};
    }
  }
};

onMounted(() => {
  checkLoginStatus();
});
</script>

<template>
  <div class="bg-[#0F1014] min-h-screen text-white pb-24 font-sans">

    <div v-if="isLoading" class="px-4 pt-10 flex flex-col items-center animate-fade-in">

      <Skeleton type="circle" width="96px" height="96px" className="mb-4" />

      <Skeleton width="150px" height="24px" className="mb-2" />
      <Skeleton width="200px" height="20px" className="rounded-full" />

      <div class="w-full mt-8">
        <Skeleton width="100%" height="80px" className="rounded-2xl" />
      </div>

      <div class="w-full mt-8">
        <Skeleton width="100%" height="56px" className="rounded-xl" />
      </div>

    </div>

    <div v-else>

      <div v-if="isLoggedIn" class="animate-fade-in px-4 pt-10">

        <div class="flex flex-col items-center text-center mb-8">
          <div class="relative mb-4">
            <div class="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#FF2965] to-orange-500 shadow-2xl">
              <img :src="userData.avatar" class="w-full h-full rounded-full object-cover border-4 border-[#0F1014]" />
            </div>
          </div>

          <h2 class="text-2xl font-bold text-white">{{ userData.name }}</h2>
          <div class="flex items-center gap-1.5 mt-2 bg-[#1A1C24] px-4 py-1.5 rounded-full border border-gray-800">
            <Mail size="12" class="text-gray-400" />
            <p class="text-xs text-gray-300">{{ userData.email }}</p>
          </div>
        </div>

        <div class="mb-8">
          <div
            class="bg-gradient-to-r from-pink-600 to-rose-700 rounded-2xl p-5 flex items-center justify-between shadow-lg relative overflow-hidden group cursor-pointer border border-pink-500/30">
            <div
              class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent">
            </div>

            <div class="relative z-10">
              <h3 class="font-bold text-white text-lg flex items-center gap-2">
                <Gift size="22" class="text-white animate-bounce-slow" />
                Traktir Developer
              </h3>
              <p class="text-xs text-pink-100 mt-1 max-w-[200px]">Dukung kami agar aplikasi ini terus berkembang tanpa
                iklan mengganggu.</p>
            </div>

            <button
              class="relative z-10 bg-white text-pink-700 text-xs font-bold px-5 py-2.5 rounded-full shadow-xl group-hover:scale-105 transition-transform flex items-center gap-1">
              <Heart size="14" fill="currentColor" /> Donate
            </button>
          </div>
        </div>

        <button @click="handleLogout"
          class="w-full bg-[#1A1C24] border border-gray-800 hover:border-red-500/50 hover:bg-red-500/10 text-gray-300 hover:text-red-500 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group">
          <LogOut size="18" class="group-hover:translate-x-1 transition-transform" />
          Keluar dari Akun
        </button>

        <div class="text-center mt-12 opacity-50">
          <p class="text-[10px] text-gray-600">ID Pengguna: {{ userData.id }}</p>
          <p class="text-[10px] text-gray-700 mt-1">CenaBox v1.0.0</p>
        </div>

      </div>


      <div v-else class="flex flex-col items-center justify-center min-h-[80vh] px-8 text-center animate-fade-in">

        <div
          class="w-24 h-24 bg-[#1A1C24] rounded-full flex items-center justify-center mb-6 shadow-2xl border border-gray-800 relative">
          <div class="absolute inset-0 bg-[#FF2965] rounded-full blur-xl opacity-20"></div>
          <Lock size="40" class="text-[#FF2965]" />
        </div>

        <h2 class="text-2xl font-bold text-white mb-2">Login Akun</h2>
        <p class="text-gray-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
          Masuk untuk menyimpan riwayat tontonan dan sinkronisasi antar perangkat.
        </p>

        <button @click="handleLogin"
          class="w-full bg-white text-gray-900 py-3.5 rounded-xl font-bold text-sm shadow-lg hover:bg-gray-100 transition-all active:scale-95 mb-4 flex items-center justify-center gap-3">
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4" />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853" />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05" />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335" />
          </svg>
          Masuk dengan Google
        </button>

        <div class="mt-8 flex gap-6 text-center justify-center">
          <div class="flex flex-col items-center gap-1 opacity-50">
            <History size="20" class="text-gray-400" />
            <span class="text-[10px] text-gray-500">Riwayat</span>
          </div>
          <div class="flex flex-col items-center gap-1 opacity-50">
            <Crown size="20" class="text-gray-400" />
            <span class="text-[10px] text-gray-500">Premium</span>
          </div>
          <div class="flex flex-col items-center gap-1 opacity-50">
            <Bell size="20" class="text-gray-400" />
            <span class="text-[10px] text-gray-500">Info</span>
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
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out forwards;
}

.animate-bounce-slow {
  animation: bounce 2s infinite;
}
</style>
