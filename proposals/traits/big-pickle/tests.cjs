// Isolated trait prototype tests. Run: node proposals/traits/big-pickle/tests.cjs
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./trait-hooks.js');
const harness = require('./engine-harness.cjs');

const prod = harness.loadProduction();
const E = prod.window.CageEngine;
const C = prod.window.CageCapabilities;
const P = prod.window.CageTacticalParams.P;
const F = P.resolution;

let passed = 0;
const names = [];
function test(name, fn) {
  try {
    fn();
    passed++;
    names.push(name);
    console.log('PASS ' + name);
  } catch (e) {
    console.error('FAIL ' + name);
    throw e;
  }
}
function close(a, b, eps) { assert.ok(Math.abs(a - b) <= (eps || 1e-12), a + ' != ' + b); }
function approxEventP(e) {
  const z = e.calc.logit;
  const raw = prod.window.CAGE_SIGMOID_LUT[Math.max(0, Math.min(6144, Math.round(z * 256) + 3072))] / 1e6;
  if (e.type === 'goal' || e.type === 'shot_miss') return Math.max(F.shotMin, Math.min(F.shotMax, raw));
  return Math.max(P.clampLo, Math.min(P.clampHi, raw));
}

function mkTeam(ids, ti, positions) {
  const ps = ids.map(function (id, i) {
    return {
      id: id,
      c: C.comp(E.BY_ID[id]),
      ti: ti,
      oop: 0,
      pos: positions && positions[i] ? { x: positions[i].x, y: positions[i].y } : { x: ti === 0 ? 0 : 3, y: i },
      committed: false,
      duty: ['anchor', 'link', 'spear'][i],
      fat: 0,
      twoWay: false
    };
  });
  return {
    ti: ti,
    ps: ps,
    policy: prod.window.CagePolicy.derive(ids.map(function (id) { return E.BY_ID[id]; })),
    shape: { duty: [0, 1, 2], cover: [0, 0, 0] }
  };
}
function mkState(teams, pairs) {
  const byId = Object.create(null);
  for (const t of teams) for (const q of t.ps) byId[q.id] = { traits: pairs && pairs[q.id] ? pairs[q.id] : null };
  return H.init(teams, byId, { enabled: true });
}
function baseCtx(teams, state, poss, carrier, opts) {
  opts = opts || {};
  const ball = opts.ball || { x: carrier.pos.x, y: carrier.pos.y };
  return Object.assign({
    state: state,
    teams: teams,
    poss: poss,
    attack: teams[poss],
    defend: teams[1 - poss],
    carrier: carrier,
    zone: opts.zone || { x: ball.x, lane: ['left', 'centre', 'right'][ball.y] },
    ball: ball,
    x: opts.x === undefined ? ball.x : opts.x,
    tick: opts.tick === undefined ? 0 : opts.tick,
    defX: opts.defX === undefined ? 3 - ball.x : opts.defX,
    runners: opts.runners || [],
    engaged: !!opts.engaged,
    transition: !!opts.transition,
    recentRegain: !!opts.recentRegain,
    defenders: opts.defenders === undefined ? 1 : opts.defenders
  }, opts);
}
function snapshot(obj) { return JSON.stringify(obj); }

// ---------------------------------------------------------------------------
test('catalog and runtime distribution match the spec (15 traits, 78 traited, 61 untraited)', function () {
  assert.equal(H.CATALOG.length, 15);
  const d = H.distribution(prod.window.THE_CAGE_PLAYERS);
  assert.equal(d.roster, 139);
  assert.equal(d.traited, 78);
  assert.equal(d.untraited, 61);
  const expected = {
    Wall: [7, 4], Enforcer: [4, 4], Anticipator: [4, 7], Hunter: [5, 4], Libero: [1, 1],
    Maestro: [4, 6], Architect: [7, 7], Destroyer: [3, 0], Engine: [5, 7], Surgeon: [4, 8],
    Predator: [12, 4], Magician: [6, 3], Executioner: [9, 12], Phantom: [3, 6], Juggernaut: [4, 5]
  };
  for (const name of H.CATALOG) {
    assert.equal(d.primary[name], expected[name][0], name + ' primary');
    assert.equal(d.secondary[name], expected[name][1], name + ' secondary');
  }
});

