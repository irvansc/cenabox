import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase' // PASTIKAN PATH INI BENAR (sesuaikan dengan file supabase.js Anda)

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
import MaintenanceView from '../views/MaintenanceView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/player/:bookId/:chapterIndex',
      name: 'player',
      component: PlayerView,
      meta: { requiresAuth: true }
    },
    { path: '/admin/login', name: 'admin-login', component: AdminLogin },
    {
      path: '/admin',
      component: AdminLayout,
      children: [
        { path: 'dashboard', component: AdminDashboard },
        { path: 'ads', component: AdsManager }
      ],
      meta: { requiresAdmin: true }
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: {
        template: '<div class="text-white text-center mt-20">Memproses Login...</div>',
        mounted() { this.$router.push('/'); }
      }
    },
    { path: '/shorts', name: 'shorts', component: ShortsView },
    { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
    { path: '/mylist', name: 'mylist', component: MyListView, meta: { requiresAuth: true } },
    // RUTE MAINTENANCE
    { path: '/maintenance', name: 'maintenance', component: MaintenanceView }
  ]
})

// --- GLOBAL GUARD (SATPAM) ---
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // 1. CEK MAINTENANCE MODE (Paling Prioritas)
  // Jangan cek jika user mau ke halaman Admin atau halaman Maintenance itu sendiri
  if (!to.path.startsWith('/admin') && to.path !== '/maintenance') {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('maintenance_mode')
        .eq('id', 1)
        .single();

      // Jika Mode Maintenance AKTIF -> Lempar ke halaman maintenance
      if (data && data.maintenance_mode === true) {
        return next('/maintenance');
      }
    } catch (err) {
      console.error('Gagal cek maintenance:', err);
    }
  }

  // 2. Inisialisasi Auth
  if (!authStore.session) await authStore.initialize();
  const currentUser = authStore.user;

  // 3. Cek User Biasa (Butuh Login)
  if (to.meta.requiresAuth && !currentUser) {
    return next('/login');
  }

  // 4. Cek Admin
  if (to.meta.requiresAdmin) {
    if (!currentUser) return next('/admin/login');
  }

  // 5. Redirect Login Page jika sudah login
  if ((to.path === '/login' || to.path === '/admin/login') && currentUser) {
     return next('/');
  }

  next();
});

export default router
