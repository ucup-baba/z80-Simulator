/**
 * Instruction Parser
 * Parses assembly code into Instruction objects — full Z-80 instruction set
 */

import type { Instruction, Mnemonic, OperandType, Register8Bit, Register16Bit, RegisterPair, IndexRegister, Address } from '../domain';

/**
 * Parses a hex string (e.g., "05H", "0x05", "5") to a number
 */
function parseHexValue(value: string): number {
  const cleaned = value.trim().toUpperCase();

  // Remove 'H' suffix (Z-80 convention)
  if (cleaned.endsWith('H')) {
    return parseInt(cleaned.slice(0, -1), 16);
  }

  // Handle 0x prefix
  if (cleaned.startsWith('0X')) {
    return parseInt(cleaned.slice(2), 16);
  }

  // Try hex first, fall back to decimal
  const hexValue = parseInt(cleaned, 16);
  if (!isNaN(hexValue)) {
    return hexValue;
  }

  return parseInt(cleaned, 10);
}

/**
 * Checks if a string is a valid 8-bit register name
 */
function is8BitRegister(value: string): value is Register8Bit {
  const registers: Register8Bit[] = ['A', 'B', 'C', 'D', 'E', 'H', 'L'];
  return registers.includes(value.toUpperCase() as Register8Bit);
}

/**
 * Checks if a string is a valid 16-bit register name
 */
function is16BitRegister(value: string): value is Register16Bit {
  const registers: Register16Bit[] = ['PC', 'SP'];
  return registers.includes(value.toUpperCase() as Register16Bit);
}

/**
 * Checks if a string is a valid register pair name
 */
function isRegisterPair(value: string): value is RegisterPair {
  const pairs: RegisterPair[] = ['BC', 'DE', 'HL', 'AF'];
  return pairs.includes(value.toUpperCase() as RegisterPair);
}

/**
 * Checks if a string is an index register (IX or IY)
 */
function isIndexRegister(value: string): value is IndexRegister {
  const upper = value.toUpperCase();
  return upper === 'IX' || upper === 'IY';
}

/**
 * Checks if a string is indirect addressing like (HL), (BC), (DE)
 */
function isIndirect(value: string): { is: boolean; pair?: RegisterPair } {
  const trimmed = value.trim().toUpperCase();
  const match = trimmed.match(/^\(([A-Z]{2})\)$/);
  if (match && isRegisterPair(match[1])) {
    return { is: true, pair: match[1] as RegisterPair };
  }
  return { is: false };
}

/**
 * Checks if a string is indexed addressing like (IX+d) or (IY+d) or (IX-d) or (IY-d)
 */
function isIndexed(value: string): { is: boolean; reg?: IndexRegister; offset?: number } {
  const trimmed = value.trim().toUpperCase();
  // Match (IX+d), (IX-d), (IY+d), (IY-d), (IX), (IY)
  const match = trimmed.match(/^\((IX|IY)([+-]\d+)?\)$/);
  if (match) {
    const reg = match[1] as IndexRegister;
    const offset = match[2] ? parseInt(match[2], 10) : 0;
    return { is: true, reg, offset };
  }
  return { is: false };
}

/**
 * Checks if a string is (C) for port register indirect
 */
function isPortRegister(value: string): boolean {
  return value.trim().toUpperCase() === '(C)';
}

/**
 * Checks if a string is (SP)
 */
function isIndirectSP(value: string): boolean {
  return value.trim().toUpperCase() === '(SP)';
}

/**
 * Parses an operand string into an OperandType
 */
