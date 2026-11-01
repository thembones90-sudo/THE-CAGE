'use strict';
// Owner decision: saves store only the match setup and seed, never the match. Rounds are recreated exactly on load.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const scripts = [...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m => m[1]);
const c = { window: { location: { search: '' } } }; vm.createContext(c);
for (const f of scripts) { vm.runInContext(read(f), c, { filename: f }); if (f === 'src/replay/records.js') break; }
const W = c.window, E = W.CageEngine, R = W.CageRecords, G = W.CageGoalkeepers.players, ids = E.ROSTER.map(p => p.id);
let fullBytes = 0, savedBytes = 0;
for (let k = 0; k < 6; k++) {
  const t = []; for (let m = 0; t.length < 6; m++) { const id = ids[(k * 29 + m * 41) % ids.length]; if (!t.includes(id)) t.push(id); }
  const cfg = { teams: [t.slice(0, 3), t.slice(3)], tactics: ['balanced', 'press'], keepers: [G[k].id, G[k + 10].id], seed: 9000 + k, mode: 'score', traits: { enabled: true }, rules: { pressure: 'defender-quality-v1' } };
  const rec = R.make(cfg, E.simulate(cfg), 1), saved = R.compact(rec), json = JSON.stringify(saved);
  assert(!('result' in saved), 'no match data is stored'); assert(saved.compact.eventHash && saved.config.seed === cfg.seed);
  fullBytes += JSON.stringify(rec).length; savedBytes += json.length;
  assert(json.length < 3000, 'a saved round is small: ' + json.length + ' bytes');
  const back = R.expand(JSON.parse(json));
  assert.equal(JSON.stringify(back), JSON.stringify(rec), 'the round is recreated exactly (events, movement, everything)');
  assert.equal(R.expand(rec), rec, 'a full (older) record passes through unchanged');
  const tampered = JSON.parse(json); tampered.config.seed++; assert.throws(() => R.expand(tampered), /could not be recreated/, 'a tampered save is refused');
}
console.log(`COMPACT_SAVES_PASS 6 rounds: saved ${(savedBytes / 6).toFixed(0)} bytes/round instead of ${(fullBytes / 6 / 1024).toFixed(0)} KB; exact recreation; older full saves still load; tampering refused`);
