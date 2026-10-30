// Timeline builder tests (T-V1, T-V4, T-V5, T-V6, I1, I5, I6, I7, schema tolerance).
'use strict';
const assert = require('node:assert/strict');
const { loadViewer, fixture, deepFreeze } = require('./harness.cjs');
const { check } = require('./invariants.cjs');
const results = [];
const test = (name, fn) => { fn(); results.push(name); };

const V = loadViewer();               // Math.random / Date / performance.now throw inside this context
const T = V.CageViewerTimeline;
const rec = fixture();

test('fixture is a real T3 schema-1 record without step', () => {
  assert.equal(rec.schema, 1); assert.match(rec.engineVersion, /^cage-t3/);
  assert(rec.result.events.every(e => e.step === undefined), 'fixture must exercise the schema-1 heuristic');
});

test('T-V1/I1 stable timeline: identical hash across builds and fresh contexts', () => {
  const h1 = T.hash(T.buildTimeline(rec)), h2 = T.hash(T.buildTimeline(rec)), h3 = loadViewer().CageViewerTimeline.hash(loadViewer().CageViewerTimeline.buildTimeline(rec));
  assert.equal(h1, h2); assert.equal(h1, h3);
  console.log('  timeline hash', h1);
});

test('I6 no randomness or wall clock while building or sampling (trapped globals)', () => {
  const tl = T.buildTimeline(rec);
  for (let tau = 0; tau < tl.total; tau += 0.37) { T.playersAt(tl, tau); T.ballAt(tl, tau); T.clockAt(tl, tau); }
});

test('I5 record is never mutated (deep-frozen input, byte-identical after)', () => {
  const before = JSON.stringify(rec), frozen = deepFreeze(JSON.parse(before));
  const tl = T.buildTimeline(frozen); T.playersAt(tl, tl.total / 2); T.ballAt(tl, tl.total / 2);
  assert.equal(JSON.stringify(frozen), before);
});

test('invariants: six positions, clock monotonic and never ahead (T-V6), receiver arrival (T-V4), contact distance (T-V5), score from goal events', () => {
  const { tl, stats } = check(V, rec, 'fixture');
  assert(stats.passesChecked > 0, 'fixture should contain completed passes');
  console.log('  segments', tl.segments.length, 'beats', tl.beats.length, 'timeline', tl.total.toFixed(1) + 's', 'samples', stats.samples, 'passes', stats.passesChecked, 'contacts', stats.contactsChecked, 'final', tl.finalScore.join('-'));
});

test('goal: final score, winner and golden goal from events; replay starts at the scoring possession', () => {
  const tl = T.buildTimeline(rec), last = rec.result.events.at(-1);
  assert.equal(last.type, 'goal'); assert.equal(tl.winner, last.team); assert.equal(tl.goals.length, 1);
  const g = tl.goals[0]; assert.equal(g.actor, last.actor);
  const startType = rec.result.events[tl.segments.findIndex(s => s.tau0 === g.replayFrom)].type;
  assert(['restart', 'turnover'].includes(startType), 'replay begins at a restart or turnover, got ' + startType);
  assert.deepEqual(Array.from(T.scoreAt(tl, 0)), [0, 0]);
});

test('schema-1 tolerance: approximate timing note, beats grouped by heuristic', () => {
  const tl = T.buildTimeline(rec);
  assert.equal(tl.timing, 'approximate'); assert.equal(tl.mode, 'full');
  assert(tl.notes.some(n => /Approximate timing/.test(n)));
  // every beat contains at most one action event
  const ACTION = new Set(['restart', 'carry', 'pass', 'through_ball', 'dribble_duel', 'wall_pass', 'press', 'shot_attempt', 'free_kick']);
  for (const b of tl.beats) { const n = rec.result.events.slice(b.from, b.to + 1).filter(e => ACTION.has(e.type)).length; assert(n <= 1, 'beat ' + b.index + ' has ' + n + ' actions'); }
});

