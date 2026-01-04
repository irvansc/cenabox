<script setup>
import { RouterLink } from 'vue-router';
import { Home, PlaySquare, Bookmark, User } from 'lucide-vue-next';
</script>

<template>
  <nav class="fixed bottom-0 w-full bg-[#1A1C24] border-t border-gray-800 flex justify-around py-2.5 z-50 pb-safe ">

    <RouterLink to="/" class="flex flex-col items-center transition-colors duration-200 group"
      active-class="text-[#FF2965]" :class="$route.path === '/' ? 'text-[#FF2965]' : 'text-gray-500'">
      <Home size="22" :stroke-width="$route.path === '/' ? 2.5 : 2" />
      <span class="text-[10px] mt-1 font-medium">Beranda</span>
    </RouterLink>

    <RouterLink to="/shorts" class="flex flex-col items-center transition-colors duration-200 group"
      active-class="text-[#FF2965]" :class="$route.path === '/shorts' ? 'text-[#FF2965]' : 'text-gray-500'">
      <PlaySquare size="22" :stroke-width="$route.path === '/shorts' ? 2.5 : 2" />
      <span class="text-[10px] mt-1 font-medium">Untuk Anda</span>
    </RouterLink>

    <RouterLink to="/mylist" class="flex flex-col items-center transition-colors duration-200 group"
      active-class="text-[#FF2965]" :class="$route.path === '/mylist' ? 'text-[#FF2965]' : 'text-gray-500'">
      <Bookmark size="22" :stroke-width="$route.path === '/mylist' ? 2.5 : 2" />
      <span class="text-[10px] mt-1 font-medium">Daftarku</span>
    </RouterLink>

    <RouterLink to="/profile" class="flex flex-col items-center transition-colors duration-200 group"
      active-class="text-[#FF2965]" :class="$route.path === '/profile' ? 'text-[#FF2965]' : 'text-gray-500'">
      <User size="22" :stroke-width="$route.path === '/profile' ? 2.5 : 2" />
      <span class="text-[10px] mt-1 font-medium">Profil</span>
    </RouterLink>

  </nav>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 10px);
}
</style>
