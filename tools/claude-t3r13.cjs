#!/usr/bin/env node
// THE CAGE: T3-13 research harness (Claude). Loads the real play.html game in a VM and patches the
// built T3-12 engine IN MEMORY behind switchable flags. Live files are never modified.
//   node tools/claude-t3r13.cjs --flags A,B1,B2,B3 --n 300 [--json out.json] [--no-gk] [--no-traits]
//   node tools/claude-t3r13.cjs --identity      (no flags must reproduce T3-12 event hashes exactly)
// Flags:
//   A   contested carry: a carry into a cell covered by an available defender is a duel; losing it checks the carry
//   B1  score-aware commitment: a trailing side (or level in the final 4 minutes / Golden Goal) commits one more player while one stays back
//   B2  cover-aware discipline: an uncommitted carrier with an uncommitted team-mate goal-side may carry and shoot normally
//   B3  ball winner joins the counter when the opposition is caught upfield
//   C1  vision picks the receiver: a passer with vision chooses the best-placed team-mate (forward progress and space)
//   C2  pass success depends more on passing: wider spread and a .96 cap for normal passes (was .88)
//   K   clearance: deep and engaged, a player may clear long to the furthest-forward team-mate, contested where it lands
//   Q   shot pressure scales with the pressuring defender's tackling and reading (average defender = no change)
//   I   an intercepted pass is won where the interceptor stands (was: at the passer's feet)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const PARAM = Object.fromEntries((opt('--param', '') || '').split(',').filter(Boolean).map(kv => { const [k, v] = kv.split('='); return [k, +v]; }));

