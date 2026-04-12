# Z-80 Simulator - Clean Architecture Documentation

## Overview

This Z-80 CPU simulator strictly follows **Clean Architecture** principles, with complete separation between business logic and presentation layers.

## Directory Structure

```
src/z80/
│
├── domain/                        # Layer 1: Entities & Types
│   ├── types.ts                   # Primitive types, register names, mnemonics
│   ├── entities.ts                # Core entities (CPUState, Instruction, etc.)
│   └── index.ts                   # Public API
│
├── usecases/                      # Layer 2: Business Logic
│   ├── cpuStateFactory.ts         # CPU state creation & utilities
│   ├── instructionParser.ts       # Assembly → Instruction objects
│   ├── aluOperations.ts           # Arithmetic/Logic operations
│   ├── instructionExecutor.ts     # Execute single instructions
│   ├── cpuExecutor.ts             # Fetch-decode-execute orchestration
│   └── index.ts                   # Public API
│
├── adapters/                      # Layer 3: State Management (Future)
│   └── [Zustand store will go here]
│
├── presentation/                  # Layer 4: UI Components (Future)
│   └── [React components will go here]
│
├── example.ts                     # Usage examples
├── test.ts                        # Test suite
├── README.md                      # User documentation
└── ARCHITECTURE.md                # This file
```

## Dependency Rules

```
Presentation → Adapters → Use Cases → Domain
   (React)      (Zustand)   (Logic)   (Entities)
```

**Critical Rule**: Dependencies only point inward. The domain and use cases layers have ZERO knowledge of:
- React
- Zustand
- Any UI framework
- Any state management library

## Layer Descriptions

### Layer 1: Domain (Entities & Types)

**Purpose**: Define the core data structures and types

**Files**:
- `types.ts`: Primitive types (Byte, Word, Register names, Mnemonics)
- `entities.ts`: Complex entities (CPUState, Instruction, ExecutionResult)

**Dependencies**: None (pure TypeScript types)

**Key Entities**:
```typescript
CPUState {
  registers: RegisterState
  memory: MemoryMap
  halted: boolean
  error: string | null
}

Instruction {
  mnemonic: Mnemonic
  operand1?: OperandType
  operand2?: OperandType
  sourceCode: string
  address: Address
}
```

### Layer 2: Use Cases (Business Logic)

**Purpose**: Implement all CPU simulation logic

**Files**:
1. **cpuStateFactory.ts**
   - Create initial CPU state
   - Validation utilities (isValidByte, isValidWord)
   - Type coercion (toByte, toWord)

2. **instructionParser.ts**
   - `parseInstruction()`: Parse single assembly line
   - `parseProgram()`: Parse multi-line assembly code
   - Supports: hex formats (05H, 0x05), comments, whitespace

3. **aluOperations.ts**
   - Pure functions for arithmetic/logic
   - `aluAdd()`, `aluSub()`, `aluInc()`, `aluDec()`
   - Flag computation (Z, S, C)

4. **instructionExecutor.ts**
   - `executeInstruction()`: Execute single instruction
   - Handlers for each mnemonic (LD, ADD, SUB, INC, DEC, JP, JPNZ, etc.)
   - Returns ExecutionResult with updated state

5. **cpuExecutor.ts**
   - `step()`: Execute one instruction (fetch-decode-execute)
   - `runToCompletion()`: Run until HALT
   - `stepN()`: Execute N instructions
   - `loadProgram()`: Create Program from source code

**Dependencies**: Domain layer only

**Key Functions**:
```typescript
// Create CPU
const cpu = createCPUState();

// Parse program
const program = loadProgram(assemblyCode);

// Execute
const result = step(cpu, program);

// Or run all
const finalResult = runToCompletion(cpu, program);
```

### Layer 3: Adapters (State Management)

**Purpose**: Bridge between use cases and UI

**Status**: Not yet implemented (Phase 2)

**Planned**:
- Zustand store wrapping CPU state
- Actions: loadCode(), step(), run(), reset()
- Selectors for UI consumption

**Interface** (planned):
```typescript
interface Z80Store {
  // State
  cpu: CPUState;
  program: Program | null;

  // Actions
  loadCode: (code: string) => void;
  step: () => void;
  run: () => void;
  reset: () => void;
}
```

### Layer 4: Presentation (React UI)

**Purpose**: Render CPU state and provide user interaction

**Status**: Not yet implemented (Phase 2)

**Planned Components**:
- `CodeEditor`: Assembly code input
- `RegisterDashboard`: Display registers (A, B, C, D, E, H, L, PC, SP)
- `FlagDisplay`: Show Z, S, C flags
- `MemoryViewer`: Hex dump of memory
- `ControlPanel`: Step, Run, Reset buttons

## Data Flow