test('Wall: H2b slot-1 lane hold and H4 containment; x=3 unchanged', function () {
  const A = mkTeam(['andrea-pirlo', 'xavi-hernandez', 'kaka'], 0, [{ x: 2, y: 1 }, { x: 2, y: 0 }, { x: 2, y: 2 }]);
  const D = mkTeam(['alessandro-nesta', 'fabio-cannavaro', 'gennaro-gattuso'], 1, [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 2 }]);
  const carrier = A.ps[0];
  const state = mkState([A, D], { 'alessandro-nesta': { primary: 'Wall', secondary: 'Anticipator' } });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 2, y: 1 }, zone: { x: 2, lane: 'centre' }, runners: [A.ps[1]] });
  const t3 = { x: 2, y: 2 };
  const out = H.defendTarget(D.ps[0], 1, t3, ctx);
  assert.notDeepEqual(out, t3);
  assert.deepEqual(out, { x: 3, y: 1 });
  close(H.engage(D.ps[0], 0.85, Object.assign({}, ctx, { x: 2 })), 0.65);
  assert.equal(H.engage(D.ps[0], 1, Object.assign({}, ctx, { x: 3 })), 1);
});

test('Enforcer: H2b marks highest-ATT non-carrier and H4 raises engagement', function () {
  const A = mkTeam(['kaka', 'andrea-pirlo', 'xavi-hernandez'], 0, [{ x: 2, y: 1 }, { x: 2, y: 0 }, { x: 2, y: 2 }]);
  const D = mkTeam(['gennaro-gattuso', 'fabio-cannavaro', 'alessandro-nesta'], 1, [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 1, y: 2 }]);
  const carrier = A.ps[0];
  const state = mkState([A, D], { 'gennaro-gattuso': { primary: 'Enforcer', secondary: 'Anticipator' } });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 2, y: 1 }, zone: { x: 2, lane: 'centre' } });
  const best = A.ps.filter(function (q) { return q !== carrier; }).sort(function (a, b) {
    return b.c.ATT - a.c.ATT || b.c.shot - a.c.shot || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  })[0];
  const out = H.defendTarget(D.ps[0], 2, { x: 0, y: 0 }, ctx);
  assert.deepEqual(out, best.pos);
  close(H.engage(D.ps[0], 0.5, Object.assign({}, ctx, { x: 2 })), 0.65);
});

test('Anticipator: H2b sits on the ball-to-runner path', function () {
  const A = mkTeam(['andrea-pirlo', 'kaka', 'xavi-hernandez'], 0, [{ x: 0, y: 1 }, { x: 3, y: 1 }, { x: 2, y: 2 }]);
  const D = mkTeam(['fabio-cannavaro', 'gennaro-gattuso', 'alessandro-nesta'], 1, [{ x: 2, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 2 }]);
  const carrier = A.ps[0];
  const runner = A.ps[1];
  const state = mkState([A, D], { 'fabio-cannavaro': { primary: 'Anticipator', secondary: 'Wall' } });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 0, y: 1 }, zone: { x: 0, lane: 'centre' }, runners: [runner] });
  const out = H.defendTarget(D.ps[0], 2, { x: 0, y: 0 }, ctx);
  assert.deepEqual(out, { x: 2, y: 1 });
  assert.ok(H._internals.passPath(ctx.ball, runner.pos).some(function (p) { return p.x === out.x && p.y === out.y; }));
});

test('Hunter: H2b pursuit point and H4 chase engagement', function () {
  const A = mkTeam(['andrea-pirlo', 'kaka', 'xavi-hernandez'], 0, [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 0 }]);
  const D = mkTeam(['cafu', 'fabio-cannavaro', 'alessandro-nesta'], 1, [{ x: 3, y: 2 }, { x: 1, y: 0 }, { x: 0, y: 2 }]);
  const carrier = A.ps[0];
  const runner = A.ps[1];
  const state = mkState([A, D], { cafu: { primary: 'Hunter', secondary: 'Engine' } });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 1, y: 1 }, zone: { x: 1, lane: 'centre' }, runners: [runner] });
  const out = H.defendTarget(D.ps[0], 2, { x: 3, y: 1 }, ctx);
  assert.deepEqual(out, { x: 3, y: 2 });
  state.prevAction[carrier.id] = 'carry';
  close(H.engage(D.ps[0], 0.5, Object.assign({}, ctx, { x: 1 })), 0.65);
});

