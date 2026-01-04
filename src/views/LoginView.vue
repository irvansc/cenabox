<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { ChevronRight } from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();
const isLoading = ref(false);
const errorMsg = ref('');

const handleGoogleLogin = async () => {
  try {
    isLoading.value = true;
    errorMsg.value = '';
    await authStore.loginWithGoogle();
    // User akan diarahkan ke Google
  } catch (e) {
    errorMsg.value = e.message || 'Terjadi kesalahan saat login.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen w-full bg-[#0F1014] flex items-center justify-center p-6 relative overflow-hidden font-sans">

    <div
      class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[500px] bg-gradient-to-b from-[#FF2965]/20 via-[#FF2965]/5 to-transparent blur-[80px] pointer-events-none">
    </div>
    <div class="absolute bottom-0 right-0 w-64 h-64 bg-purple-900/20 blur-[100px] pointer-events-none"></div>

    <div class="w-full max-w-[420px] flex flex-col relative z-10 animate-fade-in-up">

      <div class="flex flex-col items-center text-center mb-12 sm:mb-16">
        <div
          class="w-20 h-20 bg-gradient-to-tr from-[#FF2965] to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20 mb-6 rotate-3 transform hover:rotate-0 transition-all duration-500 cursor-default">
          <span class="text-4xl font-black text-white italic">C</span>
        </div>

        <h1 class="text-4xl sm:text-5xl font-black italic tracking-tighter text-white mb-3">
          Cena<span class="text-[#FF2965]">Box</span>
        </h1>

        <p class="text-gray-400 text-sm sm:text-base font-light leading-relaxed max-w-[80%]">
          Nikmati ribuan drama pendek vertikal eksklusif dalam satu genggaman.
        </p>
      </div>

      <div class="w-full space-y-4">

        <button @click="handleGoogleLogin" :disabled="isLoading"
          class="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl active:scale-[0.98] group relative overflow-hidden">

          <div v-if="isLoading" class="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>

          <template v-else>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg"
              class="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span class="text-sm sm:text-base">Lanjutkan dengan Google</span>
          </template>
        </button>

        <div v-if="errorMsg" class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center animate-shake">
          <p class="text-red-400 text-xs">{{ errorMsg }}</p>
        </div>

        <div class="flex items-center gap-4 py-4">
          <div class="h-[1px] bg-gray-800 flex-1"></div>
          <span class="text-xs text-gray-600 font-medium">ATAU</span>
          <div class="h-[1px] bg-gray-800 flex-1"></div>
        </div>

        <button @click="router.push('/')"
          class="w-full bg-[#1A1C24] hover:bg-[#252830] border border-gray-800 text-gray-300 font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] group">
          <span class="text-sm">Masuk sebagai Tamu</span>
          <ChevronRight size="16"
            class="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </button>

      </div>

      <div class="mt-12 text-center">
        <p class="text-[10px] text-gray-600">
          Dengan melanjutkan, Anda menyetujui <a href="#" class="text-gray-500 hover:text-[#FF2965] underline">Syarat
            Layanan</a> & <a href="#" class="text-gray-500 hover:text-[#FF2965] underline">Kebijakan Privasi</a> kami.
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-5px);
  }

  75% {
    transform: translateX(5px);
  }
}

.animate-shake {
  animation: shake 0.3s ease-in-out;
}
</style>
