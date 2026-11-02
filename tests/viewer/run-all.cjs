// Runs every viewer test in its own Node process. Usage: node tests/viewer/run-all.cjs
'use strict';
const { spawnSync } = require('node:child_process'), path = require('node:path');
const files = ['static.test.cjs', 'timeline.test.cjs', 'clock.test.cjs', 'contract.test.cjs', 'gk-motion.test.cjs', 'recorded-motion.test.cjs', 'key-moments.test.cjs'];
let failed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { stdio: 'inherit' });
  if (r.status !== 0) { failed++; console.error('FAILED: ' + f); }
}
console.log(failed ? failed + ' viewer test file(s) failed' : 'All viewer tests passed');
process.exit(failed ? 1 : 0);