test('Libero: H2b sweeper cell and H5 step-out carry', function () {
  const A = mkTeam(['andrea-pirlo', 'kaka', 'xavi-hernandez'], 0, [{ x: 1, y: 1 }, { x: 2, y: 0 }, { x: 2, y: 2 }]);
  const D = mkTeam(['franz-beckenbauer', 'gennaro-gattuso', 'alessandro-nesta'], 1, [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }]);
  const carrier = A.ps[0];
  const state = mkState([A, D], {
    'franz-beckenbauer': { primary: 'Libero', secondary: 'Architect' },
    'andrea-pirlo': { primary: 'Libero', secondary: 'Anticipator' }
  });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 1, y: 1 }, zone: { x: 1, lane: 'centre' } });
  const out = H.defendTarget(D.ps[0], 1, { x: 2, y: 2 }, ctx);
  assert.deepEqual(out, { x: 3, y: 1 });
  const u = H.utilities(carrier, { carry: 1, pass: 1, shield: 1 }, Object.assign({}, ctx, { x: 1, engaged: false }));
  close(u.weights.carry, 1.6);
  close(u.weights.shield, 0.7);
  assert.equal(u.weights.pass, 1);
});

test('Maestro: H5 tempo and H6a open-receiver weighting', function () {
  const A = mkTeam(['xavi-hernandez', 'kaka', 'andrea-pirlo'], 0, [{ x: 1, y: 1 }, { x: 2, y: 0 }, { x: 2, y: 2 }]);
  const D = mkTeam(['gennaro-gattuso', 'alessandro-nesta', 'fabio-cannavaro'], 1, [{ x: 3, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 2 }]);
  const carrier = A.ps[0];
  const mates = [A.ps[1], A.ps[2]];
  const state = mkState([A, D], { 'xavi-hernandez': { primary: 'Maestro', secondary: 'Anticipator' } });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 1, y: 1 }, zone: { x: 1, lane: 'centre' } });
  const u = H.utilities(carrier, { pass: 1, through: 1, carry: 1, shoot: 1 }, ctx);
  close(u.weights.pass, 1.4);
  close(u.weights.through, 0.75);
  close(u.weights.carry, 0.8);
  assert.equal(u.weights.shoot, 1);
  const w = H.receiverWeights(carrier, mates, ctx);
  assert.ok(w[0] > w[1], 'open forward mate must outweigh covered mate');
  const chosen = H.receiver(carrier, mates, carrier, 0, null, null, 0.5, ctx);
  assert.equal(chosen, mates[0]);
  assert.equal(mates[Math.floor(0.5 * mates.length)], mates[1]);
});

test('Architect: H5 progressive passing and H6a forward weighting', function () {
  const A = mkTeam(['paul-scholes', 'kaka', 'andrea-pirlo'], 0, [{ x: 1, y: 1 }, { x: 3, y: 0 }, { x: 0, y: 2 }]);
  const D = mkTeam(['gennaro-gattuso', 'alessandro-nesta', 'fabio-cannavaro'], 1, [{ x: 3, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 2 }]);
  const carrier = A.ps[0];
  const mates = [A.ps[1], A.ps[2]];
  const state = mkState([A, D], { 'paul-scholes': { primary: 'Architect', secondary: 'Anticipator' } });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 1, y: 1 }, zone: { x: 1, lane: 'centre' } });
  const u = H.utilities(carrier, { through: 1, carry: 1, pass: 1 }, ctx);
  close(u.weights.through, 1.5);
  close(u.weights.carry, 0.85);
  const w = H.receiverWeights(carrier, mates, ctx);
  assert.ok(w[0] > w[1]);
  const engaged = H.utilities(carrier, { through: 1, carry: 1 }, Object.assign({}, ctx, { engaged: true }));
  close(engaged.weights.through, 1.25);
  close(engaged.weights.carry, 0.925);
});

test('Destroyer: H2a slot swap, H4 counter-press, H5 release', function () {
  const A = mkTeam(['andrea-pirlo', 'kaka', 'xavi-hernandez'], 0, [{ x: 1, y: 1 }, { x: 1, y: 0 }, { x: 1, y: 2 }]);
  const D = mkTeam(['gennaro-gattuso', 'alessandro-nesta', 'fabio-cannavaro'], 1, [{ x: 0, y: 0 }, { x: 2, y: 1 }, { x: 1, y: 2 }]);
  const carrier = A.ps[0];
  const state = mkState([A, D], {
    'andrea-pirlo': { primary: 'Destroyer', secondary: 'Wall' },
    'alessandro-nesta': { primary: 'Destroyer', secondary: 'Engine' }
  });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 1, y: 1 }, zone: { x: 1, lane: 'centre' } });
  const available = [D.ps[0], D.ps[1], D.ps[2]];
  const slots = H.defSlots(available, ctx);
  assert.equal(slots[0], D.ps[1]);
  assert.equal(slots[1], D.ps[0]);
  close(H.engage(D.ps[1], 0.5, Object.assign({}, ctx, { x: 1 })), 0.65);
  close(H.engage(D.ps[1], 0.5, Object.assign({}, ctx, { x: 1, recentRegain: true })), 0.75);
  const u = H.utilities(carrier, { pass: 1, dribble: 1, carry: 1 }, ctx);
  close(u.weights.pass, 1.3);
  close(u.weights.dribble, 0.7);
  close(u.weights.carry, 0.8);
});

