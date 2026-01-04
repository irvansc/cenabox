import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '../lib/supabase';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const session = ref(null);
  const router = useRouter();

  // Cek sesi saat aplikasi dimuat
  const initialize = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      session.value = data.session;
      user.value = data.session.user;
    }

    // Listener perubahan auth (login/logout)
    supabase.auth.onAuthStateChange((_event, _session) => {
      session.value = _session;
      user.value = _session ? _session.user : null;
    });
  };

  // Login User via Google
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback' // Kita akan buat rute ini nanti
      }
    });
    if (error) throw error;
  };

  // Login Admin via Email/Password
  const loginAdmin = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    // Opsional: Cek apakah email benar-benar admin jika perlu logic tambahan
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    user.value = null;
    session.value = null;
    // router.push('/'); // Redirect manual dilakukan di komponen saja
  };

  return { user, session, initialize, loginWithGoogle, loginAdmin, logout };
});
