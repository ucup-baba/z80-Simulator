# Checklist Self-Review Web Simulator Z-80
> Gunakan file ini untuk memverifikasi kesesuaian implementasi di z80-simulation.web.app  
> dengan butir-butir instrumen sebelum validasi resmi.  
> Tandai `[x]` jika sudah sesuai, `[ ]` jika belum, `[~]` jika perlu perbaikan.

---

## 1. INSTRUMEN VALIDASI AHLI MATERI (14 Butir)

### Aspek 1: Kesesuaian Materi
- [ ] **Butir 1** — Materi mencakup instruksi dasar Z-80 (transfer data, aritmatika, logika, percabangan, stack) sesuai RPS Pertemuan 1–5
  - Cek: Apakah LD, ADD, SUB, AND, OR, XOR, JP, JR, DJNZ, CALL, RET, PUSH, POP, HALT tersedia?
- [ ] **Butir 2** — Urutan penyajian Panel Materi Dasar sistematis (register → pengalamatan → stack/subrutin)
  - Cek: Buka Panel Materi, lihat urutan topik sudah runtut?
- [ ] **Butir 3** — Pembatasan cakupan (tidak mencakup interfacing ASCII, seven-segment, PPI 8255, PIO Z-80) sudah tepat
  - Cek: Tidak ada instruksi I/O atau peripheral di simulator?

### Aspek 2: Kebenaran Isi
- [ ] **Butir 4** — Deskripsi fungsi instruksi (LD, PUSH, POP, ADD, SUB, INC, DEC, CP, AND, OR, XOR, JP, JR, DJNZ, CALL, RET, HALT) tepat sesuai Zilog Z-80 CPU User Manual
  - Cek: Bandingkan penjelasan Panel Materi dengan datasheet Z-80
- [ ] **Butir 5** — Perubahan register (A, B, C, D, E, H, L, F) saat eksekusi sesuai perilaku nyata Z-80
  - Cek: Jalankan `LD A, 05H` → apakah A berubah jadi 05? Jalankan `ADD A, B` → apakah A = A+B?
- [ ] **Butir 6** — Mekanisme stack (SP berkurang saat PUSH, bertambah saat POP) sesuai arsitektur Z-80
  - Cek: Jalankan `PUSH BC` → apakah SP berkurang 2? Jalankan `POP BC` → SP bertambah 2?

### Aspek 3: Kedalaman Materi
- [ ] **Butir 7** — Penjelasan tiap instruksi mencakup sintaks, fungsi, efek terhadap register, dan contoh penggunaan
  - Cek: Buka Panel Materi untuk instruksi LD, ADD, JP — apakah ada sintaks + contoh + efek flag?
- [ ] **Butir 8** — Contoh program mencakup variasi mode pengalamatan (langsung, tidak langsung, register)
  - Cek: Ada contoh `LD A, 05H` (langsung), `LD A, (HL)` (tidak langsung), `LD A, B` (register)?
- [ ] **Butir 9** — Materi stack, subrutin (CALL/RET), dan flag register (Zero, Carry, Sign) memadai untuk semester 3
  - Cek: Apakah ada penjelasan kapan flag Z, C, S aktif? Ada contoh CALL dan RET?

### Aspek 4: Aspek Pembelajaran
- [ ] **Butir 10** — Panel Materi Dasar terintegrasi sehingga mahasiswa tidak perlu buka referensi eksternal
  - Cek: Apakah semua instruksi yang diujikan ada penjelasannya di dalam aplikasi?
- [ ] **Butir 11** — Fitur step-by-step mendorong mahasiswa bereksperimen aktif mengamati register dan memori
  - Cek: Tombol Step tersedia dan berfungsi? Register/memori update per satu instruksi?
- [ ] **Butir 12** — Umpan balik Engine Linter (error, warning, tips) dan AI Deep Scan relevan untuk Assembly Z-80
  - Cek: Tulis kode salah → apakah Linter mendeteksi? Coba AI Deep Scan → apakah penjelasannya relevan?

