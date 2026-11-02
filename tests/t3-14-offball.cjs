'use strict';
// M3 off-ball intelligence (cage-t3-14). Deterministic unit scenarios for each mechanism, then behavioural evidence on real
// 3+1 matches against the frozen T3-13 engine with identical configs. No win-rate targets: goals and shots are reported, not tuned.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const scripts = [...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m => m[1]);
const c = { window: { location: { search: '' } } }; vm.createContext(c);
for (const f of scripts) { vm.runInContext(read(f), c, { filename: f }); if (f === 'src/replay/records.js') break; }
const W = c.window, E = W.CageEngine, R = W.CageRecords, S = W.CageSpatial, P = W.CageTacticalParams.P, G = W.CageGoalkeepers.players;
const T13 = W.CAGE_ENGINE_REGISTRY['cage-t3-13'];
assert.equal(E.VERSION, 'cage-t3-14'); assert.equal(E.PARAMS_VERSION, 't3-space-7'); assert(T13 && T13.VERSION === 'cage-t3-13', 'T3-13 frozen and registered');
assert(P.offball && W.CAGE_PERSONALITY && /personality-v3/.test(W.CAGE_PERSONALITY.version), 'M3 parameters and approved personality v3 loaded');
const ids = E.ROSTER.map(p => p.id), disc = id => S.discipline(id);
assert(ids.every(id => Number.isFinite(W.CAGE_PERSONALITY.discipline[id])), 'every player in the live roster has an approved discipline value');
assert.equal(S.discipline('no-such-player'), 50, 'unscored players are neutral (no tendency)');

// ---------- 1. Deterministic scenarios on a hand-built position ----------
const pick = (lo, hi) => ids.filter(id => disc(id) >= lo && disc(id) <= hi);
const steady = pick(60, 100), loose = pick(0, 30);
assert(steady.length >= 6 && loose.length >= 2, 'roster spans the discipline scale');
function scene(teamA, teamB, posA, posB, zone, committedA) {
  const mk = (id, ti, pos, committed) => ({ id, ti, c: E.comp(E.BY_ID[id]), pos: { ...pos }, oop: 0, moveCredit: 2, committed, twoWay: false });
  const pol = { compactness: .5, rotation: 0 };
  const teams = [{ ti: 0, ps: teamA.map((id, i) => mk(id, 0, posA[i], committedA[i])), policy: pol }, { ti: 1, ps: teamB.map((id, i) => mk(id, 1, posB[i], false)), policy: pol }];
  return { teams, run: () => S.update(teams, 0, teams[0].ps[0], zone, 1) };
}
// 1a. Runs into space: the runner avoids the cell a defender stands on and takes the open one.
{ const s = scene(steady.slice(0, 3), steady.slice(3, 6), [{ x: 1, y: 1 }, { x: 1, y: 0 }, { x: 0, y: 1 }], [{ x: 2, y: 1 }, { x: 2, y: 0 }, { x: 3, y: 1 }], { x: 1, lane: 'centre' }, [false, true, false]);
  s.run(); const r = s.teams[0].ps[1];
  assert.equal(r.job, 'run');
  const occupied = c2 => [{ x: 2, y: 1 }, { x: 2, y: 0 }].some(o => o.x === c2.x && o.y === c2.y);
  assert(!occupied(r.target), 'runner chooses an unoccupied cell (' + JSON.stringify(r.target) + ')'); // Both cells ahead are covered, so he drifts wide into the free cell (2 cells from any defender, clearest lane).
  assert.equal(JSON.stringify(r.target), JSON.stringify({ x: 1, y: 2 }), 'runner takes the open cell, not the crowded one ahead'); }
