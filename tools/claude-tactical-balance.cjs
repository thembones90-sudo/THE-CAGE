#!/usr/bin/env node
// THE CAGE — tactical balance harness (Claude-owned yardstick; see TACTICAL_INTELLIGENCE_PROPOSAL.md §F).
// Loads the real game scripts in a sandbox and runs seeded experiments. Never edits project files.
//
// Usage:
//   node tools/claude-tactical-balance.cjs                 full run on the live engine
//   node tools/claude-tactical-balance.cjs --quick         smaller samples (~20 s)
//   node tools/claude-tactical-balance.cjs --engine path   test another engine file (e.g. a prototype)
//   node tools/claude-tactical-balance.cjs --json out.json also write machine-readable results
//   node tools/claude-tactical-balance.cjs --only E1,E9    run selected experiments
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i < 0 ? dflt : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const QUICK = args.includes('--quick');
const ENGINE = opt('--engine', path.join(ROOT, 'src', 'cage-engine.js'));
const ONLY = opt('--only', null);
const JSON_OUT = opt('--json', null);
const SCALE = QUICK ? 0.25 : 1;
const want = id => !ONLY || String(ONLY).split(',').includes(id);

// ---------- load the game exactly as the browser does ----------
function loadGame(enginePath) {
  const window = {};
  const ctx = vm.createContext({ window, console, Math, Object, Array, Error, TypeError, RangeError, JSON, Number, String, Set, Map, WeakMap, Symbol, Boolean });
  for (const f of [path.join(ROOT, 'src', 'players.js'), opt('--roster', path.join(ROOT, 'src', 'roster-expansion.js')), enginePath]) {
    if (!fs.existsSync(f)) { if (f.endsWith('roster-expansion.js')) continue; throw Error('Missing ' + f); }
    vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  }
  if (!window.CageEngine || typeof window.CageEngine.simulate !== 'function') throw Error('Engine did not expose window.CageEngine.simulate');
  return { E: window.CageEngine, P: window.THE_CAGE_PLAYERS };
}
const { E, P } = loadGame(ENGINE);
const BY = Object.fromEntries(P.map(p => [p.id, p]));