test('schema-2 records (with step) use exact grouping', () => {
  const tl1 = T.buildTimeline(rec), r2 = JSON.parse(JSON.stringify(rec));
  r2.result.schema = 2; r2.result.events.forEach((e, i) => { e.step = tl1.segments[i].beat; });
  const tl2 = T.buildTimeline(r2);
  assert.equal(tl2.timing, 'exact'); assert.equal(tl2.beats.length, tl1.beats.length);
  check(V, r2, 'schema2');
});

test('I7 future schema is refused with an explicit message', () => {
  const r3 = JSON.parse(JSON.stringify(rec)); r3.result.schema = 3;
  assert.throws(() => T.buildTimeline(r3), /viewer schema 3; this build supports schema 2/);
  const r4 = JSON.parse(JSON.stringify(rec)); r4.viewerSchema = 9; assert.throws(() => T.buildTimeline(r4), /schema 9/);
});

test('v0.4-style record without positions plays in labelled ball-only mode', () => {
  const r = JSON.parse(JSON.stringify(rec)); r.engineVersion = 'cage-0.4.0';
  r.result.events.forEach(e => { delete e.positions; delete e.roles; delete e.calc; });
  const { tl } = check(V, r, 'ball-only');
  assert.equal(tl.mode, 'ball-only'); assert(tl.notes.some(n => /ball-only mode/.test(n)));
});

test('real v0.4 fixture (if generated) plays in ball-only mode', () => {
  let r; try { r = fixture('v04-seed42.json'); } catch { console.log('  (skipped: no v0.4 fixture)'); return; }
  const { tl } = check(V, r, 'v0.4'); assert.equal(tl.mode, 'ball-only');
});

test('bare engine result (no record wrapper) is accepted, teams inferred', () => {
  const tl = T.buildTimeline(JSON.parse(JSON.stringify(rec.result)));
  assert.deepEqual(JSON.parse(JSON.stringify(tl.teams.map(t => t.slice().sort()))), rec.config.teams.map(t => t.slice().sort()));
});

test('malformed logs are refused', () => {
  assert.throws(() => T.buildTimeline({}), /not a recorded match/);
  const bad = JSON.parse(JSON.stringify(rec)); bad.result.events[3].t = -1; assert.throws(() => T.buildTimeline(bad), /out of order/);
  const empty = JSON.parse(JSON.stringify(rec)); empty.result.events = []; assert.throws(() => T.buildTimeline(empty), /empty/);
});

test('layout is deterministic and slot-stable', () => {
  const Lt = V.CageViewerLayout, pos = { a: { x: 1, y: 1 }, b: { x: 1, y: 1 }, c: { x: 1, y: 1 }, d: { x: 2, y: 0 }, e: { x: 1, y: 1 }, f: { x: 0, y: 2 } };
  const ctx = { teamOf: { a: 0, b: 0, c: 0, d: 1, e: 1, f: 1 }, poss: 0, carrier: 'a', challenger: 'e', helper: null, seed: 7, beat: 3 };
  assert.equal(JSON.stringify(Lt.assign(pos, ctx)), JSON.stringify(Lt.assign(pos, ctx)));
  const s1 = Lt.assign(pos, ctx), s2 = Lt.assign(pos, { ...ctx, beat: 4 });
  for (const id of Object.keys(pos)) { assert.equal(s1[id].slot, s2[id].slot, 'slot changed without occupancy change: ' + id); assert(Math.abs(s1[id].u - s2[id].u) * 4 <= 2 * Lt.JITTER + 1e-9); }
  // defender e sits goal-side (further toward x=3) of the carrier a when team 0 attacks
  assert(s1.e.u > s1.a.u, 'defender should be goal-side');
  assert.equal(Lt.label('Ronaldinho'), "R'DINHO"); assert.equal(Lt.label('Alessandro Del Piero'), 'DEL PIERO');
});

test('build time < 20 ms on the fixture (median of 15)', () => {
  const { performance } = require('node:perf_hooks'), ms = [];
  for (let i = 0; i < 15; i++) { const t0 = performance.now(); T.buildTimeline(rec); ms.push(performance.now() - t0); }
  ms.sort((a, b) => a - b); console.log('  build median', ms[7].toFixed(2), 'ms for', rec.result.events.length, 'events');
  assert(ms[7] < 20);
});

console.log('timeline.test: ' + results.length + ' passed');
