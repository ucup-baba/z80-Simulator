# Z-80 CPU Simulator - Core Logic

This module implements a Z-80 CPU simulator following **Clean Architecture** principles. The core logic is completely independent of any UI framework and can be used in any JavaScript/TypeScript environment.

## Architecture

The project follows Clean Architecture with clear separation of concerns:

```
z80/
├── domain/           # Entities and type definitions
│   ├── types.ts      # Basic types (Byte, Word, Register names, etc.)
│   └── entities.ts   # Core entities (CPUState, Instruction, etc.)
│
├── usecases/         # Business logic (framework-independent)
│   ├── cpuStateFactory.ts      # CPU state creation and utilities
│   ├── instructionParser.ts    # Assembly code parser
│   ├── aluOperations.ts        # Arithmetic/Logic operations
│   ├── instructionExecutor.ts  # Instruction execution
│   └── cpuExecutor.ts          # Fetch-decode-execute cycle
│
├── adapters/         # (Future) State management adapters
└── presentation/     # (Future) React UI components
```

## Phase 1 Features

### Supported Registers
- **8-bit**: A, B, C, D, E, H, L
- **16-bit**: PC (Program Counter), SP (Stack Pointer)

### CPU Flags
- **Z** (Zero): Set when result is zero
- **S** (Sign): Set when bit 7 is set (negative in two's complement)
- **C** (Carry): Set on overflow/underflow

### Instruction Set (MVP)

| Mnemonic | Description | Example |
|----------|-------------|---------|
| `LD` | Load | `LD A, 05H` |
| `ADD` | Add to accumulator | `ADD B` or `ADD A, 10H` |
| `SUB` | Subtract from accumulator | `SUB C` or `SUB A, 05H` |
| `INC` | Increment register | `INC A` |
| `DEC` | Decrement register | `DEC B` |
| `JP` | Unconditional jump | `JP 0010H` |
| `JP NZ` | Jump if not zero | `JP NZ, 5` |
| `NOP` | No operation | `NOP` |
| `HALT` | Halt execution | `HALT` |

### Number Formats
The parser supports multiple number formats:
- Hexadecimal with H suffix: `05H`, `FFH`
- Hexadecimal with 0x prefix: `0x05`, `0xFF`
- Decimal: `5`, `255`

## API Usage

### Basic Usage

```typescript
import {
  createCPUState,
  loadProgram,
  step,
  runToCompletion,
} from './z80';

// Create CPU
const cpu = createCPUState();

// Load program
const code = `
  LD A, 10H
  LD B, 05H
  ADD B
  HALT
`;
const program = loadProgram(code);

// Execute step by step
let result = step(cpu, program);
console.log(result.message);
console.log(result.updatedState.registers.registers8.A); // Current A value

// Or run to completion
const finalResult = runToCompletion(cpu, program);
console.log(finalResult.updatedState.registers);
```

### Core Functions

#### `createCPUState(): CPUState`
Creates a new CPU state with all registers initialized to 0.

#### `loadProgram(code: string): Program`
Parses assembly code into executable instructions.

#### `step(state: CPUState, program: Program): ExecutionResult`
Executes one instruction at the current PC.

#### `runToCompletion(state: CPUState, program: Program, maxSteps?: number): ExecutionResult`
Runs until HALT or error (default max: 1000 steps).

#### `stepN(state: CPUState, program: Program, n: number): ExecutionResult`
Executes N instructions.

## Type Definitions

### CPUState
```typescript
interface CPUState {
  registers: RegisterState;
  memory: MemoryMap;
  halted: boolean;
  error: string | null;
}
```

### ExecutionResult
```typescript
interface ExecutionResult {
  success: boolean;
  updatedState: CPUState;
  message?: string;
  error?: string;
}
```

### Instruction
```typescript
interface Instruction {
  mnemonic: Mnemonic;
  operand1?: OperandType;
  operand2?: OperandType;
  sourceCode: string;
  address: Address;
}
```

## Example Programs

### Example 1: Simple Arithmetic
```assembly
LD A, 10H    ; Load 16 into A
LD B, 05H    ; Load 5 into B
ADD B        ; Add B to A (A = 21)
INC A        ; Increment A (A = 22)
HALT
```

### Example 2: Countdown Loop
```assembly
LD A, 05H    ; Load 5 into A
DEC A        ; Decrement A
JP NZ, 1     ; Jump to line 1 if not zero
HALT         ; Halt when A = 0
```

### Example 3: Overflow Detection
```assembly
LD A, FFH    ; Load 255 into A
INC A        ; Increment (A = 0, Z flag set)
```

## Testing

Run the example file to verify the core logic:

```typescript
import { runAllExamples } from './z80/example';
runAllExamples();
```

## Design Principles

1. **Immutability**: Functions return new state objects rather than mutating
2. **Pure Functions**: Use cases have no side effects
3. **Strict Typing**: All CPU values are properly typed (Byte, Word, etc.)
4. **Framework Independence**: Core logic has zero React dependencies
5. **Testability**: Easy to unit test without UI

## Future Enhancements (Phase 2+)

- [ ] More instructions (OR, AND, XOR, CP, etc.)
- [ ] Memory-based operations (LD (HL), A)
- [ ] 16-bit register pairs (BC, DE, HL)
- [ ] Call/Return and stack operations
- [ ] Interrupt handling
- [ ] Additional flags (P/V, H, N)
- [ ] Actual memory byte execution (vs instruction list)

## Notes

- Current implementation uses an instruction array (like a "compiled" program)
- Phase 1 does not simulate actual opcode bytes in memory
- PC acts as an instruction index rather than a memory address
- Memory array exists but is not yet used for instruction storage
