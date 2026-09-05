export interface InstrumentItem {
  id: number;
  statement: string;
  testGuide?: string;
  sampleCode?: string;
  externalLink?: string;
  externalLinkText?: string;
  /** Menampilkan tombol pemicu pemasangan PWA pada butir ini. */
  installPwa?: boolean;
}

export interface InstrumentAspect {
  title: string;
  indicator?: string;
  items: InstrumentItem[];
}

export interface InstrumentDefinition {
  type: 'materi' | 'media' | 'mahasiswa' | 'dosen';
  title: string;
  subtitle: string;
  targetRole: string;
  totalItems: number;
  aspects: InstrumentAspect[];
}

export const INSTRUMEN_AHLI_MATERI: InstrumentDefinition = {
  type: 'materi',
  title: 'LEMBAR VALIDASI AHLI MATERI',
  subtitle: 'Penilaian Kelayakan Materi pada Web Simulator Z-80 Terintegrasi Asisten AI',
  targetRole: 'Validator Ahli Materi',
  totalItems: 14,
  aspects: [
    {
      title: 'Aspek 1: Kesesuaian Materi',
      indicator: 'Kesesuaian materi dengan capaian pembelajaran mata kuliah Sistem Mikroprosesor',
      items: [
        { 
          id: 1, 
          statement: 'Materi yang disajikan mencakup instruksi dasar Z-80 (transfer data, aritmatika, logika, percabangan, dan stack) sesuai dengan cakupan RPS mata kuliah Sistem Mikroprosesor Pertemuan 1–5.',
          testGuide: 'Uji simulasi di simulator Z-80. (Untuk melihat lebih banyak contoh program lainnya, Anda dapat memilih dropdown "Contoh Program" pada panel kontrol bawah simulator).',
          sampleCode: `ORG 0000H\n    LD A, 12H\n    LD B, 24H\n    ADD A, B\n    HALT`
        },
        { 
          id: 2, 
          statement: 'Urutan penyajian materi dalam Panel Materi Dasar — dari pengenalan register Z-80, mode pengalamatan, hingga konsep stack dan subrutin — sudah sistematis dan sesuai urutan RPS.',
          testGuide: 'Buka "Buku Panduan Materi Dasar" di bilah atas untuk meninjau sistematika penjelasan Bab I hingga Bab V.'
        },
        { 
          id: 3, 
          statement: 'Pembatasan cakupan simulator pada Pertemuan 1–5 RPS (tidak mencakup interfacing ASCII, seven-segment, PPI 8255, dan PIO Z-80) sudah tepat sesuai karakteristik materi yang dapat disimulasikan secara virtual.',
          testGuide: 'Inspeksi batas instruksi yang didukung simulator pada area editor dan autocomplete.'
        },
      ]
    },
    {
      title: 'Aspek 2: Kebenaran Isi',
      indicator: 'Ketepatan konsep instruksi Z-80, register, memori, dan alur eksekusi program',
      items: [
        { 
          id: 4, 
          statement: 'Deskripsi fungsi instruksi transfer data (LD, PUSH, POP), aritmatika (ADD, SUB, INC, DEC, CP), logika (AND, OR, XOR), dan kendali program (JP, JR, DJNZ, CALL, RET, HALT) dalam Panel Materi sudah tepat secara teknis sesuai Zilog Z-80 CPU User Manual.',
          testGuide: 'Uji instruksi transfer data & stack (PUSH/POP) untuk mengamati pergerakan register & memori RAM.',
          sampleCode: `ORG 0000H\n    LD SP, 1000H\n    LD BC, 1234H\n    PUSH BC\n    POP HL\n    HALT`
        },
        { 
          id: 5, 
          statement: 'Perubahan nilai register utama (A, B, C, D, E, H, L) dan flag register (F) yang divisualisasikan simulator sudah sesuai dengan perilaku nyata CPU Z-80 saat setiap instruksi dieksekusi.',
          testGuide: 'Jalankan kode penambahan overflow di bawah ini dan perhatikan Carry Flag (C=1) dan Zero Flag (Z=1).',
          sampleCode: `ORG 0000H\n    LD A, 0FFH\n    ADD A, 01H      ; Overflow -> A=00H, Z=1, C=1\n    HALT`
        },
        { 
          id: 6, 
          statement: 'Mekanisme stack yang divisualisasikan simulator — termasuk perubahan Stack Pointer (SP) saat instruksi PUSH dan POP dieksekusi — sudah sesuai dengan arsitektur Z-80 yang sebenarnya.',
          testGuide: 'Amati perubahan alamat Stack Pointer (SP=1000H -> 0FFEH) pada panel Stack di sebelah kanan.',
          sampleCode: `ORG 0000H\n    LD SP, 1000H\n    LD DE, 0ABCDH\n    PUSH DE         ; SP berubah dari 1000H ke 0FFEH\n    POP HL          ; HL = ABCDH, SP kembali ke 1000H\n    HALT`
        },
      ]
    },
    {
      title: 'Aspek 3: Kedalaman Materi',
      indicator: 'Kecukupan cakupan materi instruksi dasar Z-80 dan contoh penggunaan',
      items: [
        { 
          id: 7, 
          statement: 'Penjelasan setiap instruksi Z-80 dalam Panel Materi mencakup sintaks, fungsi, efek terhadap register, dan contoh penggunaan yang cukup untuk mendukung mahasiswa mengerjakan tugas praktikum secara mandiri.',
          testGuide: 'Periksa contoh kode dan rincian parameter instruksi pada panel Materi Dasar.'
        },
        { 
          id: 8, 
          statement: 'Contoh program Assembly Z-80 yang tersedia dalam media sudah mencakup variasi mode pengalamatan yang relevan, meliputi pengalamatan langsung, tidak langsung, dan register.',
          testGuide: 'Uji variasi pengalamatan langsung LD (0050H), A dan pengalamatan tidak langsung LD (HL), A. (Untuk melihat pilihan variasi contoh program lainnya, Anda dapat memilih dropdown "Contoh Program" pada panel bawah).',
          sampleCode: `ORG 0000H\n    LD HL, 0050H    ; Pointer HL\n    LD A, 77H\n    LD (HL), A      ; Indirect Addressing (RAM 0050H = 77H)\n    HALT`
        },
        { 
          id: 9, 
          statement: 'Kedalaman materi tentang konsep stack, subrutin (CALL/RET), dan pengaruh eksekusi instruksi terhadap flag register (Zero, Carry, Sign) sudah memadai untuk level mahasiswa semester 3.',
          testGuide: 'Uji eksekusi pemanggilan subrutin CALL dan pengembalian RET pada simulator.',
          sampleCode: `ORG 0000H\n    LD SP, 1000H\n    CALL SUBRUTIN1\n    HALT\n\nSUBRUTIN1:\n    LD A, 55H\n    RET`
        },
      ]
    },
    {
      title: 'Aspek 4: Aspek Pembelajaran',
      indicator: 'Kesesuaian materi dengan kebutuhan praktikum dan belajar mandiri mahasiswa',
      items: [
        { 
          id: 10, 
          statement: 'Panel Materi Dasar yang terintegrasi dalam simulator memungkinkan mahasiswa belajar mandiri tanpa perlu membuka referensi eksternal selama sesi praktikum.',
          testGuide: 'Buka modul materi terintegrasi untuk melihat dukungan pembelajaran mandiri.'
        },
        { 
          id: 11, 
          statement: 'Fitur eksekusi step-by-step pada simulator mendorong mahasiswa untuk bereksperimen secara aktif dan mengamati dampak setiap instruksi Z-80 terhadap kondisi register dan memori.',
          testGuide: 'Klik tombol "Step (Ctrl+S)" berulang kali untuk mengamati eksekusi per instruksi secara mendalam.',
          sampleCode: `ORG 0000H\n    LD A, 01H\n    INC A\n    INC A\n    INC A\n    HALT`
        },
        { 
          id: 12, 
          statement: 'Umpan balik dari Engine Linter Internal (deteksi error sintaks, warning, tips) dan AI Deep Scan (analisis logika kode Assembly Z-80) sudah relevan dan membantu mahasiswa memahami serta memperbaiki kesalahan secara mandiri.',
          testGuide: 'Klik "⚡ Uji Kode Ini" (kode sengaja tanpa HALT), lalu buka panel AI Scan untuk melihat deteksi warning linter & saran AI. Tambahkan HALT, klik Load, dan ulangi analisis untuk melihat Health Score kembali 100.',
          sampleCode: `ORG 0000H\n    LD A, 12H       ; Accumulator A = 12H\n    LD B, 24H       ; Register B = 24H\n    ADD A, B        ; A = 36H\n    ; (Sengaja tanpa HALT untuk menguji Warning Linter & AI Scan)`
        },
      ]
    },
    {
      title: 'Aspek 5: Bahasa',
      indicator: 'Kejelasan bahasa, keterbacaan, dan ketepatan penggunaan istilah teknis',
      items: [
        { id: 13, statement: 'Penjelasan instruksi Z-80 dalam Panel Materi menggunakan bahasa yang jelas, tidak terlalu teknis, dan sesuai dengan kemampuan mahasiswa semester 3 yang baru mempelajari pemrograman Assembly.' },
        { id: 14, statement: 'Penggunaan istilah teknis Z-80 seperti accumulator, register pair, stack pointer, program counter, flag register, dan mode pengalamatan sudah tepat dan konsisten di seluruh bagian media.' },
      ]
    }
  ]
};

