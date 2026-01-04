<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import HomeMobile from './HomeMobile.vue';
import HomeDesktop from './HomeDesktop.vue';

const isMobile = ref(true);

const checkScreenSize = () => {
  // Jika lebar layar kurang dari 1024px, dianggap Mobile/Tablet Portrait
  isMobile.value = window.innerWidth < 1024;
};

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
