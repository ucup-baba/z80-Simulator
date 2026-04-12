/**
 * Z-80 Domain Types
 * Core entities representing the CPU architecture
 */

/**
 * 8-bit register names
 */
export type Register8Bit = 'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'L';

/**
 * 16-bit register names
 */
export type Register16Bit = 'PC' | 'SP';

/**
 * Index register names
 */
export type IndexRegister = 'IX' | 'IY';

/**
 * 16-bit register pair names (composed of two 8-bit registers)
 */
export type RegisterPair = 'BC' | 'DE' | 'HL' | 'AF';

/**
 * CPU Flag names
 */
export type FlagName = 'Z' | 'S' | 'C';

/**
 * 8-bit value (0x00 to 0xFF)
 */
export type Byte = number;

/**
 * 16-bit value (0x0000 to 0xFFFF)
 */
export type Word = number;

/**
 * Memory address (16-bit)
 */
export type Address = number;

/**
 * Instruction operand types
 */
export type OperandType =
  | { type: 'register8'; value: Register8Bit }
  | { type: 'register16'; value: Register16Bit }
  | { type: 'registerPair'; value: RegisterPair }
  | { type: 'indexRegister'; value: IndexRegister }         // IX, IY
  | { type: 'indirect'; value: RegisterPair }               // (HL), (BC), (DE)
  | { type: 'indirectAddress'; value: Address }              // (nn) — direct memory addressing
  | { type: 'indexedIX'; value: number }                     // (IX+d)
  | { type: 'indexedIY'; value: number }                     // (IY+d)
  | { type: 'immediate8'; value: Byte }
  | { type: 'immediate16'; value: Word }
  | { type: 'address'; value: Address }
  | { type: 'portImmediate'; value: Byte }                   // (n) for IN/OUT
  | { type: 'portRegister' }                                 // (C) for IN/OUT
  | { type: 'indirectSP' }                                   // (SP) for EX (SP),HL
  | { type: 'none' };

/**
 * Instruction mnemonics — full Z-80 set
 */
export type Mnemonic =
  // Data Transfer
  | 'LD'    // Load
  // Arithmetic
  | 'ADD'   // Add
  | 'ADC'   // Add with Carry
  | 'SUB'   // Subtract
  | 'SBC'   // Subtract with Carry
  | 'CP'    // Compare
  | 'INC'   // Increment
  | 'DEC'   // Decrement
  // Logic
  | 'AND'   // Bitwise AND
  | 'OR'    // Bitwise OR
  | 'XOR'   // Bitwise XOR
  | 'CPL'   // Complement A (bitwise NOT)
  | 'NEG'   // Negate A (two's complement)
  // Carry Flag
  | 'SCF'   // Set Carry Flag
  | 'CCF'   // Complement Carry Flag
  // Rotate & Shift (CB-prefix, on any register)
  | 'SRL'   // Shift Right Logical
  | 'SLA'   // Shift Left Arithmetic
  | 'SRA'   // Shift Right Arithmetic
  | 'RL'    // Rotate Left through Carry
  | 'RR'    // Rotate Right through Carry
  | 'RLC'   // Rotate Left Circular
  | 'RRC'   // Rotate Right Circular
  // Rotate A (fast, one-byte)
  | 'RLCA'  // Rotate A Left Circular (fast)
  | 'RLA'   // Rotate A Left through Carry (fast)
  | 'RRCA'  // Rotate A Right Circular (fast)
  | 'RRA'   // Rotate A Right through Carry (fast)
  // BCD
  | 'DAA'   // Decimal Adjust Accumulator
  | 'RLD'   // Rotate Left Digit (BCD)
  | 'RRD'   // Rotate Right Digit (BCD)
  // Bit Manipulation
  | 'BIT'   // Test bit
  | 'SET'   // Set bit
  | 'RES'   // Reset bit
  // Exchange
  | 'EX'    // Exchange registers
  | 'EXX'   // Exchange BC/DE/HL with alternates
  // Block Transfer
  | 'LDI'   // Load and Increment
  | 'LDIR'  // Load, Increment, Repeat
  | 'LDD'   // Load and Decrement
  | 'LDDR'  // Load, Decrement, Repeat
  // Block Search
  | 'CPI'   // Compare and Increment
  | 'CPIR'  // Compare, Increment, Repeat
  | 'CPD'   // Compare and Decrement
  | 'CPDR'  // Compare, Decrement, Repeat
  // Jump (unconditional & conditional)
  | 'JP'    // Jump (unconditional)
  | 'JPNZ'  // Jump if Not Zero
  | 'JPZ'   // Jump if Zero
  | 'JPC'   // Jump if Carry
  | 'JPNC'  // Jump if Not Carry
  | 'JPP'   // Jump if Positive (S=0)
  | 'JPM'   // Jump if Minus (S=1)
  | 'JPPE'  // Jump if Parity Even (P=1)
  | 'JPPO'  // Jump if Parity Odd (P=0)
  // Relative Jump
  | 'JR'    // Relative Jump (unconditional)
  | 'JRNZ'  // Relative Jump if Not Zero
  | 'JRZ'   // Relative Jump if Zero
  | 'JRC'   // Relative Jump if Carry
  | 'JRNC'  // Relative Jump if Not Carry
  | 'DJNZ'  // Decrement B, Jump if Not Zero
  // Call
  | 'CALL'  // Call subroutine
  | 'CALLNZ' | 'CALLZ' | 'CALLC' | 'CALLNC'
  | 'CALLP' | 'CALLM' | 'CALLPE' | 'CALLPO'
  // Return
  | 'RET'   // Return from subroutine
  | 'RETNZ' | 'RETZ' | 'RETC' | 'RETNC'
  | 'RETP' | 'RETM' | 'RETPE' | 'RETPO'
  | 'RETI'  // Return from Interrupt
  | 'RETN'  // Return from NMI
  // Restart
  | 'RST'   // Restart (RST 00H-38H)
  // Stack
  | 'PUSH'  // Push register pair onto stack
  | 'POP'   // Pop register pair from stack
  // Input/Output
  | 'IN'    // Input from port
  | 'OUT'   // Output to port
  | 'INI'   // Input and Increment
  | 'INIR'  // Input, Increment, Repeat
  | 'IND'   // Input and Decrement
  | 'INDR'  // Input, Decrement, Repeat
  | 'OUTI'  // Output and Increment
  | 'OTIR'  // Output, Increment, Repeat
  | 'OUTD'  // Output and Decrement
  | 'OTDR'  // Output, Decrement, Repeat
  // Interrupt Control
  | 'DI'    // Disable Interrupts
  | 'EI'    // Enable Interrupts
  | 'IM'    // Set Interrupt Mode
  // Control
  | 'NOP'   // No Operation
  | 'HALT'; // Halt execution