export const INSTRUMEN_AHLI_MEDIA: InstrumentDefinition = {
  type: 'media',
  title: 'LEMBAR VALIDASI AHLI MEDIA',
  subtitle: 'Penilaian Kelayakan Media pada Web Simulator Z-80 Terintegrasi Asisten AI',
  targetRole: 'Validator Ahli Media',
  totalItems: 16,
  aspects: [
    {
      title: 'Aspek 1: Tampilan',
      indicator: 'Kesesuaian desain antarmuka, tata letak, warna, ikon, dan keterbacaan teks',
      items: [
        { id: 1, statement: 'Desain antarmuka (layout, warna, dan tipografi) media sudah konsisten, estetis, dan tidak mengganggu fokus belajar mahasiswa.' },
        { id: 2, statement: 'Tata letak komponen utama (editor kode, tombol eksekusi, panel register/memori, panduan materi, dan area AI Analyzer) sudah logis dan memudahkan alur kerja pengguna.' },
        { id: 3, statement: 'Penggunaan ikon dan label tombol sudah jelas, intuitif, dan mudah dipahami tanpa penjelasan tambahan.' },
        { id: 4, statement: 'Ukuran dan kontras teks pada seluruh bagian media sudah memadai untuk keterbacaan yang nyaman di berbagai kondisi pencahayaan.' },
      ]
    },
    {
      title: 'Aspek 2: Pemrograman',
      indicator: 'Kestabilan fungsi simulator, eksekusi kode, visualisasi register dan memori, serta fitur AI Analyzer',
      items: [
        { 
          id: 5, 
          statement: 'Fungsi simulator (eksekusi kode Assembly Z-80 step-by-step dan run langsung) berjalan dengan stabil dan memberikan hasil yang konsisten.',
          testGuide: 'Klik tombol "Run" atau gunakan "Step" per baris untuk memverifikasi kestabilan eksekusi.',
          sampleCode: `ORG 0000H\n    LD A, 05H\n    LD B, 0AH\nLOOP:\n    DEC B\n    JP NZ, LOOP\n    HALT`
        },
        { 
          id: 6, 
          statement: 'Visualisasi register (A, B, C, D, E, H, L, F) dan memori pada simulator diperbarui secara real-time dan akurat selama eksekusi program.',
          testGuide: 'Amati sorotan warna kuning pada register A, B, C, dan RAM alamat 0050H saat kode dieksekusi.',
          sampleCode: `ORG 0000H\n    LD A, 44H\n    LD B, A\n    LD HL, 0050H\n    LD (HL), A\n    HALT`
        },
        { 
          id: 7, 
          statement: 'Fitur AI Analyzer (Engine Linter Internal dan AI Deep Scan berbasis Gemini API) berfungsi dengan benar dan memberikan output umpan balik yang relevan.',
          testGuide: 'Klik "⚡ Uji Kode Ini", lalu buka panel AI Scan. Selanjutnya, coba hapus baris HALT pada editor, klik Load, dan ulangi analisis AI maupun Linter untuk melihat deteksi warning & saran perbaikan AI.',
          sampleCode: `ORG 0000H\n    LD A, 10H\n    ADD A, 20H\n    HALT`
        },
      ]
    },
    {
      title: 'Aspek 3: Kemudahan Penggunaan',
      indicator: 'Kemudahan navigasi, kejelasan tombol, dan kemudahan memahami alur penggunaan media',
      items: [
        { id: 8, statement: 'Pengguna baru dapat memahami alur penggunaan media (menulis kode → eksekusi → mengamati hasil → memperbaiki) tanpa perlu panduan eksternal.' },
        { id: 9, statement: 'Navigasi antara fitur-fitur utama (editor, simulator, panduan materi, AI Analyzer) mudah dilakukan dan tidak membingungkan.' },
        { id: 10, statement: 'Pesan kesalahan (error message) dan umpan balik yang ditampilkan sistem sudah informatif dan mudah dipahami oleh mahasiswa.' },
      ]
    },
    {
      title: 'Aspek 4: Kualitas Teknis',
      indicator: 'Kecepatan akses, responsivitas, dan minimnya kesalahan sistem',
      items: [
        { id: 11, statement: 'Media dapat diakses dan digunakan dengan lancar tanpa hambatan teknis yang signifikan pada koneksi internet standar.' },
        { id: 12, statement: 'Waktu respons aplikasi (loading halaman, eksekusi kode, analisis AI) cukup cepat dan tidak mengganggu pengalaman belajar.' },
        { id: 13, statement: 'Tidak ditemukan kesalahan sistem (bug) yang berulang atau mengganggu fungsi utama media selama penggunaan.' },
      ]
    },
    {
      title: 'Aspek 5: Aksesibilitas',
      indicator: 'Kemampuan media digunakan pada berbagai perangkat dan peramban',
      items: [
        { id: 14, statement: 'Media dapat digunakan dengan optimal pada perangkat komputer (desktop/laptop) dengan berbagai resolusi layar.' },
        { id: 15, statement: 'Media dapat digunakan dengan optimal pada perangkat mobile (smartphone/tablet) melalui tampilan responsif yang sudah dirancang.' },
        { id: 16, statement: 'Media dapat diakses pada berbagai peramban modern (Chrome, Firefox, Edge, Safari) tanpa memerlukan instalasi tambahan.' },
      ]
    }
  ]
};

