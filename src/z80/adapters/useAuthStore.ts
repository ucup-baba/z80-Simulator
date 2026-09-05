import { create } from 'zustand';
import {
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';

interface AuthStore {
  /**
   * Pengguna yang login Google. Tetap null untuk sesi anonim, supaya
   * tombol Login/Logout di UI berperilaku seperti sebelumnya.
   */
  user: User | null;
  /**
   * uid yang sedang aktif — anonim maupun Google. Dipakai sebagai pemilik
   * dokumen saat menulis ke Firestore.
   */
  uid: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  uid: null,
  loading: true,

  loginWithGoogle: async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      // Listener di bawah akan otomatis membuat sesi anonim penggantinya.
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
}));

/**
 * Memastikan selalu ada identitas yang menempel pada sesi ini.
 *
 * Validator (sebagian dosen senior) tidak perlu login untuk mengisi
 * instrumen, tetapi aturan Firestore mensyaratkan sebuah uid agar data
 * pribadi mereka tidak bisa dibaca atau ditimpa orang lain. Sesi anonim
 * memenuhi keduanya: pengisi tidak merasakan langkah tambahan apa pun.
 */
onAuthStateChanged(auth, (firebaseUser) => {
  if (!firebaseUser) {
    useAuthStore.setState({ user: null, uid: null, loading: false });
    signInAnonymously(auth).catch((error) => {
      console.error('Anonymous auth error:', error);
    });
    return;
  }

  useAuthStore.setState({
    user: firebaseUser.isAnonymous ? null : firebaseUser,
    uid: firebaseUser.uid,
    loading: false,
  });
});

/**
 * Mengembalikan uid yang siap dipakai untuk menulis, menunggu sesi anonim
 * terbentuk bila autentikasi belum selesai saat pengguna menekan Kirim.
 */
export async function ensureUid(): Promise<string> {
  if (auth.currentUser) return auth.currentUser.uid;
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}
