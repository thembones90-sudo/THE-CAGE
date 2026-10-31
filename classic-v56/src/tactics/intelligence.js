// THE CAGE V5.5 — deterministic, evidence-based football decisions.
// Tactical intent only. Never selects or manufactures an event outcome.
(()=>{'use strict';
const lim=(v,a,b)=>Math.min(b,Math.max(a,v));
function engagement(zoneX,defensivePolicy,recentRegain,params){
 if(!Number.isInteger(zoneX)||zoneX<0||zoneX>3)throw Error('Invalid attacking zone');
 const h=lim(defensivePolicy.blockHeight,0,.95),tr=lim(defensivePolicy.pressTrigger,0,1.25);
 if(zoneX===3)return 1; // physically nearby defenders always challenge in the box
 if(zoneX===2)return lim(.79+.09*h+.055*tr,0,.95);
 const base=h+(zoneX===1?.15:0)+(recentRegain?.2*tr:0);
 // Pressing has an effect at the earliest stages of a counter too, but
 // counter-pressing is still gated by ACTUAL recent regain and reachable defense.
 return lim(base+(zoneX===1?.07:.025)*tr,0,.95);
}
// Only existing teammates ahead of the carrier qualify; positions from the
// authoritative 4x3 state. No extra run, fabricated receiver or magic pass.
function forwardTarget(forwards,carrier,team,spatial,teams){
 if(!forwards.length)return null;
 const laneRisk=q=>spatial.passingDefenders(teams,team,carrier.pos,q.pos).length;
 const from=spatial.oriented(carrier.pos,team);
 const rank=q=>{
  const depth=spatial.oriented(q.pos,team)-from;
  const pace=q.c?.a?.pace||50,attack=q.c?.ATT||50;
  const defenders=laneRisk(q);
  return depth*2.6+(pace-50)*.014+(attack-50)*.018-defenders*2.15;
 };
 return forwards.slice().sort((a,b)=>rank(b)-rank(a)||spatial.oriented(b.pos,team)-spatial.oriented(a.pos,team)||(String(a.id)<String(b.id)?-1:String(a.id)>String(b.id)?1:0))[0];
}
function outletWeight(transition,runner,policy,defensivePolicy,params){
 if(!transition||!runner)return 0;
 // Direct counterplay matters ONLY if the carrier has a real forward route.
 // Against a high line, choose that outlet more often; a trapped ball carrier
 // must still face real interceptors and the original pass-duel probabilities.
 const exposure=lim(defensivePolicy.blockHeight,0,.95);
 return params.decisions.outlet*policy.directness*(1+exposure*.60);
}
window.CageTacticalIntelligence=Object.freeze({engagement,forwardTarget,outletWeight});
})();