# 📘 Panduan Penggunaan Z-80 Simulator

## 🎯 Panduan Lengkap untuk Pemula

---

## 1️⃣ Mulai dengan Assembler

### Langkah 1: Buka Simulator
Simulator sudah siap digunakan dengan program default yang sudah dimuat.

### Langkah 2: Lihat Program Default
Di tab **Assembler**, Anda akan melihat kode:

```assembly
; Z-80 Assembly Example
; Simple arithmetic program

LD A, 10H    ; Load 16 into A
LD B, 05H    ; Load 5 into B
ADD B        ; Add B to A
INC A        ; Increment A
HALT         ; Stop execution
```

### Langkah 3: Load Program
**Klik tombol "Load"** (atau tekan `Ctrl+L`)

✅ Anda akan lihat pesan di Execution Log:
```
✓ Program loaded successfully (5 instructions)
```

### Langkah 4: Eksekusi Step-by-Step
**Klik "Step"** (atau `Ctrl+S`) berulang kali:

**Step 1:** `LD A, 10H`
- Lihat **Register Dashboard** (panel kanan)
- Register **A** berubah dari `00` → `10`
- **PC** berubah dari `0000` → `0001`

**Step 2:** `LD B, 05H`
- Register **B** berubah `00` → `05`
- **PC** berubah `0001` → `0002`

**Step 3:** `ADD B`
- Register **A** berubah `10` → `15` (16 + 5 = 21 dalam desimal)
- **Flags** berubah (perhatikan SF, ZF, CF, dll)
- **PC** berubah `0002` → `0003`

**Step 4:** `INC A`
- Register **A** berubah `15` → `16`
- **PC** berubah `0003` → `0004`

**Step 5:** `HALT`
- Status berubah menjadi **"Halted"**
- Program berhenti

### Langkah 5: Reset untuk Ulang
**Klik "Reset"** untuk reset CPU dan coba lagi!

---

## 2️⃣ Menggunakan Memory Editor

### Scenario: Edit Memory Langsung

#### Langkah 1: Switch ke Tab "Memory Editor"
Klik tab **"Memory Editor"** di bagian atas

#### Langkah 2: Lihat Memory
Anda akan melihat hex dump:
```
Address  +0 +1 +2 +3 +4 +5 ... +F  ASCII
0000     00 00 00 00 00 00 ... 00  ................
0010     00 00 00 00 00 00 ... 00  ................
```

#### Langkah 3: Edit Cell Memory
1. **Double-click** pada cell di address `0100H`
2. Cell berubah menjadi **input box biru**
3. **Ketik** nilai baru: `42`
4. **Tekan Enter** untuk save

✅ Anda akan lihat:
- Cell berubah dari `00` → `42`
- Execution log: `Memory write: @0100H = 42H`

#### Langkah 4: Jump ke Address Tertentu
1. Ketik `0100` di **Jump to address** input box
2. **Tekan Enter**
3. View akan auto-scroll ke address 0100H

#### Langkah 5: Buat Program yang Baca Memory
1. Switch kembali ke tab **"Assembler"**
2. Ganti kode dengan:

```assembly
LD HL, 0100H   ; Point to address 0100H
LD A, (HL)     ; Load value from memory
INC A          ; Increment (42H + 1 = 43H)
HALT
```

3. **Klik "Load"**
4. **Klik "Run"**
5. Lihat Register **A** sekarang = `43H`! ✅

---

## 3️⃣ Menggunakan Watch Variables

### Scenario: Monitor Register dan Memory

#### Langkah 1: Switch ke Tab "Watch"
Klik tab **"Watch"**

#### Langkah 2: Add Watch untuk Register
1. Pilih **Type: Register** (dropdown)
2. Pilih **Register: A** (dropdown kedua)
3. Ketik **Name**: `Accumulator`
4. **Klik "Add Watch"**

✅ Watch muncul di list dengan value real-time!

#### Langkah 3: Add Watch untuk Memory
1. Pilih **Type: Memory**
2. Ketik **Address**: `0100` (dalam hex)
3. Ketik **Name**: `Data Location`
4. **Klik "Add Watch"**

#### Langkah 4: Add Lebih Banyak Watches
Tambahkan watches untuk:
- **Register B** → Name: `Counter`
- **Register HL** → Name: `Pointer`
- **Register PC** → Name: `Program Counter`

#### Langkah 5: Run Program dan Monitor
1. Switch ke tab **"Assembler"**
2. Load program (contoh di atas)
3. **Klik "Step"** beberapa kali
4. Switch kembali ke tab **"Watch"**
5. **Lihat semua values update real-time!** 🎉

#### Langkah 6: Change Display Format
**Klik pada value** untuk cycle format:
- **Hex**: `0x10`
- **Decimal**: `16`
- **Binary**: `0b00010000`

