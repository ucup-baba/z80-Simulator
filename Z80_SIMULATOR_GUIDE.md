# Z-80 CPU Simulator - Complete Implementation Guide

## 🎉 Project Complete!

A fully functional, web-based Z-80 microprocessor simulator built with **React**, **TypeScript**, **Tailwind CSS**, and **Zustand**, following strict **Clean Architecture** principles.

---

## 📁 Project Structure

```
src/
├── z80/                              # Z-80 Core Module
│   ├── domain/                       # Layer 1: Entities & Types
│   │   ├── types.ts                  # Primitive types (Byte, Word, Mnemonics)
│   │   ├── entities.ts               # Core entities (CPUState, Instruction)
│   │   └── index.ts
│   │
│   ├── usecases/                     # Layer 2: Business Logic
│   │   ├── cpuStateFactory.ts        # CPU initialization & utilities
│   │   ├── instructionParser.ts      # Assembly code parser
│   │   ├── aluOperations.ts          # ALU operations (ADD, SUB, INC, DEC)
│   │   ├── instructionExecutor.ts    # Instruction execution
│   │   ├── cpuExecutor.ts            # Fetch-decode-execute cycle
│   │   └── index.ts
│   │
│   ├── adapters/                     # Layer 3: State Management
│   │   └── useZ80Store.ts            # Zustand store
│   │
│   ├── presentation/                 # Layer 4: React Components
│   │   ├── CodeEditor.tsx            # Assembly code editor
│   │   ├── RegisterDashboard.tsx     # CPU registers & flags display
│   │   ├── ControlPanel.tsx          # Execution controls
│   │   ├── ExecutionLog.tsx          # Real-time execution log
│   │   └── MemoryViewer.tsx          # Memory hex dump
│   │
│   ├── example.ts                    # Usage examples
│   ├── test.ts                       # Test suite (25+ tests)
│   ├── README.md                     # User documentation
│   ├── ARCHITECTURE.md               # Architecture documentation
│   └── INSTRUCTION_SET.md            # Complete instruction reference
│
└── app/
    └── App.tsx                       # Main application
```

---

## 🚀 Features Implemented

### ✅ Phase 1: Core CPU Logic (Domain & Use Cases)

**Registers**:
- 8-bit: A, B, C, D, E, H, L
- 16-bit: PC (Program Counter), SP (Stack Pointer)

