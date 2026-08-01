/**
 * Z-80 Store (Adapter Layer)
 * Zustand store connecting UI to use cases
 */

import { create } from 'zustand';
import { examplePrograms } from '../data/examplePrograms';
import type { CPUState } from '../domain';
import type { Program } from '../usecases';
import type { AnalysisResult } from '../usecases';
import {
  createCPUState,
  resetCPUState,
  loadProgram,
  step,
  runToCompletion,
  analyzeProgram,
} from '../usecases';

export function speedToDelayMs(speed: number): number {
  if (speed >= 100) return 0;
  if (speed <= 50) {
    return Math.round(1000 - ((speed - 1) / 49) * 800);
  } else {
    return Math.round(200 - ((speed - 50) / 49) * 195);
  }
}

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
  analysisResult: AnalysisResult | null;
  speed: number;
  loadedSourceCode: string | null;
  isCodeDirty: boolean;

  // Actions
  setSourceCode: (code: string) => void;
  setSpeed: (speed: number) => void;
  loadCode: () => boolean;
  stepInstruction: () => boolean;
  runProgram: (overrideSpeed?: number) => void;
  pauseProgram: () => void;
  resetCPU: () => void;
  clearLog: () => void;
  writeMemory: (address: number, value: number) => void;
  analyzeCode: () => void;
  loadExampleProgram: (id: string) => void;
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
    LD A, D         ; Pindahkan nilai D ke Accumulator (A)
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

let runTimeoutId: ReturnType<typeof setTimeout> | null = null;

export const useZ80Store = create<Z80Store>((set, get) => ({
  // Initial state
  cpu: createCPUState(),
  program: null,
  sourceCode: DEFAULT_CODE,
  executionLog: [],
  isRunning: false,
  parseError: null,
  analysisResult: null,
  speed: 50,
  loadedSourceCode: null,
  isCodeDirty: false,

  setSpeed: (speed: number) => {
    set({ speed });
  },

  // Set source code (just updates the text, doesn't parse)
  setSourceCode: (code: string) => {
    const { loadedSourceCode, analysisResult } = get();
    const isCodeDirty = loadedSourceCode !== null ? (code !== loadedSourceCode) : true;
    set({
      sourceCode: code,
      isCodeDirty,
      analysisResult: isCodeDirty ? null : analysisResult,
      parseError: null,
    });
  },

  // Parse and load the program
  loadCode: () => {
    if (runTimeoutId !== null) {
      clearTimeout(runTimeoutId);
      runTimeoutId = null;
    }

    const { sourceCode } = get();

    try {
      const program = loadProgram(sourceCode);

      if (program.instructions.length === 0) {
        throw new Error('Kode program kosong atau tidak berisi instruksi Z-80 yang valid. Ketik kode atau pilih Contoh Program.');
      }

      const cpu = createCPUState();

      set({
        program,
        cpu,
        isRunning: false,
        parseError: null,
        loadedSourceCode: sourceCode,
        isCodeDirty: false,
        executionLog: [
          {
            timestamp: Date.now(),
            message: `Program loaded successfully (${program.instructions.length} instructions)`,
            type: 'success',
          },
        ],
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse program';

      set({
        program: null,
        cpu: createCPUState(),
        isRunning: false,
        parseError: errorMessage,
        loadedSourceCode: null,
        isCodeDirty: true,
        executionLog: [
          {
            timestamp: Date.now(),
            message: `Parse error: ${errorMessage}`,
            type: 'error',
          },
        ],
      });
      return false;
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
      return false;
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
      return false;
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

    return result.success && !result.updatedState.halted && !result.updatedState.error;
  },

  // Run program step-by-step with speed delay
  runProgram: (overrideSpeed?: number) => {
    const { cpu, program, executionLog, pauseProgram } = get();

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

    pauseProgram();

    set({ isRunning: true });

    let stepCount = 0;
    const maxSteps = 5000;

    const executeNextStep = () => {
      const { isRunning, cpu, program, speed: currentStoreSpeed } = get();

      if (!isRunning || !program || cpu.halted || cpu.error || stepCount >= maxSteps) {
        if (stepCount >= maxSteps && !cpu.halted && !cpu.error) {
          const { executionLog } = get();
          set({
            executionLog: [
              ...executionLog,
              {
                timestamp: Date.now(),
                message: `Execution stopped: maximum steps (${maxSteps}) reached.`,
                type: 'error',
              },
            ],
          });
        }
        set({ isRunning: false });
        if (runTimeoutId !== null) {
          clearTimeout(runTimeoutId);
          runTimeoutId = null;
        }
        return;
      }

      stepCount++;
      const canContinue = get().stepInstruction();

      const updatedCpu = get().cpu;
      if (!canContinue || updatedCpu.halted || updatedCpu.error) {
        set({ isRunning: false });
        if (runTimeoutId !== null) {
          clearTimeout(runTimeoutId);
          runTimeoutId = null;
        }
        return;
      }

      const activeSpeed = overrideSpeed ?? currentStoreSpeed;
      const delayMs = speedToDelayMs(activeSpeed);

      if (delayMs <= 0) {
        runTimeoutId = setTimeout(executeNextStep, 0);
      } else {
        runTimeoutId = setTimeout(executeNextStep, delayMs);
      }
    };

    executeNextStep();
  },

  // Pause execution
  pauseProgram: () => {
    if (runTimeoutId !== null) {
      clearTimeout(runTimeoutId);
      runTimeoutId = null;
    }
    set({ isRunning: false });
  },

  // Reset CPU to initial state
  resetCPU: () => {
    if (runTimeoutId !== null) {
      clearTimeout(runTimeoutId);
      runTimeoutId = null;
    }
    const { cpu, loadedSourceCode, sourceCode } = get();
    const isCodeDirty = loadedSourceCode !== null ? (sourceCode !== loadedSourceCode) : true;

    set({
      cpu: resetCPUState(cpu),
      isRunning: false,
      isCodeDirty,
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

  // Analyze code with AI feedback engine
  analyzeCode: () => {
    const { program } = get();
    if (!program) {
      set({ analysisResult: { feedbacks: [], score: 0, summary: 'Load program terlebih dahulu sebelum menganalisis.' } });
      return;
    }
    const result = analyzeProgram(program.instructions);
    set({ analysisResult: result });
  },

  // Load example program by ID
  loadExampleProgram: (id: string) => {
    if (runTimeoutId !== null) {
      clearTimeout(runTimeoutId);
      runTimeoutId = null;
    }

    const example = examplePrograms.find((p) => p.id === id);
    if (!example) return;

    set({
      sourceCode: example.code,
      program: null,
      cpu: createCPUState(),
      isRunning: false,
      parseError: null,
      analysisResult: null,
      executionLog: [
        {
          timestamp: Date.now(),
          message: `Contoh program "${example.title}" berhasil dimuat.`,
          type: 'success',
        },
      ],
    });
  },
}));