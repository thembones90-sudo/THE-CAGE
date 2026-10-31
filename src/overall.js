// THE CAGE Overall Rating V1.0. A positional skill indicator, not a career ranking.
// Uses prime ratings only; tiers, folklore, provisional T3 attributes and traits never enter OVR.
// Core categories and relevant extended skills are weighted to 100%; CM and RB support alternate tactical profiles.
// OVR does not influence the match engine, draft probability, or historical category.
(()=>{
'use strict';
const W=Object.freeze({
 ST:{pace:22,tech:14,pass:4,finish:37,phys:8,shooting:8,composure:7},
 CF:{pace:8,tech:24,pass:20,finish:24,phys:4,first_touch:11,composure:9},
 CAM:{pace:3,tech:26,pass:34,finish:7,phys:2,vision:15,first_touch:8,composure:5},
 CM:{pace:6,tech:18,pass:31,finish:6,def:11,phys:8,vision:9,stamina:7,composure:4},
 CDM:{pace:3,tech:11,pass:24,def:31,phys:6,tackling:7,positioning:12,vision:6},
 LW:{pace:12,tech:28,pass:15,finish:25,phys:3,dribbling:12,composure:5},
 RW:{pace:12,tech:28,pass:15,finish:25,phys:3,dribbling:12,composure:5},
 LM:{pace:13,tech:26,pass:25,finish:10,def:4,phys:6,dribbling:10,stamina:6},
 RM:{pace:13,tech:26,pass:25,finish:10,def:4,phys:6,dribbling:10,stamina:6},
 LB:{pace:14,tech:8,pass:10,def:42,phys:11,stamina:5,tackling:10},
 RB:{pace:14,tech:8,pass:10,def:42,phys:11,stamina:5,tackling:10},
 CB:{pace:12,tech:3.5,pass:8.5,def:46,phys:18,tackling:6,positioning:6}
});
const ALTERNATES=Object.freeze({
 CM:[Object.freeze({pace:10,tech:10,pass:12,def:38,phys:10,tackling:8,positioning:5,stamina:7})],
 RB:[Object.freeze({pace:15,tech:19,pass:32,def:18,phys:5,vision:7,stamina:4})],
 LB:[Object.freeze({pace:15,tech:19,pass:32,def:18,phys:5,vision:7,stamina:4})]
});
for(const [pos,weights] of [...Object.entries(W),...Object.entries(ALTERNATES).flatMap(([pos,arr])=>arr.map((p,i)=>[pos+'-alternate-'+i,p]))]){
 const total=Object.values(weights).reduce((a,b)=>a+b,0);
 if(Math.abs(total-100)>0.00001)throw Error('OVR weights invalid for '+pos+': '+total);
 Object.freeze(weights);
}
function compute(player){
 if(!player||typeof player!=='object'||!player.r)throw Error('OVR requires a player with ratings');
 const pos=player.position||(player.role==='D'?'CB':player.role==='M'?'CM':'ST');
 const weights=W[pos];if(!weights)throw Error('Unsupported natural position for OVR: '+pos);
 const profiles=[weights,...(ALTERNATES[pos]||[])];
 const best=Math.max(...profiles.map(profile=>Object.entries(profile).reduce((total,[key,weight])=>{
  const n=player.r[key];
  if(!Number.isFinite(n)||n<0||n>100)throw Error('Invalid '+key+' for '+player.id);
  return total+n*weight;
 },0)));
 return Math.max(1,Math.min(99,Math.round(best/100)));
}
function apply(roster){
 if(!Array.isArray(roster))throw Error('Expected roster array');
 const seen=new Set();
 for(const p of roster){
  if(seen.has(p.id))throw Error('Duplicate OVR identity '+p.id);
  seen.add(p.id);
  const val=compute(p);
  if(p.overall!==undefined&&p.overall!==val)throw Error('Conflicting OVR for '+p.id);
  p.overall=val;
 }
 return roster.length;
}
const count=apply(window.THE_CAGE_PLAYERS);
window.CageOverall=Object.freeze({VERSION:'overall-v1.0',WEIGHTS:W,ALTERNATES,compute,read:p=>p.overall??compute(p),apply,loadedPlayers:count});
})();