'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const W=require('../tests/viewer/harness.cjs').loadEngine(),E=W.CageEngine;
const D1=['paolo-maldini','nemanja-vidic','jaap-stam'],D2=['alessandro-nesta','john-terry','fabio-cannavaro'];
const thresholds=[600,900,1200,1500,1800,2100],n=Number(process.env.CAGE_V55_SWEEP_SEEDS||400),rows=[];
for(const threshold of thresholds){
 E.P.decisions.pressSurgeAfter=threshold;
 const duration=[],wins=[0,0];let caps=0;
 for(let i=0;i<n;i++)for(let rev=0;rev<2;rev++){
  const config={teams:rev?[D2,D1]:[D1,D2],tactics:rev?['press','possession']:['possession','press'],seed:600000+i,mode:'ko'};
  try{
   const r=E.simulate(config);assert.equal(r.events.filter(e=>e.type==='goal').length,1);
   wins[r.winner===(rev?1:0)?0:1]++;duration.push(r.duration);
  }catch(e){if(/safety limit/.test(e.message))caps++;else throw e;}
 }
 duration.sort((a,b)=>a-b);
 const row={threshold,seedPairs:n,matches:n*2,completed:duration.length,caps,winPossessionPct:+(100*wins[0]/duration.length).toFixed(2),p95:duration[Math.floor(duration.length*.95)]};
 rows.push(row);console.log('V55_ESCALATION_SWEEP',JSON.stringify(row));
}
E.P.decisions.pressSurgeAfter=900;
fs.writeFileSync(path.resolve(__dirname,'../tests/v55-escalation-sweep.json'),JSON.stringify({rows},null,2)+'\n');
