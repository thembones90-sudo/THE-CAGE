// Timeline invariants checked against any record (fixture or freshly simulated by a test).
'use strict';
const assert = require('node:assert/strict');
const STEP = 1 / 60;

function cellDist(a, b) { return Math.hypot((a.u - b.u) * 4, (a.v - b.v) * 3); }

// Returns counters so callers can report coverage.
function check(V, record, label = 'record') {
  const T = V.CageViewerTimeline;
  const events = record.result.events;
  const tl = T.buildTimeline(record);
  const stats = { samples: 0, passesChecked: 0, contactsChecked: 0 };

  // Structure
  assert.equal(tl.segments.length, events.length, label + ': one segment per recorded event');
  assert.equal(tl.ids.length, 6, label + ': six players');
  tl.segments.forEach((s, i) => { assert.equal(s.i, i); assert(s.tau1 > s.tau0, label + ': segment ' + i + ' has positive length'); if (i) assert.equal(s.tau0, tl.segments[i - 1].tau1, label + ': contiguous'); });

  // Score comes only from goal events.
  const fromEvents = [0, 0]; events.filter(e => e.type === 'goal').forEach(e => fromEvents[e.team]++);
  assert.deepEqual(Array.from(tl.finalScore), fromEvents, label + ': final score equals goal events');
  if (Array.isArray(record.result.score)) assert.deepEqual(Array.from(tl.finalScore), Array.from(record.result.score), label + ': final score equals recorded score');
  assert.deepEqual(Array.from(T.scoreAt(tl, tl.total)), fromEvents);
  for (const g of tl.goals) { const before = T.scoreAt(tl, g.tau - 1e-6), after = T.scoreAt(tl, g.tau); assert.equal(after[g.team], before[g.team] + 1, label + ': score ticks exactly at the goal'); }

  // Sample every 1/60 s of timeline: six finite positions, ball finite, clock monotonic and never ahead of the event.
  let prevClock = -1;
  for (let tau = 0; tau <= tl.total + 1e-9; tau += STEP) {
    stats.samples++;
    const ps = T.playersAt(tl, tau), b = T.ballAt(tl, tau), si = T.segmentIndex(tl, tau), clock = T.clockAt(tl, tau);
    const keys = Object.keys(ps); assert.equal(keys.length, 6, label + ': six players at ' + tau);
    for (const id of keys) { const p = ps[id]; assert(Number.isFinite(p.u) && Number.isFinite(p.v) && p.u >= -0.01 && p.u <= 1.01 && p.v >= -0.01 && p.v <= 1.01, label + ': player ' + id + ' on pitch at ' + tau); }
    assert(Number.isFinite(b.u) && Number.isFinite(b.v), label + ': ball finite at ' + tau);
    assert(clock >= prevClock - 1e-9, label + ': clock monotonic at ' + tau + ' (' + prevClock + ' -> ' + clock + ')');
    assert(clock <= events[si].t + 1e-9, label + ': clock ' + clock + ' ahead of event ' + si + ' t=' + events[si].t);
    prevClock = clock;
  }

  // T-V4: on a completed pass the ball reaches the destination only once the receiver is there.
  for (const s of tl.segments) {
    const e = events[s.i];
    if ((e.type === 'pass' || e.type === 'through_ball') && e.outcome === 'complete' && e.target) {
      stats.passesChecked++;
      const final = s.end[e.target], dur = s.tau1 - s.tau0;
      for (let k = 0; k <= 1; k += 1 / 120) {
        const tau = s.tau0 + k * dur * 0.999999, b = T.ballAt(tl, tau);
        if (b.flight && cellDist(b, final) < 0.02) { const r = T.playersAt(tl, tau)[e.target]; assert(cellDist(r, final) < 1e-6, label + ': ball at receiver point before receiver arrived (event ' + e.i + ', k=' + k.toFixed(3) + ')'); }
      }
    }
    // T-V5: challenger within 0.6 cell of the carrier at the contact frame.
    if (s.contact && ['dribble_duel', 'wall_pass', 'press'].includes(e.type)) {
      stats.contactsChecked++;
      const tau = s.tau0 + s.contact.at * (s.tau1 - s.tau0), ps = T.playersAt(tl, tau);
      const d = cellDist(ps[s.contact.id], ps[s.contact.carrier]);
      assert(d <= 0.6 + 1e-9, label + ': challenger ' + d.toFixed(3) + ' cells from carrier at contact (event ' + e.i + ')');
    }
  }
  // Exactly one golden goal in KO records, at the last event.
  if (record.config && record.config.mode === 'ko') { assert.equal(tl.goals.length, 1, label + ': one golden goal'); assert.equal(tl.goals[0].i, events.length - 1); assert(tl.golden); assert(tl.goals[0].replayFrom <= tl.goals[0].tau); }
  return { tl, stats };
}
module.exports = { check, cellDist };