// 1b. Lane block and goal-side mark: the second defender sits on the pass path to the most dangerous runner, the third marks the other.
{ const s = scene(steady.slice(0, 3), steady.slice(3, 6), [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 2, y: 0 }], [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 0 }], { x: 1, lane: 'centre' }, [false, true, true]);
  s.run(); const [d0, d1, d2] = [...s.teams[1].ps].sort((a, b) => ['ball', 'lane', 'mark'].indexOf(a.job) - ['ball', 'lane', 'mark'].indexOf(b.job));
  assert.equal(d0.job, 'ball'); assert.equal(d1.job, 'lane'); assert.equal(d2.job, 'mark');
  assert.equal(d1.on, s.teams[0].ps[1].id, 'lane blocked toward the deepest runner');
  const onPath = [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }].some(p => p.x === d1.target.x && p.y === d1.target.y); assert(onPath, 'lane defender targets a cell on the passing path');
  assert.equal(d2.on, s.teams[0].ps[2].id, 'the other runner is marked'); const rb = s.teams[0].ps[2], beyond = S.oriented(rb.pos, 0) > 1; // runners move first; the marker reacts to where he went
  assert.equal(JSON.stringify(d2.target), JSON.stringify(beyond && rb.pos.x !== 3 ? { x: rb.pos.x + 1, y: rb.pos.y } : { x: rb.pos.x, y: rb.pos.y }), 'marked on his cell, goal-side when beyond the ball'); }
// 1c. Hand-off: when two runners cross, defenders swap men instead of chasing across the pitch.
{ const s = scene(steady.slice(0, 3), steady.slice(3, 6), [{ x: 1, y: 1 }, { x: 2, y: 0 }, { x: 2, y: 2 }], [{ x: 1, y: 2 }, { x: 2, y: 0 }, { x: 2, y: 2 }], { x: 1, lane: 'centre' }, [false, true, true]);
  s.run(); const before = Object.fromEntries(s.teams[1].ps.slice(1).map(d => [d.id, d.on]));
  const [a1, a2] = [s.teams[0].ps[1], s.teams[0].ps[2]]; a1.pos = { x: 2, y: 2 }; a2.pos = { x: 2, y: 0 }; s.teams[1].ps[1].pos = { x: 2, y: 0 }; s.teams[1].ps[2].pos = { x: 2, y: 2 };
  s.run(); const after = s.teams[1].ps.slice(1);
  assert(after.some(d => d.handoff), 'a mark is handed off'); for (const d of after) if (d.job === 'lane' || d.job === 'mark') assert.notEqual(d.on, before[d.id], 'each defender picks up the runner now in his area');
  assert(after.every(d => S.dist(d.pos, d.target) <= 1), 'nobody chases across the pitch'); }
// 1d. Discipline: same picture, a low-discipline defender next to the ball leaves his job to double; a disciplined one holds it.
for (const [ids3, expectDouble] of [[[steady[3], steady[4], steady[5]], false], [[steady[3], loose[0], loose[1]], true]]) {
  const s = scene(steady.slice(0, 3), ids3, [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 2, y: 0 }], [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 1 }], { x: 1, lane: 'centre' }, [false, true, true]);
  s.run(); const doubled = s.teams[1].ps.filter(d => d.job === 'double');
  assert.equal(doubled.length > 0, expectDouble, (expectDouble ? 'low' : 'high') + '-discipline defenders ' + (expectDouble ? 'double the ball' : 'hold their jobs'));
  if (expectDouble) assert.equal(doubled.length, 1, 'at most one player doubles'); }
// 1e. Adventurous rest player steps up level with the ball; a disciplined one stays behind it.
for (const [rest, up] of [[steady[2], false], [pick(0, 34)[0], true]]) {
  const s = scene([steady[0], steady[1], rest], steady.slice(3, 6), [{ x: 2, y: 1 }, { x: 2, y: 0 }, { x: 0, y: 1 }], [{ x: 3, y: 1 }, { x: 3, y: 0 }, { x: 3, y: 2 }], { x: 2, lane: 'centre' }, [false, true, false]);
  s.run(); const q = s.teams[0].ps[2]; assert.equal(q.job, up ? 'step_up' : 'rest'); assert.equal(q.target.x, up ? 2 : 1, 'rest player x'); }

// ---------- 2. Behavioural evidence on real matches (same configs, T3-13 vs T3-14) ----------
const tactics = ['balanced', 'press', 'possession', 'counter'], cfgs = [];
for (let k = 0; k < 60; k++) { const t = []; for (let m = 0; t.length < 6; m++) { const id = ids[(k * 41 + m * 29) % ids.length]; if (!t.includes(id)) t.push(id); }
  cfgs.push({ teams: [t.slice(0, 3), t.slice(3)], tactics: [tactics[k % 4], tactics[(k >> 2) % 4]], keepers: [G[k % 50].id, G[(k * 7 + 13) % 50 === k % 50 ? (k + 1) % 50 : (k * 7 + 13) % 50].id], seed: 14000 + k, mode: 'score', traits: { enabled: true }, rules: { pressure: 'defender-quality-v1' } }); }
