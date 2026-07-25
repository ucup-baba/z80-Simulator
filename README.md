# Z-80 Simulator Core Logic

> Simulator mikroprosesor Zilog Z-80 berbasis web dengan dukungan **AI Adaptive Feedback** dua tahap (Linter Internal + Gemini Deep Scan), dirancang sebagai media pembelajaran mata kuliah Sistem Mikroprosesor.

---

## 📑 Daftar Isi

1. [Identitas Produk](#1-identitas-produk)
2. [Latar Belakang Pengembangan](#2-latar-belakang-pengembangan)
3. [Fitur Utama](#3-fitur-utama)
4. [Arsitektur Aplikasi](#4-arsitektur-aplikasi)
5. [Tumpukan Teknologi (Tech Stack)](#5-tumpukan-teknologi-tech-stack)
6. [Struktur Folder Proyek](#6-struktur-folder-proyek)
7. [Mode Pengalamatan & Set Instruksi](#7-mode-pengalamatan--set-instruksi-yang-didukung)
8. [Komponen Utama Antarmuka](#8-komponen-utama-antarmuka-ui-components)
9. [Spesifikasi Sistem](#9-spesifikasi-sistem)
10. [Perbandingan dengan Simulator Z-80 Lain](#10-perbandingan-dengan-simulator-z-80-lain)
11. [Cara Instalasi & Menjalankan](#11-cara-instalasi--menjalankan)
12. [Roadmap Pengembangan](#12-roadmap-pengembangan)
13. [Kontribusi & Acknowledgement](#13-kontribusi--acknowledgement)
14. [Lisensi](#14-lisensi)
15. [Kontak](#15-kontak)

---

## 1. Identitas Produk

| Atribut | Keterangan |
|---|---|
| **Nama Lengkap** | Z-80 Simulator Core Logic |
| **Nama Pendek (PWA)** | Z80 Sim |
| **Versi** | 0.0.1 (Pre-Release / Tahap Pengembangan ADDIE: *Development*) |
| **Lisensi** | MIT License (lihat [Bagian 14](#14-lisensi)) |
| **Repositori** | (diisi manual setelah publikasi) |
| **URL Produksi** | https://z80-simulation.web.app *(Firebase Hosting — Project ID: `z80-simulation`)* |
| **Penulis** | *(diisi manual: Nama Mahasiswa, NIM)* |
| **Pembimbing** | *(diisi manual: Nama Pembimbing I & II)* |
| **Afiliasi** | *(diisi manual: Program Studi Pendidikan Teknik Elektro, Fakultas …, Universitas …)* |

### Deskripsi Singkat

**Z-80 Simulator Core Logic** adalah perangkat lunak edukatif berbasis web (*Progressive Web App*) yang mengemulasikan perilaku internal mikroprosesor Zilog Z-80 secara visual dan interaktif. Aplikasi ini memungkinkan pengguna menulis kode bahasa rakitan (*assembly*) Z-80, melakukan *assemble*, lalu mengeksekusinya secara penuh maupun langkah per langkah (*step-by-step*) langsung di dalam peramban tanpa perlu instalasi *toolchain* tradisional.

Berbeda dengan simulator Z-80 generasi terdahulu yang berbentuk aplikasi *desktop* dengan keterbatasan platform, simulator ini dirancang lintas platform (*cross-platform*) dan dilengkapi dengan **Engine AI Adaptive Feedback dua tahap**: (1) *linter* berbasis aturan statis untuk umpan balik instan, dan (2) *deep-scan* berbasis Google Gemini API untuk analisis pedagogis kontekstual. Pendekatan ini ditujukan untuk mendukung pembelajaran mandiri (*self-paced learning*) mahasiswa Pendidikan Teknik Elektro pada mata kuliah Sistem Mikroprosesor.

---

## 2. Latar Belakang Pengembangan

### 2.1. Permasalahan yang Ingin Dipecahkan

1. **Hambatan Aksesibilitas Simulator Klasik** — Simulator referensi seperti *Oshonsoft Z80 Simulator IDE* hanya berjalan di sistem operasi Windows dan memerlukan instalasi *executable*. Hal ini menyulitkan mahasiswa pengguna macOS, Linux, ataupun perangkat *tablet* dalam praktikum.
2. **Kurangnya Umpan Balik Pedagogis** — Simulator komersial umumnya hanya melaporkan *syntax error*. Mahasiswa pemula sering kesulitan mendiagnosis kesalahan logika seperti *infinite loop*, *register misuse*, *stack imbalance*, atau *dead code* tanpa pendampingan dosen secara langsung.
3. **Antarmuka Era 90-an** — Tampilan simulator referensi cenderung statis, tidak responsif, dan tidak ramah perangkat layar sentuh, sehingga mengurangi minat belajar generasi mahasiswa saat ini.
4. **Tidak Adanya Lapisan Verifikasi Hardware** — Banyak simulator menerima sintaks ilegal pada arsitektur Z-80 fisik (mis. `IN HL`, `LD (HL),(DE)`, `PUSH A`, `ADD A, HL`) tanpa peringatan, sehingga mahasiswa membentuk model mental yang keliru terhadap batasan ALU 8-bit dan struktur stack 16-bit.

### 2.2. Tujuan Pengembangan

1. Menyediakan simulator Z-80 berbasis web yang **dapat diakses tanpa instalasi** dan kompatibel dengan perangkat apapun yang memiliki peramban modern.
2. Mengintegrasikan **AI Adaptive Feedback Engine** untuk memberikan umpan balik formatif yang kontekstual, sehingga mendukung kemandirian belajar.
3. Mereplikasi **fitur paritas penuh** (*100% feature parity*) dengan simulator komersial referensi (Oshonsoft) di sisi inti emulasi.
4. Memberikan **lapisan validasi hardware (Rule 8: Hardware Compatibility)** untuk menolak kombinasi instruksi yang ilegal pada CPU Z-80 fisik, mendekatkan model mental mahasiswa ke arsitektur sebenarnya.
5. Mempermudah **dokumentasi dan penelitian** model pengembangan ADDIE pada media pembelajaran berbasis simulasi mikroprosesor.

### 2.3. Target Pengguna

- **Pengguna Utama:** Mahasiswa Program Studi Pendidikan Teknik Elektro yang menempuh mata kuliah **Sistem Mikroprosesor** atau matakuliah sejenis.
- **Pengguna Sekunder:**
  - Dosen pengampu mata kuliah pemrograman bahasa rakitan untuk demonstrasi di kelas.
  - Mahasiswa Teknik Komputer / Ilmu Komputer yang mempelajari arsitektur prosesor *retro*.
  - Antusias *retro computing* dan *hobbyist* komputer 8-bit.

---

## 3. Fitur Utama

### A. Editor Kode Assembly Z-80

Komponen [`CodeEditor.tsx`](src/z80/presentation/CodeEditor.tsx) menyediakan editor teks dengan kemampuan profesional sebagai berikut:

#### A.1. Syntax Highlighting (Penyorotan Sintaks)
Implementasi *highlighting* dilakukan secara *runtime* dengan dua palet warna (mode terang & gelap):

| Elemen Sintaks | Warna (Dark Mode) | Warna (Light Mode) | Contoh |
|---|---|---|---|
| **Mnemonic** (instruksi) | Biru (`#569CD6`) — *bold* | Biru (`#0000FF`) | `LD`, `ADD`, `JP`, `HALT` |
| **Register** | Cyan / Teal (`#4EC9B0`) | Hijau gelap (`#267f99`) | `A`, `HL`, `IX`, `BC'` |
| **Bilangan Heksadesimal** | Hijau muda (`#B5CEA8`) | Hijau (`#098658`) | `42H`, `0xFF` |
| **Label** | Kuning pucat (`#DCDCAA`) | Coklat (`#795E26`) | `loop:`, `start:` |
| **Komentar** | Hijau (`#6A9955`) — *italic* | Hijau (`#008000`) | `; komentar` |

#### A.2. Auto-Completion (Pelengkapan Otomatis)
Komponen [`Autocomplete.tsx`](src/z80/presentation/Autocomplete.tsx) menyajikan saran *mnemonic* dan register saat pengguna mengetik. Pemicunya adalah pencocokan prefiks pada kata terakhir di posisi kursor.

#### A.3. Line Numbering & Breakpoint
- **Penomoran baris** ditampilkan pada *gutter* kiri editor.
- **Klik nomor baris** untuk menambah/menghapus *breakpoint* (eksekusi akan berhenti di baris bertanda) — fitur aktif saat eksekusi *Run*.

#### A.4. Tooltip Instruksi
*Hover* pada mnemonic akan menampilkan dokumentasi singkat dari [`z80InstructionDocs.ts`](src/z80/presentation/z80InstructionDocs.ts), berisi sintaks lengkap, deskripsi, dan flag yang dipengaruhi.

#### A.5. Multi-File Tabs & Undo/Redo
- Mendukung **banyak berkas** (multi-tab) dengan persistensi otomatis ke `localStorage` (kunci: `z80-file-tabs`, `z80-active-file`).
- Riwayat undo/redo terbatas hingga **100 langkah** dengan *debounce* 500 ms (lihat [App.tsx:39-85](src/app/App.tsx#L39-L85)).

#### A.6. Format Kode yang Didukung
- Heksadesimal sufiks `H` (gaya Zilog): `LD A, FFH`
- Heksadesimal prefiks `0x` (gaya C): `LD A, 0xFF`
- Desimal: `LD A, 255`
- Komentar: `;` hingga akhir baris
- Label: `nama_label:` di awal baris

#### A.7. Ukuran Maksimal Kode
Tidak ada batas keras pada jumlah baris kode. Batasan *praktis* berasal dari ukuran memori target Z-80 (**64 KB**) dan kapasitas riwayat undo (100 entri).

---

### B. Engine Eksekusi Z-80

Engine emulasi diimplementasikan murni di [`src/z80/usecases/`](src/z80/usecases/) dengan arsitektur *Clean Architecture* (lihat [Bagian 4](#4-arsitektur-aplikasi)).

#### B.1. Set Instruksi yang Didukung

Kode mengenali **lebih dari 90 mnemonic Z-80** (lihat [`types.ts`](src/z80/domain/types.ts)) yang dikelompokkan ke dalam **13 kategori**:

| Kategori | Mnemonic |
|---|---|
| 1. Transfer Data | `LD` |
| 2. Aritmetika | `ADD`, `ADC`, `SUB`, `SBC`, `CP`, `INC`, `DEC` |
| 3. Logika Boolean | `AND`, `OR`, `XOR`, `CPL`, `NEG` |
| 4. Manipulasi Carry | `SCF`, `CCF` |
| 5. Rotasi & Geser | `SRL`, `SLA`, `SRA`, `RL`, `RR`, `RLC`, `RRC`, `RLCA`, `RLA`, `RRCA`, `RRA` |
| 6. BCD | `DAA`, `RLD`, `RRD` |
| 7. Manipulasi Bit | `BIT`, `SET`, `RES` |
| 8. Pertukaran (Exchange) | `EX`, `EXX` |
| 9. Block Transfer / Search | `LDI`, `LDIR`, `LDD`, `LDDR`, `CPI`, `CPIR`, `CPD`, `CPDR` |
| 10. Lompatan (Jump) | `JP`, `JR`, `DJNZ` + 8 varian kondisional (`NZ/Z/C/NC/P/M/PE/PO`) |
| 11. Subrutin | `CALL` (+8 kondisional), `RET` (+8 kondisional), `RETI`, `RETN`, `RST` |
| 12. Stack | `PUSH`, `POP` |
| 13. I/O & Kontrol | `IN`, `OUT`, `INI/INIR/IND/INDR`, `OUTI/OTIR/OUTD/OTDR`, `DI`, `EI`, `IM`, `NOP`, `HALT` |

#### B.2. Mode Pengalamatan yang Didukung

Sesuai definisi `OperandType` di [`types.ts:49-64`](src/z80/domain/types.ts#L49-L64):

1. **Register 8-bit** — `A`, `B`, `C`, `D`, `E`, `H`, `L`
2. **Register 16-bit** — `PC`, `SP`
3. **Register Pair** — `AF`, `BC`, `DE`, `HL`
4. **Index Register** — `IX`, `IY`
5. **Indirect Pair** — `(HL)`, `(BC)`, `(DE)`
6. **Indirect Address** — `(nn)` direct memory
7. **Indexed IX/IY** — `(IX+d)`, `(IY+d)`
8. **Immediate 8-bit / 16-bit** — `n`, `nn`
9. **Address** — alamat lompatan
10. **Port Immediate** — `(n)` untuk `IN`/`OUT`
11. **Port Register** — `(C)` untuk `IN`/`OUT`
12. **Indirect SP** — `(SP)` untuk `EX (SP), HL/IX/IY`

#### B.3. Memori
- **Ukuran:** 65.536 byte (64 KB) — *full Z-80 address space* `0x0000`–`0xFFFF`.
- **Implementasi:** `Uint8Array(65536)` di [`cpuStateFactory.ts`](src/z80/usecases/cpuStateFactory.ts).
- **Navigasi UI:** 256 halaman × 256 byte/halaman, dengan tombol **Prev/Next** dan input **Jump to address**.

#### B.4. Kontrol Eksekusi
Tersedia melalui [`ControlPanel.tsx`](src/z80/presentation/ControlPanel.tsx):
- ▶️ **Run** — eksekusi penuh hingga `HALT` atau *breakpoint*
- ⏯️ **Step** — eksekusi satu instruksi (fetch–decode–execute)
- ⏸️ **Pause** — menghentikan eksekusi *Run* sementara
- 🔄 **Reset** — mengembalikan CPU ke kondisi awal (semua register `0`, memori dikosongkan)

#### B.5. Pengaturan Kecepatan
*Slider* kecepatan eksekusi 4 tingkat:

| Rentang | Label |
|---|---|
| 1–10 | Slow |
| 11–50 | Normal |
| 51–80 | Fast |
| 81–100 | Turbo |

#### B.6. Penghitung Performa
- **Clock Cycle Counter** — total *T-states* (LD = 7, ADD = 4, JP = 10, dst.)
- **Instructions Counter** — total instruksi yang dieksekusi
- **Last Instruction** — menampilkan *source code* + *output* instruksi terakhir

---

### C. Visualisasi Real-time

Komponen [`RegisterDashboard.tsx`](src/z80/presentation/RegisterDashboard.tsx) menampilkan seluruh keadaan internal CPU secara *real-time* dalam **3-kolom grid**.

#### C.1. Register

| Kelompok | Daftar |
|---|---|
| **Main 8-bit** | A, B, C, D, E, H, L, F |
| **Alternate 8-bit** (shadow) | A', B', C', D', E', H', L', F' |
| **16-bit Pairs** | AF, BC, DE, HL (terhitung otomatis) |
| **16-bit Khusus** | PC (Program Counter), SP (Stack Pointer) |
| **Index** | IX, IY |
| **Special** | I (Interrupt Vector), R (Memory Refresh) |

#### C.2. Flag Register (8 bit)

Ditampilkan untuk **F utama** dan **F' alternatif**:

| Bit | Simbol | Nama | Fungsi |
|---|---|---|---|
| 7 | **SF** | Sign Flag | Set bila bit 7 hasil = 1 |
| 6 | **ZF** | Zero Flag | Set bila hasil = 0 |
| 5 | **YF** | Y Flag (undocumented) | Salinan bit 5 hasil |
| 4 | **HF** | Half-carry Flag | Carry dari bit 3 ke bit 4 |
| 3 | **XF** | X Flag (undocumented) | Salinan bit 3 hasil |
| 2 | **PF** | Parity / Overflow | Parity genap (logika) atau overflow signed (aritmetika) |
| 1 | **NF** | Add/Subtract Flag | 0 = ADD, 1 = SUB |
| 0 | **CF** | Carry Flag | Carry dari bit 7 |

Indikator visual: **lingkaran hijau** = `1`, **abu-abu** = `0`.

#### C.3. Visualisasi Memori
- **Memory Viewer (read-only):** [`MemoryViewer.tsx`](src/z80/presentation/MemoryViewer.tsx) — tampilan *hex dump* 16 byte/baris × 16 baris/halaman, dengan kolom **Address (4-digit hex)**, **Hex values (2-digit)**, dan **ASCII representation**.
- **Memory Editor (read-write):** [`MemoryEditorPanel.tsx`](src/z80/presentation/MemoryEditorPanel.tsx) — *double-click* sel untuk masuk ke mode edit, ketik nilai hex 00–FF, **Enter** untuk simpan, **Esc** untuk batal.

#### C.4. Visualisasi I/O Ports
Tab **Watch** ([`WatchPanel.tsx`](src/z80/presentation/WatchPanel.tsx)) memungkinkan menambah pengamat (*watch*) untuk register maupun alamat memori, lengkap dengan *cycling* format **Hex / Decimal / Binary** saat sel nilai diklik.

#### C.5. Stack Viewer
[`StackViewer.tsx`](src/z80/presentation/StackViewer.tsx) menampilkan isi tumpukan dari posisi `SP` ke atas, sehingga pengguna dapat memvisualisasikan dampak instruksi `PUSH`, `POP`, `CALL`, dan `RET`.

#### C.6. CPU Diagram
[`CPUDiagram.tsx`](src/z80/presentation/CPUDiagram.tsx) menyediakan diagram blok CPU Z-80 (ALU, register file, control unit, bus) sebagai bantuan visual untuk pembelajaran arsitektur.

#### C.7. Posisi Program Counter
PC ditampilkan di tiga lokasi:
- *Header* aplikasi (`PC: 00xxH | Instructions: xx | Cycles: xx`)
- Panel **Main 16-bit registers**
- *Highlight* baris kode aktif di editor saat eksekusi *step*

---

### D. Engine Linter Internal — Tahap 1 AI Analyzer

Diimplementasikan di [`programAnalyzer.ts`](src/z80/usecases/programAnalyzer.ts). Lintner berjalan **secara lokal di sisi klien**, tanpa panggilan jaringan.

#### D.1. Kategorisasi Severity

| Severity | Bobot Skor | Makna |
|---|---|---|
| 🔴 **error** | −25 | Kesalahan kritis (mis. infinite loop, sintaks hardware ilegal) |
| ⚠️ **warning** | −10 | Potensi masalah (mis. stack tidak seimbang) |
| 💭 **info** | −3 | Informasi (mis. dead code, NOP berlebihan) |
| 💡 **tip** | 0 | Saran optimasi (mis. ganti `LD A,0` → `XOR A`) |

#### D.2. Kategori Pesan (`FeedbackCategory`)

7 kategori: `infinite-loop`, `register-misuse`, `dead-code`, `stack-issue`, `efficiency`, `flag-awareness`, `best-practice`.

#### D.3. Aturan-Aturan Linter (8 Rules)

| # | Rule | Deskripsi |
|---|---|---|
| 1 | **Infinite Loop Detection** | Mendeteksi `JP`/`JR` mundur tanpa kondisi keluar; mendeteksi `DJNZ` dengan `INC B` di dalam loop. |
| 2 | **Register Misuse** | Mendeteksi *overwrite* register tanpa pemakaian (mis. `LD A,1` → `LD A,2` berurutan); operasi aritmetika pada `A` yang belum diinisialisasi. |
| 3 | **Dead Code** | Mendeteksi instruksi setelah `HALT`, `JP`, `JR`, atau `RET` yang tidak menjadi target lompatan. |
| 4 | **Stack Issues** | Memvalidasi keseimbangan jumlah `PUSH` vs `POP`. |
| 5 | **Efficiency Suggestions** | Saran optimasi: `LD A,0` → `XOR A`; ≥ 3× `INC` berturut → `ADD`; ≥ 3× `NOP` berturut. |
| 6 | **Flag Awareness** | Mendeteksi `CP` yang hasilnya tidak dipakai oleh `JP`/`JR` kondisional dalam 3 instruksi berikutnya. |
| 7 | **Best Practice** | Memperingatkan program tanpa `HALT` di akhir; program terlalu pendek (≤ 2 instruksi). |
| 8 | **Hardware Compatibility** | Menolak sintaks ilegal Z-80 fisik: `IN`/`OUT` di luar pola `IN A,(n)` / `IN r,(C)` / `OUT (n),A` / `OUT (C),r`; `ADD A, HL` (mismatch ukuran ALU); `PUSH/POP A` (stack 8-bit ilegal); `EX` di luar 4 pola legal; transfer memori-ke-memori `LD (HL),(DE)`. |

#### D.4. Sistem Skor Performa Kode

```
score = 100 − (errors × 25) − (warnings × 10) − (info × 3)
        dibatasi pada rentang [0, 100]
```

Skor ditampilkan sebagai **gauge melingkar** dengan warna gradien:
- 🟢 ≥ 80: Hijau (`#10b981`)
- 🟡 50–79: Kuning (`#f59e0b`)
- 🔴 < 50: Merah (`#ef4444`)

#### D.5. Format Output Linter

Setiap *feedback* berupa objek `AnalysisFeedback`:
```typescript
{
  id: string;
  severity: 'error' | 'warning' | 'info' | 'tip';
  category: FeedbackCategory;
  line: number;          // 1-indexed
  title: string;         // Judul Bahasa Indonesia
  message: string;       // Penjelasan rinci
  suggestion?: string;   // Saran perbaikan (opsional)
}
```

Hasil agregat (`AnalysisResult`) berisi `feedbacks[]`, `score`, dan `summary` naratif.

---

### E. AI Deep Scan dengan Gemini API — Tahap 2 AI Analyzer

Diimplementasikan di [`geminiAnalyzer.ts`](src/z80/usecases/geminiAnalyzer.ts) dan dipicu via tombol **Deep Scan** pada [`AIFeedbackPanel.tsx`](src/z80/presentation/AIFeedbackPanel.tsx).

#### E.1. Model yang Digunakan
Aplikasi mencoba lima model secara berurutan dengan **strategi fallback** (urutan dari terbaru ke tertua):

1. `gemini-flash-latest`  *(default — Gemini Flash terbaru)*
2. `gemini-2.0-flash`
3. `gemini-2.0-pro`
4. `gemini-1.5-pro`
5. `gemini-pro` *(legacy — tanpa `systemInstruction`)*

Library: [`@google/generative-ai`](https://www.npmjs.com/package/@google/generative-ai) v**0.24.1**.

#### E.2. Jenis Analisis
- Verifikasi kebenaran logika program untuk tugas dasar.
- Penjelasan fungsi kode secara umum.
- Identifikasi error fatal dengan rujukan nomor baris.
- Saran perbaikan konkret (maksimal 2 poin).
- Afirmasi positif untuk mendukung pembelajar pemula.

#### E.3. Mekanisme Prompt Engineering

Sistem menggunakan **System Instruction** dengan **4 Aturan Mutlak** (lihat [`geminiAnalyzer.ts:22-35`](src/z80/usecases/geminiAnalyzer.ts#L22-L35)):

1. **Scope Materi:** Hanya membahas instruksi Z-80 dasar (`LD`, `INC`, `DEC`, `DJNZ`, `HALT`, aritmetika/memori dasar). DILARANG membahas LDIR/LDDR, manajemen interupsi, vektor memori, atau mengkritik ketiadaan `ORG 0000H`.
2. **Deteksi Status:** Jika logika sudah benar, awali dengan konfirmasi positif; JANGAN mencari-cari kesalahan.
3. **Gaya Komunikasi:** Langsung dan suportif. DILARANG bergaya Socrates/teka-teki.
4. **Struktur Respons Baku:**
   - **Status:** `[KODE BENAR / TERDAPAT ERROR]`
   - **Penjelasan Singkat** fungsi kode
   - **Catatan** (maks. 2 poin perbaikan konkret)
   - **Penutup** afirmatif

Panjang respons dibatasi **< 150 kata** untuk kasus sederhana.

#### E.4. Kondisi Penggunaan
Disarankan ketika:
- Linter Internal tidak menemukan error tapi program berperilaku tidak sesuai.
- Pengguna ingin penjelasan naratif terhadap fungsi kode.
- Debugging logika kompleks yang tidak tertangkap aturan statis.

#### E.5. Format Output AI
Markdown teks bebas dengan struktur baku (Status–Penjelasan–Catatan–Penutup), dirender ke panel UI.

#### E.6. Konfigurasi API Key
API key dimuat dari variabel lingkungan `VITE_GEMINI_API_KEY` di berkas `.env` di root proyek. Bila tidak diset, panel akan menampilkan peringatan konfigurasi.

---

### F. Panel Materi Dasar

[`MateriDasarPanel.tsx`](src/z80/presentation/MateriDasarPanel.tsx) — panel *floating* (dapat di-*drag* di desktop, *full-screen* di mobile) berisi materi rangkuman.

#### F.1. Struktur Materi (5 Kategori)

| # | Kategori | Cakupan Instruksi |
|---|---|---|
| 1 | **Transfer Data** | `LD dest, src`, `PUSH reg`, `POP reg` |
| 2 | **Operasi Aritmatika** | `ADD`, `SUB`, `INC`, `DEC` |
| 3 | **Operasi Logika** | `AND`, `OR`, `XOR`, `CP` |
| 4 | **Kendali Program** | `JP`, `JR`, `DJNZ`, `CALL`, `RET` |
| 5 | **Penghenti Eksekusi** | `HALT`, `NOP` |

#### F.2. Format Penyajian
- **Teks naratif** Bahasa Indonesia singkat per instruksi.
- **Cuplikan kode** dengan *syntax styling* (`<code>` ber-highlight).
- **Tidak ada gambar/diagram** terpisah dalam panel ini (diagram tersedia di komponen `CPUDiagram`).

#### F.3. Contoh Program & Soal Latihan
- ✅ **Contoh program:** Tersedia melalui tombol **Load Default Program** pada `ControlPanel`.
- ❌ **Soal latihan terstruktur:** *Belum diimplementasikan* (direncanakan pada roadmap fase berikutnya).

---

### G. Sistem Otentikasi & Penyimpanan

#### G.1. Metode Login
- **Google Sign-In (OAuth 2.0)** via Firebase Authentication.
- Implementasi: [`useAuthStore.ts`](src/z80/adapters/useAuthStore.ts) dengan `GoogleAuthProvider`.

#### G.2. Data yang Disimpan
Dokumen Firestore di koleksi `users/{uid}` (lihat [App.tsx:166-210](src/app/App.tsx#L166-L210)):

```typescript
{
  fileTabs: FileTab[],      // daftar berkas kode pengguna
  activeFileId: string,     // ID berkas yang sedang aktif
  updatedAt: serverTimestamp()
}
```

#### G.3. Tempat Penyimpanan
- **Cloud Firestore** (`projectId: z80-simulation`)
- **Lokal:** `localStorage` (kunci `z80-file-tabs`, `z80-active-file`) — sebagai *cache offline*.

#### G.4. Privasi & Keamanan
[`firestore.rules`](firestore.rules) menerapkan **principle of least privilege**:

```javascript
match /users/{userId} {
  allow read, write: if request.auth != null
                     && request.auth.uid == userId;
}
```

Setiap pengguna hanya dapat membaca/menulis dokumennya sendiri. Kredensial (token OAuth) dikelola oleh Firebase SDK; aplikasi **tidak menyimpan kata sandi** secara langsung.

---

### H. Progressive Web App (PWA)

Konfigurasi melalui [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) v**1.2.0** di [`vite.config.ts`](vite.config.ts).

#### H.1. Manifest

```json
{
  "name": "Z-80 Simulator",
  "short_name": "Z80 Sim",
  "description": "Z-80 Assembly Simulator",
  "theme_color": "#18181b",
  "background_color": "#18181b",
  "display": "standalone",
  "icons": [{ "src": "pwa-icon.svg", "sizes": "any",
              "type": "image/svg+xml", "purpose": "any maskable" }]
}
```

#### H.2. Service Worker
- **Strategi registrasi:** `registerType: 'autoUpdate'` — *service worker* otomatis memperbarui ke versi terbaru tanpa intervensi pengguna.
- **Aset yang di-*precache*:** `pwa-icon.svg` + seluruh *bundle* hasil Vite (JS, CSS, HTML).

#### H.3. Kemampuan Offline
- Aset statis (UI, kode JS, ikon) **dapat berjalan offline** setelah kunjungan pertama.
- Fitur cloud sync (Firestore) **memerlukan koneksi internet** untuk sinkronisasi.
- Engine linter internal **berjalan penuh offline** (analisis tidak butuh server).
- AI Deep Scan **memerlukan internet** (panggilan ke Gemini API).

#### H.4. Installable
Komponen [`PwaInstallPrompt.tsx`](src/z80/presentation/PwaInstallPrompt.tsx) menampilkan *snackbar* kustom dengan tombol **Install** ketika peramban memicu *event* `beforeinstallprompt`.

---

## 4. Arsitektur Aplikasi

### 4.1. Diagram Arsitektur

```
┌────────────────────────────────────────────────────────────────────┐
│                    SISI KLIEN (BROWSER / PWA)                      │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  PRESENTATION LAYER (React + Tailwind)       │  │
│  │  CodeEditor · RegisterDashboard · MemoryEditor · WatchPanel  │  │
│  │  ControlPanel · AIFeedbackPanel · MateriDasarPanel · etc.    │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                      │
│  ┌──────────────────────────┴───────────────────────────────────┐  │
│  │                  ADAPTER LAYER (Zustand Stores)              │  │
│  │           useZ80Store      ·       useAuthStore              │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                      │
│  ┌──────────────────────────┴───────────────────────────────────┐  │
│  │                    USE CASES LAYER (Business Logic)          │  │
│  │  cpuExecutor · instructionExecutor · instructionParser       │  │
│  │  aluOperations · cpuStateFactory                             │  │
│  │  programAnalyzer (Tahap 1) · geminiAnalyzer (Tahap 2)        │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                      │
│  ┌──────────────────────────┴───────────────────────────────────┐  │
│  │              DOMAIN LAYER (Pure TypeScript Entities)         │  │
│  │  CPUState · Instruction · Mnemonic · OperandType · Flags     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬───────────────────────────────┘
                                     │  HTTPS
                ┌────────────────────┼──────────────────────┐
                │                    │                      │
                ▼                    ▼                      ▼
       ┌────────────────┐   ┌────────────────┐   ┌──────────────────┐
       │ Firebase Auth  │   │ Cloud Firestore│   │   Gemini API     │
       │ (Google OAuth) │   │ users/{uid}    │   │ generativelangu- │
       │                │   │ docs           │   │ age.googleapis.. │
       └────────────────┘   └────────────────┘   └──────────────────┘
                       SISI SERVER (BaaS — Google Cloud)
```

### 4.2. Pembagian Sisi Klien vs Server

| Aspek | Sisi Klien | Sisi Server (BaaS) |
|---|---|---|
| Emulasi CPU Z-80 | ✅ Murni di klien | — |
| Linter (Tahap 1) | ✅ Lokal | — |
| Editor & UI | ✅ React | — |
| Otentikasi | (Token storage) | ✅ Firebase Auth |
| Cloud sync kode | (Trigger) | ✅ Firestore |
| AI Deep Scan (Tahap 2) | (Request) | ✅ Gemini API |
| Static hosting | — | ✅ Firebase Hosting |

> **Filosofi:** Engine inti (emulasi + linter) dirancang **server-less / offline-first**. Layanan cloud bersifat *opsional* — pengguna anonim tetap dapat menggunakan simulator sepenuhnya.

### 4.3. Pola Desain yang Digunakan

| Pola | Implementasi |
|---|---|
| **Clean Architecture (Onion)** | 4 layer: `domain` → `usecases` → `adapters` → `presentation` (lihat [`ARCHITECTURE.md`](src/z80/ARCHITECTURE.md)) |
| **Dependency Inversion** | Layer `usecases` & `domain` tidak mengenal React/Zustand |
| **Pure Functions** | Operasi ALU bersifat *referentially transparent* |
| **Immutable State** | Setiap eksekusi mengembalikan `CPUState` baru, bukan memutasi |
| **Factory Pattern** | `cpuStateFactory.createCPUState()` |
| **Strategy Pattern** | `instructionExecutor` mendispatch berdasarkan `Mnemonic` |
| **Observer (Reactive)** | Zustand subscriber → React re-render |
| **Adapter Pattern** | `useZ80Store` menjembatani logika murni ↔ React Hooks |

---

## 5. Tumpukan Teknologi (Tech Stack)

### 5.1. Frontend

| Kategori | Library | Versi | Peran |
|---|---|---|---|
| **Framework UI** | [React](https://react.dev) | **18.3.1** | Komponen deklaratif & rekonsiliasi DOM |
| **Build Tool** | [Vite](https://vitejs.dev) | **6.3.5** | Dev server, HMR, *bundling* produksi |
| **Bahasa** | TypeScript | (bawaan Vite) | Type safety pada seluruh `src/` |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) | **4.1.12** | Utility-first CSS |
| **Tailwind plugin** | `@tailwindcss/vite` | 4.1.12 | Integrasi Tailwind v4 dengan Vite |
| **Komponen UI** | shadcn/ui (di-*vendor* di [`src/app/components/ui/`](src/app/components/ui)) | — | 50+ komponen aksesibel |
| **Primitive** | [Radix UI](https://www.radix-ui.com) | berbagai (1.x – 2.2.x) | *Headless* a11y primitives |
| **Komponen MUI** | `@mui/material`, `@mui/icons-material` | **7.3.5** | Komponen Material Design (terbatas) |
| **Emotion** | `@emotion/react`, `@emotion/styled` | 11.14.x | CSS-in-JS untuk MUI |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs) | **5.0.12** | Global state ringan tanpa boilerplate |
| **Ikon** | [Lucide React](https://lucide.dev) | **0.487.0** | Ikon SVG modular |
| **Animasi** | Motion (Framer Motion) | **12.23.24** | Animasi deklaratif |
| **Routing** | `react-router` | **7.13.0** | Routing SPA |
| **Form** | `react-hook-form` | **7.55.0** | Manajemen form |
| **Drag-Drop** | `react-dnd` + HTML5 backend | **16.0.1** | DnD untuk panel resizable |
| **Resizable Panels** | `react-resizable-panels` | **2.1.7** | Split-view |
| **Toast** | `sonner` | **2.0.3** | Notifikasi non-blocking |
| **Charts** | `recharts` | **2.15.2** | Visualisasi grafik (cycle counter) |
| **Tema** | `next-themes` | **0.4.6** | Toggle dark/light mode |
| **Tanggal** | `date-fns` | **3.6.0** | Formatting timestamp |
| **Utilitas Class** | `clsx`, `tailwind-merge`, `class-variance-authority` | terbaru | Komposisi className |

### 5.2. Backend & Cloud

| Layanan | Versi | Peran |
|---|---|---|
| [Firebase SDK](https://firebase.google.com) | **^12.12.0** | Bundle SDK utama |
| Firebase Hosting | (CLI) | Hosting statis di `https://z80-simulation.web.app` |
| Firebase Authentication | (bagian dari SDK) | Google Sign-In |
| Cloud Firestore | (bagian dari SDK) | Penyimpanan dokumen `users/{uid}` |
| Firebase Analytics | (bagian dari SDK) | Telemetri penggunaan (opsional) |
| Cloud Functions | ❌ Tidak digunakan | — |
| [Google Gemini API](https://ai.google.dev) via `@google/generative-ai` | **^0.24.1** | AI Deep Scan |

### 5.3. Tools Pengembangan

| Tools | Peran |
|---|---|
| **pnpm** | Package manager (workspace di [`pnpm-workspace.yaml`](pnpm-workspace.yaml)) |
| **npm** | Alternatif, didukung oleh `package-lock.json` |
| **Git** | Version control |
| **Firebase CLI** | Deploy ke Firebase Hosting |
| **Google Antigravity** | IDE pengembangan (lihat [Bagian 13](#13-kontribusi--acknowledgement)) |
| **Claude Code** | AI coding assistant |
| **Figma** | Desain UI/UX awal — [Figma File](https://www.figma.com/design/5uZuGEoEqAEA5LwultZoLK/Z-80-Simulator-Core-Logic) |

> **Catatan:** Linter (ESLint) dan formatter (Prettier) belum dikonfigurasi sebagai *devDependencies* eksplisit; *type checking* dilakukan oleh `tsc` melalui Vite saat *build*.

---

## 6. Struktur Folder Proyek

```
Z-80-Simulator-Core-Logic/
├── README.md                          # Dokumen ini (akademik)
├── package.json                       # Manifest npm/pnpm
├── pnpm-workspace.yaml                # Konfigurasi workspace pnpm
├── vite.config.ts                     # Konfigurasi Vite + plugin PWA
├── postcss.config.mjs                 # Konfigurasi PostCSS untuk Tailwind v4
├── index.html                         # HTML root SPA
├── firebase.json                      # Konfigurasi hosting & rules Firestore
├── firestore.rules                    # Aturan keamanan Firestore
├── .firebaserc                        # Project alias (z80-simulation)
├── default_shadcn_theme.css           # Tema default shadcn/ui
│
├── ADVANCED_FEATURES.md               # Dokumentasi fitur tab navigation
├── ENHANCED_FEATURES.md               # Dokumentasi flag/register enhancement
├── FULL_64KB_MEMORY.md                # Dokumentasi upgrade memori 64 KB
├── COMPARISON_OSHONSOFT.md            # Perbandingan dengan Oshonsoft
├── PANDUAN_PENGGUNAAN.md              # Panduan pengguna (Bahasa Indonesia)
├── QUICKSTART.md                      # Panduan cepat
├── TUTORIAL_CEPAT.md                  # Tutorial cepat
├── Z80_SIMULATOR_GUIDE.md             # Panduan teknis simulator
├── ATTRIBUTIONS.md                    # Atribusi pihak ketiga
│
├── public/                            # Aset statis (disajikan apa adanya)
│   └── pwa-icon.svg                   # Ikon PWA (mask-able)
│
├── guidelines/                        # Pedoman desain & coding (internal)
│
├── dist/                              # Output build produksi (di-deploy)
│
└── src/                               # Kode sumber utama
    ├── main.tsx                       # Entry point React
    ├── firebase.ts                    # Inisialisasi Firebase SDK
    │
    ├── styles/                        # Stylesheet global
    │
    ├── imports/                       # Aset hasil ekspor Figma
    │
    ├── app/                           # Lapisan APLIKASI (presentation root)
    │   ├── App.tsx                    # Komponen root, layout, tab navigation
    │   └── components/                # Komponen UI generik
    │       ├── ui/                    # 50+ komponen shadcn/ui (vendored)
    │       └── figma/                 # Komponen ekspor Figma
    │
    └── z80/                           # Modul inti emulator (Clean Architecture)
        ├── README.md                  # Dokumentasi modul
        ├── ARCHITECTURE.md            # Penjelasan arsitektur 4-layer
        ├── INSTRUCTION_SET.md         # Referensi set instruksi
        ├── example.ts                 # Contoh penggunaan API
        ├── test.ts                    # Suite uji unit
        ├── index.ts                   # Public API
        │
        ├── domain/                    # LAYER 1 — Entities & Types
        │   ├── types.ts               #   Mnemonic, OperandType, Register*
        │   ├── entities.ts            #   CPUState, Instruction, Memory
        │   └── index.ts
        │
        ├── usecases/                  # LAYER 2 — Business Logic
        │   ├── cpuStateFactory.ts     #   Pabrik CPUState awal
        │   ├── instructionParser.ts   #   Parser assembly → Instruction[]
        │   ├── aluOperations.ts       #   Operasi ALU + flag computation
        │   ├── instructionExecutor.ts #   Eksekusi 1 instruksi
        │   ├── cpuExecutor.ts         #   Orkestrasi fetch–decode–execute
        │   ├── programAnalyzer.ts     #   Linter Tahap 1 (8 rules)
        │   ├── geminiAnalyzer.ts      #   AI Deep Scan Tahap 2
        │   └── index.ts
        │
        ├── adapters/                  # LAYER 3 — State Adapter (Zustand)
        │   ├── useZ80Store.ts         #   Store CPU + program + log
        │   └── useAuthStore.ts        #   Store sesi pengguna
        │
        └── presentation/              # LAYER 4 — Komponen React
            ├── CodeEditor.tsx         #   Editor + syntax highlight
            ├── Autocomplete.tsx       #   Pelengkapan otomatis
            ├── ControlPanel.tsx       #   Run/Step/Reset/Speed
            ├── RegisterDashboard.tsx  #   Tampilan register & flag
            ├── MemoryViewer.tsx       #   Hex viewer (read-only)
            ├── MemoryEditorPanel.tsx  #   Hex editor (read-write)
            ├── WatchPanel.tsx         #   Watch register/memory
            ├── StackViewer.tsx        #   Visualisasi stack
            ├── ExecutionLog.tsx       #   Log eksekusi instruksi
            ├── CPUDiagram.tsx         #   Diagram blok CPU Z-80
            ├── AIFeedbackPanel.tsx    #   Panel hasil linter + Gemini
            ├── MateriDasarPanel.tsx   #   Panel materi (5 kategori)
            ├── KeyboardShortcutsModal.tsx
            ├── ToolsPanel.tsx
            ├── ResizablePanel.tsx
            ├── PwaInstallPrompt.tsx   #   Snackbar install PWA
            ├── ThemeContext.tsx       #   Provider dark/light
            ├── ToastContext.tsx       #   Provider toast
            ├── FeatureToggleContext.tsx
            └── z80InstructionDocs.ts  #   Database dokumentasi mnemonic
```

---

## 7. Mode Pengalamatan & Set Instruksi yang Didukung

### 7.1. Mode Pengalamatan (12 Mode)

| # | Mode | Notasi | Contoh |
|---|---|---|---|
| 1 | Register 8-bit | `r` | `LD A, B` |
| 2 | Register 16-bit | `RR` | `LD SP, HL` |
| 3 | Register Pair | `RP` | `PUSH BC` |
| 4 | Index Register | `IX/IY` | `LD IX, 1000H` |
| 5 | Indirect via Pair | `(RP)` | `LD A, (HL)` |
| 6 | Indirect Address | `(nn)` | `LD A, (1234H)` |
| 7 | Indexed IX | `(IX+d)` | `LD A, (IX+5)` |
| 8 | Indexed IY | `(IY+d)` | `LD A, (IY-3)` |
| 9 | Immediate 8-bit | `n` | `LD A, FFH` |
| 10 | Immediate 16-bit | `nn` | `LD HL, 8000H` |
| 11 | Port Immediate | `(n)` | `OUT (10H), A` |
| 12 | Port Register | `(C)` | `IN B, (C)` |

> Tambahan khusus: `(SP)` untuk `EX (SP), HL/IX/IY`.

### 7.2. Set Instruksi (Cakupan)

Domain mnemonic yang didefinisikan: **lebih dari 90 mnemonic** mencakup *core* arsitektur Z-80 (lihat `Mnemonic` di [`types.ts:69-172`](src/z80/domain/types.ts#L69-L172)).

| Cakupan Resmi | Jumlah |
|---|---|
| Mnemonic *resmi* Z-80 (asli Zilog) | ≈ 158 |
| Mnemonic yang dikenali oleh parser ini | **~90+** |
| **Estimasi cakupan** | **~57–60%** dari total *base* Z-80 |

> **Catatan akademik:** Persentase ini didasarkan pada jumlah *mnemonic*, bukan jumlah *opcode*. Z-80 memiliki ±252 *base opcodes* + 4 prefiks (`CB`, `DD`, `ED`, `FD`) sehingga total ≈ 700+ opcode. Cakupan opcode-level perlu pengukuran terpisah.

---

## 8. Komponen Utama Antarmuka (UI Components)

### 8.1. Daftar Panel

| # | Panel | Fungsi |
|---|---|---|
| 1 | **Code Editor** | Penulisan kode assembly, highlighting, breakpoint |
| 2 | **Control Panel** | Run/Step/Pause/Reset/Speed slider, Load default, Import/Export |
| 3 | **Register Dashboard** | Visualisasi 23 register + 16 flag (main + alternate) |
| 4 | **Memory Viewer** | Hex dump 64 KB read-only |
| 5 | **Memory Editor** | Hex editor 64 KB interaktif |
| 6 | **Watch Panel** | Pengamat register/alamat memori multi-format |
| 7 | **Stack Viewer** | Visualisasi tumpukan dari `SP` |
| 8 | **CPU Diagram** | Diagram blok arsitektur internal Z-80 |
| 9 | **Execution Log** | Riwayat eksekusi instruksi |
| 10 | **AI Feedback Panel** | Hasil Linter + tombol Deep Scan Gemini |
| 11 | **Materi Dasar Panel** | Rangkuman 5 kategori instruksi |
| 12 | **Tools Panel** | Konfigurasi feature toggle, tema, shortcut |
| 13 | **PWA Install Prompt** | Snackbar undangan instalasi |

### 8.2. Layout

#### Desktop (≥ 768 px)
- **Layout horizontal split-screen** dengan `react-resizable-panels`.
- Tab utama: **Assembler · Memory Editor · Watch · Stack · CPU Diagram**.
- Panel **AI Feedback** dan **Materi Dasar** muncul sebagai *floating panel* yang dapat di-*drag*.

#### Mobile (< 768 px)
- **Bottom navigation 4 tab:** Code · CPU · Memory · Log.
- Panel *floating* otomatis menjadi *full-screen overlay*.
- Menu sekunder ditampilkan sebagai dropdown via tombol `⋮`.

### 8.3. Tema (Dark/Light Mode)
- Disediakan oleh `ThemeContext.tsx` + `next-themes` v0.4.6.
- Toggle melalui ikon ☀️/🌙 di header.
- **Default:** Dark mode (`#18181b` — Tailwind `zinc-900`).

### 8.4. Responsivitas (Breakpoint)
Mengikuti default Tailwind:

| Breakpoint | Lebar | Strategi |
|---|---|---|
| `< 640px` (mobile) | s/d 639px | Bottom nav, panel full-screen |
| `≥ 640px` (sm) | 640–767px | Tablet portrait |
| `≥ 768px` (md) | 768px+ | Desktop split-screen |
| `≥ 1024px` (lg) | 1024px+ | 3-kolom register dashboard |

---

## 9. Spesifikasi Sistem

### 9.1. Browser yang Didukung

| Peramban | Versi Minimum | Catatan |
|---|---|---|
| Google Chrome | 100+ | Direkomendasikan |
| Microsoft Edge | 100+ | Berbasis Chromium |
| Mozilla Firefox | 100+ | — |
| Safari | 15.4+ | Sebagian PWA install dibatasi |
| Opera | 86+ | Berbasis Chromium |

> Wajib mendukung **ES2020**, **Service Worker API**, dan **Web Crypto API**.

### 9.2. Resolusi Layar Minimum
- **Mobile:** 360 × 640 px (portrait)
- **Tablet:** 768 × 1024 px
- **Desktop:** 1280 × 720 px (rekomendasi 1920 × 1080)

### 9.3. Kebutuhan Memori
- **RAM client:** ≥ 512 MB tersedia (memori CPU emulasi: 64 KB + UI state ≈ < 50 MB total)
- **Storage:** ≈ 10 MB untuk *precache* PWA + `localStorage`

### 9.4. Kebutuhan Koneksi Internet

| Skenario | Internet |
|---|---|
| Akses pertama (download bundle) | ✅ Wajib |
| Penggunaan offline (editor + emulasi + linter) | ❌ Tidak perlu |
| Login Google + Cloud sync | ✅ Wajib |
| AI Deep Scan (Gemini) | ✅ Wajib |

---

## 10. Perbandingan dengan Simulator Z-80 Lain

| Aspek | **Z-80 Simulator Core Logic** *(produk ini)* | **Oshonsoft Z80 Simulator IDE** | **z80pack** |
|---|---|---|---|
| Lisensi | MIT (Open Source) | Proprietary (berbayar/trial) | BSD-2-Clause |
| Platform | Web (semua OS) — PWA | Windows only | Linux/Unix terutama |
| Instalasi | ❌ Tidak perlu | ✅ Installer Windows | ✅ Compile dari source |
| Antarmuka | Modern (React + Tailwind) | Win98-style klasik | CLI / Curses |
| Mode Tema | Dark + Light | Light only | N/A |
| Memori 64 KB | ✅ Penuh | ✅ Penuh | ✅ Penuh |
| Set Instruksi | ~90+ mnemonic | Lengkap (resmi) | Lengkap (resmi) |
| Memory Editor | ✅ Hex interaktif | ✅ Hex interaktif | ⚠️ Via debugger |
| Watch Variables | ✅ Multi-format | ✅ | ✅ |
| Step Execution | ✅ | ✅ | ✅ |
| Breakpoints | ✅ Klik gutter | ✅ | ✅ |
| **AI Feedback (Linter)** | ✅ **8 aturan otomatis** | ❌ | ❌ |
| **AI Deep Scan (LLM)** | ✅ **Gemini API** | ❌ | ❌ |
| Skor Performa Kode | ✅ 0–100 | ❌ | ❌ |
| Validasi Hardware | ✅ Rule 8 (sintaks ilegal) | ⚠️ Parsial | ⚠️ Parsial |
| Cloud Sync (kode) | ✅ Firestore | ❌ | ❌ |
| Multi-file Tabs | ✅ Persisten | ⚠️ Manual | ❌ |
| Materi Pembelajaran | ✅ Panel terintegrasi | ❌ | ❌ |
| PWA / Offline | ✅ Installable | ❌ | ❌ |
| Kemandirian Belajar | ✅ Tinggi (AI feedback) | ⚠️ Sedang | ⚠️ Rendah |
| Aksesibilitas | ✅ Lintas perangkat | ⚠️ Windows saja | ⚠️ Teknis |
| Komunitas | Baru | Komersial mapan | Open source aktif |

> **Posisi unik produk ini:** menjembatani kesenjangan antara *paritas fitur* simulator komersial (Oshonsoft) dengan *aksesibilitas web* dan *umpan balik berbasis AI* yang tidak ditemukan pada simulator lain.

---

## 11. Cara Instalasi & Menjalankan

### 11.1. Prerequisites

| Tools | Versi Minimum |
|---|---|
| Node.js | **≥ 18.0.0** (LTS) |
| pnpm | ≥ 8.0 *(opsional, npm juga bekerja)* |
| Git | ≥ 2.30 |
| Akun Firebase | (untuk *deploy*) |
| API Key Gemini | (untuk fitur AI Deep Scan) |

### 11.2. Langkah Instalasi

```bash
# 1. Clone repositori
git clone <repository-url>
cd "Z-80 Simulator Core Logic"

# 2. Install dependencies
pnpm install
# atau
npm install

# 3. Konfigurasi environment variables (opsional)
echo "VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE" > .env
```

### 11.3. Perintah Pengembangan

```bash
# Menjalankan dev server (HMR aktif)
npm run dev
# Akses: http://localhost:5173
```

### 11.4. Perintah Build Produksi

```bash
# Membangun bundle produksi
npm run build
# Output: ./dist/
```

### 11.5. Perintah Deploy

```bash
# Login Firebase (sekali saja)
firebase login

# Deploy ke Firebase Hosting
firebase deploy --only hosting

# Deploy aturan Firestore
firebase deploy --only firestore:rules

# Deploy semuanya
firebase deploy
```

URL produksi: **https://z80-simulation.web.app**

---

## 12. Roadmap Pengembangan

### ✅ Fitur yang Sudah Selesai

- [x] Engine emulasi Z-80 dengan 90+ mnemonic
- [x] Memori penuh 64 KB dengan navigasi paginasi
- [x] Register lengkap (main + alternate + IX/IY + I/R)
- [x] 8 flag lengkap (SF, ZF, YF, HF, XF, PF, NF, CF) untuk F dan F'
- [x] Performance counter (clock cycles + instructions)
- [x] Editor dengan syntax highlighting + autocomplete + tooltip
- [x] Multi-file tabs dengan persistensi `localStorage`
- [x] Memory Editor interaktif (double-click edit)
- [x] Watch Panel multi-format (Hex/Dec/Bin)
- [x] Stack Viewer
- [x] Engine Linter Internal (Tahap 1) — 8 aturan
- [x] AI Deep Scan (Tahap 2) — Gemini API dengan model fallback
- [x] Sistem Skor Performa Kode (0–100)
- [x] Panel Materi Dasar (5 kategori)
- [x] Otentikasi Google Sign-In
- [x] Cloud sync via Cloud Firestore
- [x] Progressive Web App (installable, offline-first)
- [x] Custom snackbar untuk PWA install prompt
- [x] Dark/Light mode dengan `next-themes`
- [x] Migrasi ikon ke Lucide Icons
- [x] Responsivitas mobile-first

### 🔄 Fitur dalam Pengembangan

- [ ] Prompt engineering tambahan untuk Gemini (multi-turn conversation)
- [ ] Validasi kompatibilitas hardware tambahan (rotate/shift edge cases)
- [ ] Disassembler — tampilkan memori sebagai assembly

### 📋 Fitur yang Direncanakan

- [ ] Bank soal latihan terstruktur dengan auto-grading
- [ ] Conditional breakpoint (break-on-value-change)
- [ ] Memory diff (snapshot before/after)
- [ ] Export/Import memory dump (Intel HEX format)
- [ ] Memory map color-coding (ROM/RAM/Stack/IO)
- [ ] Visualisasi pipeline instruksi
- [ ] Mode kolaboratif real-time (pair programming)
- [ ] Integrasi LMS (LTI 1.3) untuk universitas
- [ ] Lokalisasi multi-bahasa (English, Bahasa Inggris akademik)
- [ ] Export laporan analisis ke PDF
- [ ] Suite uji E2E dengan Playwright

---

## 13. Kontribusi & Acknowledgement

### 13.1. Pencipta Utama

**ucup-baba** — Pengembangan inti, arsitektur, dan implementasi.

### 13.2. Tools AI yang Digunakan dalam Pengembangan

| Tools | Peran dalam Pengembangan |
|---|---|
| **Google Antigravity** | IDE utama untuk pengembangan |
| **Claude Code** (Anthropic) | AI coding assistant — refactoring, dokumentasi, *code review* |
| **Google Gemini** | Sumber inspirasi untuk fitur AI Deep Scan + co-design prompt |

### 13.3. Sumber & Referensi

- **Zilog Z80 CPU User Manual** — Spesifikasi resmi arsitektur Z-80 (Zilog Inc.)
- **Robert C. Martin** — *Clean Architecture: A Craftsman's Guide to Software Structure and Design*
- **Oshonsoft Z80 Simulator IDE** — Referensi paritas fitur
- **z80pack** — Referensi *open source* simulator Z-80 klasik
- **shadcn/ui** — Komponen UI ([MIT License](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md))
- **Radix UI** — Aksesibilitas primitif
- **Lucide Icons** — Ikon SVG ([ISC License](https://lucide.dev/license))
- **Unsplash** — Aset foto (jika ada — lihat [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md))

### 13.4. Desain Referensi

Desain awal antarmuka dirancang di Figma:
[Z-80 Simulator Core Logic — Figma Design](https://www.figma.com/design/5uZuGEoEqAEA5LwultZoLK/Z-80-Simulator-Core-Logic)

---

## 14. Lisensi

Proyek ini didistribusikan di bawah **MIT License**.

```
MIT License

Copyright (c) 2025 ucup-baba (Z-80 Simulator Core Logic)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Atribusi pihak ketiga selengkapnya: [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md).

---

## 15. Kontak

| Saluran | Detail |
|---|---|
| **Email** | ucupbaba0704@gmail.com |
| **GitHub** | [@ucup-baba](https://github.com/ucup-baba) |
| **Email Akademik** | *(diisi manual)* |
| **Pembimbing I** | *(diisi manual)* |
| **Pembimbing II** | *(diisi manual)* |
| **Universitas** | *(diisi manual)* |

---

> **Dokumen ini dirancang sebagai rujukan teknis untuk skripsi pengembangan model ADDIE.** Pemetaan ke bab tugas akhir:
>
> - **BAB III — Metode Penelitian:** Bagian [3](#3-fitur-utama), [4](#4-arsitektur-aplikasi), [5](#5-tumpukan-teknologi-tech-stack), [6](#6-struktur-folder-proyek) — sebagai dokumentasi tahap *Design* dan *Development* model ADDIE.
> - **BAB IV — Hasil Penelitian:** Bagian [3](#3-fitur-utama), [7](#7-mode-pengalamatan--set-instruksi-yang-didukung), [8](#8-komponen-utama-antarmuka-ui-components), [10](#10-perbandingan-dengan-simulator-z-80-lain) — sebagai bukti implementasi dan benchmark.

---

*Terakhir diperbarui: 2026-05-05*
