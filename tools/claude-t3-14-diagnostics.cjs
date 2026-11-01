#!/usr/bin/env node
// THE CAGE T3-14 diagnostic suite (Claude). READ-ONLY: runs the live play.html engine in a VM.
// Controlled football experiments with per-team and per-player telemetry taken only from recorded events.
//   node tools/claude-t3-14-diagnostics.cjs [--pairs 25] [--json out.json] [--only named|h2h|comp]
// Design: every seed is played in BOTH orientations (a "pair"); the pair, not the match, is the sample unit.
// Both sides use the same matched goalkeeper pair, which swaps with the orientation, so keeper strength cancels.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const PAIRS = +opt('--pairs', 25), ONLY = opt('--only', null);

const html = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
const list = scripts.slice(0, scripts.indexOf('src/cage-commentary.js')).filter(s => !/identity\/search/.test(s));
const window = { location: { search: '' } };
const ctx = vm.createContext({ window, console, Math, Object, Array, Error, TypeError, RangeError, JSON, Number, String, Set, Map, WeakMap, Symbol, Boolean, Uint32Array, Int32Array, Float64Array });
for (const s of list) vm.runInContext(fs.readFileSync(path.join(ROOT, s), 'utf8'), ctx, { filename: s });
const E = window.CageEngine, GK = window.CageGoalkeepers, GR = window.CageGoalkeeperRules, BY = E.BY_ID;
const TACTICS = ['balanced', 'press', 'possession', 'counter'];
// Matched keeper pair: the two keepers whose shot-stopping composites are closest to the reference (88).
const kp = GK.players.map(g => [g.id, Math.abs(GR.score(g, 'box') - GR.REFERENCE)]).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).slice(0, 2).map(x => x[0]);
const SEEDS = Array.from({ length: PAIRS }, (_, i) => (0x5eed0000 + i * 7919) >>> 0);

const T = (...ids) => ids;
const NAMED = {
  'Beckenbauer+R.Carlos+Maldini': T('franz-beckenbauer', 'roberto-carlos', 'paolo-maldini'),
  'Zidane+Kaka+Ballack': T('zinedine-zidane', 'kaka', 'michael-ballack'),
  'Maldini+Ballack+R9': T('paolo-maldini', 'michael-ballack', 'ronaldo-nazario'),
  'Maldini+Cristiano+R9': T('paolo-maldini', 'cristiano-ronaldo', 'ronaldo-nazario'),
  'Pirlo+Maldini+R9': T('andrea-pirlo', 'paolo-maldini', 'ronaldo-nazario'),
  'Ronaldinho+Riquelme+Berbatov': T('ronaldinho', 'juan-roman-riquelme', 'dimitar-berbatov'),
  'Gattuso+Makelele+Kante': T('gennaro-gattuso', 'claude-makelele', 'ngolo-kante'),
  'Pirlo+Gattuso+Lewandowski': T('andrea-pirlo', 'gennaro-gattuso', 'robert-lewandowski'),
  'Pirlo+XabiAlonso+Lewandowski': T('andrea-pirlo', 'xabi-alonso', 'robert-lewandowski'),
  'Makelele+Ballack+Drogba': T('claude-makelele', 'michael-ballack', 'didier-drogba'),
};
// Fixed control opponents: four mixed trios of roster-median quality with no named player above.
const CONTROLS = {
  'ctrl-DMF': T('ledley-king', 'tugay-kerimoglu', 'gabriel-batistuta'),
  'ctrl-DDF': T('jaap-stam', 'sinisa-mihajlovic', 'obafemi-martins'),
  'ctrl-MMF': T('steed-malbranque', 'morten-gamst-pedersen', 'nani'),
  'ctrl-DMM': T('lucio', 'daniele-de-rossi', 'robert-pires'),
};
const H2H = [
  ['Maldini+Cristiano+R9', 'Makelele+Ballack+Drogba'],
  ['Ronaldinho+Riquelme+Berbatov', 'Gattuso+Makelele+Kante'],
  ['Pirlo+Maldini+R9', 'Gattuso+Makelele+Kante'],
  ['Beckenbauer+R.Carlos+Maldini', 'Zidane+Kaka+Ballack'],
];