Klik lagi → berubah ke format berikutnya!

#### Langkah 7: Remove Watch
Klik **tombol X** di sebelah kanan watch untuk hapus.

---

## 4️⃣ Example Complete Workflow

### Project: Hitung Sum dari 1 sampai 10

#### Step 1: Setup Memory (di Memory Editor)
1. Tab **"Memory Editor"**
2. Double-click `0200H` → ketik `01`
3. Double-click `0201H` → ketik `02`
4. Double-click `0202H` → ketik `03`
5. Double-click `0203H` → ketik `04`
6. Double-click `0204H` → ketik `05`
7. Double-click `0205H` → ketik `06`
8. Double-click `0206H` → ketik `07`
9. Double-click `0207H` → ketik `08`
10. Double-click `0208H` → ketik `09`
11. Double-click `0209H` → ketik `0A` (10 dalam hex)

#### Step 2: Add Watches
Tab **"Watch"**, tambahkan:
1. Register **A** → `Sum`
2. Register **B** → `Counter`
3. Register **HL** → `Memory Pointer`
4. Memory **@0200H** → `First Number`

#### Step 3: Write Program
Tab **"Assembler"**:

```assembly
; Sum numbers from 0200H to 0209H (1 to 10)

LD HL, 0200H   ; Point to first number
LD A, 00H      ; Sum = 0
LD B, 0AH      ; Counter = 10 numbers

loop:
  LD C, (HL)   ; Load current number into C
  ADD A, C     ; Add to sum
  INC HL       ; Move to next number
  DEC B        ; Decrease counter
  JP NZ, loop  ; Loop if counter != 0

HALT           ; A now contains sum (55 = 0x37)
```

#### Step 4: Execute
1. **Klik "Load"**
2. **Klik "Step"** berulang untuk lihat detail
   - Atau **"Run"** untuk execute semua sekaligus

#### Step 5: Verify Result
1. Tab **"Watch"**
2. Lihat **Sum (Register A)** = `37H` (55 desimal)
3. Klik value untuk lihat format decimal → `55` ✅

**Selamat! Program berhasil!** 🎉

---

## 5️⃣ Tips & Tricks

### 💡 Tip 1: Keyboard Shortcuts
- `Ctrl+L` → Load program
- `Ctrl+S` → Step (satu instruksi)
- `Ctrl+R` → Run sampai selesai

### 💡 Tip 2: Watch Format Cycling
Klik value berulang untuk lihat:
- **Hex** → Bagus untuk addresses
- **Decimal** → Bagus untuk counters
- **Binary** → Bagus untuk lihat bit patterns

### 💡 Tip 3: Memory Editor Quick Jump
Ketik address langsung di jump box:
- `0100` → Jump ke 0100H
- `FF00` → Jump ke FF00H
- Tekan Enter untuk loncat!

### 💡 Tip 4: Debug dengan Watch
Sebelum run program:
1. Add watches untuk semua register penting
2. Add watches untuk memory locations yang dipakai
3. Step through dan monitor perubahan

### 💡 Tip 5: Pre-load Test Data
Gunakan Memory Editor untuk:
- Setup data sebelum program run
- Simulate input data
- Test edge cases

---

## 6️⃣ Troubleshooting

### ❌ "No program loaded"
**Solusi:** Klik "Load" dulu sebelum Step/Run

### ❌ "CPU is halted"
**Solusi:** Klik "Reset" untuk restart CPU

### ❌ "Parse error"
**Solusi:**
- Periksa syntax assembly
- Pastikan pakai mnemonic yang valid
- Hex number harus format: `10H` atau `0x10`

### ❌ Watch tidak update
**Solusi:**
- Pastikan sudah execute program (Step/Run)
- Periksa address/register yang diwatch benar

### ❌ Memory edit gagal
**Solusi:**
- Pastikan value dalam range 00-FF
- Tekan Enter setelah ketik value
- Esc untuk cancel

---

## 7️⃣ Latihan Praktis

### Latihan 1: Countdown Timer
```assembly
LD A, 0AH      ; Start from 10
loop:
  DEC A        ; Countdown
  JP NZ, loop  ; Repeat until 0
HALT
```

**Setup Watch:** Register A
**Expected:** A berubah 0A → 09 → 08 → ... → 00

---

### Latihan 2: Copy Memory
```assembly
LD HL, 0100H   ; Source address
LD DE, 0200H   ; Destination address
LD B, 05H      ; Copy 5 bytes

loop:
  LD A, (HL)   ; Load from source
  LD (DE), A   ; Store to destination
  INC HL       ; Next source
  INC DE       ; Next destination
  DEC B
  JP NZ, loop
HALT
```

