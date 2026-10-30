// Commentary spike: reads ONLY the event log + roster identity. Never touches engine state or RNG.
(()=>{'use strict';
const { BY_ID } = window.CageEngine;
const SHORT = { 'ronaldo-nazario': 'Ronaldo', 'jay-jay-okocha': 'Okocha', 'juan-roman-riquelme': 'Riquelme', 'paolo-maldini': 'Maldini', 'zinedine-zidane': 'Zidane' };
const DEMONYM = { Brazil: 'Brazilian', Germany: 'German', Italy: 'Italian', Nigeria: 'Nigerian', Serbia: 'Serb', France: 'Frenchman', Argentina: 'Argentine', England: 'Englishman', Netherlands: 'Dutchman', Portugal: 'Portuguese' };
const nm = id => !id ? 'a player' : (SHORT[id] || BY_ID[id]?.name?.split(' ').slice(-1)[0] || 'a player');
const mmss = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
// deterministic variant choice: hash(seed, event index, bank) and avoid the last 2 used in that bank
function h(a, b, c) { let x = (a ^ Math.imul(b + 1, 0x9e3779b1) ^ Math.imul(c + 7, 0x85ebca6b)) >>> 0; x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d) >>> 0; return (x ^ (x >>> 12)) >>> 0; }
const strHash = s => [...s].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 7);

const BANK = {
  kickoff: ['{A} gets us under way, rolling it short.', 'And we are live in the cage. {A} on the ball.', 'The floodlights hum, the door is bolted. {A} starts it.'],
  carry: ['{A} drives into the space.', '{A} carries it forward, nobody stepping out.', '{A} strides on. Room to run.'],
  pass_ok_fwd: ['{A} slides it into {T}.', '{A} finds {T} between the lines.', 'Neat from {A}, threaded to {T}.'],
  pass_int: ['{A} looks for {T}, but {D} reads it and steps in.', 'Cut out! {D} was waiting for that pass from {A}.', '{D} anticipates, intercepts, and {A} is left staring.'],
  through_ok: ['{A} sees the run! {T} is in behind!', 'Oh, the vision of {A}! {T} is through!', '{A} splits them open, {T} away!'],
  through_int: ['{A} tries to thread {T} in, {D} gets a toe to it.', 'Too ambitious from {A}. {D} mops up.'],
  race_att: ['{A} has the legs on {D}!', '{D} can\'t live with that acceleration from {A}!'],
  race_def: ['{D} recovers brilliantly, shoulder to shoulder with {A}, and shepherds him toward the wall.', 'What a recovery run from {D}! {A} is forced wide.'],
  dribble_win: ['{A} goes past {D} as if he isn\'t there!', '{A} drops the shoulder and {D} buys it.', 'A feint, a touch, and {A} is beyond {D}.'],
  dribble_lose: ['{A} takes on {D}, and {D} stands up and wins it cleanly.', '{D} times the tackle perfectly. {A} goes nowhere.', 'Strong from {D}: {A} is crowded out against the mesh.'],
  wall_win: ['{A} plays it off the wall and collects it past {D}. Pure cage football!', 'The one-two with the boards! {A} leaves {D} behind.'],
  wall_lose: ['{A} tries the wall-pass, but {D} has read the angle.'],
  press_beaten: ['{D} closes {A} down, but {A} shields it superbly.', '{A} rolls away from the pressure of {D}.'],
  press_won: ['{D} hunts {A} down and pinches it!', 'Ferocious pressing from {D}. {A} is robbed.'],
  foul: ['{D} clatters into {A}. Free kick.', 'Late from {D}, and {A} goes down. The whistle goes.'],
  free_kick: ['Free kick in a dangerous spot. {A} stands over it.', '{A} eyes up the tiny goal from the dead ball.'],
  shot_build: ['{A} sets himself...', '{A} has a sight of goal...', 'Space for {A}...'],
  shot_build_ovo: ['{A} is clean through! Nobody left!', 'It\'s {A} one-on-one with an empty cage!'],
  block: ['HE SHOOTS! Blocked by {D}!', 'The strike comes in, and {D} throws himself in the way!', '{D} gets a body on it! Superb defending!'],
  miss_near: ['HE SHOOTS! Inches wide!', 'Off the frame! So close!', 'Fizzing past the post! The cage groans!'],
  miss: ['HE SHOOTS... wide, and it cannons back off the wall.', 'Snatched at. Well wide.', 'Pulled across the face of the little goal and away.'],
  goal: ['GOAL! {A}! THE CAGE ERUPTS!', '{A}! IT\'S IN! First goal, and it wins it!', 'IT\'S THERE! {A} FINDS THE NET!'],
  rebound_att: ['Off the boards, and {A} is first to it!', 'The wall gives it back and {A} pounces!'],
  rebound_def: ['Loose off the wall, {A} gets there first and clears the danger.', '{A} reacts quickest to the rebound and calms everything down.'],
  quiet: ['Patient stuff from {TEAM}, moving it around without forcing anything.', 'A lull. {TEAM} keep it, probing.', 'Composed spell of possession for {TEAM}.'],
  withdrawal: ['{A} is out on his feet and steps out of the cage.', 'Exhaustion takes {A}. He withdraws.'],
  escalation: ['Into {X} now. The cage suddenly looks enormous.', 'It\'s {X}. Every mistake will be fatal now.'],
};

