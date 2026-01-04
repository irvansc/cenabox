<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import HomeMobile from './HomeMobile.vue';
import HomeDesktop from './HomeDesktop.vue';
import { useHead } from '@unhead/vue/client';
const isMobile = ref(true);

const checkScreenSize = () => {
  // Jika lebar layar kurang dari 1024px, dianggap Mobile/Tablet Portrait
  isMobile.value = window.innerWidth < 1024;
};
useHead({
  title: 'CenaBox - Nonton Drama Pendek & Series Asia Sub Indo Gratis',
  meta: [
    {
      name: 'description',
      content: 'Platform streaming drama pendek, drama korea, china, dan jepang dengan subtitle Indonesia. Nonton gratis tanpa ribet di CenaBox.'
    },
    { name: 'keywords', content: 'nonton drama, sub indo, drama pendek, streaming gratis, cenabox' }
  ]
});
onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});
</script>

<template>
  <HomeMobile v-if="isMobile" />
  <HomeDesktop v-else />
</template>
