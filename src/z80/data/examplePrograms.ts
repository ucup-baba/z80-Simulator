export interface ExampleProgram {
  id: string;
  title: string;
  category: string;
  difficulty: 'mudah' | 'sedang' | 'lanjut';
  description: string;
  code: string;
  learningObjective: string;
}

export const examplePrograms: ExampleProgram[] = [
  {
    id: 'basic-addition',
    title: 'Penjumlahan Dasar',
    category: 'Aritmatika',
    difficulty: 'mudah',
    description: 'Program sederhana untuk menjumlahkan dua bilangan menggunakan register.',
    learningObjective: 'Memahami instruksi LD dan ADD, serta cara menggunakan Accumulator.',
    code: `; Program: Penjumlahan Dasar

ORG 0000H

    LD A, 05H       ; Load 05H ke dalam Accumulator (A)
    LD B, 03H       ; Load 03H ke dalam register B
    ADD A, B        ; Tambahkan nilai B ke A (A = A + B)
    
    ; Simpan hasil ke memori
    LD HL, 0050H    ; Set pointer HL ke memori 0050H
    LD (HL), A      ; Simpan hasil (08H) ke alamat memori tersebut
    
    HALT            ; Hentikan CPU`
  },
  {
    id: 'overflow-underflow',
    title: 'Boundary Overflow/Underflow',
    category: 'Aritmatika',
    difficulty: 'sedang',
    description: 'Mendemonstrasikan perilaku overflow (melewati FFH) dan underflow (melewati 00H) pada register 8-bit.',
    learningObjective: 'Memahami batasan 8-bit, Carry Flag, dan Zero Flag.',
    code: `; Program: Boundary Overflow/Underflow

ORG 0000H

    ; Demonstrasi Overflow
    LD A, 0FFH      ; Load FFH (255) ke Accumulator
    INC A           ; Increment A, terjadi overflow ke 00H. Zero Flag = 1
    
    ; Demonstrasi Underflow
    DEC A           ; Decrement A, terjadi underflow ke FFH.
    
    ; Demonstrasi Overflow dengan Carry
    ADD A, 02H      ; Tambahkan 02H ke FFH, hasil 01H. Carry Flag = 1 (melewati batas kapasitas)
    
    HALT            ; Hentikan CPU`
  },
  {
    id: 'countdown-loop',
    title: 'Countdown Loop',
    category: 'Kendali Program',
    difficulty: 'sedang',
    description: 'Loop hitung mundur menggunakan DEC dan JP NZ untuk memahami konsep percabangan.',
    learningObjective: 'Memahami instruksi DEC, Zero Flag, dan percabangan JP NZ.',
    code: `; Program: Countdown Loop

ORG 0000H

    LD A, 05H       ; Load 05H (5) ke dalam Accumulator (A) sebagai counter
    
LOOP:
    DEC A           ; Kurangi nilai A (A = A - 1). Jika A = 0, Zero Flag akan menyala (Z=1)
    JP NZ, LOOP     ; Lompat kembali ke label LOOP jika Zero Flag belum menyala (Not Zero)
    
    HALT            ; Hentikan CPU`
  },
  {
    id: 'memory-copy',
    title: 'Memory Copy',
    category: 'Transfer Data',
    difficulty: 'sedang',
    description: 'Menyalin blok data dari satu lokasi memori ke lokasi lain menggunakan pointer register HL dan DE.',
    learningObjective: 'Memahami pengalamatan indirect melalui register HL, serta penggunaan loop dan counter.',
    code: `; Program: Memory Copy — Salin Blok Data
; Menyalin 5 byte dari alamat 0050H ke 0060H

ORG 0000H

    LD HL, 0050H    ; Pointer sumber
    LD B, 05H       ; Counter: 5 byte

    ; Isi data sumber terlebih dahulu
    LD A, 11H
    LD (HL), A
    INC HL
    LD A, 22H
    LD (HL), A
    INC HL
    LD A, 33H
    LD (HL), A
    INC HL
    LD A, 44H
    LD (HL), A
    INC HL
    LD A, 55H
    LD (HL), A

    ; Reset pointer sumber dan siapkan tujuan
    LD HL, 0050H
    LD D, 00H
    LD E, 60H       ; Kita gunakan DE = 0060H untuk menyimpan alamat tujuan (membutuhkan save/restore H/L)
    LD B, 05H

COPY:
    LD A, (HL)      ; Baca dari sumber
    PUSH HL         ; Simpan pointer sumber ke stack
    LD H, D         ; Load high byte tujuan
    LD L, E         ; Load low byte tujuan
    LD (HL), A      ; Tulis ke tujuan
    POP HL          ; Kembalikan pointer sumber dari stack
    INC HL          ; Geser pointer sumber
    INC E           ; Geser pointer tujuan (asumsi E tidak overflow melewati FFH)
    DEC B           ; Kurangi counter
    JP NZ, COPY     ; Ulangi jika belum selesai

    HALT            ; Hentikan CPU`
  },
  {
    id: 'fibonacci',
    title: 'Fibonacci & Overflow Trap',
    category: 'Lanjutan',
    difficulty: 'lanjut',
    description: 'Menghitung deret Fibonacci dan menyimpannya ke memori, dengan deteksi overflow menggunakan Carry Flag.',
    learningObjective: 'Memahami kombinasi ALU, memory write, pointer HL, counter B, Zero Flag, dan Carry Flag secara bersamaan.',
    code: `; ========================================================
; STRESS TEST Z-80: DERET FIBONACCI & OVERFLOW TRAP
; Menguji: ALU, Memory Write, HL Pointer, B Counter, 
;          Zero Flag (Z), dan Carry Flag (C).
; ========================================================

ORG 0000H

    LD HL, 0050H    ; Set HL sebagai pointer memori ke alamat 0050H
    LD B, 0FH       ; Set Counter Loop ke 15 (0FH) agar mencapai angka ke-15
    LD D, 00H       ; Angka pertama (0)
    LD E, 01H       ; Angka kedua (1)

    ; Simpan dua angka pertama secara manual ke RAM
    LD (HL), D      
    INC HL          
    LD (HL), E      
    INC HL          
    
    DEC B           ; Kurangi counter (karena 2 angka sudah masuk)
    DEC B           

LOOP_FIB:
    LD A, D         ; Pindahkan nilai D ke Accumulator (A)
    ADD A, E        ; A = A + E (Proses Penjumlahan Fibonacci)

    ; --- JEBAKAN FLAG ---
    ; Deret ke-15 adalah 377 (144 + 233). Karena arsitektur 8-bit maksimal 255,
    ; penjumlahan ini akan JEBOL (Overflow) dan menyalakan CARRY FLAG (C)!
    JP C, OVERFLOW  ; Lompat ke label OVERFLOW jika Carry Flag = 1

    LD (HL), A      ; Jika aman, simpan hasil penjumlahan ke memori
    INC HL          ; Geser pointer HL ke alamat berikutnya

    ; Geser variabel untuk putaran berikutnya (D <- E, E <- A)
    LD D, E         
    LD E, A         

    DEC B           ; Kurangi counter (B = B - 1)
    JP NZ, LOOP_FIB ; Jika Zero Flag belum menyala, ulangi loop!

    JP SELESAI      ; Jika loop selesai normal, lompat ke Akhir

OVERFLOW:
    LD A, 0FFH      ; Masukkan nilai FF (255) sebagai KODE ERROR
    LD (HL), A      ; Tulis KODE ERROR tersebut ke memori terakhir

SELESAI:
    HALT            ; Matikan CPU`
  },
  {
    id: 'sum-loop',
    title: 'Penjumlahan Loop 1..10',
    category: 'Aritmatika',
    difficulty: 'sedang',
    description: 'Menjumlahkan bilangan 1 sampai 10 menggunakan loop. Hasil akhir: 55 (37H).',
    learningObjective: 'Memahami konsep akumulasi nilai dalam loop dan penggunaan register B sebagai counter.',
    code: `; Program: Penjumlahan 1 + 2 + 3 + ... + 10
; Hasil akhir: A = 55 (37H)

ORG 0000H

    LD A, 00H       ; Accumulator = 0 (penampung hasil)
    LD B, 0AH       ; Counter = 10 (jumlah iterasi)
    LD C, 01H       ; Nilai awal yang akan ditambahkan

LOOP_SUM:
    ADD A, C        ; A = A + C (tambahkan nilai saat ini)
    INC C           ; C++ (naikkan nilai untuk iterasi berikutnya)
    DEC B           ; B-- (kurangi counter)
    JP NZ, LOOP_SUM ; Ulangi jika B belum 0

    ; Simpan hasil ke memori
    LD HL, 0050H
    LD (HL), A      ; Simpan 37H (55) ke alamat 0050H

    HALT            ; Hentikan CPU`
  },
  {
    id: 'find-max',
    title: 'Pencarian Nilai Maksimum',
    category: 'Lanjutan',
    difficulty: 'lanjut',
    description: 'Mencari nilai terbesar dari sekumpulan data di memori menggunakan instruksi CP (Compare).',
    learningObjective: 'Memahami instruksi CP untuk perbandingan, percabangan bersyarat, dan algoritma pencarian.',
    code: `; Program: Cari Nilai Maksimum dari 5 Data
; Data: 15H, 42H, 08H, 7FH, 23H → Maks = 7FH

ORG 0000H

    ; Siapkan data di memori mulai 0050H
    LD HL, 0050H
    LD A, 15H
    LD (HL), A
    INC HL
    LD A, 42H
    LD (HL), A
    INC HL
    LD A, 08H
    LD (HL), A
    INC HL
    LD A, 7FH
    LD (HL), A
    INC HL
    LD A, 23H
    LD (HL), A

    ; Mulai pencarian
    LD HL, 0050H    ; Pointer ke data pertama
    LD B, 05H       ; Jumlah data
    LD A, (HL)      ; Ambil data pertama sebagai kandidat maks
    DEC B           ; Sudah 1 data diproses
    INC HL

CEK_MAKS:
    CP (HL)         ; Bandingkan A dengan data berikutnya (A - (HL))
    JP NC, LEWATI   ; Jika A >= (HL), lewati (No Carry = A lebih besar)
    LD A, (HL)      ; Jika A < (HL), ganti kandidat maks dengan (HL)

LEWATI:
    INC HL          ; Geser pointer ke data berikutnya
    DEC B           ; Kurangi counter
    JP NZ, CEK_MAKS ; Ulangi jika masih ada data

    ; A sekarang berisi nilai maksimum (7FH = 127)
    LD HL, 0060H
    LD (HL), A      ; Simpan hasil maks ke alamat 0060H

    HALT            ; Hentikan CPU`
  },
  {
    id: 'stack-subroutine',
    title: 'Operasi Stack & Subrutin',
    category: 'Stack & Subrutin',
    difficulty: 'sedang',
    description: 'Mendemonstrasikan inisialisasi Stack Pointer (SP), menyimpan/mengambil data dengan PUSH/POP, dan pemanggilan subrutin dengan CALL/RET.',
    learningObjective: 'Memahami mekanisme LIFO Stack, perubahan SP, penyimpanan return address, dan penggunaan PUSH/POP.',
    code: `; Program: Operasi Stack & Subrutin (PUSH / POP / CALL / RET)

ORG 0000H

    ; 1. Inisialisasi Stack Pointer di alamat 1000H
    LD SP, 1000H

    ; 2. Simpan nilai register BC dan DE ke Stack
    LD BC, 1234H    ; BC = 1234H
    LD DE, 5678H    ; DE = 5678H
    PUSH BC         ; Simpan BC ke Stack (SP berkurang 2)
    PUSH DE         ; Simpan DE ke Stack (SP berkurang 2 lagi)

    ; 3. Ambil data dari Stack ke pasangan register lain
    POP HL          ; HL menerima data teratas Stack -> HL = 5678H
    POP AF          ; AF menerima data berikutnya -> A = 12H, F = 34H

    ; 4. Panggil Subrutin menggunakan CALL
    CALL SUBRUTIN_HITUNG

    HALT            ; Program utama selesai

; --- SUBRUTIN ---
SUBRUTIN_HITUNG:
    LD A, 05H
    ADD A, 03H      ; A = 08H
    RET             ; Kembali ke instruksi setelah CALL (alamat di-POP dari Stack)`
  }
];
