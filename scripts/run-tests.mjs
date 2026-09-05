/**
 * Menjalankan uji regresi inti Z-80.
 *
 * Logika inti (domain/usecases) sengaja bebas framework, jadi bisa diuji di
 * Node tanpa browser maupun test runner. Skrip ini membundel suite dengan
 * esbuild — yang memang sudah dipakai Vite — lalu menjalankannya.
 */

import { build } from 'esbuild';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const outDir = await mkdtemp(join(tmpdir(), 'z80-tests-'));
const outFile = join(outDir, 'suite.cjs');

try {
  await build({
    entryPoints: ['src/z80/test.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: outFile,
    logLevel: 'error',
  });

  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [outFile], { stdio: 'inherit' });
    child.on('close', resolve);
    child.on('error', reject);
  });

  process.exitCode = exitCode ?? 1;
} finally {
  await rm(outDir, { recursive: true, force: true });
}
