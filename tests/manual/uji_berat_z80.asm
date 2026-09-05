; ================================================================
; UJI BERAT Z-80 SIMULATOR — 11 TAHAP
;
; Cara pakai:
;   1. Tempel/impor kode ini, lalu tekan LOAD.
;   2. Tekan RUN (atau STEP untuk menelusuri).
;   3. Arahkan Memory Editor ke alamat 2000H.
;
; HASIL YANG DIHARAPKAN — 2000H sampai 200CH:
;   2000 2001 2002 2003 2004 2005 2006 2007 2008 2009 200A 200B 200C
;    00   00   67   00   01   5A   73   1A   02   C3   01   34   EE
;
; Register akhir: A=EE B=12 C=34 D=33 E=03 H=33 L=02
;                 IX=804A  I=AA  SP=FFFF
; PC berhenti di 804CH. Bila ORG diabaikan, PC akan berhenti di 004CH.
; ================================================================

ORG 8000H

; --- Tahap 1: DJNZ melompat ke labelnya sendiri ---------------
; Menguji deteksi lompatan. Bila executor menebak lompatan dengan
; membandingkan nilai PC, loop ini keluar terlalu cepat dan B != 0.
        LD B, 05H
DIRI:   DJNZ DIRI
        LD A, B
        LD (2000H), A          ; harap 00H

; --- Tahap 2: label bernama sama dengan register ---------------
; Label "C" bentrok dengan register C, yang tetap dipakai di Tahap 8.
        LD B, 04H
C:      DEC B
        JP NZ, C
        LD A, B
        LD (2001H), A          ; harap 00H

; --- Tahap 3: BCD 28 + 39 = 67 --------------------------------
        LD A, 28H
        ADD A, 39H
        DAA
        LD (2002H), A          ; harap 67H

; --- Tahap 4: BCD 99 + 01 = 00 dengan bawaan ratusan ----------
; LD tidak menyentuh flag, jadi Carry bertahan sampai ADC membacanya.
        LD A, 99H
        ADD A, 01H
        DAA
        LD (2003H), A          ; harap 00H
        LD A, 00H
        ADC A, 00H
        LD (2004H), A          ; harap 01H (nilai Carry)

; --- Tahap 5: indeks, offset heksadesimal dan spasi -----------
        LD IX, 3000H
        LD A, 5AH
        LD (IX + 0AH), A       ; spasi di dalam kurung
        LD A, 00H
        LD A, (IX+0AH)         ; offset heksadesimal
        LD (2005H), A          ; harap 5AH

; --- Tahap 6: RLD memutar tiga digit BCD ----------------------
; Contoh manual Zilog: A=7AH, (HL)=31H  ->  A=73H, (HL)=1AH
        LD HL, 3100H
        LD (HL), 31H
        LD A, 7AH
        RLD
        LD (2006H), A          ; harap 73H
        LD A, (HL)
        LD (2007H), A          ; harap 1AH

; --- Tahap 7: LDIR menyalin blok, CPIR mencari isinya ---------
        LD HL, 3200H
        LD (HL), 11H
        INC HL
        LD (HL), 22H
        INC HL
        LD (HL), 33H
        LD HL, 3200H
        LD DE, 3300H
        LD BC, 0003H
        LDIR
        LD A, 22H
        LD HL, 3300H
        LD BC, 0003H
        CPIR                   ; berhenti tepat SESUDAH yang cocok
        LD A, L
        LD (2008H), A          ; harap 02H

; --- Tahap 8: kirim ke port lalu baca kembali -----------------
        LD A, 0C3H
        LD C, 40H              ; register C, bukan label "C" di Tahap 2
        OUT (C), A
        LD A, 00H
        IN A, (C)
        LD (2009H), A          ; harap C3H

; --- Tahap 9: IFF2 terbaca lewat LD A,I pada flag P/V ---------
; EI menyalakan IFF2, LD A,I menyalinnya ke P/V, jadi PO tidak diambil.
        LD A, 0AAH
        LD I, A
        EI
        LD A, I
        JP PO, SALAH
        LD A, 01H
        JP SIMPAN
SALAH:  LD A, 0FFH
SIMPAN: LD (200AH), A          ; harap 01H

; --- Tahap 10: shadow register lewat EXX ----------------------
        LD BC, 1234H
        EXX
        LD BC, 5678H
        EXX                    ; BC kembali ke 1234H
        LD A, C
        LD (200BH), A          ; harap 34H

; --- Tahap 11: lompatan terhitung lewat JP (IX) ---------------
        LD IX, AKHIR
        JP (IX)
        LD A, 0FFH             ; harus terlewati
        LD (200CH), A
AKHIR:  LD A, 0EEH
        LD (200CH), A          ; harap EEH
        HALT
