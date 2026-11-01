'use strict';
// Owner decision 3: keeper classes change DECISIONS, attributes determine EXECUTION. Verifies that
// (1) no class carries a hidden probability bonus, (2) class-specific decisions are actually taken at
// rates that follow the style, (3) success when acting follows attributes, (4) historical rules are untouched.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const scripts = [...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m => m[1]);
const c = { window: { location: { search: '' } } }; vm.createContext(c);
for (const f of scripts) { vm.runInContext(read(f), c, { filename: f }); if (f === 'src/replay/records.js') break; }
const W = c.window, E = W.CageEngine, V2 = W.CageGoalkeeperRulesV2, V1 = W.CageGoalkeeperRules, G = W.CageGoalkeepers.players;
assert(V2 && V1 && V2 !== V1, 'T3-13 uses a separate keeper rules module');
const CLASSES = Object.keys(V2.STYLE);
// (1) No hidden class bonus: every execution value is identical whatever the class.
for (const g of G) for (const other of CLASSES) {
  const h = { ...g, keeperClass: other };
  for (const ctx of ['box', 'edge', 'fk']) assert.equal(V2.score(h, ctx), V2.score(g, ctx), 'shot-stopping must not depend on class');
  for (const mode of ['rush', 'stay']) assert.equal(V2.score(h, 'one_v_one', mode), V2.score(g, 'one_v_one', mode), 'one-on-one execution must not depend on class');
  assert.equal(V2.sweep(h, 3, .5).p, V2.sweep(g, 3, .5).p, 'sweep success must not depend on class');
  assert.equal(V2.distribute(h, .4, .5).p, V2.distribute(g, .4, .5).p, 'distribution success must not depend on class');
  assert.equal(V2.claim(h, 80).p, V2.claim(g, 80).p, 'claim success must not depend on class');
}
// The historical module keeps its original class effects (replay compatibility).
const rm = G.find(g => g.keeperClass === 'REFLEX MONSTER');
assert.notEqual(V1.score(rm, 'box'), V1.score({ ...rm, keeperClass: 'NONE' }, 'box'), 'historical rules unchanged');
// (2)+(3) Decisions in real matches.
const ids = E.ROSTER.map(p => p.id), byClass = {};
for (const g of G) (byClass[g.keeperClass] = byClass[g.keeperClass] || []).push(g);
const S = Object.fromEntries(CLASSES.map(k => [k, { sweepOpp: 0, sweepCome: 0, rushOpp: 0, rush: 0, claimOpp: 0, claimCome: 0 }]));
const sweepByKeeper = {};
for (let k = 0; k < 600; k++) {
  const cls = CLASSES[k % CLASSES.length], pool = byClass[cls], g = pool[(k >> 3) % pool.length];
  const other = G[(k * 17 + 5) % G.length].id === g.id ? G[(k * 17 + 6) % G.length] : G[(k * 17 + 5) % G.length];
  const t = []; for (let m = 0; t.length < 6; m++) { const id = ids[(k * 41 + m * 23) % ids.length]; if (!t.includes(id)) t.push(id); }
  const cfg = { teams: [t.slice(0, 3), t.slice(3)], tactics: ['balanced', ['press', 'counter', 'balanced', 'possession'][k % 4]], keepers: [other.id, g.id], seed: (k * 2654435761 + 7) >>> 0, mode: 'score', traits: { enabled: true } };
  const r = E.simulate(cfg); // the studied keeper defends against team 0
  for (let i = 0; i < r.events.length; i++) {
    const e = r.events[i];
    if (e.team !== 0) continue;
    if ((e.type === 'through_ball') && e.outcome === 'complete' && e.to && e.to.x >= 2) { S[cls].sweepOpp++; const nx = r.events.slice(i + 1, i + 3).find(x => x.type === 'gk_sweep'); if (nx) { S[cls].sweepCome++; (sweepByKeeper[g.id] = sweepByKeeper[g.id] || [0, 0])[0]++; if (nx.outcome === 'cleared') sweepByKeeper[g.id][1]++; } }
    if (['goal', 'gk_save', 'gk_parry', 'shot_miss'].includes(e.type) && e.kind === 'one_v_one') { const mode = e.calc?.keeperMode; assert(mode === 'rush' || mode === 'stay', 'one-on-one keeper decision logged'); S[cls].rushOpp++; if (mode === 'rush') S[cls].rush++; }
    if ((e.type === 'gk_claim') || (e.type === 'rebound' && e.zone === undefined && r.events[i - 1] && ['block', 'gk_parry', 'shot_miss'].includes(r.events[i - 1].type))) { /* counted below */ }
  }
  // claim opportunities: loose balls from team 0's box shots (blocked or parried), i.e. in the studied keeper's box
  let lastShot = null;
  for (let i = 1; i < r.events.length; i++) { const e = r.events[i], prev = r.events[i - 1];
    if (e.type === 'shot_attempt') lastShot = e;
    if (lastShot && lastShot.team === 0 && lastShot.zone?.x === 3 && ['block', 'gk_parry'].includes(prev.type) && (e.type === 'gk_claim' || e.type === 'rebound')) {
      S[cls].claimOpp++; if (e.type === 'gk_claim') { S[cls].claimCome++; assert.equal(e.calc.decision, 'come'); assert.equal(e.gk, g.id); } } }
}
const rate = (a, b) => b ? a / b : NaN, rows = {};
for (const k of CLASSES) { const s = S[k], st = V2.STYLE[k]; rows[k] = { sweep: +rate(s.sweepCome, s.sweepOpp).toFixed(3), sweepStyle: st.sweep, rush: +rate(s.rush, s.rushOpp).toFixed(3), rushStyle: st.rush, claim: +rate(s.claimCome, s.claimOpp).toFixed(3), claimStyle: st.claim, n: s };
  assert(s.sweepOpp >= 40 && Math.abs(rows[k].sweep - st.sweep) < .12, k + ' sweep decision rate should follow style: ' + rows[k].sweep + ' vs ' + st.sweep + ' (n ' + s.sweepOpp + ')');
  if (s.rushOpp >= 30) assert(Math.abs(rows[k].rush - st.rush) < .15, k + ' rush rate should follow style: ' + rows[k].rush + ' vs ' + st.rush);
  if (s.claimOpp >= 30) assert(Math.abs(rows[k].claim - st.claim) < .15, k + ' claim rate should follow style: ' + rows[k].claim + ' vs ' + st.claim);
}
assert(rows['SWEEPER KEEPER'].sweep > rows['REFLEX MONSTER'].sweep + .3, 'sweepers come out far more often than reflex keepers');
assert(rows['COMMANDER'].claim > rows['REFLEX MONSTER'].claim, 'commanders claim more loose balls');
// (3) execution follows attributes: higher sweeping attribute -> higher sweep success when coming
const pts = Object.entries(sweepByKeeper).filter(([, v]) => v[0] >= 8).map(([id, v]) => [W.CageGoalkeepers.BY_ID[id].r.sweeping, v[1] / v[0]]);
const hi = pts.filter(p => p[0] >= 90).map(p => p[1]), lo = pts.filter(p => p[0] < 80).map(p => p[1]), avg = a => a.reduce((x, y) => x + y, 0) / a.length;
if (hi.length && lo.length) assert(avg(hi) > avg(lo), 'better sweepers succeed more often when they come');
console.log('T3_13_GK_STYLE_PASS no class execution bonus (50 keepers x 5 classes); decision rates follow style:', JSON.stringify(Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, { sweep: v.sweep + '/' + v.sweepStyle, rush: v.rush + '/' + v.rushStyle, claim: v.claim + '/' + v.claimStyle }]))), '; sweep success by attribute hi', hi.length ? avg(hi).toFixed(3) : '-', 'lo', lo.length ? avg(lo).toFixed(3) : '-');