test('Engine: H1 support run, H3 commitment safety, H2b recovery, H5 carry', function () {
  const A = mkTeam(['cafu', 'andrea-pirlo', 'kaka'], 0, [{ x: 1, y: 1 }, { x: 0, y: 1 }, { x: 2, y: 2 }]);
  const D = mkTeam(['alessandro-nesta', 'gennaro-gattuso', 'fabio-cannavaro'], 1, [{ x: 2, y: 1 }, { x: 1, y: 0 }, { x: 0, y: 2 }]);
  const carrier = A.ps[2];
  carrier.pos = { x: 2, y: 2 };
  const q = A.ps[0];
  const state = mkState([A, D], {
    cafu: { primary: 'Engine', secondary: 'Libero' },
    kaka: { primary: 'Engine', secondary: 'Libero' },
    'alessandro-nesta': { primary: 'Engine', secondary: 'Libero' }
  });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 2, y: 2 }, zone: { x: 2, lane: 'right' } });
  const out = H.attackTarget(q, { x: 1, y: 1 }, ctx);
  assert.deepEqual(out, { x: 2, y: 1 });
  assert.ok(state.pendingCommit.has(q.id));
  H.commitAdjust(A, ctx);
  assert.equal(q.committed, true);
  assert.ok(A.ps.some(function (p) { return p !== q && !p.committed; }));
  const u = H.utilities(carrier, { carry: 1, pass: 1 }, Object.assign({}, ctx, { x: 2, engaged: false }));
  close(u.weights.carry, 1.3);
  const dq = D.ps[0];
  state.lastTurnover = { tick: 0, committed: new Set([dq.id]) };
  dq.oop = 0;
  const rec = H.defendTarget(dq, 1, { x: 0, y: 0 }, Object.assign({}, ctx, { tick: 1, defX: 2, ball: { x: 1, y: 1 } }));
  assert.deepEqual(rec, { x: 2, y: 1 });
});

test('Surgeon: H5 through ball and H6b fewest-path-defender runner', function () {
  const A = mkTeam(['cesc-fabregas', 'kaka', 'andrea-pirlo'], 0, [{ x: 2, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 2 }]);
  const D = mkTeam(['gennaro-gattuso', 'alessandro-nesta', 'fabio-cannavaro'], 1, [{ x: 3, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 1 }]);
  const carrier = A.ps[0];
  const forward = [A.ps[1], A.ps[2]];
  const state = mkState([A, D], { 'cesc-fabregas': { primary: 'Surgeon', secondary: 'Anticipator' } });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 2, y: 0 }, zone: { x: 2, lane: 'left' }, runners: forward });
  const u = H.utilities(carrier, { through: 1, pass: 1 }, ctx);
  close(u.weights.through, 1.5);
  const chosen = H.runner(carrier, forward, 'through', ctx);
  assert.equal(chosen, A.ps[1]);
  assert.ok(H._internals.pathDefenderCount([A, D], 0, carrier.pos, A.ps[1].pos) <
    H._internals.pathDefenderCount([A, D], 0, carrier.pos, A.ps[2].pos));
});

test('Predator: H1 box lane and H5 box shooting', function () {
  const A = mkTeam(['cristiano-ronaldo', 'andrea-pirlo', 'kaka'], 0, [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }]);
  const D = mkTeam(['alessandro-nesta', 'gennaro-gattuso', 'fabio-cannavaro'], 1, [{ x: 3, y: 0 }, { x: 3, y: 1 }, { x: 0, y: 2 }]);
  const carrier = A.ps[1];
  const q = A.ps[0];
  q.committed = true;
  const state = mkState([A, D], {
    'cristiano-ronaldo': { primary: 'Predator', secondary: 'Executioner' },
    'andrea-pirlo': { primary: 'Predator', secondary: 'Anticipator' }
  });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 2, y: 1 }, zone: { x: 2, lane: 'centre' } });
  const out = H.attackTarget(q, { x: 2, y: 0 }, ctx);
  assert.equal(out.x, 3);
  assert.equal(out.y, 2);
  const u = H.utilities(carrier, { shoot: 1, pass: 1, dribble: 1 }, Object.assign({}, ctx, { x: 3 }));
  close(u.weights.shoot, 1.4);
  close(u.weights.pass, 0.8);
  close(u.weights.dribble, 0.8);
});

