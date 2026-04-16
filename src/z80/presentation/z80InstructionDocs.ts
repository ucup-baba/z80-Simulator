/**
 * Z-80 Instruction Tooltips Data
 * Maps mnemonics to short descriptions for hover tooltips (PC only)
 */

export const Z80_INSTRUCTION_DOCS: Record<string, string> = {
  // Load
  LD: 'Load — Copy data between registers or memory',
  PUSH: 'Push register pair onto stack (SP-2)',
  POP: 'Pop register pair from stack (SP+2)',
  EX: 'Exchange register pairs',
  EXX: 'Exchange BC,DE,HL with shadow registers',

  // Arithmetic
  ADD: 'Add — A = A + operand (sets flags)',
  ADC: 'Add with Carry — A = A + operand + CF',
  SUB: 'Subtract — A = A - operand (sets flags)',
  SBC: 'Subtract with Carry — A = A - operand - CF',
  INC: 'Increment — operand = operand + 1',
  DEC: 'Decrement — operand = operand - 1',
  DAA: 'Decimal Adjust Accumulator for BCD',
  NEG: 'Negate — A = 0 - A (two\'s complement)',
  CPL: 'Complement — A = ~A (one\'s complement)',

  // Logic
  AND: 'Bitwise AND — A = A & operand',
  OR: 'Bitwise OR — A = A | operand',
  XOR: 'Bitwise XOR — A = A ^ operand',
  CP: 'Compare — A - operand (flags only, A unchanged)',

  // Rotate & Shift
  RLCA: 'Rotate Left Circular Accumulator',
  RRCA: 'Rotate Right Circular Accumulator',
  RLA: 'Rotate Left Accumulator through Carry',
  RRA: 'Rotate Right Accumulator through Carry',
  RLC: 'Rotate Left Circular',
  RRC: 'Rotate Right Circular',
  RL: 'Rotate Left through Carry',
  RR: 'Rotate Right through Carry',
  SLA: 'Shift Left Arithmetic (multiply by 2)',
  SRA: 'Shift Right Arithmetic (divide by 2, keep sign)',
  SRL: 'Shift Right Logical (divide by 2 unsigned)',
  RLD: 'Rotate Left Digit (BCD)',
  RRD: 'Rotate Right Digit (BCD)',

  // Bit
  BIT: 'Bit Test — Check if bit N of operand is set',
  SET: 'Set Bit — Set bit N of operand to 1',
  RES: 'Reset Bit — Reset bit N of operand to 0',

  // Jump
  JP: 'Jump — Set PC to address (conditional/unconditional)',
  JR: 'Jump Relative — PC += signed offset (-128..+127)',
  DJNZ: 'Decrement B and Jump if Not Zero',

  // Call/Return
  CALL: 'Call subroutine — Push PC, jump to address',
  RET: 'Return — Pop PC from stack',
  RETI: 'Return from Interrupt',
  RETN: 'Return from Non-Maskable Interrupt',
  RST: 'Restart — Call to fixed address (0x00-0x38)',

  // Block Transfer
  LDI: 'Load and Increment — (DE)←(HL), DE++, HL++, BC--',
  LDIR: 'Load, Increment, Repeat until BC=0',
  LDD: 'Load and Decrement — (DE)←(HL), DE--, HL--, BC--',
  LDDR: 'Load, Decrement, Repeat until BC=0',
  CPI: 'Compare and Increment — A-(HL), HL++, BC--',
  CPIR: 'Compare, Increment, Repeat until match or BC=0',
  CPD: 'Compare and Decrement — A-(HL), HL--, BC--',
  CPDR: 'Compare, Decrement, Repeat until match or BC=0',

  // I/O
  IN: 'Input from port',
  OUT: 'Output to port',
  INI: 'Input and Increment',
  INIR: 'Input, Increment, Repeat',
  IND: 'Input and Decrement',
  INDR: 'Input, Decrement, Repeat',
  OUTI: 'Output and Increment',
  OTIR: 'Output, Increment, Repeat',
  OUTD: 'Output and Decrement',
  OTDR: 'Output, Decrement, Repeat',

  // Control
  NOP: 'No Operation — Do nothing for 4 T-cycles',
  HALT: 'Halt CPU execution until interrupt',
  DI: 'Disable Interrupts',
  EI: 'Enable Interrupts',
  IM: 'Set Interrupt Mode (0, 1, or 2)',
  SCF: 'Set Carry Flag — CF = 1',
  CCF: 'Complement Carry Flag — CF = ~CF',

  // Directives
  ORG: 'Origin — Set assembly address',
  DB: 'Define Byte — Store raw byte data',
  DW: 'Define Word — Store 16-bit word data',
  DS: 'Define Storage — Reserve bytes',
  EQU: 'Equate — Define constant symbol',
};