// ---------- deterministic sampling (mulberry32; avoids float LCG precision loss) ----------
function mulberry(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const ovr = p => (p.r.pace + p.r.tech + p.r.pass + p.r.finish + p.r.def + p.r.phys) / 6;
const quality = ids => ids.reduce((s, id) => s + ovr(BY[id]), 0) / 3;
const ROLES = { D: P.filter(p => p.role === 'D'), M: P.filter(p => p.role === 'M'), F: P.filter(p => p.role === 'F') };
const COMPS = ['DMF', 'FFF', 'DDD', 'DDM', 'DDF', 'MMF', 'DFF', 'DMM', 'MMM', 'MFF'];
const NAME = { DMF: 'Complete Unit', FFF: 'All-Out Assault', DDD: 'Iron Fortress', DDM: 'The Wall', DDF: 'Counterstrike', MMF: 'The Architects', DFF: 'Spear and Shield', DMM: 'The Engine Room', MMM: 'The Orchestra', MFF: 'Street Artists' };
const TACTICS = Object.keys(E.TACTICS || { balanced: 1, possession: 1, press: 1, counter: 1 });
function trio(R, comp, excl) { const ids = []; for (const r of comp) { let p, guard = 0; do { p = ROLES[r][Math.floor(R() * ROLES[r].length)]; if (++guard > 500) throw Error('cannot sample ' + comp); } while (ids.includes(p.id) || excl.includes(p.id)); ids.push(p.id); } return ids; }
// Equal-quality pair of given compositions (mean base rating within tol), sides randomly ordered.
function pair(R, ca, cb, tol = 1.5) { for (let g = 0; g < 400; g++) { const A = trio(R, ca, []), B = trio(R, cb, A); if (Math.abs(quality(A) - quality(B)) <= tol) return [A, B]; } return null; }

let capHits = 0, sims = 0;
function sim(A, B, ta, tb, seed) {
  sims++;
  try { return E.simulate({ teams: [A, B], tactics: [ta, tb], seed: seed >>> 0, mode: 'ko' }); }
  catch (e) { if (/safety|limit|exceeded/i.test(e.message)) { capHits++; return null; } throw e; }
}
// Plays A vs B with side swap on odd seeds; returns 1 if A wins, 0 if B, null on cap.
function play(A, B, ta, tb, seed, swap) {
  const r = swap ? sim(B, A, tb, ta, seed) : sim(A, B, ta, tb, seed);
  if (!r) return { aWin: null, r: null, aSide: swap ? 1 : 0 };
  const aSide = swap ? 1 : 0; return { aWin: r.winner === aSide ? 1 : 0, r, aSide };
}

const results = { engine: path.relative(ROOT, ENGINE), version: E.VERSION || null, params: E.PARAMS_VERSION || null, roster: P.length, quick: QUICK, experiments: {} };
const verdicts = [];
const verdict = (id, name, pass, detail) => { verdicts.push({ id, name, pass, detail }); };
const pct = v => (100 * v).toFixed(1) + '%';
const t0 = Date.now();
console.log(`THE CAGE tactical balance — engine ${results.engine} (${results.version || '?'} / ${results.params || '?'}), roster ${P.length}${QUICK ? ', QUICK' : ''}`);
console.log('Compositions use roster role labels (D/M/F) until src/tactics capability roles exist (T2).\n');

// ---------- E1: composition matrix at equal quality ----------
if (want('E1')) {
  const R = mulberry(101), per = Math.round(400 * SCALE);
  const W = {}, G = {};
  for (const a of COMPS) { W[a] = {}; G[a] = {}; for (const b of COMPS) { W[a][b] = 0; G[a][b] = 0; } }
  for (let i = 0; i < COMPS.length; i++) for (let j = i + 1; j < COMPS.length; j++) {
    const a = COMPS[i], b = COMPS[j];
    for (let k = 0; k < per; k++) { const pr = pair(R, a, b); if (!pr) continue; const o = play(pr[0], pr[1], 'balanced', 'balanced', Math.floor(R() * 2 ** 32), k % 2); if (o.aWin === null) continue; G[a][b]++; G[b][a]++; W[a][b] += o.aWin; W[b][a] += 1 - o.aWin; }
  }
  const overall = {}; console.log('E1  Composition matrix (row win % vs column; equal quality; Balanced vs Balanced; ' + per + ' matches per pairing)');
  console.log('      ' + COMPS.map(c => c.padStart(5)).join('') + '   OVERALL  beats≥3');
  let maxCell = 0, minO = 101, maxO = -1;
  for (const a of COMPS) {
    let w = 0, g = 0, beats = 0;
    const cells = COMPS.map(b => { if (a === b) return '    —'; const v = G[a][b] ? W[a][b] / G[a][b] : NaN; w += W[a][b]; g += G[a][b]; if (v > .5) beats++; maxCell = Math.max(maxCell, v); return (100 * v).toFixed(0).padStart(5); }).join('');
    overall[a] = w / g; minO = Math.min(minO, overall[a]); maxO = Math.max(maxO, overall[a]);
    console.log(a.padEnd(6) + cells + '   ' + pct(overall[a]).padStart(6) + '   ' + (beats >= 3 ? 'yes' : 'NO ') + '  ' + NAME[a]);
  }
  results.experiments.E1 = { overall, W, G };
  const beatsOk = COMPS.every(a => COMPS.filter(b => b !== a && W[a][b] / G[a][b] > .5).length >= 3);
  verdict('E1', 'Every composition 40–60% overall; no cell > 75%; each beats ≥ 3', minO >= .40 && maxO <= .60 && maxCell <= .75 && beatsOk, `range ${pct(minO)}–${pct(maxO)}, max cell ${pct(maxCell)}, all beat≥3: ${beatsOk}`);
  console.log();
}

// ---------- E2: elasticity of goals per possession ----------
if (want('E2')) {
  const R = mulberry(202), N = Math.round(20000 * SCALE);
  const comp = id => { const c = E.comp(BY[id]); return [c.ATT, c.MID, c.DEF]; };
  const rows = [];
  for (let k = 0; k < N; k++) {
    const s = new Set(); while (s.size < 6) s.add(P[Math.floor(R() * P.length)].id); const v = [...s], A = v.slice(0, 3), B = v.slice(3);
    const r = sim(A, B, 'balanced', 'balanced', Math.floor(R() * 2 ** 32)); if (!r) continue;
    const poss = [0, 0]; let last = null;
    for (const e of r.events) { if (['turnover', 'restart', 'rebound', 'possession_start'].includes(e.type) && e.team !== undefined && e.team !== last) { poss[e.team]++; last = e.team; } }
    for (const t of [0, 1]) {
      const mine = (t ? B : A).map(comp), theirs = (t ? A : B).map(comp);
      const best = (arr, i) => Math.max(...arr.map(x => x[i])), mean = (arr, i) => arr.reduce((s2, x) => s2 + x[i], 0) / 3;
      rows.push({ y: r.score[t], n: Math.max(1, poss[t]), x: [best(mine, 0), mean(mine, 0), mean(mine, 1), best(theirs, 2), mean(theirs, 2)] });
    }
  }
  const feat = ['own best ATT', 'own mean ATT', 'own mean MID', 'opp best DEF', 'opp mean DEF'];
  const mu = feat.map((_, j) => rows.reduce((s2, r) => s2 + r.x[j], 0) / rows.length), sd = feat.map((_, j) => Math.sqrt(rows.reduce((s2, r) => s2 + (r.x[j] - mu[j]) ** 2, 0) / rows.length));
  const Z = rows.map(r => [1, ...r.x.map((v, j) => (v - mu[j]) / sd[j])]), y = rows.map(r => r.y / r.n), w = rows.map(r => r.n), n = Z[0].length;
  const A = [...Array(n)].map((_, i) => [...Array(n)].map((_, j) => Z.reduce((s2, z, k) => s2 + w[k] * z[i] * z[j], 0))), b = [...Array(n)].map((_, i) => Z.reduce((s2, z, k) => s2 + w[k] * z[i] * y[k], 0));
  for (let i = 0; i < n; i++) { let m = i; for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[m][i])) m = k; [A[i], A[m]] = [A[m], A[i]]; [b[i], b[m]] = [b[m], b[i]]; for (let k = 0; k < n; k++) if (k !== i) { const f = A[k][i] / A[i][i]; for (let j = i; j < n; j++) A[k][j] -= f * A[i][j]; b[k] -= f * b[i]; } }
  const c = b.map((v, i) => v / A[i][i]), eff = Object.fromEntries(feat.map((f, j) => [f, c[j + 1] / c[0]]));
  console.log('E2  Effect of +1 SD on goals per possession (' + rows.length / 2 + ' matches; baseline ' + c[0].toFixed(4) + ')');
  for (const f of feat) console.log('    ' + f.padEnd(14) + ((eff[f] >= 0 ? '+' : '') + (100 * eff[f]).toFixed(0) + '%').padStart(6));
  results.experiments.E2 = eff;
  const okDef = Math.abs(eff['opp best DEF']) <= 2 * Math.abs(eff['own best ATT']), okCol = Math.abs(eff['opp mean DEF']) >= .6 * Math.abs(eff['opp best DEF']), okMid = eff['own mean MID'] >= .08;
  verdict('E2', '|opp best DEF| ≤ 2× own best ATT; opp mean DEF ≥ 60% of best; own mean MID ≥ +8%', okDef && okCol && okMid, `bestDEF ${(100 * eff['opp best DEF']).toFixed(0)}% vs bestATT ${(100 * eff['own best ATT']).toFixed(0)}%; meanDEF/bestDEF ${(eff['opp mean DEF'] / eff['opp best DEF']).toFixed(2)}; MID ${(100 * eff['own mean MID']).toFixed(0)}%`);
  console.log();
}

