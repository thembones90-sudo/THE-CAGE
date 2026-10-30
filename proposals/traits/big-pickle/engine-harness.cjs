// In-memory engine harness for the isolated trait prototype.
// It reads production sources, patches copies in memory, and never writes src/ or tests/.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const ROSTER_FILES = [
  'src/players.js',
  'src/roster-expansion.js',
  'src/roster-100.js',
  'src/roster-101.js',
  'src/roster-103.js',
  'src/roster-pl-134.js',
  'src/roster-135.js',
  'src/roster-136.js',
  'src/roster-139.js'
];
const BUNDLE = 'src/cage-engine.js';
const SPATIAL = 'src/tactics/spatial.js';
const TACTICAL = 'src/engine/tactical-match.js';
const TRAITS = 'src/tactics/traits.js';

function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }

function replaceOnce(source, anchor, replacement, name) {
  const first = source.indexOf(anchor);
  if (first === -1) throw Error('Patch anchor missing: ' + name);
  if (source.indexOf(anchor, first + 1) !== -1) throw Error('Patch anchor not unique: ' + name);
  return source.slice(0, first) + replacement + source.slice(first + anchor.length);
}

function patchSpatial(source) {
  let out = source;
  out = replaceOnce(out,
    'function update(teams,poss,carrier,zone,tick){const ball=world(zone,poss),attack=teams[poss],defend=teams[1-poss],rotated=[];carrier.pos={...ball};',
    'function update(teams,poss,carrier,zone,tick,traitState){const ball=world(zone,poss),attack=teams[poss],defend=teams[1-poss],rotated=[],H=traitState?window.CageTraitHooks:null;carrier.pos={...ball};',
    'spatial.update signature');
  out = replaceOnce(out,
    'let supportIndex=0,restIndex=0;for(const q of attack.ps){if(q===carrier)continue;let x,y;if(q.committed){if(supportIndex++===0){x=Math.min(3,zone.x+window.CageTacticalParams.P.spatial.advance);y=ball.y;}else{x=zone.x;y=ball.y===2?1:ball.y+1;}}else{x=Math.min(1,Math.max(0,zone.x-1));y=restIndex++===0?1:ball.y===0?2:0;}move(q,{x:poss===0?x:3-x,y});}',
    'let supportIndex=0,restIndex=0;for(const q of attack.ps){if(q===carrier)continue;let x,y;if(q.committed){if(supportIndex++===0){x=Math.min(3,zone.x+window.CageTacticalParams.P.spatial.advance);y=ball.y;}else{x=zone.x;y=ball.y===2?1:ball.y+1;}}else{x=Math.min(1,Math.max(0,zone.x-1));y=restIndex++===0?1:ball.y===0?2:0;}let target={x:poss===0?x:3-x,y};if(traitState)target=H.attackTarget(q,target,{state:traitState,teams,poss,attack,defend,carrier,zone,ball,tick});move(q,target);}if(traitState)H.commitAdjust(attack,{state:traitState,teams,poss,attack,defend,carrier,zone,ball,tick});',
    'spatial attack target');
  out = replaceOnce(out,
    'const available=defend.ps.slice().sort((a,b)=>(a.oop>0)-(b.oop>0)||dist(a.pos,ball)-dist(b.pos,ball)),defX=oriented(ball,defend.ti),runners=attack.ps.filter(q=>q!==carrier).sort((a,b)=>oriented(b.pos,poss)-oriented(a.pos,poss));',
    'let available=defend.ps.slice().sort((a,b)=>(a.oop>0)-(b.oop>0)||dist(a.pos,ball)-dist(b.pos,ball));const defX=oriented(ball,defend.ti),runners=attack.ps.filter(q=>q!==carrier).sort((a,b)=>oriented(b.pos,poss)-oriented(a.pos,poss));if(traitState)available=H.defSlots(available,{state:traitState,teams,poss,attack,defend,carrier,zone,ball,tick,defX,runners});',
    'spatial slots');
  out = replaceOnce(out,
    'for(const [i,q] of available.entries()){let target;if(i===0)target=ball;else if(i===1){const x=Math.max(0,defX-(defend.policy.compactness>=m.compactHelp?0:1)),y=lim(ball.y+(ball.y===2?-1:1),0,2);target={x:defend.ti===0?x:3-x,y};}else{const runner=runners[0];target=runner?{x:runner.pos.x,y:runner.pos.y}:{...ball};}move(q,target);}',
    'for(const [i,q] of available.entries()){let target;if(i===0)target=ball;else if(i===1){const x=Math.max(0,defX-(defend.policy.compactness>=m.compactHelp?0:1)),y=lim(ball.y+(ball.y===2?-1:1),0,2);target={x:defend.ti===0?x:3-x,y};}else{const runner=runners[0];target=runner?{x:runner.pos.x,y:runner.pos.y}:{...ball};}if(traitState)target=H.defendTarget(q,i,target,{state:traitState,teams,poss,attack,defend,carrier,zone,ball,tick,defX,runners,available});move(q,target);}',
    'spatial defend target');
  return out;
}

