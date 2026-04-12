/**
 * Instruction Executor
 * Executes parsed instructions and updates CPU state — full Z-80 instruction set
 */

import type { Instruction, CPUState, ExecutionResult, Register8Bit, RegisterPair, IndexRegister, Byte } from '../domain';
import type { CPUFlags } from '../domain/entities';
import { toByte, toWord } from './cpuStateFactory';
import {
  aluAdd, aluSub, aluInc, aluDec, evaluateCondition,
  aluSrl, aluSla, aluRl, aluDaa, aluAnd, aluOr, aluXor,
  aluAdc, aluSbc, aluRr, aluRrc, aluRlc, aluSra,
  aluAdcHL, aluSbcHL,
} from './aluOperations';
import type { ConditionCode } from './aluOperations';

// ─── Register helpers ───────────────────────────────────────────────
function getR8(s: CPUState, r: Register8Bit): Byte { return s.registers.registers8[r]; }
function setR8(s: CPUState, r: Register8Bit, v: Byte) { s.registers.registers8[r] = toByte(v); }

function getPair(s: CPUState, p: RegisterPair): number {
  const r = s.registers.registers8;
  switch (p) {
    case 'BC': return (r.B << 8) | r.C;
    case 'DE': return (r.D << 8) | r.E;
    case 'HL': return (r.H << 8) | r.L;
    case 'AF': {
      const f = (s.registers.flags.S ? 0x80 : 0) | (s.registers.flags.Z ? 0x40 : 0)
              | (s.registers.flags.Y ? 0x20 : 0) | (s.registers.flags.H ? 0x10 : 0)
              | (s.registers.flags.X ? 0x08 : 0) | (s.registers.flags.P ? 0x04 : 0)
              | (s.registers.flags.N ? 0x02 : 0) | (s.registers.flags.C ? 0x01 : 0);
      return (r.A << 8) | f;
    }
  }
}

function setPair(s: CPUState, p: RegisterPair, v: number) {
  const w = toWord(v); const hi = (w >> 8) & 0xFF; const lo = w & 0xFF;
  switch (p) {
    case 'BC': s.registers.registers8.B = hi; s.registers.registers8.C = lo; break;
    case 'DE': s.registers.registers8.D = hi; s.registers.registers8.E = lo; break;
    case 'HL': s.registers.registers8.H = hi; s.registers.registers8.L = lo; break;
    case 'AF':
      s.registers.registers8.A = hi;
      s.registers.flags.S = !!(lo & 0x80); s.registers.flags.Z = !!(lo & 0x40);
      s.registers.flags.Y = !!(lo & 0x20); s.registers.flags.H = !!(lo & 0x10);
      s.registers.flags.X = !!(lo & 0x08); s.registers.flags.P = !!(lo & 0x04);
      s.registers.flags.N = !!(lo & 0x02); s.registers.flags.C = !!(lo & 0x01);
      break;
  }
}

function getIR(s: CPUState, ir: IndexRegister): number { return s.registers.registers16[ir]; }
function setIR(s: CPUState, ir: IndexRegister, v: number) { s.registers.registers16[ir] = toWord(v); }

function hex8(v: number) { return toByte(v).toString(16).padStart(2, '0').toUpperCase() + 'H'; }
function hex16(v: number) { return toWord(v).toString(16).padStart(4, '0').toUpperCase() + 'H'; }

// ─── Stack helpers ──────────────────────────────────────────────────
function stackPush16(s: CPUState, v: number) {
  const w = toWord(v); const hi = (w >> 8) & 0xFF; const lo = w & 0xFF;
  s.registers.registers16.SP = toWord(s.registers.registers16.SP - 1);
  s.memory.bytes[s.registers.registers16.SP] = hi;
  s.registers.registers16.SP = toWord(s.registers.registers16.SP - 1);
  s.memory.bytes[s.registers.registers16.SP] = lo;
}

function stackPop16(s: CPUState): number {
  const lo = s.memory.bytes[s.registers.registers16.SP];
  s.registers.registers16.SP = toWord(s.registers.registers16.SP + 1);
  const hi = s.memory.bytes[s.registers.registers16.SP];
  s.registers.registers16.SP = toWord(s.registers.registers16.SP + 1);
  return (hi << 8) | lo;
}

// ─── Resolve operand value (8-bit) for ALU ops ─────────────────────
function resolveSource(s: CPUState, inst: Instruction): { value: Byte; desc: string } | { error: string } {
  const { operand1, operand2 } = inst;
  const resolve = (op: NonNullable<typeof operand1>): { value: Byte; desc: string } | { error: string } => {
    if (op.type === 'register8') return { value: getR8(s, op.value), desc: op.value };
    if (op.type === 'immediate8') return { value: op.value, desc: hex8(op.value) };
    if (op.type === 'indirect') { const a = getPair(s, op.value); return { value: s.memory.bytes[a], desc: `(${op.value})` }; }
    if (op.type === 'indexedIX') { const a = toWord(getIR(s, 'IX') + op.value); return { value: s.memory.bytes[a], desc: `(IX+${op.value})` }; }
    if (op.type === 'indexedIY') { const a = toWord(getIR(s, 'IY') + op.value); return { value: s.memory.bytes[a], desc: `(IY+${op.value})` }; }
    return { error: `Unsupported source type: ${op.type}` };
  };
  if (operand2) return resolve(operand2);
  if (operand1) return resolve(operand1);
  return { error: 'Requires at least one operand' };
}

// Helper to write ALU result to memory for indexed operands
function writeIndexed(s: CPUState, inst: Instruction, v: Byte) {
  const op = inst.operand1 ?? inst.operand2;
  if (!op) return;
  if (op.type === 'indexedIX') { s.memory.bytes[toWord(getIR(s, 'IX') + op.value)] = v; }
  if (op.type === 'indexedIY') { s.memory.bytes[toWord(getIR(s, 'IY') + op.value)] = v; }
  if (op.type === 'indirect') { s.memory.bytes[getPair(s, op.value)] = v; }
}

const ok = (s: CPUState, m: string): ExecutionResult => ({ success: true, updatedState: s, message: m });
const fail = (s: CPUState, e: string): ExecutionResult => ({ success: false, updatedState: s, error: e });
// ─── Instruction implementations ────────────────────────────────────