function rep(src, from, to, label) {
  const n = src.split(from).length - 1;
  if (n !== 1) throw Error(`patch ${label}: anchor found ${n} times`);
  return src.replace(from, () => to);
}
function patchEngine(src) {
  // A: contested carry
  src = rep(src, "if(action==='carry'){",
    "if(action==='carry'&&RF.A){const nx=Math.min(3,x+1),tgt=S.world({x:nx,lane:['left','centre','right'][lane]},poss),cover=T[1-poss].ps.filter(q=>q.oop===0&&S.dist(q.pos,tgt)<=RP.Arad).sort((a,b)=>S.dist(a.pos,tgt)-S.dist(b.pos,tgt)||(b.c.tackle+b.c.intercept)-(a.c.tackle+a.c.intercept)||a.id.localeCompare(b.id))[0];" +
    "if(cover){const D=RP.Atk*eff(cover,'tackle')+(1-RP.Atk)*eff(cover,'intercept'),r=duel(eff(c,'dribble'),D,RP.Abias,null,false);if(!r.win){t+=P.dt.dribble;tire(c,'sprint');tire(cover,'duel');emit({type:'carry',team:poss,actor:c.id,opp:cover.id,zone:zone(),from:zone(),outcome:'checked',p:r.p,roll:r.roll,tags:['carry_checked'],calc:{...r.calc,weights}});forcedEngage={team:1-poss,id:cover.id};return;}}}\n" +
    "if(action==='carry'){", 'A');
  src = rep(src, "engaged=!!d&&R()<", "engaged0=!!d&&R()<", 'A-engage');
  src = rep(src, ",mates=T[poss].ps.filter(q=>q!==c),U={};",
    ",mates=T[poss].ps.filter(q=>q!==c),U={};const forcedHit=!!(RF.A&&forcedEngage&&forcedEngage.team===1-poss&&d&&d.id===forcedEngage.id);forcedEngage=null;const engaged=engaged0||forcedHit;", 'A-engage2');
  src = rep(src, "let t=0,poss=0,carrier=null,", "let forcedEngage=null;let t=0,poss=0,carrier=null,", 'A-state');
  // B1: score-aware commitment (also B2 needs nothing here)
  src = rep(src, "const rotations=S.update(T,poss,carrier,zone(),tick);",
    "if(RF.B1)for(const team of T){const o=T[1-team.ti],chasing=score[team.ti]<score[o.ti]||(score[team.ti]===score[o.ti]&&(suddenDeath||t>=P.timedSeconds-RP.B1late));if(chasing){const free=team.ps.filter(q=>!q.committed&&q.oop===0);if(team.ps.filter(q=>q.committed).length<2&&free.length>=2){free.sort((a,b)=>(b.c.ATT-b.c.DEF)-(a.c.ATT-a.c.DEF)||a.id.localeCompare(b.id))[0].committed=true;}}}\n" +
    "const rotations=S.update(T,poss,carrier,zone(),tick);", 'B1');
  // B2: cover-aware discipline
  src = rep(src, "const discipline=!c.committed?",
    "const coveredCarrier=RF.B2&&!c.committed&&T[poss].ps.some(q=>q!==c&&!q.committed&&q.oop===0&&S.oriented(q.pos,poss)<x);const discipline=coveredCarrier?1:!c.committed?", 'B2');
  src = rep(src, "for(const k of ['carry','dribble','shoot','wall'])if(U[k]!==undefined)U[k]*=discipline;",
    "for(const k of ['carry','dribble','shoot','wall'])if(U[k]!==undefined)U[k]*=(coveredCarrier&&(k==='dribble'||k==='wall'))?(x>=2?Q.boxDiscipline:Q.deepDiscipline):discipline;", 'B2b');
  // B3: winner joins the counter when opponents are caught upfield
  src = rep(src, "T[poss].ps.forEach(q=>q.oop=0);S.commitment(T[poss]);",
    "T[poss].ps.forEach(q=>q.oop=0);S.commitment(T[poss]);if(RF.B3&&transition&&caught.length>=1)winner.committed=true;", 'B3');
  // C1: vision picks the receiver for normal passes (applies before the trait receiver choice, same RNG draw)
  src = rep(src, "receiver=action==='through'||action==='outlet'?runner:(traitOn?",
    "receiver=action==='through'||action==='outlet'?runner:(RF.C1&&passRoll<lim((c.c.vision-RP.C1ref)/RP.C1scale,0,RP.C1max)?bestOption(mates):traitOn?", 'C1');
  src = rep(src, "const zb=zone(),weights=Object.fromEntries(",
    "const bestOption=ms=>ms.slice().sort((a,b)=>{const sp=q=>Math.min(2,...T[1-poss].ps.filter(o=>o.oop===0).map(o=>S.dist(o.pos,q.pos)));return (S.oriented(b.pos,poss)+sp(b))-(S.oriented(a.pos,poss)+sp(a))||a.id.localeCompare(b.id);})[0];const zb=zone(),weights=Object.fromEntries(", 'C1-fn');
  // C2: normal passes resolve with a steeper passing-vs-interception curve
  src = rep(src, "r=md?duel(.75*eff(c,'pass')+.25*movement,eff(md,'intercept'),bias,passCtx)",
    "r=md?duel(.75*eff(c,'pass')+.25*movement,eff(md,'intercept'),bias+(RF.C2&&action==='pass'?RP.C2bias:0),passCtx,true,RF.C2&&action==='pass'?RP.C2k:0)", 'C2');
  src = rep(src, "function duel(A,D,b,ctx=null,applySupport=true){const resolved=probability(A,D,b,ctx,applySupport)",
    "function duel(A,D,b,ctx=null,applySupport=true,kOverride=0){const resolved=kOverride?probabilityK(A,D,b,ctx,applySupport,kOverride):probability(A,D,b,ctx,applySupport)", 'C2-duel');
  src = rep(src, "function rng(seed){",
    "function probabilityK(A,D,b,ctx,applySupport,k){const support=ctx&&applySupport?P.support*ctx.supportQ:0,help=ctx&&applySupport?P.help*ctx.helpQ:0,z=(A-D)/k+b+support-help;return {p:lim(logistic(z),P.clampLo,RP.C2hi),calc:{A:rounded(A),D:rounded(D),bias:rounded(b),support:rounded(support),help:rounded(help),logit:rounded(z),k}};}\nfunction rng(seed){", 'C2-prob');
  // K: clearance. Deep and engaged, a player may clear long to the furthest-forward team-mate; the ball is contested where it lands.
  src = rep(src, "if(engaged&&x<=1)U.shield=",
    "if(RF.K&&engaged&&x<=1)U.clear=RP.Kw*lim((c.c.DEF-c.c.pass+RP.Kshift)/20,RP.Kmin,RP.Kmax);if(engaged&&x<=1)U.shield=", 'K-weight');
  src = rep(src, "if(action==='shield'){",
    "if(action==='clear'){const tgt=mates.slice().sort((a,b)=>S.oriented(b.pos,poss)-S.oriented(a.pos,poss)||b.c.a.phys-a.c.a.phys||a.id.localeCompare(b.id))[0],land={x:2,lane:['left','centre','right'][tgt.pos.y]},landW=S.world(land,poss),opp=T[1-poss].ps.filter(o=>o.oop===0).sort((a,b)=>S.dist(a.pos,landW)-S.dist(b.pos,landW)||a.id.localeCompare(b.id))[0];" +
    "const r=opp?duel(.5*eff(tgt,'rebound')+.5*tgt.c.a.phys,.5*eff(opp,'rebound')+.5*opp.c.a.phys,RP.Kbias,null,false):{p:1,roll:R(),win:true,calc:{}};t+=P.dt.pass;tire(c,'pass');" +
    "emit({type:'pass',team:poss,actor:c.id,target:tgt.id,opp:opp?.id||null,p:r.p,roll:r.roll,zone:zb,to:land,outcome:r.win?'complete':'intercepted',tags:['clearance'],roles:{receiver:tgt.id},calc:{...r.calc,weights,forwardDistance:2-x,creativeLink:0}},ctx);" +
    "lastLink=null;if(r.win){lastPasser=c.id;carrier=tgt;x=2;lane=tgt.pos.y;carrier.pos=S.world(zone(),poss);return;}x=2;lane=tgt.pos.y;return turnover(opp,'interception','clearance_won');}\n" +
    "if(action==='shield'){", 'K-action');
  // Q: shot pressure depends on WHO pressures. Same logit scale family as shooter quality; average defender (Qref) unchanged.
  src = rep(src, "(ctx.d?P.shot.pressure:0)",
    "(ctx.d?P.shot.pressure-(RF.Q?((.5*eff(ctx.d,'tackle')+.5*eff(ctx.d,'intercept'))-RP.Qref)/RP.Qscale:0):0)", 'Q');
  // I: an intercepted pass is won where the interceptor stands, not at the passer's feet
  src = rep(src, "return turnover(md,'interception','read_pass');",
    "if(RF.I){x=S.oriented(md.pos,poss);lane=md.pos.y;}return turnover(md,'interception','read_pass');", 'I');
  return src;
}