function parseOperand(operand: string, labels?: Map<string, number>): OperandType {
  const trimmed = operand.trim().toUpperCase();

  if (!trimmed) {
    return { type: 'none' };
  }

  // Check for (SP)
  if (isIndirectSP(trimmed)) {
    return { type: 'indirectSP' };
  }

  // Check for (C) port register — only in IN/OUT context, handled specially
  // We treat it generically; executor will distinguish context
  if (isPortRegister(trimmed)) {
    return { type: 'portRegister' };
  }

  // Check for indexed addressing (IX+d), (IY+d)
  const indexed = isIndexed(trimmed);
  if (indexed.is && indexed.reg) {
    if (indexed.reg === 'IX') return { type: 'indexedIX', value: indexed.offset ?? 0 };
    if (indexed.reg === 'IY') return { type: 'indexedIY', value: indexed.offset ?? 0 };
  }

  // Check for indirect addressing (HL), (BC), (DE)
  const indirect = isIndirect(trimmed);
  if (indirect.is && indirect.pair) {
    return { type: 'indirect', value: indirect.pair };
  }

  // Check for indirect address (nn) — e.g., (4000H), (0x1234)
  const indirectAddrMatch = trimmed.match(/^\((.+)\)$/);
  if (indirectAddrMatch) {
    const innerValue = parseHexValue(indirectAddrMatch[1]);
    if (!isNaN(innerValue) && innerValue >= 0 && innerValue <= 0xFFFF) {
      return { type: 'indirectAddress', value: innerValue };
    }
  }

  // Check for index register (IX, IY)
  if (isIndexRegister(trimmed)) {
    return { type: 'indexRegister', value: trimmed as IndexRegister };
  }

  // Check for 8-bit register
  if (is8BitRegister(trimmed)) {
    return { type: 'register8', value: trimmed as Register8Bit };
  }

  // Check for register pair (BC, DE, HL, AF)
  if (isRegisterPair(trimmed)) {
    return { type: 'registerPair', value: trimmed as RegisterPair };
  }

  // Check for 16-bit register
  if (is16BitRegister(trimmed)) {
    return { type: 'register16', value: trimmed as Register16Bit };
  }

  // Check for label reference
  if (labels && labels.has(trimmed)) {
    const labelIndex = labels.get(trimmed)!;
    return { type: 'immediate8', value: labelIndex };
  }

  // Parse immediate value
  const value = parseHexValue(trimmed);

  if (isNaN(value)) {
    throw new Error(`Invalid operand: ${operand}`);
  }

  // Determine if 8-bit or 16-bit based on value range
  if (value >= 0 && value <= 0xFF) {
    return { type: 'immediate8', value };
  } else if (value >= 0 && value <= 0xFFFF) {
    return { type: 'immediate16', value };
  }

  throw new Error(`Value out of range: ${operand}`);
}

/**
 * Normalizes mnemonic variations
 */
function normalizeMnemonic(mnemonic: string): Mnemonic {
  const normalized = mnemonic.trim().toUpperCase();

  // Handle JP conditional variants
  if (normalized === 'JP NZ' || normalized === 'JPNZ') return 'JPNZ';
  if (normalized === 'JP Z' || normalized === 'JPZ') return 'JPZ';
  if (normalized === 'JP C' || normalized === 'JPC') return 'JPC';
  if (normalized === 'JP NC' || normalized === 'JPNC') return 'JPNC';
  if (normalized === 'JP P' || normalized === 'JPP') return 'JPP';
  if (normalized === 'JP M' || normalized === 'JPM') return 'JPM';
  if (normalized === 'JP PE' || normalized === 'JPPE') return 'JPPE';
  if (normalized === 'JP PO' || normalized === 'JPPO') return 'JPPO';

  // Handle JR conditional variants
  if (normalized === 'JR NZ' || normalized === 'JRNZ') return 'JRNZ';
  if (normalized === 'JR Z' || normalized === 'JRZ') return 'JRZ';
  if (normalized === 'JR C' || normalized === 'JRC') return 'JRC';
  if (normalized === 'JR NC' || normalized === 'JRNC') return 'JRNC';

  // Handle CALL conditional variants
  if (normalized === 'CALL NZ' || normalized === 'CALLNZ') return 'CALLNZ';
  if (normalized === 'CALL Z' || normalized === 'CALLZ') return 'CALLZ';
  if (normalized === 'CALL C' || normalized === 'CALLC') return 'CALLC';
  if (normalized === 'CALL NC' || normalized === 'CALLNC') return 'CALLNC';
  if (normalized === 'CALL P' || normalized === 'CALLP') return 'CALLP';
  if (normalized === 'CALL M' || normalized === 'CALLM') return 'CALLM';
  if (normalized === 'CALL PE' || normalized === 'CALLPE') return 'CALLPE';
  if (normalized === 'CALL PO' || normalized === 'CALLPO') return 'CALLPO';

  // Handle RET conditional variants
  if (normalized === 'RET NZ' || normalized === 'RETNZ') return 'RETNZ';
  if (normalized === 'RET Z' || normalized === 'RETZ') return 'RETZ';
  if (normalized === 'RET C' || normalized === 'RETC') return 'RETC';
  if (normalized === 'RET NC' || normalized === 'RETNC') return 'RETNC';
  if (normalized === 'RET P' || normalized === 'RETP') return 'RETP';
  if (normalized === 'RET M' || normalized === 'RETM') return 'RETM';
  if (normalized === 'RET PE' || normalized === 'RETPE') return 'RETPE';
  if (normalized === 'RET PO' || normalized === 'RETPO') return 'RETPO';

  // Validate known mnemonics
  const validMnemonics: Mnemonic[] = [
    'LD', 'ADD', 'ADC', 'SUB', 'SBC', 'CP', 'INC', 'DEC',
    'AND', 'OR', 'XOR', 'CPL', 'NEG', 'SCF', 'CCF',
    'SRL', 'SLA', 'SRA', 'RL', 'RR', 'RLC', 'RRC',
    'RLCA', 'RLA', 'RRCA', 'RRA',
    'DAA', 'RLD', 'RRD',
    'BIT', 'SET', 'RES',
    'EX', 'EXX',
    'LDI', 'LDIR', 'LDD', 'LDDR',
    'CPI', 'CPIR', 'CPD', 'CPDR',
    'JP', 'JPNZ', 'JPZ', 'JPC', 'JPNC', 'JPP', 'JPM', 'JPPE', 'JPPO',
    'JR', 'JRNZ', 'JRZ', 'JRC', 'JRNC', 'DJNZ',
    'CALL', 'CALLNZ', 'CALLZ', 'CALLC', 'CALLNC', 'CALLP', 'CALLM', 'CALLPE', 'CALLPO',
    'RET', 'RETNZ', 'RETZ', 'RETC', 'RETNC', 'RETP', 'RETM', 'RETPE', 'RETPO',
    'RETI', 'RETN',
    'RST',
    'PUSH', 'POP',
    'IN', 'OUT',
    'INI', 'INIR', 'IND', 'INDR',
    'OUTI', 'OTIR', 'OUTD', 'OTDR',
    'DI', 'EI', 'IM',
    'NOP', 'HALT',
  ];

  if (validMnemonics.includes(normalized as Mnemonic)) {
    return normalized as Mnemonic;
  }

  throw new Error(`Unknown mnemonic: ${mnemonic}`);
}

