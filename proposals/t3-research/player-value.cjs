// Player value probe: random 3v3 trios from the pinned roster, balanced tactics; per-player win rate when fielded (random partners and opponents).
//   node proposals/t3-research/player-value.cjs <FLAGS|none> <N> <out.json>
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..'), [flags = 'none', N = '30000', out] = process.argv.slice(2);
const eng = cp.execFileSync(process.execPath, [path.join(ROOT, 'tools', 'claude-t3-research.cjs'), '--build', flags]).toString().trim();
const window = {}, ctx = vm.createContext({ window, console, Math, Object, Array, Error, TypeError, RangeError, JSON, Number, String, Set, Map, WeakMap, Symbol, Boolean });
for (const f of [path.join(ROOT, 'src', 'players.js'), path.join(__dirname, 'roster-expansion-63.js'), eng]) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
const E = window.CageEngine, ids = E.ROSTER.map(p => p.id);
let s = 0x9e3779b9; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const V = Object.fromEntries(ids.map(i => [i, { n: 0, w: 0 }])); let caps = 0, durs = [];
for (let k = 0; k < +N; k++) {
  const t = new Set(); while (t.size < 6) t.add(ids[Math.floor(rnd() * ids.length)]); const v = [...t], A = v.slice(0, 3), B = v.slice(3);
  let r; try { r = E.simulate({ teams: [A, B], tactics: ['balanced', 'balanced'], seed: Math.floor(rnd() * 2 ** 32), mode: 'ko' }); } catch (e) { caps++; continue; }
  durs.push(r.duration); if (r.winner < 0) continue;
  for (const [team, ps] of [[0, A], [1, B]]) for (const p of ps) { V[p].n++; if (r.winner === team) V[p].w++; }
}
durs.sort((a, b) => a - b);
const res = { engine: E.VERSION, flags, N: +N, caps, medianDuration: durs[durs.length >> 1], players: Object.fromEntries(ids.map(i => [i, { rate: V[i].w / V[i].n, n: V[i].n }])) };
fs.writeFileSync(out, JSON.stringify(res, null, 1)); console.log('done', flags, out, 'caps', caps);