const DEFAULT_PARAM = { Arad: 0, Atk: .6, Abias: .9, B1late: 240, C1ref: 60, C1scale: 40, C1max: .9, C2bias: -.45, C2k: 12, C2hi: .96, Kw: .9, Kshift: 10, Kmin: .3, Kmax: 2, Kbias: 0, Qref: 65.3, Qscale: 30 };
function load(flags, { patch = true } = {}) {
  const html = fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const list = scripts.slice(0, scripts.indexOf('src/cage-commentary.js')).filter(s => !/identity\/search/.test(s));
  const window = { location: { search: '' } };
  const ctx = vm.createContext({ window, console, Math, Object, Array, Error, TypeError, RangeError, JSON, Number, String, Set, Map, WeakMap, Symbol, Boolean, Uint32Array, Int32Array, Float64Array,
    RF: Object.freeze(Object.fromEntries(flags.map(f => [f, true]))), RP: Object.freeze({ ...DEFAULT_PARAM, ...PARAM }) });
  for (const s of list) {
    let code = fs.readFileSync(path.join(ROOT, s), 'utf8');
    if (s === 'src/cage-engine.js' && patch) code = patchEngine(code);
    vm.runInContext(code, ctx, { filename: s });
  }
  return window;
}

const flags = (opt('--flags', '') || '').split(/[,+]/).filter(f => f && f !== 'none');
if (args.includes('--identity')) {
  const a = load([], { patch: false }).CageEngine, b = load([]).CageEngine, ids = a.ROSTER.map(p => p.id), G = load([], { patch: false }).CageGoalkeepers.players;
  let diff = 0, n = 0;
  for (let k = 0; k < 300; k++) {
    const t = ids.slice((k * 7) % 180, (k * 7) % 180 + 6), cfg = { teams: [t.slice(0, 3), t.slice(3)], tactics: [['balanced', 'press', 'counter', 'possession'][k % 4], ['balanced', 'counter', 'press', 'possession'][(k >> 2) % 4]], seed: (k * 2654435761) >>> 0, mode: 'score', traits: { enabled: true }, ...(k % 2 ? { keepers: [G[k % 50].id, G[(k + 7) % 50].id] } : {}) };
    n++; if (a.simulate(cfg).eventHash !== b.simulate(cfg).eventHash) diff++;
  }
  console.log(diff ? `IDENTITY FAIL ${diff}/${n}` : `IDENTITY PASS: ${n}/${n} patched-with-no-flags matches identical to live T3-12 (traits on, half with keepers)`); process.exit(diff ? 1 : 0);
}

