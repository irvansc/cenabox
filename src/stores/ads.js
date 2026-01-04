import { defineStore } from 'pinia';
import { supabase } from '../lib/supabase';

export const useAdsStore = defineStore('ads', {
  state: () => ({
    activeAds: [], // Menampung semua iklan aktif dari DB
    loading: false
  }),

  getters: {
    // Filter Iklan berdasarkan lokasi
    nativeAds: (state) => state.activeAds.filter(ad => ad.location === 'home_grid'),
    bannerAds: (state) => state.activeAds.filter(ad => ad.location === 'home_banner'),
    floatingAds: (state) => state.activeAds.filter(ad => ad.location === 'float_bottom'),
    playerAds: (state) => state.activeAds.filter(ad => ad.location === 'player_overlay')
  },

  actions: {
    // 1. FETCH IKLAN AKTIF DARI SUPABASE
    async fetchActiveAds() {
      this.loading = true;
      try {
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .eq('is_active', true); // HANYA AMBIL YANG AKTIF

        if (error) throw error;
        this.activeAds = data || [];

      } catch (err) {
        console.error('Gagal memuat iklan:', err.message);
      } finally {
        this.loading = false;
      }
    },

    // 2. LOGIKA INJECT (Menyelipkan Iklan di antara Drama)
    // pattern: Muncul setiap X item
    injectAds(originalList, pattern = 6) {
      if (!originalList || originalList.length === 0) return [];
      if (this.nativeAds.length === 0) return originalList; // Kalau ga ada iklan, balikin aslinya

      let result = [];
      let adIndex = 0;

      originalList.forEach((item, index) => {
        result.push(item);

        // Jika sudah mencapai kelipatan pattern (misal item ke-6, 12, dst)
        if ((index + 1) % pattern === 0) {
          // Ambil iklan secara bergantian (looping)
          const ad = this.nativeAds[adIndex % this.nativeAds.length];

          // Masukkan objek iklan dengan format khusus agar dikenali di v-for
          result.push({
            isAd: true,
            id: `ad-${ad.id}-${index}`, // ID unik
            ...ad // Copy semua data iklan (image_url, title, script_code, dll)
          });

          adIndex++;
        }
      });

      return result;
    }
  }
});