/**
 * Reassembles operand tokens that may have been split incorrectly.
 * Handles cases like "(HL)" being split into ["(HL)"] or ["(HL", ")"]
 * Also handles indexed: "(IX+5)" split into ["(IX+5)"] or ["(IX", "+5)"]
 */
function reassembleTokens(tokens: string[]): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    // If token starts with '(' but doesn't end with ')', merge with next
    if (tokens[i].startsWith('(') && !tokens[i].endsWith(')') && i + 1 < tokens.length) {
      result.push(tokens[i] + tokens[i + 1]);
      i += 2;
    } else {
      result.push(tokens[i]);
      i++;
    }
  }
  return result;
}

/**
 * Parses a single line of assembly code
 */
export function parseInstruction(line: string, address: Address = 0, labels?: Map<string, number>): Instruction {
  // Remove comments (semicolon to end of line)
  const withoutComments = line.split(';')[0].trim();

  if (!withoutComments) {
    // Empty line or comment-only line
    return {
      mnemonic: 'NOP',
      sourceCode: line,
      address,
    };
  }

  // Pre-process: Normalize conditional JP variants BEFORE tokenizing
  let preprocessed = withoutComments;
  preprocessed = preprocessed.replace(/\bJP\s+NZ\b/i, 'JPNZ');
  preprocessed = preprocessed.replace(/\bJP\s+Z\b/i, 'JPZ');
  preprocessed = preprocessed.replace(/\bJP\s+NC\b/i, 'JPNC');
  // JP C must be careful not to match CALL etc
  preprocessed = preprocessed.replace(/\bJP\s+C\b/i, 'JPC');
  preprocessed = preprocessed.replace(/\bJP\s+PE\b/i, 'JPPE');
  preprocessed = preprocessed.replace(/\bJP\s+PO\b/i, 'JPPO');
  preprocessed = preprocessed.replace(/\bJP\s+P\b/i, 'JPP');
  preprocessed = preprocessed.replace(/\bJP\s+M\b/i, 'JPM');

  // Pre-process: Normalize conditional JR variants
  preprocessed = preprocessed.replace(/\bJR\s+NZ\b/i, 'JRNZ');
  preprocessed = preprocessed.replace(/\bJR\s+Z\b/i, 'JRZ');
  preprocessed = preprocessed.replace(/\bJR\s+NC\b/i, 'JRNC');
  preprocessed = preprocessed.replace(/\bJR\s+C\b/i, 'JRC');

  // Pre-process: Normalize conditional CALL variants
  preprocessed = preprocessed.replace(/\bCALL\s+NZ\b/i, 'CALLNZ');
  preprocessed = preprocessed.replace(/\bCALL\s+Z\b/i, 'CALLZ');
  preprocessed = preprocessed.replace(/\bCALL\s+NC\b/i, 'CALLNC');
  preprocessed = preprocessed.replace(/\bCALL\s+C\b/i, 'CALLC');
  preprocessed = preprocessed.replace(/\bCALL\s+PE\b/i, 'CALLPE');
  preprocessed = preprocessed.replace(/\bCALL\s+PO\b/i, 'CALLPO');
  preprocessed = preprocessed.replace(/\bCALL\s+P\b/i, 'CALLP');
  preprocessed = preprocessed.replace(/\bCALL\s+M\b/i, 'CALLM');

  // Pre-process: Normalize conditional RET variants
  preprocessed = preprocessed.replace(/\bRET\s+NZ\b/i, 'RETNZ');
  preprocessed = preprocessed.replace(/\bRET\s+Z\b/i, 'RETZ');
  preprocessed = preprocessed.replace(/\bRET\s+NC\b/i, 'RETNC');
  preprocessed = preprocessed.replace(/\bRET\s+C\b/i, 'RETC');
  preprocessed = preprocessed.replace(/\bRET\s+PE\b/i, 'RETPE');
  preprocessed = preprocessed.replace(/\bRET\s+PO\b/i, 'RETPO');
  preprocessed = preprocessed.replace(/\bRET\s+P\b/i, 'RETP');
  preprocessed = preprocessed.replace(/\bRET\s+M\b/i, 'RETM');

  // Pre-process: Handle "EX AF, AF'" — strip the apostrophe from AF'
  preprocessed = preprocessed.replace(/\bAF'/gi, 'AF');

  // Split by whitespace and commas, but preserve parenthesized groups
  const tokens = preprocessed
    .split(/[\s,]+/)
    .filter(token => token.length > 0);

  const reassembled = reassembleTokens(tokens);

  if (reassembled.length === 0) {
    return {
      mnemonic: 'NOP',
      sourceCode: line,
      address,
    };
  }

  const mnemonicStr = reassembled[0];
  const operandStartIndex = 1;

  const mnemonic = normalizeMnemonic(mnemonicStr);

  // Parse operands
  const operands = reassembled.slice(operandStartIndex);

  const instruction: Instruction = {
    mnemonic,
    sourceCode: line,
    address,
  };

  if (operands.length >= 1) {
    instruction.operand1 = parseOperand(operands[0], labels);
  }

  if (operands.length >= 2) {
    instruction.operand2 = parseOperand(operands[1], labels);
  }

  return instruction;
}

/**
 * Result of parsing a program, including ORG address
 */
export interface ParseResult {
  instructions: Instruction[];
  orgAddress: number;
}

/**
 * Parses multiple lines of assembly code
 * Supports ORG directive for setting origin address
 */
export function parseProgram(code: string): Instruction[] {
  return parseProgramWithOrg(code).instructions;
}

/**
 * Parses multiple lines and returns instructions + ORG address
 */
export function parseProgramWithOrg(code: string): ParseResult {
  const lines = code.split('\n');
  const labels = new Map<string, number>();
  
  // First pass: collect labels and count instructions
  let instrIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith(';')) continue;

    const withoutComments = line.split(';')[0].trim();
    
    // Skip ORG directive
    if (withoutComments.match(/^ORG\s+/i)) continue;

    // Check for label (ends with ':')
    const labelMatch = withoutComments.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (labelMatch) {
      labels.set(labelMatch[1].toUpperCase(), instrIndex);
      // If there's an instruction after the label on the same line, count it
      const rest = labelMatch[2].trim();
      if (rest && !rest.startsWith(';')) {
        instrIndex++;
      }
      continue;
    }

    instrIndex++;
  }

  // Second pass: parse instructions with label resolution
  const instructions: Instruction[] = [];
  let orgAddress = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith(';')) {
      continue;
    }

    // Handle ORG directive
    const withoutComments = line.split(';')[0].trim();
    const orgMatch = withoutComments.match(/^ORG\s+(.+)$/i);
    if (orgMatch) {
      orgAddress = parseHexValue(orgMatch[1].trim());
      if (isNaN(orgAddress) || orgAddress < 0 || orgAddress > 0xFFFF) {
        throw new Error(`Parse error on line ${i + 1}: Invalid ORG address: ${orgMatch[1]}`);
      }
      continue;
    }

    // Strip label prefix if present
    let codePart = withoutComments;
    const labelMatch = withoutComments.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (labelMatch) {
      codePart = labelMatch[2].trim();
      if (!codePart || codePart.startsWith(';')) continue;
    }

    try {
      const instruction = parseInstruction(codePart, instructions.length, labels);
      // Keep original source line for display
      instruction.sourceCode = line;
      instructions.push(instruction);
    } catch (error) {
      throw new Error(`Parse error on line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { instructions, orgAddress };
}