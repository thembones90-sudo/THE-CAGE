'use strict';
// Time bar and Highlights: key moments come from the recorded timeline (every goal, save, miss and block is a marker),
// Highlights plays only their build-up windows at match pace, fires every goal and the end exactly once, is much
// shorter than the full match, and never touches the record. Deterministic.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..', '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const scripts = [...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m => m[1]);
const window = { location: { search: '' } };
const ctx = vm.createContext({ window, console, Math, Object, Array, Error, TypeError, RangeError, JSON, Number, String, Set, Map, WeakMap, Symbol, Boolean, Uint8Array, Uint32Array, Int32Array, Float64Array });
for (const f of scripts.slice(0, scripts.indexOf('src/replay/records.js') + 1)) vm.runInContext(read(f), ctx, { filename: f });
for (const f of ['src/viewer/coords.js', 'src/viewer/layout.js', 'src/viewer/timeline.js', 'src/viewer/recorded-motion.js', 'src/viewer/key-moments.js', 'src/viewer/clock.js']) {
  assert(scripts.includes(f), f + ' is loaded by the game'); vm.runInContext(read(f), ctx, { filename: f }); }
assert(scripts.indexOf('src/viewer/key-moments.js') < scripts.indexOf('src/viewer/clock.js'), 'key moments load before the clock');
for (const page of ['draft.html', 'viewer-v53.html']) assert(read(page).includes('src/viewer/key-moments.js'), page + ' loads key moments');
const vsrc = read('src/viewer-v4/viewer.js'); new Function(vsrc);
assert(/CageKeyMoments\.build\(tl\)/.test(vsrc) && /data-k="marks"/.test(vsrc), 'the game viewer draws key-moment markers');
const E = window.CageEngine, R = window.CageRecords, TL = window.CageViewerTimeline, KM = window.CageKeyMoments, K = window.CageViewerClock, G = window.CageGoalkeepers.players;
assert(K.SPEEDS.highlights && K.SPEEDS.highlights.label === 'Highlights', 'Highlights speed offered');
const ids = E.ROSTER.map(p => p.id);
let matches = 0, goalsSeen = 0, shareMax = 0, shareSum = 0, marks = 0;
for (let k = 0; k < 8; k++) {
  const t = []; for (let m = 0; t.length < 6; m++) { const id = ids[(k * 53 + m * 17) % ids.length]; if (!t.includes(id)) t.push(id); }
  const cfg = { teams: [t.slice(0, 3), t.slice(3)], tactics: ['balanced', 'press'], keepers: [G[k].id, G[k + 25].id], seed: 7300 + k, mode: 'score', traits: { enabled: true }, rules: { pressure: 'defender-quality-v1' } };
  const rec = R.make(cfg, E.simulate(cfg), 1), before = JSON.stringify(rec), tl = TL.buildTimeline(rec), ev = rec.result.events;
  // 1. Markers: exactly one per recorded goal/save/parry/miss/block, at its time, ordered, inside the bar.
  const mo = KM.build(tl), want = ev.filter(e => ['goal', 'gk_save', 'gk_parry', 'shot_miss', 'block', 'golden_goal_start'].includes(e.type));
  assert.equal(mo.length, want.length, 'one marker per key event'); marks += mo.length;
  mo.forEach((m, j) => { assert.equal(m.i, want[j].i); assert.equal(m.t, want[j].t, 'marker at the recorded time'); assert(m.from <= m.tau && m.tau <= m.to && m.from >= 0 && m.to <= tl.total, 'window holds its moment');
    if (j) assert(m.tau >= mo[j - 1].tau, 'markers in order'); });
  for (const g of tl.goals) assert(mo.some(m => m.kind === 'goal' && m.i === g.i && m.tau === g.tau), 'every goal is marked at its replay time');
  assert.equal(JSON.stringify(KM.build(tl)), JSON.stringify(mo), 'deterministic');
  // 2. Highlights playback: only inside windows, every goal fired once, end fired once, much shorter than Full 1x.
  const pb = K.createPlayback(tl, { speed: 'highlights' }), wins = pb.highlights, fired = [];
  assert(wins.length > 0 && wins.every((w, j) => w[0] < w[1] && (!j || w[0] > wins[j - 1][1])), 'merged, disjoint windows');
  let ends = 0; pb.on('goal', d => fired.push(d.goal.i)); pb.on('end', () => ends++);
  const full = K.createPlayback(tl, { speed: 'x1' }).estimate(), est = pb.estimate();
  pb.play(); let realT = 0, prev = 0;
  for (let i = 0; i < 60 * 900 && pb.state !== 'ended'; i++) { const tau = pb.advance(1 / 60); realT += 1 / 60;
    assert(tau >= prev, 'never runs backwards'); if (tau < tl.total) assert(wins.some(w => tau >= w[0] - 1e-9 && tau <= w[1] + 1e-9), 'playhead stays in highlight windows'); prev = tau; }
  assert.equal(pb.state, 'ended'); assert.equal(ends, 1, 'end fires once');
  assert.equal(JSON.stringify(fired), JSON.stringify(tl.goals.map(g => g.i)), 'every goal plays in Highlights, once, in order'); goalsSeen += fired.length;
  assert(Math.abs(realT - est) < Math.max(2, est * .05), 'estimate matches Highlights playback (' + realT.toFixed(0) + ' vs ' + est.toFixed(0) + ' s)');
  const share = realT / full; shareMax = Math.max(shareMax, share); shareSum += share;
  assert(share < .75, 'Highlights shorter than the full match (' + (100 * share).toFixed(0) + '%)');
  // 3. Switching back to Full plays every segment again; the record is untouched.
  pb.seek(0); pb.setSpeed('x1'); pb.play(); pb.advance(5); assert(pb.tau > 0 && pb.estimate() === full);
  assert.equal(JSON.stringify(rec), before, 'record not modified');
  matches++;
}
console.log(`key-moments.test: passed (${matches} real 3+1 matches: ${marks} key-moment markers match the recorded goals/saves/misses/blocks; Highlights plays only build-up windows, all ${goalsSeen} goals fired once, end once, ${(100 * shareSum / matches).toFixed(0)}% of Full 1x length on average (max ${(100 * shareMax).toFixed(0)}%); deterministic; record untouched)`);