test('Magician: H5 take-on and double-defender invite', function () {
  const A = mkTeam(['neymar', 'andrea-pirlo', 'kaka'], 0, [{ x: 2, y: 1 }, { x: 2, y: 0 }, { x: 2, y: 2 }]);
  const D = mkTeam(['gennaro-gattuso', 'alessandro-nesta', 'fabio-cannavaro'], 1, [{ x: 3, y: 1 }, { x: 0, y: 0 }, { x: 0, y: 2 }]);
  const carrier = A.ps[0];
  const state = mkState([A, D], { neymar: { primary: 'Magician', secondary: 'Anticipator' } });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 2, y: 1 }, zone: { x: 2, lane: 'centre' }, engaged: true, defenders: 1 });
  const u = H.utilities(carrier, { dribble: 1, wall: 1, pass: 1 }, ctx);
  close(u.weights.dribble, 1.5);
  close(u.weights.wall, 1.3);
  close(u.weights.pass, 0.8);
  const crowdedCtx = Object.assign({}, ctx, { defenders: 2 });
  close(H._internals.beta('Magician', 'dribble', crowdedCtx), 0.7);
  const crowded = H.utilities(carrier, { dribble: 1 }, crowdedCtx);
  close(crowded.weights.dribble, 1.6);
});

test('Executioner: H5 edge shooting only at x=2', function () {
  const A = mkTeam(['cristiano-ronaldo', 'andrea-pirlo', 'kaka'], 0, [{ x: 2, y: 1 }, { x: 2, y: 0 }, { x: 2, y: 2 }]);
  const D = mkTeam(['gennaro-gattuso', 'alessandro-nesta', 'fabio-cannavaro'], 1, [{ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 0, y: 2 }]);
  const carrier = A.ps[0];
  const state = mkState([A, D], { 'cristiano-ronaldo': { primary: 'Executioner', secondary: 'Anticipator' } });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 2, y: 1 }, zone: { x: 2, lane: 'centre' } });
  close(H.utilities(carrier, { shoot: 1, pass: 1 }, ctx).weights.shoot, 1.6);
  assert.equal(H.utilities(carrier, { shoot: 1 }, Object.assign({}, ctx, { x: 3 })).weights.shoot, 1);
});

test('Phantom: H1 gap lane and H5 release/retain', function () {
  const A = mkTeam(['mesut-ozil', 'andrea-pirlo', 'kaka'], 0, [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }]);
  const D = mkTeam(['gennaro-gattuso', 'alessandro-nesta', 'fabio-cannavaro'], 1, [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 0, y: 2 }]);
  const carrier = A.ps[1];
  const q = A.ps[0];
  q.committed = true;
  const state = mkState([A, D], {
    'mesut-ozil': { primary: 'Phantom', secondary: 'Magician' },
    'andrea-pirlo': { primary: 'Phantom', secondary: 'Anticipator' }
  });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 1, y: 1 }, zone: { x: 1, lane: 'centre' } });
  const out = H.attackTarget(q, { x: 1, y: 0 }, ctx);
  assert.deepEqual(out, { x: 2, y: 2 });
  const engaged = H.utilities(carrier, { pass: 1, wall: 1, dribble: 1 }, Object.assign({}, ctx, { engaged: true }));
  close(engaged.weights.pass, 1.3);
  close(engaged.weights.wall, 1.3);
  close(engaged.weights.dribble, 0.7);
  const unengaged = H.utilities(carrier, { carry: 1 }, Object.assign({}, ctx, { x: 2, engaged: false }));
  close(unengaged.weights.carry, 0.8);
});

test('Juggernaut: H1 centre target, H5 hold-up, H6b outlet target', function () {
  const A = mkTeam(['didier-drogba', 'andrea-pirlo', 'kaka'], 0, [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 3, y: 2 }]);
  const D = mkTeam(['gennaro-gattuso', 'alessandro-nesta', 'fabio-cannavaro'], 1, [{ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 0, y: 2 }]);
  const carrier = A.ps[1];
  const q = A.ps[0];
  q.committed = true;
  const state = mkState([A, D], {
    'didier-drogba': { primary: 'Juggernaut', secondary: 'Engine' },
    'andrea-pirlo': { primary: 'Juggernaut', secondary: 'Engine' },
    kaka: { primary: 'Surgeon', secondary: 'Maestro' }
  });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 1, y: 1 }, zone: { x: 1, lane: 'centre' }, transition: true });
  assert.deepEqual(H.attackTarget(q, { x: 2, y: 0 }, ctx), { x: 3, y: 1 });
  const hold = H.utilities(carrier, { shield: 1, pass: 1 }, Object.assign({}, ctx, { x: 1, engaged: true }));
  close(hold.weights.shield, 1.5);
  const press = H.utilities(carrier, { dribble: 1, pass: 1 }, Object.assign({}, ctx, { x: 2, engaged: true }));
  close(press.weights.dribble, 1.3);
  close(press.weights.pass, 0.8);
  const outlet = H.runner(carrier, [A.ps[2], q], 'outlet', ctx);
  assert.equal(outlet, q);
});

