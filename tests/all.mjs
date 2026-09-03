/**
 * Runs every browser verification suite in sequence against the dev server.
 * Usage:  npm run dev   (in one terminal)
 *         npm run verify
 */
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';

const files = readdirSync(new URL('.', import.meta.url))
  .filter((f) => f.startsWith('flow-') || f === 'responsive.mjs')
  .sort();

let failed = 0;
for (const file of files) {
  console.log(`\n${'═'.repeat(64)}\n  ${file}\n${'═'.repeat(64)}`);
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, [new URL(file, import.meta.url).pathname], { stdio: 'inherit' });
    p.on('exit', resolve);
  });
  if (code !== 0) failed += 1;
}
console.log(`\n${failed === 0 ? 'ALL VERIFICATION SUITES COMPLETED' : `${failed} SUITE(S) EXITED NON-ZERO`}`);
