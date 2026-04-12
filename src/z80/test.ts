/**
 * Simple tests for Z-80 CPU core logic
 */

import {
  createCPUState,
  loadProgram,
  step,
  runToCompletion,
  toByte,
} from './usecases';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, got ${actual}`
    );
  }
}

// Test Suite
console.log('Running Z-80 CPU Tests...\n');

// ===== CPU State Tests =====
test('Create CPU state initializes all registers to 0', () => {
  const cpu = createCPUState();
  assertEqual(cpu.registers.registers8.A, 0);
  assertEqual(cpu.registers.registers8.B, 0);
  assertEqual(cpu.registers.registers16.PC, 0);
  assertEqual(cpu.registers.registers16.SP, 0xFF); // SP starts at 0xFF
  assertEqual(cpu.halted, false);
  assertEqual(cpu.error, null);
});

// ===== Parser Tests =====
test('Parse simple LD instruction', () => {
  const program = loadProgram('LD A, 05H');
  assertEqual(program.instructions.length, 1);
  assertEqual(program.instructions[0].mnemonic, 'LD');
  assertEqual(program.instructions[0].operand1?.type, 'register8');
  assertEqual(program.instructions[0].operand2?.type, 'immediate8');
});

test('Parse multiple instructions', () => {
  const program = loadProgram(`
    LD A, 10H
    LD B, 20H
    ADD B
  `);
  assertEqual(program.instructions.length, 3);
});

test('Parse hex formats (H suffix, 0x prefix)', () => {
  const program = loadProgram(`
    LD A, FFH
    LD B, 0x10
  `);
  assertEqual(program.instructions[0].operand2?.value, 0xFF);
  assertEqual(program.instructions[1].operand2?.value, 0x10);
});

test('Parse JP NZ instruction', () => {
  const program = loadProgram('JP NZ, 5');
  assertEqual(program.instructions[0].mnemonic, 'JPNZ');
});

test('Ignore comments and empty lines', () => {
  const program = loadProgram(`
    ; This is a comment
    LD A, 05H  ; Load 5

    NOP
  `);
  assertEqual(program.instructions.length, 2);
});

// ===== Execution Tests =====
test('LD loads immediate value into register', () => {
  const cpu = createCPUState();
  const program = loadProgram('LD A, 42H');
  const result = step(cpu, program);

  assertEqual(result.success, true);
  assertEqual(result.updatedState.registers.registers8.A, 0x42);
});

test('LD copies value between registers', () => {
  const cpu = createCPUState();
  const program = loadProgram(`
    LD A, 99H
    LD B, A
  `);

  let result = step(cpu, program);
  assertEqual(result.updatedState.registers.registers8.A, 0x99);

  result = step(result.updatedState, program);
  assertEqual(result.updatedState.registers.registers8.B, 0x99);
});

test('ADD adds values correctly', () => {
  const cpu = createCPUState();
  const program = loadProgram(`
    LD A, 10H
    LD B, 20H
    ADD B
  `);

  const result = runToCompletion(cpu, program);
  assertEqual(result.updatedState.registers.registers8.A, 0x30);
});

test('ADD sets carry flag on overflow', () => {
  const cpu = createCPUState();
  const program = loadProgram(`
    LD A, FFH
    LD B, 02H
    ADD B
  `);

  const result = runToCompletion(cpu, program);
  assertEqual(result.updatedState.registers.registers8.A, toByte(0x101));
  assertEqual(result.updatedState.registers.flags.C, true);
});

test('INC increments register', () => {
  const cpu = createCPUState();
  const program = loadProgram(`
    LD A, 05H
    INC A
  `);

  const result = runToCompletion(cpu, program);
  assertEqual(result.updatedState.registers.registers8.A, 0x06);
});

test('INC sets zero flag on overflow', () => {
  const cpu = createCPUState();
  const program = loadProgram(`
    LD A, FFH
    INC A
  `);

  const result = runToCompletion(cpu, program);
  assertEqual(result.updatedState.registers.registers8.A, 0);
  assertEqual(result.updatedState.registers.flags.Z, true);
});

test('DEC decrements register', () => {
  const cpu = createCPUState();
  const program = loadProgram(`
    LD A, 05H
    DEC A
  `);

  const result = runToCompletion(cpu, program);
  assertEqual(result.updatedState.registers.registers8.A, 0x04);
});

test('SUB subtracts correctly', () => {
  const cpu = createCPUState();
  const program = loadProgram(`
    LD A, 20H
    LD B, 10H
    SUB B
  `);

  const result = runToCompletion(cpu, program);
  assertEqual(result.updatedState.registers.registers8.A, 0x10);
});

test('SUB sets carry flag on underflow', () => {
  const cpu = createCPUState();
  const program = loadProgram(`
    LD A, 05H
    LD B, 10H
    SUB B
  `);

  const result = runToCompletion(cpu, program);
  assertEqual(result.updatedState.registers.flags.C, true);
});

test('JP jumps to address', () => {
  const cpu = createCPUState();
  const program = loadProgram(`
    LD A, 01H
    JP 3
    LD A, 99H
    HALT
  `);

  const result = runToCompletion(cpu, program);
  // A should be 01H, not 99H, because we jumped over line 2
  assertEqual(result.updatedState.registers.registers8.A, 0x01);
});

test('JP NZ jumps when zero flag is not set', () => {
  const cpu = createCPUState();
  const program = loadProgram(`
    LD A, 03H
    DEC A
    JP NZ, 1
    HALT
  `);

  const result = runToCompletion(cpu, program, 20);
  // Should count down from 3 to 0
  assertEqual(result.updatedState.registers.registers8.A, 0);
  assertEqual(result.updatedState.registers.flags.Z, true);
});

test('JP NZ does not jump when zero flag is set', () => {
  const cpu = createCPUState();
  const program = loadProgram(`
    LD A, 00H
    JP NZ, 0
    LD B, 42H
  `);

  const result = runToCompletion(cpu, program);
  // B should be set because jump was not taken
  assertEqual(result.updatedState.registers.registers8.B, 0x42);
});

test('HALT stops execution', () => {
  const cpu = createCPUState();
  const program = loadProgram(`
    LD A, 10H
    HALT
    LD A, 20H
  `);

  const result = runToCompletion(cpu, program);
  assertEqual(result.updatedState.halted, true);
  assertEqual(result.updatedState.registers.registers8.A, 0x10);
});

test('PC increments after each instruction', () => {
  const cpu = createCPUState();
  const program = loadProgram(`
    NOP
    NOP
    NOP
  `);

  assertEqual(cpu.registers.registers16.PC, 0);

  let result = step(cpu, program);
  assertEqual(result.updatedState.registers.registers16.PC, 1);

  result = step(result.updatedState, program);
  assertEqual(result.updatedState.registers.registers16.PC, 2);

  result = step(result.updatedState, program);
  assertEqual(result.updatedState.registers.registers16.PC, 3);
});

test('Sign flag is set for negative values', () => {
  const cpu = createCPUState();
  const program = loadProgram(`
    LD A, 80H
  `);

  const result = runToCompletion(cpu, program);
  // 0x80 = 10000000 in binary (bit 7 is set)
  assertEqual(result.updatedState.registers.flags.S, true);
});

// Summary
console.log('\n' + '='.repeat(50));
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

if (failed > 0) {
  console.log('\nFailed tests:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  - ${r.name}: ${r.error}`);
  });
}

export { results };
