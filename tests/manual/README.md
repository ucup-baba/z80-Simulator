# Uji Manual

Program assembly untuk memeriksa simulator lewat antarmukanya — melengkapi
`npm test`, yang hanya menguji logika inti tanpa menyentuh UI.

## uji_berat_z80.asm

Sebelas tahap yang masing-masing menyasar jalur paling rawan: lompatan ke
label sendiri, label bernama sama dengan register, DAA, pengalamatan
terindeks, RLD, LDIR/CPIR, port I/O, IFF2 lewat `LD A,I`, shadow register,
dan `JP (IX)`.

**Cara menjalankan**

1. Impor atau tempel isinya ke editor, lalu tekan **LOAD**.
2. Tekan **RUN**.
3. Arahkan Memory Editor ke **2000H**.

**Hasil yang diharapkan** — 2000H sampai 200CH:

| 2000 | 2001 | 2002 | 2003 | 2004 | 2005 | 2006 | 2007 | 2008 | 2009 | 200A | 200B | 200C |
|------|------|------|------|------|------|------|------|------|------|------|------|------|
| 00   | 00   | 67   | 00   | 01   | 5A   | 73   | 1A   | 02   | C3   | 01   | 34   | EE   |

PC harus berhenti di **804CH**. Bila berhenti di 004CH, direktif `ORG`
sedang diabaikan.

Rincian tiap tahap ada sebagai komentar di dalam berkasnya.

## Catatan

Nilai harapan di atas diturunkan dari semantik Z-80 (RLD memakai contoh
manual Zilog, DAA dari aritmetika BCD), lalu dicocokkan dengan engine.
Karena engine itu pula yang sedang diuji, berkas ini kuat sebagai
pemeriksaan jalur UI dan patokan regresi — bukan pembanding independen
terhadap perangkat keras asli.