### Step Execution Flow

```
User clicks "Step"
    ↓
Presentation layer (React component)
    ↓
Adapter layer (Zustand action)
    ↓
Use Cases: cpuExecutor.step(state, program)
    ↓
Use Cases: instructionExecutor.executeInstruction(state, instruction)
    ↓
Use Cases: aluOperations.aluAdd(a, b)  [if needed]
    ↓
Domain: ExecutionResult returned
    ↓
Adapter: Update store
    ↓
Presentation: Re-render with new state
```

### Parse Flow

```
User enters code
    ↓
Presentation: CodeEditor component
    ↓
Adapter: loadCode(code) action
    ↓
Use Cases: instructionParser.parseProgram(code)
    ↓
Domain: Instruction[] returned
    ↓
Use Cases: cpuExecutor.loadProgram() creates Program
    ↓
Adapter: Store Program
    ↓
Presentation: Ready to execute
```

## Testing Strategy

### Unit Tests (Use Cases Layer)

**Test file**: `test.ts`

**Coverage**:
- ✓ Parser: All number formats, mnemonics, edge cases
- ✓ Execution: Each instruction type
- ✓ Flags: Carry, Zero, Sign
- ✓ Control flow: JP, JP NZ
- ✓ PC management: Increment, jump
- ✓ Error handling: Invalid instructions, bounds checking

**Run tests**:
```bash
pnpm exec tsx src/z80/test.ts
```

### Integration Tests (Future)

- Test Zustand store actions
- Test React component interactions
- E2E: Load program → Step → Verify UI updates

## Design Principles Applied

### 1. Single Responsibility
- Parser only parses
- Executor only executes
- ALU only computes

### 2. Open/Closed
- Easy to add new instructions without modifying existing code
- Add new register types by extending types

### 3. Dependency Inversion
- UI depends on abstractions (CPUState, ExecutionResult)
- Use cases don't know about UI

### 4. Immutability
```typescript
// BAD: Mutates state
function step(state: CPUState) {
  state.registers.registers8.A = 42;
}

// GOOD: Returns new state
function step(state: CPUState): ExecutionResult {
  const newState = { ...state };
  newState.registers.registers8.A = 42;
  return { success: true, updatedState: newState };
}
```

### 5. Pure Functions
- ALU operations are pure: same input → same output
- No side effects, no external dependencies
- Easy to test, reason about, and debug

### 6. Explicit Error Handling
```typescript
interface ExecutionResult {
  success: boolean;
  updatedState: CPUState;
  message?: string;
  error?: string;
}
```

## Phase Implementation Plan

### ✅ Phase 1 (Current)
- [x] Domain layer complete
- [x] Use cases layer complete
- [x] Basic instruction set (LD, ADD, SUB, INC, DEC, JP, JPNZ)
- [x] Parser with hex support
- [x] ALU with flag computation
- [x] Execution engine (step, run)
- [x] Test suite

### 🔄 Phase 2 (Next - UI Integration)
- [ ] Install Zustand
- [ ] Create adapter layer (store)
- [ ] Create React components:
  - [ ] CodeEditor
  - [ ] RegisterDashboard
  - [ ] ControlPanel
  - [ ] MemoryViewer
- [ ] Wire everything together
- [ ] Dark mode styling with Tailwind

### 🔜 Phase 3 (Enhanced Instructions)
- [ ] More instructions: OR, AND, XOR, CP, RLA, RRA
- [ ] Memory operations: LD (HL), A
- [ ] 16-bit arithmetic: ADD HL, BC
- [ ] Stack operations: PUSH, POP

### 🔜 Phase 4 (Advanced Features)
- [ ] Breakpoints
- [ ] Step backward (history)
- [ ] Memory editor
- [ ] Register watch expressions
- [ ] Program save/load

## Benefits of This Architecture

1. **Testability**: Use cases tested without UI
2. **Reusability**: Core logic works in Node, browser, React Native, etc.
3. **Maintainability**: Changes isolated to specific layers
4. **Team Collaboration**: Frontend/backend devs work independently
5. **Future-Proof**: Easy to swap React → Vue, Zustand → Redux
6. **Educational**: Clear separation mirrors real CPU architecture

## Code Quality Metrics

- **Type Safety**: 100% TypeScript with strict mode
- **Test Coverage**: All mnemonics, all flags, edge cases
- **Zero Dependencies**: Use cases layer has no npm dependencies
- **Documentation**: Every function has JSDoc comments
- **Immutability**: All state updates return new objects

## References

- **Clean Architecture**: Robert C. Martin
- **Z-80 Architecture**: Zilog Z80 CPU User Manual
- **Functional Programming**: Immutability, pure functions
- **Domain-Driven Design**: Entities, use cases, adapters
