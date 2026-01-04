<script setup>
import { onMounted, ref, nextTick } from 'vue';

const props = defineProps({
  scriptCode: {
    type: String,
    required: true
  }
});

const containerRef = ref(null);

const executeScript = () => {
  if (!containerRef.value || !props.scriptCode) return;

  // 1. Bersihkan container
  containerRef.value.innerHTML = '';

  // 2. Buat elemen sementara untuk memparsing string HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = props.scriptCode;

  // 3. Ambil semua tag script dari string tersebut
  const scripts = tempDiv.querySelectorAll('script');

  // 4. Loop dan buat ulang script agar dieksekusi browser
  scripts.forEach((oldScript) => {
    const newScript = document.createElement('script');

    // Salin semua atribut (src, data-zone, async, dll)
    Array.from(oldScript.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value);
    });

    // Salin isi script jika ada (inline script)
    if (oldScript.innerHTML) {
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
    }

    // Masukkan ke dalam container kita
    containerRef.value.appendChild(newScript);
  });

  // 5. Masukkan elemen non-script (misal ada div pembungkus dari iklan)
  Array.from(tempDiv.childNodes).forEach(node => {
    if (node.tagName !== 'SCRIPT') {
      containerRef.value.appendChild(node.cloneNode(true));
    }
  });
};

onMounted(() => {
  nextTick(() => {
    executeScript();
  });
});
</script>

<template>
  <div ref="containerRef" class="ad-network-container flex justify-center items-center min-h-[50px]">
  </div>
</template>

<style scoped>
.ad-network-container {
  overflow: hidden;
  max-width: 100%;
}
</style>