function executeLd(s: CPUState, inst: Instruction): ExecutionResult {
  if (!inst.operand1 || !inst.operand2) return fail(s, 'LD requires two operands');
  const { operand1: o1, operand2: o2 } = inst;

  // LD r, n / LD r, r'
  if (o1.type === 'register8' && (o2.type === 'immediate8' || o2.type === 'register8')) {
    const v = o2.type === 'register8' ? getR8(s, o2.value) : o2.value;
    setR8(s, o1.value, v); return ok(s, `LD ${o1.value}, ${hex8(v)}`);
  }
  // LD rr, nn
  if (o1.type === 'registerPair' && (o2.type === 'immediate16' || o2.type === 'immediate8')) {
    setPair(s, o1.value, o2.value); return ok(s, `LD ${o1.value}, ${hex16(o2.value)}`);
  }
  // LD SP, nn
  if (o1.type === 'register16' && o1.value === 'SP' && (o2.type === 'immediate16' || o2.type === 'immediate8')) {
    s.registers.registers16.SP = toWord(o2.value); return ok(s, `LD SP, ${hex16(o2.value)}`);
  }
  // LD SP, HL
  if (o1.type === 'register16' && o1.value === 'SP' && o2.type === 'registerPair' && o2.value === 'HL') {
    s.registers.registers16.SP = getPair(s, 'HL'); return ok(s, `LD SP, HL`);
  }
  // LD SP, IX/IY
  if (o1.type === 'register16' && o1.value === 'SP' && o2.type === 'indexRegister') {
    s.registers.registers16.SP = getIR(s, o2.value); return ok(s, `LD SP, ${o2.value}`);
  }
  // LD IX/IY, nn
  if (o1.type === 'indexRegister' && (o2.type === 'immediate16' || o2.type === 'immediate8')) {
    setIR(s, o1.value, o2.value); return ok(s, `LD ${o1.value}, ${hex16(o2.value)}`);
  }
  // LD IX/IY, (nn)
  if (o1.type === 'indexRegister' && o2.type === 'indirectAddress') {
    const lo = s.memory.bytes[o2.value]; const hi = s.memory.bytes[toWord(o2.value + 1)];
    setIR(s, o1.value, (hi << 8) | lo); return ok(s, `LD ${o1.value}, (${hex16(o2.value)})`);
  }
  // LD (nn), IX/IY
  if (o1.type === 'indirectAddress' && o2.type === 'indexRegister') {
    const v = getIR(s, o2.value);
    s.memory.bytes[o1.value] = v & 0xFF; s.memory.bytes[toWord(o1.value + 1)] = (v >> 8) & 0xFF;
    return ok(s, `LD (${hex16(o1.value)}), ${o2.value}`);
  }
  // LD (indirect), r / LD (indirect), n
  if (o1.type === 'indirect' && (o2.type === 'register8' || o2.type === 'immediate8')) {
    const addr = getPair(s, o1.value);
    const v = o2.type === 'register8' ? getR8(s, o2.value) : o2.value;
    s.memory.bytes[addr] = v; return ok(s, `LD (${o1.value}), ${hex8(v)}`);
  }
  // LD r, (indirect)
  if (o1.type === 'register8' && o2.type === 'indirect') {
    const v = s.memory.bytes[getPair(s, o2.value)]; setR8(s, o1.value, v);
    return ok(s, `LD ${o1.value}, (${o2.value}) = ${hex8(v)}`);
  }
  // LD r, (nn)
  if (o1.type === 'register8' && o2.type === 'indirectAddress') {
    const v = s.memory.bytes[o2.value]; setR8(s, o1.value, v);
    return ok(s, `LD ${o1.value}, (${hex16(o2.value)}) = ${hex8(v)}`);
  }
  // LD (nn), r
  if (o1.type === 'indirectAddress' && o2.type === 'register8') {
    const v = getR8(s, o2.value); s.memory.bytes[o1.value] = v;
    return ok(s, `LD (${hex16(o1.value)}), ${o2.value} = ${hex8(v)}`);
  }
  // LD (nn), HL / LD HL, (nn) — 16-bit direct
  if (o1.type === 'indirectAddress' && o2.type === 'registerPair') {
    const v = getPair(s, o2.value);
    s.memory.bytes[o1.value] = v & 0xFF; s.memory.bytes[toWord(o1.value + 1)] = (v >> 8) & 0xFF;
    return ok(s, `LD (${hex16(o1.value)}), ${o2.value}`);
  }
  if (o1.type === 'registerPair' && o2.type === 'indirectAddress') {
    const lo = s.memory.bytes[o2.value]; const hi = s.memory.bytes[toWord(o2.value + 1)];
    setPair(s, o1.value, (hi << 8) | lo); return ok(s, `LD ${o1.value}, (${hex16(o2.value)})`);
  }
  // LD r, (IX+d) / LD r, (IY+d)
  if (o1.type === 'register8' && (o2.type === 'indexedIX' || o2.type === 'indexedIY')) {
    const ir = o2.type === 'indexedIX' ? 'IX' : 'IY';
    const addr = toWord(getIR(s, ir) + o2.value);
    const v = s.memory.bytes[addr]; setR8(s, o1.value, v);
    return ok(s, `LD ${o1.value}, (${ir}+${o2.value}) = ${hex8(v)}`);
  }
  // LD (IX+d), r / LD (IY+d), r
  if ((o1.type === 'indexedIX' || o1.type === 'indexedIY') && o2.type === 'register8') {
    const ir = o1.type === 'indexedIX' ? 'IX' : 'IY';
    const addr = toWord(getIR(s, ir) + o1.value);
    const v = getR8(s, o2.value); s.memory.bytes[addr] = v;
    return ok(s, `LD (${ir}+${o1.value}), ${o2.value} = ${hex8(v)}`);
  }
  // LD (IX+d), n / LD (IY+d), n
  if ((o1.type === 'indexedIX' || o1.type === 'indexedIY') && o2.type === 'immediate8') {
    const ir = o1.type === 'indexedIX' ? 'IX' : 'IY';
    const addr = toWord(getIR(s, ir) + o1.value);
    s.memory.bytes[addr] = o2.value;
    return ok(s, `LD (${ir}+${o1.value}), ${hex8(o2.value)}`);
  }
  // LD A, I / LD A, R
  if (o1.type === 'register8' && o1.value === 'A' && o2.type === 'register8') {
    // Already handled above for normal r,r' — I/R are special
    const v = getR8(s, o2.value); setR8(s, 'A', v); return ok(s, `LD A, ${o2.value}`);
  }
  // Fallback for I, R — handled as immediate trick by parser; let's add explicit
  return fail(s, `Unsupported LD variant: ${JSON.stringify(o1)} ← ${JSON.stringify(o2)}`);
}
// ─── Arithmetic/Logic instructions ──────────────────────────────────

