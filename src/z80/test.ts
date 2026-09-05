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
function runProgram(
  code: string,
  maxSteps = 5000,
  memorySeed: Record<number, number> = {},
): { cpu: CPUState; steps: number } {
  const program = loadProgram(code);
  let cpu = createCPUState();
  cpu.registers.registers16.PC = program.orgAddress;

  for (const [address, value] of Object.entries(memorySeed)) {
    cpu.memory.bytes[Number(address)] = value;
  }

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
section('ALU — operasi logika');

test('AND selalu menyalakan H dan mematikan C', () => {
  const { cpu } = runProgram('LD A, 3FH\nAND 0FH\nHALT');
  const f = cpu.registers.flags;
  assertEqual(cpu.registers.registers8.A, 0x0F, 'A');
  assertEqual(f.H, true, 'H selalu set untuk AND');
  assertEqual(f.C, false, 'C selalu reset untuk AND');
  assertEqual(f.N, false, 'N');
  assertEqual(f.P, true, 'paritas genap (0FH punya 4 bit satu)');
});

test('OR mematikan H dan C', () => {
  const { cpu } = runProgram('LD A, 0F0H\nOR 0FH\nHALT');
  const f = cpu.registers.flags;
  assertEqual(cpu.registers.registers8.A, 0xFF, 'A');
  assertEqual(f.H, false, 'H');
  assertEqual(f.C, false, 'C');
  assertEqual(f.S, true, 'S (bit 7 menyala)');
  assertEqual(f.P, true, 'paritas genap (8 bit satu)');
});

test('XOR A mengosongkan A dan menyalakan Zero', () => {
  const { cpu } = runProgram('LD A, 5AH\nXOR A\nHALT');
  const f = cpu.registers.flags;
  assertEqual(cpu.registers.registers8.A, 0x00, 'A');
  assertEqual(f.Z, true, 'Z');
  assertEqual(f.C, false, 'C');
  assertEqual(f.H, false, 'H');
});

test('CPL membalik semua bit dan menyalakan H serta N', () => {
  const { cpu } = runProgram('LD A, 0FH\nCPL\nHALT');
  assertEqual(cpu.registers.registers8.A, 0xF0, 'A');
  assertEqual(cpu.registers.flags.H, true, 'H');
  assertEqual(cpu.registers.flags.N, true, 'N');
});

test('NEG mengambil komplemen dua dan menyalakan Carry bila A bukan nol', () => {
  const { cpu } = runProgram('LD A, 01H\nNEG\nHALT');
  const f = cpu.registers.flags;
  assertEqual(cpu.registers.registers8.A, 0xFF, 'A');
  assertEqual(f.C, true, 'C');
  assertEqual(f.N, true, 'N');
  assertEqual(f.S, true, 'S');
});

test('NEG atas nol tidak menyalakan Carry', () => {
  const { cpu } = runProgram('LD A, 00H\nNEG\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x00, 'A');
  assertEqual(cpu.registers.flags.C, false, 'C');
  assertEqual(cpu.registers.flags.Z, true, 'Z');
});

test('SCF menyalakan Carry, CCF membalikkannya dan menyalin C lama ke H', () => {
  const afterScf = runProgram('SCF\nHALT').cpu.registers.flags;
  assertEqual(afterScf.C, true, 'C setelah SCF');
  assertEqual(afterScf.H, false, 'H setelah SCF');
  assertEqual(afterScf.N, false, 'N setelah SCF');

  const afterCcf = runProgram('SCF\nCCF\nHALT').cpu.registers.flags;
  assertEqual(afterCcf.C, false, 'C setelah CCF');
  assertEqual(afterCcf.H, true, 'H menyimpan nilai C sebelumnya');
  assertEqual(afterCcf.N, false, 'N setelah CCF');
});

// ─────────────────────────────────────────────────────────────
section('ALU — rotasi & geser');

test('RLCA memutar kiri melingkar, bit 7 ke Carry dan ke bit 0', () => {
  const { cpu } = runProgram('LD A, 85H\nRLCA\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x0B, 'A');
  assertEqual(cpu.registers.flags.C, true, 'C');
});

test('RLA memutar kiri melalui Carry', () => {
  const { cpu } = runProgram('LD A, 85H\nRLA\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x0A, 'A (Carry awal 0 masuk ke bit 0)');
  assertEqual(cpu.registers.flags.C, true, 'C menerima bit 7 lama');
});

test('RRCA memutar kanan melingkar, bit 0 ke Carry dan ke bit 7', () => {
  const { cpu } = runProgram('LD A, 85H\nRRCA\nHALT');
  assertEqual(cpu.registers.registers8.A, 0xC2, 'A');
  assertEqual(cpu.registers.flags.C, true, 'C');
});

test('RRA memutar kanan melalui Carry', () => {
  const { cpu } = runProgram('LD A, 85H\nRRA\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x42, 'A (Carry awal 0 masuk ke bit 7)');
  assertEqual(cpu.registers.flags.C, true, 'C menerima bit 0 lama');
});

test('SLA menggeser kiri dan memasukkan nol di bit 0', () => {
  const { cpu } = runProgram('LD B, 85H\nSLA B\nHALT');
  assertEqual(cpu.registers.registers8.B, 0x0A, 'B');
  assertEqual(cpu.registers.flags.C, true, 'C');
});

test('SRA menggeser kanan dan mempertahankan bit tanda', () => {
  const { cpu } = runProgram('LD B, 85H\nSRA B\nHALT');
  assertEqual(cpu.registers.registers8.B, 0xC2, 'B (bit 7 dipertahankan)');
  assertEqual(cpu.registers.flags.C, true, 'C');
});

test('SRL menggeser kanan dan memasukkan nol di bit 7', () => {
  const { cpu } = runProgram('LD B, 85H\nSRL B\nHALT');
  assertEqual(cpu.registers.registers8.B, 0x42, 'B');
  assertEqual(cpu.registers.flags.C, true, 'C');
  assertEqual(cpu.registers.flags.S, false, 'S selalu mati setelah SRL');
});

test('RLC dan RRC pada register selain A', () => {
  assertEqual(runProgram('LD B, 85H\nRLC B\nHALT').cpu.registers.registers8.B, 0x0B, 'RLC B');
  assertEqual(runProgram('LD B, 85H\nRRC B\nHALT').cpu.registers.registers8.B, 0xC2, 'RRC B');
});

test('RR menggeser kanan melalui Carry sampai nol', () => {
  const { cpu } = runProgram('LD B, 01H\nRR B\nHALT');
  assertEqual(cpu.registers.registers8.B, 0x00, 'B');
  assertEqual(cpu.registers.flags.C, true, 'C menerima bit 0');
  assertEqual(cpu.registers.flags.Z, true, 'Z');
});

// ─────────────────────────────────────────────────────────────
section('ALU — manipulasi bit');

test('BIT atas bit yang menyala mematikan Zero', () => {
  const { cpu } = runProgram('LD A, 80H\nBIT 7, A\nHALT');
  const f = cpu.registers.flags;
  assertEqual(f.Z, false, 'Z');
  assertEqual(f.H, true, 'H selalu set');
  assertEqual(f.N, false, 'N selalu reset');
  assertEqual(f.S, true, 'S menyala hanya saat menguji bit 7 yang set');
  assertEqual(f.P, false, 'P/V mengikuti Z');
});

test('BIT atas bit yang mati menyalakan Zero', () => {
  const { cpu } = runProgram('LD A, 80H\nBIT 0, A\nHALT');
  const f = cpu.registers.flags;
  assertEqual(f.Z, true, 'Z');
  assertEqual(f.P, true, 'P/V mengikuti Z');
  assertEqual(f.S, false, 'S mati untuk bit selain 7');
});

test('BIT tidak mengubah nilai register yang diuji', () => {
  const { cpu } = runProgram('LD A, 5AH\nBIT 3, A\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x5A, 'A tetap');
});

test('SET dan RES mengubah bit yang ditunjuk', () => {
  assertEqual(runProgram('LD B, 00H\nSET 3, B\nHALT').cpu.registers.registers8.B, 0x08, 'SET 3');
  assertEqual(runProgram('LD B, 0FFH\nRES 3, B\nHALT').cpu.registers.registers8.B, 0xF7, 'RES 3');
});

// ─────────────────────────────────────────────────────────────
section('ALU — ADC / SBC');

test('ADC menambahkan Carry yang sedang menyala', () => {
  const { cpu } = runProgram('SCF\nLD A, 10H\nADC A, 05H\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x16, 'A = 10H + 05H + 1');
});

test('SBC mengurangi Carry yang sedang menyala', () => {
  const { cpu } = runProgram('SCF\nLD A, 10H\nSBC A, 05H\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x0A, 'A = 10H - 05H - 1');
  assertEqual(cpu.registers.flags.N, true, 'N');
});

test('ADD HL, rr menjumlahkan pasangan 16-bit', () => {
  const { cpu } = runProgram('LD HL, 1000H\nLD BC, 2000H\nADD HL, BC\nHALT');
  assertEqual(cpu.registers.registers8.H, 0x30, 'H');
  assertEqual(cpu.registers.registers8.L, 0x00, 'L');
});

test('ADC HL, rr ikut menambahkan Carry', () => {
  const { cpu } = runProgram('SCF\nLD HL, 1000H\nLD BC, 2000H\nADC HL, BC\nHALT');
  assertEqual(cpu.registers.registers8.H, 0x30, 'H');
  assertEqual(cpu.registers.registers8.L, 0x01, 'L');
});

test('SBC HL, rr mengurangi pasangan 16-bit', () => {
  const { cpu } = runProgram('LD HL, 5000H\nLD BC, 1000H\nSBC HL, BC\nHALT');
  assertEqual(cpu.registers.registers8.H, 0x40, 'H');
  assertEqual(cpu.registers.flags.N, true, 'N');
});

test('ADD HL menyalakan Carry saat melewati FFFFH', () => {
  const { cpu } = runProgram('LD HL, 0FFFFH\nLD BC, 0002H\nADD HL, BC\nHALT');
  assertEqual(cpu.registers.registers8.H, 0x00, 'H');
  assertEqual(cpu.registers.registers8.L, 0x01, 'L');
  assertEqual(cpu.registers.flags.C, true, 'C');
});

// ─────────────────────────────────────────────────────────────
section('ALU — DAA (koreksi desimal BCD)');

test('DAA mengoreksi penjumlahan BCD sederhana: 19 + 01 = 20', () => {
  const { cpu } = runProgram('LD A, 19H\nADD A, 01H\nDAA\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x20, 'A');
  assertEqual(cpu.registers.flags.C, false, 'C');
});

test('DAA mengoreksi penjumlahan dengan bawaan nibble: 28 + 39 = 67', () => {
  const { cpu } = runProgram('LD A, 28H\nADD A, 39H\nDAA\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x67, 'A');
  assertEqual(cpu.registers.flags.C, false, 'C');
});

test('DAA menyalakan Carry saat hasil BCD melewati 99: 99 + 01 = 00', () => {
  const { cpu } = runProgram('LD A, 99H\nADD A, 01H\nDAA\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x00, 'A');
  assertEqual(cpu.registers.flags.C, true, 'C menandakan ratusan');
  assertEqual(cpu.registers.flags.Z, true, 'Z');
});

test('DAA mengoreksi pengurangan BCD: 42 - 13 = 29', () => {
  const { cpu } = runProgram('LD A, 42H\nSUB 13H\nDAA\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x29, 'A');
  assertEqual(cpu.registers.flags.N, true, 'N dipertahankan');
  assertEqual(cpu.registers.flags.C, false, 'C');
});

test('DAA mempertahankan Carry pinjaman pada pengurangan BCD: 15 - 40', () => {
  // C=1 dan H=0 setelah SUB, jadi koreksinya -60H saja (tabel Z-80 baris N=1).
  const { cpu } = runProgram('LD A, 15H\nSUB 40H\nDAA\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x75, 'A');
  assertEqual(cpu.registers.flags.C, true, 'C tetap menyala');
  assertEqual(cpu.registers.flags.N, true, 'N');
});

// ─────────────────────────────────────────────────────────────
section('ALU — pertukaran register');

test('EX DE, HL menukar kedua pasangan', () => {
  const { cpu } = runProgram('LD DE, 1234H\nLD HL, 5678H\nEX DE, HL\nHALT');
  assertEqual(cpu.registers.registers8.D, 0x56, 'D');
  assertEqual(cpu.registers.registers8.E, 0x78, 'E');
  assertEqual(cpu.registers.registers8.H, 0x12, 'H');
  assertEqual(cpu.registers.registers8.L, 0x34, 'L');
});

test('EXX dua kali mengembalikan register semula', () => {
  const { cpu } = runProgram('LD BC, 1111H\nEXX\nLD BC, 2222H\nEXX\nHALT');
  assertEqual(cpu.registers.registers8.B, 0x11, 'B');
  assertEqual(cpu.registers.registers8.C, 0x11, 'C');
});

// ─────────────────────────────────────────────────────────────
section('ALU — instruksi blok');

test('LDI menyalin satu byte lalu memajukan pointer', () => {
  const { cpu } = runProgram(
    'LD HL, 1000H\nLD DE, 2000H\nLD BC, 0001H\nLDI\nHALT',
    100,
    { 0x1000: 0xAA },
  );
  assertEqual(cpu.memory.bytes[0x2000], 0xAA, 'byte tersalin');
  assertEqual(cpu.registers.registers8.H, 0x10, 'H');
  assertEqual(cpu.registers.registers8.L, 0x01, 'HL maju');
  assertEqual(cpu.registers.registers8.E, 0x01, 'DE maju');
  assertEqual(cpu.registers.flags.P, false, 'P/V mati saat BC habis');
  assertEqual(cpu.registers.flags.N, false, 'N');
});

test('LDIR menyalin seluruh blok', () => {
  const { cpu } = runProgram(
    'LD HL, 1000H\nLD DE, 2000H\nLD BC, 0003H\nLDIR\nHALT',
    100,
    { 0x1000: 0x11, 0x1001: 0x22, 0x1002: 0x33 },
  );
  assertEqual(cpu.memory.bytes[0x2000], 0x11, 'byte 1');
  assertEqual(cpu.memory.bytes[0x2001], 0x22, 'byte 2');
  assertEqual(cpu.memory.bytes[0x2002], 0x33, 'byte 3');
  assertEqual(cpu.registers.registers8.B, 0x00, 'B');
  assertEqual(cpu.registers.registers8.C, 0x00, 'C');
});

test('LDDR menyalin blok mundur', () => {
  const { cpu } = runProgram(
    'LD HL, 1002H\nLD DE, 2002H\nLD BC, 0003H\nLDDR\nHALT',
    100,
    { 0x1000: 0x11, 0x1001: 0x22, 0x1002: 0x33 },
  );
  assertEqual(cpu.memory.bytes[0x2000], 0x11, 'byte 1');
  assertEqual(cpu.memory.bytes[0x2002], 0x33, 'byte 3');
});

test('LDIR dengan BC=0000H menyalin 65536 byte lalu berhenti', () => {
  // Regresi: pencacah BC dulu tidak dibungkus ke 16-bit, sehingga nilainya
  // terus menegatif dan loopnya tidak pernah berhenti — membekukan tab.
  const { cpu } = runProgram('LD HL, 1000H\nLD DE, 2000H\nLD BC, 0000H\nLDIR\nHALT', 100);
  assertEqual(cpu.registers.registers8.B, 0x00, 'B');
  assertEqual(cpu.registers.registers8.C, 0x00, 'C');
  assertEqual(cpu.halted, true, 'mencapai HALT');
});

test('CPI menyalakan Zero ketika byte cocok', () => {
  const { cpu } = runProgram(
    'LD A, 55H\nLD HL, 1000H\nLD BC, 0001H\nCPI\nHALT',
    100,
    { 0x1000: 0x55 },
  );
  assertEqual(cpu.registers.flags.Z, true, 'Z');
  assertEqual(cpu.registers.flags.N, true, 'N');
  assertEqual(cpu.registers.registers8.A, 0x55, 'A tidak berubah');
});

test('CPIR berhenti pada byte yang dicari', () => {
  const { cpu } = runProgram(
    'LD A, 22H\nLD HL, 1000H\nLD BC, 0003H\nCPIR\nHALT',
    100,
    { 0x1000: 0x11, 0x1001: 0x22, 0x1002: 0x33 },
  );
  assertEqual(cpu.registers.flags.Z, true, 'Z menandakan ketemu');
  assertEqual(cpu.registers.registers8.L, 0x02, 'HL berhenti tepat setelah byte yang cocok');
  assertEqual(cpu.registers.registers8.C, 0x01, 'BC menyimpan sisa');
  assertEqual(cpu.registers.flags.P, true, 'P/V menyala karena BC belum habis');
});

test('CPIR yang tidak menemukan apa pun menghabiskan BC', () => {
  const { cpu } = runProgram(
    'LD A, 99H\nLD HL, 1000H\nLD BC, 0003H\nCPIR\nHALT',
    100,
    { 0x1000: 0x11, 0x1001: 0x22, 0x1002: 0x33 },
  );
  assertEqual(cpu.registers.flags.Z, false, 'Z mati');
  assertEqual(cpu.registers.registers8.C, 0x00, 'BC habis');
  assertEqual(cpu.registers.flags.P, false, 'P/V mati saat BC habis');
});

// ─────────────────────────────────────────────────────────────
console.log(`\n${passed} lolos, ${failed} gagal`);

if (failed > 0) {
  process.exit(1);
}
