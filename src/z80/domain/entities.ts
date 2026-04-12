/**
 * Z-80 Domain Entities
 * Core data structures representing CPU state
 */

import type { Byte, Word, Address, Mnemonic, OperandType, Register8Bit, Register16Bit, IndexRegister, FlagName } from './types';

/**
 * 8-bit register state
 */
export interface Registers8Bit {
  A: Byte;
  B: Byte;
  C: Byte;
  D: Byte;
  E: Byte;
  H: Byte;
  L: Byte;
}

/**
 * 16-bit register state
 */
export interface Registers16Bit {
  PC: Word; // Program Counter
  SP: Word; // Stack Pointer
  IX: Word; // Index Register X
  IY: Word; // Index Register Y
}

/**
 * CPU Flags state (Complete Z-80 flag register)
 */
export interface CPUFlags {
  S: boolean;  // Sign flag (bit 7)
  Z: boolean;  // Zero flag (bit 6)
  Y: boolean;  // Undocumented flag (bit 5) - copy of bit 5 of result
  H: boolean;  // Half-carry flag (bit 4)
  X: boolean;  // Undocumented flag (bit 3) - copy of bit 3 of result
  P: boolean;  // Parity/Overflow flag (bit 2)
  N: boolean;  // Add/Subtract flag (bit 1)
  C: boolean;  // Carry flag (bit 0)
}

/**
 * Alternate (shadow) register set
 */
export interface AlternateRegisters {
  A: Byte;
  B: Byte;
  C: Byte;
  D: Byte;
  E: Byte;
  H: Byte;
  L: Byte;
  flags: CPUFlags; // Alternate F register
}

/**
 * Special Z-80 registers
 */
export interface SpecialRegisters {
  I: Byte;  // Interrupt Vector Register
  R: Byte;  // Memory Refresh Register
}

/**
 * Interrupt control
 */
export interface InterruptControl {
  IFF1: boolean; // Interrupt Flip-Flop 1
  IFF2: boolean; // Interrupt Flip-Flop 2
  IM: 0 | 1 | 2; // Interrupt Mode (0, 1, or 2)
}

/**
 * Performance counters
 */
export interface PerformanceCounters {
  clockCycles: number;      // Total clock cycles executed
  instructionsExecuted: number; // Total instructions executed
}

/**
 * Complete register state
 */
export interface RegisterState {
  registers8: Registers8Bit;
  registers16: Registers16Bit;
  flags: CPUFlags;
  alternate: AlternateRegisters;  // Shadow registers
  special: SpecialRegisters;      // I, R registers
  interrupt: InterruptControl;     // IFF1, IFF2, IM
}

/**
 * Memory map (256 bytes for Phase 1)
 */
export interface MemoryMap {
  bytes: Uint8Array;
  size: number;
}

/**
 * Parsed instruction representation
 */
export interface Instruction {
  mnemonic: Mnemonic;
  operand1?: OperandType;
  operand2?: OperandType;
  sourceCode: string; // Original assembly line
  address: Address;   // Memory address where instruction resides
}

/**
 * Complete CPU state
 */
export interface CPUState {
  registers: RegisterState;
  memory: MemoryMap;
  ioPorts: Uint8Array;   // 256 I/O ports (0x00-0xFF)
  halted: boolean;
  error: string | null;
  performance: PerformanceCounters;
  lastInstruction: {
    source: string;
    output: string;
  } | null;
}

/**
 * Execution result after a single step
 */
export interface ExecutionResult {
  success: boolean;
  updatedState: CPUState;
  message?: string;
  error?: string;
}