function executeAdd(s: CPUState, inst: Instruction): ExecutionResult {
  if (!inst.operand1) return fail(s, 'ADD requires at least one operand');
  const { operand1: o1, operand2: o2 } = inst;
  // ADD HL, rr
  if (o1.type === 'registerPair' && o1.value === 'HL' && o2 && o2.type === 'registerPair') {
    const hl = getPair(s, 'HL'); const rr = getPair(s, o2.value);
    const r = hl + rr; const c = r > 0xFFFF; const hc = ((hl & 0x0FFF) + (rr & 0x0FFF)) > 0x0FFF;
    setPair(s, 'HL', toWord(r)); s.registers.flags.C = c; s.registers.flags.H = hc; s.registers.flags.N = false;
    return ok(s, `ADD HL, ${o2.value} = ${hex16(toWord(r))}`);
  }
  // ADD HL, SP
  if (o1.type === 'registerPair' && o1.value === 'HL' && o2 && o2.type === 'register16' && o2.value === 'SP') {
    const hl = getPair(s, 'HL'); const sp = s.registers.registers16.SP;
    const r = hl + sp; const c = r > 0xFFFF; const hc = ((hl & 0x0FFF) + (sp & 0x0FFF)) > 0x0FFF;
    setPair(s, 'HL', toWord(r)); s.registers.flags.C = c; s.registers.flags.H = hc; s.registers.flags.N = false;
    return ok(s, `ADD HL, SP = ${hex16(toWord(r))}`);
  }
  // ADD IX, rr / ADD IY, rr
  if (o1.type === 'indexRegister' && o2 && (o2.type === 'registerPair' || o2.type === 'register16' || o2.type === 'indexRegister')) {
    const ir = o1.value; const iv = getIR(s, ir);
    let rv: number;
    if (o2.type === 'registerPair') rv = getPair(s, o2.value);
    else if (o2.type === 'register16' && o2.value === 'SP') rv = s.registers.registers16.SP;
    else if (o2.type === 'indexRegister') rv = getIR(s, o2.value);
    else return fail(s, 'ADD IX/IY: invalid source');
    const r = iv + rv; const c = r > 0xFFFF; const hc = ((iv & 0x0FFF) + (rv & 0x0FFF)) > 0x0FFF;
    setIR(s, ir, toWord(r)); s.registers.flags.C = c; s.registers.flags.H = hc; s.registers.flags.N = false;
    return ok(s, `ADD ${ir}, ${hex16(rv)} = ${hex16(toWord(r))}`);
  }
  // ADD A, src (8-bit)
  const src = resolveSource(s, inst);
  if ('error' in src) return fail(s, `ADD: ${src.error}`);
  const ar = aluAdd(getR8(s, 'A'), src.value);
  setR8(s, 'A', ar.result); s.registers.flags = ar.flags;
  return ok(s, `ADD A, ${src.desc} = ${hex8(ar.result)}`);
}

function executeSub(s: CPUState, inst: Instruction): ExecutionResult {
  const src = resolveSource(s, inst);
  if ('error' in src) return fail(s, `SUB: ${src.error}`);
  const ar = aluSub(getR8(s, 'A'), src.value);
  setR8(s, 'A', ar.result); s.registers.flags = ar.flags;
  return ok(s, `SUB ${src.desc}: A = ${hex8(ar.result)}`);
}

function executeCp(s: CPUState, inst: Instruction): ExecutionResult {
  const src = resolveSource(s, inst);
  if ('error' in src) return fail(s, `CP: ${src.error}`);
  const ar = aluSub(getR8(s, 'A'), src.value);
  s.registers.flags = ar.flags; // don't store result
  return ok(s, `CP ${src.desc}: Z=${ar.flags.Z ? 1 : 0} C=${ar.flags.C ? 1 : 0}`);
}

function executeAdc(s: CPUState, inst: Instruction): ExecutionResult {
  const { operand1: o1, operand2: o2 } = inst;
  // ADC HL, rr
  if (o1 && o1.type === 'registerPair' && o1.value === 'HL' && o2 && (o2.type === 'registerPair' || o2.type === 'register16')) {
    const hl = getPair(s, 'HL');
    const rr = o2.type === 'registerPair' ? getPair(s, o2.value) : (o2.value === 'SP' ? s.registers.registers16.SP : 0);
    const ar = aluAdcHL(hl, rr, s.registers.flags.C);
    setPair(s, 'HL', ar.result); s.registers.flags = ar.flags;
    return ok(s, `ADC HL, ${hex16(rr)} = ${hex16(ar.result)}`);
  }
  const src = resolveSource(s, inst);
  if ('error' in src) return fail(s, `ADC: ${src.error}`);
  const ar = aluAdc(getR8(s, 'A'), src.value, s.registers.flags.C);
  setR8(s, 'A', ar.result); s.registers.flags = ar.flags;
  return ok(s, `ADC A, ${src.desc} = ${hex8(ar.result)}`);
}

function executeSbc(s: CPUState, inst: Instruction): ExecutionResult {
  const { operand1: o1, operand2: o2 } = inst;
  // SBC HL, rr
  if (o1 && o1.type === 'registerPair' && o1.value === 'HL' && o2 && (o2.type === 'registerPair' || o2.type === 'register16')) {
    const hl = getPair(s, 'HL');
    const rr = o2.type === 'registerPair' ? getPair(s, o2.value) : (o2.value === 'SP' ? s.registers.registers16.SP : 0);
    const ar = aluSbcHL(hl, rr, s.registers.flags.C);
    setPair(s, 'HL', ar.result); s.registers.flags = ar.flags;
    return ok(s, `SBC HL, ${hex16(rr)} = ${hex16(ar.result)}`);
  }
  const src = resolveSource(s, inst);
  if ('error' in src) return fail(s, `SBC: ${src.error}`);
  const ar = aluSbc(getR8(s, 'A'), src.value, s.registers.flags.C);
  setR8(s, 'A', ar.result); s.registers.flags = ar.flags;
  return ok(s, `SBC A, ${src.desc} = ${hex8(ar.result)}`);
}

function executeInc(s: CPUState, inst: Instruction): ExecutionResult {
  if (!inst.operand1) return fail(s, 'INC requires an operand');
  const o = inst.operand1;
  if (o.type === 'registerPair') { const v = getPair(s, o.value); setPair(s, o.value, v + 1); return ok(s, `INC ${o.value}`); }
  if (o.type === 'indexRegister') { setIR(s, o.value, getIR(s, o.value) + 1); return ok(s, `INC ${o.value}`); }
  if (o.type === 'register8') {
    const ar = aluInc(getR8(s, o.value), s.registers.flags);
    setR8(s, o.value, ar.result); s.registers.flags = ar.flags; return ok(s, `INC ${o.value} = ${hex8(ar.result)}`);
  }
  // INC (HL), INC (IX+d), INC (IY+d)
  if (o.type === 'indirect' || o.type === 'indexedIX' || o.type === 'indexedIY') {
    let addr: number;
    if (o.type === 'indirect') addr = getPair(s, o.value);
    else if (o.type === 'indexedIX') addr = toWord(getIR(s, 'IX') + o.value);
    else addr = toWord(getIR(s, 'IY') + o.value);
    const ar = aluInc(s.memory.bytes[addr], s.registers.flags);
    s.memory.bytes[addr] = ar.result; s.registers.flags = ar.flags;
    return ok(s, `INC (${hex16(addr)}) = ${hex8(ar.result)}`);
  }
  return fail(s, 'INC: invalid operand');
}

function executeDec(s: CPUState, inst: Instruction): ExecutionResult {
  if (!inst.operand1) return fail(s, 'DEC requires an operand');
  const o = inst.operand1;
  if (o.type === 'registerPair') { const v = getPair(s, o.value); setPair(s, o.value, v - 1); return ok(s, `DEC ${o.value}`); }
  if (o.type === 'indexRegister') { setIR(s, o.value, getIR(s, o.value) - 1); return ok(s, `DEC ${o.value}`); }
  if (o.type === 'register8') {
    const ar = aluDec(getR8(s, o.value), s.registers.flags);
    setR8(s, o.value, ar.result); s.registers.flags = ar.flags; return ok(s, `DEC ${o.value} = ${hex8(ar.result)}`);
  }
  if (o.type === 'indirect' || o.type === 'indexedIX' || o.type === 'indexedIY') {
    let addr: number;
    if (o.type === 'indirect') addr = getPair(s, o.value);
    else if (o.type === 'indexedIX') addr = toWord(getIR(s, 'IX') + o.value);
    else addr = toWord(getIR(s, 'IY') + o.value);
    const ar = aluDec(s.memory.bytes[addr], s.registers.flags);
    s.memory.bytes[addr] = ar.result; s.registers.flags = ar.flags;
    return ok(s, `DEC (${hex16(addr)}) = ${hex8(ar.result)}`);
  }
  return fail(s, 'DEC: invalid operand');
}

