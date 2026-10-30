#!/usr/bin/env node
// THE CAGE — possession anatomy (Claude-owned research tool). Explains HOW a matchup is won, from event logs.
// Usage: node tools/claude-anatomy.cjs --a id,id,id --b id,id,id [--ta balanced] [--tb balanced] [--n 3000] [--engine path] [--json out]
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const ENGINE = opt('--engine', path.join(ROOT, 'src', 'cage-engine.js'));
function load(enginePath) {
  const window = {}, ctx = vm.createContext({ window, console, Math, Object, Array, Error, TypeError, JSON, Number, String, Set, Map, Symbol, Boolean });
  for (const f of [path.join(ROOT, 'src', 'players.js'), path.join(ROOT, 'src', 'roster-expansion.js'), enginePath]) if (fs.existsSync(f)) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  return { E: window.CageEngine, P: window.THE_CAGE_PLAYERS };
}
const { E, P } = load(ENGINE);
const fold = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const find = s => { const p = P.find(q => q.id === s) || P.find(q => fold(q.name).includes(fold(s))); if (!p) throw Error('no player ' + s); return p.id; };
const A = opt('--a').split(',').map(find), B = opt('--b').split(',').map(find);
const TA = opt('--ta', 'balanced'), TB = opt('--tb', 'balanced'), N = +opt('--n', 3000);
const short = id => P.find(p => p.id === id).name.split(' ').slice(-1)[0];