function blankTeam() { return { pairs: 0, pairWins: 0, pairSplits: 0, matches: 0, wins: 0, gf: 0, ga: 0, poss: 0, shots: 0, blocked: 0, xg: 0, xgN: 0, goals: 0, passes: 0, passOk: 0, fwdPasses: 0, through: 0, throughOk: 0, keyPasses: 0, recoveries: 0, pressWon: 0, pressFail: 0, drib: 0, dribOk: 0, lost: 0, lostDanger: 0, coverFail: 0, counters: 0, counterGoals: 0, rotations: 0, gkDist: 0, gkDistOk: 0, gkSweeps: 0, gkSaves: 0, chasingShare: [0, 0], leadingShare: [0, 0], betterAlt: 0, shotsEdgeWithFreeMate: 0, players: {} }; }
function P(team, id) { return team.players[id] || (team.players[id] = { shots: 0, goals: 0, xg: 0, blocked: 0, passes: 0, passOk: 0, keyPasses: 0, assists: 0, recoveries: 0, dribOk: 0, drib: 0, lost: 0 }); }

// Accumulate one match into side stats. `me` = engine team index of the side under study.
function absorb(S, r, me, oppKey) {
  S.matches++; if (r.winner === me) S.wins++;
  S.gf += r.score[me]; S.ga += r.score[1 - me];
  let cur = null, possX = 0, lastPass = null, prev = null;
  for (let n = 0; n < r.events.length; n++) {
    const e = r.events[n]; if (e.team === undefined) { prev = e; continue; }
    const mine = e.team === me, scoreNow = r.events.slice(0, n).reduce((acc, x) => { if (x.type === 'goal') acc[x.team]++; return acc; }, [0, 0]);
    if (e.type === 'restart' || e.type === 'turnover' || (e.type === 'rebound' && e.outcome === 'defence_clears') || (e.type === 'gk_distribution' && e.team !== cur)) {
      if (e.team !== cur || e.type !== 'gk_distribution') { cur = e.team; lastPass = null; if (mine) { S.poss++; if (e.transition) S.counters++; } }
      if (e.type === 'turnover') {
        if (mine) { S.recoveries++; P(S, e.actor).recoveries++; }
        else { // we lost the ball: blame the previous carrier
          const loser = prev && prev.team === me ? prev.actor : null; S.lost++; if (loser) P(S, loser).lost++;
          if ((e.calc?.lossZone ?? 3) <= 1) S.lostDanger++;
          if ((e.tags || []).includes('rest_defence_exposed')) S.coverFail++;
        }
      }
    }
    if (mine) {
      // match-state adaptation: share of our attacking actions taken by players committed forward, by score state
      if (['carry', 'pass', 'through_ball', 'dribble_duel', 'wall_pass', 'shot_attempt'].includes(e.type) && e.calc?.commitment) {
        const ours = Object.entries(e.calc.commitment).filter(([id, v]) => (r._teams[me] || []).includes(id));
        const share = ours.filter(([, v]) => v).length / 3;
        const diff = scoreNow[me] - scoreNow[1 - me];
        if (diff < 0) { S.chasingShare[0] += share; S.chasingShare[1]++; } else if (diff > 0) { S.leadingShare[0] += share; S.leadingShare[1]++; }
      }
      switch (e.type) {
        case 'pass': case 'through_ball': {
          S.passes++; P(S, e.actor).passes++;
          if (e.type === 'through_ball') S.through++;
          if (e.to && e.zone && e.to.x > e.zone.x) S.fwdPasses++;
          if (e.outcome === 'complete') { S.passOk++; P(S, e.actor).passOk++; if (e.type === 'through_ball') S.throughOk++; lastPass = { from: e.actor, to: e.target, n }; }
          // decision audit: a normal pass to a team-mate NOT ahead while a team-mate ahead stood in a cell with no opponent
          if (e.type === 'pass' && prev?.positions && e.to && e.zone && e.to.x <= e.zone.x) {
            const ours = r._teams[me], theirs = r._teams[1 - me], pos = prev.positions, ori = q => me === 0 ? pos[q].x : 3 - pos[q].x;
            const free = ours.filter(q => q !== e.actor && ori(q) > e.zone.x && !theirs.some(o => pos[o].x === pos[q].x && pos[o].y === pos[q].y));
            if (free.length) S.betterAlt++;
          }
          break;
        }
        case 'shot_attempt': {
          S.shots++; P(S, e.actor).shots++;
          if (lastPass && lastPass.to === e.actor) { S.keyPasses++; P(S, lastPass.from).keyPasses++; }
          if (e.zone?.x === 2 && e.positions) { // shot from distance while a team-mate stands unmarked in the box
            const ours = r._teams[me], theirs = r._teams[1 - me], pos = e.positions, boxX = me === 0 ? 3 : 0;
            if (ours.some(q => q !== e.actor && pos[q].x === boxX && !theirs.some(o => pos[o].x === pos[q].x && pos[o].y === pos[q].y))) S.shotsEdgeWithFreeMate++;
          }
          lastPass = null; break;
        }
        case 'goal': S.goals++; P(S, e.actor).goals++; if (e.assist) P(S, e.assist).assists++; S.xg += e.p; S.xgN++; P(S, e.actor).xg += e.p; if (e.transition) S.counterGoals++; break;
        case 'gk_save': case 'gk_parry': case 'shot_miss': S.xg += e.p; S.xgN++; P(S, e.actor).xg += e.p; break;
        case 'dribble_duel': case 'wall_pass': S.drib++; P(S, e.actor).drib++; if (e.outcome === 'attacker_wins' || e.outcome === 'fouled') { S.dribOk++; P(S, e.actor).dribOk++; } break;
        case 'rotation': S.rotations++; break;
        case 'gk_distribution': S.gkDist++; if (e.outcome === 'complete') S.gkDistOk++; break;
      }
    } else {
      if (e.type === 'block') { /* blocked shot of ours is logged with team = blocker */ }
      if (e.type === 'press') { if (e.outcome === 'ball_won') S.pressWon++; else S.pressFail++; }
      if (e.type === 'gk_sweep' && e.outcome === 'cleared') S.gkSweeps++;
      if (e.type === 'gk_save' || e.type === 'gk_parry') S.gkSaves++;
    }
    if (e.type === 'block' && e.team !== me) { S.blocked++; P(S, e.opp).blocked++; }
    if (e.type === 'press' && e.team === me) { /* our pressing: counted under the opponent's absorb */ }
    prev = e;
  }
}
function play(A, B, ta, tb, seed) {
  const out = [];
  for (const swap of [0, 1]) {
    const teams = swap ? [B, A] : [A, B], tactics = swap ? [tb, ta] : [ta, tb], keepers = swap ? [kp[1], kp[0]] : [kp[0], kp[1]];
    const r = E.simulate({ teams, tactics, keepers, seed, mode: 'score', traits: { enabled: true } });
    out.push({ r: Object.assign({ _teams: teams }, r), me: swap ? 1 : 0 });
  }
  return out;
}
// SA/SB may be a single stats object or an array of sinks (e.g. per-tactic and overall).
function runMatchup(A, B, ta, tb, SA, SB) {
  const as = [].concat(SA), bs = [].concat(SB);
  for (const seed of SEEDS) {
    const pair = play(A, B, ta, tb, seed); let wa = 0;
    for (const { r, me } of pair) { as.forEach(S => absorb(S, r, me)); bs.forEach(S => absorb(S, r, 1 - me)); if (r.winner === me) wa++; }
    for (const S of as) { S.pairs++; if (wa === 2) S.pairWins++; else if (wa === 1) S.pairSplits++; }
    for (const S of bs) { S.pairs++; if (wa === 0) S.pairWins++; else if (wa === 1) S.pairSplits++; }
  }
}
function summary(S) {
  const f = (a, b, d = 2) => b ? +(a / b).toFixed(d) : null, top = Object.entries(S.players);
  return {
    pairs: S.pairs, winPct: f(100 * S.wins, S.matches, 1), pairWinPct: f(100 * S.pairWins, S.pairs, 1), pairSplitPct: f(100 * S.pairSplits, S.pairs, 1),
    gf: f(S.gf, S.matches), ga: f(S.ga, S.matches), shotsPerMatch: f(S.shots, S.matches, 1), xgPerShot: f(S.xg, S.xgN, 3), conv: f(S.goals, S.shots, 3), blockedPct: f(100 * S.blocked, S.shots, 1),
    passPct: f(100 * S.passOk, S.passes, 1), fwdPassPct: f(100 * S.fwdPasses, S.passes, 1), throughPerMatch: f(S.through, S.matches, 1), throughOkPct: f(100 * S.throughOk, S.through, 1), keyPassesPerMatch: f(S.keyPasses, S.matches, 2),
    recoveriesPerMatch: f(S.recoveries, S.matches, 1), pressWonPct: f(100 * S.pressWon, S.pressWon + S.pressFail, 1), dribOkPct: f(100 * S.dribOk, S.drib, 1), lostPerMatch: f(S.lost, S.matches, 1), lostDangerPct: f(100 * S.lostDanger, S.lost, 1),
    coverFailPerMatch: f(S.coverFail, S.matches, 2), counterPossPct: f(100 * S.counters, S.poss, 1), counterGoalPct: f(100 * S.counterGoals, S.goals, 1), rotationsPerMatch: f(S.rotations, S.matches, 2),
    gkDistOkPct: f(100 * S.gkDistOk, S.gkDist, 1), committedShareChasing: f(S.chasingShare[0], S.chasingShare[1], 3), committedShareLeading: f(S.leadingShare[0], S.leadingShare[1], 3),
    recyclePassWithFreeForwardMatePct: f(100 * S.betterAlt, S.passes, 1), edgeShotsWithFreeMateInBoxPct: f(100 * S.shotsEdgeWithFreeMate, S.shots, 1),
    players: Object.fromEntries(top.map(([id, p]) => [id, { shots: f(p.shots, S.matches), goals: f(p.goals, S.matches), xgPerShot: f(p.xg, p.shots, 3), passPct: f(100 * p.passOk, p.passes, 1), passes: f(p.passes, S.matches, 1), keyPasses: f(p.keyPasses, S.matches, 2), assists: f(p.assists, S.matches, 2), recoveries: f(p.recoveries, S.matches, 2), dribOkPct: f(100 * p.dribOk, p.drib, 1), lost: f(p.lost, S.matches, 2) }])),
  };
}
const out = { engine: E.VERSION, params: E.PARAMS_VERSION, keepers: kp, pairsPerCell: PAIRS, seeds: [SEEDS[0], SEEDS.at(-1)], named: {}, h2h: {}, comp: null };
if (!ONLY || ONLY === 'named') for (const [name, ids] of Object.entries(NAMED)) {
  const S = blankTeam(), byTactic = {};
  for (const ta of TACTICS) { const St = blankTeam(); for (const ctrl of Object.values(CONTROLS)) runMatchup(ids, ctrl, ta, 'balanced', [St, S], blankTeam()); byTactic[ta] = summary(St).winPct; }
  out.named[name] = { ids, vsControls: summary(S), winPctByTactic: byTactic };
  process.stderr.write('named ' + name + '\n');
}
if (!ONLY || ONLY === 'h2h') for (const [a, b] of H2H) {
  const grid = {}; const SA = blankTeam(), SB = blankTeam();
  for (const ta of TACTICS) for (const tb of TACTICS) { const sa = blankTeam(); runMatchup(NAMED[a], NAMED[b], ta, tb, [sa, SA], SB); grid[ta + ' v ' + tb] = summary(sa).winPct; }
  out.h2h[a + ' vs ' + b] = { grid, A: summary(SA), B: summary(SB) };
  process.stderr.write('h2h ' + a + ' vs ' + b + '\n');
}
if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out.named)) console.log(k.padEnd(30), 'win', v.vsControls.winPct, 'byTactic', JSON.stringify(v.winPctByTactic), 'gf', v.vsControls.gf, 'ga', v.vsControls.ga, 'xg/shot', v.vsControls.xgPerShot, 'pass%', v.vsControls.passPct, 'lostDanger%', v.vsControls.lostDangerPct);
for (const [k, v] of Object.entries(out.h2h)) console.log(k, 'A win', v.A.winPct, 'pairWin', v.A.pairWinPct, 'split', v.A.pairSplitPct, JSON.stringify(v.grid));
