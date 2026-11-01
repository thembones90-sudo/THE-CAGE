#!/usr/bin/env node
// THE CAGE: decision-quality baseline from T3-13 telemetry (read-only). Reports, per named player,
// how choices relate to the logged situation. Usage: node tools/claude-decision-report.cjs [--pairs 20] [--json out]
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const PAIRS = +opt('--pairs', 20);
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8'), scripts = [...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m => m[1]);
const c = { window: { location: { search: '' } } }; vm.createContext(c);
for (const f of scripts) { vm.runInContext(read(f), c, { filename: f }); if (f === 'src/replay/records.js') break; }
const E = c.window.CageEngine, G = c.window.CageGoalkeepers.players;
if (E.VERSION !== 'cage-t3-13' && !E.VERSION.startsWith('cage-t3-1')) throw Error('needs decision telemetry (T3-13+)');
const TEAMS = [
  ['ronaldinho', 'juan-roman-riquelme', 'dimitar-berbatov'], ['gennaro-gattuso', 'claude-makelele', 'ngolo-kante'],
  ['andrea-pirlo', 'paolo-maldini', 'ronaldo-nazario'], ['franz-beckenbauer', 'roberto-carlos', 'nemanja-vidic'],
  ['cristiano-ronaldo', 'zlatan-ibrahimovic', 'xavi-hernandez'], ['michael-ballack', 'didier-drogba', 'sergio-ramos'],
];
const P = {};
const get = id => P[id] || (P[id] = { n: 0, shoot: 0, goodChance: 0, goodChanceShot: 0, freeAhead: 0, freeAheadNotForward: 0, recycleWithFree: 0, poorShots: 0, shotsWithFreeBetter: 0, chosen: {} });
for (let a = 0; a < TEAMS.length; a++) for (let b = 0; b < TEAMS.length; b++) {
  if (a === b) continue;
  for (let s = 0; s < PAIRS; s++) {
    const cfg = { teams: [TEAMS[a], TEAMS[b]], tactics: ['balanced', 'balanced'], keepers: [G[3].id, G[4].id], seed: (s * 7919 + a * 31 + b) >>> 0, mode: 'score', traits: { enabled: true } };
    const r = E.simulate(cfg);
    for (const e of r.events) {
      if (!e.decision || e.type === 'press') continue;
      const d = e.decision, p = get(e.actor); p.n++; p.chosen[d.chosen] = (p.chosen[d.chosen] || 0) + 1;
      const sit = d.situation, forwardMove = ['through', 'outlet', 'carry', 'dribble', 'shoot', 'wall'].includes(d.chosen);
      if (d.chosen === 'shoot') { p.shoot++; if (sit.shotNow !== null && sit.shotNow < 0.12) p.poorShots++; if (sit.freeMatesAhead.length && sit.shotNow !== null && sit.shotNow < 0.2) p.shotsWithFreeBetter++; }
      if (sit.shotNow !== null && sit.shotNow >= 0.35) { p.goodChance++; if (d.chosen === 'shoot') p.goodChanceShot++; }
      if (sit.freeMatesAhead.length) { p.freeAhead++; if (!forwardMove) p.freeAheadNotForward++; if (d.chosen === 'pass') p.recycleWithFree++; }
    }
  }
}
const pct = (a, b) => b ? +(100 * a / b).toFixed(1) : null;
const rows = Object.entries(P).map(([id, p]) => ({ id, decisions: p.n, shootPct: pct(p.shoot, p.n), shotsWhenGoodChancePct: pct(p.goodChanceShot, p.goodChance), goodChances: p.goodChance, freeMateAheadIgnoredPct: pct(p.freeAheadNotForward, p.freeAhead), poorShotPct: pct(p.poorShots, p.shoot), lowValueShotsWithFreeMatePct: pct(p.shotsWithFreeBetter, p.shoot), chosen: p.chosen }));
rows.sort((x, y) => x.id.localeCompare(y.id));
console.log(`${E.VERSION}: ${PAIRS} seeds per ordered pairing of ${TEAMS.length} named trios (3+1, traits on, balanced)`);
console.log('player'.padEnd(22) + 'decisions'.padStart(10) + 'shoot%'.padStart(8) + 'shootWhenGood%'.padStart(16) + 'freeAheadIgnored%'.padStart(19) + 'poorShot%'.padStart(11));
for (const r of rows) console.log(r.id.padEnd(22) + String(r.decisions).padStart(10) + String(r.shootPct).padStart(8) + String(r.shotsWhenGoodChancePct).padStart(16) + String(r.freeMateAheadIgnoredPct).padStart(19) + String(r.poorShotPct).padStart(11));
if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify({ engine: E.VERSION, pairs: PAIRS, teams: TEAMS, players: rows }, null, 1));