export const INSTRUMEN_RESPONS_MAHASISWA: InstrumentDefinition = {
  type: 'mahasiswa',
  title: 'LEMBAR RESPONS MAHASISWA',
  subtitle: 'Tanggapan Mahasiswa terhadap Penggunaan Web Simulator Z-80 Terintegrasi AI',
  targetRole: 'Responden Mahasiswa',
  totalItems: 15,
  aspects: [
    {
      title: 'Aspek 1: Kemudahan Penggunaan',
      indicator: 'Media mudah diakses, dipahami, dan digunakan oleh mahasiswa',
      items: [
        { id: 1, statement: 'Saya dapat mengakses dan mulai menggunakan Web Simulator Z-80 ini dengan mudah tanpa perlu instalasi atau panduan khusus.' },
        { id: 2, statement: 'Tombol-tombol dan menu yang tersedia di media ini mudah saya pahami dan gunakan.' },
        { id: 3, statement: 'Alur penggunaan media (membaca materi → menulis kode → menjalankan simulasi → menganalisis hasil) sudah jelas dan mudah saya ikuti.' },
      ]
    },
    {
      title: 'Aspek 2: Tampilan',
      indicator: 'Tampilan media menarik, nyaman, dan mendukung proses belajar',
      items: [
        { id: 4, statement: 'Tampilan antarmuka (layout, warna, dan desain) media ini menarik dan membuat saya nyaman menggunakannya.' },
        { id: 5, statement: 'Teks, ikon, dan elemen visual dalam media ini mudah saya baca dan pahami.' },
        { id: 6, statement: 'Tampilan media ini responsif dan tetap nyaman digunakan baik di komputer maupun di smartphone saya.' },
      ]
    },
    {
      title: 'Aspek 3: Kebermanfaatan',
      indicator: 'Media membantu mahasiswa memahami eksekusi instruksi, perubahan register, dan perubahan memori',
      items: [
        { 
          id: 7, 
          statement: 'Dengan menggunakan simulator ini, saya lebih mudah memahami bagaimana instruksi Assembly Z-80 dieksekusi secara bertahap.',
          testGuide: 'Klik "⚡ Uji Kode Ini", lalu gunakan tombol "Step (Ctrl+S)" per baris untuk mengamati eksekusi bertahap.',
          sampleCode: `ORG 0000H\n    LD A, 05H\n    INC A\n    INC A\n    HALT`
        },
        { 
          id: 8, 
          statement: 'Visualisasi perubahan nilai register (A, B, C, D, E, H, L) secara real-time membantu saya memahami dampak setiap instruksi terhadap keadaan CPU.',
          testGuide: 'Klik "⚡ Uji Kode Ini" dan amati sorotan animasi warna kuning pada register A, B, C.',
          sampleCode: `ORG 0000H\n    LD A, 12H\n    LD B, 34H\n    LD C, A\n    HALT`
        },
        { 
          id: 9, 
          statement: 'Visualisasi perubahan isi memori secara real-time membantu saya memahami konsep pengelolaan memori dalam pemrograman Assembly Z-80.',
          testGuide: 'Klik "⚡ Uji Kode Ini" dan amati perubahan isi memori RAM pada alamat 0050H.',
          sampleCode: `ORG 0000H\n    LD HL, 0050H\n    LD (HL), 99H\n    HALT`
        },
      ]
    },
    {
      title: 'Aspek 4: Materi',
      indicator: 'Panduan materi membantu mahasiswa memahami instruksi dasar Z-80',
      items: [
        { id: 10, statement: 'Panduan materi dasar instruksi Z-80 yang tersedia di dalam media ini membantu saya memahami fungsi dan cara penggunaan setiap instruksi.' },
        { id: 11, statement: 'Penjelasan materi yang disajikan menggunakan bahasa yang jelas, mudah saya pahami, dan tidak membingungkan.' },
        { id: 12, statement: 'Materi yang tersedia di dalam media sudah mencukupi kebutuhan saya dalam mengerjakan tugas praktikum mata kuliah Sistem Mikroprosesor.' },
      ]
    },
    {
      title: 'Aspek 5: Kemandirian Belajar',
      indicator: 'Media dan AI Analyzer membantu mahasiswa belajar mandiri serta memperbaiki kesalahan kode',
      items: [
        { id: 13, statement: 'Saya dapat belajar mandiri secara efektif menggunakan simulator ini tanpa harus selalu bertanya kepada dosen atau asisten laboratorium.' },
        { 
          id: 14, 
          statement: 'Umpan balik dan saran perbaikan dari fitur AI Analyzer membantu saya menemukan dan memperbaiki kesalahan kode Assembly dengan lebih cepat.',
          testGuide: 'Klik "⚡ Uji Kode Ini", lalu buka panel AI Scan di toolbar atas untuk melihat umpan balik mentor AI.',
          sampleCode: `ORG 0000H\n    LD A, 10H\n    ADD A, 20H\n    HALT`
        },
        { id: 15, statement: 'Secara keseluruhan, saya merasa puas dan tertarik menggunakan Web Simulator Z-80 ini untuk mendukung pembelajaran mandiri.' },
      ]
    }
  ]
};

