'use strict';
// M2: the viewer draws the engine's recorded movement. On real 3+1 matches sampled at 60 fps: positions are exactly
// the recorded 4 Hz frames, bodies never stall or jump, the ball never teleports, the motion and kinetics samplers
// read the recorded positions, real-time speeds play at match pace, and records without movement keep inferred motion.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..', '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const scripts = [...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m => m[1]);
const window = { location: { search: '' } };
const ctx = vm.createContext({ window, console, Math, Object, Array, Error, TypeError, RangeError, JSON, Number, String, Set, Map, WeakMap, Symbol, Boolean, Uint8Array, Uint32Array, Int32Array, Float64Array });
for (const f of scripts.slice(0, scripts.indexOf('src/replay/records.js') + 1)) vm.runInContext(read(f), ctx, { filename: f });
for (const f of ['src/viewer/coords.js', 'src/viewer/layout.js', 'src/viewer/timeline.js', 'src/viewer/recorded-motion.js', 'src/viewer/clock.js', 'src/viewer-v4/motion.js', 'src/viewer-v4/kinetics.js']) {
  assert(scripts.includes(f), f + ' is loaded by the game'); vm.runInContext(read(f), ctx, { filename: f }); }
new Function(read('src/viewer-v4/viewer.js')); assert(/CageRecordedMotion\.create\(tl,record\)/.test(read('src/viewer-v4/viewer.js')) && /M\.sample\(tl,events,tau,TP\)/.test(read('src/viewer-v4/viewer.js')), 'the game viewer draws the recording');
for (const page of ['draft.html', 'viewer-v53.html']) assert(read(page).includes('src/viewer/recorded-motion.js'), page + ' loads recorded motion');
const E = window.CageEngine, R = window.CageRecords, TL = window.CageViewerTimeline, RMx = window.CageRecordedMotion, Mv = window.CageMovement, K = window.CageViewerClock, G = window.CageGoalkeepers.players;
const ids = E.ROSTER.map(p => p.id);
let matches = 0, maxBall = 0, stallShare = 0;
for (let k = 0; k < 5; k++) {
  const t = []; for (let m = 0; t.length < 6; m++) { const id = ids[(k * 37 + m * 23) % ids.length]; if (!t.includes(id)) t.push(id); }
  const cfg = { teams: [t.slice(0, 3), t.slice(3)], tactics: ['balanced', 'counter'], keepers: [G[k].id, G[k + 20].id], seed: 6100 + k, mode: 'score', traits: { enabled: true }, rules: { pressure: 'defender-quality-v1' } };
  const rec = R.make(cfg, E.simulate(cfg), 1), before = JSON.stringify(rec), tl = TL.buildTimeline(rec), rm = RMx.create(tl, rec);
  assert(rm && rm.recorded, 'records with movement are drawn from the recording');
  const fr = Mv.decode(rec.result.movement), bodies = rec.result.movement.bodies, L = 40, W = 20;
  // 1. Exactly the recording: wherever the playback clock lands on a 4 Hz frame, every body is at its recorded spot.
  let checked = 0;
  for (const s of tl.segments) { if (!(s.move > 0 && s.t1 > s.t0)) continue; const tau = s.tau0 + s.move, f = s.t1 * 4;
    if (Math.abs(rm.simAt(tau) - s.t1) > 1e-9 || f > fr.length - 1) continue; const P = rm.playersAt(tau);
    tl.ids.forEach(id => { const j = bodies.findIndex(b => b.id === id); assert(Math.abs(P[id].u * L - fr[f][j][0]) < 1e-6 && Math.abs(P[id].v * W - fr[f][j][1]) < 1e-6, 'drawn position equals the recorded frame'); });
    if (++checked > 60) break; }
  assert(checked > 5, 'recorded frames are hit exactly (' + checked + ')');
  // 2. Continuous at 60 fps of real time at Full 1x: the clock never runs backwards, rarely stands still, no body jumps.
  const pb = K.createPlayback(tl, { speed: 'x1' }); assert(Math.abs(pb.estimate() - tl.duration) / tl.duration < .02, 'Full 1x plays at match pace (' + pb.estimate().toFixed(0) + ' s for ' + tl.duration + ' s)');
  for (const [sp, mult] of [['x075', .75], ['x15', 1.5], ['x2', 2]]) { pb.setSpeed(sp); assert(Math.abs(pb.estimate() * mult - tl.duration) / tl.duration < .02, sp + ' speed'); }
  pb.setSpeed('x1'); pb.play();
  let prevSim = -1, prevP = null, prevB = null, stalls = 0, n = 0;
  const vmax = Math.max(...bodies.filter(b => b.vmax).map(b => b.vmax));
  for (let i = 0; i < 60 * 240 && pb.tau < tl.total; i++) {
    pb.advance(1 / 60); const tau = pb.tau, sim = rm.simAt(tau), P = rm.playersAt(tau), B = rm.ballAt(tau, TL), Kp = rm.keepersAt(tau);
    assert(sim >= prevSim - 1e-9, 'simulation clock never runs backwards'); if (sim === prevSim) stalls++;
    assert(Kp.length === 2 && Kp.every(p => p && p.u >= 0 && p.u <= 1), 'both keepers drawn from the recording');
    if (prevP) { const dSim = sim - prevSim;
      for (const id of tl.ids) { const d = Math.hypot((P[id].u - prevP[id].u) * L, (P[id].v - prevP[id].v) * W); assert(d <= vmax * 1.35 * Math.max(dSim, 1 / 240) + .02, id + ' jumps ' + d.toFixed(2) + ' m in one frame'); }
      const db = Math.hypot((B.u - prevB.u) * L, (B.v - prevB.v) * W); if (dSim > 0) maxBall = Math.max(maxBall, db / dSim); assert(db <= 23 * Math.max(dSim, 1 / 240) + .02, 'ball never teleports'); }
    prevSim = sim; prevP = P; prevB = B; n++;
  }
  stallShare = Math.max(stallShare, stalls / n);
  assert(stalls / n < .02, 'bodies keep moving through zero-time events (stalled frames ' + (100 * stalls / n).toFixed(1) + '%)');
  // 3. The whole presentation stack reads the recorded positions (motion director, kinetics, ball).
  const TP = rm.timelineApi(TL), tau = tl.total * .4, mo = (window.CageViewerMotion || ctx.CageViewerMotion).sample(tl, rec.result.events, tau, TP), want = rm.playersAt(tau);
  for (const id of tl.ids) if (!(mo.roles.defender === id && tl.segments[TL.segmentIndex(tl, tau)].contact)) assert.equal(JSON.stringify(mo.positions[id]), JSON.stringify(want[id]), 'motion director uses recorded positions');
  assert.equal(mo.ball.u, rm.ballAt(tau, TL).u, 'ball drawn from the recording');
  assert((window.CageKinetics || ctx.CageKinetics).sample(tl, TP, tau, mo).players[tl.ids[0]], 'kinetics read the recording');
  // 4. Deterministic and read-only: same answer on a fresh decode, record untouched.
  assert.equal(JSON.stringify(RMx.create(tl, rec).playersAt(tau)), JSON.stringify(want), 'deterministic');
  assert.equal(JSON.stringify(rec), before, 'record not modified');
  // 5. Older records (no movement) keep the inferred motion.
  const old = JSON.parse(before); delete old.result.movement; assert.equal(RMx.create(TL.buildTimeline(old), old), null, 'no recording -> inferred motion');
  matches++;
}
console.log(`recorded-motion.test: passed (${matches} real 3+1 matches at 60 fps, Full 1x: drawn positions equal the recorded 4 Hz frames, no stalls (max ${(100 * stallShare).toFixed(1)}% frames), no body jumps, ball max ${maxBall.toFixed(1)} m/s, Full 0.75/1/1.5/2x at match pace, older records fall back to inferred motion)`);
