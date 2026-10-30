// THE CAGE: isolated, decision-only trait hook module (prototype).
// No ratings, duel/shot probability, hidden outcome bonus, or bonus RNG.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CageTraitHooks = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var VERSION = 'traits-proto-1';
  var CATALOG = Object.freeze([
    'Wall', 'Enforcer', 'Anticipator', 'Tracker', 'Libero',
    'Maestro', 'Architect', 'Destroyer', 'Engine', 'Surgeon',
    'Predator', 'Magician', 'Executioner', 'Phantom', 'Juggernaut'
  ]);

  // Initial, stated-once values from CLAUDE_TRAIT_SPEC.md §3. Not fitted to gates.
  var TRAIT_PARAMS = Object.freeze({
    Wall: { engage: -0.20 },
    Enforcer: { engage: 0.15 },
    Anticipator: {},
    Tracker: { engage: 0.15 },
    Libero: { carry: 0.6, through: 0.4, shield: -0.3 },
    Maestro: {
      pass: 0.4, through: -0.25, carry: -0.2,
      engagedPass: 0.3, wall: 0.2, dribble: -0.3
    },
    Architect: { through: 0.5, carry: -0.15 },
    Destroyer: { engage: 0.15, counterPress: 0.10, pass: 0.3, dribble: -0.3, carry: -0.2 },
    Engine: { carry: 0.3 },
    Surgeon: { through: 0.5, engagedThrough: 0.25 },
    Predator: { shoot: 0.4, pass: -0.2, dribble: -0.2, layoffPass: 0.2 },
    Magician: { dribble: 0.5, wall: 0.3, crowdDribble: 0.2, pass: -0.2 },
    Executioner: { shoot: 0.6 },
    Phantom: { pass: 0.3, wall: 0.3, dribble: -0.3, carry: -0.2 },
    Juggernaut: { shield: 0.5, dribble: 0.3, pass: -0.2 }
  });

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function dist(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
  function oriented(p, ti) { return ti === 0 ? p.x : 3 - p.x; }
  function world(poss, x, y) { return { x: poss === 0 ? x : 3 - x, y: y }; }
  function validPair(raw) {
    return raw && typeof raw === 'object' &&
      typeof raw.primary === 'string' && typeof raw.secondary === 'string' &&
      CATALOG.indexOf(raw.primary) !== -1 && CATALOG.indexOf(raw.secondary) !== -1 &&
      raw.primary !== raw.secondary;
  }
  function assertPair(raw, id) {
    if (!validPair(raw)) throw Error('Invalid trait pair: ' + id);
  }

  function init(teams, byId, config) {
    var exclude = new Set(Array.isArray(config && config.exclude) ? config.exclude : []);
    var state = {
      version: VERSION,
      exclude: exclude,
      tick: 0,
      teamRefs: teams,
      prevAction: Object.create(null),
      lastTurnover: null,
      pendingCommit: new Set(),
      predator: { tick: -1, used: new Set(), map: Object.create(null) },
      pending: [],
      stats: Object.create(null)
    };
    for (var ti = 0; ti < teams.length; ti++) {
      var team = teams[ti];
      for (var i = 0; i < team.ps.length; i++) {
        var q = team.ps[i];
        var raw = byId[q.id] && byId[q.id].traits;
        if (!raw) { q.tr = null; continue; }
        assertPair(raw, q.id);
        q.tr = Object.freeze({ p: raw.primary, s: raw.secondary });
        state.stats[q.id] = {
          p: { eligible: 0, active: 0, flips: 0, posOverrides: 0, engageDelta: { count: 0, sum: 0 } },
          s: { eligible: 0, active: 0, flips: 0, posOverrides: 0, engageDelta: { count: 0, sum: 0 } }
        };
      }
    }
    return state;
  }

  function strength(q, name, state) {
    if (!q || !q.tr || !name) return 0;
    if (state && state.exclude.has(name)) return 0;
    if (q.tr.p === name) return 1;
    if (q.tr.s === name) return 0.5;
    return 0;
  }

  function syncTick(state, ctx) {
    if (state && ctx && Number.isInteger(ctx.tick)) state.tick = ctx.tick;
  }

  function slotIndex(q, state) {
    var team = state.teamRefs && state.teamRefs[q.ti];
    return team ? team.ps.indexOf(q) : 0;
  }

  function secondaryDuty(q, state) {
    return ((state.tick + slotIndex(q, state)) % 2) === 0;
  }

  // Both traits, for continuous weight hooks (H4, H5, H6a).
  function traitList(q, state) {
    var out = [];
    if (!q || !q.tr) return out;
    var p = strength(q, q.tr.p, state);
    if (p > 0) out.push({ name: q.tr.p, s: p, slot: 'p' });
    var s = strength(q, q.tr.s, state);
    if (s > 0) out.push({ name: q.tr.s, s: s, slot: 's' });
    return out;
  }

  // Discrete hooks (H1, H2b, H6b): secondary acts on half the eligible ticks.
  function discreteList(q, state) {
    var out = [];
    if (!q || !q.tr) return out;
    var p = strength(q, q.tr.p, state);
    if (p > 0) out.push({ name: q.tr.p, s: p, slot: 'p' });
    var s = strength(q, q.tr.s, state);
    if (s > 0 && secondaryDuty(q, state)) out.push({ name: q.tr.s, s: s, slot: 's' });
    return out;
  }

  function availableDefenders(ctx) {
    return ctx.defend.ps.filter(function (q) { return q.oop === 0; });
  }

  function passPath(from, to) {
    var cells = [];
    var p = { x: from.x, y: from.y };
    cells.push({ x: p.x, y: p.y });
    while (p.x !== to.x || p.y !== to.y) {
      if (p.x !== to.x) p.x += Math.sign(to.x - p.x);
      else p.y += Math.sign(to.y - p.y);
      cells.push({ x: p.x, y: p.y });
    }
    return cells;
  }

  function pathDefenderCount(teams, poss, from, to) {
    var cells = passPath(from, to);
    return teams[1 - poss].ps.filter(function (q) { return q.oop === 0; }).filter(function (q) {
      var d = Infinity;
      for (var i = 0; i < cells.length; i++) d = Math.min(d, dist(cells[i], q.pos));
      return d <= 1;
    }).length;
  }

  function mark(state, q, slot, changed, kind, delta) {
    var s = state.stats[q.id] && state.stats[q.id][slot];
    if (!s) return;
    s.eligible++;
    if (!changed) return;
    s.active++;
    if (kind === 'pos') s.posOverrides++;
    if (kind === 'engage') { s.engageDelta.count++; s.engageDelta.sum += delta; }
  }

  function note(state, q, slot, hook, tag, before, after, extra) {
    var entry = {
      id: q.id, trait: q.tr ? (slot === 'p' ? q.tr.p : q.tr.s) : null,
      slot: slot, hook: hook, tag: tag, before: before, after: after, flip: false
    };
    if (extra) for (var k in extra) entry[k] = extra[k];
    state.pending.push(entry);
  }

  // H1: attacker off-ball target.
  function attackTarget(q, target, ctx) {
    var state = ctx && ctx.state;
    if (!state) return target;
    syncTick(state, ctx);
    var list = discreteList(q, state);
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (t.name === 'Predator' && q.committed && ctx.x >= 1 && q !== ctx.carrier) {
        var lane = predatorLane(q, ctx, state);
        var pred = world(ctx.poss, 3, lane);
        if (pred.x !== target.x || pred.y !== target.y) {
          mark(state, q, t.slot, true, 'pos');
          note(state, q, t.slot, 'H1', 'predator_box', target, pred, { lane: lane });
        } else mark(state, q, t.slot, false);
        return pred;
      }
      if (t.name === 'Phantom' && q.committed && ctx.x >= 1 && q !== ctx.carrier) {
        var gapX = Math.min(3, ctx.zone.x + 1);
        var gapLane = phantomLane(ctx, gapX);
        var gap = world(ctx.poss, gapX, gapLane);
        if (gap.x !== target.x || gap.y !== target.y) {
          mark(state, q, t.slot, true, 'pos');
          note(state, q, t.slot, 'H1', 'phantom_gap', target, gap, { lane: gapLane });
        } else mark(state, q, t.slot, false);
        return gap;
      }
      if (t.name === 'Juggernaut' && q.committed && ctx.x >= 1 && q !== ctx.carrier) {
        var jug = world(ctx.poss, 3, 1);
        if (jug.x !== target.x || jug.y !== target.y) {
          mark(state, q, t.slot, true, 'pos');
          note(state, q, t.slot, 'H1', 'juggernaut_hold', target, jug);
        } else mark(state, q, t.slot, false);
        return jug;
      }
      if (t.name === 'Engine' && !q.committed && ctx.x >= 1 && covered(q, ctx)) {
        var y = ctx.ball.y === 2 ? 1 : ctx.ball.y + 1;
        var support = world(ctx.poss, ctx.zone.x, y);
        state.pendingCommit.add(q.id);
        if (support.x !== target.x || support.y !== target.y) {
          mark(state, q, t.slot, true, 'pos');
          note(state, q, t.slot, 'H1', 'engine_forward', target, support);
        } else mark(state, q, t.slot, false);
        return support;
      }
    }
    return target;
  }

  function covered(q, ctx) {
    var qx = oriented(q.pos, ctx.poss);
    var restX = Math.min(1, Math.max(0, ctx.zone.x - 1));
    return ctx.attack.ps.some(function (o) {
      return o !== q && o.oop === 0 &&
        (oriented(o.pos, ctx.poss) < qx || oriented(o.pos, ctx.poss) <= restX);
    });
  }

  function predatorLane(q, ctx, state) {
    if (state.predator.tick !== ctx.tick) {
      state.predator = { tick: ctx.tick, used: new Set(), map: Object.create(null) };
    }
    if (state.predator.map[q.id] !== undefined) return state.predator.map[q.id];
    var defs = availableDefenders(ctx);
    var cells = [0, 1, 2].map(function (lane) {
      var cell = world(ctx.poss, 3, lane);
      var count = defs.filter(function (d) { return dist(d.pos, cell) <= 1; }).length;
      return { lane: lane, count: count };
    });
    cells.sort(function (a, b) {
      if (a.count !== b.count) return a.count - b.count;
      if (a.lane === 1 && b.lane !== 1) return -1;
      if (b.lane === 1 && a.lane !== 1) return 1;
      if (a.lane === ctx.ball.y && b.lane !== ctx.ball.y) return -1;
      if (b.lane === ctx.ball.y && a.lane !== ctx.ball.y) return 1;
      return a.lane - b.lane;
    });
    for (var i = 0; i < cells.length; i++) {
      if (!state.predator.used.has(cells[i].lane)) {
        state.predator.used.add(cells[i].lane);
        state.predator.map[q.id] = cells[i].lane;
        return cells[i].lane;
      }
    }
    return ctx.ball.y;
  }

  function phantomLane(ctx, gapX) {
    var defs = availableDefenders(ctx);
    var best = null;
    for (var lane = 0; lane < 3; lane++) {
      var cell = world(ctx.poss, gapX, lane);
      var min = defs.length ? Infinity : 99;
      for (var i = 0; i < defs.length; i++) min = Math.min(min, dist(defs[i].pos, cell));
      var cand = { lane: lane, min: min, different: lane !== ctx.ball.y ? 1 : 0, centre: lane === 1 ? 1 : 0 };
      if (!best || cand.min > best.min ||
        (cand.min === best.min && cand.different > best.different) ||
        (cand.min === best.min && cand.different === best.different && cand.centre > best.centre) ||
        (cand.min === best.min && cand.different === best.different && cand.centre === best.centre && cand.lane < best.lane)) best = cand;
    }
    return best.lane;
  }

  // H3: only Engine's forward run changes commitment, and only with a cover man left back.
  function commitAdjust(attack, ctx) {
    var state = ctx && ctx.state;
    if (!state) return;
    state.pendingCommit.forEach(function (id) {
      var q = attack.ps.find(function (p) { return p.id === id; });
      if (!q || q.committed) return;
      var coveredBy = attack.ps.some(function (o) { return o !== q && !o.committed; });
      if (coveredBy) {
        q.committed = true;
        note(state, q, 'p', 'H3', 'engine_commit', false, true);
      }
    });
    state.pendingCommit.clear();
  }

  // H2a: only Destroyer swaps slots; one per team per tick.
  function defSlots(available, ctx) {
    var state = ctx && ctx.state;
    if (!state) return available;
    syncTick(state, ctx);
    var dx = 3 - ctx.x;
    if (dx !== 1 && dx !== 2) return available;
    var candidates = available.filter(function (q) {
      return q.oop === 0 && strength(q, 'Destroyer', state) > 0 && dist(q.pos, ctx.ball) <= 2;
    });
    if (!candidates.length) return available;
    var team = state.teamRefs[candidates[0].ti];
    candidates.sort(function (a, b) { return team.ps.indexOf(a) - team.ps.indexOf(b); });
    var chosen = candidates[0];
    var idx = available.indexOf(chosen);
    if (idx <= 0) return available;
    var out = available.slice();
    out[0] = chosen;
    out[idx] = available[0];
    var slot = strength(chosen, chosen.tr.p, state) > 0 ? 'p' : 's';
    mark(state, chosen, slot, true, 'pos');
    note(state, chosen, slot, 'H2a', 'destroyer_step', available[0].id, chosen.id);
    return out;
  }

  // H2b: defender target for the slot T3 assigned.
  function defendTarget(q, slot, target, ctx) {
    var state = ctx && ctx.state;
    if (!state) return target;
    syncTick(state, ctx);
    var list = discreteList(q, state);
    var defX = ctx.defX !== undefined ? ctx.defX : oriented(ctx.ball, q.ti);
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (t.name === 'Wall') {
        if (slot === 1) {
          var laneTarget = world(q.ti, Math.max(0, defX - 1), ctx.ball.y);
          if (laneTarget.x !== target.x || laneTarget.y !== target.y) {
            mark(state, q, t.slot, true, 'pos');
            note(state, q, t.slot, 'H2b', 'wall_lane', target, laneTarget);
          } else mark(state, q, t.slot, false);
          return laneTarget;
        }
        if (slot === 2) {
          var runner = ctx.runners && ctx.runners[0];
          if (runner && oriented(runner.pos, q.ti) <= 1) { mark(state, q, t.slot, false); return target; }
          var zoneTarget = world(q.ti, Math.max(0, defX - 1), 1);
          if (zoneTarget.x !== target.x || zoneTarget.y !== target.y) {
            mark(state, q, t.slot, true, 'pos');
            note(state, q, t.slot, 'H2b', 'wall_zone', target, zoneTarget);
          } else mark(state, q, t.slot, false);
          return zoneTarget;
        }
      }
      if (t.name === 'Enforcer' && slot === 2) {
        var opp = ctx.attack.ps.filter(function (p) { return p !== ctx.carrier; }).sort(function (a, b) {
          return b.c.ATT - a.c.ATT || b.c.shot - a.c.shot || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
        })[0];
        if (opp) {
          var markCell = { x: opp.pos.x, y: opp.pos.y };
          if (markCell.x !== target.x || markCell.y !== target.y) {
            mark(state, q, t.slot, true, 'pos');
            note(state, q, t.slot, 'H2b', 'enforcer_mark', target, markCell, { markId: opp.id });
          } else mark(state, q, t.slot, false);
          return markCell;
        }
      }
      if (t.name === 'Anticipator' && slot === 2) {
        var run = ctx.runners && ctx.runners[0];
        if (run) {
          var cells = passPath(ctx.ball, run.pos).slice(1);
          if (cells.length) {
            var best = null;
            for (var c = 0; c < cells.length; c++) {
              var d = dist(cells[c], q.pos);
              var dr = dist(cells[c], run.pos);
              if (!best || d < best.d || (d === best.d && dr < best.dr)) best = { cell: cells[c], d: d, dr: dr };
            }
            var intercept = { x: best.cell.x, y: best.cell.y };
            if (intercept.x !== target.x || intercept.y !== target.y) {
              mark(state, q, t.slot, true, 'pos');
              note(state, q, t.slot, 'H2b', 'anticipator_lane', target, intercept);
            } else mark(state, q, t.slot, false);
            return intercept;
          }
        }
      }
      if (t.name === 'Tracker' && (slot === 2 || q.oop > 0)) {
        var quarry = q.oop > 0 ? ctx.carrier : (ctx.runners && ctx.runners[0]);
        if (quarry) {
          var pdx = Math.max(0, oriented(quarry.pos, q.ti) - 1);
          var pursuit = world(q.ti, pdx, quarry.pos.y);
          if (pursuit.x !== target.x || pursuit.y !== target.y) {
            mark(state, q, t.slot, true, 'pos');
            note(state, q, t.slot, 'H2b', 'hunter_pursuit', target, pursuit, { quarry: quarry.id });
          } else mark(state, q, t.slot, false);
          return pursuit;
        }
      }
      if (t.name === 'Libero' && slot !== 0) {
        var others = ctx.defend.ps.filter(function (o) { return o !== q; });
        if (others.length) {
          var minDx = Infinity;
          for (var oi = 0; oi < others.length; oi++) minDx = Math.min(minDx, oriented(others[oi].pos, q.ti));
          var sweep = world(q.ti, Math.max(0, minDx - 1), 1);
          if (sweep.x !== target.x || sweep.y !== target.y) {
            mark(state, q, t.slot, true, 'pos');
            note(state, q, t.slot, 'H2b', 'libero_sweep', target, sweep);
          } else mark(state, q, t.slot, false);
          return sweep;
        }
      }
      if (t.name === 'Engine' && state.lastTurnover &&
        state.lastTurnover.committed.has(q.id) && q.oop === 0 &&
        ctx.tick - state.lastTurnover.tick <= 2) {
        var recoverCell = world(q.ti, Math.max(0, defX - 1), ctx.ball.y);
        var targetDx = oriented(target, q.ti);
        if (oriented(recoverCell, q.ti) < targetDx) {
          mark(state, q, t.slot, true, 'pos');
          note(state, q, t.slot, 'H2b', 'engine_recover', target, recoverCell);
          return recoverCell;
        }
      }
    }
    return target;
  }

  // H4: engagement threshold, same single draw.
  function engage(d, base, ctx) {
    var state = ctx && ctx.state;
    if (!state || !d || !d.tr) return base;
    syncTick(state, ctx);
    if (ctx.x === 3) return base;
    var delta = 0;
    var list = traitList(d, state);
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (t.name === 'Wall') delta -= 0.20 * t.s;
      else if (t.name === 'Enforcer') delta += 0.15 * t.s;
      else if (t.name === 'Tracker' && isChase(ctx.carrier, state)) delta += 0.15 * t.s;
      else if (t.name === 'Destroyer') {
        var dx = 3 - ctx.x;
        if (dx === 1 || dx === 2) delta += 0.15 * t.s;
        if (ctx.recentRegain) delta += 0.10 * t.s;
      }
    }
    var out = clamp(base + delta, 0, 0.95);
    var slot = strength(d, d.tr.p, state) > 0 ? 'p' : 's';
    if (out !== base) {
      mark(state, d, slot, true, 'engage', out - base);
      note(state, d, slot, 'H4', 'engage', base, out);
    } else mark(state, d, slot, false);
    return out;
  }

  function isChase(carrier, state) {
    if (!carrier) return false;
    var prev = state.prevAction[carrier.id];
    return prev === 'carry' || prev === 'through_ball' || prev === 'outlet';
  }

  // H5: utility multipliers after discipline, before the floor and roulette.
  function utilities(c, U, ctx) {
    var state = ctx && ctx.state;
    if (!state) return { weights: U, active: [] };
    syncTick(state, ctx);
    var out = {};
    for (var k in U) out[k] = U[k];
    var active = [];
    var list = traitList(c, state);
    for (var action in U) {
      var product = 1;
      var hits = [];
      for (var i = 0; i < list.length; i++) {
        var b = beta(list[i].name, action, ctx);
        if (b !== null) { product *= 1 + list[i].s * b; hits.push({ t: list[i], beta: b }); }
      }
      if (hits.length) {
        var m = clamp(product, 0.6, 1.6);
        out[action] = U[action] * m;
        for (var h = 0; h < hits.length; h++) {
          active.push(hits[h].t.name);
          mark(state, c, hits[h].t.slot, true);
          note(state, c, hits[h].t.slot, 'H5', hits[h].t.name + '_' + action,
            U[action], out[action], { beta: hits[h].beta, multiplier: m });
        }
      }
    }
    return { weights: out, active: active.filter(function (v, i, a) { return a.indexOf(v) === i; }) };
  }

  function beta(name, action, ctx) {
    var x = ctx.x, engaged = ctx.engaged, transition = ctx.transition;
    if (name === 'Libero') {
      if (x <= 1) {
        if (action === 'carry') return 0.6;
        if (action === 'through') return 0.4;
        if (action === 'shield') return -0.3;
      }
    } else if (name === 'Maestro') {
      if (!engaged && !transition) {
        if (action === 'pass') return 0.4;
        if (action === 'through') return -0.25;
        if (action === 'carry') return -0.2;
      } else if (engaged) {
        if (action === 'pass') return 0.3;
        if (action === 'wall') return 0.2;
        if (action === 'dribble') return -0.3;
      }
    } else if (name === 'Architect') {
      if (x <= 1) {
        var f = engaged ? 0.5 : 1;
        if (action === 'through') return 0.5 * f;
        if (action === 'carry') return -0.15 * f;
      }
    } else if (name === 'Destroyer') {
      if (action === 'pass') return 0.3;
      if (action === 'dribble') return -0.3;
      if (action === 'carry') return -0.2;
    } else if (name === 'Engine') {
      if (!engaged && action === 'carry') return 0.3;
    } else if (name === 'Surgeon') {
      if (x === 2 && action === 'through') return engaged ? 0.25 : 0.5;
    } else if (name === 'Predator') {
      if (x === 3) {
        if (action === 'shoot') return 0.4;
        if (action === 'pass') return -0.2;
        if (action === 'dribble') return -0.2;
      } else if (x <= 1 && action === 'pass') return 0.2;
    } else if (name === 'Magician') {
      if (engaged) {
        if (action === 'dribble') return 0.5 + (ctx.defenders >= 2 ? 0.2 : 0);
        if (action === 'wall') return 0.3;
        if (action === 'pass') return -0.2;
      }
    } else if (name === 'Executioner') {
      if (x === 2 && action === 'shoot') return 0.6;
    } else if (name === 'Phantom') {
      if (engaged) {
        if (action === 'pass') return 0.3;
        if (action === 'wall') return 0.3;
        if (action === 'dribble') return -0.3;
      } else if (x <= 2 && action === 'carry') return -0.2;
    } else if (name === 'Juggernaut') {
      if (engaged && x <= 1 && action === 'shield') return 0.5;
      if (engaged && x >= 2) {
        if (action === 'dribble') return 0.3;
        if (action === 'pass') return -0.2;
      }
    }
    return null;
  }

  // H6a: normal-pass receiver weights. Same draw is remapped by receiver().
  function receiverWeights(c, mates, ctx) {
    var state = ctx && ctx.state;
    if (!state) return null;
    syncTick(state, ctx);
    var list = traitList(c, state).filter(function (t) {
      return t.name === 'Maestro' || t.name === 'Architect';
    });
    if (!list.length) return null;
    var defs = availableDefenders(ctx);
    return mates.map(function (q) {
      var w = 1;
      for (var i = 0; i < list.length; i++) {
        var t = list[i];
        if (t.name === 'Maestro') {
          var openness = 2;
          if (defs.length) {
            openness = Infinity;
            for (var d = 0; d < defs.length; d++) openness = Math.min(openness, dist(defs[d].pos, q.pos));
            openness = Math.min(2, openness);
          }
          w *= 1 + t.s * openness;
        } else if (t.name === 'Architect') {
          w *= 1 + t.s * Math.max(0, oriented(q.pos, ctx.poss) - ctx.x);
        }
      }
      return w;
    });
  }

  function receiver(c, mates, actor, side, S, T, u, ctx) {
    var w = receiverWeights(c, mates, ctx);
    if (!w) return mates[Math.floor(u * mates.length)];
    var total = 0;
    for (var i = 0; i < w.length; i++) total += w[i];
    var roll = u * total;
    for (var j = 0; j < mates.length; j++) {
      roll -= w[j];
      if (roll < 0) return mates[j];
    }
    return mates[mates.length - 1];
  }

  // H6b: through/outlet pass target only. U.through/U.outlet existence is untouched.
  function runner(c, forward, action, ctx) {
    var state = ctx && ctx.state;
    if (!state || !forward.length) return null;
    syncTick(state, ctx);
    var list = discreteList(c, state);
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (t.name === 'Surgeon' && action === 'through' && ctx.x === 2 && forward.length >= 2) {
        var chosen = forward.slice().sort(function (a, b) {
          var da = pathDefenderCount(ctx.teams, ctx.poss, c.pos, a.pos);
          var db = pathDefenderCount(ctx.teams, ctx.poss, c.pos, b.pos);
          return da - db ||
            oriented(b.pos, ctx.poss) - oriented(a.pos, ctx.poss) ||
            forward.indexOf(a) - forward.indexOf(b);
        })[0];
        var slot = t.slot;
        mark(state, c, slot, true);
        note(state, c, slot, 'H6b', 'surgeon_select', forward[0].id, chosen.id, { chosen: chosen.id, t3Runner: forward[0].id });
        return chosen;
      }
    }
    if (action === 'outlet' && ctx.transition) {
      for (var j = 0; j < forward.length; j++) {
        var jl = discreteList(forward[j], state);
        for (var k = 0; k < jl.length; k++) {
          if (jl[k].name === 'Juggernaut') {
            mark(state, forward[j], jl[k].slot, true);
            note(state, forward[j], jl[k].slot, 'H6b', 'juggernaut_outlet', forward[0].id, forward[j].id);
            return forward[j];
          }
        }
      }
    }
    return null;
  }

  function onTurnover(state, info) {
    if (!state) return;
    state.lastTurnover = {
      tick: info.tick,
      committed: new Set(info.committed || [])
    };
  }

  function attachEvent(out, state) {
    if (!state) return out;
    observeEvent(out, state);
    if (state.pending.length) {
      out.calc = out.calc || {};
      out.calc.traits = state.pending.slice();
    }
    state.pending.length = 0;
    return out;
  }

  function observeEvent(out, state) {
    if (!state || !out) return;
    if (out.type === 'carry') state.prevAction[out.actor] = 'carry';
    else if (out.type === 'through_ball' && out.outcome === 'complete') {
      state.prevAction[out.target] = (out.tags && out.tags.indexOf('direct_outlet') !== -1) ? 'outlet' : 'through_ball';
    } else if (out.type === 'pass' && out.outcome === 'complete') state.prevAction[out.target] = 'pass';
    else if (out.type === 'dribble_duel' && out.outcome === 'attacker_wins') state.prevAction[out.actor] = 'dribble';
  }

  function summary(state) {
    if (!state) return null;
    var players = Object.create(null);
    var totals = { eligible: 0, active: 0, flips: 0, posOverrides: 0, engageDelta: { count: 0, sum: 0 } };
    for (var id in state.stats) {
      var p = state.stats[id];
      players[id] = { p: p.p, s: p.s };
      for (var slot in p) {
        totals.eligible += p[slot].eligible;
        totals.active += p[slot].active;
        totals.flips += p[slot].flips;
        totals.posOverrides += p[slot].posOverrides;
        totals.engageDelta.count += p[slot].engageDelta.count;
        totals.engageDelta.sum += p[slot].engageDelta.sum;
      }
    }
    return { version: state.version, players: players, totals: totals };
  }

  function distribution(players) {
    var primary = Object.create(null), secondary = Object.create(null);
    for (var i = 0; i < CATALOG.length; i++) { primary[CATALOG[i]] = 0; secondary[CATALOG[i]] = 0; }
    var traited = 0;
    for (var j = 0; j < players.length; j++) {
      var t = players[j].traits;
      if (!t) continue;
      traited++;
      if (primary[t.primary] !== undefined) primary[t.primary]++;
      if (secondary[t.secondary] !== undefined) secondary[t.secondary]++;
    }
    return { roster: players.length, traited: traited, untraited: players.length - traited, primary: primary, secondary: secondary };
  }

  return Object.freeze({
    VERSION: VERSION,
    CATALOG: CATALOG,
    TRAIT_PARAMS: TRAIT_PARAMS,
    init: init,
    strength: strength,
    traitList: traitList,
    discreteList: discreteList,
    attackTarget: attackTarget,
    commitAdjust: commitAdjust,
    defSlots: defSlots,
    defendTarget: defendTarget,
    engage: engage,
    utilities: utilities,
    receiverWeights: receiverWeights,
    receiver: receiver,
    runner: runner,
    onTurnover: onTurnover,
    attachEvent: attachEvent,
    observeEvent: observeEvent,
    summary: summary,
    distribution: distribution,
    validPair: validPair,
    _internals: Object.freeze({ passPath: passPath, pathDefenderCount: pathDefenderCount, world: world, oriented: oriented, dist: dist, beta: beta })
  });
});