### Aspek 5: Bahasa
- [ ] **Butir 13** — Penjelasan instruksi Z-80 di Panel Materi menggunakan bahasa jelas dan sesuai level semester 3
  - Cek: Baca 3–5 penjelasan instruksi — apakah mudah dipahami tanpa background teknis tinggi?
- [ ] **Butir 14** — Istilah teknis (accumulator, register pair, stack pointer, program counter, flag register, mode pengalamatan) tepat dan konsisten
  - Cek: Cari istilah-istilah ini di seluruh aplikasi — konsisten atau ada yang berbeda-beda?

---

## 2. INSTRUMEN VALIDASI AHLI MEDIA (16 Butir)

### Aspek 1: Tampilan
- [ ] **Butir 1** — Desain antarmuka (layout, warna, tipografi) konsisten dan estetis
  - Cek: Apakah font, warna, dan spacing konsisten di semua halaman/panel?
- [ ] **Butir 2** — Tata letak komponen utama (editor, tombol eksekusi, panel register/memori, panduan materi, AI Analyzer) logis
  - Cek: Apakah alur dari kiri ke kanan / atas ke bawah terasa natural?
- [ ] **Butir 3** — Ikon dan label tombol jelas dan intuitif tanpa penjelasan tambahan
  - Cek: Apakah tombol Run, Step, Reset, Load jelas fungsinya hanya dari ikon/label?
- [ ] **Butir 4** — Ukuran dan kontras teks memadai untuk keterbacaan nyaman
  - Cek: Baca teks editor dan panel materi — apakah cukup besar dan kontras dengan background?

### Aspek 2: Pemrograman
- [ ] **Butir 5** — Fungsi simulator (step-by-step dan run langsung) stabil dan konsisten
  - Cek: Jalankan program 10+ instruksi step-by-step — apakah tidak ada crash atau hasil aneh?
- [ ] **Butir 6** — Visualisasi register (A, B, C, D, E, H, L, F) dan memori update real-time dan akurat
  - Cek: Bandingkan nilai register di UI dengan perhitungan manual setelah beberapa instruksi
- [ ] **Butir 7** — Fitur AI Analyzer (Engine Linter dan AI Deep Scan) berfungsi benar dan output relevan
  - Cek: Linter aktif otomatis? AI Deep Scan terpanggil saat diminta? Output dalam Bahasa Indonesia?

### Aspek 3: Kemudahan Penggunaan
- [ ] **Butir 8** — Pengguna baru dapat memahami alur tanpa panduan eksternal
  - Cek: Minta orang lain yang belum pernah pakai untuk mencoba — bisa mulai tanpa kebingungan?
- [ ] **Butir 9** — Navigasi antar fitur (editor, simulator, panduan materi, AI Analyzer) mudah
  - Cek: Apakah berpindah antar panel/tab terasa mulus tanpa perlu scroll panjang?
- [ ] **Butir 10** — Pesan error sistem informatif dan mudah dipahami
  - Cek: Sengaja tulis kode salah — apakah pesan errornya jelas dan membantu?

### Aspek 4: Kualitas Teknis
- [ ] **Butir 11** — Media dapat diakses lancar pada koneksi internet standar
  - Cek: Buka https://z80-simulation.web.app di koneksi normal — apakah loading cepat?
- [ ] **Butir 12** — Waktu respons aplikasi (loading, eksekusi, analisis AI) tidak mengganggu
  - Cek: Ukur kira-kira berapa detik loading, eksekusi 20 instruksi, dan AI Deep Scan?
- [ ] **Butir 13** — Tidak ada bug berulang yang mengganggu fungsi utama
  - Cek: Coba skenario: tulis → run → reset → tulis ulang → run lagi, minimal 3 kali — konsisten?

### Aspek 5: Aksesibilitas
- [ ] **Butir 14** — Media optimal di perangkat komputer berbagai resolusi layar
  - Cek: Coba di resolusi 1920×1080, 1366×768, dan 1280×720 — layout masih rapi?
- [ ] **Butir 15** — Media optimal di perangkat mobile (smartphone/tablet)
  - Cek: Buka di HP — apakah editor bisa diketik, tombol bisa diklik, panel terbaca?
