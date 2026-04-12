/**
 * CPU State Factory
 * Creates and initializes CPU state
 */

import type { CPUState, MemoryMap, RegisterState } from '../domain';

/**
 * Memory size in bytes (64KB - Full Z-80 addressable memory)
 */
const MEMORY_SIZE = 65536; // 64KB = 0x0000 to 0xFFFF

/**
 * Creates an initial memory map with all zeros
 */
export function createMemory(size: number = MEMORY_SIZE): MemoryMap {
  return {
    bytes: new Uint8Array(size),
    size,
  };
}

/**
 * Creates initial flags state with all flags set to false
 */
export function createFlags() {
  return {
    S: false,  // Sign
    Z: false,  // Zero
    Y: false,  // Undocumented (bit 5)
    H: false,  // Half-carry
    X: false,  // Undocumented (bit 3)
    P: false,  // Parity/Overflow
    N: false,  // Add/Subtract
    C: false,  // Carry
  };
}

/**
 * Creates initial register state with all registers set to 0
 */
export function createRegisterState(): RegisterState {
  return {
    registers8: {
      A: 0x00,
      B: 0x00,
      C: 0x00,
      D: 0x00,
      E: 0x00,
      H: 0x00,
      L: 0x00,
    },
    registers16: {
      PC: 0x0000,
      SP: 0x00FF, // Stack grows downward from 0xFF
      IX: 0x0000, // Index Register X
      IY: 0x0000, // Index Register Y
    },
    flags: createFlags(),
    alternate: {
      A: 0x00,
      B: 0x00,
      C: 0x00,
      D: 0x00,
      E: 0x00,
      H: 0x00,
      L: 0x00,
      flags: createFlags(),
    },
    special: {
      I: 0x00,  // Interrupt Vector
      R: 0x00,  // Refresh Register
    },
    interrupt: {
      IFF1: false,  // Interrupts disabled by default
      IFF2: false,
      IM: 0,        // Interrupt Mode 0
    },
  };
}

/**
 * Creates a fresh CPU state
 */
export function createCPUState(): CPUState {
  return {
    registers: createRegisterState(),
    memory: createMemory(),
    ioPorts: new Uint8Array(256),
    halted: false,
    error: null,
    performance: {
      clockCycles: 0,
      instructionsExecuted: 0,
    },
    lastInstruction: null,
  };
}

/**
 * Resets CPU state to initial values
 */
export function resetCPUState(state: CPUState): CPUState {
  return {
    ...state,
    registers: createRegisterState(),
    memory: createMemory(state.memory.size),
    ioPorts: new Uint8Array(256),
    halted: false,
    error: null,
    performance: {
      clockCycles: 0,
      instructionsExecuted: 0,
    },
    lastInstruction: null,
  };
}

/**
 * Validates if a value is a valid 8-bit byte
 */
export function isValidByte(value: number): boolean {
  return Number.isInteger(value) && value >= 0x00 && value <= 0xFF;
}

/**
 * Validates if a value is a valid 16-bit word
 */
export function isValidWord(value: number): boolean {
  return Number.isInteger(value) && value >= 0x0000 && value <= 0xFFFF;
}

/**
 * Clamps a number to 8-bit range
 */
export function toByte(value: number): number {
  return value & 0xFF;
}

/**
 * Clamps a number to 16-bit range
 */
export function toWord(value: number): number {
  return value & 0xFFFF;
}
