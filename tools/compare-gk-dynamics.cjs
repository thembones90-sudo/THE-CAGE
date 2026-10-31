'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const list=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]),ctx={window:{location:{search:''}}};vm.createContext(ctx);
for(const file of list){vm.runInContext(read(file),ctx,{filename:file});if(file==='src/cage-engine.js')break;}
const engines={T3_7:ctx.window.CageEngineV66,T3_8:ctx.window.CageEngine};
const squads={
 mixed:[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']],
 defense:[['paolo-maldini','nemanja-vidic','alessandro-nesta'],['rio-ferdinand','ledley-king','john-terry']]
};
const pairings={Elite:['gianluigi-buffon','manuel-neuer'],Uneven:['gianluigi-buffon','rene-higuita'],Low:['rene-higuita','jorge-campos']};
const rows=[];for(const [roster,teams] of Object.entries(squads)){for(const [pair,keepers] of Object.entries(pairings)){
 for(const [engineName,engine] of Object.entries(engines)){
  const n=180,stats={goals:0,golden:0,duration:0,sweeps:0,cleared:0,distributions:0,completed:0,intercepted:0,caps:0};
  for(let i=0;i<n;i++){
   try{const r=engine.simulate({teams,tactics:['balanced','press'],mode:'score',traits:{enabled:true},keepers,seed:780000+i});stats.goals+=r.score[0]+r.score[1];stats.golden+=r.decidedBy==='golden_goal';stats.duration+=r.duration;stats.sweeps+=r.events.filter(e=>e.type==='gk_sweep').length;stats.cleared+=r.events.filter(e=>e.type==='gk_sweep'&&e.outcome==='cleared').length;stats.distributions+=r.events.filter(e=>e.type==='gk_distribution').length;stats.completed+=r.events.filter(e=>e.type==='gk_distribution'&&e.outcome==='complete').length;stats.intercepted+=r.events.filter(e=>e.type==='gk_distribution'&&e.outcome==='intercepted').length;}catch(e){stats.caps++;if(stats.caps===1)console.log('CAP_ERROR',roster,engineName,e.message);}
  }
  const completed=n-stats.caps;const row={roster,pair,engine:engineName,matches:n,failures:stats.caps,goalsPerMatch:completed?+(stats.goals/completed).toFixed(2):null,goldenPct:completed?+(100*stats.golden/completed).toFixed(1):null,seconds:completed?+(stats.duration/completed).toFixed(1):null,sweeps:stats.sweeps,cleared:stats.cleared,distributions:stats.distributions,completed:stats.completed,intercepted:stats.intercepted};rows.push(row);console.log('DYNAMICS_BALANCE',JSON.stringify(row));
 }
}}
fs.writeFileSync(path.join(root,'docs/V66_GK_DYNAMICS_PAIRED_FINAL.json'),JSON.stringify({date:'2026-10-31',description:'Paired seed comparison. Historical T3-7 vs experimental T3-8, 180 identical seeds per matchup, two team archetypes.',rows},null,2)+'\n');
