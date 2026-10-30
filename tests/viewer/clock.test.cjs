// Playback clock tests (T-V2/I2, I3, I4): controls move tau only; 'end' fires once; replays never finish a round.
'use strict';
const assert = require('node:assert/strict');
const { loadViewer, fixture } = require('./harness.cjs');
const results = [];
const test = (name, fn) => { fn(); results.push(name); };
const V = loadViewer(), T = V.CageViewerTimeline, K = V.CageViewerClock;
const rec = fixture(), recText = JSON.stringify(rec);

function runToEnd(pb, dt = 1 / 60, max = 1e6) { let n = 0; while (pb.state === 'playing' && n++ < max) pb.advance(dt); return n; }
function counters(pb) { const c = { end: 0, replayEnd: 0, goal: 0, replayGoal: 0, segments: 0 }; pb.on('end', () => c.end++); pb.on('replayEnd', () => c.replayEnd++); pb.on('goal', d => d.replay ? c.replayGoal++ : c.goal++); pb.on('segment', () => c.segments++); return c; }

test('T-V2/I2 pause, speed, seek and replay change tau only (timeline hash and record unchanged)', () => {
  const tl = T.buildTimeline(rec), h = T.hash(tl), pb = K.createPlayback(tl);
  pb.play(); pb.advance(2); pb.pause(); const held = pb.tau; pb.advance(5); assert.equal(pb.tau, held, 'paused clock must not move');
  pb.resume(); for (const s of ['full', 'dramatic', 'fast', 'dynamic']) { pb.setSpeed(s); pb.advance(0.5); }
  pb.seek(tl.total / 3); pb.seek(-5); assert.equal(pb.tau, 0); pb.seek(1e9); assert.equal(pb.tau, tl.total);
  pb.replayGoal(); pb.advance(1);
  assert.equal(T.hash(tl), h); assert.equal(JSON.stringify(rec), recText);
});

test('tau advances monotonically while playing and stops at the end', () => {
  const tl = T.buildTimeline(rec), pb = K.createPlayback(tl, { speed: 'full' }); pb.play(); let prev = 0, n = 0;
  while (pb.state === 'playing' && n++ < 1e6) { const tau = pb.advance(1 / 60); assert(tau >= prev); prev = tau; }
  assert.equal(pb.tau, tl.total); assert.equal(pb.state, 'ended');
});

test('I4 live end fires exactly once, even after goal replay, restart and instant', () => {
  const tl = T.buildTimeline(rec), pb = K.createPlayback(tl, { mode: 'live' }), c = counters(pb);
  pb.play(); runToEnd(pb); assert.equal(c.end, 1); assert.equal(c.goal, 1);
  assert(pb.replayGoal()); assert.equal(pb.inReplay, true); runToEnd(pb);
  assert.equal(c.end, 1, 'goal replay must not finish the round again'); assert.equal(c.replayEnd, 1); assert.equal(c.replayGoal, 1);
  pb.play(); assert.equal(pb.tau, 0, 'play after full time restarts from kick-off'); runToEnd(pb); assert.equal(c.end, 1, 'watching again must not finish twice');
  pb.seek(0); pb.setSpeed('instant'); pb.play(); assert.equal(pb.state, 'ended'); assert.equal(c.end, 1);
  pb.seek(tl.total / 2); pb.setSpeed('dynamic'); pb.resume(); runToEnd(pb); assert.equal(c.end, 1);
});

test('I3 replay mounts never fire end', () => {
  const tl = T.buildTimeline(rec), pb = K.createPlayback(tl, { mode: 'replay' }), c = counters(pb);
  pb.play(); runToEnd(pb); pb.replayGoal(); runToEnd(pb); pb.setSpeed('instant'); pb.play();
  assert.equal(c.end, 0); assert.equal(pb.endFired, false);
});

test('instant speed jumps to full time and fires end once', () => {
  const tl = T.buildTimeline(rec), pb = K.createPlayback(tl, { speed: 'instant' }), c = counters(pb);
  pb.play(); assert.equal(pb.tau, tl.total); assert.equal(c.end, 1); assert.equal(c.goal, 1); pb.play(); assert.equal(c.end, 1);
});

test('goal replay starts at the scoring possession and runs in REPLAY state at half speed', () => {
  const tl = T.buildTimeline(rec), pb = K.createPlayback(tl); pb.replayGoal();
  assert.equal(pb.tau, tl.goals[0].replayFrom); assert(pb.inReplay); const t0 = pb.tau; pb.advance(1); assert(Math.abs(pb.tau - t0 - K.REPLAY_RATE) < 1e-6 || pb.tau === tl.total);
  pb.seek(0); assert.equal(pb.inReplay, false, 'seeking before the replay window leaves replay');
});

test('speed ordering: full is longest, fast shortest; dynamic aims for 30-45 s when condensable', () => {
  const tl = T.buildTimeline(rec), est = s => { const pb = K.createPlayback(tl, { speed: s }); return pb.estimate(); };
  const e = { full: est('full'), dramatic: est('dramatic'), dynamic: est('dynamic'), fast: est('fast'), instant: est('instant') };
  console.log('  real seconds', Object.fromEntries(Object.entries(e).map(([k, v]) => [k, +v.toFixed(1)])), 'sim duration', tl.duration);
  assert(e.full >= e.dynamic - 1e-9); assert(e.dynamic > e.fast); assert(e.dramatic > e.dynamic); assert.equal(e.instant, 0);
  if (e.full > 45) assert(e.dynamic <= 45.5, 'dynamic should condense long matches to the budget');
});

test('segment events are emitted in order without gaps', () => {
  const tl = T.buildTimeline(rec), pb = K.createPlayback(tl, { speed: 'fast' }), seen = []; pb.on('segment', d => seen.push(d.index));
  pb.play(); runToEnd(pb, 0.25); assert.deepEqual(seen, Array.from(tl.segments.slice(1), s => s.i));
});

console.log('clock.test: ' + results.length + ' passed');
