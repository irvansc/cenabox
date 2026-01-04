<script setup>
import { onMounted, ref, nextTick, watch } from 'vue';

const props = defineProps({
  scriptCode: {
    type: String,
    required: true
  }
});

const containerRef = ref(null);

const executeScript = () => {
  if (!containerRef.value) return;
  if (!props.scriptCode) {
    console.warn('[AD-DEBUG] Script code kosong/null!');
    return;
  }

  console.group('🔍 [AD-DEBUG] Memulai Inject Iklan');
  console.log('1. Raw Script:', props.scriptCode);

  // 1. Bersihkan container lama
  containerRef.value.innerHTML = '';

  // 2. Parsing HTML String
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = props.scriptCode;

  // 3. Cari elemen script
  const scripts = tempDiv.querySelectorAll('script');
  console.log(`2. Ditemukan ${scripts.length} tag script.`);

  if (scripts.length === 0) {
    console.warn('⚠️ Tidak ada tag <script> ditemukan. Apakah ini hanya HTML biasa?');
  }

  // 4. Proses Script (Re-create element)
  scripts.forEach((oldScript, index) => {
    const newScript = document.createElement('script');
    
    // Salin Atribut
    console.log(`3. Memproses Script #${index + 1}`);
    Array.from(oldScript.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value);
      console.log(`   - Attr: ${attr.name}="${attr.value}"`);
    });

    // Salin Isi (Inline Script)
    if (oldScript.innerHTML) {
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      console.log('   - Tipe: Inline Script (Kode langsung)');
    } else {
      console.log('   - Tipe: External Source (src)');
    }

    // Tambahkan Event Listener untuk Debugging Load/Error
    newScript.onload = () => {
      console.log(`✅ [AD-DEBUG] Script #${index + 1} BERHASIL dimuat!`);
      console.log('   Sumber:', newScript.src);
    };

    newScript.onerror = (e) => {
      console.error(`❌ [AD-DEBUG] Script #${index + 1} GAGAL dimuat (Error/Blocked).`);
      console.error('   Penyebab kemungkinan: AdBlocker atau Koneksi Error.');
    };

    // Inject ke DOM
    containerRef.value.appendChild(newScript);
  });
  
  // 5. Masukkan elemen non-script (misal div pembungkus)
  let nonScriptCount = 0;
  Array.from(tempDiv.childNodes).forEach(node => {
    if (node.tagName !== 'SCRIPT') {
      containerRef.value.appendChild(node.cloneNode(true));
      nonScriptCount++;
    }
  });
  
  if (nonScriptCount > 0) {
    console.log(`4. Menambahkan ${nonScriptCount} elemen HTML non-script (div/img/dll).`);
  }

  console.groupEnd();
};

// Jalankan saat mounted
onMounted(() => {
  nextTick(() => {
    executeScript();
  });
});

// Jalankan ulang jika scriptCode berubah (misal ganti halaman)
watch(() => props.scriptCode, () => {
  nextTick(() => {
    executeScript();
  });
});
</script>

<template>
  <div ref="containerRef" class="ad-network-container w-full flex justify-center items-center min-h-[10px]">
    </div>
</template>

<style scoped>
.ad-network-container {
  overflow: visible; /* Penting agar pop-up tidak terpotong */
  max-width: 100%;
}
</style>