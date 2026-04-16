/**
 * Program Analyzer — AI Adaptive Feedback Engine
 * Rule-based static analysis for Z-80 Assembly programs
 * Detects: register misuse, infinite loops, dead code, stack issues, efficiency tips
 */

import type { Instruction, Mnemonic } from '../domain';

// ─── Feedback types ────────────────────────────────────────────────

export type FeedbackSeverity = 'error' | 'warning' | 'info' | 'tip';
export type FeedbackCategory =
  | 'infinite-loop'
  | 'register-misuse'
  | 'dead-code'
  | 'stack-issue'
  | 'efficiency'
  | 'flag-awareness'
  | 'best-practice';

export interface AnalysisFeedback {
  id: string;
  severity: FeedbackSeverity;
  category: FeedbackCategory;
  line: number;           // 1-indexed line number in source code
  title: string;          // Short title (Indonesian)
  message: string;        // Detailed explanation (Indonesian)
  suggestion?: string;    // Optional fix suggestion
}

export interface AnalysisResult {
  feedbacks: AnalysisFeedback[];
  score: number;          // Quality score 0-100
  summary: string;        // Summary in Indonesian
}

// ─── Helper: mnemonics that are unconditional jumps ─────────────────

const UNCONDITIONAL_JUMPS: Mnemonic[] = ['JP', 'JR'];
const CONDITIONAL_JUMPS: Mnemonic[] = [
  'JPNZ', 'JPZ', 'JPC', 'JPNC', 'JPP', 'JPM', 'JPPE', 'JPPO',
  'JRNZ', 'JRZ', 'JRC', 'JRNC',
];
const ALL_JUMPS: Mnemonic[] = [...UNCONDITIONAL_JUMPS, ...CONDITIONAL_JUMPS, 'DJNZ'];
const CALL_MNEMONICS: Mnemonic[] = [
  'CALL', 'CALLNZ', 'CALLZ', 'CALLC', 'CALLNC',
  'CALLP', 'CALLM', 'CALLPE', 'CALLPO',
];
const RET_MNEMONICS: Mnemonic[] = [
  'RET', 'RETNZ', 'RETZ', 'RETC', 'RETNC',
  'RETP', 'RETM', 'RETPE', 'RETPO', 'RETI', 'RETN',
];
const TERMINATOR_MNEMONICS: Mnemonic[] = ['HALT', 'JP', 'JR', 'RET', 'RETI', 'RETN'];

const CONDITIONAL_CALL_SET = new Set<Mnemonic>(['CALLNZ', 'CALLZ', 'CALLC', 'CALLNC', 'CALLP', 'CALLM', 'CALLPE', 'CALLPO']);
const CONDITIONAL_RET_SET = new Set<Mnemonic>(['RETNZ', 'RETZ', 'RETC', 'RETNC', 'RETP', 'RETM', 'RETPE', 'RETPO']);

const FLAG_SETTERS: Mnemonic[] = [
  'CP', 'ADD', 'ADC', 'SUB', 'SBC', 'AND', 'OR', 'XOR',
  'INC', 'DEC', 'BIT', 'NEG', 'DAA',
];

/** Safely extract the value from an operand that has one */
function getOperandValue(op: Instruction['operand1']): unknown {
  if (!op) return undefined;
  if ('value' in op) return op.value;
  return undefined;
}

// ─── Analysis Rules ─────────────────────────────────────────────────

let feedbackId = 0;
function makeFeedback(
  severity: FeedbackSeverity,
  category: FeedbackCategory,
  line: number,
  title: string,
  message: string,
  suggestion?: string,
): AnalysisFeedback {
  return { id: `fb-${++feedbackId}`, severity, category, line, title, message, suggestion };
}

/**
 * Rule 1: Infinite Loop Detection
 * Detects backward jumps without exit conditions
 */
