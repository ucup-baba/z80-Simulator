/**
 * ALU (Arithmetic Logic Unit) Operations
 * Pure functions for arithmetic/logic operations and flag computation
 */

import type { Byte, CPUFlags } from '../domain';
import { toByte, toWord } from './cpuStateFactory';

/**
 * Result of an ALU operation
 */
export interface ALUResult {
  result: Byte;
  flags: CPUFlags;
}

/**
 * Result of a 16-bit ALU operation
 */
export interface ALUResult16 {
  result: number;
  flags: CPUFlags;
}

/**
 * Counts the number of 1 bits (for parity calculation)
 */
function countBits(value: Byte): number {
  let count = 0;
  let n = value;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

/**
 * Updates all flags based on an 8-bit result
 */
function updateFlags(result: number, carry: boolean, halfCarry: boolean, overflow: boolean, isSubtract: boolean = false): CPUFlags {
  const byte = toByte(result);

  return {
    S: (byte & 0x80) !== 0,           // Sign: bit 7
    Z: byte === 0,                     // Zero: result is 0
    Y: (byte & 0x20) !== 0,           // Undocumented: bit 5
    H: halfCarry,                      // Half-carry: carry from bit 3 to 4
    X: (byte & 0x08) !== 0,           // Undocumented: bit 3
    P: overflow,                       // Parity/Overflow
    N: isSubtract,                     // Add/Subtract flag
    C: carry,                          // Carry: carry from bit 7
  };
}

/**
 * ADD operation (8-bit addition)
 */
export function aluAdd(a: Byte, b: Byte): ALUResult {
  const result = a + b;
  const carry = result > 0xFF;
  const halfCarry = ((a & 0x0F) + (b & 0x0F)) > 0x0F;

  // Overflow occurs when both operands have same sign and result has different sign
  const overflow = ((a ^ result) & (b ^ result) & 0x80) !== 0;

  return {
    result: toByte(result),
    flags: updateFlags(result, carry, halfCarry, overflow, false),
  };
}

/**
 * SUB operation (8-bit subtraction)
 */
export function aluSub(a: Byte, b: Byte): ALUResult {
  const result = a - b;
  const carry = result < 0; // Borrow occurred
  const halfCarry = ((a & 0x0F) - (b & 0x0F)) < 0;

  // Overflow occurs when operands have different signs and result has different sign from a
  const overflow = ((a ^ b) & (a ^ result) & 0x80) !== 0;

  return {
    result: toByte(result),
    flags: updateFlags(result, carry, halfCarry, overflow, true),
  };
}

/**
 * INC operation (8-bit increment)
 * Note: INC does not affect the Carry flag in Z-80
 */
export function aluInc(value: Byte, currentFlags: CPUFlags): ALUResult {
  const result = value + 1;
  const byte = toByte(result);
  const halfCarry = (value & 0x0F) === 0x0F;
  const overflow = value === 0x7F; // Overflow from 127 to 128

  return {
    result: byte,
    flags: {
      S: (byte & 0x80) !== 0,
      Z: byte === 0,
      Y: (byte & 0x20) !== 0,
      H: halfCarry,
      X: (byte & 0x08) !== 0,
      P: overflow,
      N: false, // INC is addition
      C: currentFlags.C, // Carry flag unchanged
    },
  };
}

/**
 * DEC operation (8-bit decrement)
 * Note: DEC does not affect the Carry flag in Z-80
 */
export function aluDec(value: Byte, currentFlags: CPUFlags): ALUResult {
  const result = value - 1;
  const byte = toByte(result);
  const halfCarry = (value & 0x0F) === 0x00;
  const overflow = value === 0x80; // Overflow from 128 to 127

  return {
    result: byte,
    flags: {
      S: (byte & 0x80) !== 0,
      Z: byte === 0,
      Y: (byte & 0x20) !== 0,
      H: halfCarry,
      X: (byte & 0x08) !== 0,
      P: overflow,
      N: true, // DEC is subtraction
      C: currentFlags.C, // Carry flag unchanged
    },
  };
}

/**
 * Evaluates a condition based on flags (extended with P/M/PE/PO)
 */
export type ConditionCode = 'NZ' | 'Z' | 'NC' | 'C' | 'P' | 'M' | 'PE' | 'PO';

export function evaluateCondition(condition: ConditionCode, flags: CPUFlags): boolean {
  switch (condition) {
    case 'NZ': return !flags.Z;   // Not Zero
    case 'Z':  return flags.Z;    // Zero
    case 'NC': return !flags.C;   // No Carry
    case 'C':  return flags.C;    // Carry
    case 'P':  return !flags.S;   // Positive (Sign = 0)
    case 'M':  return flags.S;    // Minus (Sign = 1)
    case 'PE': return flags.P;    // Parity Even (P/V = 1)
    case 'PO': return !flags.P;   // Parity Odd (P/V = 0)
  }
}

/**
 * SRL (Shift Right Logical) - Shifts bits right, bit 0 goes to Carry, bit 7 becomes 0
 */
export function aluSrl(value: Byte, currentFlags: CPUFlags): ALUResult {
  const carry = (value & 0x01) !== 0;
  const result = toByte(value >>> 1);

  return {
    result,
    flags: {
      S: (result & 0x80) !== 0,
      Z: result === 0,
      Y: (result & 0x20) !== 0,
      H: false,
      X: (result & 0x08) !== 0,
      P: countBits(result) % 2 === 0,
      N: false,
      C: carry,
    },
  };
}

/**
 * SLA (Shift Left Arithmetic) - Shifts bits left, bit 7 goes to Carry, bit 0 becomes 0
 */
export function aluSla(value: Byte, currentFlags: CPUFlags): ALUResult {
  const carry = (value & 0x80) !== 0;
  const result = toByte(value << 1);

  return {
    result,
    flags: {
      S: (result & 0x80) !== 0,
      Z: result === 0,
      Y: (result & 0x20) !== 0,
      H: false,
      X: (result & 0x08) !== 0,
      P: countBits(result) % 2 === 0,
      N: false,
      C: carry,
    },
  };
}

/**
 * RL (Rotate Left through Carry) - Shifts bits left, bit 7 goes to Carry, old Carry goes to bit 0
 */
export function aluRl(value: Byte, currentFlags: CPUFlags): ALUResult {
  const oldCarry = currentFlags.C ? 1 : 0;
  const carry = (value & 0x80) !== 0;
  const result = toByte((value << 1) | oldCarry);

  return {
    result,
    flags: {
      S: (result & 0x80) !== 0,
      Z: result === 0,
      Y: (result & 0x20) !== 0,
      H: false,
      X: (result & 0x08) !== 0,
      P: countBits(result) % 2 === 0,
      N: false,
      C: carry,
    },
  };
}

/**
 * DAA (Decimal Adjust Accumulator)
 * Adjusts A after BCD addition or subtraction based on N, H, and C flags.
 */
export function aluDaa(a: Byte, flags: CPUFlags): ALUResult {
  let correction = 0;
  let carry = flags.C;

  if (flags.N) {
    // After subtraction
    if (flags.H || (a & 0x0F) > 9) {
      correction -= 0x06;
    }
    if (flags.C || a > 0x99) {
      correction -= 0x60;
      carry = true;
    }
  } else {
    // After addition
    if (flags.H || (a & 0x0F) > 9) {
      correction += 0x06;
    }
    if (flags.C || a > 0x99) {
      correction += 0x60;
      carry = true;
    }
  }

  const result = toByte(a + correction);
  const halfCarry = ((a ^ result) & 0x10) !== 0;

  return {
    result,
    flags: {
      S: (result & 0x80) !== 0,
      Z: result === 0,
      Y: (result & 0x20) !== 0,
      H: halfCarry,
      X: (result & 0x08) !== 0,
      P: countBits(result) % 2 === 0,
      N: flags.N, // N flag is preserved from the previous operation
      C: carry,
    },
  };
}

/**
 * AND operation (8-bit bitwise AND with A)
 * H flag is always set, C flag is always reset
 */
export function aluAnd(a: Byte, b: Byte): ALUResult {
  const result = toByte(a & b);
  return {
    result,
    flags: {
      S: (result & 0x80) !== 0,
      Z: result === 0,
      Y: (result & 0x20) !== 0,
      H: true,  // Always set for AND
      X: (result & 0x08) !== 0,
      P: countBits(result) % 2 === 0,
      N: false,
      C: false, // Always reset for AND
    },
  };
}

/**
 * OR operation (8-bit bitwise OR with A)
 * H and C flags are always reset
 */
export function aluOr(a: Byte, b: Byte): ALUResult {
  const result = toByte(a | b);
  return {
    result,
    flags: {
      S: (result & 0x80) !== 0,
      Z: result === 0,
      Y: (result & 0x20) !== 0,
      H: false,
      X: (result & 0x08) !== 0,
      P: countBits(result) % 2 === 0,
      N: false,
      C: false,
    },
  };
}

/**
 * XOR operation (8-bit bitwise XOR with A)
 * H and C flags are always reset
 */
export function aluXor(a: Byte, b: Byte): ALUResult {
  const result = toByte(a ^ b);
  return {
    result,
    flags: {
      S: (result & 0x80) !== 0,
      Z: result === 0,
      Y: (result & 0x20) !== 0,
      H: false,
      X: (result & 0x08) !== 0,
      P: countBits(result) % 2 === 0,
      N: false,
      C: false,
    },
  };
}

/**
 * ADC (Add with Carry) — A = A + operand + C
 */
export function aluAdc(a: Byte, b: Byte, carryIn: boolean): ALUResult {
  const c = carryIn ? 1 : 0;
  const result = a + b + c;
  const byteResult = toByte(result);
  return {
    result: byteResult,
    flags: {
      S: (byteResult & 0x80) !== 0,
      Z: byteResult === 0,
      Y: (byteResult & 0x20) !== 0,
      H: ((a & 0x0F) + (b & 0x0F) + c) > 0x0F,
      X: (byteResult & 0x08) !== 0,
      P: ((a ^ b ^ 0x80) & (a ^ byteResult) & 0x80) !== 0,
      N: false,
      C: result > 0xFF,
    },
  };
}

/**
 * SBC (Subtract with Carry) — A = A - operand - C
 */
export function aluSbc(a: Byte, b: Byte, carryIn: boolean): ALUResult {
  const c = carryIn ? 1 : 0;
  const result = a - b - c;
  const byteResult = toByte(result);
  return {
    result: byteResult,
    flags: {
      S: (byteResult & 0x80) !== 0,
      Z: byteResult === 0,
      Y: (byteResult & 0x20) !== 0,
      H: (a & 0x0F) < (b & 0x0F) + c,
      X: (byteResult & 0x08) !== 0,
      P: ((a ^ b) & (a ^ byteResult) & 0x80) !== 0,
      N: true,
      C: result < 0,
    },
  };
}

/**
 * RR (Rotate Right through Carry) — bit 0 → C, old C → bit 7
 */
export function aluRr(value: Byte, flags: CPUFlags): ALUResult {
  const oldCarry = flags.C ? 0x80 : 0;
  const newCarry = (value & 0x01) !== 0;
  const result = toByte((value >> 1) | oldCarry);
  return {
    result,
    flags: {
      S: (result & 0x80) !== 0,
      Z: result === 0,
      Y: (result & 0x20) !== 0,
      H: false,
      X: (result & 0x08) !== 0,
      P: countBits(result) % 2 === 0,
      N: false,
      C: newCarry,
    },
  };
}

/**
 * RRC (Rotate Right Circular) — bit 0 → C AND bit 7
 */
export function aluRrc(value: Byte, _flags: CPUFlags): ALUResult {
  const bit0 = value & 0x01;
  const result = toByte((value >> 1) | (bit0 << 7));
  return {
    result,
    flags: {
      S: (result & 0x80) !== 0,
      Z: result === 0,
      Y: (result & 0x20) !== 0,
      H: false,
      X: (result & 0x08) !== 0,
      P: countBits(result) % 2 === 0,
      N: false,
      C: bit0 !== 0,
    },
  };
}

/**
 * RLC (Rotate Left Circular) — bit 7 → C AND bit 0
 */
export function aluRlc(value: Byte, _flags: CPUFlags): ALUResult {
  const bit7 = (value & 0x80) >> 7;
  const result = toByte((value << 1) | bit7);
  return {
    result,
    flags: {
      S: (result & 0x80) !== 0,
      Z: result === 0,
      Y: (result & 0x20) !== 0,
      H: false,
      X: (result & 0x08) !== 0,
      P: countBits(result) % 2 === 0,
      N: false,
      C: bit7 !== 0,
    },
  };
}

/**
 * SRA (Shift Right Arithmetic) — bit 0 → C, bit 7 stays the same
 */
export function aluSra(value: Byte, _flags: CPUFlags): ALUResult {
  const bit7 = value & 0x80;
  const newCarry = (value & 0x01) !== 0;
  const result = toByte((value >> 1) | bit7);
  return {
    result,
    flags: {
      S: (result & 0x80) !== 0,
      Z: result === 0,
      Y: (result & 0x20) !== 0,
      H: false,
      X: (result & 0x08) !== 0,
      P: countBits(result) % 2 === 0,
      N: false,
      C: newCarry,
    },
  };
}

/**
 * ADC HL, rr — 16-bit add with carry
 */
export function aluAdcHL(hl: number, rr: number, carryIn: boolean): ALUResult16 {
  const c = carryIn ? 1 : 0;
  const result = hl + rr + c;
  const wordResult = toWord(result);
  const carry = result > 0xFFFF;
  const halfCarry = ((hl & 0x0FFF) + (rr & 0x0FFF) + c) > 0x0FFF;
  // Overflow: both same sign, result different sign (16-bit signed)
  const overflow = ((hl ^ rr ^ 0x8000) & (hl ^ result) & 0x8000) !== 0;

  return {
    result: wordResult,
    flags: {
      S: (wordResult & 0x8000) !== 0,
      Z: wordResult === 0,
      Y: (wordResult & 0x2000) !== 0,
      H: halfCarry,
      X: (wordResult & 0x0800) !== 0,
      P: overflow,
      N: false,
      C: carry,
    },
  };
}

/**
 * SBC HL, rr — 16-bit subtract with carry
 */
export function aluSbcHL(hl: number, rr: number, carryIn: boolean): ALUResult16 {
  const c = carryIn ? 1 : 0;
  const result = hl - rr - c;
  const wordResult = toWord(result);
  const carry = result < 0;
  const halfCarry = (hl & 0x0FFF) < (rr & 0x0FFF) + c;
  const overflow = ((hl ^ rr) & (hl ^ result) & 0x8000) !== 0;

  return {
    result: wordResult,
    flags: {
      S: (wordResult & 0x8000) !== 0,
      Z: wordResult === 0,
      Y: (wordResult & 0x2000) !== 0,
      H: halfCarry,
      X: (wordResult & 0x0800) !== 0,
      P: overflow,
      N: true,
      C: carry,
    },
  };
}