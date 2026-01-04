<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMsg = ref('');

const handleAdminLogin = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    await authStore.loginAdmin(email.value, password.value);
    router.push('/admin/dashboard');
  } catch (e) {
    errorMsg.value = "Login Gagal: " + e.message;
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#0F1014] flex flex-col justify-center items-center px-4">
    <div class="w-full max-w-md bg-[#1A1C24] p-8 rounded-2xl border border-gray-800">
      <h2 class="text-2xl font-bold text-white mb-6 text-center">Admin Portal</h2>

      <form @submit.prevent="handleAdminLogin" class="flex flex-col gap-4">
        <div>
          <label class="text-gray-400 text-xs mb-1 block">Email</label>
          <input v-model="email" type="email" required
            class="w-full bg-[#0F1014] border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:border-[#FF2965]"
            placeholder="admin@cenabox.com">
        </div>

        <div>
          <label class="text-gray-400 text-xs mb-1 block">Password</label>
          <input v-model="password" type="password" required
            class="w-full bg-[#0F1014] border border-gray-700 text-white p-3 rounded-lg focus:outline-none focus:border-[#FF2965]"
            placeholder="••••••">
        </div>

        <p v-if="errorMsg" class="text-red-500 text-xs text-center">{{ errorMsg }}</p>

        <button type="submit" :disabled="isLoading"
          class="bg-[#FF2965] hover:bg-pink-600 text-white font-bold py-3 rounded-lg mt-2 transition-colors">
          {{ isLoading ? 'Loading...' : 'Masuk Dashboard' }}
        </button>
      </form>
    </div>
  </div>
</template>
