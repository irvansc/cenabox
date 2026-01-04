import axios from 'axios';

// PERUBAHAN: Ambil dari Environment Variable
const API_TOKEN = import.meta.env.VITE_DRAMABOX_TOKEN;

const apiClient = axios.create({
  baseURL: 'https://sapimu.au/dramabox/api',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + API_TOKEN
  }
});

export default {
  // 1. Home - Untukmu
  getForYou() {
    return apiClient.get('/foryou/1?lang=in');
  },
  // 2. Home - Terbaru
  getNewReleases() {
    return apiClient.get('/new/1?lang=in&pageSize=20');
  },
  // 3. Home - Peringkat
  getRank() {
    return apiClient.get('/rank/1?lang=in');
  },

  // 4. Home - Kategori (UPDATE: Menerima genreId dan sortType)
  // genreId: 1357 (Semua), sort: 1 (Populer), 2 (Terbaru)
  getCategory(genreId = 1357, sort = 1) {
    return apiClient.get(`/classify?lang=in&pageNo=1&genre=${genreId}&sort=${sort}`);
  },

  // 5. Detail Drama
  getDetail(bookId) {
    return apiClient.get(`/chapters/detail/${bookId}?lang=in`);
  },
  // 6. Daftar Episode
  getChapters(bookId) {
    return apiClient.get(`/chapters/${bookId}?lang=in`);
  },
  // 7. Link Streaming
  getStreamUrl(bookId, chapterIndex) {
    return apiClient.get(`/watch/${bookId}/${chapterIndex}?lang=in&source=search_result`);
  },

  search(keyword) {
    return apiClient.get(`/search/${keyword}/1?lang=in`);
  },
  getSuggest(keyword) {
    return apiClient.get(`/suggest/${keyword}?lang=in`);
  }
};
