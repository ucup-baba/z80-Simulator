/**
 * CPU Executor
 * Orchestrates the fetch-decode-execute cycle
 */

import type { CPUState, ExecutionResult, Instruction, Mnemonic } from '../domain';
import { parseProgramWithOrg } from './instructionParser';
import { executeInstruction } from './instructionExecutor';
import { toWord } from './cpuStateFactory';

/**
 * Increments the R register (refresh counter).
 * Only the lower 7 bits (0-6) increment; bit 7 is preserved.
 */
function incrementR(state: CPUState, amount: number): void {
  const r = state.registers.special.R;
  const bit7 = r & 0x80;
  state.registers.special.R = bit7 | ((r + amount) & 0x7F);
}

/**
 * Returns the number of M1 machine cycles for an instruction.
 * Prefixed instructions (DD/FD/ED/CB) have 2 M1 cycles, others have 1.
 * Used for R register refresh counting.
 */
function getM1Cycles(inst: Instruction): number {
  const { mnemonic, operand1: o1, operand2: o2 } = inst;

  // DD/FD prefix: IX/IY related instructions (also covers DD CB / FD CB)
  const hasIXIY =
    o1?.type === 'indexRegister' || o1?.type === 'indexedIX' || o1?.type === 'indexedIY' ||
    o2?.type === 'indexRegister' || o2?.type === 'indexedIX' || o2?.type === 'indexedIY';
  if (hasIXIY) return 2;

  // CB prefix: bit/shift operations (without IX/IY)
  const cbMnemonics: Mnemonic[] = ['BIT', 'SET', 'RES', 'RLC', 'RRC', 'RL', 'RR', 'SLA', 'SRA', 'SRL'];
  if (cbMnemonics.includes(mnemonic)) return 2;

  // ED prefix: block operations
  const edMnemonics: Mnemonic[] = [
    'NEG', 'RETN', 'RETI', 'IM', 'RLD', 'RRD',
    'LDI', 'LDD', 'LDIR', 'LDDR', 'CPI', 'CPD', 'CPIR', 'CPDR',
    'INI', 'IND', 'INIR', 'INDR', 'OUTI', 'OUTD', 'OTIR', 'OTDR',
  ];
  if (edMnemonics.includes(mnemonic)) return 2;

  // ED prefix: ADC/SBC HL,rr
  if ((mnemonic === 'ADC' || mnemonic === 'SBC') && o1?.type === 'registerPair') return 2;

  // ED prefix: IN r,(C) / OUT (C),r
  if (mnemonic === 'IN' && o2?.type === 'portRegister') return 2;
  if (mnemonic === 'OUT' && o1?.type === 'portRegister') return 2;

  // ED prefix: LD A,I / LD A,R / LD I,A / LD R,A
  if (o1?.type === 'specialRegister' || o2?.type === 'specialRegister') return 2;

  // Default: 1 M1 cycle (unprefixed instructions)
  return 1;
}

/**
 * Returns the clock cycles (T-states) for an instruction
 * Based on standard Z-80 timing from the official Zilog manual
 */