// ---------- E4: behaviour differentiation + E10 realism (shared sample) ----------
if (want('E4') || want('E10')) {
  const R = mulberry(404), per = Math.round(600 * SCALE);
  const ACTIONS = ['carry', 'pass', 'through_ball', 'dribble_duel', 'wall_pass', 'shot_attempt', 'press'];
  const B = {}; for (const c of COMPS) B[c] = { acts: Object.fromEntries(ACTIONS.map(a => [a, 0])), poss: 0, passes: 0, ints: 0, shots: 0, goals: 0, fk: 0, blocks: 0, matches: 0 };
  let passes = 0, ints = 0, goals = 0, fkGoals = 0, shotsAll = 0, matches = 0; const scorerDuty = {};
  for (const c of COMPS) for (let k = 0; k < per; k++) {
    const opp = COMPS[Math.floor(R() * COMPS.length)]; const pr = pair(R, c, opp); if (!pr) continue;
    const r = sim(pr[0], pr[1], 'balanced', 'balanced', Math.floor(R() * 2 ** 32)); if (!r) continue;
    matches++; const s = B[c]; s.matches++; let last = null;
    const duty = {}; for (const sh of r.shapes || []) Object.assign(duty, sh.duty || {});
    for (const e of r.events) {
      if (['turnover', 'restart', 'rebound', 'possession_start'].includes(e.type) && e.team !== undefined && e.team !== last) { if (e.team === 0) s.poss++; last = e.team; }
      if (e.type === 'pass' || e.type === 'through_ball') { passes++; if (e.outcome === 'intercepted') ints++; }
      if (e.type === 'shot_attempt') shotsAll++;
      if (e.type === 'goal') { goals++; if (e.kind === 'fk') fkGoals++; const d = duty[e.actor] || '?'; scorerDuty[d] = (scorerDuty[d] || 0) + 1; }
      if (e.team !== 0) continue; // behaviour of the sampled composition (side 0)
      if (ACTIONS.includes(e.type)) s.acts[e.type]++;
      if (e.type === 'pass' || e.type === 'through_ball') s.passes++;
    }
  }
  const dist = c => { const a = B[c].acts, t = Object.values(a).reduce((x, y) => x + y, 0) || 1; return ACTIONS.map(k => a[k] / t); };
  const js = (p, q) => { const m = p.map((v, i) => (v + q[i]) / 2), kl = (x, y) => x.reduce((s, v, i) => s + (v > 0 ? v * Math.log2(v / y[i]) : 0), 0); return (kl(p, m) + kl(q, m)) / 2; };
  if (want('E4')) {
    console.log('E4  Behaviour by composition (side-0 actions per possession; equal quality)');
    console.log('      ' + ['dribbles', 'passes', 'thru', 'shots', 'carries'].map(h => h.padStart(9)).join(''));
    const perPoss = (c, k) => B[c].acts[k] / Math.max(1, B[c].poss);
    for (const c of COMPS) console.log(c.padEnd(6) + [perPoss(c, 'dribble_duel') + perPoss(c, 'wall_pass'), perPoss(c, 'pass'), perPoss(c, 'through_ball'), perPoss(c, 'shot_attempt'), perPoss(c, 'carry')].map(v => v.toFixed(2).padStart(9)).join(''));
    const jsd = js(dist('FFF'), dist('DDD')), drib = (perPoss('FFF', 'dribble_duel') + perPoss('FFF', 'wall_pass')) / Math.max(1e-9, perPoss('DDD', 'dribble_duel') + perPoss('DDD', 'wall_pass')), pas = perPoss('MMM', 'pass') / Math.max(1e-9, perPoss('DDF', 'pass'));
    results.experiments.E4 = { jsdFFFvsDDD: jsd, dribbleRatioFFFvsDDD: drib, passRatioMMMvsDDF: pas };
    verdict('E4', 'Different football: JSD(FFF,DDD) ≥ 0.10; dribbles FFF ≥ 2× DDD; passes MMM ≥ 1.5× DDF', jsd >= .10 && drib >= 2 && pas >= 1.5, `JSD ${jsd.toFixed(3)}, dribble ratio ${drib.toFixed(2)}, pass ratio ${pas.toFixed(2)}`);
    console.log();
  }
  if (want('E10')) {
    const intRate = ints / Math.max(1, passes), fkShare = fkGoals / Math.max(1, goals), spm = shotsAll / Math.max(1, matches);
    const totalG = Object.values(scorerDuty).reduce((x, y) => x + y, 0) || 1, anchor = (scorerDuty.anchor || 0) / totalG;
    console.log(`E10 Realism: interceptions ${pct(intRate)} of passes; free-kick goals ${pct(fkShare)}; shots per match ${spm.toFixed(1)}; anchor-duty goals ${pct(anchor)}`);
    results.experiments.E10 = { intRate, fkShare, shotsPerMatch: spm, anchorGoalShare: anchor };
    verdict('E10', 'Interceptions 12–22%; free kicks 2–8% of goals; 3–10 shots/match; anchors 2–12% of goals', intRate >= .12 && intRate <= .22 && fkShare >= .02 && fkShare <= .08 && spm >= 3 && spm <= 10 && anchor >= .02 && anchor <= .12, `int ${pct(intRate)}, fk ${pct(fkShare)}, shots ${spm.toFixed(1)}, anchor ${pct(anchor)}`);
    console.log();
  }
}

