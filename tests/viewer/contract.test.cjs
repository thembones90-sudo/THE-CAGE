// V0.2 contract checks on real T3 events + viewer invariants over many simulated matches.
// The ENGINE runs here, in the test, to produce records; the viewer under test only reads them.
// Usage: node tests/viewer/contract.test.cjs [matches=120]
'use strict';
const assert = require('node:assert/strict');
const { loadEngine, loadViewer } = require('./harness.cjs');
const { check } = require('./invariants.cjs');
const { performance } = require('node:perf_hooks');

const W = loadEngine(), E = W.CageEngine, S = W.CageSpatial, V = loadViewer();
const N = +process.argv[2] || 120;
const trios = [['paolo-maldini', 'michael-ballack', 'ronaldo-nazario'], ['ronaldinho', 'rivaldo', 'alessandro-del-piero'], ['nemanja-vidic', 'jaap-stam', 'thomas-gravesen'], ['jay-jay-okocha', 'djalminha', 'zinedine-zidane']];
const tactics = ['balanced', 'counter', 'press'];
const DEF_EMITTED = new Set(['press', 'foul', 'block']);
const same = (a, b) => a && b && a.x === b.x && a.y === b.y;
const c = { matches: 0, caps: 0, events: 0, C1: 0, C3pass: 0, C3int: 0, longest: null, samples: 0 }, fails = { C1: [], C3pass: [], C3int: [] };

for (let k = 0; k < N; k++) {
  const a = trios[k % 4], b = trios[(k + 1 + (k >> 2) % 3) % 4];
  if (a === b || new Set([...a, ...b]).size !== 6) continue;
  const input = { teams: [a, b], tactics: [tactics[k % 3], tactics[(k + 1) % 3]], seed: 1000 + k, mode: 'ko' };
  let result; try { result = E.simulate(input); } catch (e) { if (/safety limit/.test(e.message)) { c.caps++; continue; } throw e; }
  const rec = JSON.parse(JSON.stringify(W.CageRecords.make(input, result, 1)));
  c.matches++; c.events += result.events.length;
  const ev = result.events;
  for (const e of ev) {
    assert.equal(Object.keys(e.positions).length, 6, 'C1 six positions');
    const carrier = e.roles && e.roles.carrier;
    if (e.zone && carrier) { c.C1++; const ft = DEF_EMITTED.has(e.type) ? 1 - e.team : e.team; if (!same(e.positions[carrier], S.world(e.zone, ft))) fails.C1.push(e.type + '@' + input.seed + '#' + e.i); }
    if ((e.type === 'pass' || e.type === 'through_ball') && e.outcome === 'complete') { c.C3pass++; if (!same(e.positions[e.target], S.world(e.to, e.team))) fails.C3pass.push(input.seed + '#' + e.i); }
    if (e.type === 'turnover' && ev[e.i - 1] && ['pass', 'through_ball'].includes(ev[e.i - 1].type)) { c.C3int++; if (!same(e.positions[e.actor], S.world(e.zone, e.team))) fails.C3int.push(input.seed + '#' + e.i); }
  }
  const t0 = performance.now(); const { stats } = check(V, rec, 'seed ' + input.seed); const ms = performance.now() - t0;
  c.samples += stats.samples;
  if (!c.longest || ev.length > c.longest.events) { V.CageViewerTimeline.buildTimeline(rec); const times = []; for(let m=0;m<20;m++){const t0=performance.now();V.CageViewerTimeline.buildTimeline(rec);times.push(performance.now()-t0);}times.sort((a,b)=>a-b);c.longest={seed:input.seed,events:ev.length,buildMs:+times[18].toFixed(2),medianMs:+times[10].toFixed(2),sampleCount:20}; }
  void ms;
}
console.log(JSON.stringify({ counters: c, failures: { C1: fails.C1.length, C3pass: fails.C3pass.length, C3int: fails.C3int.length }, examples: { C1: fails.C1.slice(0, 5), C3pass: fails.C3pass.slice(0, 5), C3int: fails.C3int.slice(0, 5) } }, null, 1));
assert(c.matches >= Math.min(20, N / 2), 'too few matches completed');
assert.equal(fails.C1.length, 0, 'C1 carrier not at zone');
assert.equal(fails.C3pass.length, 0, 'C3 receiver not at to');
assert.equal(fails.C3int.length, 0, 'C3 interceptor not at turnover zone');
assert(c.longest.buildMs < 20, 'build time on longest match ' + c.longest.buildMs + ' ms');
console.log('contract.test: passed (' + c.matches + ' matches, ' + c.events + ' events, viewer invariants on every match)');