function getInstructionCycles(inst: Instruction): number {
  const o1 = inst.operand1;
  const o2 = inst.operand2;
  const isIndexed1 = o1?.type === 'indexedIX' || o1?.type === 'indexedIY';
  const isIndexed2 = o2?.type === 'indexedIX' || o2?.type === 'indexedIY';
  const isIndirect1 = o1?.type === 'indirect';
  const isIndirect2 = o2?.type === 'indirect';

  switch (inst.mnemonic) {
    // ── LD variants ──
    case 'LD': {
      // LD A,I / LD A,R / LD I,A / LD R,A = 9 (berprefiks ED)
      if (o1?.type === 'specialRegister' || o2?.type === 'specialRegister') return 9;
      // LD r, r' = 4
      if (o1?.type === 'register8' && o2?.type === 'register8') return 4;
      // LD r, n = 7
      if (o1?.type === 'register8' && o2?.type === 'immediate8') return 7;
      // LD r, (HL) = 7
      if (o1?.type === 'register8' && isIndirect2) return 7;
      // LD (HL), r = 7
      if (isIndirect1 && o2?.type === 'register8') return 7;
      // LD (HL), n = 10
      if (isIndirect1 && o2?.type === 'immediate8') return 10;
      // LD A, (nn) or LD (nn), A = 13
      if (o1?.type === 'register8' && o2?.type === 'indirectAddress') return 13;
      if (o1?.type === 'indirectAddress' && o2?.type === 'register8') return 13;
      // LD rr, nn = 10
      if (o1?.type === 'registerPair' && (o2?.type === 'immediate16' || o2?.type === 'immediate8')) return 10;
      // LD SP, nn = 10
      if (o1?.type === 'register16' && o1.value === 'SP' && (o2?.type === 'immediate16' || o2?.type === 'immediate8')) return 10;
      // LD SP, HL = 6
      if (o1?.type === 'register16' && o1.value === 'SP' && o2?.type === 'registerPair' && o2.value === 'HL') return 6;
      // LD SP, IX/IY = 10
      if (o1?.type === 'register16' && o1.value === 'SP' && o2?.type === 'indexRegister') return 10;
      // LD IX/IY, nn = 14
      if (o1?.type === 'indexRegister' && (o2?.type === 'immediate16' || o2?.type === 'immediate8')) return 14;
      // LD (nn), HL = 16, LD HL, (nn) = 16
      if (o1?.type === 'indirectAddress' && o2?.type === 'registerPair') return 16;
      if (o1?.type === 'registerPair' && o2?.type === 'indirectAddress') return 16;
      // LD (nn), IX/IY = 20, LD IX/IY, (nn) = 20
      if (o1?.type === 'indirectAddress' && o2?.type === 'indexRegister') return 20;
      if (o1?.type === 'indexRegister' && o2?.type === 'indirectAddress') return 20;
      // LD r, (IX+d) = 19, LD (IX+d), r = 19, LD (IX+d), n = 19
      if (isIndexed1 || isIndexed2) return 19;
      return 7; // default LD
    }

    // ── 8-bit Arithmetic/Logic ──
    case 'ADD': case 'ADC': case 'SUB': case 'SBC': case 'CP':
    case 'AND': case 'OR':  case 'XOR': {
      // ADC/SBC HL, rr = 15 (must check BEFORE generic ADD HL)
      if ((inst.mnemonic === 'ADC' || inst.mnemonic === 'SBC') && o1?.type === 'registerPair' && o1.value === 'HL') return 15;
      // ADD HL, rr = 11
      if (inst.mnemonic === 'ADD' && o1?.type === 'registerPair' && o1.value === 'HL') return 11;
      // ADD IX/IY, rr = 15
      if (o1?.type === 'indexRegister') return 15;
      // op A, (IX+d) = 19
      if (isIndexed1 || isIndexed2) return 19;
      // op A, (HL) = 7
      if (isIndirect1 || isIndirect2) return 7;
      // op A, n = 7
      if (o2?.type === 'immediate8' || o1?.type === 'immediate8') return 7;
      // op A, r = 4
      return 4;
    }

    // ── INC / DEC ──
    case 'INC': case 'DEC': {
      if (o1?.type === 'registerPair') return 6;
      if (o1?.type === 'indexRegister') return 10;
      if (isIndexed1) return 23;
      if (isIndirect1) return 11;
      return 4; // INC/DEC r
    }

    // ── Rotate/Shift ──
    case 'RLCA': case 'RLA': case 'RRCA': case 'RRA': return 4;
    case 'RL': case 'RR': case 'RLC': case 'RRC':
    case 'SLA': case 'SRA': case 'SRL': {
      if (isIndexed1) return 23;
      if (isIndirect1) return 15;
      return 8; // shift r
    }
    case 'RLD': case 'RRD': return 18;

    // ── BIT/SET/RES ──
    case 'BIT': {
      if (isIndexed2) return 20;
      if (isIndirect2) return 12;
      return 8;
    }
    case 'SET': case 'RES': {
      if (isIndexed2) return 23;
      if (isIndirect2) return 15;
      return 8;
    }

    // ── Exchange ──
    case 'EX': {
      if (o1?.type === 'indirectSP') return 19; // EX (SP), HL/IX/IY
      return 4; // EX DE,HL / EX AF,AF'
    }
    case 'EXX': return 4;

    // ── Block Transfer & Search (cycles tracked internally) ──
    case 'LDIR': case 'LDDR': case 'CPIR': case 'CPDR':
      return 0; // cycles added inside executor
    case 'LDI': case 'LDD': return 16;
    case 'CPI': case 'CPD': return 16;

    // ── Jump ──
    case 'JP': {
      if (isIndirect1 && o1?.value === 'HL') return 4; // JP (HL)
      if (o1?.type === 'indexRegister') return 8; // JP (IX)/(IY)
      return 10;
    }
    case 'JPNZ': case 'JPZ': case 'JPC': case 'JPNC':
    case 'JPP': case 'JPM': case 'JPPE': case 'JPPO': return 10;
    case 'JR': return 12;
    case 'JRNZ': case 'JRZ': case 'JRC': case 'JRNC': return 12; // taken=12, not-taken=7
    case 'DJNZ': return 13; // taken=13, not-taken=8

    // ── Call / Return ──
    case 'CALL': return 17;
    case 'CALLNZ': case 'CALLZ': case 'CALLC': case 'CALLNC':
    case 'CALLP': case 'CALLM': case 'CALLPE': case 'CALLPO': return 17; // taken=17, not-taken=10
    case 'RET': return 10;
    case 'RETNZ': case 'RETZ': case 'RETC': case 'RETNC':
    case 'RETP': case 'RETM': case 'RETPE': case 'RETPO': return 11; // taken=11, not-taken=5
    case 'RETI': case 'RETN': return 14;
    case 'RST': return 11;

    // ── Stack ──
    case 'PUSH': return o1?.type === 'indexRegister' ? 15 : 11;
    case 'POP':  return o1?.type === 'indexRegister' ? 14 : 10;

    // ── I/O ──
    case 'IN': case 'OUT': return 11;
    case 'INI': case 'IND': case 'OUTI': case 'OUTD': return 16;
    case 'INIR': case 'INDR': case 'OTIR': case 'OTDR': return 0; // tracked internally

    // ── Misc ──
    case 'CPL': return 4;
    case 'NEG': return 8;
    case 'SCF': case 'CCF': return 4;
    case 'DAA': return 4;
    case 'DI': case 'EI': return 4;
    case 'IM': return 8;
    case 'NOP': return 4;
    case 'HALT': return 4;

    default: return 4;
  }
}

