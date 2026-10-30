'use strict';
const W=require('../tests/viewer/harness.cjs').loadEngine(),E=W.CageEngine,P=E.P;
const cases=[
 {name:'DDD',a:['paolo-maldini','nemanja-vidic','jaap-stam'],b:['alessandro-nesta','john-terry','fabio-cannavaro'],t:['balanced','balanced'],idx:1},
 {name:'BALANCED',a:['paolo-maldini','michael-ballack','ronaldo-nazario'],b:['nemanja-vidic','luka-modric','thierry-henry'],t:['balanced','balanced'],idx:0},
 {name:'ATTACK',a:['ronaldo-nazario','cristiano-ronaldo','thierry-henry'],b:['nemanja-vidic','luka-modric','thierry-henry'],t:['press','balanced'],idx:4}
];
const shots=[],params=[[11,75],[13,72],[14,70],[15,70],[15,68],[18,70]],N=Number(process.env.CAGE_V54_SWEEP_N||80);
for(const [q,ref] of params){
 P.shot.q=q;P.resolution.shotReference=ref;
 const list=[];
 for(const scenario of cases){
  let caps=0,wins=0,attempts=0,unblocked=0,hit=0,pAvg=0,times=[];
  for(let seed=1;seed<=N;seed++)for(let side=0;side<2;side++){
   const config={teams:side?[scenario.b,scenario.a]:[scenario.a,scenario.b],tactics:side?scenario.t.slice().reverse():scenario.t.slice(),seed:(scenario.idx+1)*100000+seed,mode:'ko'};
   try{const r=E.simulate(config);wins+=r.winner===(side?1:0);times.push(r.duration);
    for(const e of r.events) if(e.type==='shot_attempt')attempts++;else if(e.type==='shot_miss'||e.type==='goal'){unblocked++;pAvg+=e.p;hit+=e.type==='goal';}
   }catch(e){if(/safety limit/.test(e.message))caps++;else throw e;}
  }
  times.sort((a,b)=>a-b);
  list.push({scenario:scenario.name,caps,completed:times.length,p95:times[Math.floor(times.length*.95)]||null,winPct:+(wins/times.length*100).toFixed(1),shotAttempts:attempts,unblocked,avgUnblockedP:+(pAvg/(unblocked||1)*100).toFixed(2)});
 }
 const row={q,ref,list};shots.push(row);console.log('V54_SWEEP',JSON.stringify(row));
}
console.log('V54_SWEEP_DONE',N,'seeds');