export const INSTRUMEN_RESPONS_DOSEN: InstrumentDefinition = {
  type: 'dosen',
  title: 'LEMBAR RESPONS DOSEN',
  subtitle: 'Tanggapan Dosen Pengampu terhadap Penggunaan Web Simulator Z-80 Terintegrasi AI',
  targetRole: 'Responden Dosen',
  totalItems: 12,
  aspects: [
    {
      title: 'Aspek 1: Kebermanfaatan Pembelajaran',
      indicator: 'Kesesuaian media dengan karakteristik mata kuliah Sistem Mikroprosesor dan kebutuhan praktikum',
      items: [
        { id: 1, statement: 'Web Simulator Z-80 ini efektif digunakan sebagai media bantu pembelajaran praktikum Sistem Mikroprosesor.' },
        { 
          id: 2, 
          statement: 'Visualisasi eksekusi instruksi, register, dan memori secara real-time memudahkan dosen dalam menjelaskan konsep abstrak pemrograman Assembly Z-80.',
          testGuide: 'Klik "⚡ Uji Kode Ini" untuk memperagakan perubahan nilai register & memori RAM secara langsung.',
          sampleCode: `ORG 0000H\n    LD A, 0FFH\n    ADD A, 01H      ; Overflow: A=00H, Z=1, C=1\n    LD HL, 0050H\n    LD (HL), A\n    HALT`
        },
        { id: 3, statement: 'Media ini membantu mahasiswa memahami konsep dasar arsitektur CPU Z-80 secara visual dan praktis.' },
      ]
    },
    {
      title: 'Aspek 2: Kualitas Materi & Fitur',
      indicator: 'Media membantu proses pembelajaran, pemahaman konsep, dan belajar mandiri mahasiswa',
      items: [
        { id: 4, statement: 'Cakupan materi dasar instruksi Z-80 yang tersedia di dalam media sudah sesuai dengan capaian pembelajaran mata kuliah (CPMK).' },
        { 
          id: 5, 
          statement: 'Integrasi fitur AI Analyzer (Linter Internal & AI Deep Scan) memberikan umpan balik yang konstruktif bagi mahasiswa dalam menyelesaikan tugas praktikum.',
          testGuide: 'Klik "⚡ Uji Kode Ini" (kode tanpa HALT), lalu uji analisis Linter & AI Scan di toolbar atas.',
          sampleCode: `ORG 0000H\n    LD A, 12H\n    LD B, 24H\n    ADD A, B\n    ; (Coba hapus/tambah HALT untuk uji linter)`
        },
        { id: 6, statement: 'Kombinasi fitur simulator, materi terintegrasi, dan AI analyzer sudah memadai untuk mendukung pembelajaran berbasis kemandirian.' },
      ]
    },
    {
      title: 'Aspek 3: Aksesibilitas & Kepraktisan',
      indicator: 'Media layak digunakan sebagai pendukung pembelajaran pada mata kuliah Sistem Mikroprosesor',
      items: [
        { id: 7, statement: 'Media ini praktis digunakan dalam kegiatan perkuliahan/praktikum karena tidak memerlukan instalasi perangkat lunak tambahan (cukup membuka browser).' },
        { 
          id: 8, 
          statement: 'Fitur Progressive Web App (PWA) yang memungkinkan akses offline sangat bermanfaat untuk mengantisipasi keterbatasan koneksi internet di laboratorium.',
          testGuide: 'Klik tombol di bawah untuk memicu penginstalan PWA (Aplikasi Offline) atau membuka Panduan Penginstalan PWA.',
          externalLink: 'https://z80-simulation.web.app/',
          externalLinkText: 'Install / Unduh PWA (Offline)',
          installPwa: true
        },
        { id: 9, statement: 'Navigasi dan antarmuka media ini mudah dipahami oleh dosen maupun mahasiswa.' },
      ]
    },
    {
      title: 'Aspek 4: Penerimaan Keseluruhan',
      items: [
        { id: 10, statement: 'Secara umum, Web Simulator Z-80 ini sudah memenuhi standar kualitas media pembelajaran berbasis web yang baik.' },
        { id: 11, statement: 'Saya merekomendasikan penggunaan Web Simulator Z-80 ini dalam mata kuliah Sistem Mikroprosesor atau mata kuliah sejenis.' },
        { id: 12, statement: 'Secara keseluruhan, saya merasa puas dengan kinerja dan fitur yang ditawarkan oleh Web Simulator Z-80 ini.' },
      ]
    }
  ]
};

