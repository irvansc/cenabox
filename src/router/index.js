import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth' // Import store
import HomeView from '../views/HomeView.vue'
import PlayerView from '../views/PlayerView.vue'
import LoginView from '../views/LoginView.vue'
import AdminLogin from '../views/admin/AdminLogin.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import ShortsView from '../views/ShortsView.vue'
import ProfileView from '../views/ProfileView.vue'
import AdsManager from '../views/admin/AdsManager.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import MyListView from '../views/MyListView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    // Halaman Login User Biasa
    { path: '/login', name: 'login', component: LoginView },
    // Halaman Player (Wajib Login)
    {
      path: '/player/:bookId/:chapterIndex',
      name: 'player',
      component: PlayerView,
      meta: { requiresAuth: true }
    },
    // Admin Login
    { path: '/admin/login', name: 'admin-login', component: AdminLogin },
   {
      path: '/admin',
      component: AdminLayout, // Parent menggunakan Layout
      children: [
        {
          path: 'dashboard', // url jadi /admin/dashboard
          component: AdminDashboard
        },
        {
          path: 'ads',      // url jadi /admin/ads
          component: AdsManager
        }
      ],
      meta: { requiresAdmin: true } // Proteksi (Opsional)
    },
    // Rute Callback untuk Google Auth (Penting!)
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: {
        template: '<div class="text-white text-center mt-20">Memproses Login...</div>',
        mounted() {
           // Supabase otomatis menangani hash URL, kita tinggal redirect ke home/player
           this.$router.push('/');
        }
      }
    },
    {
      path: '/shorts',
      name: 'shorts',
      component: ShortsView
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/mylist',
      name: 'mylist',
      component: MyListView,
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  // Pastikan sesi sudah dimuat sebelum cek
  if (!authStore.session) await authStore.initialize();

  const currentUser = authStore.user;

  // 1. Cek User Biasa (Player)
  if (to.meta.requiresAuth && !currentUser) {
    return next('/login');
  }

  // 2. Cek Admin
  if (to.meta.requiresAdmin) {
    if (!currentUser) return next('/admin/login');
    // Opsional: Cek email admin spesifik agar user biasa tidak bisa masuk dashboard
    // if (currentUser.email !== 'admin@cenabox.com') return next('/');
  }

  // 3. Jika sudah login, jangan boleh masuk halaman login lagi
  if ((to.path === '/login' || to.path === '/admin/login') && currentUser) {
     return next('/');
  }

  next();
});

export default router
