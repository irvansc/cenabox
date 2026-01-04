<script setup>
import { useAuthStore } from '../../stores/auth';
import { useRouter, useRoute } from 'vue-router';
import {
  LayoutDashboard, Users, Video, LogOut, Database, Megaphone
} from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const handleLogout = async () => {
  if (confirm('Yakin ingin keluar?')) {
    await authStore.logout();
    router.push('/admin/login');
  }
};
</script>

<template>
  <aside class="w-64 bg-[#1A1C24] border-r border-gray-800 p-6 flex flex-col fixed h-full z-20 top-0 left-0">
    <div class="text-2xl font-bold italic text-white mb-10 tracking-tight">
      Cena<span class="text-[#FF2965]">Admin</span>
    </div>

    <nav class="flex-1 flex flex-col gap-2">
      <router-link to="/admin/dashboard" class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
        :class="route.path === '/admin/dashboard' ? 'bg-[#FF2965] text-white shadow-lg shadow-pink-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'">
        <LayoutDashboard size="20" /> <span class="font-medium text-sm">Dashboard</span>
      </router-link>

      <router-link to="/admin/ads" class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
        :class="route.path === '/admin/ads' ? 'bg-[#FF2965] text-white shadow-lg shadow-pink-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'">
        <Megaphone size="20" /> <span class="font-medium text-sm">Manajemen Iklan</span>
      </router-link>

      <div
        class="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl cursor-pointer transition-all">
        <Video size="20" /> <span class="font-medium text-sm">Manajemen Drama</span>
      </div>
      <div
        class="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl cursor-pointer transition-all">
        <Users size="20" /> <span class="font-medium text-sm">Pengguna</span>
      </div>

      <div class="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500 font-bold px-2">SYSTEM</div>
      <div
        class="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl cursor-pointer transition-all">
        <Database size="20" /> <span class="font-medium text-sm">Database</span>
      </div>
    </nav>

    <button @click="handleLogout"
      class="flex items-center gap-3 text-gray-500 hover:text-red-500 mt-auto pt-6 border-t border-gray-800 transition-colors w-full">
      <LogOut size="18" /> <span class="font-medium text-sm">Keluar</span>
    </button>
  </aside>
</template>