function anatomy(seedBase) {
  const S = [0, 1].map(() => ({ poss: 0, starts: {}, ends: {}, lostZone: [0, 0, 0, 0], reach2: 0, reach3: 0, shots: 0, shotP: 0, blocked: 0, goals: 0, oneVone: 0, scramble: 0, fk: 0,
    duels: 0, duelWon: 0, sup: 0, help: 0, overload: 0, helpDef: 0, passes: 0, passOk: 0, through: 0, throughOk: 0, cpWon: 0, cpTry: 0, initiator: {}, shooter: {}, scorer: {},
    goalAfterHighLoss: 0, highLosses: 0, goalKinds: {}, transGoals: 0, deltaAtShot: 0, actions: 0, wins: 0, dur: 0 }));
  let caps = 0;
  for (let k = 0; k < N; k++) {
    const swap = k % 2; let r;
    try { r = E.simulate({ teams: swap ? [B, A] : [A, B], tactics: swap ? [TB, TA] : [TA, TB], seed: (seedBase + k * 2654435761) >>> 0, mode: 'ko' }); } catch (e) { caps++; continue; }
    const side = t => swap ? 1 - t : t; // map engine side -> A(0)/B(1)
    if (r.winner >= 0) S[side(r.winner)].wins++;
    let cur = null, curTeam = null, maxX = 0, firstActor = null, lostHighBy = null;
    const endPoss = (why) => { if (cur === null) return; const s = S[curTeam]; s.ends[why] = (s.ends[why] || 0) + 1; if (maxX >= 2) s.reach2++; if (maxX >= 3) s.reach3++; cur = null; };
    for (const e of r.events) {
      if (e.team === undefined) continue;
      const tm = side(e.team);
      const starts = e.type === 'restart' || e.type === 'turnover' || (e.type === 'rebound' && e.outcome === 'defence_clears');
      if (starts) {
        if (e.type === 'turnover') { endPoss(e.how + '@x' + (3 - e.zone.x)); S[1 - tm].lostZone[3 - e.zone.x]++; if (3 - e.zone.x >= 2) { S[1 - tm].highLosses++; lostHighBy = 1 - tm; } else lostHighBy = null; }
        else if (e.type === 'rebound') { endPoss('shot_cleared'); lostHighBy = null; } else { endPoss('restart'); lostHighBy = null; }
        cur = 1; curTeam = tm; maxX = e.zone ? e.zone.x : 0; firstActor = null; const s = S[tm]; s.poss++; const st = e.type === 'turnover' ? e.how : e.type; s.starts[st] = (s.starts[st] || 0) + 1;
        continue;
      }
      if (curTeam === null) continue;
      const s = S[tm];
      if (tm === curTeam) {
        if (e.zone) maxX = Math.max(maxX, e.zone.x); if (e.to) maxX = Math.max(maxX, e.to.x);
        if (['carry', 'pass', 'through_ball', 'dribble_duel', 'wall_pass', 'shot_attempt'].includes(e.type)) { s.actions++; if (!firstActor) { firstActor = e.actor; s.initiator[short(e.actor)] = (s.initiator[short(e.actor)] || 0) + 1; } }
      }
      switch (e.type) {
        case 'pass': s.passes++; if (e.outcome === 'complete') s.passOk++; break;
        case 'through_ball': s.through++; if (e.outcome === 'complete') s.throughOk++; break;
        case 'dribble_duel': case 'wall_pass': if (e.outcome === 'fouled') break; s.duels++; if (e.outcome === 'attacker_wins') s.duelWon++; s.sup += e.support || 0; s.help += e.help || 0; if ((e.tags || []).includes('overload')) s.overload++; if ((e.tags || []).includes('help_defence')) S[1 - tm].helpDef++; break;
        case 'shot_attempt': s.shots++; s.shooter[short(e.actor)] = (s.shooter[short(e.actor)] || 0) + 1; if (e.kind === 'one_v_one') s.oneVone++; if (e.kind === 'scramble') s.scramble++; if (e.kind === 'fk') s.fk++; s.deltaAtShot += e.delta || 0; break;
        case 'goal': s.goals++; s.shotP += e.p; s.scorer[short(e.actor)] = (s.scorer[short(e.actor)] || 0) + 1; s.goalKinds[e.kind] = (s.goalKinds[e.kind] || 0) + 1; if (lostHighBy === 1 - tm) S[1 - tm].goalAfterHighLoss++; if (e.transition) s.transGoals++; break;
        case 'shot_miss': s.shotP += e.p; break;
        case 'block': S[1 - tm].blocked++; break;
        case 'press': if ((e.tags || []).includes('counter_press')) { s.cpTry++; if (e.outcome === 'ball_won') s.cpWon++; } break;
      }
    }
    for (const t of [0, 1]) S[t].dur += r.duration;
  }
  return { S, caps };
}
const { S, caps } = anatomy(12345);
const pc = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '—', f2 = (a, b) => b ? (a / b).toFixed(2) : '—';
const top = (o, n = 3) => { const t = Object.values(o).reduce((a, b) => a + b, 0) || 1; return Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => k + ' ' + (100 * v / t).toFixed(0) + '%').join(', '); };
const label = ['A ' + A.map(short).join('/') + ' (' + TA + ')', 'B ' + B.map(short).join('/') + ' (' + TB + ')'];
console.log(`Possession anatomy — engine ${path.relative(ROOT, ENGINE)}, ${N} matches (sides swapped), safety caps ${caps}`);
const rows = [
  ['Wins', s => pc(s.wins, N - caps)],
  ['Possessions / match', s => f2(s.poss, N - caps)],
  ['Reach opp half (x≥2)', s => pc(s.reach2, s.poss)],
  ['Reach opp box (x=3)', s => pc(s.reach3, s.poss)],
  ['Shots / possession', s => f2(s.shots, s.poss)],
  ['xG per shot attempt (blocked = 0)', s => f2(s.shotP, s.shots)],
  ['Own shots blocked', s => pc(s.blocked, s.shots)],
  ['Goals / possession', s => (s.goals / s.poss).toFixed(4)],
  ['One-v-one shots (no defender)', s => pc(s.oneVone, s.shots)],
  ['Pass completion', s => pc(s.passOk, s.passes)],
  ['Through balls completed', s => pc(s.throughOk, s.through)],
  ['Dribble/wall duels won', s => pc(s.duelWon, s.duels)],
  ['Mean support in own duels', s => f2(s.sup, s.duels)],
  ['Overload duels (2 support)', s => pc(s.overload, s.duels)],
  ['Mean help faced in own duels', s => f2(s.help, s.duels)],
  ['Losses in opp half (x≥2)', s => pc(s.highLosses, s.poss)],
  ['Conceded goal after losing it high', s => pc(s.goalAfterHighLoss, s.highLosses)],
  ['Counter-press won / tried', s => s.cpTry ? pc(s.cpWon, s.cpTry) + ' of ' + s.cpTry : '—'],
  ['Mean displacement at shot', s => f2(s.deltaAtShot, s.shots)],
];
console.log(''.padEnd(36) + label.map(l => l.slice(0, 34).padEnd(36)).join(''));
for (const [name, fn] of rows) console.log(name.padEnd(36) + [0, 1].map(t => String(fn(S[t], S[1 - t])).padEnd(36)).join(''));
for (const t of [0, 1]) {
  console.log(`\n${label[t]}`);
  console.log('  possession starts: ' + top(S[t].starts, 5));
  console.log('  possession ends:   ' + top(S[t].ends, 6));
  console.log('  losses by zone x0..x3: ' + S[t].lostZone.map(v => pc(v, S[t].lostZone.reduce((a, b) => a + b, 0))).join(' / '));
  console.log('  attack initiators: ' + top(S[t].initiator) + ' | shooters: ' + top(S[t].shooter) + ' | scorers: ' + top(S[t].scorer));
  console.log('  goal kinds: ' + top(S[t].goalKinds, 5) + ' | transition goals: ' + pc(S[t].transGoals, S[t].goals));
}
if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify({ A, B, TA, TB, N, caps, S }, null, 1));