// ---------- E5: tactic matrix per composition ----------
if (want('E5')) {
  const R = mulberry(505), per = Math.round(240 * SCALE);
  const best = {}, swing = {};
  console.log('E5  Tactic effect per composition (win % of the composition using tactic X vs equal-quality random opponents using Balanced; ' + per + ' matches each)');
  console.log('      ' + TACTICS.map(t => t.slice(0, 9).padStart(11)).join('') + '   best');
  for (const c of COMPS) {
    const rates = TACTICS.map(t => { let w = 0, g = 0; const Rl = mulberry(505 + COMPS.indexOf(c)); for (let k = 0; k < per; k++) { const opp = COMPS[Math.floor(Rl() * COMPS.length)]; const pr = pair(Rl, c, opp); if (!pr) continue; const o = play(pr[0], pr[1], t, 'balanced', Math.floor(Rl() * 2 ** 32), k % 2); if (o.aWin === null) continue; w += o.aWin; g++; } return w / g; });
    const bi = rates.indexOf(Math.max(...rates)); best[c] = TACTICS[bi]; swing[c] = Math.max(...rates) - Math.min(...rates);
    console.log(c.padEnd(6) + rates.map(v => pct(v).padStart(11)).join('') + '   ' + TACTICS[bi]);
  }
  const counts = Object.fromEntries(TACTICS.map(t => [t, Object.values(best).filter(b => b === t).length]));
  const swingers = Object.values(swing).filter(s => s >= .05).length;
  results.experiments.E5 = { best, swing, counts };
  verdict('E5', 'No tactic best for > 5/10 compositions; each best ≥ 1; ≥ 6 compositions swing ≥ 5 pts', Math.max(...Object.values(counts)) <= 5 && Object.values(counts).every(v => v >= 1) && swingers >= 6, `best counts ${JSON.stringify(counts)}, compositions swinging ≥5pts: ${swingers}`);
  console.log();
}