function commentate(res, seed, teamNames = ['Home', 'Away']) {
  const used = {}, lines = [], ledger = {}, mentioned = new Set();
  const pick = (bank, i) => { const v = BANK[bank]; const last = used[bank] || []; let k = h(seed, i, strHash(bank)) % v.length; for (let tries = 0; tries < v.length && last.includes(k); tries++) k = (k + 1) % v.length; used[bank] = [k, ...last].slice(0, Math.min(2, v.length - 1)); return v[k]; };
  const ref = id => { if (!mentioned.has(id)) { mentioned.add(id); return nm(id); } return nm(id); };
  const ROLE_SWAP = { press: 1, foul: 1, block: 1 };
  const fill = (s, e, extra = {}) => { const a = ROLE_SWAP[e.type] ? e.opp : e.actor, d = ROLE_SWAP[e.type] ? e.actor : e.opp; return s.replace(/{A}/g, ref(a)).replace(/{D}/g, d ? nm(d) : '').replace('{T}', e.target ? nm(e.target) : '').replace('{TEAM}', teamNames[e.team]).replace('{X}', extra.X || ''); };
  const say = (e, text, imp) => lines.push({ t: e.t, i: e.i, imp, text });
  let quiet = [];
  const flushQuiet = () => { if (quiet.length >= 3) say(quiet[0], fill(pick('quiet', quiet[0].i), quiet[0]), 0); else for (const q of quiet) render(q, true); quiet = []; };
  function render(e, forced) {
    const ev = res.events;
    switch (e.type) {
      case 'restart': if (e.reason === 'kickoff' || e.reason === 'escalation') say(e, fill(pick('kickoff', e.i), e), 1); break;
      case 'carry': say(e, fill(pick('carry', e.i), e), 0); break;
      case 'pass': say(e, fill(pick(e.outcome === 'complete' ? 'pass_ok_fwd' : 'pass_int', e.i), e), e.outcome === 'complete' ? 0 : 1); break;
      case 'through_ball': say(e, fill(pick(e.outcome === 'complete' ? 'through_ok' : 'through_int', e.i), e), 2); break;
      case 'race': say(e, fill(pick(e.outcome === 'attacker_clear' ? 'race_att' : 'race_def', e.i), e), 2); break;
      case 'dribble_duel': case 'wall_pass': {
        if (e.outcome === 'fouled') break;
        const key = e.actor + '|' + e.opp, L = ledger[key] = ledger[key] || { def: 0, att: 0 };
        const won = e.outcome === 'attacker_wins'; won ? L.att++ : L.def++;
        let s = fill(pick(e.type === 'wall_pass' ? (won ? 'wall_win' : 'wall_lose') : (won ? 'dribble_win' : 'dribble_lose'), e.i), e);
        if (!won && L.def === 2) s += ` That's twice now ${nm(e.opp)} has had the better of ${nm(e.actor)}.`;
        if (!won && L.def >= 3) s += ` ${nm(e.opp)} has ${nm(e.actor)} in his pocket tonight.`;
        if (won && L.att === 2 && L.def === 0) s += ` ${nm(e.opp)} is having a torrid time.`;
        say(e, s, won ? 2 : 1); break; }
      case 'press': say(e, fill(pick(e.outcome === 'ball_won' ? 'press_won' : 'press_beaten', e.i), e), 1); break;
      case 'foul': say(e, fill(pick('foul', e.i), { ...e }), 1); break;
      case 'free_kick': say(e, fill(pick('free_kick', e.i), e), 2); break;
      case 'shot_attempt': say(e, fill(pick(e.kind === 'one_v_one' ? 'shot_build_ovo' : 'shot_build', e.i), e), 2); break;
      case 'block': say(e, fill(pick('block', e.i), e), 3); break;
      case 'shot_miss': say(e, fill(pick(e.outcome === 'off_post_or_wide' ? 'miss_near' : 'miss', e.i), e), 3); break;
      case 'goal': { let s = fill(pick('goal', e.i), e); if (e.assist && e.assist !== e.actor) s += ` Made by ${nm(e.assist)}.`; say(e, s, 3); break; }
      case 'rebound': say(e, fill(pick(e.outcome === 'attack_keeps' ? 'rebound_att' : 'rebound_def', e.i), e), e.outcome === 'attack_keeps' ? 2 : 1); break;
      case 'withdrawal': say(e, fill(pick('withdrawal', e.i), e), 1); break;
      case 'escalation': say(e, fill(pick('escalation', e.i), e, { X: e.to }), 2); break;
      case 'decider_xg': say(e, `Still level. It goes to the chances ledger: ${teamNames[e.team]} created more (${e.xg.join(' to ')}).`, 3); break;
    }
  }
  for (const e of res.events) {
    const routine = (e.type === 'pass' && e.outcome === 'complete' && (e.zone?.x ?? 0) <= 1) || e.type === 'recovery_run' || e.type === 'turnover';
    if (e.type === 'turnover' || e.type === 'recovery_run') continue; // folded into the duel/interception line
    if (routine) { quiet.push(e); continue; }
    flushQuiet(); render(e);
  }
  flushQuiet();
  return lines;
}
window.CageCommentary = { commentate, mmss };
})();
