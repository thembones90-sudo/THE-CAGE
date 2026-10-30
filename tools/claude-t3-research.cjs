#!/usr/bin/env node
// THE CAGE — T3 research driver (Claude-owned). Builds flag variants of the T3 research copy and diagnoses matchups.
//   node tools/claude-t3-research.cjs --build D1,D4           -> work/t3-research/engine-D1+D4.js (prints path)
//   node tools/claude-t3-research.cjs --identity              -> no-flag research copy reproduces src/cage-engine.js event hashes
//   node tools/claude-t3-research.cjs --diag --flags D1 --a maldini,chiellini,thuram --b gravesen,stam,vidic [--ta balanced --tb balanced --n 2000]
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const SRC = path.join(ROOT, 'proposals', 't3-research', 'engine-t3-research.src.js');
function build(flagStr) {
  const flags = (flagStr || '').split(/[,+]/).filter(f => f && f !== 'none');
  const dir = path.join(ROOT, 'work', 't3-research'); fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'engine-' + (flags.join('+') || 'none') + '.js');
  fs.writeFileSync(out, 'var T3R_FLAGS=' + JSON.stringify(Object.fromEntries(flags.map(f => [f, true]))) + ';\n' + fs.readFileSync(SRC, 'utf8'));
  return out;
}
function load(enginePath) {
  const window = {}, ctx = vm.createContext({ window, console, Math, Object, Array, Error, TypeError, RangeError, JSON, Number, String, Set, Map, WeakMap, Symbol, Boolean });
  for (const f of [path.join(ROOT, 'src', 'players.js'), opt('--roster', path.join(ROOT, 'proposals', 't3-research', 'roster-expansion-63.js')), enginePath]) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  return { E: window.CageEngine, P: window.THE_CAGE_PLAYERS };
}
if (args.includes('--build')) { console.log(build(opt('--build', ''))); process.exit(0); }
if (args.includes('--identity')) {
  const a = load(path.join(ROOT, 'proposals', 't3-research', 'base-cage-t3-3.js')).E, b = load(build('')).E, ids = a.ROSTER.map(p => p.id); let diff = 0;
  for (let k = 0; k < 500; k++) {
    const pick = () => { const s = new Set(); let j = k * 7; while (s.size < 3) s.add(ids[(j = (j * 31 + 17 + s.size * 13) % ids.length)]); return [...s]; };
    const t1 = pick(), t2 = ids.filter(i => !t1.includes(i)).slice(k % 50, k % 50 + 3), cfg = { teams: [t1, t2], tactics: [['balanced', 'press', 'counter', 'possession'][k % 4], ['balanced', 'counter', 'press', 'possession'][(k >> 2) % 4]], seed: (k * 2654435761) >>> 0, mode: 'ko' };
    let ha, hb; try { ha = a.simulate(cfg).eventHash; } catch (e) { ha = 'cap'; } try { hb = b.simulate(cfg).eventHash; } catch (e) { hb = 'cap'; }
    if (ha !== hb) diff++;
  }
  console.log(diff ? `IDENTITY FAIL: ${diff}/500 differ` : 'IDENTITY PASS: 500/500 event hashes identical to the T3 snapshot (cage-t3-3, 7e14dbb)'); process.exit(diff ? 1 : 0);
}
// ---------- matchup diagnosis ----------
const ENGINE = opt('--engine') || build(opt('--flags', ''));
const { E, P } = load(ENGINE);
const fold = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const find = s => { const p = P.find(q => q.id === s) || P.find(q => fold(q.name).includes(fold(s))); if (!p) throw Error('no player ' + s); return p.id; };
const A = opt('--a').split(',').map(find), B = opt('--b').split(',').map(find), TA = opt('--ta', 'balanced'), TB = opt('--tb', 'balanced'), N = +opt('--n', 2000);
const blank = () => ({ wins: 0, poss: 0, reach2: 0, reach3: 0, shots: 0, shotsUncommitted: 0, blocked: 0, goals: 0, kinds: {}, goalKinds: {}, carryX2: 0, carryX2Unc: 0, unc2Shoot: 0, transPoss: 0, transGoals: 0, cutback: 0, cutbackOk: 0, corners: 0, exposed: 0, bypass: 0, bypassGoals: 0, pressWon: 0, pressTry: 0, passes: 0, passOk: 0, actions: {} });
const S = [blank(), blank()]; let caps = 0; const durs = [];
for (let k = 0; k < N; k++) {
  const swap = k % 2; let r;
  try { r = E.simulate({ teams: swap ? [B, A] : [A, B], tactics: swap ? [TB, TA] : [TA, TB], seed: (777 + k * 2654435761) >>> 0, mode: 'ko' }); } catch (e) { caps++; continue; }
  durs.push(r.duration); const side = t => swap ? 1 - t : t; if (r.winner >= 0) S[side(r.winner)].wins++;
  let cur = null, mx = 0, trans = false, byp = false;
  const close = () => { if (cur === null) return; if (mx >= 2) S[cur].reach2++; if (mx >= 3) S[cur].reach3++; };
  for (const e of r.events) {
    if (e.team === undefined) continue; const tm = side(e.team), s = S[tm];
    if (e.type === 'restart' || e.type === 'turnover' || (e.type === 'rebound' && e.outcome === 'defence_clears')) { close(); cur = tm; mx = e.zone ? e.zone.x : 0; trans = !!e.transition; byp = false; s.poss++; if (trans) s.transPoss++; if ((e.tags || []).includes('rest_defence_exposed')) S[1 - tm].exposed++; continue; }
    if (tm === cur && e.zone) mx = Math.max(mx, e.zone.x, e.to ? e.to.x : 0);
    const committed = e.calc && e.calc.commitment ? e.calc.commitment[e.actor] : undefined;
    if (['carry', 'pass', 'through_ball', 'dribble_duel', 'wall_pass', 'shot_attempt', 'press'].includes(e.type) && tm === cur && e.zone && e.zone.x >= 2 && e.type !== 'press') { s.carryX2++; if (committed === false) { s.carryX2Unc++; if (e.type === 'shot_attempt') s.unc2Shoot++; } }
    if ((e.tags || []).includes('press_bypassed')) { const bt = e.type === 'press' ? 1 - tm : tm; S[bt].bypass++; byp = true; }
    if (e.type === 'press' && tm !== cur) { s.pressTry++; if (e.outcome === 'ball_won') s.pressWon++; }
    if (tm === cur) s.actions[e.type] = (s.actions[e.type] || 0) + 1;
    switch (e.type) {
      case 'shot_attempt': s.shots++; s.kinds[e.kind] = (s.kinds[e.kind] || 0) + 1; if (committed === false) s.shotsUncommitted++; break;
      case 'block': S[1 - tm].blocked++; break;
      case 'goal': s.goals++; s.goalKinds[e.kind] = (s.goalKinds[e.kind] || 0) + 1; if (trans) s.transGoals++; if (byp) s.bypassGoals++; break;
      case 'pass': case 'through_ball': s.passes++; if (e.outcome === 'complete') s.passOk++; if ((e.tags || []).includes('cutback')) { s.cutback++; if (e.outcome === 'complete') s.cutbackOk++; } break;
      case 'corner': s.corners++; break;
    }
  }
  close();
}
durs.sort((a, b) => a - b); const q = p => durs.length ? Math.round(durs[Math.min(durs.length - 1, Math.floor(p * durs.length))]) : '—';
const pc = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '—', f = (a, b, d = 3) => b ? (a / b).toFixed(d) : '—';
const tot = durs.reduce((x, y) => x + y, 0) / 60 || 1;
console.log(`T3 research diag — ${E.VERSION}; ${N} matches; caps ${caps} (${(10000 * caps / N).toFixed(1)}/10k); duration median ${q(.5)}s p90 ${q(.9)}s p99 ${q(.99)}s`);
const rows = [['wins', s => pc(s.wins, N - caps)], ['possessions / min', s => f(s.poss, tot, 2)], ['reach x≥2 / poss', s => pc(s.reach2, s.poss)], ['reach box / poss', s => pc(s.reach3, s.poss)],
  ['shots / min', s => f(s.shots, tot, 3)], ['shots / poss', s => f(s.shots, s.poss)], ['shots by uncommitted player', s => pc(s.shotsUncommitted, s.shots)], ['own shots blocked', s => pc(s.blocked, s.shots)], ['goals / shot', s => f(s.goals, s.shots)],
  ['actions at x≥2 by uncommitted', s => pc(s.carryX2Unc, s.carryX2)], ['…of which shots', s => pc(s.unc2Shoot, s.carryX2Unc)], ['transition possessions', s => pc(s.transPoss, s.poss)], ['goals in transition poss', s => pc(s.transGoals, s.goals)],
  ['caught upfield (exposed) / poss', s => pc(s.exposed, s.poss)], ['pass completion', s => pc(s.passOk, s.passes)], ['cut-backs / poss (completed)', s => s.cutback ? f(s.cutback, s.poss) + ' (' + pc(s.cutbackOk, s.cutback) + ')' : '—'], ['presses beaten into transition / poss', s => s.bypass ? f(s.bypass, s.poss) + ' → goal in ' + pc(s.bypassGoals, s.bypass) : '—'], ['shield-press duels won', s => s.pressTry ? pc(s.pressWon, s.pressTry) + ' of ' + s.pressTry : '—'],
  ['corners / poss', s => s.corners ? f(s.corners, s.poss) : '—'],
  ['shot kinds', s => Object.entries(s.kinds).map(([k, v]) => k + ' ' + pc(v, s.shots)).join(' ')], ['goal kinds', s => Object.entries(s.goalKinds).map(([k, v]) => k + ' ' + pc(v, s.goals)).join(' ')]];
const nm = ids => ids.map(id => P.find(p => p.id === id).name.split(' ').slice(-1)[0]).join('/');
console.log(''.padEnd(34) + ('A ' + nm(A) + ' ' + TA).slice(0, 40).padEnd(42) + ('B ' + nm(B) + ' ' + TB).slice(0, 40));
for (const [n, fn] of rows) console.log(n.padEnd(34) + String(fn(S[0])).padEnd(42) + String(fn(S[1])));
if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify({ engine: E.VERSION, A, B, TA, TB, N, caps, q50: q(.5), q99: q(.99), S }, null, 1));
