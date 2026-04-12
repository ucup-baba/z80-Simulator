# Z-80 Simulator - Quick Start Guide

## 🚀 Immediate Start

Your Z-80 CPU Simulator is **ready to use right now**!

---

## 🎮 Using the Simulator (Step-by-Step)

### Step 1: Look at the Interface

The screen is divided into sections:

```
┌─────────────────────────────────────────────────────────┐
│  Z-80 CPU SIMULATOR                    [Stats]          │
├──────────────────────────────┬──────────────────────────┤
│                              │                          │
│  CODE EDITOR                 │  REGISTER DASHBOARD      │
│  (Write assembly here)       │  (See CPU state)         │
│                              │                          │
├──────────────────────────────┤                          │
│                              │                          │
│  EXECUTION LOG               │  MEMORY VIEWER           │
│  (See what's happening)      │  (Hex dump)              │
│                              │                          │
├──────────────────────────────┴──────────────────────────┤
│  [Load] [Step] [Run]                          [Reset]   │
└─────────────────────────────────────────────────────────┘
```

---

### Step 2: Load the Default Program

The editor already has a sample program:

```assembly
LD A, 10H    ; Load 16 into A
LD B, 05H    ; Load 5 into B
ADD B        ; Add B to A
INC A        ; Increment A
HALT         ; Stop execution
```

**Click the "Load" button** (or press `Ctrl+L`)

You'll see:
- ✅ "Program loaded successfully" in the log
- The instruction count updates in the header

---

### Step 3: Step Through Instructions

**Click "Step"** (or press `Ctrl+S`) repeatedly:

**Step 1**: `LD A, 10H`
- Look at the Register Dashboard
- Register A changes from `00H` to `10H`
- PC (Program Counter) changes from `0` to `1`

**Step 2**: `LD B, 05H`
- Register B changes from `00H` to `05H`
- PC changes to `2`

**Step 3**: `ADD B`
- Register A changes from `10H` to `15H` (16 + 5 = 21)
- Flags update based on result
- PC changes to `3`

**Step 4**: `INC A`
- Register A changes from `15H` to `16H`
- PC changes to `4`

**Step 5**: `HALT`
- Status changes to "Halted"
- Execution stops

---

### Step 4: Try "Run" Instead

Click **Reset** first, then click **Load** again.

Now click **Run** (or press `Ctrl+R`):
- All instructions execute instantly
- The log shows all steps
- Final state: A = `16H`, B = `05H`

---

## 📝 Try Your Own Programs

### Example 1: Simple Addition

Replace the code with:

```assembly
LD A, 20H
LD B, 30H
ADD B
HALT
```

**Result**: A = 50H (32 + 48 = 80)

---

### Example 2: Loop (Count Down)

```assembly
LD A, 0AH
DEC A
JP NZ, 1
HALT
```

**What happens**:
1. A starts at 0AH (10)
2. DEC A makes it 09H
3. JP NZ, 1 jumps back to line 1 (DEC A)
4. Repeats until A = 0
5. Z flag is set, jump doesn't happen
6. HALT executes

**Click "Run"** and watch the log show multiple DEC operations!

---

### Example 3: Overflow Detection

```assembly
LD A, FFH
INC A
HALT
```

**Result**:
- A = 00H (255 + 1 overflows to 0)
- Z flag = 1 (zero)
- Look at the flags in the Register Dashboard!

---

## 🎯 Understanding the Display

### Register Dashboard

```
8-bit Registers
┌──────────┐
│ A   10H  │ ← Highlighted (Accumulator)
│ B   05H  │
│ C   00H  │
│ D   00H  │
│ E   00H  │
│ H   00H  │
│ L   00H  │
└──────────┘

16-bit Registers
┌──────────┐
│ PC  0004 │ ← Program Counter (next instruction)
│ SP  00FF │ ← Stack Pointer
└──────────┘

Flags
┌──────────┐
│ Z  0  ●  │ ← Zero flag (gray = off)
│ S  0  ●  │ ← Sign flag
│ C  0  ●  │ ← Carry flag
└──────────┘
```

