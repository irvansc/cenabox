<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../lib/supabase';
import {
  Megaphone,
  Plus, Trash2, Edit, Image, Code, ExternalLink,
  XCircle, Loader2
} from 'lucide-vue-next';

// --- STATE ADS ---
const ads = ref([]);
const loading = ref(true);
const showModal = ref(false);
const submitting = ref(false);

const form = ref({
  id: null,
  title: '',
  ad_source: 'custom',
  location: 'home_grid',
  image_file: null,
  image_url: '',
  target_url: '',
  script_code: '',
  is_active: true
});

const locations = [
  { value: 'home_grid', label: 'Grid Beranda (Native)' },
  { value: 'home_banner', label: 'Banner Utama' },
  { value: 'float_bottom', label: 'Melayang Bawah' },
  { value: 'player_overlay', label: 'Dalam Video Player' }
];

// --- CRUD FUNCTIONS ---
const fetchAds = async () => {
  loading.value = true;
  const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
  if (!error) ads.value = data;
  loading.value = false;
};

const saveAd = async () => {
  if (!form.value.title) return alert('Judul wajib diisi!');
  submitting.value = true;
  try {
    let finalImageUrl = form.value.image_url;
    if (form.value.ad_source === 'custom' && form.value.image_file) {
      const file = form.value.image_file;
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('ads').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('ads').getPublicUrl(fileName);
      finalImageUrl = data.publicUrl;
    }
    const payload = {
      title: form.value.title,
      ad_source: form.value.ad_source,
      location: form.value.location,
      image_url: form.value.ad_source === 'custom' ? finalImageUrl : null,
      target_url: form.value.ad_source === 'custom' ? form.value.target_url : null,
      script_code: form.value.ad_source === 'network' ? form.value.script_code : null,
      is_active: form.value.is_active
    };
    if (form.value.id) await supabase.from('ads').update(payload).eq('id', form.value.id);
    else await supabase.from('ads').insert([payload]);

    closeModal();
    fetchAds();
  } catch (err) { alert('Gagal: ' + err.message); }
  finally { submitting.value = false; }
};

const deleteAd = async (id) => {
  if (!confirm('Hapus permanen?')) return;
  await supabase.from('ads').delete().eq('id', id);
  fetchAds();
};

const toggleStatus = async (item) => {
  item.is_active = !item.is_active;
  await supabase.from('ads').update({ is_active: item.is_active }).eq('id', item.id);
};

// --- HELPER ---
const openModal = (item = null) => {
  form.value = item ? { ...item, image_file: null } : { id: null, title: '', ad_source: 'custom', location: 'home_grid', image_file: null, image_url: '', target_url: '', script_code: '', is_active: true };
  showModal.value = true;
};
const closeModal = () => showModal.value = false;
const handleFileChange = (e) => { const f = e.target.files[0]; if (f) { form.value.image_file = f; form.value.image_url = URL.createObjectURL(f); } };

onMounted(() => fetchAds());
</script>

