# Z-80 Instruction Set Reference (Phase 1)

## Supported Instructions

### Data Transfer

#### LD - Load
**Description**: Copy data between registers or load immediate values

**Formats**:
```assembly
LD r, n      ; Load immediate into register
LD r1, r2    ; Copy register to register
```

**Examples**:
```assembly
LD A, 42H    ; Load 0x42 into A
LD A, 0xFF   ; Load 0xFF into A (alternative hex format)
LD B, A      ; Copy A into B
LD C, 10H    ; Load 0x10 into C
```

**Flags**: Not affected

**Opcodes**: 8-bit registers (A, B, C, D, E, H, L)

---

### Arithmetic Operations

#### ADD - Add
**Description**: Add to accumulator (A register)

**Formats**:
```assembly
ADD r        ; Add register to A (implicit)
ADD A, r     ; Add register to A (explicit)
ADD n        ; Add immediate to A
ADD A, n     ; Add immediate to A (explicit)
```

**Examples**:
```assembly
ADD B        ; A = A + B
ADD A, C     ; A = A + C
ADD 10H      ; A = A + 0x10
ADD A, 0x05  ; A = A + 0x05
```

**Flags**:
- **Z**: Set if result is zero
- **S**: Set if bit 7 of result is set (negative)
- **C**: Set if overflow (result > 0xFF)

---

#### SUB - Subtract
**Description**: Subtract from accumulator (A register)

**Formats**:
```assembly
SUB r        ; Subtract register from A (implicit)
SUB A, r     ; Subtract register from A (explicit)
SUB n        ; Subtract immediate from A
SUB A, n     ; Subtract immediate from A (explicit)
```

**Examples**:
```assembly
SUB B        ; A = A - B
SUB A, C     ; A = A - C
SUB 10H      ; A = A - 0x10
```

**Flags**:
- **Z**: Set if result is zero
- **S**: Set if bit 7 of result is set
- **C**: Set if underflow (borrow occurred)

---

#### INC - Increment
**Description**: Increment register by 1

**Format**:
```assembly
INC r        ; Increment register
```

**Examples**:
```assembly
INC A        ; A = A + 1
INC B        ; B = B + 1
```

**Flags**:
- **Z**: Set if result is zero
- **S**: Set if bit 7 of result is set
- **C**: Not affected (preserves carry)

**Note**: In Z-80, INC does NOT affect the carry flag

---

#### DEC - Decrement
**Description**: Decrement register by 1

**Format**:
```assembly
DEC r        ; Decrement register
```

**Examples**:
```assembly
DEC A        ; A = A - 1
DEC B        ; B = B - 1
```

**Flags**:
- **Z**: Set if result is zero
- **S**: Set if bit 7 of result is set
- **C**: Not affected (preserves carry)

**Note**: In Z-80, DEC does NOT affect the carry flag

---

### Control Flow

#### JP - Jump (Unconditional)
**Description**: Jump to specified address (set PC)

**Format**:
```assembly
JP addr      ; Jump to address
```

**Examples**:
```assembly
JP 0100H     ; Jump to address 0x0100
JP 10        ; Jump to instruction 10
```

**Flags**: Not affected

**Note**: In Phase 1, address is an instruction index, not a memory address

---

#### JP NZ - Jump if Not Zero
**Description**: Conditional jump based on Zero flag

**Format**:
```assembly
JP NZ, addr  ; Jump to address if Z flag is clear
```

**Examples**:
```assembly
JP NZ, 5     ; Jump to instruction 5 if Z=0
JP NZ, 0020H ; Jump to 0x0020 if Z=0
```

**Condition**: Jumps only if **Z flag = 0** (result was not zero)

**Flags**: Not affected

**Use Case**: Loop until zero
```assembly
LD A, 05H    ; Counter = 5
DEC A        ; Decrement counter
JP NZ, 1     ; Loop back to DEC until A=0
```

---

### Miscellaneous

#### NOP - No Operation
**Description**: Do nothing, just advance PC

**Format**:
```assembly
NOP
```

**Flags**: Not affected

**Use Case**: Placeholder, timing delays

---

#### HALT - Halt Execution
**Description**: Stop CPU execution

**Format**:
```assembly
HALT
```

**Effect**: Sets `halted = true` in CPU state

**Use Case**: End of program
```assembly
LD A, 42H
HALT         ; Stop here
```

---

## Addressing Modes (Phase 1)

### 1. Immediate
```assembly
LD A, 42H    ; Direct value
ADD 10H      ; Direct value
```

### 2. Register
```assembly
LD A, B      ; Source is register
ADD C        ; Source is register
```

### 3. Implicit
```assembly
ADD B        ; A is implicit destination
SUB C        ; A is implicit destination
```

---

## Number Formats

### Hexadecimal with H suffix (Z-80 style)
```assembly
LD A, FFH
LD B, 10H
ADD 05H
```

### Hexadecimal with 0x prefix (C style)
```assembly
LD A, 0xFF
LD B, 0x10
ADD 0x05
```

### Decimal
```assembly
LD A, 255
LD B, 16
ADD 5
```

---

## Flag Register

| Bit | Flag | Name | Description |
|-----|------|------|-------------|
| 7   | S    | Sign | Set if bit 7 of result is 1 |
| 6   | Z    | Zero | Set if result is zero |
| 0   | C    | Carry| Set on overflow/underflow |

**Phase 1 Flags**: Z, S, C (subset of full Z-80 flags)

---

## Example Programs