function executeAnd(s: CPUState, inst: Instruction): ExecutionResult {
  const src = resolveSource(s, inst); if ('error' in src) return fail(s, `AND: ${src.error}`);
  const ar = aluAnd(getR8(s, 'A'), src.value); setR8(s, 'A', ar.result); s.registers.flags = ar.flags;
  return ok(s, `AND ${src.desc}: A = ${hex8(ar.result)}`);
}
function executeOr(s: CPUState, inst: Instruction): ExecutionResult {
  const src = resolveSource(s, inst); if ('error' in src) return fail(s, `OR: ${src.error}`);
  const ar = aluOr(getR8(s, 'A'), src.value); setR8(s, 'A', ar.result); s.registers.flags = ar.flags;
  return ok(s, `OR ${src.desc}: A = ${hex8(ar.result)}`);
}
function executeXor(s: CPUState, inst: Instruction): ExecutionResult {
  const src = resolveSource(s, inst); if ('error' in src) return fail(s, `XOR: ${src.error}`);
  const ar = aluXor(getR8(s, 'A'), src.value); setR8(s, 'A', ar.result); s.registers.flags = ar.flags;
  return ok(s, `XOR ${src.desc}: A = ${hex8(ar.result)}`);
}

function executeCpl(s: CPUState): ExecutionResult {
  const b = getR8(s, 'A'); const r = toByte(~b); setR8(s, 'A', r);
  s.registers.flags.H = true; s.registers.flags.N = true;
  return ok(s, `CPL: A = ${hex8(r)}`);
}
function executeNeg(s: CPUState): ExecutionResult {
  const b = getR8(s, 'A'); const ar = aluSub(0, b); setR8(s, 'A', ar.result); s.registers.flags = ar.flags;
  return ok(s, `NEG: A = ${hex8(ar.result)}`);
}
function executeScf(s: CPUState): ExecutionResult {
  s.registers.flags.C = true; s.registers.flags.H = false; s.registers.flags.N = false;
  return ok(s, 'SCF');
}
function executeCcf(s: CPUState): ExecutionResult {
  const old = s.registers.flags.C; s.registers.flags.H = old; s.registers.flags.C = !old; s.registers.flags.N = false;
  return ok(s, `CCF: C=${!old ? 1 : 0}`);
}
function executeDaa(s: CPUState): ExecutionResult {
  const a = getR8(s, 'A'); const ar = aluDaa(a, s.registers.flags);
  setR8(s, 'A', ar.result); s.registers.flags = ar.flags;
  return ok(s, `DAA: ${hex8(a)} → ${hex8(ar.result)}`);
}
// ─── Rotate & Shift helpers ─────────────────────────────────────────

function resolveShiftTarget(s: CPUState, inst: Instruction): { value: Byte; set: (v: Byte) => void; desc: string } | { error: string } {
  const o = inst.operand1;
  if (!o) return { error: 'Requires an operand' };
  if (o.type === 'register8') return { value: getR8(s, o.value), set: (v) => setR8(s, o.value, v), desc: o.value };
  if (o.type === 'indirect') { const a = getPair(s, o.value); return { value: s.memory.bytes[a], set: (v) => { s.memory.bytes[a] = v; }, desc: `(${o.value})` }; }
  if (o.type === 'indexedIX') { const a = toWord(getIR(s, 'IX') + o.value); return { value: s.memory.bytes[a], set: (v) => { s.memory.bytes[a] = v; }, desc: `(IX+${o.value})` }; }
  if (o.type === 'indexedIY') { const a = toWord(getIR(s, 'IY') + o.value); return { value: s.memory.bytes[a], set: (v) => { s.memory.bytes[a] = v; }, desc: `(IY+${o.value})` }; }
  return { error: `Invalid shift target: ${o.type}` };
}

function execRotateShift(s: CPUState, inst: Instruction, fn: (v: Byte, f: CPUFlags) => { result: Byte; flags: CPUFlags }, name: string): ExecutionResult {
  const t = resolveShiftTarget(s, inst);
  if ('error' in t) return fail(s, `${name}: ${t.error}`);
  const ar = fn(t.value, s.registers.flags); t.set(ar.result); s.registers.flags = ar.flags;
  return ok(s, `${name} ${t.desc} = ${hex8(ar.result)}`);
}

// RLCA, RLA, RRCA, RRA — fast rotates on A only
function executeRlca(s: CPUState): ExecutionResult {
  const a = getR8(s, 'A'); const bit7 = (a & 0x80) >> 7; const r = toByte((a << 1) | bit7);
  setR8(s, 'A', r); s.registers.flags.C = bit7 !== 0; s.registers.flags.H = false; s.registers.flags.N = false;
  return ok(s, `RLCA: A = ${hex8(r)}`);
}
function executeRla(s: CPUState): ExecutionResult {
  const a = getR8(s, 'A'); const oldC = s.registers.flags.C ? 1 : 0; const bit7 = (a & 0x80) !== 0;
  const r = toByte((a << 1) | oldC); setR8(s, 'A', r); s.registers.flags.C = bit7; s.registers.flags.H = false; s.registers.flags.N = false;
  return ok(s, `RLA: A = ${hex8(r)}`);
}
function executeRrca(s: CPUState): ExecutionResult {
  const a = getR8(s, 'A'); const bit0 = a & 0x01; const r = toByte((a >> 1) | (bit0 << 7));
  setR8(s, 'A', r); s.registers.flags.C = bit0 !== 0; s.registers.flags.H = false; s.registers.flags.N = false;
  return ok(s, `RRCA: A = ${hex8(r)}`);
}
function executeRra(s: CPUState): ExecutionResult {
  const a = getR8(s, 'A'); const oldC = s.registers.flags.C ? 0x80 : 0; const bit0 = (a & 0x01) !== 0;
  const r = toByte((a >> 1) | oldC); setR8(s, 'A', r); s.registers.flags.C = bit0; s.registers.flags.H = false; s.registers.flags.N = false;
  return ok(s, `RRA: A = ${hex8(r)}`);
}

// RLD/RRD — BCD digit rotate
function countBits(value: Byte): number { let c = 0; let n = value; while (n) { c += n & 1; n >>= 1; } return c; }