**CPU Flags**:
- Z (Zero): Set when result is zero
- S (Sign): Set when bit 7 is set (negative in two's complement)
- C (Carry): Set on overflow/underflow

**Memory**:
- 256-byte virtual RAM
- Hex dump display

**Instruction Set**:
| Instruction | Description | Example |
|-------------|-------------|---------|
| LD | Load | `LD A, 10H` |
| ADD | Add to A | `ADD B` |
| SUB | Subtract from A | `SUB C` |
| INC | Increment | `INC A` |
| DEC | Decrement | `DEC B` |
| JP | Unconditional jump | `JP 5` |
| JP NZ | Jump if not zero | `JP NZ, 2` |
| NOP | No operation | `NOP` |
| HALT | Halt CPU | `HALT` |

**Number Formats Supported**:
- Hex with H suffix: `FFH`, `10H`
- Hex with 0x prefix: `0xFF`, `0x10`
- Decimal: `255`, `16`

---

### ✅ Phase 2: UI & State Management (Adapters & Presentation)

**State Management**:
- Zustand store connecting UI to business logic
- Immutable state updates
- Real-time reactivity

**UI Components**:

1. **Code Editor**
   - Monospace font for assembly code
   - Syntax validation
   - Error display
   - Line counter

2. **Register Dashboard**
   - Live register values (hex + decimal)
   - Flag status indicators (green/gray)
   - CPU status (Running/Halted)
   - Error messages
   - Highlighted accumulator (A) and PC

3. **Control Panel**
   - Load button (parse and load code)
   - Step button (execute one instruction)
   - Run button (run to completion)
   - Reset button (clear CPU state)
   - Keyboard shortcuts (Ctrl+L, Ctrl+S, Ctrl+R)

4. **Execution Log**
   - Real-time instruction execution messages
   - Color-coded entries (info/error/success)
   - Timestamps
   - Auto-scroll
   - Clear button

5. **Memory Viewer**
   - Hex dump format (16 bytes per row)
   - Address column
   - ASCII representation
   - Scrollable for large memory

**Styling**:
- Dark mode "tech aesthetic" with zinc color palette
- Blue accents for primary actions
- Emerald for active flags
- Red for errors
- Smooth transitions and hover effects

---

## 🎮 How to Use

### 1. Load a Program

Click **Load** (or press `Ctrl+L`) to parse the assembly code in the editor. The default program is:

```assembly
; Z-80 Assembly Example
; Simple arithmetic program

LD A, 10H    ; Load 16 into A
LD B, 05H    ; Load 5 into B
ADD B        ; Add B to A
INC A        ; Increment A
HALT         ; Stop execution
```

### 2. Step Through Execution

Click **Step** (or press `Ctrl+S`) to execute one instruction at a time. Watch:
- Registers update in real-time
- Flags change (Z, S, C)
- PC increment
- Execution log messages

### 3. Run to Completion

Click **Run** (or press `Ctrl+R`) to execute all instructions until `HALT` or error.

### 4. Reset CPU

Click **Reset** to clear all registers, flags, and execution state.

---

## 📝 Example Programs

### Example 1: Overflow Detection

```assembly
LD A, FFH    ; Load 255 into A
INC A        ; Increment (A = 0, Z flag set)
HALT
```

**Result**: A = 00H, Z flag = 1

---

### Example 2: Countdown Loop

```assembly
LD A, 05H    ; Counter = 5
DEC A        ; Decrement
JP NZ, 1     ; Loop back to DEC if not zero
HALT
```

**Result**: Loops 5 times, A = 00H, Z flag = 1

---

### Example 3: Register Transfer

```assembly
LD A, 42H    ; A = 0x42
LD B, A      ; B = 0x42
LD C, B      ; C = 0x42
LD D, C      ; D = 0x42
HALT
```

**Result**: A = B = C = D = 42H

---

### Example 4: Arithmetic Chain

```assembly
LD A, 20H    ; A = 32
ADD 10H      ; A = 48
SUB 05H      ; A = 43
INC A        ; A = 44
DEC A        ; A = 43
HALT
```

**Result**: A = 2BH (43 decimal)

---

## 🏗️ Clean Architecture Benefits

### Separation of Concerns

```
UI (React) → Adapter (Zustand) → Use Cases (Logic) → Domain (Entities)
```

- **Domain**: Pure TypeScript types (zero dependencies)
- **Use Cases**: 100% framework-independent business logic
- **Adapters**: Zustand store (easily replaceable with Redux, MobX, etc.)
- **Presentation**: React components (could be Vue, Svelte, etc.)

### Testability

```bash
# Test core logic without UI
pnpm exec tsx src/z80/test.ts
```

All business logic tested independently of React.

### Reusability

The core CPU logic (`domain/` + `usecases/`) can be used in:
- Node.js CLI tools
- React Native mobile apps
- Web Workers
- VS Code extensions
- Electron apps

---

## 🧪 Testing

Run the comprehensive test suite:

```bash
cd /workspaces/default/code
pnpm exec tsx src/z80/test.ts
```

**Test Coverage**:
- ✓ CPU state initialization
- ✓ All instruction types
- ✓ Flag computation (Z, S, C)
- ✓ Control flow (JP, JP NZ)
- ✓ Overflow/underflow handling
- ✓ Parser (hex formats, comments)
- ✓ PC management
- ✓ Error handling

---

## 🎨 UI Design Principles

### Color Palette

- **Background**: zinc-950 (darkest)
- **Panels**: zinc-900
- **Borders**: zinc-700/800
- **Text**: zinc-100 (primary), zinc-400 (secondary)
- **Accents**:
  - Blue (primary actions)
  - Emerald (active states)
  - Red (errors)

### Typography

- **Code**: Monospace font family
- **Hex values**: Uppercase, zero-padded
- **Labels**: Small caps, medium weight

### Layout

- **3-panel design**: Code | Registers | Memory
- **Fixed header**: Branding and stats
- **Fixed footer**: Control panel
- **Scrollable panels**: Independent scrolling

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+L` | Load program |
| `Ctrl+S` | Step one instruction |
| `Ctrl+R` | Run to completion |

---

## 🔮 Future Enhancements (Phase 3+)

### Additional Instructions
- [ ] Bitwise: OR, AND, XOR
- [ ] Compare: CP
- [ ] Rotate: RLA, RRA, RLCA, RRCA
- [ ] Memory: LD (HL), A
- [ ] Stack: PUSH, POP
- [ ] Subroutines: CALL, RET

### Advanced Features
- [ ] Breakpoints (click line number)
- [ ] Step backward (execution history)
- [ ] Memory editor (double-click to edit)
- [ ] Watch expressions
- [ ] Export/import programs
- [ ] Syntax highlighting
- [ ] Auto-complete
- [ ] Opcode reference tooltip

### Educational Features
- [ ] Interactive tutorial
- [ ] Instruction timing
- [ ] Visual instruction pipeline
- [ ] Flag calculation explanation
- [ ] Assembly reference panel
- [ ] Example program library

---

## 📚 Documentation

- **`README.md`**: User guide and API reference
- **`ARCHITECTURE.md`**: Clean Architecture detailed explanation
- **`INSTRUCTION_SET.md`**: Complete instruction reference with examples
- **`example.ts`**: Working code examples
- **`test.ts`**: Test suite demonstrating all features

---

## 🎓 Educational Value

### For Students

This simulator helps students:
- Understand CPU architecture
- Learn assembly language
- Visualize register operations
- See flag computation
- Debug programs step-by-step
- Experiment safely

### For Instructors

Use this as:
- Interactive lecture tool
- Lab assignment platform
- Homework grading aid
- Demonstration tool
- Self-paced learning resource

---

## 🏆 Key Achievements

✅ **100% TypeScript** with strict typing
✅ **Clean Architecture** with zero coupling
✅ **Immutable state** management
✅ **Pure functions** in business logic
✅ **Comprehensive testing** (25+ tests)
✅ **Production-ready** code quality
✅ **Responsive UI** with dark mode
✅ **Keyboard shortcuts** for efficiency
✅ **Real-time visualization** of CPU state
✅ **Educational** and intuitive design

---

## 🛠️ Technology Stack

- **React** 18+ (Functional components, hooks)
- **TypeScript** 5+ (Strict mode)
- **Tailwind CSS** 4.0 (Utility-first styling)
- **Zustand** 5.0 (Lightweight state management)
- **Vite** (Build tool)

---

## 🎯 Success Metrics

| Metric | Status |
|--------|--------|
| Zero coupling between layers | ✅ |
| All registers functional | ✅ |
| All flags computed correctly | ✅ |
| All Phase 1 instructions working | ✅ |
| Real-time UI updates | ✅ |
| Error handling implemented | ✅ |
| Dark mode styling | ✅ |
| Keyboard shortcuts | ✅ |
| Documentation complete | ✅ |
| Test coverage | ✅ |

---

## 🚀 Getting Started

The simulator is ready to use! Simply:

1. Open the application in your browser
2. The default program is pre-loaded
3. Click **Load** to parse the code
4. Click **Step** or **Run** to execute
5. Watch the CPU state update in real-time

**Start experimenting with Z-80 assembly today!** 🎉

---

## 📞 Support

For questions about:
- **Z-80 architecture**: See `INSTRUCTION_SET.md`
- **Clean Architecture**: See `ARCHITECTURE.md`
- **API usage**: See `README.md` in `/src/z80`
- **Code examples**: See `example.ts`

---

*Built with ❤️ for Computer Engineering Education*
