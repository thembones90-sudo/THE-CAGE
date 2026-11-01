'use strict';
// Goalkeepers must move: on real 3+1 match timelines, sampled at 60 fps, both keepers travel continuously with
// the recorded ball, never jump between frames, and run out for logged sweeps, claims and one-on-one rushes.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..', '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const scripts = [...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m => m[1]);
const engineEnd = scripts.indexOf('src/replay/records.js');
const window = { location: { search: '' }, addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }) };
const ctx = vm.createContext({ window, console, Math, Object, Array, Error, TypeError, RangeError, JSON, Number, String, Set, Map, WeakMap, Symbol, Boolean, Uint32Array, Int32Array, Float64Array, document: { createElement: () => ({ getContext: () => null, style: {} }) } });
for (const f of scripts.slice(0, engineEnd + 1)) vm.runInContext(read(f), ctx, { filename: f });
for (const f of ['src/viewer/coords.js', 'src/viewer/layout.js', 'src/viewer/timeline.js', 'src/viewer-v4/fx.js', 'src/viewer-v4/label-layout.js', 'src/viewer-v4/renderer.js']) vm.runInContext(read(f), ctx, { filename: f });
const E = window.CageEngine, R = window.CageRecords, TL = window.CageViewerTimeline, stance = window.CageViewerRenderer.keeperStance, G = window.CageGoalkeepers.players;
assert.equal(typeof stance, 'function', 'renderer exposes the keeper stance');
const KEEPER_TYPES = ['gk_save', 'gk_parry', 'gk_sweep', 'gk_distribution', 'gk_claim'];
let matches = 0, outings = 0, rushes = 0;
for (let k = 0; k < 6; k++) {
  const ids = E.ROSTER.map(p => p.id), t = []; for (let m = 0; t.length < 6; m++) { const id = ids[(k * 53 + m * 19) % ids.length]; if (!t.includes(id)) t.push(id); }
  const sweeperIdx = G.findIndex(g => g.keeperClass === 'SWEEPER KEEPER'), cmdIdx = G.findIndex(g => g.keeperClass === 'COMMANDER');
  const cfg = { teams: [t.slice(0, 3), t.slice(3)], tactics: ['balanced', 'balanced'], keepers: [G[sweeperIdx].id, G[cmdIdx].id], seed: 4000 + k, mode: 'score', traits: { enabled: true }, rules: { pressure: 'defender-quality-v1' } };
  const r = E.simulate(cfg), rec = R.make(cfg, r, 1), tl = TL.buildTimeline(rec); matches++;
  const keepers = rec.config.keepers, dt = 1 / 60, path0 = [], path1 = [];
  let travel = [0, 0], maxStep = 0, prev = null, sawOuting = false;
  for (let tau = 0; tau <= Math.min(tl.total, 240); tau += dt) {
    const seg = tl.segments[TL.segmentIndex(tl, tau)], ev = r.events[seg.i], ball = TL.ballAt(tl, tau);
    const keeperEvent = (KEEPER_TYPES.includes(ev?.type) || (ev?.gk && ev?.calc?.keeperMode)) ? ev : null;
    const phase = TL.phase(seg, tau), f = { ball, reducedMotion: false };
    const pos = [0, 1].map(side => window.CageViewerRenderer.keeperStanceAt(tl, r.events, TL, keepers, tau, side, false)); // exactly what the viewer draws
    for (const side of [0, 1]) { const p = pos[side]; assert(p.u >= 0 && p.u <= 1 && p.v >= .24 && p.v <= .76, 'keeper stays within his box width'); if (side === 0) assert(p.u <= .2, 'left keeper near his goal'); else assert(p.u >= .8, 'right keeper near his goal'); }
    if (prev) for (const side of [0, 1]) { const step = Math.hypot(pos[side].u - prev[side].u, pos[side].v - prev[side].v); travel[side] += step; maxStep = Math.max(maxStep, step); }
    if (keeperEvent && ['gk_sweep', 'gk_claim'].includes(keeperEvent.type) && phase > .6) { const s = keeperEvent.gk === keepers[0] ? 0 : 1; if (Math.abs(pos[s].u - s) > .075) sawOuting = true; }
    if (keeperEvent?.calc?.keeperMode === 'rush' && phase > .6) rushes++;
    prev = pos;
  }
  assert(travel[0] > .05 && travel[1] > .05, 'both keepers move during play (travel ' + travel.map(x => x.toFixed(3)).join('/') + ')');
  assert(maxStep < .02, 'no keeper teleports between frames (max step ' + maxStep.toFixed(4) + ')');
  if (r.events.some(e => ['gk_sweep', 'gk_claim'].includes(e.type) && tl.segments.find(s => s.i === r.events.indexOf(e))?.tau0 <= 240)) assert(sawOuting, 'keeper runs out for a logged sweep or claim');
  if (sawOuting) outings++;
}
assert(outings >= 1, 'at least one sampled match shows a keeper running out');
console.log(`gk-motion.test: passed (${matches} real 3+1 matches at 60 fps: keepers move continuously with the ball, no frame jumps, ${outings} matches with a visible sweep/claim outing, ${rushes} rush frames)`);
