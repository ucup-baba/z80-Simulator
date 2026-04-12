/**
 * Example usage of the Z-80 CPU simulator
 * This demonstrates the core CPU logic without any UI
 */

import {
  createCPUState,
  loadProgram,
  step,
  runToCompletion,
} from './usecases';

/**
 * Example 1: Simple arithmetic program
 */
export function exampleArithmetic() {
  console.log('=== Example 1: Arithmetic Operations ===\n');

  const code = `
    LD A, 10H    ; Load 16 into A
    LD B, 05H    ; Load 5 into B
    ADD B        ; Add B to A (A = A + B)
    INC A        ; Increment A
    HALT         ; Stop execution
  `;

  const cpu = createCPUState();
  const program = loadProgram(code);

  console.log('Program:', code);
  console.log('\nInitial State:');
  console.log('A:', cpu.registers.registers8.A.toString(16).toUpperCase() + 'H');
  console.log('B:', cpu.registers.registers8.B.toString(16).toUpperCase() + 'H');
  console.log('PC:', cpu.registers.registers16.PC);

  const result = runToCompletion(cpu, program);

  console.log('\nExecution Log:');
  console.log(result.message);

  console.log('\nFinal State:');
  console.log('A:', result.updatedState.registers.registers8.A.toString(16).toUpperCase() + 'H', '(expected: 1CH = 28)');
  console.log('B:', result.updatedState.registers.registers8.B.toString(16).toUpperCase() + 'H');
  console.log('PC:', result.updatedState.registers.registers16.PC);
  console.log('Flags:', result.updatedState.registers.flags);
  console.log('Halted:', result.updatedState.halted);
}

/**
 * Example 2: Step-by-step execution
 */
export function exampleStepByStep() {
  console.log('\n\n=== Example 2: Step-by-Step Execution ===\n');

  const code = `
    LD A, FFH    ; Load 255 into A
    INC A        ; Increment A (should overflow to 0 and set Z flag)
    DEC A        ; Decrement A (should be FF again)
  `;

  let cpu = createCPUState();
  const program = loadProgram(code);

  console.log('Program:', code);
  console.log('\nStep-by-step execution:\n');

  let stepNum = 1;
  while (!cpu.halted && !cpu.error && stepNum <= 10) {
    console.log(`--- Step ${stepNum} ---`);
    console.log('PC:', cpu.registers.registers16.PC);
    console.log('Current instruction:', program.instructions[cpu.registers.registers16.PC]?.sourceCode || 'N/A');

    const result = step(cpu, program);

    console.log('Result:', result.message);
    console.log('A:', result.updatedState.registers.registers8.A.toString(16).toUpperCase() + 'H');
    console.log('Flags:', result.updatedState.registers.flags);

    if (!result.success) {
      console.log('Error:', result.error);
      break;
    }

    cpu = result.updatedState;

    // Break if PC exceeds program length
    if (cpu.registers.registers16.PC >= program.instructions.length) {
      break;
    }

    stepNum++;
  }
}

/**
 * Example 3: Conditional jump
 */
export function exampleConditionalJump() {
  console.log('\n\n=== Example 3: Conditional Jump ===\n');

  const code = `
    LD A, 05H    ; Load 5 into A
    DEC A        ; Decrement A
    JP NZ, 1     ; Jump to line 1 (DEC A) if A is not zero
    HALT         ; Halt when A reaches 0
  `;

  const cpu = createCPUState();
  const program = loadProgram(code);

  console.log('Program:', code);
  console.log('\nThis program counts down from 5 to 0\n');

  const result = runToCompletion(cpu, program, 20);

  console.log('Execution Log:');
  console.log(result.message);

  console.log('\nFinal State:');
  console.log('A:', result.updatedState.registers.registers8.A.toString(16).toUpperCase() + 'H', '(expected: 00H)');
  console.log('Flags:', result.updatedState.registers.flags);
  console.log('Z flag should be true (zero):', result.updatedState.registers.flags.Z);
}

/**
 * Run all examples
 */
export function runAllExamples() {
  exampleArithmetic();
  exampleStepByStep();
  exampleConditionalJump();
}

// Uncomment to run examples in Node.js:
// runAllExamples();
