/**
 * Z-80 Store (Adapter Layer)
 * Zustand store connecting UI to use cases
 */

import { create } from 'zustand';
import type { CPUState } from '../domain';
import type { Program } from '../usecases';
import {
  createCPUState,
  resetCPUState,
  loadProgram,
  step,
  runToCompletion,
} from '../usecases';

interface ExecutionLogEntry {
  timestamp: number;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface Z80Store {
  // State
  cpu: CPUState;
  program: Program | null;
  sourceCode: string;
  executionLog: ExecutionLogEntry[];
  isRunning: boolean;
  parseError: string | null;

  // Actions
  setSourceCode: (code: string) => void;
  loadCode: () => void;
  stepInstruction: () => void;
  runProgram: () => void;
  resetCPU: () => void;
  clearLog: () => void;
  writeMemory: (address: number, value: number) => void;
}

const DEFAULT_CODE = `; ========================================================
; STRESS TEST Z-80: DERET FIBONACCI & OVERFLOW TRAP
; Menguji: ALU, Memory Write, HL Pointer, B Counter, 
;          Zero Flag (Z), dan Carry Flag (C).
; ========================================================

ORG 0000H

    LD HL, 0050H    ; Set HL sebagai pointer memori ke alamat 0050H
    LD B, 0EH       ; Set Counter Loop (coba cari 14 angka)
    LD D, 00H       ; Angka pertama (0)
    LD E, 01H       ; Angka kedua (1)

    ; Simpan dua angka pertama secara manual ke RAM
    LD (HL), D      
    INC HL          
    LD (HL), E      
    INC HL          
    
    DEC B           ; Kurangi counter (karena 2 angka sudah masuk)
    DEC B           

LOOP_FIB:
    LD A, D         ; Pindahkan nilai D ke Akumulator (A)
    ADD A, E        ; A = A + E (Proses Penjumlahan Fibonacci)

    ; --- JEBAKAN FLAG ---
    ; Deret ke-14 adalah 377. Karena arsitektur 8-bit maksimal 255,
    ; penjumlahan ini akan JEBOL (Overflow) dan menyalakan CARRY FLAG (C)!
    JP C, OVERFLOW  ; Lompat ke label OVERFLOW jika Carry Flag = 1

    LD (HL), A      ; Jika aman, simpan hasil penjumlahan ke memori
    INC HL          ; Geser pointer HL ke alamat berikutnya

    ; Geser variabel untuk putaran berikutnya (D <- E, E <- A)
    LD D, E         
    LD E, A         

    DEC B           ; Kurangi counter (B = B - 1)
    JP NZ, LOOP_FIB ; Jika Zero Flag belum menyala, ulangi loop!

    JP SELESAI      ; Jika loop selesai normal, lompat ke Akhir

OVERFLOW:
    LD A, 0FFH      ; Masukkan nilai FF (255) sebagai KODE ERROR
    LD (HL), A      ; Tulis KODE ERROR tersebut ke memori terakhir

SELESAI:
    HALT            ; Matikan CPU`;

export const useZ80Store = create<Z80Store>((set, get) => ({
  // Initial state
  cpu: createCPUState(),
  program: null,
  sourceCode: DEFAULT_CODE,
  executionLog: [],
  isRunning: false,
  parseError: null,

  // Set source code (just updates the text, doesn't parse)
  setSourceCode: (code: string) => {
    set({ sourceCode: code });
  },

  // Parse and load the program
  loadCode: () => {
    const { sourceCode } = get();

    try {
      const program = loadProgram(sourceCode);
      const cpu = createCPUState();

      set({
        program,
        cpu,
        parseError: null,
        executionLog: [
          {
            timestamp: Date.now(),
            message: `Program loaded successfully (${program.instructions.length} instructions)`,
            type: 'success',
          },
        ],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse program';

      set({
        parseError: errorMessage,
        executionLog: [
          {
            timestamp: Date.now(),
            message: `Parse error: ${errorMessage}`,
            type: 'error',
          },
        ],
      });
    }
  },

  // Execute one instruction
  stepInstruction: () => {
    const { cpu, program, executionLog } = get();

    if (!program) {
      set({
        executionLog: [
          ...executionLog,
          {
            timestamp: Date.now(),
            message: 'No program loaded. Click "Load" first.',
            type: 'error',
          },
        ],
      });
      return;
    }

    if (cpu.halted) {
      set({
        executionLog: [
          ...executionLog,
          {
            timestamp: Date.now(),
            message: 'CPU is halted. Click "Reset" to restart.',
            type: 'error',
          },
        ],
      });
      return;
    }

    const result = step(cpu, program);

    const newLogEntry: ExecutionLogEntry = {
      timestamp: Date.now(),
      message: result.message || 'Step executed',
      type: result.success ? 'info' : 'error',
    };

    set({
      cpu: result.updatedState,
      executionLog: [...executionLog, newLogEntry],
    });
  },

  // Run program to completion
  runProgram: () => {
    const { cpu, program, executionLog } = get();

    if (!program) {
      set({
        executionLog: [
          ...executionLog,
          {
            timestamp: Date.now(),
            message: 'No program loaded. Click "Load" first.',
            type: 'error',
          },
        ],
      });
      return;
    }

    if (cpu.halted) {
      set({
        executionLog: [
          ...executionLog,
          {
            timestamp: Date.now(),
            message: 'CPU is halted. Click "Reset" to restart.',
            type: 'error',
          },
        ],
      });
      return;
    }

    set({ isRunning: true });

    const result = runToCompletion(cpu, program);

    const messages = result.message ? result.message.split('\n') : [];
    const newLogEntries: ExecutionLogEntry[] = messages.map(msg => ({
      timestamp: Date.now(),
      message: msg,
      type: result.success ? 'info' : 'error',
    }));

    set({
      cpu: result.updatedState,
      executionLog: [...executionLog, ...newLogEntries],
      isRunning: false,
    });
  },

  // Reset CPU to initial state
  resetCPU: () => {
    const { cpu } = get();

    set({
      cpu: resetCPUState(cpu),
      executionLog: [
        {
          timestamp: Date.now(),
          message: 'CPU reset to initial state',
          type: 'info',
        },
      ],
    });
  },

  // Clear execution log
  clearLog: () => {
    set({ executionLog: [] });
  },

  // Write to memory
  writeMemory: (address: number, value: number) => {
    const { cpu, executionLog } = get();

    if (address < 0 || address >= cpu.memory.size) {
      set({
        executionLog: [
          ...executionLog,
          {
            timestamp: Date.now(),
            message: `Memory write failed: address ${address.toString(16).toUpperCase()}H out of range`,
            type: 'error',
          },
        ],
      });
      return;
    }

    if (value < 0 || value > 0xFF) {
      set({
        executionLog: [
          ...executionLog,
          {
            timestamp: Date.now(),
            message: `Memory write failed: value ${value} out of range (0-255)`,
            type: 'error',
          },
        ],
      });
      return;
    }

    const newCpu = { ...cpu };
    newCpu.memory.bytes[address] = value;

    set({
      cpu: newCpu,
      executionLog: [
        ...executionLog,
        {
          timestamp: Date.now(),
          message: `Memory write: @${address.toString(16).toUpperCase().padStart(4, '0')}H = ${value.toString(16).toUpperCase().padStart(2, '0')}H`,
          type: 'success',
        },
      ],
    });
  },
}));