export const INSTRUMENTS: Record<string, InstrumentDefinition> = {
  materi: INSTRUMEN_AHLI_MATERI,
  media: INSTRUMEN_AHLI_MEDIA,
  mahasiswa: INSTRUMEN_RESPONS_MAHASISWA,
  dosen: INSTRUMEN_RESPONS_DOSEN,
};

export interface ValidatorPresetProfile {
  key: string;
  type: 'materi' | 'media' | 'mahasiswa' | 'dosen';
  name: string;
  nip: string;
  instansi: string;
  keahlian: string;
  formalTitle: string;
  salutation: string;
}

export const VALIDATOR_PROFILES: Record<string, ValidatorPresetProfile> = {
  materi1: {
    key: 'materi1',
    type: 'materi',
    name: 'Prof. Ir. Moh. Khairudin, S.Pd., S.T., M.T., Ph.D.',
    nip: '19790412 200212 1 002',
    instansi: 'Pendidikan Teknik Elektro UNY',
    keahlian: 'Sistem Mikroprosesor & Otomasi',
    formalTitle: 'Validator Ahli Materi I',
    salutation: 'Prof. Ir. Moh. Khairudin, S.Pd., S.T., M.T., Ph.D.'
  },
  materi2: {
    key: 'materi2',
    type: 'materi',
    name: 'Sigit Yatmono, S.T., M.T.',
    nip: '19730125 199903 1 001',
    instansi: 'Pendidikan Teknik Elektro UNY',
    keahlian: 'Sistem Mikroprosesor & Kontrol',
    formalTitle: 'Validator Ahli Materi II',
    salutation: 'Bapak Sigit Yatmono, S.T., M.T.'
  },
  media1: {
    key: 'media1',
    type: 'media',
    name: 'Dr. Drs. Totok Heru Tri Maryadi, M.Pd.',
    nip: '19680406 199303 1 001',
    instansi: 'Pendidikan Teknik Elektro UNY',
    keahlian: 'Media Pembelajaran & Teknologi',
    formalTitle: 'Validator Ahli Media I',
    salutation: 'Bapak Dr. Drs. Totok Heru Tri Maryadi, M.Pd.'
  },
  media2: {
    key: 'media2',
    type: 'media',
    name: 'Deny Budi Hertanto, S.Si., M.Kom.',
    nip: '19770511 200604 1 002',
    instansi: 'Pendidikan Teknik Elektro UNY',
    keahlian: 'Media Pembelajaran & Komputer',
    formalTitle: 'Validator Ahli Media II',
    salutation: 'Bapak Deny Budi Hertanto, S.Si., M.Kom.'
  },
  dosen: {
    key: 'dosen',
    type: 'dosen',
    name: 'Dr. Herlambang Sigit Pramono, S.T., M.Cs.',
    nip: '19650829 199903 1 001',
    instansi: 'Pendidikan Teknik Elektro UNY',
    keahlian: 'Dosen Pengampu Mata Kuliah',
    formalTitle: 'Responden Dosen Pengampu',
    salutation: 'Bapak Dr. Herlambang Sigit Pramono, S.T., M.Cs.'
  },
  mahasiswa: {
    key: 'mahasiswa',
    type: 'mahasiswa',
    name: '',
    nip: '',
    instansi: 'Pendidikan Teknik Elektro UNY',
    keahlian: 'Mahasiswa Praktikum',
    formalTitle: 'Responden Mahasiswa',
    salutation: 'Saudara/i Mahasiswa'
  }
};
