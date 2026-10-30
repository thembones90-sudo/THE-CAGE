// THE CAGE engine spike (scratch, not project code). Possession/event engine over a 4x3 zone grid.
// Uses ONLY the existing 6 base ratings + documented proxies, so findings reflect today's data.
'use strict';
const ROSTER = window.THE_CAGE_PLAYERS, BY_ID = Object.fromEntries(ROSTER.map(p => [p.id, p]));

const P = { // every tunable constant lives here
  k: 12, clampLo: 0.06, clampHi: 0.94,
  b: { dribble: -0.25, pass: 1.7, through: 0.0, wall: -0.1, shield: 0.6, press: -0.3, recover: 0, rebound: 0 },
  shot: { box: { C: -0.4, S: -1.0 }, edge: { C: -1.9, S: -2.4 }, fk: -1.3, transition: 0.35, pressure: -0.7 },
  block: -0.9, blockCover: -1.7, foul: 0.035, fatigueCost: { sprint: 3, duel: 2, pass: 1, press: 3 },
  escalate: [300, 480, 600], dt: { pass: 4, dribble: 3, through: 4, shot: 2, wall: 3, shield: 3, restart: 6 },
};
const TACTICS = {
  balanced:   { press: .35, patience: 1.0, flair: 1.0, direct: 1.0, shoot: 1.0, aggr: .3, fat: 1.0, deep: 0 },
  possession: { press: .25, patience: 1.6, flair: .8,  direct: .7,  shoot: .8,  aggr: .2, fat: .9,  deep: 0 },
  press:      { press: .75, patience: .9,  flair: .9,  direct: 1.0, shoot: 1.0, aggr: .5, fat: 1.35, deep: -1 },
  counter:    { press: .12, patience: .6,  flair: 1.0, direct: 1.6, shoot: 1.25, aggr: .3, fat: .9, deep: 1 },
};

// --- deterministic RNG (sfc32 seeded by splitmix32) ---
function rng(seed) {
  let s = seed >>> 0; const sm = () => { s = (s + 0x9e3779b9) >>> 0; let z = s; z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0; z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0; return (z ^ (z >>> 16)) >>> 0; };
  let a = sm(), b = sm(), c = sm(), d = sm(), n = 0;
  const f = () => { n++; a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; let t = (a + b) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0; c = (c << 21) | (c >>> 11); d = (d + 1) | 0; t = (t + d) | 0; c = (c + t) | 0; return (t >>> 0) / 4294967296; };
  f.count = () => n; return f;
}
const logistic = x => 1 / (1 + Math.exp(-x)); // spike only; production uses a lookup table (see proposal B5)
const clamp = p => Math.min(P.clampHi, Math.max(P.clampLo, p));

// --- composites from EXISTING fields (proxies flagged) ---
function comp(p) {
  const r = p.r;
  return {
    dribble: .55 * r.tech + .30 * r.pace + .15 * r.phys,
    tackle: .60 * r.def + .20 * r.phys + .20 * r.pace,
    pass: .70 * r.pass + .30 * r.tech,
    intercept: .70 * r.def + .30 * r.pace,
    shot: .75 * r.finish + .25 * r.tech,
    long: .55 * r.finish + .25 * r.phys + .20 * r.tech,
    press: .50 * r.def + .30 * r.pace + .20 * r.phys,          // PROXY: no work_rate field exists
    escape: .50 * r.tech + .30 * r.phys + .20 * r.pass,
    recover: .60 * r.pace + .40 * r.def,
    rebound: .50 * r.pace + .30 * r.phys + .20 * r.def,
    vision: .6 * r.pass + .4 * r.tech,
    stamina: r.stamina,                                        // PROXY: stored field = (pace+phys)/2
    ATT: .45 * r.finish + .35 * r.tech + .20 * r.pace,
    MID: .50 * r.pass + .30 * r.tech + .20 * r.def,
    DEF: .65 * r.def + .20 * r.phys + .15 * r.pace,
  };
}
const PERMS3 = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
// duty order: [anchor, link, spearhead]
function shape(players) {
  const c = players.map(comp); let best = null;
  for (const pm of PERMS3) {
    const v = [c[pm[0]].DEF, c[pm[1]].MID, c[pm[2]].ATT];
    const score = v[0] + v[1] + v[2] + 0.5 * Math.min(...v);
    if (!best || score > best.score) best = { pm, score, v };
  }
  const cover = ['DEF', 'MID', 'ATT'].map((k, i) => {
    const prim = c[best.pm[i]][k], others = best.pm.filter((_, j) => j !== i).map(j => c[j][k]);
    return .7 * prim + .3 * (others[0] + others[1]) / 2;
  });
  return { duty: best.pm, cover, phase: best.v };
}