test('strength and exclude: primary 1.0, secondary 0.5, excluded 0', function () {
  const A = mkTeam(['andrea-pirlo', 'kaka', 'xavi-hernandez'], 0);
  const D = mkTeam(['alessandro-nesta', 'gennaro-gattuso', 'fabio-cannavaro'], 1);
  const state = mkState([A, D], { 'andrea-pirlo': { primary: 'Maestro', secondary: 'Architect' } });
  assert.equal(H.strength(A.ps[0], 'Maestro', state), 1);
  assert.equal(H.strength(A.ps[0], 'Architect', state), 0.5);
  assert.equal(H.strength(A.ps[0], 'Wall', state), 0);
  state.exclude.add('Maestro');
  assert.equal(H.strength(A.ps[0], 'Maestro', state), 0);
  assert.equal(H.strength(A.ps[0], 'Architect', state), 0.5);
});

test('secondary duty cycle is exactly half over 100 ticks', function () {
  const A = mkTeam(['andrea-pirlo', 'kaka', 'xavi-hernandez'], 0);
  const D = mkTeam(['alessandro-nesta', 'gennaro-gattuso', 'fabio-cannavaro'], 1);
  const state = mkState([A, D], { 'alessandro-nesta': { primary: 'Wall', secondary: 'Hunter' } });
  let secondary = 0;
  for (let tick = 0; tick < 100; tick++) {
    state.tick = tick;
    const list = H.discreteList(D.ps[0], state);
    if (list.some(function (t) { return t.slot === 's' && t.name === 'Hunter'; })) secondary++;
  }
  assert.equal(secondary, 50);
});

test('utility multiplier product clamps to [0.6, 1.6]', function () {
  const A = mkTeam(['andrea-pirlo', 'kaka', 'xavi-hernandez'], 0);
  const D = mkTeam(['alessandro-nesta', 'gennaro-gattuso', 'fabio-cannavaro'], 1);
  const state = mkState([A, D], { 'andrea-pirlo': { primary: 'Libero', secondary: 'Engine' } });
  const carrier = A.ps[0];
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 1, y: 1 }, zone: { x: 1, lane: 'centre' }, engaged: false });
  const u = H.utilities(carrier, { carry: 1 }, Object.assign({}, ctx, { x: 1 }));
  close(u.weights.carry, 1.6);
});

test('invalid trait pairs throw; untraited players are literal T3 values', function () {
  const A = mkTeam(['andrea-pirlo', 'kaka', 'xavi-hernandez'], 0);
  const D = mkTeam(['alessandro-nesta', 'gennaro-gattuso', 'fabio-cannavaro'], 1);
  assert.throws(function () { mkState([A, D], { 'andrea-pirlo': { primary: 'Nope', secondary: 'Wall' } }); }, /Invalid trait pair/);
  assert.throws(function () { mkState([A, D], { 'andrea-pirlo': { primary: 'Wall', secondary: 'Wall' } }); }, /Invalid trait pair/);
  assert.throws(function () { mkState([A, D], { 'andrea-pirlo': { primary: 'Wall' } }); }, /Invalid trait pair/);
  const state = mkState([A, D], {});
  const carrier = A.ps[0];
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 1, y: 1 }, zone: { x: 1, lane: 'centre' } });
  const target = { x: 2, y: 0 };
  assert.deepEqual(H.attackTarget(A.ps[1], target, ctx), target);
  assert.equal(H.engage(D.ps[0], 0.37, Object.assign({}, ctx, { x: 1 })), 0.37);
  assert.equal(H.receiverWeights(carrier, [A.ps[1], A.ps[2]], ctx), null);
  assert.equal(H.runner(carrier, [A.ps[1], A.ps[2]], 'through', ctx), null);
  const slots = [D.ps[0], D.ps[1]];
  assert.equal(H.defSlots(slots, ctx), slots);
  const U = { pass: 1, carry: 1 };
  const before = snapshot(U);
  const out = H.utilities(carrier, U, ctx);
  assert.equal(snapshot(U), before);
  assert.deepEqual(out.weights, U);
});