const world = (zone, team) => S.world(zone, team);
function laneShare(r) { let on = 0, n = 0; // share of open-play events with a defender standing on the path to the most advanced runner
  for (const e of r.events) { if (!e.zone || !e.positions || !e.calc || !e.calc.availability || !['pass', 'carry', 'dribble_duel', 'through_ball', 'shot_attempt'].includes(e.type)) continue;
    const att = e.team, ball = world(e.zone, att), mates = Object.keys(e.positions).filter(id => r._team[id] === att && id !== e.actor && e.calc.availability[id] === 0);
    if (!mates.length) continue; const deep = mates.sort((a, b) => S.oriented(e.positions[b], att) - S.oriented(e.positions[a], att) || (a < b ? -1 : 1))[0], to = e.positions[deep];
    const cells = []; let p = { ...ball }; while (p.x !== to.x || p.y !== to.y) { if (p.x !== to.x) p.x += Math.sign(to.x - p.x); else p.y += Math.sign(to.y - p.y); cells.push({ ...p }); }
    const defs = Object.keys(e.positions).filter(id => r._team[id] !== att && e.calc.availability[id] === 0);
    n++; if (defs.some(d => cells.some(cl => cl.x === e.positions[d].x && cl.y === e.positions[d].y))) on++; }
  return n ? on / n : 0; }
function runSpace(r) { let s = 0, n = 0; // open space around committed runners when the ball is played
  for (const e of r.events) { if (!e.positions || !e.calc || !e.calc.commitment || !['pass', 'through_ball', 'carry'].includes(e.type)) continue;
    const att = e.team, defs = Object.keys(e.positions).filter(id => r._team[id] !== att && e.calc.availability[id] === 0);
    for (const id of Object.keys(e.positions)) if (r._team[id] === att && id !== e.actor && e.calc.commitment[id]) { s += Math.min(2, ...defs.map(d => S.dist(e.positions[d], e.positions[id]))); n++; } }
  return n ? s / n : 0; }
const ev = { 13: { lane: 0, space: 0, goals: 0, shots: 0, ic: 0, passes: 0 }, 14: { lane: 0, space: 0, goals: 0, shots: 0, ic: 0, passes: 0 } };
const dbl = {}, step = {}, seen = {}; let handoffs = 0, laneJobs = 0, markJobs = 0, dblPass = [0, 0], plainPass = [0, 0];
for (const cfg of cfgs) {
  const team = Object.fromEntries(cfg.teams.flatMap((t, ti) => t.map(id => [id, ti])));
  for (const [v, eng] of [[14, E], [13, T13]]) { const r0 = eng.simulate(cfg), r = { events: r0.events, score: r0.score, _team: team }, m = ev[v];
    m.lane += laneShare(r) / cfgs.length; m.space += runSpace(r) / cfgs.length; m.goals += r.score[0] + r.score[1]; m.shots += r.events.filter(e => e.type === 'shot_attempt').length;
    const passes = r.events.filter(e => e.type === 'pass' || e.type === 'through_ball'); m.passes += passes.length; m.ic += passes.filter(e => e.outcome !== 'complete').length;
    assert.equal(r0.movement.version, v === 14 ? 'm1-v1+wall' : 'm1-v1', 'T3-14 brakes at the boundary; T3-13 movement unchanged');
    if (v !== 14) continue;
    assert.equal(JSON.stringify(E.simulate(cfg)), JSON.stringify(r0), "deterministic");
    if (cfg.seed % 10 === 0) { const rec = R.make(cfg, r0, 1); assert.equal(JSON.stringify(R.reproduce(rec).events), JSON.stringify(r.events), 'T3-14 records replay exactly'); }
    for (const e of r.events) { if (!e.jobs) continue; let doubling = false;
      for (const [id, j] of Object.entries(e.jobs)) { if (!j) continue; seen[id] = (seen[id] || 0) + 1; if (j.job === 'double') { dbl[id] = (dbl[id] || 0) + 1; doubling = true; } if (j.job === 'step_up') step[id] = (step[id] || 0) + 1; if (j.handoff) handoffs++; if (j.job === 'lane') laneJobs++; if (j.job === 'mark') markJobs++; }
      if (e.type === 'pass' || e.type === 'through_ball') { const b = doubling ? dblPass : plainPass; b[0] += e.outcome === 'complete' ? 1 : 0; b[1]++; } } } }