function simulate({ teams, tactics, seed, mode = 'ko' }) {
  const R = rng(seed), events = [];
  const T = teams.map((ids, ti) => {
    const ps = ids.map(id => { const p = BY_ID[id]; if (!p) throw Error('unknown ' + id); return { id, p, c: comp(p), fat: 0, active: true, oop: 0, ti }; });
    const sh = shape(ps.map(x => x.p));
    sh.duty.forEach((pi, d) => ps[pi].duty = ['anchor', 'link', 'spear'][d]);
    return { ti, ps, tac: TACTICS[tactics[ti]], shape: sh };
  });
  let t = 0, poss = 0, carrier = null, x = 0, lane = 1, transition = false, score = [0, 0], over = false, phase = 3;
  const emit = e => { e.i = events.length; e.t = t; e.n = phase; events.push(e); return e; };
  const active = ti => T[ti].ps.filter(q => q.active);
  const byDuty = (ti, d) => active(ti).find(q => q.duty === d);
  const eff = (q, k) => { const f = Math.min(1, q.fat / 120); const hit = ['dribble', 'press', 'recover', 'rebound', 'tackle'].includes(k) ? .25 * f : .10 * f; return q.c[k] * (1 - hit); };
  const tire = (q, kind) => { q.fat += P.fatigueCost[kind] * (1.6 - q.c.stamina / 100) * T[q.ti].tac.fat; };
  const duel = (A, D, b) => { const p = clamp(logistic((A - D) / P.k + b)); const roll = R(); return { p: +p.toFixed(3), roll: +roll.toFixed(3), win: roll < p }; };
  const MARK = { spear: 'anchor', link: 'link', anchor: 'spear' }; // attacker duty -> defending duty marking him
  function defenderFor(att) {
    const dt = 1 - poss; const want = MARK[att.duty] || 'anchor';
    let d = byDuty(dt, want); if (d && d.oop === 0) return { d, cover: false };
    const avail = active(dt).filter(q => q.oop === 0).sort((a, b) => (b.duty === 'anchor') - (a.duty === 'anchor'));
    return avail.length ? { d: avail[0], cover: true } : { d: null, cover: false };
  }
  function recoverTick() { // out-of-position defenders try to get back goal-side
    for (const q of active(1 - poss)) if (q.oop > 0) { const r = duel(eff(q, 'recover'), 70, P.b.recover); if (r.win || --q.oop <= 0) { if (q.oop > 0 || r.win) emit({ type: 'recovery_run', team: 1 - poss, actor: q.id, p: r.p, roll: r.roll, outcome: 'back_in_shape' }); q.oop = 0; } }
  }
  function turnover(winner, how, why) {
    const oldX = x, loser = carrier; poss = 1 - poss; x = 3 - oldX; carrier = winner; transition = oldX >= 2 || how === 'press_win';
    // players who were committed forward are now out of position
    for (const q of active(1 - poss)) q.oop = 0;
    if (transition) for (const q of active(1 - poss)) if (q.duty !== 'anchor' || how === 'press_win') q.oop = q.duty === 'spear' ? 2 : 1;
    if (oldX >= 2 && loser) loser.oop = Math.max(loser.oop, loser.duty === 'anchor' ? 2 : 1);
    if (active(1 - poss).length === 1) active(1 - poss)[0].oop = Math.min(1, active(1 - poss)[0].oop);
    lastPasser = null;
    emit({ type: 'turnover', team: poss, actor: winner.id, how, reason: why, zone: zone(), transition });
  }
  const zone = () => ({ x, lane: ['left', 'centre', 'right'][lane] });
  function restart(ti, why) { lastPasser = null; poss = ti; x = 0; lane = 1; transition = false; carrier = byDuty(ti, 'anchor') || active(ti)[0]; for (const tt of T) for (const q of tt.ps) q.oop = 0; t += P.dt.restart; emit({ type: 'restart', team: ti, actor: carrier.id, reason: why, zone: zone() }); }
  function shoot(kind) {
    const tac = T[poss].tac, sh = carrier;
    const { d, cover } = defenderFor(sh); const coverer = active(1 - poss).find(q => q.oop === 0 && q !== d && q.duty === 'anchor');
    emit({ type: 'shot_attempt', team: poss, actor: sh.id, zone: zone(), kind, pressure: d ? d.id : null });
    t += P.dt.shot;
    for (const bl of [d, coverer].filter(Boolean)) {
      const r = duel(eff(bl, 'tackle') * .5 + eff(bl, 'intercept') * .5, 75, bl === d ? P.block : P.blockCover);
      if (r.win) { emit({ type: 'block', team: 1 - poss, actor: bl.id, opp: sh.id, p: r.p, roll: r.roll, outcome: 'blocked' }); return loose('block'); }
    }
    const base = kind === 'fk' ? P.shot.fk : x === 3 ? P.shot.box[lane === 1 ? 'C' : 'S'] : P.shot.edge[lane === 1 ? 'C' : 'S'];
    const q = kind === 'box' || kind === 'one_v_one' ? eff(sh, 'shot') : eff(sh, 'long');
    const pg = Math.min(.8, Math.max(.01, logistic(base + (q - 75) / 15 + (transition ? P.shot.transition : 0) + (d ? P.shot.pressure : 0) + (kind === 'one_v_one' ? 0.9 : 0))));
    xg[poss] += pg;
    const roll = R();
    if (roll < pg) { score[poss]++; emit({ type: 'goal', team: poss, actor: sh.id, p: +pg.toFixed(3), roll: +roll.toFixed(3), kind, zone: zone(), assist: lastPasser }); over = mode === 'ko'; if (!over) restart(1 - poss, 'kickoff'); return; }
    const near = roll < pg + (1 - pg) * .35;
    emit({ type: 'shot_miss', team: poss, actor: sh.id, p: +pg.toFixed(3), roll: +roll.toFixed(3), outcome: near ? 'off_post_or_wide' : 'wide', kind });
    loose('wall');
  }
  function loose(src) { // wall rebound / loose ball contest in attacker's box
    const att = byDuty(poss, 'spear') && byDuty(poss, 'spear') !== carrier ? byDuty(poss, 'spear') : active(poss).sort((a, b) => b.c.rebound - a.c.rebound)[0];
    const def = active(1 - poss).filter(q => q.oop === 0).sort((a, b) => b.c.rebound - a.c.rebound)[0] || active(1 - poss)[0];
    const r = duel(eff(att, 'rebound'), eff(def, 'rebound') + 6, P.b.rebound);
    emit({ type: 'rebound', team: r.win ? poss : 1 - poss, actor: r.win ? att.id : def.id, opp: r.win ? def.id : att.id, p: r.p, roll: r.roll, source: src, outcome: r.win ? 'attack_keeps' : 'defence_clears' });
    if (r.win) { carrier = att; x = 3; lane = Math.floor(R() * 3); return; }
    poss = 1 - poss; x = 0; carrier = def; transition = false; lane = 1; lastPasser = null;
  }
  let lastPasser = null; const xg = [0, 0];
  function step() {
    recoverTick();
    const tac = T[poss].tac, dtac = T[1 - poss].tac, c = carrier;
    const { d, cover } = defenderFor(c);
    // does the defence engage? always in its own box; elsewhere by pressing intent
    const engageP = x === 3 ? 1 : x === 2 ? .8 : Math.min(.95, dtac.press + (x === 0 ? 0 : .2));
    const engaged = d && R() < engageP;
    const mates = active(poss).filter(q => q !== c);
    const spear = byDuty(poss, 'spear');
    const U = {};
    if (x >= 2) U.shoot = (x === 3 ? 1.2 + (c.c.shot - 75) / 18 : (c.c.long - 82) / 12) * tac.shoot * (engaged ? .7 : 1.6);
    if (!d) U.shoot = x >= 2 ? 6 : undefined;
    if (engaged) U.dribble = (.4 + (c.c.dribble - (d ? d.c.tackle : 50)) / 20) * tac.flair;
    if (!engaged && x < 3) U.carry = 1.2;
    if (mates.length) U.pass = (.5 + (c.c.pass - 70) / 25) * tac.patience * (engaged ? 1.3 : 1);
    if (spear && spear !== c && x >= 1 && x <= 2) U.through = ((c.c.vision - 78) / 10) * tac.direct * (transition ? 1.6 : 1);
    if (engaged) U.wall = ((c.c.dribble + c.c.pass) / 2 - 84) / 10 * tac.flair;
    if (engaged && x <= 1) U.shield = (c.c.escape - 72) / 15 * tac.patience;
    const db = c.duty === 'anchor' ? (x >= 2 ? .2 : .6) : c.duty === 'spear' ? 1.25 : 1; // duty discipline
    for (const k of ['carry', 'dribble', 'shoot', 'wall']) if (U[k] !== undefined) U[k] *= db;
    if (c.duty === 'anchor' && U.pass !== undefined) U.pass *= 1.6;
    const acts = Object.entries(U).filter(([, u]) => u !== undefined).map(([a, u]) => [a, Math.max(.03, u)]);
    let tot = acts.reduce((s, a) => s + a[1], 0), roll = R() * tot, act = acts[acts.length - 1][0];
    for (const [a, u] of acts) { if ((roll -= u) < 0) { act = a; break; } }
    const zbefore = zone();
    if (act === 'shoot') return shoot(!d ? 'one_v_one' : x === 3 ? 'box' : 'edge');
    if (act === 'carry') { x++; lane = (lane + Math.floor(R() * 3) + 2) % 3; t += P.dt.dribble; tire(c, 'sprint'); emit({ type: 'carry', team: poss, actor: c.id, zone: zone(), from: zbefore }); return; }
    if (act === 'dribble' || act === 'wall') {
      const A = act === 'wall' ? (eff(c, 'dribble') + c.c.pass) / 2 : eff(c, 'dribble');
      const r = duel(A, eff(d, 'tackle'), P.b[act] + (transition ? .3 : 0)); t += P.dt[act]; tire(c, 'duel'); tire(d, 'duel');
      const foulP = !r.win ? 0 : P.foul * (1 + dtac.aggr * 2) * (1.25 - d.c.tackle / 100) * 4; const fr = R();
      const e = emit({ type: act === 'wall' ? 'wall_pass' : 'dribble_duel', team: poss, actor: c.id, opp: d.id, p: r.p, roll: r.roll, zone: zbefore, outcome: r.win ? 'attacker_wins' : 'defender_wins', cover });
      if (r.win && fr < foulP) { e.outcome = 'fouled'; emit({ type: 'foul', team: 1 - poss, actor: d.id, opp: c.id, zone: zbefore }); if (x >= 2) { emit({ type: 'free_kick', team: poss, actor: c.id, zone: zbefore }); const best = active(poss).sort((a, b) => b.c.long - a.c.long)[0]; carrier = best; return shoot('fk'); } return; }
      if (r.win) { d.oop = 1; if (x < 3) x++; return; }
      return turnover(d, 'tackle', 'won_duel');
    }
    if (act === 'shield') { const pr = active(1 - poss).find(q => q.oop === 0) || d; const r = duel(eff(c, 'escape'), eff(pr, 'press'), P.b.shield); t += P.dt.shield; tire(pr, 'press'); emit({ type: 'press', team: 1 - poss, actor: pr.id, opp: c.id, p: r.p, roll: r.roll, zone: zbefore, outcome: r.win ? 'press_beaten' : 'ball_won' }); if (r.win) { pr.oop = 1; return; } return turnover(pr, 'press_win', 'press'); }
    if (act === 'pass' || act === 'through') {
      const recv = act === 'through' ? spear : mates.sort((a, b) => (b.duty === 'spear') - (a.duty === 'spear'))[Math.floor(R() * mates.length)];
      const { d: md } = defenderFor(recv);
      const fwd = act === 'through' ? 3 : Math.min(3, x + (recv.duty === 'spear' ? 1 : recv.duty === 'anchor' ? -1 : 0));
      const diff = act === 'through' ? -0.6 - (md ? 0 : -2) : (fwd > x ? -0.5 : 0.4);
      const r = md ? duel(eff(c, 'pass'), eff(md, 'intercept'), P.b[act] + diff + (engaged ? -.5 : 0)) : { p: 1, roll: R(), win: true };
      t += P.dt[act]; tire(c, 'pass');
      emit({ type: act === 'through' ? 'through_ball' : 'pass', team: poss, actor: c.id, target: recv.id, opp: md ? md.id : null, p: r.p, roll: +(+r.roll).toFixed(3), zone: zbefore, outcome: r.roll < r.p ? 'complete' : 'intercepted' });
      if (r.roll < r.p) { lastPasser = c.id; carrier = recv; x = Math.max(0, fwd); if (act === 'through' && md) { const race = duel(eff(recv, 'recover') * .5 + recv.c.dribble * .5, eff(md, 'recover'), .2); emit({ type: 'race', team: poss, actor: recv.id, opp: md.id, p: race.p, roll: race.roll, outcome: race.win ? 'attacker_clear' : 'defender_recovers' }); if (race.win) md.oop = 2; } return; }
      return turnover(md, 'interception', 'read_pass');
    }
  }
  restart(R() < .5 ? 0 : 1, 'kickoff');
  while (!over) {
    if (mode !== 'ko' && t >= 1200) { over = true; break; }
    step();
    if (t > 6000) throw Error('Cage golden-goal safety limit: simulation exceeded 100 minutes without a goal.');
  }
  const winner = score[0] > score[1] ? 0 : score[1] > score[0] ? 1 : -1;
  return { events, score, winner, duration: t, draws: R.count(), shapes: T.map(tt => ({ duty: Object.fromEntries(tt.ps.map(q => [q.id, q.duty])), cover: tt.shape.cover.map(v => +v.toFixed(1)) })) };
}