function checkInfiniteLoops(instructions: Instruction[]): AnalysisFeedback[] {
  const results: AnalysisFeedback[] = [];

  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];

    // Unconditional JP/JR that jumps backward or to self
    if (inst.mnemonic === 'JP' || inst.mnemonic === 'JR') {
      const target = getJumpTarget(inst);
      if (target !== null && target <= i) {
        // Check if there's any conditional exit between target and this jump
        const hasExit = hasExitCondition(instructions, target, i);
        if (!hasExit) {
          results.push(makeFeedback(
            'error', 'infinite-loop', i + 1,
            '🔴 Infinite Loop Terdeteksi',
            `Instruksi ${inst.mnemonic} di baris ${i + 1} selalu melompat kembali ke baris ${target + 1} tanpa kondisi keluar. Program akan berjalan selamanya.`,
            'Tambahkan kondisi keluar seperti CP diikuti JP NZ/JP Z, atau gunakan DJNZ dengan counter.',
          ));
        }
      }
    }

    // DJNZ without B modification between target and DJNZ
    if (inst.mnemonic === 'DJNZ') {
      const target = getJumpTarget(inst);
      if (target !== null && target <= i) {
        const modifiesB = checkRegisterModified(instructions, target, i, 'B');
        if (modifiesB) {
          // B is modified inside the loop body (besides the DJNZ itself), which is unusual
          // Only warn if B is being INC'd (would make infinite)
          for (let j = target; j < i; j++) {
            if (instructions[j].mnemonic === 'INC' &&
                instructions[j].operand1?.type === 'register8' &&
                getOperandValue(instructions[j].operand1) === 'B') {
              results.push(makeFeedback(
                'warning', 'infinite-loop', i + 1,
                '⚠️ DJNZ dengan INC B',
                `DJNZ di baris ${i + 1} berpasangan dengan INC B di baris ${j + 1}. Register B di-increment di dalam loop, sehingga counter tidak pernah habis.`,
                'Hapus INC B dari dalam loop, atau gunakan register lain untuk increment.',
              ));
            }
          }
        }
      }
    }
  }

  return results;
}

/**
 * Rule 2: Register Misuse Detection
 * Detects overwrites without usage, uninitialized usage
 */
function checkRegisterMisuse(instructions: Instruction[]): AnalysisFeedback[] {
  const results: AnalysisFeedback[] = [];

  for (let i = 0; i < instructions.length - 1; i++) {
    const inst = instructions[i];
    const next = instructions[i + 1];

    // LD A, x followed immediately by LD A, y (overwrite without use)
    if (inst.mnemonic === 'LD' && next.mnemonic === 'LD') {
      if (inst.operand1?.type === 'register8' && next.operand1?.type === 'register8') {
        if (inst.operand1.value === next.operand1.value) {
          const reg = inst.operand1.value;
          results.push(makeFeedback(
            'warning', 'register-misuse', i + 1,
            `⚠️ Register ${reg} Di-overwrite`,
            `Register ${reg} diisi di baris ${i + 1} lalu langsung ditimpa di baris ${i + 2} tanpa digunakan. Nilai pertama hilang sia-sia.`,
            `Hapus instruksi LD ${reg} di baris ${i + 1}, atau gunakan nilainya sebelum di-overwrite.`,
          ));
        }
      }
    }
  }

  // Detect ADD/SUB/etc on A without loading A first (A is still 0)
  let aInitialized = false;
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];

    // Check if A is set
    if (inst.mnemonic === 'LD' && inst.operand1?.type === 'register8' && inst.operand1.value === 'A') {
      aInitialized = true;
    }
    if (inst.mnemonic === 'XOR' || inst.mnemonic === 'POP' || inst.mnemonic === 'IN') {
      aInitialized = true;
    }

    // Check if arithmetic on A without init
    if (!aInitialized && ['ADD', 'SUB', 'ADC', 'SBC', 'AND', 'OR', 'CP'].includes(inst.mnemonic)) {
      if (!inst.operand1 || inst.operand1.type !== 'registerPair') {
        results.push(makeFeedback(
          'info', 'register-misuse', i + 1,
          '💭 Accumulator Belum Diinisialisasi',
          `Instruksi ${inst.mnemonic} di baris ${i + 1} mengoperasikan Accumulator (A), tetapi A belum diisi nilai sebelumnya. Nilai default A = 00H.`,
          'Tambahkan LD A, <nilai> sebelum operasi aritmetika.',
        ));
        break; // Only warn once
      }
    }

    // Reset on label/jump target
    if (ALL_JUMPS.includes(inst.mnemonic) || CALL_MNEMONICS.includes(inst.mnemonic)) {
      // Don't reset; flow could come from elsewhere
    }
  }

  return results;
}

