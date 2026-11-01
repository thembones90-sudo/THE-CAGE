// Claude balance probe for regulation scoring (mode score). Usage: [GK=1] node tools/claude-balance-probe.cjs [N]. Read-only: runs play.html engine in a VM.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = process.env.CAGE_ROOT || path.join(__dirname, ".."), N = +(process.argv[2] || 400);
const html = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
const stop = scripts.indexOf('src/cage-commentary.js'), list = scripts.slice(0, stop).filter(s => !/identity\/search/.test(s));
const window = { location: { search: '' }, addEventListener() {}, localStorage: { getItem() { return null; }, setItem() {} } };
const ctx = vm.createContext({ window, console, Math, Object, Array, Error, TypeError, RangeError, JSON, Number, String, Set, Map, WeakMap, Symbol, Boolean, Uint32Array, Int32Array, Float64Array, Promise, document: undefined, navigator: {}, location: window.location, localStorage: window.localStorage });
ctx.globalThis = ctx; ctx.self = window;
for (const s of list) { try { vm.runInContext(fs.readFileSync(path.join(ROOT, s), 'utf8'), ctx, { filename: s }); } catch (e) { console.log('load fail', s, e.message.slice(0, 120)); } }
const E = window.CageEngine; console.log('engine', E.VERSION, 'roster', E.ROSTER.length, 'goalkeepers', process.env.GK ? 'ON (3+1, random distinct keepers)' : 'OFF');
const P = E.ROSTER, role = p => p.role;
const q = p => { const r = p.r; return (r.pace + r.tech + r.pass + r.finish + r.def + r.phys) / 6; };
let s = 12345; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const byRole = { D: P.filter(p => role(p) === 'D'), M: P.filter(p => role(p) === 'M'), F: P.filter(p => role(p) === 'F') };
console.log('roles', Object.fromEntries(Object.entries(byRole).map(([k, v]) => [k, v.length])));
function trio(comp, used) { const out = []; for (const c of comp) { let p; do p = byRole[c][Math.floor(R() * byRole[c].length)]; while (used.has(p.id) || out.includes(p)); out.push(p); } return out; }
function play(A, B, ta = 'balanced', tb = 'balanced', swap = false) {
  const cfg = { teams: swap ? [B, A] : [A, B], tactics: swap ? [tb, ta] : [ta, tb], seed: Math.floor(R() * 2 ** 32), mode: 'score' };
  if (process.env.GK) { const G = window.CageGoalkeepers.players; let i = Math.floor(R() * G.length), j; do j = Math.floor(R() * G.length); while (j === i); cfg.keepers = [G[i].id, G[j].id]; }
  let r; try { r = E.simulate(cfg); } catch (e) { return { err: e.message }; }
  const w = r.winner; return { aWin: w < 0 ? null : (swap ? w === 1 : w === 0), r };
}
const comps = ['DMF', 'FFF', 'DDD', 'MMM', 'DDF', 'MMF'];
const res = {}; let errs = 0, durs = [], goals = [], golden = 0, games = 0;
for (const a of comps) for (const b of comps) {
  if (a >= b) continue; let w = 0, g = 0;
  for (let k = 0; k < N; k++) {
    // equal quality: resample until mean quality within 1.5
    let A, B, tries = 0; do { const used = new Set(); A = trio(a, used); A.forEach(p => used.add(p.id)); B = trio(b, used); tries++; } while (Math.abs(A.reduce((x, p) => x + q(p), 0) - B.reduce((x, p) => x + q(p), 0)) / 3 > 1.5 && tries < 200);
    const o = play(A.map(p => p.id), B.map(p => p.id), 'balanced', 'balanced', k % 2 === 1);
    if (o.err) { errs++; continue; } games++; durs.push(o.r.duration); goals.push((o.r.score || [0, 0]).reduce((x, y) => x + y, 0)); if (o.r.decidedBy === 'golden_goal' || o.r.events.some(e => e.type === 'golden_goal_start')) golden++;
    if (o.aWin === null) continue; w += o.aWin; g++;
  }
  res[a + 'v' + b] = (100 * w / g).toFixed(1);
}
console.log('equal-quality head-to-head (row comp win %, balanced v balanced, N=' + N + '):');
console.log(JSON.stringify(res));
const overall = {}; for (const c of comps) { const v = []; for (const [k, x] of Object.entries(res)) { const [a, b] = k.split('v'); if (a === c) v.push(+x); if (b === c) v.push(100 - x); } overall[c] = (v.reduce((x, y) => x + y, 0) / v.length).toFixed(1); }
console.log('overall', JSON.stringify(overall));
durs.sort((a, b) => a - b); goals.sort((a, b) => a - b);
console.log(`games ${games} errors ${errs}; duration median ${durs[durs.length >> 1]}s p99 ${durs[Math.floor(durs.length * .99)]}s; goals/match median ${goals[goals.length >> 1]} mean ${(goals.reduce((x, y) => x + y, 0) / goals.length).toFixed(2)}; golden-goal deciders ${(100 * golden / games).toFixed(1)}%`);
// quality gradient
const bins = [[-99, -8], [-8, -4], [-4, -1.5], [-1.5, 1.5], [1.5, 4], [4, 8], [8, 99]], bw = bins.map(() => [0, 0]);
for (let k = 0; k < N * 15; k++) { const t = new Set(); while (t.size < 6) t.add(P[Math.floor(R() * P.length)]); const v = [...t], A = v.slice(0, 3), B = v.slice(3), gap = (A.reduce((x, p) => x + q(p), 0) - B.reduce((x, p) => x + q(p), 0)) / 3; const o = play(A.map(p => p.id), B.map(p => p.id), 'balanced', 'balanced', k % 2 === 1); if (o.err || o.aWin === null) continue; const bi = bins.findIndex(([lo, hi]) => gap >= lo && gap < hi); bw[bi][0] += o.aWin; bw[bi][1]++; }
console.log('quality gradient (A-B mean quality gap bins):', bins.map(([lo, hi], i) => `${lo}..${hi}: ${bw[i][1] ? (100 * bw[i][0] / bw[i][1]).toFixed(1) : '-'}% (n${bw[i][1]})`).join(' | '));
// tactics for DDD and MMM vs random balanced
for (const c of ['DDD', 'MMM', 'FFF']) { const row = {}; for (const t of ['balanced', 'press', 'possession', 'counter']) { let w = 0, g = 0; for (let k = 0; k < N; k++) { const used = new Set(); const A = trio(c, used); A.forEach(p => used.add(p.id)); const pool = P.filter(p => !used.has(p.id)); const B = []; while (B.length < 3) { const p = pool[Math.floor(R() * pool.length)]; if (!B.includes(p)) B.push(p); } const o = play(A.map(p => p.id), B.map(p => p.id), t, 'balanced', k % 2 === 1); if (o.err || o.aWin === null) continue; w += o.aWin; g++; } row[t] = (100 * w / g).toFixed(1); } console.log(c, 'tactic vs random balanced', JSON.stringify(row)); }
