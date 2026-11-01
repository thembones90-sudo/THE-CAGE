'use strict';
// T3-13 decision telemetry must be PASSIVE: stripping step/targets/decision from every T3-13 event
// must reproduce T3-12 exactly (same events, score, winner, duration and RNG draw count).
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { CURRENT_ENGINE } = require('./baseline-current.cjs');
const root = path.resolve(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const scripts = [...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m => m[1]);
const c = { window: { location: { search: '' } } }; vm.createContext(c);
for (const f of scripts) { vm.runInContext(read(f), c, { filename: f }); if (f === 'src/replay/records.js') break; }
const W = c.window, E = W.CageEngine, OLD = W.CAGE_ENGINE_REGISTRY['cage-t3-12'], R = W.CageRecords, G = W.CageGoalkeepers.players;
assert.equal(E.VERSION, CURRENT_ENGINE); assert.equal(E.VERSION, 'cage-t3-13'); assert(OLD && OLD.VERSION === 'cage-t3-12', 'frozen T3-12 must be registered for replay');
const ids = E.ROSTER.map(p => p.id), tactics = ['balanced', 'press', 'possession', 'counter'];
const strip = ev => ev.map(e => { const { step, targets, decision, ...rest } = e; return rest; });
let n = 0, passiveChecked = 0, decisions = 0, actionsWithDecision = 0, shotNowChecked = 0;
const DECISION_EVENTS = new Set(['carry', 'dribble_duel', 'wall_pass', 'press', 'pass', 'through_ball', 'shot_attempt']);
for (let k = 0; k < 160; k++) {
  const t = []; for (let m = 0; t.length < 6; m++) { const id = ids[(k * 37 + m * 29) % ids.length]; if (!t.includes(id)) t.push(id); }
  const keepers = k % 3 ? [G[k % 50].id, G[(k * 7 + 3) % 50].id].filter((x, i, a) => a.indexOf(x) === i) : null;
  const cfg = { teams: [t.slice(0, 3), t.slice(3)], tactics: [tactics[k % 4], tactics[(k >> 2) % 4]], seed: (k * 2654435761 + 99) >>> 0, mode: keepers && keepers.length === 2 ? 'score' : (k % 2 ? 'score' : 'ko'), ...(k % 5 !== 0 ? { traits: { enabled: true } } : {}), ...(keepers && keepers.length === 2 ? { keepers } : {}) };
  const a = E.simulate(cfg), b = OLD.simulate(cfg); n++;
  // 1. passive: identical football
  // Without keepers, T3-13 football is unchanged; with keepers it differs by design (owner decision 3: style-based keeper decisions).
  if (!cfg.keepers) { passiveChecked++;
  assert.equal(JSON.stringify(strip(a.events)), JSON.stringify(b.events), 'T3-13 minus telemetry must equal T3-12 without keepers (config ' + k + ')');
  for (const key of ['score', 'winner', 'duration', 'draws']) assert.equal(JSON.stringify(a[key]), JSON.stringify(b[key]), key + ' differs (config ' + k + ')'); }
  // 2. telemetry integrity
  let lastStep = -1; const team = [new Set(cfg.teams[0]), new Set(cfg.teams[1])];
  for (const e of a.events) {
    assert(Number.isInteger(e.step) && e.step >= lastStep, 'step must be a non-decreasing integer'); lastStep = e.step;
    assert.equal(Object.keys(e.targets).length, 6, 'six movement targets');
    for (const v of Object.values(e.targets)) assert(v === null || (Number.isInteger(v.x) && v.x >= 0 && v.x <= 3 && Number.isInteger(v.y) && v.y >= 0 && v.y <= 2), 'target cell in grid');
    if (e.decision) {
      decisions++; const d = e.decision;
      assert(DECISION_EVENTS.has(e.type), 'decision only on action events');
      assert(Object.hasOwn(d.options, d.chosen), 'chosen action must be one of the options');
      assert(d.chosenShare > 0 && d.chosenShare <= 1, 'chosen share in (0,1]');
      assert(Object.hasOwn(d.options, d.mostLikely), 'most likely option listed');
      const side = e.type === 'press' ? 1 - e.team : e.team;
      for (const id of d.situation.freeMatesAhead) assert(team[side].has(id), 'free mate belongs to the attacking side');
      if (d.situation.bestReceiver) assert(team[side].has(d.situation.bestReceiver.id), 'best receiver belongs to the attacking side');
      if (d.x >= 2) { assert(d.situation.shotNow > 0 && d.situation.shotNow < 1, 'shot estimate available from x>=2'); shotNowChecked++; } else assert.equal(d.situation.shotNow, null);
      if (e.type === 'shot_attempt') assert.equal(d.chosen, 'shoot');
    }
    if (DECISION_EVENTS.has(e.type) && e.decision) actionsWithDecision++;
  }
  // 3. determinism and replay
  if (k % 8 === 0) { const again = E.simulate(cfg); assert.equal(again.eventHash, a.eventHash, 'deterministic');
    const rec = R.make(cfg, a, 1); assert.equal(R.reproduce(rec).eventHash, a.eventHash, 'T3-13 record replays');
    assert.equal(rec.engineVersion, 'cage-t3-13'); }
}
assert(decisions > 1000 && shotNowChecked > 100, 'telemetry must actually be produced');
assert(passiveChecked >= 40, 'enough no-keeper configs');
console.log(`T3_13_TELEMETRY_PASS ${n} configs: telemetry is passive (${passiveChecked} no-keeper configs identical to T3-12 when stripped: events, score, winner, duration, draws), ${decisions} decisions logged, ${shotNowChecked} shot estimates, step/targets on every event, records replay`);