/**
 * Program representation with parsed instructions
 */
export interface Program {
  instructions: Instruction[];
  sourceCode: string;
  orgAddress: number;
}

/**
 * Loads a program into memory (as instructions)
 */
export function loadProgram(code: string): Program {
  const { instructions, orgAddress } = parseProgramWithOrg(code);

  return {
    instructions,
    sourceCode: code,
    orgAddress,
  };
}

/**
 * Executes a single instruction step
 * This is the core fetch-decode-execute cycle
 */
export function step(state: CPUState, program: Program): ExecutionResult {
  // Check if CPU is halted
  if (state.halted) {
    return {
      success: false,
      updatedState: state,
      error: 'CPU is halted. Reset to continue.',
    };
  }

  // Check if there's an existing error
  if (state.error) {
    return {
      success: false,
      updatedState: state,
      error: state.error,
    };
  }

  const pc = state.registers.registers16.PC;

  // FETCH: Get instruction at current PC.
  // Program dimuat mulai dari alamat ORG, jadi PC harus digeser dulu
  // sebelum dipakai sebagai indeks ke daftar instruksi.
  const index = pc - program.orgAddress;

  if (index < 0 || index >= program.instructions.length) {
    const last = program.orgAddress + program.instructions.length - 1;
    const errorState = {
      ...state,
      halted: true,
      error: `Program Counter (${toWord(pc).toString(16).toUpperCase().padStart(4, '0')}H) di luar jangkauan program (${toWord(program.orgAddress).toString(16).toUpperCase().padStart(4, '0')}H - ${toWord(last).toString(16).toUpperCase().padStart(4, '0')}H)`,
    };

    return {
      success: false,
      updatedState: errorState,
      error: errorState.error!,
    };
  }

  const instruction = program.instructions[index];

  // DECODE & EXECUTE: Execute the instruction
  const result = executeInstruction(state, instruction);

  if (!result.success) {
    // Set error state
    const errorState = {
      ...result.updatedState,
      error: result.error || 'Execution failed',
    };

    return {
      ...result,
      updatedState: errorState,
    };
  }

  // Update performance counters
  result.updatedState.performance.instructionsExecuted += 1;
  result.updatedState.performance.clockCycles += getInstructionCycles(instruction);

  // Update R register (refresh counter) - increments on each M1 cycle
  incrementR(result.updatedState, getM1Cycles(instruction));

  // Update last instruction
  result.updatedState.lastInstruction = {
    source: instruction.sourceCode,
    output: result.message || '',
  };

  // Increment PC, kecuali instruksinya sendiri yang sudah menetapkan PC (JP/CALL/RET/...).
  // Memakai penanda `jumped`, bukan membandingkan nilai PC sebelum/sesudah:
  // lompatan ke diri sendiri seperti "LOOP: DJNZ LOOP" menghasilkan nilai PC
  // yang sama persis, sehingga perbandingan nilai akan salah menyimpulkan
  // bahwa tidak terjadi lompatan lalu diam-diam keluar dari loop.
  if (!result.jumped && !result.updatedState.halted) {
    result.updatedState.registers.registers16.PC = toWord(pc + 1);
  }

  return result;
}