**Setup:**
1. Memory Editor: Isi 0100H-0104H dengan data
2. Watch: HL, DE, B
3. Run dan lihat data tercopy!

---

### Latihan 3: Find Maximum
```assembly
; Find max dari 3 numbers di 0100H, 0101H, 0102H
LD HL, 0100H
LD A, (HL)     ; First number
INC HL
LD B, (HL)     ; Second number
CP B           ; Compare A with B
JP NC, skip1   ; If A >= B, skip
LD A, B        ; Else, A = B
skip1:
INC HL
LD B, (HL)     ; Third number
CP B
JP NC, skip2
LD A, B
skip2:
HALT           ; A = maximum
```

**Setup Memory:**
- 0100H = 15H
- 0101H = 0AH
- 0102H = 20H

**Expected:** A = 20H

---

## 8️⃣ Fitur Register Dashboard

### Main Registers (Kolom Kiri)
- **A-L**: 8-bit registers
- Register **A** di-highlight (Accumulator)
- **Main F**: 8 flags (SF, ZF, YF, HF, XF, PF, NF, CF)

### Alternate Registers (Kolom Tengah)
- **A'-L'**: Shadow registers
- **Alternate F'**: Shadow flags
- Untuk instruksi EX (future)

### Performance & Info (Kolom Kanan)
- **Last Instruction**: Instruksi terakhir
- **Clock Cycles**: Total cycles
- **Instructions**: Total instruksi
- **16-bit Pairs**: BC, DE, HL, IX, IY, PC, SP
- **Special Regs**: I, R
- **Interrupt**: IFF1, IFF2, IM

### Flags Explained
- **SF (Sign)**: Set jika result negative (bit 7 = 1)
- **ZF (Zero)**: Set jika result = 0
- **HF (Half-carry)**: Carry dari bit 3 ke 4
- **CF (Carry)**: Overflow/underflow
- **PF (Parity)**: Parity atau overflow
- **NF (Add/Sub)**: 0=ADD, 1=SUB
- **YF, XF**: Undocumented flags

---

## 9️⃣ Common Patterns

### Pattern 1: Initialize Registers
```assembly
LD A, 00H
LD B, 00H
LD HL, 0000H
```

### Pattern 2: Loop dengan Counter
```assembly
LD B, 10      ; Counter
loop:
  ; ... code ...
  DEC B
  JP NZ, loop
```

### Pattern 3: Memory Scan
```assembly
LD HL, 0100H  ; Start address
LD B, 10H     ; Count
loop:
  LD A, (HL)  ; Read
  ; ... process ...
  INC HL
  DEC B
  JP NZ, loop
```

---

## 🎓 Best Practices

### ✅ DO:
1. **Add watches** sebelum run program
2. **Use Step** untuk debug, **Run** untuk hasil final
3. **Name your watches** dengan nama deskriptif
4. **Pre-load test data** di Memory Editor
5. **Reset CPU** sebelum run ulang

### ❌ DON'T:
1. Jangan lupa **HALT** di akhir program
2. Jangan expect memory retain setelah Reset
3. Jangan edit memory saat program running
4. Jangan lupa Load sebelum Run

---

## 🎯 Quick Reference Card

| Tab | Fungsi | Shortcut |
|-----|--------|----------|
| **Assembler** | Write & execute code | - |
| **Memory Editor** | View/edit memory | Double-click cell |
| **Watch** | Monitor variables | Click value = cycle format |

| Button | Fungsi | Shortcut |
|--------|--------|----------|
| **Load** | Parse & load program | Ctrl+L |
| **Step** | Execute 1 instruction | Ctrl+S |
| **Run** | Execute all | Ctrl+R |
| **Reset** | Clear CPU state | - |

| Memory Editor | Action |
|---------------|--------|
| **Double-click cell** | Edit value |
| **Enter** | Save edit |
| **Esc** | Cancel edit |
| **Jump box** | Navigate to address |

| Watch Panel | Action |
|-------------|--------|
| **Click value** | Cycle hex/dec/bin |
| **Click X** | Remove watch |
| **Add Watch** | Add new monitor |

---

## 🏁 Kesimpulan

Sekarang Anda sudah tahu cara:

✅ Load dan execute program assembly
✅ Step-by-step debugging
✅ Edit memory langsung
✅ Monitor variables dengan Watch
✅ Switch between tabs untuk workflow
✅ Interpret flags dan registers
✅ Pre-load test data
✅ Debug program dengan systematic approach

**Selamat belajar Z-80 Assembly!** 🎉

---

## 📚 Next Steps

1. **Coba semua latihan** di dokumen ini
2. **Write your own programs**
3. **Experiment** dengan flag behavior
4. **Test edge cases** (overflow, underflow)
5. **Explore** semua fitur yang tersedia

**Happy Coding!** 💻✨
