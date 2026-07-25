export interface InstructionDetail {
  mnemonic: string;
  title: string;
  syntax: string[];
  description: string;
  flagEffects: Record<string, string> | null;
  examples: {
    code: string;
    explanation: string;
  }[];
  addressingModes?: string[];
}

export interface MateriSection {
  id: string;
  number: number;
  title: string;
  color: string;
  icon: string;
  description: string;
  content?: string;
  registers?: { name: string; bits: string; description: string }[];
  flagTable?: { flag: string; name: string; bit: string; description: string }[];
  addressingModes?: { mode: string; description: string; example: string; }[];
  instructions: InstructionDetail[];
}

export const materiSections: MateriSection[] = [
  {
    id: 'register',
    number: 1,
    title: 'Pengenalan Register',
    color: '#3b82f6',
    icon: 'Cpu',
    description: 'Memahami register-register utama pada mikroprosesor Z-80 dan fungsinya.',
    content: 'Register adalah tempat penyimpanan data sementara di dalam CPU yang sangat cepat. Z-80 memiliki beberapa jenis register:\n\n- Register 8-bit Utama: A (Accumulator), B, C, D, E, H, L. Digunakan untuk menyimpan data 8-bit secara individual.\n- Flag Register (F): berisi bit-bit status Z (Zero), S (Sign), C (Carry) yang menunjukkan hasil operasi aritmatika dan logika sebelumnya.\n- Register 16-bit: BC, DE, HL. Merupakan gabungan (pasangan) dari dua register 8-bit yang sering digunakan untuk menyimpan alamat memori 16-bit.\n- Register Khusus: SP (Stack Pointer) untuk menunjuk posisi stack, dan PC (Program Counter) untuk menunjuk ke instruksi yang sedang atau akan dieksekusi.',
    registers: [
      { name: 'A (Accumulator)', bits: '8-bit', description: 'Register utama untuk operasi aritmatika dan logika' },
      { name: 'B', bits: '8-bit', description: 'Register serbaguna, sering digunakan sebagai counter' },
      { name: 'C', bits: '8-bit', description: 'Register serbaguna' },
      { name: 'D', bits: '8-bit', description: 'Register serbaguna' },
      { name: 'E', bits: '8-bit', description: 'Register serbaguna' },
      { name: 'H', bits: '8-bit', description: 'Bagian atas dari pasangan register HL' },
      { name: 'L', bits: '8-bit', description: 'Bagian bawah dari pasangan register HL' },
      { name: 'F (Flag)', bits: '8-bit', description: 'Menyimpan status hasil operasi (Zero, Sign, Carry)' },
      { name: 'BC', bits: '16-bit', description: 'Pasangan register, sering untuk counter' },
      { name: 'DE', bits: '16-bit', description: 'Pasangan register, sering untuk alamat tujuan' },
      { name: 'HL', bits: '16-bit', description: 'Pasangan register utama untuk pengalamatan memori' },
      { name: 'SP', bits: '16-bit', description: 'Stack Pointer, menunjuk ke posisi teratas stack' },
      { name: 'PC', bits: '16-bit', description: 'Program Counter, menunjuk instruksi selanjutnya' }
    ],
    instructions: []
  },
  {
    id: 'addressing',
    number: 2,
    title: 'Mode Pengalamatan',
    color: '#8b5cf6',
    icon: 'MapPin',
    description: 'Cara-cara yang digunakan Z-80 untuk mengakses data (operand) dalam instruksi.',
    content: 'Mode pengalamatan (Addressing Modes) menentukan bagaimana sebuah instruksi menemukan data yang akan dioperasikan. Z-80 memiliki beberapa mode utama:\n\n- Immediate: Nilai langsung ditulis di instruksi (contoh: LD A, 05H)\n- Register: Data diambil dari register lain (contoh: LD A, B)\n- Indirect: Data diambil dari alamat memori yang ditunjuk register (contoh: LD A, (HL))',
    addressingModes: [
      { mode: 'Immediate', description: 'Nilai langsung ditulis sebagai bagian dari instruksi', example: 'LD A, 05H → A = 05H' },
      { mode: 'Register', description: 'Nilai diambil dari register lain', example: 'LD A, B → A = nilai B' },
      { mode: 'Direct', description: 'Mengakses alamat memori yang spesifik', example: 'LD A, (1000H) → A = isi memori[1000H]' },
      { mode: 'Indirect', description: 'Mengakses memori melalui register pointer', example: 'LD A, (HL) → A = isi memori[alamat HL]' }
    ],
    instructions: []
  },
  {
    id: 'transfer',
    number: 3,
    title: 'Transfer Data',
    color: '#06b6d4',
    icon: 'ArrowLeftRight',
    description: 'Instruksi untuk memindahkan data antar register, memori, atau nilai langsung.',
    instructions: [
      {
        mnemonic: 'LD',
        title: 'Load — Transfer Data',
        syntax: ['LD dest, src', 'LD A, 05H', 'LD A, B', 'LD A, (HL)', 'LD (HL), A', 'LD HL, 1000H'],
        description: 'Menyalin (copy) data dari sumber (src) ke tujuan (dest). Instruksi paling dasar dan paling sering digunakan dalam Z-80. Mendukung transfer antara register, nilai langsung, dan memori.',
        flagEffects: null,
        examples: [
          {
            code: 'LD A, 42H    ; A = 42H (66 desimal)\nLD B, A      ; B = 42H (copy dari A)\nLD C, 10H    ; C = 10H (16 desimal)',
            explanation: 'Nilai 42H dimasukkan ke A, lalu dicopy ke B. C diisi nilai baru 10H.'
          }
        ],
        addressingModes: ['Immediate', 'Register', 'Direct', 'Indirect']
      },
      {
        mnemonic: 'PUSH',
        title: 'Push — Simpan ke Stack',
        syntax: ['PUSH rr', 'PUSH BC', 'PUSH DE', 'PUSH HL', 'PUSH AF'],
        description: 'Menyimpan isi register pasangan 16-bit ke Stack. Stack Pointer (SP) akan berkurang 2 karena 2 byte disimpan ke memori. Byte tinggi (High) disimpan terlebih dahulu.',
        flagEffects: null,
        examples: [
          {
            code: 'LD BC, 1234H  ; BC = 1234H\nPUSH BC       ; SP -= 2, memori[SP] = 1234H',
            explanation: 'Nilai BC (1234H) disimpan ke Stack. SP berkurang dari misalnya FFFEH menjadi FFFCH.'
          }
        ]
      },
      {
        mnemonic: 'POP',
        title: 'Pop — Ambil dari Stack',
        syntax: ['POP rr', 'POP BC', 'POP DE', 'POP HL', 'POP AF'],
        description: 'Mengambil 2 byte teratas dari Stack dan memasukkannya ke register pasangan 16-bit. Stack Pointer (SP) akan bertambah 2.',
        flagEffects: null,
        examples: [
          {
            code: 'POP DE        ; DE = nilai dari Stack, SP += 2',
            explanation: 'Dua byte teratas Stack diambil dan dimasukkan ke DE. SP bertambah 2.'
          }
        ]
      }
    ]
  },
  {
    id: 'arithmetic',
    number: 4,
    title: 'Operasi Aritmatika',
    color: '#10b981',
    icon: 'Calculator',
    description: 'Instruksi untuk melakukan penjumlahan, pengurangan, perbandingan, dan manipulasi numerik lainnya.',
    instructions: [
      {
        mnemonic: 'ADD',
        title: 'Add — Penjumlahan',
        syntax: ['ADD A, reg', 'ADD A, n', 'ADD A, (HL)'],
        description: 'Menambahkan nilai operand ke Accumulator (A). Hasil disimpan kembali ke A. Mempengaruhi semua flag aritmatika.',
        flagEffects: {
          Z: 'Set jika hasil = 0',
          S: 'Set jika bit 7 hasil = 1 (negatif)',
          C: 'Set jika hasil > FFH (overflow)'
        },
        examples: [
          {
            code: 'LD A, 05H    ; A = 5\nLD B, 03H    ; B = 3\nADD A, B     ; A = 8 (05H + 03H)\nHALT',
            explanation: 'A = 08H, Flag: Z=0, S=0, C=0'
          },
          {
            code: 'LD A, FFH    ; A = 255\nADD A, 02H   ; A = 1 (overflow!)\nHALT',
            explanation: 'A = 01H, Flag: Z=0, S=0, C=1 (Carry menyala karena overflow)'
          }
        ]
      },
      {
        mnemonic: 'SUB',
        title: 'Subtract — Pengurangan',
        syntax: ['SUB reg', 'SUB n', 'SUB A, reg', 'SUB A, n'],
        description: 'Mengurangkan nilai operand dari Accumulator (A). Hasil disimpan kembali ke A.',
        flagEffects: {
          Z: 'Set jika hasil = 0',
          S: 'Set jika bit 7 hasil = 1',
          C: 'Set jika terjadi borrow (underflow)'
        },
        examples: [
          {
            code: 'LD A, 05H    ; A = 5\nSUB 05H      ; A = 0\nHALT',
            explanation: 'A = 00H, Flag: Z=1 (hasil nol!), S=0, C=0'
          }
        ]
      },
      {
        mnemonic: 'INC',
        title: 'Increment — Tambah 1',
        syntax: ['INC reg', 'INC A', 'INC B', 'INC HL'],
        description: 'Menambah 1 pada nilai register. Penting: INC TIDAK mempengaruhi Carry Flag.',
        flagEffects: {
          Z: 'Set jika hasil = 0',
          S: 'Set jika bit 7 hasil = 1',
          C: 'Tidak terpengaruh'
        },
        examples: [
          {
            code: 'LD A, FFH    ; A = 255\nINC A        ; A = 0 (overflow tapi C tetap 0!)\nHALT',
            explanation: 'A = 00H, Flag: Z=1, S=0, C=0 (Carry TIDAK berubah oleh INC)'
          }
        ]
      },
      {
        mnemonic: 'DEC',
        title: 'Decrement — Kurang 1',
        syntax: ['DEC reg', 'DEC A', 'DEC B', 'DEC HL'],
        description: 'Mengurangi 1 dari nilai register. Sering digunakan sebagai counter loop. Penting: DEC TIDAK mempengaruhi Carry Flag.',
        flagEffects: {
          Z: 'Set jika hasil = 0',
          S: 'Set jika bit 7 hasil = 1',
          C: 'Tidak terpengaruh'
        },
        examples: [
          {
            code: 'LD B, 03H    ; B = 3\nDEC B        ; B = 2\nDEC B        ; B = 1\nDEC B        ; B = 0, Zero Flag ON!\nHALT',
            explanation: 'B berkurang satu per satu. Saat B=0, Flag Z=1 menyala.'
          }
        ]
      },
      {
        mnemonic: 'CP',
        title: 'Compare — Perbandingan',
        syntax: ['CP reg', 'CP n', 'CP A, reg', 'CP A, n'],
        description: 'Membandingkan nilai Accumulator (A) dengan operand. Sama seperti SUB tetapi hasil TIDAK disimpan — hanya flag yang berubah. Sangat berguna sebelum instruksi percabangan.',
        flagEffects: {
          Z: 'Set jika A = operand',
          S: 'Set jika A < operand (signed)',
          C: 'Set jika A < operand (unsigned)'
        },
        examples: [
          {
            code: 'LD A, 05H\nCP 05H       ; Bandingkan A dengan 5\n; Flag: Z=1 (sama!), C=0\nCP 08H       ; Bandingkan A dengan 8\n; Flag: Z=0, C=1 (A lebih kecil)',
            explanation: 'CP mengubah flag tanpa mengubah nilai A. Berguna untuk keputusan percabangan.'
          }
        ]
      }
    ]
  },
  {
    id: 'logic',
    number: 5,
    title: 'Operasi Logika',
    color: '#a855f7',
    icon: 'Binary',
    description: 'Instruksi untuk melakukan operasi logika bitwise (AND, OR, XOR) pada data.',
    instructions: [
      {
        mnemonic: 'AND',
        title: 'AND — Logika AND',
        syntax: ['AND reg', 'AND n', 'AND A, reg'],
        description: 'Melakukan operasi logika AND bit per bit antara Accumulator (A) dan operand. Hasilnya disimpan ke A. Carry Flag selalu di-reset (C=0).',
        flagEffects: {
          Z: 'Set jika hasil = 0',
          S: 'Set jika bit 7 hasil = 1',
          C: 'Selalu 0 (reset)'
        },
        examples: [
          {
            code: 'LD A, 0FH    ; A = 00001111\nAND F0H      ; A = 00000000\nHALT',
            explanation: 'AND digunakan untuk masking bit. 0FH AND F0H = 00H, Flag Z=1'
          }
        ]
      },
      {
        mnemonic: 'OR',
        title: 'OR — Logika OR',
        syntax: ['OR reg', 'OR n', 'OR A, reg'],
        description: 'Melakukan operasi logika OR bit per bit antara Accumulator (A) dan operand. Hasilnya disimpan ke A. Carry Flag selalu di-reset.',
        flagEffects: {
          Z: 'Set jika hasil = 0',
          S: 'Set jika bit 7 hasil = 1',
          C: 'Selalu 0 (reset)'
        },
        examples: [
          {
            code: 'LD A, 0FH    ; A = 00001111\nOR F0H       ; A = 11111111 (FFH)\nHALT',
            explanation: 'OR menggabungkan bit. 0FH OR F0H = FFH.'
          }
        ]
      },
      {
        mnemonic: 'XOR',
        title: 'XOR — Logika Exclusive OR',
        syntax: ['XOR reg', 'XOR n', 'XOR A, reg'],
        description: 'Melakukan operasi logika XOR bit per bit. Trik umum: XOR A dengan dirinya sendiri (XOR A) akan mengosongkan register A menjadi 0 dengan sangat efisien.',
        flagEffects: {
          Z: 'Set jika hasil = 0',
          S: 'Set jika bit 7 hasil = 1',
          C: 'Selalu 0 (reset)'
        },
        examples: [
          {
            code: 'XOR A        ; A = 0 (cara efisien reset A!)\n; Sama dengan LD A, 00H tapi lebih cepat',
            explanation: 'XOR A, A selalu menghasilkan 0. Ini adalah idiom umum programmer Z-80.'
          }
        ]
      }
    ]
  },
  {
    id: 'branching',
    number: 6,
    title: 'Flag Register & Percabangan',
    color: '#f59e0b',
    icon: 'GitBranch',
    description: 'Flag Register menyimpan informasi status hasil operasi terakhir. Instruksi percabangan menggunakan flag ini untuk mengambil keputusan.',
    flagTable: [
      { flag: 'Z', name: 'Zero', bit: 'Bit 6', description: 'Set (=1) jika hasil operasi terakhir adalah nol' },
      { flag: 'S', name: 'Sign', bit: 'Bit 7', description: "Set (=1) jika bit 7 hasil = 1 (bilangan negatif pada Two's Complement)" },
      { flag: 'C', name: 'Carry', bit: 'Bit 0', description: 'Set (=1) jika terjadi overflow/underflow (hasil melebihi 8-bit)' }
    ],
    instructions: [
      {
        mnemonic: 'JP',
        title: 'Jump — Lompat Tak Bersyarat',
        syntax: ['JP addr', 'JP label', 'JP NZ, addr', 'JP Z, addr', 'JP NC, addr', 'JP C, addr'],
        description: 'Melompat ke alamat/label yang ditentukan. Bisa tanpa syarat (JP addr) atau bersyarat berdasarkan flag (JP NZ/Z/NC/C, addr).',
        flagEffects: null,
        examples: [
          {
            code: 'LD A, 05H\nDEC A\nJP NZ, 1     ; Ulangi DEC selama A ≠ 0\nHALT',
            explanation: 'Loop countdown: A berkurang dari 5 ke 0. JP NZ melompat selama Zero Flag belum aktif.'
          }
        ]
      },
      {
        mnemonic: 'JR',
        title: 'Jump Relative — Lompat Relatif',
        syntax: ['JR offset', 'JR NZ, offset', 'JR Z, offset', 'JR NC, offset', 'JR C, offset'],
        description: 'Melompat relatif terhadap posisi instruksi saat ini. Lebih efisien dari JP untuk lompatan jarak pendek. Mendukung kondisi flag yang sama dengan JP.',
        flagEffects: null,
        examples: [
          {
            code: 'JR NZ, label  ; Lompat jika Zero Flag = 0\nJR C, label   ; Lompat jika Carry Flag = 1',
            explanation: 'JR menggunakan offset relatif, lebih hemat memori dibanding JP yang menggunakan alamat absolut.'
          }
        ]
      },
      {
        mnemonic: 'DJNZ',
        title: 'Decrement and Jump if Not Zero',
        syntax: ['DJNZ label', 'DJNZ offset'],
        description: 'Instruksi loop khusus Z-80. Mengurangi register B sebanyak 1, lalu melompat ke label jika B belum nol. Menggantikan kombinasi DEC B + JP NZ.',
        flagEffects: null,
        examples: [
          {
            code: 'LD B, 05H     ; Counter = 5\nLOOP:\n  ; ... kode loop ...\n  DJNZ LOOP   ; B--, jika B≠0 ulangi\nHALT',
            explanation: 'Loop akan diulang 5 kali. DJNZ sangat efisien karena menggabungkan DEC B dan JP NZ.'
          }
        ]
      }
    ]
  },
  {
    id: 'stack',
    number: 7,
    title: 'Stack & Subrutin',
    color: '#ec4899',
    icon: 'Layers',
    description: 'Stack adalah struktur data LIFO (Last In, First Out) yang digunakan untuk menyimpan data sementara dan alamat kembali subrutin. PUSH dan POP digunakan untuk memanipulasi Stack.',
    content: 'Stack tumbuh dari alamat tinggi ke rendah. SP menunjuk ke posisi teratas. PUSH mengurangi SP, POP menambah SP. CALL menyimpan PC ke stack sebelum melompat. RET mengambil PC dari stack untuk kembali.',
    instructions: [
      {
        mnemonic: 'CALL',
        title: 'Call — Panggil Subrutin',
        syntax: ['CALL addr', 'CALL label', 'CALL NZ, addr', 'CALL Z, addr'],
        description: 'Memanggil subrutin di alamat yang ditentukan. Secara otomatis menyimpan alamat kembali (PC saat ini) ke Stack, kemudian melompat ke alamat subrutin. Mendukung pemanggilan bersyarat.',
        flagEffects: null,
        examples: [
          {
            code: 'LD A, 05H\nCALL KALI_DUA  ; Panggil subrutin\nHALT\n\nKALI_DUA:\n  ADD A, A     ; A = A * 2\n  RET          ; Kembali',
            explanation: 'CALL menyimpan alamat kembali ke Stack, lalu melompat ke KALI_DUA. RET mengembalikan eksekusi ke instruksi setelah CALL.'
          }
        ]
      },
      {
        mnemonic: 'RET',
        title: 'Return — Kembali dari Subrutin',
        syntax: ['RET', 'RET NZ', 'RET Z', 'RET NC', 'RET C'],
        description: 'Kembali dari subrutin. Mengambil alamat kembali dari Stack (yang sebelumnya disimpan oleh CALL) dan melompat ke alamat tersebut. SP bertambah 2.',
        flagEffects: null,
        examples: [
          {
            code: 'SUBRUTIN:\n  ; ... proses ...\n  RET          ; Kembali ke pemanggil',
            explanation: 'RET mengambil 2 byte dari Stack, mengembalikan PC ke posisi setelah instruksi CALL.'
          }
        ]
      }
    ]
  },
  {
    id: 'control',
    number: 8,
    title: 'Kontrol Eksekusi',
    color: '#ef4444',
    icon: 'StopCircle',
    description: 'Instruksi untuk mengatur status operasi keseluruhan dari mikroprosesor CPU Z-80.',
    instructions: [
      {
        mnemonic: 'HALT',
        title: 'Halt — Hentikan CPU',
        syntax: ['HALT'],
        description: 'Menghentikan seluruh eksekusi CPU. Program berhenti total. Setiap program assembly Z-80 yang baik harus diakhiri dengan HALT untuk mencegah CPU mengeksekusi data acak di memori.',
        flagEffects: null,
        examples: [
          {
            code: 'LD A, 42H\n; ... proses ...\nHALT         ; Program selesai',
            explanation: 'HALT menandai akhir program. CPU tidak akan mengeksekusi instruksi lagi setelah HALT.'
          }
        ]
      },
      {
        mnemonic: 'NOP',
        title: 'No Operation — Tidak Melakukan Apa-apa',
        syntax: ['NOP'],
        description: 'Instruksi kosong yang hanya menggeser Program Counter (PC) tanpa melakukan operasi apapun. Berguna untuk placeholder atau timing.',
        flagEffects: null,
        examples: [
          {
            code: 'NOP          ; Tidak terjadi apa-apa\nNOP          ; PC hanya maju',
            explanation: 'NOP sering digunakan untuk padding atau timing delay.'
          }
        ]
      }
    ]
  }
];