function patchTactical(source) {
  let out = source;
  out = replaceOnce(out,
    'const lim=C.lim,rounded=v=>Math.round(v*10000)/10000;',
    'const lim=C.lim,rounded=v=>Math.round(v*10000)/10000,H=window.CageTraitHooks;',
    'tactical H binding');
  out = replaceOnce(out,
    "function simulate({teams,tactics,seed,mode='ko',traits:traitConfig}){\nconst traitOn=traitConfig?.enabled===true;\nconst trait=traitOn?window.CageTraits:null;if(traitOn&&!trait)throw Error('Trait decision module is unavailable.');",
    "function simulate({teams,tactics,seed,mode='ko',traits:traitConfig}){\nconst traitOn=traitConfig===true||traitConfig?.enabled===true;let traitState=null;if(traitOn&&!H)throw Error('Trait decision module is unavailable.');",
    'tactical trait mode');
  out = replaceOnce(out,
    'S.initial(team);return team;});',
    'S.initial(team);return team;});if(traitOn)traitState=H.init(T,BY_ID,traitConfig);',
    'tactical init');
  out = replaceOnce(out,
    'if(loser&&oldX>=1)loser.oop=Math.max(loser.oop,1);T[poss].ps.forEach(q=>q.oop=0);',
    'if(traitOn)H.onTurnover(traitState,{tick,oldTeam:old,newTeam:poss,committed:T[old].ps.filter(q=>q.committed).map(q=>q.id)});if(loser&&oldX>=1)loser.oop=Math.max(loser.oop,1);T[poss].ps.forEach(q=>q.oop=0);',
    'tactical turnover');
  out = replaceOnce(out,
    "if(traitOn&&!c.committed&&T[poss].ps.some(q=>q!==c&&!q.committed)&&trait.traits(c.id).some(([name])=>name==='Libero'))c.committed=true;",
    '',
    'tactical libero commitment');
  out = replaceOnce(out,
    'events.push(out);return out;',
    'if(traitOn)H.attachEvent(out,traitState);events.push(out);return out;',
    'tactical emit');
  out = replaceOnce(out,
    'const rotations=S.update(T,poss,carrier,zone(),tick);',
    'const rotations=S.update(T,poss,carrier,zone(),tick,traitOn?traitState:null);',
    'tactical update call');
  out = replaceOnce(out,
    "engaged=!!d&&R()<(traitOn?trait.engagement(d.id,engage,{x,transition}):engage)",
    "engaged=!!d&&R()<(traitOn?H.engage(d,engage,{...ctx,state:traitState,x,transition,recentRegain,tick,poss,carrier,teams:T,zone:zone()}):engage)",
    'tactical engage');
  out = replaceOnce(out,
    'if(traitOn){const covered=T[poss].ps.some(q=>q!==c&&!q.committed);const adjusted=trait.weights(c.id,U,{x,engaged,transition,hasRunner:!!runner,covered,support:ctx.support.length});Object.assign(U,adjusted.weights);}',
    'if(traitOn){const covered=T[poss].ps.some(q=>q!==c&&!q.committed);const adjusted=H.utilities(c,U,{...ctx,state:traitState,x,engaged,transition,hasRunner:!!runner,covered,support:ctx.support.length,tick,poss,carrier:c,teams:T,zone:zone()});Object.assign(U,adjusted.weights);}',
    'tactical utilities');
  out = replaceOnce(out,
    "const passRoll=action==='pass'?R():null,receiver=action==='through'||action==='outlet'?runner:(traitOn?trait.receiver(c.id,mates,c,poss,S,T,passRoll):mates[Math.floor(passRoll*mates.length)])",
    "const passRoll=action==='pass'?R():null,receiver=action==='through'||action==='outlet'?(traitOn?(H.runner(c,forward,action,{...ctx,state:traitState,x,engaged,transition,tick,poss,carrier:c,teams:T,zone:zone(),attack:T[poss],defend:T[1-poss]})||runner):runner):(traitOn?H.receiver(c,mates,c,poss,S,T,passRoll,{...ctx,state:traitState,x,engaged,transition,tick,poss,carrier:c,teams:T,zone:zone(),attack:T[poss],defend:T[1-poss]}):mates[Math.floor(passRoll*mates.length)])",
    'tactical receiver');
  out = replaceOnce(out,
    'return freeze({events,score,winner,duration:t,draws:R.count(),shapes:T.map(team=>({duty:Object.fromEntries(team.ps.map(q=>[q.id,q.duty])),cover:team.shape.cover.map(rounded),policy:team.policy})),eventHash:hashEvents(events)});',
    'const result={events,score,winner,duration:t,draws:R.count(),shapes:T.map(team=>({duty:Object.fromEntries(team.ps.map(q=>[q.id,q.duty])),cover:team.shape.cover.map(rounded),policy:team.policy})),eventHash:hashEvents(events)};if(traitOn)result.traits=H.summary(traitState);return freeze(result);',
    'tactical result');
  return out;
}

function buildPatchedBundle() {
  let bundle = read(BUNDLE);
  const traits = read(TRAITS);
  const spatial = read(SPATIAL);
  const tactical = read(TACTICAL);
  const hooks = fs.readFileSync(path.join(__dirname, 'trait-hooks.js'), 'utf8');
  bundle = replaceOnce(bundle, traits, hooks, 'bundle traits module');
  bundle = replaceOnce(bundle, spatial, patchSpatial(spatial), 'bundle spatial module');
  bundle = replaceOnce(bundle, tactical, patchTactical(tactical), 'bundle tactical module');
  return bundle;
}

function makeContext(bundle, filename) {
  const c = { window: { location: { search: '?engine=t3' } } };
  vm.createContext(c);
  for (const file of ROSTER_FILES) {
    vm.runInContext(read(file), c, { filename: file });
  }
  vm.runInContext(bundle, c, { filename: filename || 'bundle.js' });
  return c;
}

function loadProduction() {
  return makeContext(read(BUNDLE), 'production-cage-engine.js');
}

function loadPatched() {
  return makeContext(buildPatchedBundle(), 'patched-cage-engine.js');
}

module.exports = {
  ROOT,
  ROSTER_FILES,
  patchSpatial,
  patchTactical,
  buildPatchedBundle,
  loadProduction,
  loadPatched
};