When a flag is **active**, it shows:
- Green color
- Value = 1
- Green dot

---

### Execution Log

```
ℹ Program loaded successfully (4 instructions)  14:23:45
ℹ LD A = 10H                                     14:23:47
ℹ LD B = 05H                                     14:23:48
ℹ ADD A = 15H                                    14:23:49
ℹ INC A = 16H                                    14:23:50
ℹ HALT - CPU halted                              14:23:51
```

Icon meanings:
- ℹ Blue = Info (normal execution)
- ✓ Green = Success
- ⚠ Red = Error

---

### Memory Viewer

Shows RAM contents in hex:

```
Addr  0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F  ASCII
0000  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
0010  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
```

Currently shows zeros (Phase 1 doesn't write to memory yet).

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+L` | Load program |
| `Ctrl+S` | Step one instruction |
| `Ctrl+R` | Run to completion |

---

## 🔧 Troubleshooting

### "Parse error" message appears

**Cause**: Invalid assembly syntax

**Fix**: Check your code for:
- Valid mnemonics (LD, ADD, SUB, INC, DEC, JP, JP NZ, NOP, HALT)
- Correct operands (e.g., `LD A, 10H` not `LD 10H, A`)
- Hex numbers end with H or start with 0x

---

### "No program loaded" when clicking Step

**Fix**: Click **Load** first to parse the code.

---

### "CPU is halted" when clicking Step

**Fix**: Click **Reset** to restart the CPU.

---

### Nothing happens when clicking Run

**Possible causes**:
1. No HALT instruction (add `HALT` at the end)
2. Infinite loop without HALT
3. Program already halted (click Reset)

---

## 📖 Syntax Guide

### Valid Instructions

```assembly
; Data Transfer
LD A, 42H       ; Load immediate into register
LD B, A         ; Copy register to register

; Arithmetic
ADD B           ; Add register to A
ADD 10H         ; Add immediate to A
SUB C           ; Subtract register from A
SUB 05H         ; Subtract immediate from A
INC A           ; Increment register
DEC B           ; Decrement register

; Control Flow
JP 5            ; Jump to instruction 5
JP NZ, 2        ; Jump to instruction 2 if not zero

; Other
NOP             ; Do nothing
HALT            ; Stop execution
```

### Number Formats

```assembly
LD A, FFH       ; Hex with H suffix
LD A, 0xFF      ; Hex with 0x prefix
LD A, 255       ; Decimal
```

### Comments

```assembly
; This is a comment
LD A, 10H       ; This is also a comment
```

---

## 🎓 Learning Path

### Level 1: Basic Operations
1. Load values into registers
2. Copy between registers
3. Simple arithmetic (ADD, SUB)

### Level 2: Flags
1. Understand Zero flag (result = 0)
2. Understand Carry flag (overflow)
3. Understand Sign flag (bit 7)

### Level 3: Control Flow
1. Unconditional jumps (JP)
2. Conditional jumps (JP NZ)
3. Simple loops

### Level 4: Complex Programs
1. Countdown timers
2. Arithmetic chains
3. Multi-register operations

---

## 💡 Pro Tips

1. **Use the log**: It shows exactly what each instruction does
2. **Watch the PC**: It tells you which line executes next
3. **Step before Run**: Understand the program step-by-step first
4. **Reset often**: Start fresh when experimenting
5. **Comment your code**: Use semicolons to explain logic

---

## 🎉 You're Ready!

Start experimenting with the default program or try the examples above.

**Happy coding!** 🚀

---

For more details, see:
- `Z80_SIMULATOR_GUIDE.md` - Complete guide
- `src/z80/INSTRUCTION_SET.md` - All instructions
- `src/z80/README.md` - Technical documentation