// ---------- E6: quality still matters ----------
if (want('E6')) {
  const R = mulberry(606), per = Math.round(300 * SCALE); let w = 0, g = 0;
  for (const c of COMPS) {
    const pool = []; for (let k = 0; k < 60; k++) pool.push(trio(R, c, []));
    pool.sort((a, b) => quality(b) - quality(a)); const top = pool.slice(0, 15), bot = pool.slice(-15);
    for (let k = 0; k < per / 3; k++) { const A = top[Math.floor(R() * top.length)]; let Bt, guard = 0; do { Bt = bot[Math.floor(R() * bot.length)]; } while (Bt.some(id => A.includes(id)) && ++guard < 50); if (Bt.some(id => A.includes(id))) continue; const o = play(A, Bt, 'balanced', 'balanced', Math.floor(R() * 2 ** 32), k % 2); if (o.aWin === null) continue; w += o.aWin; g++; }
  }
  console.log(`E6  Same composition, top-quartile vs bottom-quartile trios: ${pct(w / g)} (${g} matches)`);
  results.experiments.E6 = w / g;
  verdict('E6', 'Top vs bottom quartile within a composition 65–80%', w / g >= .65 && w / g <= .80, pct(w / g));
  console.log();
}

// ---------- E9: termination and duration ----------
if (want('E9')) {
  const R = mulberry(909), N = Math.round(20000 * SCALE); const dur = []; const before = capHits;
  for (let k = 0; k < N; k++) { const s = new Set(); while (s.size < 6) s.add(P[Math.floor(R() * P.length)].id); const v = [...s]; const r = sim(v.slice(0, 3), v.slice(3), 'balanced', 'balanced', Math.floor(R() * 2 ** 32)); if (r) dur.push(r.duration); }
  const randomCaps = capHits - before;
  const mirrorTeams = [['paolo-maldini', 'giorgio-chiellini', 'lilian-thuram'], ['thomas-gravesen', 'jaap-stam', 'nemanja-vidic']];
  const M = Math.round(4000 * SCALE), b2 = capHits; for (let k = 0; k < M; k++) sim(mirrorTeams[0], mirrorTeams[1], 'balanced', 'balanced', Math.floor(R() * 2 ** 32));
  const defCaps = capHits - b2;
  dur.sort((a, b) => a - b); const q = f => dur[Math.min(dur.length - 1, Math.floor(dur.length * f))];
  console.log(`E9  Random matches ${N}: cap hits ${randomCaps}; duration median ${q(.5)}s, p90 ${q(.9)}s, p99 ${q(.99)}s. Defensive pairing (Maldini/Chiellini/Thuram v Gravesen/Stam/Vidić) ${M}: cap hits ${defCaps} (${(10000 * defCaps / M).toFixed(1)} per 10k)`);
  results.experiments.E9 = { randomCaps, median: q(.5), p90: q(.9), p99: q(.99), defCapsPer10k: 10000 * defCaps / M };
  verdict('E9', '0 caps in random; ≤ 1 per 10k defensive pairing; median 60–200 s; p99 < 900 s', randomCaps === 0 && 10000 * defCaps / M <= 1 && q(.5) >= 60 && q(.5) <= 200 && q(.99) < 900, `random caps ${randomCaps}, defensive ${(10000 * defCaps / M).toFixed(1)}/10k, median ${q(.5)}s, p99 ${q(.99)}s`);
  console.log();
}