/**
 * Rule 3: Dead Code Detection
 * Code after unconditional jumps, HALT, or RET that is unreachable
 */
function checkDeadCode(instructions: Instruction[]): AnalysisFeedback[] {
  const results: AnalysisFeedback[] = [];

  // Collect all jump/call targets
  const jumpTargets = new Set<number>();
  for (const inst of instructions) {
    const target = getJumpTarget(inst);
    if (target !== null) jumpTargets.add(target);
  }

  for (let i = 0; i < instructions.length - 1; i++) {
    const inst = instructions[i];

    if (TERMINATOR_MNEMONICS.includes(inst.mnemonic)) {
      // Check if next instruction is a jump target (reachable from elsewhere)
      if (!jumpTargets.has(i + 1)) {
        // Find the span of dead code
        let end = i + 1;
        while (end < instructions.length && !jumpTargets.has(end)) {
          end++;
        }
        if (end > i + 1) {
          results.push(makeFeedback(
            'info', 'dead-code', i + 2,
            '⚪ Dead Code Terdeteksi',
            `Baris ${i + 2}${end > i + 2 ? ` sampai ${end}` : ''} tidak akan pernah dieksekusi karena berada setelah ${inst.mnemonic} di baris ${i + 1} dan tidak ada instruksi yang melompat ke sini.`,
            'Hapus kode yang tidak terjangkau, atau tambahkan label agar bisa dijump ke sini.',
          ));
        }
      }
    }
  }

  return results;
}

/**
 * Rule 4: Stack Issues
 * PUSH without matching POP, CALL without RET
 */
function checkStackIssues(instructions: Instruction[]): AnalysisFeedback[] {
  const results: AnalysisFeedback[] = [];

  let pushCount = 0;
  let popCount = 0;
  const pushLines: number[] = [];
  const popLines: number[] = [];

  let callCount = 0;
  let retCount = 0;

  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    if (inst.mnemonic === 'PUSH') { pushCount++; pushLines.push(i + 1); }
    if (inst.mnemonic === 'POP') { popCount++; popLines.push(i + 1); }
    if (CALL_MNEMONICS.includes(inst.mnemonic)) callCount++;
    if (RET_MNEMONICS.includes(inst.mnemonic)) retCount++;
  }

  if (pushCount > popCount) {
    const diff = pushCount - popCount;
    results.push(makeFeedback(
      'warning', 'stack-issue', pushLines[0],
      '📦 Stack Tidak Seimbang',
      `Ditemukan ${pushCount}× PUSH tapi hanya ${popCount}× POP. Ada ${diff} nilai yang tertinggal di stack dan tidak pernah diambil.`,
      'Pastikan setiap PUSH memiliki POP yang sesuai, atau stack akan terus tumbuh.',
    ));
  } else if (popCount > pushCount) {
    const diff = popCount - pushCount;
    results.push(makeFeedback(
      'warning', 'stack-issue', popLines[popLines.length - 1],
      '📦 POP Berlebih',
      `Ditemukan ${popCount}× POP tapi hanya ${pushCount}× PUSH. ${diff} POP akan mengambil data yang tidak valid dari stack.`,
      'Pastikan setiap POP memiliki PUSH yang sesuai sebelumnya.',
    ));
  }

  return results;
}

/**
 * Rule 5: Efficiency Suggestions
 */