function executeRld(s: CPUState): ExecutionResult {
  const a = getR8(s, 'A'); const hl = getPair(s, 'HL'); const m = s.memory.bytes[hl];
  // High nibble of (HL) goes to low nibble of A. Low nibble of A goes to low nibble of (HL). Low nibble of (HL) goes to high nibble of (HL).
  const newA = toByte((a & 0xF0) | ((m >> 4) & 0x0F));
  const newM = toByte(((m << 4) & 0xF0) | (a & 0x0F));
  setR8(s, 'A', newA); s.memory.bytes[hl] = newM;
  s.registers.flags.S = (newA & 0x80) !== 0; s.registers.flags.Z = newA === 0; s.registers.flags.H = false; s.registers.flags.N = false;
  s.registers.flags.P = countBits(newA) % 2 === 0;
  return ok(s, `RLD: A=${hex8(newA)}, (HL)=${hex8(newM)}`);
}
function executeRrd(s: CPUState): ExecutionResult {
  const a = getR8(s, 'A'); const hl = getPair(s, 'HL'); const m = s.memory.bytes[hl];
  const newA = toByte((a & 0xF0) | (m & 0x0F));
  const newM = toByte(((a << 4) & 0xF0) | ((m >> 4) & 0x0F));
  setR8(s, 'A', newA); s.memory.bytes[hl] = newM;
  s.registers.flags.S = (newA & 0x80) !== 0; s.registers.flags.Z = newA === 0; s.registers.flags.H = false; s.registers.flags.N = false;
  s.registers.flags.P = countBits(newA) % 2 === 0;
  return ok(s, `RRD: A=${hex8(newA)}, (HL)=${hex8(newM)}`);
}

// ─── BIT operations ─────────────────────────────────────────────────
function getBitAndTarget(s: CPUState, inst: Instruction): { bit: number; value: Byte; set: (v: Byte) => void; desc: string } | { error: string } {
  if (!inst.operand1 || !inst.operand2) return { error: 'BIT/SET/RES requires two operands' };
  if (inst.operand1.type !== 'immediate8') return { error: 'First operand must be bit number' };
  const bit = inst.operand1.value;
  if (bit < 0 || bit > 7) return { error: `Invalid bit number: ${bit}` };
  const o = inst.operand2;
  if (o.type === 'register8') return { bit, value: getR8(s, o.value), set: (v) => setR8(s, o.value, v), desc: o.value };
  if (o.type === 'indirect') { const a = getPair(s, o.value); return { bit, value: s.memory.bytes[a], set: (v) => { s.memory.bytes[a] = v; }, desc: `(${o.value})` }; }
  if (o.type === 'indexedIX') { const a = toWord(getIR(s, 'IX') + o.value); return { bit, value: s.memory.bytes[a], set: (v) => { s.memory.bytes[a] = v; }, desc: `(IX+${o.value})` }; }
  if (o.type === 'indexedIY') { const a = toWord(getIR(s, 'IY') + o.value); return { bit, value: s.memory.bytes[a], set: (v) => { s.memory.bytes[a] = v; }, desc: `(IY+${o.value})` }; }
  return { error: `Invalid target for BIT/SET/RES: ${o.type}` };
}

function executeBit(s: CPUState, inst: Instruction): ExecutionResult {
  const t = getBitAndTarget(s, inst); if ('error' in t) return fail(s, `BIT: ${t.error}`);
  const tested = (t.value >> t.bit) & 1;
  s.registers.flags.Z = tested === 0; s.registers.flags.H = true; s.registers.flags.N = false;
  return ok(s, `BIT ${t.bit}, ${t.desc}: Z=${tested === 0 ? 1 : 0}`);
}
function executeSet(s: CPUState, inst: Instruction): ExecutionResult {
  const t = getBitAndTarget(s, inst); if ('error' in t) return fail(s, `SET: ${t.error}`);
  t.set(toByte(t.value | (1 << t.bit))); return ok(s, `SET ${t.bit}, ${t.desc}`);
}
function executeRes(s: CPUState, inst: Instruction): ExecutionResult {
  const t = getBitAndTarget(s, inst); if ('error' in t) return fail(s, `RES: ${t.error}`);
  t.set(toByte(t.value & ~(1 << t.bit))); return ok(s, `RES ${t.bit}, ${t.desc}`);
}

// ─── Exchange ───────────────────────────────────────────────────────
function executeEx(s: CPUState, inst: Instruction): ExecutionResult {
  const { operand1: o1, operand2: o2 } = inst;
  // EX DE, HL
  if (o1?.type === 'registerPair' && o1.value === 'DE' && o2?.type === 'registerPair' && o2.value === 'HL') {
    const de = getPair(s, 'DE'); const hl = getPair(s, 'HL'); setPair(s, 'DE', hl); setPair(s, 'HL', de);
    return ok(s, 'EX DE, HL');
  }
  // EX AF, AF'
  if (o1?.type === 'registerPair' && o1.value === 'AF' && o2?.type === 'registerPair' && o2.value === 'AF') {
    const r = s.registers; const alt = s.registers.alternate;
    const tA = r.registers8.A; const tF = { ...r.flags };
    r.registers8.A = alt.A; r.flags = { ...alt.flags };
    alt.A = tA; alt.flags = tF;
    return ok(s, "EX AF, AF'");
  }
  // EX (SP), HL
  if (o1?.type === 'indirectSP' && o2?.type === 'registerPair' && o2.value === 'HL') {
    const sp = s.registers.registers16.SP;
    const lo = s.memory.bytes[sp]; const hi = s.memory.bytes[toWord(sp + 1)];
    const hl = getPair(s, 'HL');
    s.memory.bytes[sp] = hl & 0xFF; s.memory.bytes[toWord(sp + 1)] = (hl >> 8) & 0xFF;
    setPair(s, 'HL', (hi << 8) | lo);
    return ok(s, 'EX (SP), HL');
  }
  // EX (SP), IX/IY
  if (o1?.type === 'indirectSP' && o2?.type === 'indexRegister') {
    const sp = s.registers.registers16.SP;
    const lo = s.memory.bytes[sp]; const hi = s.memory.bytes[toWord(sp + 1)];
    const iv = getIR(s, o2.value);
    s.memory.bytes[sp] = iv & 0xFF; s.memory.bytes[toWord(sp + 1)] = (iv >> 8) & 0xFF;
    setIR(s, o2.value, (hi << 8) | lo);
    return ok(s, `EX (SP), ${o2.value}`);
  }
  return fail(s, 'EX: invalid operands');
}

function executeExx(s: CPUState): ExecutionResult {
  const r = s.registers.registers8; const alt = s.registers.alternate;
  const swaps: Register8Bit[] = ['B', 'C', 'D', 'E', 'H', 'L'];
  for (const reg of swaps) { const t = r[reg]; r[reg] = alt[reg]; alt[reg] = t; }
  return ok(s, 'EXX');
}
// ─── Block Transfer ─────────────────────────────────────────────────
function executeLdi(s: CPUState): ExecutionResult {
  const hl = getPair(s, 'HL'); const de = getPair(s, 'DE'); const bc = getPair(s, 'BC');
  s.memory.bytes[de] = s.memory.bytes[hl];
  setPair(s, 'HL', hl + 1); setPair(s, 'DE', de + 1); setPair(s, 'BC', bc - 1);
  s.registers.flags.H = false; s.registers.flags.N = false; s.registers.flags.P = (bc - 1) !== 0;
  return ok(s, `LDI: (${hex16(de)})←(${hex16(hl)}), BC=${hex16(bc - 1)}`);
}
function executeLdir(s: CPUState): ExecutionResult {
  let bc = getPair(s, 'BC');
  do {
    const hl = getPair(s, 'HL'); const de = getPair(s, 'DE');
    s.memory.bytes[de] = s.memory.bytes[hl];
    setPair(s, 'HL', hl + 1); setPair(s, 'DE', de + 1); bc--; setPair(s, 'BC', bc);
  } while (bc !== 0);
  s.registers.flags.H = false; s.registers.flags.N = false; s.registers.flags.P = false;
  return ok(s, `LDIR: block copy complete`);
}
function executeLdd(s: CPUState): ExecutionResult {
  const hl = getPair(s, 'HL'); const de = getPair(s, 'DE'); const bc = getPair(s, 'BC');
  s.memory.bytes[de] = s.memory.bytes[hl];
  setPair(s, 'HL', hl - 1); setPair(s, 'DE', de - 1); setPair(s, 'BC', bc - 1);
  s.registers.flags.H = false; s.registers.flags.N = false; s.registers.flags.P = (bc - 1) !== 0;
  return ok(s, `LDD`);
}
function executeLddr(s: CPUState): ExecutionResult {
  let bc = getPair(s, 'BC');
  do {
    const hl = getPair(s, 'HL'); const de = getPair(s, 'DE');
    s.memory.bytes[de] = s.memory.bytes[hl];
    setPair(s, 'HL', hl - 1); setPair(s, 'DE', de - 1); bc--; setPair(s, 'BC', bc);
  } while (bc !== 0);
  s.registers.flags.H = false; s.registers.flags.N = false; s.registers.flags.P = false;
  return ok(s, `LDDR: block copy complete`);
}