// ---------- balance + anatomy ----------
const W = load(flags), E = W.CageEngine, P = E.ROSTER, G = W.CageGoalkeepers.players, N = +opt('--n', 300);
const GK = !args.includes('--no-gk'), TRAITS = !args.includes('--no-traits');
const q = p => { const r = p.r; return (r.pace + r.tech + r.pass + r.finish + r.def + r.phys) / 6; };
let s = 20261101; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const byRole = { D: P.filter(p => p.role === 'D'), M: P.filter(p => p.role === 'M'), F: P.filter(p => p.role === 'F') };
const pick = (pool, used) => { let p; do p = pool[Math.floor(R() * pool.length)]; while (used.has(p.id)); used.add(p.id); return p; };
const keepers = () => { let i = Math.floor(R() * G.length), j; do j = Math.floor(R() * G.length); while (j === i); return [G[i].id, G[j].id]; };
function play(A, B, ta, tb, swap) {
  const cfg = { teams: swap ? [B, A] : [A, B], tactics: swap ? [tb, ta] : [ta, tb], seed: Math.floor(R() * 2 ** 32), mode: 'score', ...(TRAITS ? { traits: { enabled: true } } : {}), ...(GK ? { keepers: keepers() } : {}) };
  return { r: E.simulate(cfg), me: swap ? 1 : 0 };
}
const comps = ['DDD', 'MMM', 'FFF', 'DMF', 'DDF', 'MMF'], refs = ['DMF', 'DDF', 'MMF', 'DFF', 'DMM', 'MFF'];
const anat = {}, durs = [], goals = []; let golden = 0, games = 0, caps = 0;
for (const comp of comps) {
  const S = { n: 0, w: 0, gf: 0, ga: 0, sf: 0, sa: 0, possF: 0, possA: 0, reachF: 0, reachA: 0, checkedBy: 0, carriesA: 0, passF: 0, passOkF: 0 };
  for (let k = 0; k < N; k++) {
    let A, B, t = 0;
    do { const used = new Set(); A = [...comp].map(c => pick(byRole[c], used)); B = [...refs[k % refs.length]].map(c => pick(byRole[c], used)); t++; }
    while (Math.abs(A.reduce((x, p) => x + q(p), 0) - B.reduce((x, p) => x + q(p), 0)) / 3 > 1.5 && t < 300);
    let o; try { o = play(A.map(p => p.id), B.map(p => p.id), 'balanced', 'balanced', k % 2 === 1); } catch (e) { caps++; continue; }
    const { r, me } = o; S.n++; games++; durs.push(r.duration); goals.push(r.score[0] + r.score[1]); if (r.winner === me) S.w++;
    let cur = null, mx = 0; const close = () => { if (cur === null) return; if (mx >= 2) cur === me ? S.reachF++ : S.reachA++; };
    for (const e of r.events) {
      if (e.type === 'golden_goal_start') golden++;
      if (e.team === undefined) continue; const mine = e.team === me;
      if (e.type === 'restart' || e.type === 'turnover' || (e.type === 'gk_distribution' && e.team !== cur) || (e.type === 'rebound' && e.outcome === 'defence_clears')) { close(); cur = e.team; mx = e.zone ? e.zone.x : 0; mine ? S.possF++ : S.possA++; continue; }
      if (e.team === cur && e.zone) mx = Math.max(mx, e.zone.x, e.to ? e.to.x : 0);
      if (e.type === 'shot_attempt') mine ? S.sf++ : S.sa++;
      if (e.type === 'goal') mine ? S.gf++ : S.ga++;
      if (e.type === 'carry' && !mine) { S.carriesA++; if (e.outcome === 'checked') S.checkedBy++; }
      if (e.type === 'pass' && mine) { S.passF++; if (e.outcome === 'complete') S.passOkF++; }
    }
    close();
  }
  const f = (a, b, d = 2) => b ? +(a / b).toFixed(d) : null;
  anat[comp] = { win: f(100 * S.w, S.n, 1), gf: f(S.gf, S.n), ga: f(S.ga, S.n), shotsPerPossF: f(S.sf, S.possF, 3), shotsPerPossA: f(S.sa, S.possA, 3), convF: f(S.gf, S.sf, 3), convA: f(S.ga, S.sa, 3), reachA: f(100 * S.reachA, S.possA, 1), reachF: f(100 * S.reachF, S.possF, 1), carriesCheckedPct: f(100 * S.checkedBy, S.carriesA, 1), passPctF: f(100 * S.passOkF, S.passF, 1) };
}
// quality gradient (random trios)
const bins = [[-99, -8], [-8, -4], [-4, -1.5], [-1.5, 1.5], [1.5, 4], [4, 8], [8, 99]], bw = bins.map(() => [0, 0]);
for (let k = 0; k < N * 6; k++) { const t = new Set(); while (t.size < 6) t.add(P[Math.floor(R() * P.length)]); const v = [...t], A = v.slice(0, 3), B = v.slice(3), gap = (A.reduce((x, p) => x + q(p), 0) - B.reduce((x, p) => x + q(p), 0)) / 3; let o; try { o = play(A.map(p => p.id), B.map(p => p.id), 'balanced', 'balanced', k % 2 === 1); } catch (e) { caps++; continue; } if (o.r.winner < 0) continue; const bi = bins.findIndex(([lo, hi]) => gap >= lo && gap < hi); bw[bi][0] += o.r.winner === o.me; bw[bi][1]++; }
durs.sort((a, b) => a - b); goals.sort((a, b) => a - b);
const res = { engine: E.VERSION, flags, param: { ...DEFAULT_PARAM, ...PARAM }, gk: GK, traits: TRAITS, N, caps, goalsMedian: goals[goals.length >> 1], goalsMean: +(goals.reduce((a, b) => a + b, 0) / goals.length).toFixed(2), goldenPct: +(100 * golden / games).toFixed(1), durP99: durs[Math.floor(durs.length * .99)], anat, gradient: bins.map(([lo, hi], i) => ({ bin: `${lo}..${hi}`, win: bw[i][1] ? +(100 * bw[i][0] / bw[i][1]).toFixed(1) : null, n: bw[i][1] })) };
const keys = ['win', 'gf', 'ga', 'shotsPerPossF', 'shotsPerPossA', 'convF', 'convA', 'reachA', 'carriesCheckedPct', 'passPctF'];
console.log(`${E.VERSION} flags=[${flags.join(',') || 'none'}] param=${JSON.stringify(PARAM)} gk=${GK} traits=${TRAITS} N=${N}/comp caps=${caps} goals median ${res.goalsMedian} mean ${res.goalsMean} golden ${res.goldenPct}% p99 ${res.durP99}s`);
console.log(''.padEnd(18) + comps.map(c => c.padStart(8)).join(''));
for (const k of keys) console.log(k.padEnd(18) + comps.map(c => String(anat[c][k]).padStart(8)).join(''));
console.log('gradient ' + res.gradient.map(g => `${g.bin}:${g.win}`).join(' | '));
if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify(res, null, 1));
