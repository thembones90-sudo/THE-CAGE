(()=>{'use strict';const C=window.CageCapabilities,lim=C.lim;
function derive(players,tactic='balanced',params=window.CageTacticalParams.P){const tac=window.CageTacticalParams.TACTICS[tactic];if(!tac)throw Error('Unknown tactic.');const c=players.map(C.comp),raw=C.raw(players),a=params.policy,wr=C.avg(c.map(x=>x.a.wr)),press=C.avg(c.map(x=>x.press)),sta=C.avg(c.map(x=>x.a.sta));const natural=c.filter(x=>x.DEF>=x.ATT+a.restGap).length;
const highPressDefenderOnly=tactic==='press'&&natural===3;
// An all-specialist defensive trio does not start with two makeshift forwards.
// If a REAL long match remains scoreless, the high-press coach may commit a
// second defender after the tactical escalation point to search for a goal.
const rest=highPressDefenderOnly?2:lim(Math.min(2,natural)+tac.rest,0,2);const twoWay=players.filter(p=>C.phaseProfile(p).twoWay).length;
return Object.freeze({blockHeight:lim(tac.engageHigh*lim(press/75,.6,1.3),0,.95),restDefence:rest,commitForward:3-rest,latePressEligible:highPressDefenderOnly,tempo:tac.tempo*lim(1+(raw.MC-raw.TE)/a.tempoScale,.85,1.15),riskAppetite:tac.risk*lim(1+(raw.AT-raw.DS)/a.riskScale,.7,1.4),pressTrigger:lim((press-a.pressBase)/a.pressScale,0,1)*tac.cp*lim(sta/80,.6,1.2),directness:tac.direct*lim(1+(raw.DS-raw.AT)/a.directScale,.7,1.5),rotation:lim(params.spatial.rotationFloor+raw.TA/params.spatial.rotationScale+twoWay*.1,0,.95),compactness:lim(a.compactBase+a.workCompact*wr/100+a.defCompact*(raw.DS>raw.AT?1:0),.3,1),AT:raw.AT,DS:raw.DS,MC:raw.MC,TE:raw.TE,PD:raw.PD,TA:raw.TA});}
window.CagePolicy={derive};})();