// ─── Block Search ───────────────────────────────────────────────────
function executeCpi(s: CPUState): ExecutionResult {
  const a = getR8(s, 'A'); const hl = getPair(s, 'HL'); const bc = getPair(s, 'BC');
  const m = s.memory.bytes[hl]; const r = (a - m) & 0xFF;
  setPair(s, 'HL', hl + 1); setPair(s, 'BC', bc - 1);
  s.registers.flags.S = (r & 0x80) !== 0; s.registers.flags.Z = r === 0;
  s.registers.flags.H = (a & 0x0F) < (m & 0x0F); s.registers.flags.N = true; s.registers.flags.P = (bc - 1) !== 0;
  return ok(s, `CPI: A-[HL]=${hex8(r)}, Z=${r === 0 ? 1 : 0}`);
}
function executeCpir(s: CPUState): ExecutionResult {
  const a = getR8(s, 'A'); let bc = getPair(s, 'BC'); let found = false;
  do {
    const hl = getPair(s, 'HL'); const m = s.memory.bytes[hl];
    setPair(s, 'HL', hl + 1); bc--; setPair(s, 'BC', bc);
    if (a === m) { found = true; break; }
  } while (bc !== 0);
  const r = found ? 0 : 1;
  s.registers.flags.Z = found; s.registers.flags.N = true; s.registers.flags.P = bc !== 0;
  return ok(s, `CPIR: ${found ? 'found' : 'not found'}, BC=${hex16(bc)}`);
}
function executeCpd(s: CPUState): ExecutionResult {
  const a = getR8(s, 'A'); const hl = getPair(s, 'HL'); const bc = getPair(s, 'BC');
  const m = s.memory.bytes[hl]; const r = (a - m) & 0xFF;
  setPair(s, 'HL', hl - 1); setPair(s, 'BC', bc - 1);
  s.registers.flags.S = (r & 0x80) !== 0; s.registers.flags.Z = r === 0;
  s.registers.flags.H = (a & 0x0F) < (m & 0x0F); s.registers.flags.N = true; s.registers.flags.P = (bc - 1) !== 0;
  return ok(s, `CPD`);
}
function executeCpdr(s: CPUState): ExecutionResult {
  const a = getR8(s, 'A'); let bc = getPair(s, 'BC'); let found = false;
  do {
    const hl = getPair(s, 'HL'); const m = s.memory.bytes[hl];
    setPair(s, 'HL', hl - 1); bc--; setPair(s, 'BC', bc);
    if (a === m) { found = true; break; }
  } while (bc !== 0);
  s.registers.flags.Z = found; s.registers.flags.N = true; s.registers.flags.P = bc !== 0;
  return ok(s, `CPDR: ${found ? 'found' : 'not found'}`);
}

// ─── I/O ────────────────────────────────────────────────────────────
function executeIn(s: CPUState, inst: Instruction): ExecutionResult {
  const { operand1: o1, operand2: o2 } = inst;
  if (o1?.type === 'register8' && o2?.type === 'indirectAddress') {
    const port = o2.value & 0xFF; const v = s.ioPorts[port]; setR8(s, o1.value, v);
    return ok(s, `IN ${o1.value}, (${hex8(port)}) = ${hex8(v)}`);
  }
  if (o1?.type === 'register8' && o2?.type === 'portRegister') {
    const port = getR8(s, 'C'); const v = s.ioPorts[port]; setR8(s, o1.value, v);
    return ok(s, `IN ${o1.value}, (C) = ${hex8(v)}`);
  }
  return fail(s, 'IN: unsupported');
}
function executeOut(s: CPUState, inst: Instruction): ExecutionResult {
  const { operand1: o1, operand2: o2 } = inst;
  if (o1?.type === 'indirectAddress' && o2?.type === 'register8') {
    const port = o1.value & 0xFF; const v = getR8(s, o2.value); s.ioPorts[port] = v;
    return ok(s, `OUT (${hex8(port)}), ${o2.value} = ${hex8(v)}`);
  }
  if (o1?.type === 'portRegister' && o2?.type === 'register8') {
    const port = getR8(s, 'C'); const v = getR8(s, o2.value); s.ioPorts[port] = v;
    return ok(s, `OUT (C), ${o2.value} = ${hex8(v)}`);
  }
  return fail(s, 'OUT: unsupported');
}
function executeIni(s: CPUState): ExecutionResult {
  const hl = getPair(s, 'HL'); const b = getR8(s, 'B'); const c = getR8(s, 'C');
  s.memory.bytes[hl] = s.ioPorts[c]; setPair(s, 'HL', hl + 1);
  setR8(s, 'B', toByte(b - 1)); s.registers.flags.Z = toByte(b - 1) === 0; s.registers.flags.N = true;
  return ok(s, `INI`);
}
function executeInir(s: CPUState): ExecutionResult {
  do { executeIni(s); } while (getR8(s, 'B') !== 0);
  return ok(s, `INIR: complete`);
}
function executeInd(s: CPUState): ExecutionResult {
  const hl = getPair(s, 'HL'); const b = getR8(s, 'B'); const c = getR8(s, 'C');
  s.memory.bytes[hl] = s.ioPorts[c]; setPair(s, 'HL', hl - 1);
  setR8(s, 'B', toByte(b - 1)); s.registers.flags.Z = toByte(b - 1) === 0; s.registers.flags.N = true;
  return ok(s, `IND`);
}
function executeIndr(s: CPUState): ExecutionResult {
  do { executeInd(s); } while (getR8(s, 'B') !== 0);
  return ok(s, `INDR: complete`);
}
function executeOuti(s: CPUState): ExecutionResult {
  const hl = getPair(s, 'HL'); const b = getR8(s, 'B'); const c = getR8(s, 'C');
  s.ioPorts[c] = s.memory.bytes[hl]; setPair(s, 'HL', hl + 1);
  setR8(s, 'B', toByte(b - 1)); s.registers.flags.Z = toByte(b - 1) === 0; s.registers.flags.N = true;
  return ok(s, `OUTI`);
}
function executeOtir(s: CPUState): ExecutionResult {
  do { executeOuti(s); } while (getR8(s, 'B') !== 0);
  return ok(s, `OTIR: complete`);
}
function executeOutd(s: CPUState): ExecutionResult {
  const hl = getPair(s, 'HL'); const b = getR8(s, 'B'); const c = getR8(s, 'C');
  s.ioPorts[c] = s.memory.bytes[hl]; setPair(s, 'HL', hl - 1);
  setR8(s, 'B', toByte(b - 1)); s.registers.flags.Z = toByte(b - 1) === 0; s.registers.flags.N = true;
  return ok(s, `OUTD`);
}
function executeOtdr(s: CPUState): ExecutionResult {
  do { executeOutd(s); } while (getR8(s, 'B') !== 0);
  return ok(s, `OTDR: complete`);
}
// ─── Jump / Call / Ret / Stack / Interrupt ───────────────────────────

