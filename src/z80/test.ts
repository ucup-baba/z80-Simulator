/**
 * Uji regresi untuk logika inti CPU Z-80.
 *
 * Jalankan dengan: npm test
 *
 * Sengaja tanpa framework pengujian — hanya esbuild (yang sudah dipakai Vite)
 * dan Node. Fokusnya pada perilaku yang terlihat mahasiswa: hasil register,
 * flag, dan alur eksekusi.
 */

import {
  createCPUState,
  resetCPUState,
  loadProgram,
  step,
  toByte,
} from './usecases';
import { examplePrograms } from './data/examplePrograms';
import type { CPUState } from './domain';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`      ${error instanceof Error ? error.message : String(error)}`);
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message ? `${message}: diharapkan ${expected}, dapat ${actual}` : `Diharapkan ${expected}, dapat ${actual}`);
  }
}

function assertThrows(fn: () => unknown, mustContain: string) {
  let thrown: unknown = null;
  try {
    fn();
  } catch (e) {
    thrown = e;
  }
  if (thrown === null) throw new Error(`Diharapkan melempar error yang memuat "${mustContain}", tetapi tidak ada error`);
  const message = thrown instanceof Error ? thrown.message : String(thrown);
  if (!message.includes(mustContain)) {
    throw new Error(`Pesan error harus memuat "${mustContain}", dapat "${message}"`);
  }
}

/** Menjalankan program sampai HALT, error, atau batas langkah. */
function runProgram(code: string, maxSteps = 5000): { cpu: CPUState; steps: number } {
  const program = loadProgram(code);
  let cpu = createCPUState();
  cpu.registers.registers16.PC = program.orgAddress;

  let steps = 0;
  while (!cpu.halted && !cpu.error && steps < maxSteps) {
    cpu = step(cpu, program).updatedState;
    steps++;
  }
  return { cpu, steps };
}

console.log('Uji regresi inti Z-80');

// ─────────────────────────────────────────────────────────────
section('State CPU');

test('State awal mengosongkan register dan menaruh SP di puncak memori', () => {
  const cpu = createCPUState();
  assertEqual(cpu.registers.registers8.A, 0, 'A');
  assertEqual(cpu.registers.registers16.PC, 0, 'PC');
  assertEqual(cpu.registers.registers16.SP, 0xFFFF, 'SP');
  assertEqual(cpu.memory.size, 65536, 'ukuran memori');
  assertEqual(cpu.halted, false, 'halted');
  assertEqual(cpu.error, null, 'error');
});

test('Reset mengembalikan PC ke alamat awal yang diberikan', () => {
  const cpu = createCPUState();
  cpu.registers.registers8.A = 0x42;
  const reset = resetCPUState(cpu, 0x8000);
  assertEqual(reset.registers.registers8.A, 0, 'A ikut direset');
  assertEqual(reset.registers.registers16.PC, 0x8000, 'PC');
});

test('toByte membungkus nilai ke rentang 8-bit', () => {
  assertEqual(toByte(0x1FF), 0xFF);
  assertEqual(toByte(-1), 0xFF);
  assertEqual(toByte(256), 0x00);
});

// ─────────────────────────────────────────────────────────────
section('Parser');

test('Mengurai LD dengan operand register dan immediate', () => {
  const program = loadProgram('LD A, 05H');
  const inst = program.instructions[0];
  assertEqual(inst.mnemonic, 'LD');
  assertEqual(inst.operand1?.type, 'register8');
  assertEqual(inst.operand2?.type, 'immediate8');
});

test('Menerima format angka H, 0x, dan desimal', () => {
  const program = loadProgram('LD A, 0FFH\nLD B, 0x10\nLD C, 9');
  assertEqual(program.instructions[0].operand2?.type === 'immediate8' ? program.instructions[0].operand2.value : -1, 0xFF);
  assertEqual(program.instructions[1].operand2?.type === 'immediate8' ? program.instructions[1].operand2.value : -1, 0x10);
  assertEqual(program.instructions[2].operand2?.type === 'immediate8' ? program.instructions[2].operand2.value : -1, 9);
});