### Example 1: Simple Addition
```assembly
LD A, 10H    ; A = 16
LD B, 20H    ; B = 32
ADD B        ; A = 48 (0x30)
HALT
```

**Result**: A = 0x30, Z=0, S=0, C=0

---

### Example 2: Overflow Detection
```assembly
LD A, FFH    ; A = 255
ADD 02H      ; A = 1 (overflow!)
HALT
```

**Result**: A = 0x01, Z=0, S=0, C=1 (carry set)

---

### Example 3: Zero Flag
```assembly
LD A, 05H    ; A = 5
SUB 05H      ; A = 0
HALT
```

**Result**: A = 0x00, Z=1, S=0, C=0

---

### Example 4: Sign Flag
```assembly
LD A, 80H    ; A = 128 (10000000 binary)
HALT
```

**Result**: A = 0x80, Z=0, S=1 (bit 7 set), C=0

---

### Example 5: Countdown Loop
```assembly
    LD A, 0AH    ; Counter = 10
loop:
    DEC A        ; Decrement
    JP NZ, loop  ; Repeat until zero
    HALT
```

**Result**: A = 0x00, Z=1, Loop executed 10 times

---

### Example 6: Register Copy Chain
```assembly
LD A, 42H    ; A = 0x42
LD B, A      ; B = 0x42
LD C, B      ; C = 0x42
LD D, C      ; D = 0x42
HALT
```

**Result**: A=B=C=D = 0x42

---

### Example 7: INC Overflow
```assembly
LD A, FFH    ; A = 255
INC A        ; A = 0 (overflow)
HALT
```

**Result**: A = 0x00, Z=1, S=0, C=0 (carry NOT set by INC)

---

## Common Patterns

### Initialize Multiple Registers
```assembly
LD A, 00H
LD B, 00H
LD C, 00H
```

### Accumulator Pattern
```assembly
LD A, 10H    ; Start value
ADD 05H      ; Add
ADD 03H      ; Add more
SUB 02H      ; Subtract
```

### Conditional Execution
```assembly
    LD A, 05H
    SUB 03H      ; A = 2
    JP NZ, skip  ; Jump if not zero
    LD B, FFH    ; This won't execute
skip:
    LD C, 42H    ; This will execute
```

---

## Instruction Encoding (Phase 1 Simplified)

In Phase 1, instructions are stored as structured objects, not raw opcodes:

```typescript
{
  mnemonic: 'LD',
  operand1: { type: 'register8', value: 'A' },
  operand2: { type: 'immediate8', value: 0x42 },
  sourceCode: 'LD A, 42H',
  address: 0
}
```

**Future Phase**: Will implement actual Z-80 opcode bytes

---

## Comments

Use semicolons for comments:

```assembly
LD A, 10H    ; This is a comment
; This entire line is a comment
ADD B        ; Add B to A
```

Empty lines are ignored.

---

## Error Conditions

### Invalid operand types
```assembly
LD 42H, A    ; ERROR: Destination must be register
```

### Missing operands
```assembly
LD A         ; ERROR: LD requires 2 operands
```

### Unknown mnemonics
```assembly
PUSH A       ; ERROR: Not implemented in Phase 1
```

### Out of bounds jump
```assembly
JP 9999H     ; ERROR: Address exceeds program length
```

---

## Tips for Writing Programs

1. **Always HALT**: End programs with `HALT` to prevent PC overflow
2. **Initialize before use**: Load values into registers before operations
3. **Watch flags**: Remember INC/DEC don't affect carry
4. **Use comments**: Document your code with `;`
5. **Test edge cases**: Try 0x00, 0xFF, and overflow scenarios
6. **Step through**: Use step-by-step execution to debug

---

## Quick Reference Card

| Instruction | Operands | Effect | Flags |
|-------------|----------|--------|-------|
| LD r, n     | reg, imm | r ← n  | - |
| LD r1, r2   | reg, reg | r1 ← r2| - |
| ADD r       | reg      | A ← A+r| Z,S,C |
| ADD n       | imm      | A ← A+n| Z,S,C |
| SUB r       | reg      | A ← A-r| Z,S,C |
| SUB n       | imm      | A ← A-n| Z,S,C |
| INC r       | reg      | r ← r+1| Z,S |
| DEC r       | reg      | r ← r-1| Z,S |
| JP n        | addr     | PC ← n | - |
| JP NZ, n    | addr     | If !Z: PC ← n | - |
| NOP         | -        | No op  | - |
| HALT        | -        | Stop   | - |

---

## Future Instructions (Phase 2+)

Coming soon:
- OR, AND, XOR (bitwise logic)
- CP (compare)
- CALL, RET (subroutines)
- PUSH, POP (stack)
- LD (HL), A (memory operations)
- 16-bit operations

---

## Educational Notes

### Why is A special?
In Z-80 architecture, the **A register (Accumulator)** is the primary register for arithmetic operations. Most ALU operations implicitly use A as the destination.

### What does "flag" mean?
Flags are 1-bit values that indicate properties of the last operation:
- **Z**: Was the result zero?
- **S**: Was the result negative (in two's complement)?
- **C**: Did the operation overflow/underflow?

### PC (Program Counter)
The PC points to the next instruction to execute. It automatically increments after each instruction (unless modified by JP).

### Two's Complement
- 0x00 to 0x7F: Positive (0 to 127)
- 0x80 to 0xFF: Negative (-128 to -1)
- The Sign flag indicates if bit 7 is set

---

For more details, see:
- `README.md` - Usage guide
- `ARCHITECTURE.md` - System design
- `example.ts` - Code examples
- `test.ts` - Test cases
