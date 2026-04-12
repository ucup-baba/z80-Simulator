/**
 * CPU Executor
 * Orchestrates the fetch-decode-execute cycle
 */

import type { CPUState, ExecutionResult, Instruction, Mnemonic } from '../domain';
import { parseProgramWithOrg } from './instructionParser';
import { executeInstruction } from './instructionExecutor';
import { toWord } from './cpuStateFactory';

/**
 * Returns the clock cycles for an instruction
 * Based on standard Z-80 timing
 */
function getInstructionCycles(mnemonic: Mnemonic): number {
  const cycles: Partial<Record<Mnemonic, number>> = {
    LD: 7, ADD: 4, ADC: 4, SUB: 4, SBC: 4, CP: 4, INC: 4, DEC: 4,
    AND: 4, OR: 4, XOR: 4, CPL: 4, NEG: 8, SCF: 4, CCF: 4,
    SRL: 8, SLA: 8, SRA: 8, RL: 8, RR: 8, RLC: 8, RRC: 8,
    RLCA: 4, RLA: 4, RRCA: 4, RRA: 4,
    DAA: 4, RLD: 18, RRD: 18,
    BIT: 8, SET: 8, RES: 8,
    EX: 4, EXX: 4,
    LDI: 16, LDIR: 21, LDD: 16, LDDR: 21,
    CPI: 16, CPIR: 21, CPD: 16, CPDR: 21,
    JP: 10, JPNZ: 10, JPZ: 10, JPC: 10, JPNC: 10,
    JPP: 10, JPM: 10, JPPE: 10, JPPO: 10,
    JR: 12, JRNZ: 12, JRZ: 12, JRC: 12, JRNC: 12, DJNZ: 13,
    CALL: 17, CALLNZ: 17, CALLZ: 17, CALLC: 17, CALLNC: 17,
    CALLP: 17, CALLM: 17, CALLPE: 17, CALLPO: 17,
    RET: 10, RETNZ: 11, RETZ: 11, RETC: 11, RETNC: 11,
    RETP: 11, RETM: 11, RETPE: 11, RETPO: 11,
    RETI: 14, RETN: 14, RST: 11,
    PUSH: 11, POP: 10,
    IN: 11, OUT: 11,
    INI: 16, INIR: 21, IND: 16, INDR: 21,
    OUTI: 16, OTIR: 21, OUTD: 16, OTDR: 21,
    DI: 4, EI: 4, IM: 8,
    NOP: 4, HALT: 4,
  };

  return cycles[mnemonic] || 4;
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

  // FETCH: Get instruction at current PC
  if (pc >= program.instructions.length) {
    const errorState = {
      ...state,
      halted: true,
      error: `Program Counter (${pc}) out of bounds (program has ${program.instructions.length} instructions)`,
    };

    return {
      success: false,
      updatedState: errorState,
      error: errorState.error!,
    };
  }

  const instruction = program.instructions[pc];

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
  result.updatedState.performance.clockCycles += getInstructionCycles(instruction.mnemonic);

  // Update last instruction
  result.updatedState.lastInstruction = {
    source: instruction.sourceCode,
    output: result.message || '',
  };

  // Increment PC (unless instruction modified it, like JP)
  // Check if PC was modified by the instruction
  const pcWasModified = result.updatedState.registers.registers16.PC !== pc;

  if (!pcWasModified && !result.updatedState.halted) {
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