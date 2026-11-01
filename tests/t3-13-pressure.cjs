'use strict';
// T3-13 defender-quality shot pressure (switch rules.pressure='defender-quality-v1'): deterministic tests and
// evidence that Maldini, Ramos and Riquelme produce different defensive outcomes in comparable situations.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const scripts = [...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m => m[1]);
const c = { window: { location: { search: '' } } }; vm.createContext(c);
for (const f of scripts) { vm.runInContext(read(f), c, { filename: f }); if (f === 'src/replay/records.js') break; }
const W = c.window, E = W.CageEngine, R = W.CageRecords, G = W.CageGoalkeepers.players;
const RULES = { pressure: 'defender-quality-v1' };
// 1. The term: off = flat -0.6 for everyone; on = scaled by defending quality, bounded, never helping the shooter.
const DEF = ['paolo-maldini', 'sergio-ramos', 'juan-roman-riquelme'];
for (const id of DEF) assert.equal(E.shotPressure(id, false), -0.6);
const on = Object.fromEntries(DEF.map(id => [id, E.shotPressure(id, true)]));
assert(on['paolo-maldini'] < on['sergio-ramos'] && on['sergio-ramos'] < on['juan-roman-riquelme'], 'Maldini > Ramos > Riquelme in pressure');
for (const p of E.ROSTER) { const v = E.shotPressure(p.id, true); assert(v < 0 && v >= -0.6 * 1.8 - 1e-9 && v <= -0.6 * 0.3 + 1e-9, 'bounded and never positive: ' + p.id); }
// 2. Invalid switches are rejected; the switch is recorded and replays.
const ids = E.ROSTER.map(p => p.id);
assert.throws(() => E.simulate({ teams: [ids.slice(0, 3), ids.slice(3, 6)], tactics: ['balanced', 'balanced'], seed: 1, mode: 'ko', rules: { pressure: 'x' } }), /Unknown rules switch/);
// 3. Comparable situations: identical trio except the defender, identical opponents, seeds and keepers.
const MATES = ['michael-ballack', 'ronaldo-nazario'], OPP = ['thierry-henry', 'zinedine-zidane', 'didier-drogba'];
const KEEPERS = ['victor-valdes', 'ederson-moraes'];
const result = {};
for (const sw of ['off', 'on']) for (const X of DEF) {
  const S = { shots: 0, pSum: 0, goals: 0, matches: 0, conceded: 0, blocks: 0 };
  for (let k = 0; k < 120; k++) for (const swap of [0, 1]) {
    const teams = swap ? [OPP, [X, ...MATES]] : [[X, ...MATES], OPP], me = swap ? 1 : 0;
    const cfg = { teams, tactics: ['balanced', 'balanced'], keepers: swap ? [KEEPERS[1], KEEPERS[0]] : KEEPERS, seed: (k * 104729 + 31) >>> 0, mode: 'score', traits: { enabled: true }, ...(sw === 'on' ? { rules: RULES } : {}) };
    const r = E.simulate(cfg); S.matches++; S.conceded += r.score[1 - me];
    for (let i = 0; i < r.events.length; i++) {
      const e = r.events[i];
      if (e.type !== 'shot_attempt' || e.team === me || e.pressure !== X) continue; // opponent shot pressured by X
      if (sw === 'on') assert.equal(e.calc.pressureModel, 'defender-quality-v1', 'pressure model logged on the shot');
      const out = r.events.slice(i + 1, i + 4).find(x => ['goal', 'gk_save', 'gk_parry', 'shot_miss', 'block'].includes(x.type));
      if (!out) continue; S.shots++;
      if (out.type === 'block') { S.blocks++; continue; }
      S.pSum += out.p; if (out.type === 'goal') S.goals++;
    }
    if (k % 40 === 0) { const again = E.simulate(cfg); assert.equal(again.eventHash, r.eventHash, 'deterministic');
      const rec = R.make(cfg, r, 1); assert.equal(R.reproduce(rec).eventHash, r.eventHash, 'record with rules switch replays'); }
  }
  const unblocked = S.shots - S.blocks;
  result[sw + ':' + X] = { shotsUnderPressure: S.shots, meanGoalChance: +(S.pSum / unblocked).toFixed(4), goalsPerUnblockedShot: +(S.goals / unblocked).toFixed(3), concededPerMatch: +(S.conceded / S.matches).toFixed(2) };
}
const q = (sw, id) => result[sw + ':' + id].meanGoalChance;
// With the switch ON the quality of chances conceded under each defender's pressure follows defending quality.
assert(q('on', 'paolo-maldini') < q('on', 'juan-roman-riquelme') - 0.03, 'Maldini concedes clearly lower-quality chances than Riquelme');
assert(q('on', 'sergio-ramos') < q('on', 'juan-roman-riquelme') - 0.03, 'Ramos concedes clearly lower-quality chances than Riquelme');
// With the switch OFF the defender's identity does not change the shot's difficulty (only shooter and context differ).
const offSpread = Math.max(...DEF.map(id => q('off', id))) - Math.min(...DEF.map(id => q('off', id)));
const onSpread = q('on', 'juan-roman-riquelme') - q('on', 'paolo-maldini');
assert(onSpread > offSpread + 0.02, 'the switch creates the defender-dependent difference');
fs.mkdirSync(path.join(root, 'tests/balance/t3-13'), { recursive: true });
fs.writeFileSync(path.join(root, 'tests/balance/t3-13/pressure-evidence.json'), JSON.stringify({ engine: E.VERSION, rule: RULES, pressureTerm: on, trio: ['X', ...MATES], opponents: OPP, keepers: KEEPERS, seedsPerOrientation: 120, result }, null, 1));
console.log('T3_13_PRESSURE_PASS pressure term', JSON.stringify(Object.fromEntries(Object.entries(on).map(([k, v]) => [k, +v.toFixed(3)]))), '| mean goal chance conceded under pressure', JSON.stringify(Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.meanGoalChance]))));