- [ ] **Butir 16** — Media dapat diakses di berbagai peramban modern (Chrome, Firefox, Edge, Safari)
  - Cek: Test di minimal Chrome dan Firefox — fungsi utama berjalan normal?

---

## 3. INSTRUMEN RESPONS MAHASISWA (15 Butir)
> Bagian ini untuk referensi saja — pastikan fitur yang ditanyakan sudah tersedia

### Aspek 1: Kemudahan Penggunaan
- [ ] **Butir 1** — Akses tanpa instalasi berfungsi (langsung dari browser)
- [ ] **Butir 2** — Tombol dan menu mudah dipahami
- [ ] **Butir 3** — Alur penggunaan (baca materi → tulis kode → run → analisis) jelas

### Aspek 2: Tampilan
- [ ] **Butir 4** — Tampilan menarik dan nyaman
- [ ] **Butir 5** — Teks dan ikon mudah dibaca
- [ ] **Butir 6** — Responsif di komputer dan smartphone

### Aspek 3: Kebermanfaatan
- [ ] **Butir 7** — Eksekusi instruksi Z-80 dapat dipahami step-by-step
- [ ] **Butir 8** — Visualisasi register real-time tersedia dan akurat
- [ ] **Butir 9** — Visualisasi memori real-time tersedia dan akurat

### Aspek 4: Materi
- [ ] **Butir 10** — Panel Materi Dasar tersedia dan lengkap
- [ ] **Butir 11** — Bahasa penjelasan jelas dan tidak membingungkan
- [ ] **Butir 12** — Materi mencukupi untuk kebutuhan praktikum

### Aspek 5: Kemandirian Belajar
- [ ] **Butir 13** — Engine Linter aktif dan membantu menemukan kesalahan kode
- [ ] **Butir 14** — AI Deep Scan tersedia dan memberikan penjelasan mendalam
- [ ] **Butir 15** — Media dapat diakses kapan saja dan di mana saja (PWA/web)

---

## 4. INSTRUMEN RESPONS DOSEN PENGAMPU (12 Butir)
> Bagian ini untuk referensi saja

### Aspek 1: Kesesuaian dengan Pembelajaran
- [ ] **Butir 1** — Materi sesuai RPS Sistem Mikroprosesor
- [ ] **Butir 2** — Dapat digunakan sebagai suplemen praktikum
- [ ] **Butir 3** — Fitur AI Analyzer sesuai kebutuhan debugging Assembly Z-80
- [ ] **Butir 4** — Tingkat kompleksitas sesuai kompetensi target

### Aspek 2: Kebermanfaatan Pedagogis
- [ ] **Butir 5** — Membantu visualisasi konsep abstrak (register, stack, flag)
- [ ] **Butir 6** — Mengurangi ketergantungan bimbingan real-time untuk masalah dasar
- [ ] **Butir 7** — AI Analyzer mendorong kemandirian, bukan ketergantungan
- [ ] **Butir 8** — Meningkatkan kesiapan mahasiswa sebelum praktikum

### Aspek 3: Kelayakan Penggunaan
- [ ] **Butir 9** — Layak sebagai media pendukung pembelajaran mandiri
- [ ] **Butir 10** — Dapat direkomendasikan untuk persiapan praktikum/ujian
- [ ] **Butir 11** — Kualitas memadai untuk konteks perguruan tinggi
- [ ] **Butir 12** — Dapat digunakan bersama metode pembelajaran yang sudah ada

---

## Ringkasan Status

| Instrumen | Total Butir | Sudah ✅ | Perlu Perbaikan 🔧 | Belum ❌ |
|---|---|---|---|---|
| Ahli Materi | 14 | | | |
| Ahli Media | 16 | | | |
| Respons Mahasiswa | 15 | | | |
| Respons Dosen | 12 | | | |
| **Total** | **57** | | | |

---

## Catatan Perbaikan

> Tulis di sini temuan yang perlu diperbaiki sebelum validasi:

- [ ] ...
- [ ] ...
- [ ] ...

---

*Self-review dilakukan oleh: Yusuf Syaifulloh — sebelum validasi resmi*  
*Tanggal review: _______________*