/**
 * Executes all instructions until HALT or error
 */
export function runToCompletion(state: CPUState, program: Program, maxSteps: number = 1000): ExecutionResult {
  let currentState = state;
  let stepCount = 0;
  const messages: string[] = [];

  while (!currentState.halted && !currentState.error && stepCount < maxSteps) {
    const result = step(currentState, program);

    if (result.message) {
      messages.push(result.message);
    }

    if (!result.success) {
      return {
        ...result,
        message: messages.join('\n'),
      };
    }

    currentState = result.updatedState;
    stepCount++;
  }

  if (stepCount >= maxSteps) {
    return {
      success: false,
      updatedState: {
        ...currentState,
        error: `Execution stopped: maximum steps (${maxSteps}) reached. Possible infinite loop.`,
      },
      error: `Maximum steps (${maxSteps}) reached`,
      message: messages.join('\n'),
    };
  }

  return {
    success: true,
    updatedState: currentState,
    message: messages.join('\n'),
  };
}

/**
 * Steps through N instructions
 */
export function stepN(state: CPUState, program: Program, n: number): ExecutionResult {
  let currentState = state;
  const messages: string[] = [];

  for (let i = 0; i < n; i++) {
    if (currentState.halted || currentState.error) {
      break;
    }

    const result = step(currentState, program);

    if (result.message) {
      messages.push(result.message);
    }

    if (!result.success) {
      return {
        ...result,
        message: messages.join('\n'),
      };
    }

    currentState = result.updatedState;
  }

  return {
    success: true,
    updatedState: currentState,
    message: messages.join('\n'),
  };
}