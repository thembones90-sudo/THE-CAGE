'use strict';
// M1 acceptance (owner order 2026-11-01): passive continuous movement layer.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const scripts = [...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m => m[1]);
function load(withMovement) {
  const c = { window: { location: { search: '' } } }; vm.createContext(c);
  for (const f of scripts) { vm.runInContext(read(f), c, { filename: f }); if (f === 'src/replay/records.js') break; }
  if (!withMovement) c.window.CageMovement = undefined; // same engine with the movement hook disabled
  return c.window;
}
const W = load(true), WOFF = load(false), E = W.CageEngine, EOFF = WOFF.CageEngine, R = W.CageRecords, M = W.CageMovement, G = W.CageGoalkeepers.players;
assert.equal(M.HZ, 4);
const ids = E.ROSTER.map(p => p.id), tactics = ['balanced', 'press', 'possession', 'counter'];
const cfgs = [];
for (let k = 0; k < 24; k++) { const t = []; for (let m = 0; t.length < 6; m++) { const id = ids[(k * 43 + m * 31) % ids.length]; if (!t.includes(id)) t.push(id); }
  cfgs.push({ teams: [t.slice(0, 3), t.slice(3)], tactics: [tactics[k % 4], tactics[(k >> 2) % 4]], seed: (k * 2654435761 + 11) >>> 0, mode: 'score', traits: { enabled: true }, keepers: [G[k % 50].id, G[(k * 7 + 13) % 50 === k % 50 ? (k * 7 + 14) % 50 : (k * 7 + 13) % 50].id], ...(k % 2 ? { rules: { pressure: 'defender-quality-v1' } } : {}) }); }