function resolveJumpTarget(inst: Instruction): number | null {
  const o = inst.operand1;
  if (!o) return null;
  if (o.type === 'address' || o.type === 'immediate8' || o.type === 'immediate16') return o.value;
  return null;
}

function executeJp(s: CPUState, inst: Instruction, cond?: ConditionCode): ExecutionResult {
  // JP (HL)
  if (!cond && inst.operand1?.type === 'indirect' && inst.operand1.value === 'HL') {
    const addr = getPair(s, 'HL'); s.registers.registers16.PC = addr;
    return ok(s, `JP (HL) → ${hex16(addr)}`);
  }
  // JP (IX) / JP (IY)
  if (!cond && inst.operand1?.type === 'indexRegister') {
    const addr = getIR(s, inst.operand1.value); s.registers.registers16.PC = addr;
    return ok(s, `JP (${inst.operand1.value}) → ${hex16(addr)}`);
  }
  const target = resolveJumpTarget(inst);
  if (target === null) return fail(s, 'JP: invalid target');
  if (cond && !evaluateCondition(cond, s.registers.flags)) {
    return ok(s, `JP ${cond}, ${hex16(target)}: not taken`);
  }
  s.registers.registers16.PC = target;
  return ok(s, `JP ${cond ? cond + ', ' : ''}${hex16(target)}`);
}

function executeJr(s: CPUState, inst: Instruction, cond?: ConditionCode): ExecutionResult {
  const target = resolveJumpTarget(inst);
  if (target === null) return fail(s, 'JR: invalid target');
  if (cond && !evaluateCondition(cond, s.registers.flags)) {
    return ok(s, `JR ${cond}, ${target}: not taken`);
  }
  s.registers.registers16.PC = target;
  return ok(s, `JR ${cond ? cond + ', ' : ''}${target}`);
}

function executeDjnz(s: CPUState, inst: Instruction): ExecutionResult {
  const target = resolveJumpTarget(inst);
  if (target === null) return fail(s, 'DJNZ: invalid target');
  const b = toByte(getR8(s, 'B') - 1); setR8(s, 'B', b);
  if (b !== 0) { s.registers.registers16.PC = target; return ok(s, `DJNZ ${target}: B=${hex8(b)}, taken`); }
  return ok(s, `DJNZ ${target}: B=0, not taken`);
}

function executeCall(s: CPUState, inst: Instruction, cond?: ConditionCode): ExecutionResult {
  const target = resolveJumpTarget(inst);
  if (target === null) return fail(s, 'CALL: invalid target');
  if (cond && !evaluateCondition(cond, s.registers.flags)) {
    return ok(s, `CALL ${cond}, ${hex16(target)}: not taken`);
  }
  stackPush16(s, toWord(s.registers.registers16.PC + 1));
  s.registers.registers16.PC = target;
  return ok(s, `CALL ${cond ? cond + ', ' : ''}${hex16(target)}`);
}

function executeRet(s: CPUState, cond?: ConditionCode): ExecutionResult {
  if (cond && !evaluateCondition(cond, s.registers.flags)) {
    return ok(s, `RET ${cond}: not taken`);
  }
  const addr = stackPop16(s); s.registers.registers16.PC = addr;
  return ok(s, `RET${cond ? ' ' + cond : ''} → ${hex16(addr)}`);
}

function executeRst(s: CPUState, inst: Instruction): ExecutionResult {
  if (!inst.operand1) return fail(s, 'RST requires operand');
  const target = inst.operand1.type === 'immediate8' ? inst.operand1.value : 0;
  stackPush16(s, toWord(s.registers.registers16.PC + 1));
  s.registers.registers16.PC = target;
  return ok(s, `RST ${hex8(target)}`);
}

function executePush(s: CPUState, inst: Instruction): ExecutionResult {
  if (!inst.operand1) return fail(s, 'PUSH requires operand');
  const o = inst.operand1;
  if (o.type === 'registerPair') { stackPush16(s, getPair(s, o.value)); return ok(s, `PUSH ${o.value}`); }
  if (o.type === 'indexRegister') { stackPush16(s, getIR(s, o.value)); return ok(s, `PUSH ${o.value}`); }
  return fail(s, 'PUSH: invalid operand');
}

function executePop(s: CPUState, inst: Instruction): ExecutionResult {
  if (!inst.operand1) return fail(s, 'POP requires operand');
  const o = inst.operand1;
  if (o.type === 'registerPair') { setPair(s, o.value, stackPop16(s)); return ok(s, `POP ${o.value}`); }
  if (o.type === 'indexRegister') { setIR(s, o.value, stackPop16(s)); return ok(s, `POP ${o.value}`); }
  return fail(s, 'POP: invalid operand');
}

