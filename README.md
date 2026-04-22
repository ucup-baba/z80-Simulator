# Z-80 Simulator Core Logic

Simulator Z-80 berbasis web yang modern dan interaktif. Proyek ini bertujuan untuk menyediakan lingkungan simulasi mikroprosesor Zilog Z80 yang mudah digunakan untuk keperluan edukasi, pembelajaran bahasa assembly, dan pengujian program. 

Desain UI asli tersedia di: [Figma Design](https://www.figma.com/design/5uZuGEoEqAEA5LwultZoLK/Z-80-Simulator-Core-Logic)

## 📌 Deskripsi dan Kegunaan
Z-80 Simulator adalah perangkat lunak berbasis web yang memungkinkan pengguna untuk menulis, meng-compile (assemble), dan menjalankan kode bahasa mesin Z80 langsung dari browser.

**Kegunaan Utama:**
- **Edukasi:** Membantu mahasiswa teknik elektro, ilmu komputer, dan antusias *retro computing* untuk mempelajari arsitektur mikroprosesor dan bahasa assembly secara visual.
- **Debugging & Eksekusi:** Fitur *step-by-step execution* memungkinkan pengguna memantau perubahan pada Register, Flag, dan Memori secara real-time.
- **Aksesibilitas Tinggi:** Berbeda dengan simulator klasik (seperti OshonSoft) yang harus diinstal di OS tertentu (Windows), simulator ini berbasis web (PWA) sehingga bisa diakses dari perangkat apapun (PC, Mac, Linux, maupun Tablet) tanpa perlu instalasi rumit.

## 🛠️ Teknologi yang Digunakan (Tech Stack)

### Front-End
- **Bahasa Pemrograman:** TypeScript dan JavaScript (ES6+), HTML5, CSS3.
- **Framework Utama:** **React.js (v18)** dipadukan dengan **Vite** sebagai *build tool* agar performa *Hot Module Replacement* (HMR) dan *build* sangat cepat.
- **Styling & Komponen UI:** Menggunakan **Tailwind CSS** untuk *utility-first styling* yang fleksibel, serta kumpulan komponen siap pakai dari **Radix UI** dan **Material UI (MUI)** untuk menghadirkan tampilan modern, dapat diakses (accessible), dan interaktif.
- **State Management:** **Zustand** digunakan untuk mengelola *state* global simulator (seperti nilai register CPU, memori, dan status eksekusi) secara efisien tanpa boilerplate yang berlebihan.

### Back-End & Layanan (BaaS)
- **Platform:** **Firebase** (oleh Google). Proyek ini menggunakan arsitektur *Serverless*.
- **Database:** **Firestore** digunakan untuk menyimpan data pengguna secara real-time di cloud.
- **PWA (Progressive Web App):** Didukung oleh `vite-plugin-pwa` sehingga aplikasi bisa diinstal layaknya aplikasi *native* di perangkat pengguna dan mendukung mode *offline*.

## 🔐 Sistem Login dan Autentikasi
Aplikasi ini menggunakan **Firebase Authentication** untuk mengelola sesi dan pendaftaran pengguna.
- **Metode Login:** Dikonfigurasi secara utama untuk mendukung **Google Sign-In** (OAuth). Pengguna dapat masuk hanya dengan satu klik menggunakan akun Google mereka.
- **Keamanan:** Dengan menggunakan Firebase, kredensial pengguna diproses secara aman oleh server otorisasi Google. Aplikasi tidak menyimpan kata sandi pengguna secara langsung, melainkan menggunakan sistem *token* yang terenkripsi dan otomatis diperbarui (secure token-based auth).

## 💡 Mengapa Memilih Bahasa & Teknologi Ini?
1. **React + TypeScript:** Simulasi komponen internal CPU (seperti Program Counter, Stack Pointer, dan manipulasi *bits* memori) membutuhkan sistem *state* yang sangat dinamis. React merender ulang perubahan UI secara sangat efisien. Di sisi lain, TypeScript mencegah *bug* fatal (misal: salah memanipulasi tipe data angka 8-bit menjadi string) melalui pengecekan tipe (Type-Checking) yang ketat pada saat *compile*.
2. **Vite:** Jauh lebih ringan dan cepat dibandingkan bundler tradisional seperti Webpack. Mempercepat proses iterasi bagi developer.
3. **Firebase:** Membebaskan developer dari keharusan membangun dan memelihara server backend, API, dan database dari nol. Firebase menyediakan Autentikasi instan yang aman dan Database (Firestore) untuk menyimpan *source code* milik pengguna di cloud.
4. **Tailwind + Radix/MUI:** Menggantikan desain kaku dari simulator era 90-an/2000-an dengan antarmuka pengguna (UI/UX) yang minimalis, modern, responsif, dan disukai pengguna masa kini.

---

## 🚀 Cara Menjalankan Proyek (Local Development)

Pastikan Anda telah menginstal **Node.js** di perangkat Anda.

1. **Install Dependencies**
   Buka terminal di direktori proyek dan jalankan perintah berikut untuk menginstal semua modul yang dibutuhkan:
   ```bash
   npm install
   ```

2. **Jalankan Development Server**
   Mulai server pengembangan lokal menggunakan Vite:
   ```bash
   npm run dev
   ```

3. **Akses Aplikasi**
   Buka browser dan kunjungi URL lokal yang diberikan (biasanya `http://localhost:5173`).