// ---------- E12: guards (static) ----------
if (want('E12')) {
  const src = fs.readFileSync(ENGINE, 'utf8');
  const legacy = ['first_touch', 'dribbling', 'passing', 'vision', 'finishing', 'shooting', 'physical', 'tackling', 'positioning'];
  const hits = legacy.filter(f => new RegExp('r\\.' + f + '\\b').test(src));
  const roleHit = /\.role\b/.test(src), random = /Math\.random|Date\.now/.test(src);
  const legacyStamina = /r\.stamina\b|r\.composure\b/.test(src);
  console.log(`E12 Guards: legacy-derived fields read: ${hits.length ? hits.join(', ') : 'none'}; legacy stamina/composure read: ${legacyStamina}; role label read: ${roleHit}; Math.random/Date: ${random}`);
  results.experiments.E12 = { legacyFields: hits, legacyStaminaComposure: legacyStamina, roleRead: roleHit, nondeterministic: random };
  verdict('E12', 'Engine reads no legacy-derived fields or role labels; no Math.random/Date', !hits.length && !legacyStamina && !roleHit && !random, `legacy ${hits.length + (legacyStamina ? 1 : 0)}, role ${roleHit}, random ${random}`);
  console.log();
}

// ---------- pending experiments ----------
const pending = [['E3', 'Route of victory per composition', 'needs event tags (T3.4/T4)'], ['E7', 'Grade validity', 'needs src/tactics/capabilities.js (T2)'], ['E8', 'Cohesion is not a power score', 'needs src/tactics/identity.js (T2)'], ['E11', 'Quality gradient + showcase', 'run with --only E11']];
if (want('E11')) {
  const id = n => (P.find(p => p.name.includes(n)) || {}).id; const R = mulberry(1111), N = Math.round(2000 * SCALE);
  const MBR = ['Maldini', 'Ballack', 'Nazário'].map(id), ART = ['Ronaldinho', 'Rivaldo', 'Del Piero'].map(id), HARD = ['Vidić', 'Stam', 'Gravesen'].map(id);
  const rate = (A, B) => { let w = 0, g = 0; for (let k = 0; k < N; k++) { const o = play(A, B, 'balanced', 'balanced', Math.floor(R() * 2 ** 32), k % 2); if (o.aWin === null) continue; w += o.aWin; g++; } return w / g; };
  const a1 = rate(ART, MBR), a2 = rate(HARD, MBR);
  console.log(`E11 Showcase (information only, no target — owner 2026-10-30: no underdog floor): Ronaldinho/Rivaldo/Del Piero vs Maldini/Ballack/R9 ${pct(a1)} (quality gap ${(quality(ART) - quality(MBR)).toFixed(1)}) · Vidić/Stam/Gravesen vs Maldini/Ballack/R9 ${pct(a2)} (gap ${(quality(HARD) - quality(MBR)).toFixed(1)})`);
  // Quality gradient: win rate must rise with the rating gap; equal quality ~50%; a vastly inferior trio wins only occasionally.
  const BINS = [[-99, -8], [-8, -4], [-4, -1.5], [-1.5, 1.5], [1.5, 4], [4, 8], [8, 99]], bw = BINS.map(() => [0, 0]), M = Math.round(30000 * SCALE);
  for (let k = 0; k < M; k++) { const s = new Set(); while (s.size < 6) s.add(P[Math.floor(R() * P.length)].id); const v = [...s], A = v.slice(0, 3), B = v.slice(3); const gap = quality(A) - quality(B); const bi = BINS.findIndex(([lo, hi]) => gap >= lo && gap < hi); const o = play(A, B, 'balanced', 'balanced', Math.floor(R() * 2 ** 32), k % 2); if (o.aWin === null) continue; bw[bi][0] += o.aWin; bw[bi][1]++; }
  const rates = bw.map(([w, g]) => g >= 30 ? w / g : NaN);
  console.log('    quality gap (A − B):  ' + BINS.map(([lo, hi]) => (lo === -99 ? '<' + hi : hi === 99 ? '≥' + lo : lo + '..' + hi).padStart(8)).join(''));
  console.log('    A win rate:           ' + rates.map((r, i) => (isNaN(r) ? '   n<30' : pct(r)).padStart(8)).join('') + '   (n ' + bw.map(b => b[1]).join('/') + ')');
  const valid = rates.filter(r => !isNaN(r)); let mono = true; for (let i = 1; i < valid.length; i++) if (valid[i] < valid[i - 1] - .03) mono = false;
  const eq = rates[3], bigUpset = rates[0];
  results.experiments.E11 = { artistsVsMBR: a1, hardmenVsMBR: a2, gradient: { bins: BINS, rates, n: bw.map(b => b[1]) } };
  verdict('E11', 'Quality gradient: win rate rises with rating gap; equal quality 45–55%; gap ≥ 8 underdog wins ≤ 25% (no floor)', mono && eq >= .45 && eq <= .55 && (isNaN(bigUpset) || bigUpset <= .25), `monotonic ${mono}, equal ${pct(eq)}, big-gap underdog ${isNaN(bigUpset) ? 'n/a' : pct(bigUpset)}`);
  pending.pop(); console.log();
}

// ---------- summary ----------
console.log('SUMMARY  (' + sims + ' simulations, ' + capHits + ' safety-cap hits, ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
for (const v of verdicts) console.log(`  ${v.pass ? 'PASS' : 'FAIL'}  ${v.id.padEnd(4)} ${v.name}\n              ${v.detail}`);
for (const [id, name, why] of pending) if (want(id) || !ONLY) console.log(`  ----  ${id.padEnd(4)} ${name} — pending: ${why}`);
results.verdicts = verdicts; results.simulations = sims; results.capHits = capHits;
if (JSON_OUT) { fs.writeFileSync(JSON_OUT === true ? 'balance-results.json' : JSON_OUT, JSON.stringify(results, null, 1)); console.log('\nJSON written.'); }
process.exitCode = verdicts.every(v => v.pass) ? 0 : 1;