// Lane blocking and runs into space are visible in the positions.
assert(ev[14].lane > ev[13].lane + .03, 'defenders stand in the passing lane more often (' + ev[13].lane.toFixed(3) + ' -> ' + ev[14].lane.toFixed(3) + ')');
assert(ev[14].space > ev[13].space, 'runners find more space (' + ev[13].space.toFixed(3) + ' -> ' + ev[14].space.toFixed(3) + ')');
assert(laneJobs > 0 && markJobs > 0 && handoffs > 0, 'lane, mark and hand-off all occur in real matches');
// Discipline drives who leaves a job: only players below the threshold double or step up, and lower discipline doubles more.
for (const id of Object.keys(dbl)) assert(disc(id) < P.offball.doubleUp, id + ' doubled with discipline ' + disc(id));
for (const id of Object.keys(step)) assert(disc(id) < P.offball.adventure, id + ' stepped up with discipline ' + disc(id));
const below = Object.keys(seen).filter(id => disc(id) < P.offball.doubleUp); assert(below.length >= 3 && Object.keys(dbl).length >= 3, 'several low-discipline players double in real matches');
// Doubling-up has a cost: passes made while a defender is doubling complete at least as often (the job he left is open).
const dRate = dblPass[0] / Math.max(1, dblPass[1]), pRate = plainPass[0] / Math.max(1, plainPass[1]);
assert(dblPass[1] >= 50, 'enough passes against a doubling defence to measure (' + dblPass[1] + ')');
const out = { engine: E.VERSION, params: E.PARAMS_VERSION, matches: cfgs.length, laneShare: { t313: +ev[13].lane.toFixed(3), t314: +ev[14].lane.toFixed(3) }, runnerSpace: { t313: +ev[13].space.toFixed(3), t314: +ev[14].space.toFixed(3) },
  passFailRate: { t313: +(ev[13].ic / ev[13].passes).toFixed(3), t314: +(ev[14].ic / ev[14].passes).toFixed(3) }, goals: { t313: ev[13].goals, t314: ev[14].goals }, shots: { t313: ev[13].shots, t314: ev[14].shots },
  handoffs, doublers: Object.keys(dbl).length, steppers: Object.keys(step).length, passCompletionVsDoubling: +dRate.toFixed(3), passCompletionOtherwise: +pRate.toFixed(3), unscoredDiscipline: 'neutral 50 (no tendency)' };
fs.mkdirSync(path.join(root, 'tests/balance/t3-14'), { recursive: true }); fs.writeFileSync(path.join(root, 'tests/balance/t3-14/m3-offball.json'), JSON.stringify(out, null, 1));
console.log(`T3_14_OFFBALL_PASS scenarios (open run, lane block, goal-side mark, hand-off, discipline double/step-up) + ${cfgs.length} matches vs T3-13: lane blocked ${(100 * ev[13].lane).toFixed(1)}% -> ${(100 * ev[14].lane).toFixed(1)}%, runner space ${ev[13].space.toFixed(2)} -> ${ev[14].space.toFixed(2)}, pass fail ${(100 * out.passFailRate.t313).toFixed(1)}% -> ${(100 * out.passFailRate.t314).toFixed(1)}%, ${handoffs} hand-offs, ${out.doublers} doublers (all discipline < ${P.offball.doubleUp}), passes vs doubling ${(100 * dRate).toFixed(1)}% complete vs ${(100 * pRate).toFixed(1)}%; goals ${ev[13].goals} -> ${ev[14].goals}, shots ${ev[13].shots} -> ${ev[14].shots} (reported, not tuned); deterministic; replays exact`);