function checkEfficiency(instructions: Instruction[]): AnalysisFeedback[] {
  const results: AnalysisFeedback[] = [];

  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];

    // LD A, 0 → XOR A (1 byte vs 2 bytes, also clears flags)
    if (inst.mnemonic === 'LD' &&
        inst.operand1?.type === 'register8' && inst.operand1.value === 'A' &&
        inst.operand2?.type === 'immediate8' && inst.operand2.value === 0) {
      results.push(makeFeedback(
        'tip', 'efficiency', i + 1,
        '💡 Optimasi: Gunakan XOR A',
        '`LD A, 0` memerlukan 2 byte dan 7 clock cycle. `XOR A` hanya 1 byte dan 4 clock cycle, dengan hasil yang sama (A = 0).',
        'Ganti LD A, 0 dengan XOR A',
      ));
    }

    // Multiple INC on same register → ADD
    if (inst.mnemonic === 'INC' && inst.operand1?.type === 'register8') {
      const reg = inst.operand1.value;
      let count = 1;
      while (i + count < instructions.length &&
             instructions[i + count].mnemonic === 'INC' &&
             instructions[i + count].operand1?.type === 'register8' &&
             getOperandValue(instructions[i + count].operand1) === reg) {
        count++;
      }
      if (count >= 3) {
        results.push(makeFeedback(
          'tip', 'efficiency', i + 1,
          `💡 Optimasi: INC ${reg} Berulang`,
          `${count}× INC ${reg} berturut-turut (baris ${i + 1}-${i + count}) bisa diganti dengan satu instruksi ADD.`,
          `Gunakan LD B, ${count.toString(16).toUpperCase()}H lalu ADD B (jika ${reg} = A), atau pertimbangkan pendekatan lain.`,
        ));
      }
    }

    // NOP sequences
    if (inst.mnemonic === 'NOP') {
      let count = 1;
      while (i + count < instructions.length && instructions[i + count].mnemonic === 'NOP') {
        count++;
      }
      if (count >= 3) {
        results.push(makeFeedback(
          'info', 'efficiency', i + 1,
          '💤 NOP Berlebihan',
          `Ditemukan ${count}× NOP berturut-turut (baris ${i + 1}-${i + count}). NOP hanya membuang clock cycle tanpa melakukan apapun.`,
          'Hapus NOP yang tidak diperlukan, kecuali digunakan untuk timing delay yang disengaja.',
        ));
      }
    }
  }

  return results;
}

/**
 * Rule 6: Flag Awareness
 * CP without following conditional jump, ADD without carry check
 */
function checkFlagAwareness(instructions: Instruction[]): AnalysisFeedback[] {
  const results: AnalysisFeedback[] = [];

  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];

    // CP not followed by conditional jump
    if (inst.mnemonic === 'CP') {
      if (i + 1 < instructions.length) {
        const next = instructions[i + 1];
        const isConditional = CONDITIONAL_JUMPS.includes(next.mnemonic) ||
                              next.mnemonic === 'DJNZ' ||
                              CONDITIONAL_CALL_SET.has(next.mnemonic) ||
                              CONDITIONAL_RET_SET.has(next.mnemonic);
        if (!isConditional) {
          // Check if any of the next 3 instructions use the flags
          let usesFlags = false;
          for (let j = i + 1; j < Math.min(i + 4, instructions.length); j++) {
            const jInst = instructions[j];
            if (CONDITIONAL_JUMPS.includes(jInst.mnemonic) ||
                CONDITIONAL_CALL_SET.has(jInst.mnemonic) ||
                CONDITIONAL_RET_SET.has(jInst.mnemonic) ||
                jInst.mnemonic === 'DJNZ' ||
                jInst.mnemonic === 'ADC' || jInst.mnemonic === 'SBC') {
              usesFlags = true;
              break;
            }
            // If another flag-setter comes before usage, flags are overwritten
            if (FLAG_SETTERS.includes(jInst.mnemonic)) break;
          }
          if (!usesFlags) {
            results.push(makeFeedback(
              'info', 'flag-awareness', i + 1,
              '🏳️ Hasil CP Tidak Digunakan',
              `CP (Compare) di baris ${i + 1} mengubah flag Z dan C, tapi tidak ada instruksi jump/call conditional yang menggunakan hasilnya.`,
              'Tambahkan JP NZ, JP Z, JP C, atau JP NC setelah CP untuk memanfaatkan hasil perbandingan.',
            ));
          }
        }
      }
    }
  }

  return results;
}

/**
 * Rule 7: Best Practices
 */
function checkBestPractices(instructions: Instruction[]): AnalysisFeedback[] {
  const results: AnalysisFeedback[] = [];

  if (instructions.length === 0) return results;

  // Check if program ends with HALT
  const lastInst = instructions[instructions.length - 1];
  if (lastInst.mnemonic !== 'HALT' && !RET_MNEMONICS.includes(lastInst.mnemonic)) {
    results.push(makeFeedback(
      'warning', 'best-practice', instructions.length,
      '⚠️ Program Tanpa HALT',
      'Program tidak diakhiri dengan instruksi HALT. CPU akan mencoba mengeksekusi data di memori setelah program berakhir, yang bisa menyebabkan perilaku tidak terduga.',
      'Tambahkan HALT di akhir program utama Anda.',
    ));
  }

  // Check for very short programs (likely incomplete)
  if (instructions.length <= 2 && !instructions.some(i => i.mnemonic === 'HALT')) {
    results.push(makeFeedback(
      'info', 'best-practice', 1,
      '📝 Program Sangat Pendek',
      `Program hanya memiliki ${instructions.length} instruksi. Jika ini masih dalam pengembangan, pastikan untuk menambahkan logika dan HALT di akhir.`,
    ));
  }

  return results;
}

