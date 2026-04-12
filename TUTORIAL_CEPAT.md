# ⚡ Tutorial Cepat - 5 Menit Pertama

## 🎮 Langsung Pakai dalam 5 Menit!

---

## ⭐ Tutorial 1: Hello World (2 menit)

### 1. Load Program Default
```
Klik tombol biru "Load" di bawah
(atau tekan Ctrl+L)
```

✅ Lihat pesan: "Program loaded successfully"

---

### 2. Execute Step-by-Step
```
Klik "Step" 5 kali
(atau tekan Ctrl+S berkali-kali)
```

**Perhatikan panel kanan (Register Dashboard):**
- Register **A** berubah: `00` → `10` → `15` → `16`
- Register **B** berubah: `00` → `05`
- **PC** (Program Counter) increment: `0000` → `0001` → `0002` ...

---

### 3. Reset & Run All
```
1. Klik "Reset" (merah)
2. Klik "Load" lagi
3. Klik "Run" (hijau)
```

✅ Program execute semuanya sekaligus!
✅ Lihat Execution Log untuk detail

---

## ⭐ Tutorial 2: Memory Editor (3 menit)

### 1. Switch ke Memory Editor
```
Klik tab "Memory Editor" di atas
```

---

### 2. Edit Memory
```
1. Double-click pada cell address 0100H
2. Ketik: 42
3. Tekan Enter
```

✅ Cell berubah dari `00` menjadi `42`!
✅ Lihat log: "Memory write: @0100H = 42H"

---

### 3. Buat Program Baca Memory
```
1. Switch ke tab "Assembler"
2. Ganti kode dengan:
```

```assembly
LD HL, 0100H
LD A, (HL)
HALT
```

```
3. Klik "Load"
4. Klik "Run"
```

✅ Register **A** sekarang = `42H`!

---

## ⭐ Tutorial 3: Watch Variables (2 menit)

### 1. Switch ke Watch Tab
```
Klik tab "Watch"
```

---

### 2. Add Watch untuk Register A
```
1. Type: Register (default)
2. Register: A
3. Name: "My Counter"
4. Klik "Add Watch"
```

✅ Watch muncul dengan value real-time!

---

### 3. Run Program & Monitor
```
1. Switch ke "Assembler"
2. Load program default
3. Klik "Step" beberapa kali
4. Switch kembali ke "Watch"
```

✅ Lihat value **A** berubah real-time!

---

### 4. Change Format
```
Klik pada value "0x10"
```

- Klik 1x → `16` (decimal)
- Klik 2x → `0b00010000` (binary)
- Klik 3x → `0x10` (hex lagi)

---

## 🎯 Cheat Sheet

### Tabs
```
[Assembler]     → Write code
[Memory Editor] → Edit memory
[Watch]         → Monitor variables
```

### Buttons
```
[Load]  Ctrl+L  → Parse code
[Step]  Ctrl+S  → Execute 1 line
[Run]   Ctrl+R  → Execute all
[Reset]         → Clear CPU
```

### Memory Editor
```
Double-click → Edit cell
Enter        → Save
Esc          → Cancel
Jump box     → Navigate
```

### Watch Panel
```
Add Watch    → Monitor register/memory
Click value  → Change format (hex/dec/bin)
Click X      → Remove watch
```

---

## 📝 Program Examples

### Example 1: Simple Math
```assembly
LD A, 10H
LD B, 20H
ADD B
HALT
```
Result: A = 30H

---

### Example 2: Loop
```assembly
LD A, 05H
loop:
  DEC A
  JP NZ, loop
HALT
```
Result: A = 00H

---

### Example 3: Memory Read
```assembly
LD HL, 0100H
LD A, (HL)
INC A
HALT
```
Pre-load: 0100H = 10H
Result: A = 11H

---

## 🚀 Try This Now!

### Challenge 1: Countdown
```assembly
LD A, 0AH
loop:
  DEC A
  JP NZ, loop
HALT
```

**Task:**
1. Load program
2. Add watch: Register A
3. Step through
4. Watch A countdown: 0A → 09 → ... → 00

---

### Challenge 2: Sum
```assembly
LD A, 00H
LD B, 05H
loop:
  ADD B
  DEC B
  JP NZ, loop
HALT
```

**Task:**
1. Add watches: A dan B
2. Run program
3. Result: A = 0FH (5+4+3+2+1 = 15)

---

### Challenge 3: Memory Copy
```assembly
LD HL, 0100H
LD A, 42H
LD (HL), A
INC HL
LD A, 69H
LD (HL), A
HALT
```

**Task:**
1. Add watch: Memory @0100H dan @0101H
2. Run program
3. Check Memory Editor: 0100H=42H, 0101H=69H

---

## 💡 Pro Tips

### Tip 1: Debug Workflow
```
1. Add watches FIRST
2. Load program
3. Step through (not Run)
4. Watch values change
5. Understand behavior
```

### Tip 2: Memory Setup
```
1. Use Memory Editor to pre-load data
2. Write program to process data
3. Verify result in registers
```

### Tip 3: Format Cycling
```
Hex    → for addresses
Decimal → for counters
Binary  → for bit operations
```

---

## ⚡ Quick Start Commands

```bash
# Simulator sudah running!
# Langsung pakai di browser
```

### First Time?
```
1. Klik "Load"
2. Klik "Step" 5x
3. Watch registers change
4. Done! 🎉
```

### Want to Edit Memory?
```
1. Tab "Memory Editor"
2. Double-click cell
3. Type hex value
4. Enter to save
```

### Want to Monitor?
```
1. Tab "Watch"
2. Add watch (register/memory)
3. Switch to Assembler
4. Run program
5. Switch back to Watch
```

---

## 🎓 5-Minute Master Plan

### Minute 1: Basic Execution
- Load default program
- Step through 5 times
- Observe register A

### Minute 2: Full Run
- Reset CPU
- Run program completely
- Check execution log

### Minute 3: Memory Edit
- Switch to Memory Editor
- Edit cell 0100H = 42H
- Verify in log

### Minute 4: Memory Read Program
- Write LD program
- Load & run
- Verify register A = 42H

### Minute 5: Watch Setup
- Add watch for register A
- Step through program
- See real-time updates

**Congratulations!** 🎉
You're now a Z-80 Simulator pro!

---

## 📞 Need Help?

### Program tidak jalan?
→ Pastikan sudah **Load** dulu!

### CPU halted?
→ Klik **Reset**!

### Edit tidak save?
→ Tekan **Enter** setelah ketik!

### Watch tidak update?
→ **Execute** program dulu (Step/Run)!

---

## 🏆 Next Level

Setelah master basics, coba:

1. ✅ Write your own programs
2. ✅ Use all 8 flags
3. ✅ Explore 16-bit registers
4. ✅ Pre-load complex data
5. ✅ Build algorithms (sort, search, etc)

**Happy Learning!** 🚀

---

**Full Documentation:**
- `PANDUAN_PENGGUNAAN.md` - Panduan lengkap
- `ADVANCED_FEATURES.md` - Fitur advanced
- `ENHANCED_FEATURES.md` - Complete register set
- `QUICKSTART.md` - English quick start