test('hooks do not mutate player positions, commitment or the input utility object', function () {
  const A = mkTeam(['andrea-pirlo', 'kaka', 'xavi-hernandez'], 0, [{ x: 1, y: 1 }, { x: 2, y: 0 }, { x: 2, y: 2 }]);
  const D = mkTeam(['alessandro-nesta', 'gennaro-gattuso', 'fabio-cannavaro'], 1, [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }]);
  const carrier = A.ps[0];
  const state = mkState([A, D], {
    'andrea-pirlo': { primary: 'Maestro', secondary: 'Architect' },
    'alessandro-nesta': { primary: 'Wall', secondary: 'Anticipator' }
  });
  const ctx = baseCtx([A, D], state, 0, carrier, { ball: { x: 1, y: 1 }, zone: { x: 1, lane: 'centre' } });
  const before = snapshot([A.ps.map(function (q) { return [q.pos, q.committed]; }), D.ps.map(function (q) { return [q.pos, q.committed]; })]);
  const U = { pass: 1, through: 1, carry: 1 };
  H.attackTarget(A.ps[1], { x: 2, y: 0 }, ctx);
  H.defendTarget(D.ps[0], 1, { x: 2, y: 1 }, ctx);
  H.engage(D.ps[0], 0.5, Object.assign({}, ctx, { x: 1 }));
  H.utilities(carrier, U, ctx);
  H.receiverWeights(carrier, [A.ps[1], A.ps[2]], ctx);
  assert.equal(snapshot([A.ps.map(function (q) { return [q.pos, q.committed]; }), D.ps.map(function (q) { return [q.pos, q.committed]; })]), before);
  assert.deepEqual(U, { pass: 1, through: 1, carry: 1 });
});