function stats(res, teams) {
  const s = teams.map(ids => ({ team: { poss: 0, shots: 0, onTarget: 0, passes: 0, passesOk: 0, dribbles: 0, dribblesOk: 0, tackles: 0, interceptions: 0, blocks: 0, goals: 0, chances: 0 }, players: Object.fromEntries(ids.map(id => [id, { shots: 0, goals: 0, passesOk: 0, dribblesOk: 0, tackles: 0, interceptions: 0, blocks: 0, chancesCreated: 0 }])) }));
  let prevT = 0, prevTeam = null;
  for (const e of res.events) {
    if (prevTeam !== null) s[prevTeam].team.poss += e.t - prevT; prevT = e.t;
    const ti = e.team; if (ti === undefined) continue; const pl = e.actor && s[ti].players[e.actor];
    switch (e.type) {
      case 'pass': case 'through_ball': s[ti].team.passes++; if (e.outcome === 'complete') { s[ti].team.passesOk++; pl.passesOk++; } else { s[1 - ti].team.interceptions++; s[1 - ti].players[e.opp].interceptions++; } break;
      case 'dribble_duel': case 'wall_pass': s[ti].team.dribbles++; if (e.outcome !== 'defender_wins') { s[ti].team.dribblesOk++; pl.dribblesOk++; } else { s[1 - ti].team.tackles++; s[1 - ti].players[e.opp].tackles++; } break;
      case 'shot_attempt': s[ti].team.shots++; pl.shots++; break;
      case 'goal': s[ti].team.goals++; s[ti].team.onTarget++; pl.goals++; if (e.assist && s[ti].players[e.assist]) s[ti].players[e.assist].chancesCreated++; break;
      case 'shot_miss': if (e.outcome === 'off_post_or_wide') s[ti].team.onTarget += 0; break;
      case 'block': s[ti].team.blocks++; pl.blocks++; break;
      case 'press': if (e.outcome === 'ball_won') { s[ti].team.tackles++; pl.tackles++; } break;
    }
    if (e.type === 'turnover' || e.type === 'restart' || (e.type === 'rebound')) prevTeam = e.team; else if (prevTeam === null) prevTeam = e.team;
  }
  const tot = s[0].team.poss + s[1].team.poss || 1; s.forEach(x => x.team.poss = Math.round(100 * x.team.poss / tot));
  return s;
}
window.CageEngine = { simulate, stats, ROSTER, BY_ID, comp, shape, TACTICS, P };