// ─── Utility functions ──────────────────────────────────────────────

function getJumpTarget(inst: Instruction): number | null {
  const op = inst.operand1;
  if (!op) return null;
  if (op.type === 'immediate8' || op.type === 'immediate16' || op.type === 'address') {
    return op.value;
  }
  return null;
}

function hasExitCondition(instructions: Instruction[], start: number, end: number): boolean {
  for (let i = start; i < end; i++) {
    const m = instructions[i].mnemonic;
    if (CONDITIONAL_JUMPS.includes(m) || m === 'DJNZ') {
      // Check if the conditional jump goes OUTSIDE the loop
      const target = getJumpTarget(instructions[i]);
      if (target !== null && (target < start || target > end)) {
        return true;
      }
    }
    if (m === 'HALT' || RET_MNEMONICS.includes(m)) return true;
  }
  return false;
}

function checkRegisterModified(instructions: Instruction[], start: number, end: number, reg: string): boolean {
  for (let i = start; i < end; i++) {
    const inst = instructions[i];
    // LD reg, x
    if (inst.mnemonic === 'LD' && inst.operand1?.type === 'register8' && inst.operand1.value === reg) return true;
    // INC/DEC reg
    if ((inst.mnemonic === 'INC' || inst.mnemonic === 'DEC') &&
        inst.operand1?.type === 'register8' && inst.operand1.value === reg) return true;
    // POP affects register pair
    if (inst.mnemonic === 'POP') return true;
  }
  return false;
}

// ─── Main Analyzer ──────────────────────────────────────────────────

/**
 * Analyzes a parsed program and returns adaptive feedback
 */
export function analyzeProgram(instructions: Instruction[]): AnalysisResult {
  feedbackId = 0; // Reset counter

  if (instructions.length === 0) {
    return {
      feedbacks: [],
      score: 0,
      summary: 'Tidak ada instruksi untuk dianalisis. Tulis kode Assembly Z-80 lalu klik "Load" terlebih dahulu.',
    };
  }

  const allFeedbacks: AnalysisFeedback[] = [
    ...checkInfiniteLoops(instructions),
    ...checkRegisterMisuse(instructions),
    ...checkDeadCode(instructions),
    ...checkStackIssues(instructions),
    ...checkEfficiency(instructions),
    ...checkFlagAwareness(instructions),
    ...checkBestPractices(instructions),
  ];

  // Calculate quality score
  const errorCount = allFeedbacks.filter(f => f.severity === 'error').length;
  const warningCount = allFeedbacks.filter(f => f.severity === 'warning').length;
  const infoCount = allFeedbacks.filter(f => f.severity === 'info').length;

  let score = 100;
  score -= errorCount * 25;    // Errors are severe
  score -= warningCount * 10;  // Warnings are moderate
  score -= infoCount * 3;      // Info is minor
  score = Math.max(0, Math.min(100, score));

  // Generate summary
  let summary: string;
  if (allFeedbacks.length === 0) {
    summary = '✅ Program terlihat baik! Tidak ditemukan masalah logika.';
    score = 100;
  } else if (errorCount > 0) {
    summary = `🔴 Ditemukan ${errorCount} error kritis${warningCount ? `, ${warningCount} peringatan` : ''}. Perlu perbaikan segera.`;
  } else if (warningCount > 0) {
    summary = `⚠️ Ditemukan ${warningCount} peringatan${infoCount ? ` dan ${infoCount} saran` : ''}. Program bisa berjalan tapi ada potensi masalah.`;
  } else {
    summary = `💡 Program berjalan baik. Ada ${allFeedbacks.length} saran untuk meningkatkan kualitas kode.`;
  }

  return { feedbacks: allFeedbacks, score, summary };
}