test('no RNG, wall-clock, role or legacy rating reads in the trait module', function () {
  const src = fs.readFileSync(path.join(__dirname, 'trait-hooks.js'), 'utf8');
  assert.ok(!/Math\.random|Date\.now|performance\.now/.test(src), 'nondeterministic source');
  assert.ok(!/\.role\b/.test(src), 'role read');
  assert.ok(!/\bR\(\)/.test(src), 'RNG call');
  assert.ok(!/probability\s*\(|duel\s*\(|shoot\s*\(/.test(src), 'outcome function reference');
});

test('engine patch adds no R() call sites', function () {
  const tactical = fs.readFileSync(path.join(harness.ROOT, 'src/engine/tactical-match.js'), 'utf8');
  const patched = harness.patchTactical(tactical);
  const count = function (s) { return (s.match(/\bR\(\)/g) || []).length; };
  assert.equal(count(patched), count(tactical));
});

// ---------------------------------------------------------------------------
test('baseline OFF: production and patched engine are byte-identical', function () {
  const patched = harness.loadPatched();
  const PEngine = patched.window.CageEngine;
  const pairs = [
    [['alessandro-nesta', 'fabio-cannavaro', 'andrea-pirlo'], ['gennaro-gattuso', 'cafu', 'kaka']],
    [['xavi-hernandez', 'andres-iniesta', 'lionel-messi'], ['sergio-ramos', 'claude-makelele', 'ronaldo-nazario']],
    [['franz-beckenbauer', 'michael-ballack', 'ronaldo-nazario'], ['paolo-maldini', 'andrea-pirlo', 'ronaldinho']]
  ];
  const tactics = [['balanced', 'press'], ['possession', 'counter'], ['press', 'balanced']];
  let checked = 0;
  for (let i = 0; i < pairs.length; i++) {
    for (let seed = 1; seed <= 60; seed++) {
      const input = { teams: pairs[i], tactics: tactics[i], seed: seed, mode: 'ko' };
      const a = E.simulate(input);
      for (const traits of [undefined, false, { enabled: false }]) {
        const b = PEngine.simulate(Object.assign({}, input, { traits: traits }));
        assert.equal(b.eventHash, a.eventHash, 'hash ' + i + '/' + seed + '/' + JSON.stringify(traits));
        assert.equal(b.draws, a.draws, 'draws ' + i + '/' + seed);
        assert.equal(b.score[0], a.score[0]);
        assert.equal(b.score[1], a.score[1]);
        assert.equal(b.duration, a.duration);
        assert.equal(JSON.stringify(b), JSON.stringify(a), 'byte identity ' + i + '/' + seed);
      }
      checked++;
    }
  }
  assert.ok(checked >= 180);
});

test('determinism ON: same input twice is identical; no state leaks', function () {
  const patched = harness.loadPatched();
  const PEngine = patched.window.CageEngine;
  const input = {
    teams: [['alessandro-nesta', 'fabio-cannavaro', 'andrea-pirlo'], ['gennaro-gattuso', 'cafu', 'kaka']],
    tactics: ['balanced', 'press'], seed: 42, mode: 'ko', traits: { enabled: true }
  };
  const a = PEngine.simulate(input);
  const b = PEngine.simulate(input);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  const off = PEngine.simulate(Object.assign({}, input, { traits: false }));
  const c = PEngine.simulate(input);
  assert.equal(JSON.stringify(a), JSON.stringify(c));
  assert.notEqual(off.eventHash, a.eventHash);
});

test('ON changes decisions for traited holders, without touching recorded duel/shot odds', function () {
  const patched = harness.loadPatched();
  const PEngine = patched.window.CageEngine;
  const inputs = [
    { teams: [['alessandro-nesta', 'fabio-cannavaro', 'andrea-pirlo'], ['gennaro-gattuso', 'cafu', 'kaka']], tactics: ['balanced', 'press'], seed: 42 },
    { teams: [['cristiano-ronaldo', 'xavi-hernandez', 'franz-beckenbauer'], ['gennaro-gattuso', 'alessandro-nesta', 'didier-drogba']], tactics: ['possession', 'counter'], seed: 7 },
    { teams: [['neymar', 'mesut-ozil', 'cesc-fabregas'], ['gennaro-gattuso', 'alessandro-nesta', 'fabio-cannavaro']], tactics: ['balanced', 'balanced'], seed: 99 }
  ];
  let changed = 0;
  for (const base of inputs) {
    const off = PEngine.simulate(Object.assign({}, base, { mode: 'ko', traits: false }));
    const on = PEngine.simulate(Object.assign({}, base, { mode: 'ko', traits: { enabled: true } }));
    if (off.eventHash !== on.eventHash) changed++;
    assert.ok(on.traits && on.traits.version === H.VERSION);
    assert.ok(on.traits.totals.active > 0, 'no trait activated');
    for (const e of on.events) {
      if (e.p !== undefined && e.calc && e.calc.logit !== undefined) {
        const expected = approxEventP(e);
        assert.ok(Math.abs(e.p - expected) <= 1e-9, 'outcome audit ' + e.type + ' ' + e.p + ' vs ' + expected);
      }
    }
  }
  assert.ok(changed >= 2, 'expected trait-on decisions to change at least two probes');
});

test('ON outcome audit: every recorded duel/shot p is logistic(calc.logit), no trait inputs', function () {
  const patched = harness.loadPatched();
  const PEngine = patched.window.CageEngine;
  let audited = 0;
  for (const seed of [1, 2, 3, 7, 42, 99]) {
    const input = {
      teams: [['cristiano-ronaldo', 'xavi-hernandez', 'franz-beckenbauer'], ['gennaro-gattuso', 'alessandro-nesta', 'didier-drogba']],
      tactics: ['possession', 'counter'], seed: seed, mode: 'ko', traits: { enabled: true }
    };
    const result = PEngine.simulate(input);
    for (const e of result.events) {
      if (e.p !== undefined && e.calc && e.calc.logit !== undefined) {
        assert.ok(Math.abs(e.p - approxEventP(e)) <= 1e-9, e.type + ' p mismatch');
        audited++;
      }
    }
  }
  assert.ok(audited > 10, 'expected duel/shot events');
});

test('exclude: all 15 on an enabled engine is inert and matches T3', function () {
  const patched = harness.loadPatched();
  const PEngine = patched.window.CageEngine;
  const input = {
    teams: [['alessandro-nesta', 'fabio-cannavaro', 'andrea-pirlo'], ['gennaro-gattuso', 'cafu', 'kaka']],
    tactics: ['balanced', 'press'], seed: 42, mode: 'ko'
  };
  const off = E.simulate(input);
  const inert = PEngine.simulate(Object.assign({}, input, { traits: { enabled: true, exclude: H.CATALOG.slice() } }));
  assert.equal(inert.eventHash, off.eventHash);
  assert.equal(inert.draws, off.draws);
  assert.equal(JSON.stringify(inert.events), JSON.stringify(off.events));
});

console.log('\n' + passed + ' tests passed');
console.log(JSON.stringify({ pass: true, tests: names, count: passed }, null, 2));
