'use strict';
// David Luiz (owner approved 2026-11-01): in the draft roster with exactly the approved profile, OVR 84 from the formula, and playable.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const P = JSON.parse(read('proposals/david-luiz-recruitment-proposal.json'));
assert(/OWNER APPROVED 2026-11-01/.test(P.status), 'approved proposal');
for (const page of ['draft.html', 'public/draft.html']) assert(read(page).includes('src/david-luiz-recruitment-v1.js'), page + ' loads David Luiz');
const scripts = [...read('draft.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m => m[1]);
const c = { window: { location: { search: '' } } }; vm.createContext(c);
for (const f of scripts) { vm.runInContext(read(f), c, { filename: f }); if (f === 'src/replay/records.js') break; }
const W = c.window, ps = W.THE_CAGE_PLAYERS, p = ps.find(x => x.id === 'david-luiz');
assert.equal(ps.length, 217, 'roster 217');
assert(p, 'David Luiz in the roster');
for (const k of ['name', 'country', 'role', 'position', 'peak', 'careerTier']) assert.equal(p[k], P.player[k], k);
assert.equal(JSON.stringify(p.r), JSON.stringify(P.player.r), 'approved ratings exactly');
assert.equal(JSON.stringify(p.traits), JSON.stringify(P.player.traits), 'Libero/Architect');
assert.equal(W.CageOverall.read(p), 84, 'OVR 84'); assert(!(p.id in W.CageOverall.REVIEW_OVERRIDES), 'no override');
const E = W.CageEngine, G = W.CageGoalkeepers.players; assert(E.BY_ID['david-luiz'], 'engine knows David Luiz');
const cfg = { teams: [['david-luiz', 'andrea-pirlo', 'thierry-henry'], ['paolo-maldini', 'kaka', 'ronaldo-nazario']], tactics: ['balanced', 'balanced'], keepers: [G[0].id, G[1].id], seed: 2026, mode: 'score', traits: { enabled: true }, rules: { pressure: 'defender-quality-v1' } };
const ids = new Set(E.ROSTER.map(x => x.id)); cfg.teams = cfg.teams.map(t => t.map((id, i) => ids.has(id) ? id : E.ROSTER[i + 10].id));
const r = E.simulate(cfg), again = E.simulate(cfg);
assert(r.events.some(e => e.actor === 'david-luiz'), 'David Luiz takes part'); assert.equal(again.eventHash, r.eventHash, 'deterministic');
console.log('DAVID_LUIZ_PASS roster 217, approved profile exactly, ELITE Libero/Architect, OVR 84 (formula, no override), plays deterministic matches');