let totalMove = 0, totalResult = 0, contradictions = 0, impossible = 0, frames = 0, tOn = 0, tOff = 0;
const speedVsPace = [];
for (const [k, cfg] of cfgs.entries()) {
  let t0 = Date.now(); const a = E.simulate(cfg); tOn += Date.now() - t0; t0 = Date.now(); const b = EOFF.simulate(cfg); tOff += Date.now() - t0;
  // 1. ZERO gameplay change: identical events (incl. decision logs), score, winner, duration and RNG draws.
  const { movement, ...rest } = a;
  assert.equal(JSON.stringify(rest), JSON.stringify(b), 'results and decision logs identical with and without M1 (config ' + k + ')');
  assert.equal(a.draws, b.draws, 'RNG sequence untouched');
  // 2. Byte-identical movement on repeat.
  const again = E.simulate(cfg); assert.equal(JSON.stringify(again.movement), JSON.stringify(movement), 'movement byte-identical on repeat'); assert.equal(again.movement.hash, movement.hash);
  // 3. All eight bodies (6 outfield + 2 keepers) plus the ball at 4 Hz, covering the whole match.
  assert.equal(movement.bodies.length, 9); assert.equal(movement.bodies.filter(b => b.kind === 'keeper').length, 2); assert.equal(movement.bodies.filter(b => b.kind === 'outfield').length, 6);
  assert(Math.abs(movement.frames * 0.25 - a.duration) <= 0.25, 'frames cover the match at 4 Hz');
  assert.equal(movement.deltaOverflow, 0, 'no delta overflow');
  const fr = M.decode(movement); assert.equal(fr.length, movement.frames);
  // 4. Physics: per-body speed, acceleration/braking and turning limits from its own profile (quantisation tolerance 0.1 m).
  const Q = 0.1, dt = 0.25;
  movement.bodies.slice(0, 8).forEach((body, j) => {
    let maxV = 0;
    for (let f = 2; f < fr.length; f++) {
      const p0 = fr[f - 2][j], p1 = fr[f - 1][j], p2 = fr[f][j];
      const v1 = [(p1[0] - p0[0]) / dt, (p1[1] - p0[1]) / dt], v2 = [(p2[0] - p1[0]) / dt, (p2[1] - p1[1]) / dt];
      const s2 = Math.hypot(v2[0], v2[1]); maxV = Math.max(maxV, s2);
      assert(s2 <= body.vmax + 2 * Q / dt, `${body.id} speed ${s2.toFixed(2)} exceeds vmax ${body.vmax}`);
      const dv = Math.hypot(v2[0] - v1[0], v2[1] - v1[1]);
      assert(dv <= Math.max(body.accel, body.brake) * dt + 4 * Q / dt, `${body.id} velocity change ${dv.toFixed(2)} exceeds accel/brake limits`);
      const s1 = Math.hypot(v1[0], v1[1]);
      if (s1 > 2.5 && s2 > 2.5) { const ang = Math.abs(Math.atan2(v1[0] * v2[1] - v1[1] * v2[0], v1[0] * v2[0] + v1[1] * v2[1])) * 180 / Math.PI;
        assert(ang <= body.turnDeg + 25, `${body.id} turned ${ang.toFixed(0)} deg at speed (limit ${body.turnDeg})`); }
    }
    if (body.kind === 'outfield') speedVsPace.push([E.comp(E.BY_ID[body.id]).a.pace, body.vmax, maxV]);
  });
  // 5. Keepers are physically simulated: they move, stay near their own goal, and run out for logged sweeps/claims.
  for (const side of [0, 1]) { const j = 6 + side, goalX = side === 0 ? 0 : 40; let travel = 0; for (let f = 1; f < fr.length; f++) travel += Math.hypot(fr[f][j][0] - fr[f - 1][j][0], fr[f][j][1] - fr[f - 1][j][1]);
    assert(travel > 20, 'keeper ' + side + ' moves (' + travel.toFixed(0) + ' m)'); assert(fr.every(fx => Math.abs(fx[j][0] - goalX) <= 16.5), 'keeper stays within 16.5 m of his goal'); }
  const outing = a.events.filter(e => e.type === 'gk_sweep' || e.type === 'gk_claim');
  for (const e of outing.slice(0, 3)) { const f = Math.min(fr.length - 1, Math.round(e.t / 0.25)), side = cfg.keepers.indexOf(e.gk), j = 6 + side, goalX = side === 0 ? 0 : 40;
    const d0 = Math.abs(fr[f][j][0] - goalX), far = Math.max(...[1, 2, 3, 4, 5, 6, 7, 8].map(d => Math.abs(fr[Math.min(fr.length - 1, f + d)][j][0] - goalX)));
    const reach = Math.min(...[1, 2, 3, 4, 5, 6, 7, 8].map(d => { const g = Math.min(fr.length - 1, f + d); return Math.hypot(fr[g][j][0] - fr[g][8][0], fr[g][j][1] - fr[g][8][1]); }));
    assert(far >= d0 + 1.5 || reach <= 1.5, 'keeper goes for the ball on a logged ' + e.type + ' (' + d0.toFixed(1) + ' -> ' + far.toFixed(1) + ' m off the line, closest to ball ' + reach.toFixed(1) + ' m)'); }
  // 6. No teleportation: contradictions are LOGGED, bodies never snap (per-slice displacement bounded even when the tactical cell jumps).
  assert(Array.isArray(movement.contradictions.rows));
  contradictions += movement.summary.contradictions; impossible += movement.summary.impossible;
  totalMove += JSON.stringify(movement).length; totalResult += JSON.stringify(a).length; frames += movement.frames;
  // 7. Replay: a record with movement reproduces byte-identically; a pre-M1 T3-13 record (no movement) still reproduces.
  if (k % 6 === 0) { const rec = R.make(cfg, a, 1); assert.equal(JSON.stringify(R.reproduce(rec).movement), JSON.stringify(movement));
    const legacy = JSON.parse(JSON.stringify(rec)); delete legacy.result.movement; R.reproduce(legacy); }
}
// 8. Attribute-driven: faster players get higher top speeds, and actually run faster.
const corr = (xs, ys) => { const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n; let sxy = 0, sx = 0, sy = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sx += (xs[i] - mx) ** 2; sy += (ys[i] - my) ** 2; } return sxy / Math.sqrt(sx * sy); };
assert(corr(speedVsPace.map(x => x[0]), speedVsPace.map(x => x[1])) > 0.95, 'top speed follows pace');
assert(corr(speedVsPace.map(x => x[0]), speedVsPace.map(x => x[2])) > 0.3, 'observed top speed follows pace');
// 9. Compact and performant.
const avgKB = totalMove / cfgs.length / 1024, share = totalMove / totalResult;
assert(avgKB < 200 && share < 0.2, 'movement record compact: ' + avgKB.toFixed(1) + ' KB, ' + (100 * share).toFixed(1) + '% of the result');
assert(tOn < tOff * 2.5 + 200, 'simulation time with movement stays reasonable');
fs.mkdirSync(path.join(root, 'tests/balance/m1'), { recursive: true });
fs.writeFileSync(path.join(root, 'tests/balance/m1/acceptance.json'), JSON.stringify({ engine: E.VERSION, movement: M.VERSION, matches: cfgs.length, avgMovementKB: +avgKB.toFixed(1), shareOfResult: +share.toFixed(3), framesPerMatch: Math.round(frames / cfgs.length), contradictionsPerMatch: +(contradictions / cfgs.length).toFixed(1), impossiblePerMatch: +(impossible / cfgs.length).toFixed(2), simMsWithMovement: tOn, simMsWithout: tOff }, null, 1));
console.log(`M1_MOVEMENT_PASS ${cfgs.length} 3+1 matches: results/decision logs/RNG identical with and without M1; movement byte-identical on repeat; 8 bodies + ball at 4 Hz; speed/accel/turn limits respected; keepers simulated (move, stay near goal, run out on sweeps/claims); no snapping; ${(contradictions / cfgs.length).toFixed(0)} contradictions/match logged (${(impossible / cfgs.length).toFixed(1)} physically impossible); ${avgKB.toFixed(0)} KB/match (${(100 * share).toFixed(1)}%); sim ${tOn} ms vs ${tOff} ms; records replay (incl. pre-M1)`);