// ─── Interrupt Control ──────────────────────────────────────────────
function executeDi(s: CPUState): ExecutionResult {
  s.registers.interrupt.IFF1 = false; s.registers.interrupt.IFF2 = false;
  return ok(s, 'DI');
}
function executeEi(s: CPUState): ExecutionResult {
  s.registers.interrupt.IFF1 = true; s.registers.interrupt.IFF2 = true;
  return ok(s, 'EI');
}
function executeIm(s: CPUState, inst: Instruction): ExecutionResult {
  if (!inst.operand1 || inst.operand1.type !== 'immediate8') return fail(s, 'IM requires 0, 1, or 2');
  const mode = inst.operand1.value;
  if (mode !== 0 && mode !== 1 && mode !== 2) return fail(s, `IM: invalid mode ${mode}`);
  s.registers.interrupt.IM = mode as 0 | 1 | 2;
  return ok(s, `IM ${mode}`);
}
function executeReti(s: CPUState): ExecutionResult {
  const addr = stackPop16(s); s.registers.registers16.PC = addr;
  return ok(s, `RETI → ${hex16(addr)}`);
}
function executeRetn(s: CPUState): ExecutionResult {
  const addr = stackPop16(s); s.registers.registers16.PC = addr;
  s.registers.interrupt.IFF1 = s.registers.interrupt.IFF2;
  return ok(s, `RETN → ${hex16(addr)}`);
}
// ═══════════════════════════════════════════════════════════════════════
// ─── Main dispatcher ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export function executeInstruction(state: CPUState, instruction: Instruction): ExecutionResult {
  // Deep clone to avoid mutation of original state
  const s: CPUState = JSON.parse(JSON.stringify(state));
  // Restore typed array
  s.memory.bytes = new Uint8Array(state.memory.bytes);
  s.ioPorts = new Uint8Array(state.ioPorts);

  // Check if halted
  if (s.halted) return fail(s, 'CPU is halted');

  let result: ExecutionResult;

  switch (instruction.mnemonic) {
    // ── Data Transfer ──
    case 'LD': result = executeLd(s, instruction); break;

    // ── Arithmetic ──
    case 'ADD': result = executeAdd(s, instruction); break;
    case 'ADC': result = executeAdc(s, instruction); break;
    case 'SUB': result = executeSub(s, instruction); break;
    case 'SBC': result = executeSbc(s, instruction); break;
    case 'CP':  result = executeCp(s, instruction); break;
    case 'INC': result = executeInc(s, instruction); break;
    case 'DEC': result = executeDec(s, instruction); break;

    // ── Logic ──
    case 'AND': result = executeAnd(s, instruction); break;
    case 'OR':  result = executeOr(s, instruction); break;
    case 'XOR': result = executeXor(s, instruction); break;
    case 'CPL': result = executeCpl(s); break;
    case 'NEG': result = executeNeg(s); break;
    case 'SCF': result = executeScf(s); break;
    case 'CCF': result = executeCcf(s); break;
    case 'DAA': result = executeDaa(s); break;

    // ── Rotate & Shift ──
    case 'RL':   result = execRotateShift(s, instruction, aluRl,  'RL'); break;
    case 'RR':   result = execRotateShift(s, instruction, aluRr,  'RR'); break;
    case 'RLC':  result = execRotateShift(s, instruction, aluRlc, 'RLC'); break;
    case 'RRC':  result = execRotateShift(s, instruction, aluRrc, 'RRC'); break;
    case 'SLA':  result = execRotateShift(s, instruction, aluSla, 'SLA'); break;
    case 'SRA':  result = execRotateShift(s, instruction, aluSra, 'SRA'); break;
    case 'SRL':  result = execRotateShift(s, instruction, aluSrl, 'SRL'); break;
    case 'RLCA': result = executeRlca(s); break;
    case 'RLA':  result = executeRla(s); break;
    case 'RRCA': result = executeRrca(s); break;
    case 'RRA':  result = executeRra(s); break;
    case 'RLD':  result = executeRld(s); break;
    case 'RRD':  result = executeRrd(s); break;

    // ── Bit Manipulation ──
    case 'BIT': result = executeBit(s, instruction); break;
    case 'SET': result = executeSet(s, instruction); break;
    case 'RES': result = executeRes(s, instruction); break;

    // ── Exchange ──
    case 'EX':  result = executeEx(s, instruction); break;
    case 'EXX': result = executeExx(s); break;

    // ── Block Transfer ──
    case 'LDI':  result = executeLdi(s); break;
    case 'LDIR': result = executeLdir(s); break;
    case 'LDD':  result = executeLdd(s); break;
    case 'LDDR': result = executeLddr(s); break;

    // ── Block Search ──
    case 'CPI':  result = executeCpi(s); break;
    case 'CPIR': result = executeCpir(s); break;
    case 'CPD':  result = executeCpd(s); break;
    case 'CPDR': result = executeCpdr(s); break;

    // ── Jump ──
    case 'JP':   result = executeJp(s, instruction); break;
    case 'JPNZ': result = executeJp(s, instruction, 'NZ'); break;
    case 'JPZ':  result = executeJp(s, instruction, 'Z'); break;
    case 'JPC':  result = executeJp(s, instruction, 'C'); break;
    case 'JPNC': result = executeJp(s, instruction, 'NC'); break;
    case 'JPP':  result = executeJp(s, instruction, 'P'); break;
    case 'JPM':  result = executeJp(s, instruction, 'M'); break;
    case 'JPPE': result = executeJp(s, instruction, 'PE'); break;
    case 'JPPO': result = executeJp(s, instruction, 'PO'); break;

    // ── Relative Jump ──
    case 'JR':   result = executeJr(s, instruction); break;
    case 'JRNZ': result = executeJr(s, instruction, 'NZ'); break;
    case 'JRZ':  result = executeJr(s, instruction, 'Z'); break;
    case 'JRC':  result = executeJr(s, instruction, 'C'); break;
    case 'JRNC': result = executeJr(s, instruction, 'NC'); break;
    case 'DJNZ': result = executeDjnz(s, instruction); break;

    // ── Call ──
    case 'CALL':   result = executeCall(s, instruction); break;
    case 'CALLNZ': result = executeCall(s, instruction, 'NZ'); break;
    case 'CALLZ':  result = executeCall(s, instruction, 'Z'); break;
    case 'CALLC':  result = executeCall(s, instruction, 'C'); break;
    case 'CALLNC': result = executeCall(s, instruction, 'NC'); break;
    case 'CALLP':  result = executeCall(s, instruction, 'P'); break;
    case 'CALLM':  result = executeCall(s, instruction, 'M'); break;
    case 'CALLPE': result = executeCall(s, instruction, 'PE'); break;
    case 'CALLPO': result = executeCall(s, instruction, 'PO'); break;

    // ── Return ──
    case 'RET':   result = executeRet(s); break;
    case 'RETNZ': result = executeRet(s, 'NZ'); break;
    case 'RETZ':  result = executeRet(s, 'Z'); break;
    case 'RETC':  result = executeRet(s, 'C'); break;
    case 'RETNC': result = executeRet(s, 'NC'); break;
    case 'RETP':  result = executeRet(s, 'P'); break;
    case 'RETM':  result = executeRet(s, 'M'); break;
    case 'RETPE': result = executeRet(s, 'PE'); break;
    case 'RETPO': result = executeRet(s, 'PO'); break;
    case 'RETI':  result = executeReti(s); break;
    case 'RETN':  result = executeRetn(s); break;

    // ── RST ──
    case 'RST': result = executeRst(s, instruction); break;

    // ── Stack ──
    case 'PUSH': result = executePush(s, instruction); break;
    case 'POP':  result = executePop(s, instruction); break;

    // ── I/O ──
    case 'IN':   result = executeIn(s, instruction); break;
    case 'OUT':  result = executeOut(s, instruction); break;
    case 'INI':  result = executeIni(s); break;
    case 'INIR': result = executeInir(s); break;
    case 'IND':  result = executeInd(s); break;
    case 'INDR': result = executeIndr(s); break;
    case 'OUTI': result = executeOuti(s); break;
    case 'OTIR': result = executeOtir(s); break;
    case 'OUTD': result = executeOutd(s); break;
    case 'OTDR': result = executeOtdr(s); break;

    // ── Interrupt ──
    case 'DI': result = executeDi(s); break;
    case 'EI': result = executeEi(s); break;
    case 'IM': result = executeIm(s, instruction); break;

    // ── Control ──
    case 'NOP': result = ok(s, 'NOP'); break;
    case 'HALT':
      s.halted = true;
      result = ok(s, 'HALT');
      break;

    default:
      result = fail(s, `Unknown instruction: ${instruction.mnemonic}`);
  }

  // Update performance counters
  if (result.success) {
    result.updatedState.performance.instructionsExecuted++;
    result.updatedState.lastInstruction = { source: instruction.sourceCode, output: result.message || '' };
  }

  return result;
}
