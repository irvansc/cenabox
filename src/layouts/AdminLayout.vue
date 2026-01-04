<script setup>
import AdminSidebar from '../components/admin/AdminSidebar.vue';
</script>

<template>
  <div class="min-h-screen bg-[#0F1014] flex font-sans text-white">
    <AdminSidebar />

    <main class="flex-1 p-8 ml-64">
      <router-view />
    </main>
  </div>
</template>