test('Menormalkan percabangan bersyarat "JP NZ" menjadi JPNZ', () => {
  const program = loadProgram('JP NZ, 0');
  assertEqual(program.instructions[0].mnemonic, 'JPNZ');
});

test('Menolak nilai 8-bit yang melebihi batas', () => {
  assertThrows(() => loadProgram('LD A, 1FFH'), 'melebihi batas 8-bit');
});

// ─────────────────────────────────────────────────────────────
section('Eksekusi & flag');

test('ADD menaikkan Carry saat melewati 255', () => {
  const { cpu } = runProgram('LD A, 0FFH\nADD A, 01H\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x00, 'A');
  assertEqual(cpu.registers.flags.C, true, 'Carry');
  assertEqual(cpu.registers.flags.Z, true, 'Zero');
});

test('ADD menaikkan Overflow saat 7FH + 1 melewati batas bertanda', () => {
  const { cpu } = runProgram('LD A, 7FH\nADD A, 01H\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x80, 'A');
  assertEqual(cpu.registers.flags.P, true, 'Overflow');
  assertEqual(cpu.registers.flags.S, true, 'Sign');
  assertEqual(cpu.registers.flags.C, false, 'Carry tidak ikut naik');
});

test('CP menyalakan Zero tanpa mengubah A', () => {
  const { cpu } = runProgram('LD A, 05H\nCP 05H\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x05, 'A tetap');
  assertEqual(cpu.registers.flags.Z, true, 'Zero');
  assertEqual(cpu.registers.flags.N, true, 'N (operasi kurang)');
});

test('INC tidak mengubah Carry', () => {
  const { cpu } = runProgram('LD A, 0FFH\nADD A, 01H\nINC A\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x01, 'A');
  assertEqual(cpu.registers.flags.C, true, 'Carry dipertahankan');
});

test('PUSH lalu POP memindahkan pasangan register', () => {
  const { cpu } = runProgram('LD BC, 1234H\nPUSH BC\nPOP DE\nHALT');
  assertEqual(cpu.registers.registers8.D, 0x12, 'D');
  assertEqual(cpu.registers.registers8.E, 0x34, 'E');
});

test('CALL dan RET kembali ke instruksi berikutnya', () => {
  const { cpu } = runProgram('LD A, 01H\nCALL SUB\nHALT\nSUB: INC A\nRET');
  assertEqual(cpu.registers.registers8.A, 0x02, 'A');
  assertEqual(cpu.halted, true, 'berhenti di HALT');
});

// ─────────────────────────────────────────────────────────────
section('Lompatan ke diri sendiri (regresi: PC tidak berubah nilainya)');

test('DJNZ ke labelnya sendiri berputar sampai B habis', () => {
  const { cpu } = runProgram('LD B, 03H\nLOOP: DJNZ LOOP\nHALT');
  assertEqual(cpu.registers.registers8.B, 0x00, 'B');
  assertEqual(cpu.halted, true, 'mencapai HALT');
});

test('JP ke labelnya sendiri benar-benar berputar tanpa henti', () => {
  const { cpu, steps } = runProgram('HERE: JP HERE\nHALT', 50);
  assertEqual(cpu.registers.registers16.PC, 0, 'PC tetap di lompatan');
  assertEqual(cpu.halted, false, 'tidak boleh jatuh ke HALT');
  assertEqual(steps, 50, 'berputar sampai batas langkah');
});

// ─────────────────────────────────────────────────────────────
section('Label yang bernama sama dengan register');

test('Label "L" dipakai sebagai target DJNZ', () => {
  const { cpu } = runProgram('LD B, 03H\nL: DJNZ L\nHALT');
  assertEqual(cpu.error, null, 'tanpa error');
  assertEqual(cpu.registers.registers8.B, 0x00, 'B');
});

test('Label "C" dipakai sebagai target JP NZ', () => {
  const { cpu } = runProgram('LD A, 00H\nC: INC A\nCP 03H\nJP NZ, C\nHALT');
  assertEqual(cpu.error, null, 'tanpa error');
  assertEqual(cpu.registers.registers8.A, 0x03, 'A');
});

test('Register biasa tetap terbaca sebagai register di posisi non-lompatan', () => {
  const { cpu } = runProgram('LD B, 07H\nLD A, B\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x07, 'A menyalin B');
});

// ─────────────────────────────────────────────────────────────
section('Direktif ORG');

test('ORG menggeser PC awal, label, dan alamat instruksi', () => {
  const program = loadProgram('ORG 8000H\nLD B, 02H\nLOOP: DJNZ LOOP\nHALT');
  assertEqual(program.orgAddress, 0x8000, 'orgAddress');
  assertEqual(program.instructions[0].address, 0x8000, 'alamat instruksi pertama');

  const { cpu } = runProgram('ORG 8000H\nLD B, 02H\nLOOP: DJNZ LOOP\nHALT');
  assertEqual(cpu.registers.registers16.PC, 0x8002, 'PC berhenti di HALT');
  assertEqual(cpu.registers.registers8.B, 0x00, 'B');
  assertEqual(cpu.halted, true, 'halted');
});

test('Tanpa ORG, program tetap mulai dari 0000H', () => {
  const program = loadProgram('LD A, 01H\nHALT');
  assertEqual(program.orgAddress, 0, 'orgAddress');
});

test('ORG dengan alamat tidak sah ditolak', () => {
  assertThrows(() => loadProgram('ORG 12345H\nHALT'), 'Invalid ORG address');
});

// ─────────────────────────────────────────────────────────────
section('Jangkauan JR / DJNZ');

test('JR ke target dekat diterima', () => {
  const program = loadProgram('JR MAJU\nNOP\nMAJU: HALT');
  assertEqual(program.instructions[0].mnemonic, 'JR');
});

test('JR ke target di luar -128..+127 ditolak', () => {
  const filler = Array(200).fill('NOP').join('\n');
  assertThrows(() => loadProgram(`JR JAUH\n${filler}\nJAUH: HALT`), 'terlalu jauh');
});

// ─────────────────────────────────────────────────────────────
section('Batas eksekusi');

test('PC di luar jangkauan program menghasilkan error', () => {
  const { cpu } = runProgram('LD A, 01H', 10);
  if (!cpu.error) throw new Error('Diharapkan error di luar jangkauan');
  if (!cpu.error.includes('di luar jangkauan')) {
    throw new Error(`Pesan error tidak sesuai: ${cpu.error}`);
  }
});

// ─────────────────────────────────────────────────────────────
section('Contoh program bawaan');

for (const example of examplePrograms) {
  test(`"${example.id}" berjalan sampai HALT`, () => {
    const { cpu } = runProgram(example.code);
    if (cpu.error) throw new Error(cpu.error);
    assertEqual(cpu.halted, true, 'mencapai HALT');
  });
}

test('Contoh fibonacci menulis deret yang benar ke memori', () => {
  const fib = examplePrograms.find((p) => p.id === 'fibonacci');
  if (!fib) throw new Error('Contoh program "fibonacci" tidak ditemukan');
  const { cpu } = runProgram(fib.code);
  const expected = [0x00, 0x01, 0x01, 0x02, 0x03, 0x05, 0x08, 0x0D];
  expected.forEach((value, i) => {
    assertEqual(cpu.memory.bytes[0x50 + i], value, `memori ${(0x50 + i).toString(16)}H`);
  });
});

// ─────────────────────────────────────────────────────────────
console.log(`\n${passed} lolos, ${failed} gagal`);

if (failed > 0) {
  process.exit(1);
}
