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
  portSeed: Record<number, number> = {},
): { cpu: CPUState; steps: number } {
  const program = loadProgram(code);
  let cpu = createCPUState();
  cpu.registers.registers16.PC = program.orgAddress;

  for (const [address, value] of Object.entries(memorySeed)) {
    cpu.memory.bytes[Number(address)] = value;
  }
  for (const [port, value] of Object.entries(portSeed)) {
    cpu.ioPorts[Number(port)] = value;
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
section('ALU — RLD / RRD (rotasi digit BCD)');

test('RLD memutar digit ke kiri (contoh manual Zilog: A=7AH, (HL)=31H)', () => {
  const { cpu } = runProgram('LD HL, 1000H\nLD A, 7AH\nRLD\nHALT', 100, { 0x1000: 0x31 });
  assertEqual(cpu.registers.registers8.A, 0x73, 'A');
  assertEqual(cpu.memory.bytes[0x1000], 0x1A, '(HL)');
});

test('RRD memutar digit ke kanan (contoh manual Zilog: A=84H, (HL)=20H)', () => {
  const { cpu } = runProgram('LD HL, 1000H\nLD A, 84H\nRRD\nHALT', 100, { 0x1000: 0x20 });
  assertEqual(cpu.registers.registers8.A, 0x80, 'A');
  assertEqual(cpu.memory.bytes[0x1000], 0x42, '(HL)');
});

test('RLD tidak mengubah nibble tinggi A', () => {
  const { cpu } = runProgram('LD HL, 1000H\nLD A, 0F5H\nRLD\nHALT', 100, { 0x1000: 0x28 });
  assertEqual(cpu.registers.registers8.A, 0xF2, 'nibble tinggi A tetap F');
  assertEqual(cpu.memory.bytes[0x1000], 0x85, '(HL)');
});

test('RLD tiga kali mengembalikan keadaan semula', () => {
  // RLD memutar tiga digit (A rendah, (HL) tinggi, (HL) rendah) satu posisi,
  // jadi tiga kali putaran menutup satu siklus penuh.
  const { cpu } = runProgram('LD HL, 1000H\nLD A, 7AH\nRLD\nRLD\nRLD\nHALT', 100, { 0x1000: 0x31 });
  assertEqual(cpu.registers.registers8.A, 0x7A, 'A kembali');
  assertEqual(cpu.memory.bytes[0x1000], 0x31, '(HL) kembali');
});

test('RRD membatalkan RLD', () => {
  const { cpu } = runProgram('LD HL, 1000H\nLD A, 7AH\nRLD\nRRD\nHALT', 100, { 0x1000: 0x31 });
  assertEqual(cpu.registers.registers8.A, 0x7A, 'A kembali');
  assertEqual(cpu.memory.bytes[0x1000], 0x31, '(HL) kembali');
});

test('RLD mematikan H dan N serta tidak menyentuh Carry', () => {
  const { cpu } = runProgram('SCF\nLD HL, 1000H\nLD A, 7AH\nRLD\nHALT', 100, { 0x1000: 0x31 });
  const f = cpu.registers.flags;
  assertEqual(f.H, false, 'H');
  assertEqual(f.N, false, 'N');
  assertEqual(f.C, true, 'C dipertahankan');
});

test('RRD menyalakan Zero ketika A menjadi nol', () => {
  const { cpu } = runProgram('LD HL, 1000H\nLD A, 00H\nRRD\nHALT', 100, { 0x1000: 0x50 });
  assertEqual(cpu.registers.registers8.A, 0x00, 'A');
  assertEqual(cpu.registers.flags.Z, true, 'Z');
  assertEqual(cpu.memory.bytes[0x1000], 0x05, '(HL)');
});

// ─────────────────────────────────────────────────────────────
section('Pengalamatan terindeks (IX+d) / (IY+d)');

test('LD r, (IX+d) membaca memori pada IX ditambah offset', () => {
  const { cpu } = runProgram('LD IX, 1000H\nLD A, (IX+5)\nHALT', 100, { 0x1005: 0x9C });
  assertEqual(cpu.registers.registers8.A, 0x9C, 'A');
});

test('LD (IX+d), r menulis ke memori pada IX ditambah offset', () => {
  const { cpu } = runProgram('LD IX, 1000H\nLD A, 3BH\nLD (IX+5), A\nHALT');
  assertEqual(cpu.memory.bytes[0x1005], 0x3B, 'memori 1005H');
});

test('LD (IX+d), n menulis nilai langsung', () => {
  const { cpu } = runProgram('LD IX, 1000H\nLD (IX+2), 7\nHALT');
  assertEqual(cpu.memory.bytes[0x1002], 0x07, 'memori 1002H');
});

test('Offset negatif membaca ke belakang', () => {
  const { cpu } = runProgram('LD IY, 1000H\nLD B, (IY-3)\nHALT', 100, { 0x0FFD: 0x5E });
  assertEqual(cpu.registers.registers8.B, 0x5E, 'B');
});

test('(IX) tanpa offset sama dengan offset nol', () => {
  const { cpu } = runProgram('LD IX, 1000H\nLD A, (IX)\nHALT', 100, { 0x1000: 0x42 });
  assertEqual(cpu.registers.registers8.A, 0x42, 'A');
});

test('Offset boleh ditulis heksadesimal', () => {
  // Regresi: dulu offset hanya menerima desimal, sehingga (IX+0AH) ditolak
  // padahal seluruh manual mengajarkan penulisan heksadesimal.
  const { cpu } = runProgram('LD IX, 1000H\nLD A, (IX+0AH)\nHALT', 100, { 0x100A: 0x77 });
  assertEqual(cpu.registers.registers8.A, 0x77, 'A');
});

test('Spasi di dalam kurung tidak merusak operand', () => {
  // Regresi: penyatuan token dulu berhenti setelah satu token, sehingga
  // "(IX + 5)" yang terpecah tiga bagian gagal diurai.
  const { cpu } = runProgram('LD IX, 1000H\nLD A, (IX + 5)\nHALT', 100, { 0x1005: 0x11 });
  assertEqual(cpu.registers.registers8.A, 0x11, 'A');
});

test('Alamat terindeks membungkus di batas memori', () => {
  const { cpu } = runProgram('LD IX, 0000H\nLD A, (IX-1)\nHALT', 100, { 0xFFFF: 0xAB });
  assertEqual(cpu.registers.registers8.A, 0xAB, 'A membaca FFFFH');
});

test('ADD A, (IX+d) menjumlahkan isi memori', () => {
  const { cpu } = runProgram('LD IX, 1000H\nLD A, 10H\nADD A, (IX+1)\nHALT', 100, { 0x1001: 0x05 });
  assertEqual(cpu.registers.registers8.A, 0x15, 'A');
});

test('CP (IX+d) membandingkan tanpa mengubah A', () => {
  const { cpu } = runProgram('LD IX, 1000H\nLD A, 20H\nCP (IX+2)\nHALT', 100, { 0x1002: 0x20 });
  assertEqual(cpu.registers.registers8.A, 0x20, 'A tetap');
  assertEqual(cpu.registers.flags.Z, true, 'Z');
});

test('INC dan DEC bekerja langsung pada memori terindeks', () => {
  const naik = runProgram('LD IX, 1000H\nINC (IX+1)\nHALT', 100, { 0x1001: 0x41 });
  assertEqual(naik.cpu.memory.bytes[0x1001], 0x42, 'INC');

  const turun = runProgram('LD IY, 1000H\nDEC (IY+1)\nHALT', 100, { 0x1001: 0x41 });
  assertEqual(turun.cpu.memory.bytes[0x1001], 0x40, 'DEC');
});

test('SLA pada memori terindeks menggeser isinya', () => {
  const { cpu } = runProgram('LD IX, 1000H\nSLA (IX+1)\nHALT', 100, { 0x1001: 0x85 });
  assertEqual(cpu.memory.bytes[0x1001], 0x0A, 'memori tergeser');
  assertEqual(cpu.registers.flags.C, true, 'C menerima bit 7');
});

test('BIT, SET, dan RES bekerja pada memori terindeks', () => {
  const uji = runProgram('LD IX, 1000H\nBIT 0, (IX+1)\nHALT', 100, { 0x1001: 0x01 });
  assertEqual(uji.cpu.registers.flags.Z, false, 'BIT menemukan bit menyala');

  const set = runProgram('LD IX, 1000H\nSET 3, (IX+1)\nHALT', 100, { 0x1001: 0x00 });
  assertEqual(set.cpu.memory.bytes[0x1001], 0x08, 'SET');

  const res = runProgram('LD IX, 1000H\nRES 3, (IX+1)\nHALT', 100, { 0x1001: 0xFF });
  assertEqual(res.cpu.memory.bytes[0x1001], 0xF7, 'RES');
});

test('IX dan IY berdiri sendiri', () => {
  const { cpu } = runProgram(
    'LD IX, 1000H\nLD IY, 2000H\nLD A, (IX+0)\nLD B, (IY+0)\nHALT',
    100,
    { 0x1000: 0x11, 0x2000: 0x22 },
  );
  assertEqual(cpu.registers.registers8.A, 0x11, 'A dari IX');
  assertEqual(cpu.registers.registers8.B, 0x22, 'B dari IY');
});

test('ADD IX, rr dan INC IX mengubah register indeks', () => {
  const tambah = runProgram('LD IX, 1000H\nLD BC, 0234H\nADD IX, BC\nHALT');
  assertEqual(tambah.cpu.registers.registers16.IX, 0x1234, 'ADD IX, BC');

  const naik = runProgram('LD IX, 1000H\nINC IX\nHALT');
  assertEqual(naik.cpu.registers.registers16.IX, 0x1001, 'INC IX');
});

test('PUSH IX lalu POP IY memindahkan nilainya lewat stack', () => {
  const { cpu } = runProgram('LD IX, 1234H\nPUSH IX\nPOP IY\nHALT');
  assertEqual(cpu.registers.registers16.IY, 0x1234, 'IY');
});

test('JP (IX) melompat ke alamat yang disimpan IX', () => {
  // Regresi: parser mengurai "(IX)" sebagai terindeks beroffset nol, sedangkan
  // executor hanya mengenali indexRegister — sehingga JP (IX) selalu gagal
  // dengan "invalid target".
  const { cpu } = runProgram('LD IX, 0003H\nJP (IX)\nHALT\nLD A, 77H\nHALT');
  assertEqual(cpu.error, null, 'tanpa error');
  assertEqual(cpu.registers.registers8.A, 0x77, 'instruksi tujuan dieksekusi');
});

test('JP (IY) juga melompat', () => {
  const { cpu } = runProgram('LD IY, 0003H\nJP (IY)\nHALT\nLD A, 55H\nHALT');
  assertEqual(cpu.error, null, 'tanpa error');
  assertEqual(cpu.registers.registers8.A, 0x55, 'instruksi tujuan dieksekusi');
});

// ─────────────────────────────────────────────────────────────
section('I/O — port langsung dan lewat register C');

test('OUT (n), A menulis ke port', () => {
  const { cpu } = runProgram('LD A, 5AH\nOUT (05H), A\nHALT');
  assertEqual(cpu.ioPorts[0x05], 0x5A, 'port 05H');
});

test('IN A, (n) membaca dari port', () => {
  const { cpu } = runProgram('IN A, (05H)\nHALT', 100, {}, { 0x05: 0xC3 });
  assertEqual(cpu.registers.registers8.A, 0xC3, 'A');
});

test('OUT lalu IN pada port yang sama mengembalikan nilainya', () => {
  const { cpu } = runProgram('LD A, 77H\nOUT (10H), A\nLD A, 00H\nIN A, (10H)\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x77, 'A');
});

test('OUT (C), r memakai register C sebagai nomor port', () => {
  const { cpu } = runProgram('LD C, 20H\nLD B, 99H\nOUT (C), B\nHALT');
  assertEqual(cpu.ioPorts[0x20], 0x99, 'port 20H');
});

test('IN r, (C) membaca port yang ditunjuk register C', () => {
  const { cpu } = runProgram('LD C, 20H\nIN B, (C)\nHALT', 100, {}, { 0x20: 0x3C });
  assertEqual(cpu.registers.registers8.B, 0x3C, 'B');
});

test('Nomor port dipotong menjadi 8 bit', () => {
  const { cpu } = runProgram('LD A, 42H\nOUT (0105H), A\nHALT');
  assertEqual(cpu.ioPorts[0x05], 0x42, 'port 0105H jatuh ke port 05H');
});

// ─────────────────────────────────────────────────────────────
section('I/O — instruksi blok');

test('OUTI mengirim satu byte dari memori lalu memajukan HL', () => {
  const { cpu } = runProgram(
    'LD B, 02H\nLD C, 30H\nLD HL, 1000H\nOUTI\nHALT',
    100,
    { 0x1000: 0xE1 },
  );
  assertEqual(cpu.ioPorts[0x30], 0xE1, 'port menerima byte');
  assertEqual(cpu.registers.registers8.L, 0x01, 'HL maju');
  assertEqual(cpu.registers.registers8.B, 0x01, 'B berkurang');
  assertEqual(cpu.registers.flags.N, true, 'N');
});

test('OUTI menyalakan Zero ketika B menjadi nol', () => {
  const { cpu } = runProgram('LD B, 01H\nLD C, 30H\nLD HL, 1000H\nOUTI\nHALT');
  assertEqual(cpu.registers.registers8.B, 0x00, 'B');
  assertEqual(cpu.registers.flags.Z, true, 'Z');
});

test('OUTD memundurkan HL', () => {
  const { cpu } = runProgram('LD B, 02H\nLD C, 30H\nLD HL, 1000H\nOUTD\nHALT');
  assertEqual(cpu.registers.registers8.H, 0x0F, 'H');
  assertEqual(cpu.registers.registers8.L, 0xFF, 'HL mundur ke 0FFFH');
});

test('INI menyimpan byte dari port ke memori', () => {
  const { cpu } = runProgram(
    'LD B, 02H\nLD C, 40H\nLD HL, 1000H\nINI\nHALT',
    100,
    {},
    { 0x40: 0x8D },
  );
  assertEqual(cpu.memory.bytes[0x1000], 0x8D, 'memori menerima byte');
  assertEqual(cpu.registers.registers8.L, 0x01, 'HL maju');
  assertEqual(cpu.registers.registers8.B, 0x01, 'B berkurang');
});

test('IND memundurkan HL', () => {
  const { cpu } = runProgram('LD B, 02H\nLD C, 40H\nLD HL, 1000H\nIND\nHALT');
  assertEqual(cpu.registers.registers8.L, 0xFF, 'HL mundur');
});

test('OTIR mengirim seluruh blok ke port', () => {
  const { cpu } = runProgram(
    'LD B, 03H\nLD C, 50H\nLD HL, 1000H\nOTIR\nHALT',
    100,
    { 0x1000: 0x11, 0x1001: 0x22, 0x1002: 0x33 },
  );
  assertEqual(cpu.ioPorts[0x50], 0x33, 'port menyimpan byte terakhir');
  assertEqual(cpu.registers.registers8.B, 0x00, 'B habis');
  assertEqual(cpu.registers.registers8.L, 0x03, 'HL berhenti setelah blok');
});

test('INIR mengisi memori dari port', () => {
  const { cpu } = runProgram(
    'LD B, 03H\nLD C, 60H\nLD HL, 1000H\nINIR\nHALT',
    100,
    {},
    { 0x60: 0x7E },
  );
  assertEqual(cpu.memory.bytes[0x1000], 0x7E, 'byte 1');
  assertEqual(cpu.memory.bytes[0x1002], 0x7E, 'byte 3');
  assertEqual(cpu.registers.registers8.B, 0x00, 'B habis');
});

test('OTIR dengan B=00H berputar 256 kali dan menghitung siklusnya', () => {
  // Regresi: perhitungan siklus dulu memakai nilai B awal, sehingga B=0
  // menghasilkan sumbangan siklus negatif alih-alih 255*21+16.
  const { cpu } = runProgram('LD B, 00H\nLD C, 70H\nLD HL, 1000H\nOTIR\nHALT');
  assertEqual(cpu.registers.registers8.B, 0x00, 'B kembali nol setelah 256 putaran');
  if (cpu.performance.clockCycles < 5000) {
    throw new Error(`Siklus terlalu sedikit untuk 256 putaran: ${cpu.performance.clockCycles}`);
  }
});

// ─────────────────────────────────────────────────────────────
section('Kendali interupsi');

test('EI menyalakan kedua flip-flop interupsi', () => {
  const { cpu } = runProgram('EI\nHALT');
  assertEqual(cpu.registers.interrupt.IFF1, true, 'IFF1');
  assertEqual(cpu.registers.interrupt.IFF2, true, 'IFF2');
});

test('DI mematikan kedua flip-flop interupsi', () => {
  const { cpu } = runProgram('EI\nDI\nHALT');
  assertEqual(cpu.registers.interrupt.IFF1, false, 'IFF1');
  assertEqual(cpu.registers.interrupt.IFF2, false, 'IFF2');
});

test('Interupsi mati saat CPU baru dinyalakan', () => {
  const cpu = createCPUState();
  assertEqual(cpu.registers.interrupt.IFF1, false, 'IFF1');
  assertEqual(cpu.registers.interrupt.IM, 0, 'mode interupsi');
});

test('IM menetapkan mode interupsi', () => {
  assertEqual(runProgram('IM 1\nHALT').cpu.registers.interrupt.IM, 1, 'IM 1');
  assertEqual(runProgram('IM 2\nHALT').cpu.registers.interrupt.IM, 2, 'IM 2');
  assertEqual(runProgram('IM 0\nHALT').cpu.registers.interrupt.IM, 0, 'IM 0');
});

test('Mode interupsi selain 0, 1, 2 ditolak', () => {
  const { cpu } = runProgram('IM 3\nHALT');
  if (!cpu.error) throw new Error('Diharapkan error untuk IM 3');
  if (!cpu.error.includes('IM')) throw new Error(`Pesan error tidak sesuai: ${cpu.error}`);
});

test('RETI kembali seperti RET biasa', () => {
  const { cpu } = runProgram('LD A, 01H\nCALL ISR\nHALT\nISR: INC A\nRETI');
  assertEqual(cpu.registers.registers8.A, 0x02, 'A');
  assertEqual(cpu.halted, true, 'kembali lalu berhenti');
});

test('RETN kembali dan memulihkan IFF1 dari IFF2', () => {
  const { cpu } = runProgram('EI\nCALL NMI\nHALT\nNMI: RETN');
  assertEqual(cpu.halted, true, 'kembali lalu berhenti');
  assertEqual(cpu.registers.interrupt.IFF1, cpu.registers.interrupt.IFF2, 'IFF1 mengikuti IFF2');
  assertEqual(cpu.registers.interrupt.IFF1, true, 'IFF1');
});

// ─────────────────────────────────────────────────────────────
section('Register refresh (R)');

test('R bertambah seiring instruksi yang dieksekusi', () => {
  const { cpu, steps } = runProgram('NOP\nNOP\nNOP\nHALT');
  assertEqual(cpu.registers.special.R, steps, 'R sama dengan jumlah instruksi tak berprefiks');
});

test('Instruksi berprefiks menambah R dua kali', () => {
  // SLA memakai prefiks CB, jadi menyumbang dua siklus M1.
  const { cpu } = runProgram('SLA B\nHALT');
  assertEqual(cpu.registers.special.R, 3, 'dua untuk SLA berprefiks, satu untuk HALT');
});

test('R hanya memutar tujuh bit bawah', () => {
  // 130 NOP melewati batas 7-bit, jadi R harus membungkus, bukan mencapai 130.
  const program = Array(130).fill('NOP').join('\n');
  const { cpu } = runProgram(`${program}\nHALT`);
  if (cpu.registers.special.R > 0x7F) {
    throw new Error(`R harus tetap di bawah 80H, dapat ${cpu.registers.special.R}`);
  }
});

// ─────────────────────────────────────────────────────────────
section('Register khusus I dan R');

test('LD I, A lalu LD A, I mengembalikan nilai yang sama', () => {
  const { cpu } = runProgram('LD A, 3CH\nLD I, A\nLD A, 00H\nLD A, I\nHALT');
  assertEqual(cpu.registers.special.I, 0x3C, 'register I');
  assertEqual(cpu.registers.registers8.A, 0x3C, 'A');
});

test('LD A, I menyalakan Zero ketika I kosong', () => {
  const { cpu } = runProgram('LD A, 0FFH\nLD A, I\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x00, 'A');
  assertEqual(cpu.registers.flags.Z, true, 'Z');
  assertEqual(cpu.registers.flags.H, false, 'H selalu reset');
  assertEqual(cpu.registers.flags.N, false, 'N selalu reset');
});

test('LD A, I menyalakan Sign ketika bit 7 menyala', () => {
  const { cpu } = runProgram('LD A, 80H\nLD I, A\nLD A, I\nHALT');
  assertEqual(cpu.registers.flags.S, true, 'S');
  assertEqual(cpu.registers.flags.Z, false, 'Z');
});

test('LD A, I menyalin IFF2 ke flag P/V', () => {
  // Inilah satu-satunya cara program membaca status flip-flop interupsi kedua.
  const aktif = runProgram('EI\nLD A, I\nHALT');
  assertEqual(aktif.cpu.registers.flags.P, true, 'P/V mengikuti IFF2 yang menyala');

  const mati = runProgram('DI\nLD A, I\nHALT');
  assertEqual(mati.cpu.registers.flags.P, false, 'P/V mengikuti IFF2 yang mati');
});

test('LD I, A tidak menyentuh flag', () => {
  const { cpu } = runProgram('SCF\nLD A, 00H\nLD I, A\nHALT');
  assertEqual(cpu.registers.flags.C, true, 'C dipertahankan');
  assertEqual(cpu.registers.flags.Z, false, 'Z tidak ikut menyala');
});

test('LD R, A menulis pencacah refresh', () => {
  // Pengambilan LD R,A menaikkan R lebih dulu, lalu badan instruksinya menimpa
  // nilai itu dengan A. Jadi yang tersisa hanya detak HALT sesudahnya.
  const { cpu } = runProgram('LD A, 40H\nLD R, A\nHALT');
  assertEqual(cpu.registers.special.R, 0x41, 'R = 40H ditulis, lalu satu detak untuk HALT');
});

test('LD A, R membaca pencacah refresh', () => {
  const { cpu } = runProgram('LD A, 40H\nLD R, A\nLD A, R\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x42, 'A membaca R termasuk dua detak pengambilan LD A,R');
});

test('LD A, R menghitung pengambilan instruksinya sendiri', () => {
  // Pembeda antara urutan yang benar dan yang keliru. R bertambah saat
  // instruksi diambil, sebelum dijalankan, jadi LD A,R ikut menghitung dua
  // siklus M1 miliknya: dua NOP (2) ditambah pengambilan LD A,R (2) = 4.
  // Menaikkan R setelah eksekusi akan menghasilkan 2.
  const { cpu } = runProgram('NOP\nNOP\nLD A, R\nHALT');
  assertEqual(cpu.registers.registers8.A, 0x04, 'A');
});

test('Total R tidak berubah oleh urutan penambahannya', () => {
  const { cpu, steps } = runProgram('NOP\nNOP\nNOP\nHALT');
  assertEqual(cpu.registers.special.R, steps, 'R tetap sama dengan jumlah siklus M1');
});

test('Hanya A yang boleh menjadi tujuan register khusus', () => {
  const { cpu } = runProgram('LD B, I\nHALT');
  if (!cpu.error) throw new Error('Diharapkan error untuk LD B, I');
});

test('Label bernama I atau R tetap bisa dilompati', () => {
  // Nama register khusus tidak boleh menutupi label pada posisi target lompatan.
  const { cpu } = runProgram('LD B, 03H\nR: DJNZ R\nHALT');
  assertEqual(cpu.error, null, 'tanpa error');
  assertEqual(cpu.registers.registers8.B, 0x00, 'B');
});

// ─────────────────────────────────────────────────────────────
console.log(`\n${passed} lolos, ${failed} gagal`);

if (failed > 0) {
  process.exit(1);
}