<template>


  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-white tracking-tight">Manajemen Iklan</h1>
      <p class="text-gray-400 text-sm mt-1">Kelola banner dan script monetisasi aplikasi.</p>
    </div>
    <button @click="openModal()"
      class="bg-[#FF2965] hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-pink-900/20 active:scale-95">
      <Plus size="18" /> Tambah Iklan
    </button>
  </div>

  <div class="bg-[#1A1C24] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
    <div v-if="loading" class="p-20 flex justify-center">
      <Loader2 class="animate-spin text-[#FF2965]" size="32" />
    </div>

    <table v-else class="w-full text-left border-collapse">
      <thead class="bg-black/30 text-gray-400 text-xs uppercase font-bold tracking-wider">
        <tr>
          <th class="p-5">Preview</th>
          <th class="p-5">Detail Iklan</th>
          <th class="p-5">Tipe</th>
          <th class="p-5 text-center">Status</th>
          <th class="p-5 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-800">
        <tr v-for="ad in ads" :key="ad.id" class="hover:bg-white/5 transition-colors group">
          <td class="p-5 w-28">
            <div v-if="ad.ad_source === 'custom'"
              class="w-20 h-14 rounded-lg overflow-hidden bg-gray-800 border border-gray-700 shadow-sm">
              <img :src="ad.image_url"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div v-else
              class="w-20 h-14 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Code size="24" />
            </div>
          </td>
          <td class="p-5">
            <p class="font-bold text-white text-sm">{{ ad.title }}</p>
            <div class="flex items-center gap-2 mt-1.5">
              <span
                class="text-[10px] bg-gray-800 border border-gray-700 px-2 py-0.5 rounded text-gray-400 uppercase tracking-wide">{{
                  locations.find(l => l.value === ad.location)?.label || ad.location}}</span>
            </div>
            <a v-if="ad.target_url" :href="ad.target_url" target="_blank"
              class="text-[11px] text-blue-400 mt-1 flex items-center gap-1 hover:underline truncate max-w-[200px]">
              <ExternalLink size="10" /> {{ ad.target_url }}
            </a>
          </td>
          <td class="p-5">
            <span v-if="ad.ad_source === 'custom'"
              class="inline-flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-md border border-green-400/20">
              <Image size="12" /> Gambar
            </span>
            <span v-else
              class="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md border border-blue-400/20">
              <Code size="12" /> Script
            </span>
          </td>
          <td class="p-5 text-center">
            <button @click="toggleStatus(ad)"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
              :class="ad.is_active ? 'bg-[#FF2965]' : 'bg-gray-700'">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="ad.is_active ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </td>
          <td class="p-5 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button @click="openModal(ad)"
              class="p-2 bg-gray-800 hover:bg-white hover:text-black rounded-lg text-gray-400 transition-colors shadow-sm">
              <Edit size="16" />
            </button>
            <button @click="deleteAd(ad.id)"
              class="p-2 bg-gray-800 hover:bg-red-500 hover:text-white rounded-lg text-gray-400 transition-colors shadow-sm">
              <Trash2 size="16" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && ads.length === 0"
      class="p-16 text-center flex flex-col items-center justify-center text-gray-500">
      <div class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Megaphone size="32" class="opacity-50" />
      </div>
      <p class="text-sm">Belum ada iklan aktif.</p>
      <button @click="openModal()" class="mt-4 text-[#FF2965] hover:underline text-sm font-medium">Buat iklan
        pertama</button>
    </div>
  </div>


  <div v-if="showModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
    <div
      class="bg-[#1A1C24] w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden scale-100 transition-transform">
      <div class="p-5 border-b border-gray-700 flex justify-between items-center bg-[#252830]">
        <h3 class="font-bold text-white flex items-center gap-2">
          <Megaphone size="18" class="text-[#FF2965]" /> {{ form.id ? 'Edit Iklan' : 'Pasang Iklan Baru' }}
        </h3>
        <button @click="closeModal" class="text-gray-400 hover:text-white">
          <XCircle size="24" />
        </button>
      </div>
      <div class="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="text-xs text-gray-400 mb-1.5 block font-medium">Judul Iklan</label><input
              v-model="form.title" type="text"
              class="w-full bg-[#0F1014] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-[#FF2965] outline-none transition-colors">
          </div>
          <div><label class="text-xs text-gray-400 mb-1.5 block font-medium">Posisi</label><select
              v-model="form.location"
              class="w-full bg-[#0F1014] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-[#FF2965] outline-none transition-colors">
              <option v-for="loc in locations" :key="loc.value" :value="loc.value">{{ loc.label }}</option>
            </select></div>
        </div>
        <div>
          <label class="text-xs text-gray-400 mb-2 block font-medium">Jenis Iklan</label>
          <div class="flex bg-[#0F1014] p-1 rounded-lg border border-gray-700">
            <button @click="form.ad_source = 'custom'"
              class="flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2"
              :class="form.ad_source === 'custom' ? 'bg-[#252830] text-white shadow ring-1 ring-gray-600' : 'text-gray-500 hover:text-gray-300'">
              <Image size="14" /> Upload Banner
            </button>
            <button @click="form.ad_source = 'network'"
              class="flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2"
              :class="form.ad_source === 'network' ? 'bg-[#252830] text-white shadow ring-1 ring-gray-600' : 'text-gray-500 hover:text-gray-300'"><Code
                size="14" /> HTML / Script</button>
          </div>
        </div>
        <div v-if="form.ad_source === 'custom'" class="space-y-4">
          <div>
            <label class="text-xs text-gray-400 mb-1.5 block font-medium">File Gambar</label>
            <div
              class="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-[#FF2965] hover:bg-[#FF2965]/5 transition-all relative cursor-pointer group">
              <input type="file" @change="handleFileChange" accept="image/*"
                class="absolute inset-0 opacity-0 cursor-pointer z-10">
              <div v-if="form.image_url" class="relative z-0"><img :src="form.image_url"
                  class="h-32 mx-auto rounded-lg object-contain shadow-lg"></div>
              <div v-else class="text-gray-500">
                <Image size="32" class="mx-auto mb-2 opacity-50" /><span class="text-xs font-medium">Klik untuk upload
                  gambar</span>
              </div>
            </div>
          </div>
          <div><label class="text-xs text-gray-400 mb-1.5 block font-medium">Link Tujuan</label>
            <div class="relative"><input v-model="form.target_url" type="url" placeholder="https://..."
                class="w-full bg-[#0F1014] border border-gray-700 rounded-lg p-2.5 pl-9 text-sm text-white focus:border-[#FF2965] outline-none">
              <ExternalLink size="14" class="absolute left-3 top-3 text-gray-500" />
            </div>
          </div>
        </div>
        <div v-else class="space-y-4">
          <div><label class="text-xs text-gray-400 mb-1.5 block font-medium">Kode Script</label><textarea
              v-model="form.script_code" rows="5"
              class="w-full bg-[#0F1014] border border-gray-700 rounded-lg p-3 text-xs font-mono text-green-400 focus:border-[#FF2965] outline-none"
              placeholder=""></textarea></div>
        </div>
      </div>
      <div class="p-5 border-t border-gray-700 bg-[#252830] flex justify-end gap-3">
        <button @click="closeModal"
          class="px-4 py-2 text-sm text-gray-400 hover:text-white font-medium hover:bg-white/5 rounded-lg transition-colors">Batal</button>
        <button @click="saveAd" :disabled="submitting"
          class="px-6 py-2 bg-[#FF2965] hover:bg-pink-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-pink-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
          <Loader2 v-if="submitting" class="animate-spin" size="16" /> {{ submitting ? 'Menyimpan...' : 'Simpan Iklan'
          }}
        </button>
      </div>
    </div>
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
  animation: fade-in 0.2s ease-out;
}
</style>
