// T3-13 keeper rules (owner decision 3, 2026-11-01). EXECUTION comes ONLY from the seven visible attributes;
// the keeper CLASS is a playing style that changes DECISIONS (how often a keeper comes out, rushes, claims or
// goes long), never success probabilities. The original CageGoalkeeperRules stays untouched for historical engines.
(function(root,factory){const api=factory();root.CageGoalkeeperRulesV2=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const REFERENCE=88,MAX_LOGIT_SHIFT=.35;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
// Style = decision propensities. sweep: comes for a through ball; rush: closes down a one-on-one instead of staying
// to react; claim: comes for a loose ball in the box; longBias: preference for long distribution.
const STYLE=Object.freeze({
 'REFLEX MONSTER':Object.freeze({sweep:.35,rush:.30,claim:.25,longBias:0,label:'Stays on the line and reacts'}),
 'GUARDIAN':Object.freeze({sweep:.35,rush:.45,claim:.35,longBias:0,label:'Positional; narrows angles from the line'}),
 'COMMANDER':Object.freeze({sweep:.55,rush:.60,claim:.65,longBias:0,label:'Dominates the box; comes for loose balls'}),
 'SWEEPER KEEPER':Object.freeze({sweep:.90,rush:.80,claim:.45,longBias:0,label:'Plays high; sweeps behind the defence'}),
 'DISTRIBUTOR':Object.freeze({sweep:.55,rush:.55,claim:.35,longBias:.08,label:'Starts attacks; ambitious distribution'})
});
const NEUTRAL=Object.freeze({sweep:.5,rush:.5,claim:.4,longBias:0,label:'Balanced'});
function style(g){return STYLE[g?.keeperClass]||NEUTRAL;}
// Shot-stopping from attributes only. In a one-on-one the keeper's DECISION picks which ability carries the save:
// rushing leans on one-on-one skill, staying leans on reflexes.
function score(g,context='box',mode=null){
 if(!g?.r)throw Error('Missing goalkeeper card');
 const r=g.r;let composite=r.reflexes*.34+r.positioning*.25+r.oneOnOne*.20+r.handling*.13+r.aerialControl*.08;
 if(context==='one_v_one')composite+=mode==='stay'?.05*(r.reflexes-r.oneOnOne):.10*(r.oneOnOne-r.reflexes);
 if(context==='fk')composite+=.05*(r.positioning-r.oneOnOne);
 return composite;
}
function logitShift(g,context,mode=null){const shift=(REFERENCE-score(g,context,mode))*.021;return Math.abs(shift)<1e-12?0:clamp(shift,-MAX_LOGIT_SHIFT,MAX_LOGIT_SHIFT);}
function afterMiss(g,shotKind,roll){
 if(!g||!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid keeper shot context');
 const onTarget=clamp(.46+(g.r.positioning-REFERENCE)*.001+(shotKind==='one_v_one'?.12:0),.3,.7);
 const parry=clamp(.30-(g.r.handling-REFERENCE)*.004,.08,.44),normalized=roll/onTarget;
 const evidence={onTargetP:onTarget,parryP:parry};
 if(roll>=onTarget)return {type:'shot_miss',outcome:'wide',onTarget:false,...evidence};
 if(normalized<parry)return {type:'gk_parry',outcome:'parried',onTarget:true,...evidence};
 return {type:'gk_save',outcome:'held',onTarget:true,...evidence};
}
// Distribution quality = the distribution attribute. Style only shifts the CHOICE of long vs short.
function distribute(g,oppositionPress=0,roll=0,long=false){
 if(!g?.r||!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid goalkeeper distribution.');
 const pressing=clamp(oppositionPress,0,1),quality=g.r.distribution;
 const success=clamp(.82+(quality-85)*.007-pressing*.05-(long?.09:0),.53,.95);
 const longChance=clamp(.24+(quality-82)*.014+style(g).longBias,.12,.62);
 return {p:success,successful:roll<success,longChance,quality};
}
// Sweep execution when the keeper has DECIDED to come: sweeping and positioning only.
function sweep(g,threat=2,roll=0){
 if(!g?.r||!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid goalkeeper sweep.');
 const ability=.75*g.r.sweeping+.25*g.r.positioning;
 const p=clamp(.15+(ability-80)*.012+(threat>=3?.09:0),.06,.49);
 return {p,cleared:roll<p,ability};
}
// Loose-ball claim execution when the keeper has DECIDED to come: aerial control and handling vs the attacker.
function claim(g,attackerReach){
 if(!g?.r)throw Error('Missing goalkeeper card');
 const ability=.6*g.r.aerialControl+.4*g.r.handling;
 return {p:clamp(.45+(ability-attackerReach)/60,.15,.8),ability};
}
function validateKeepers(ids,players){if(!Array.isArray(ids)||ids.length!==2||ids[0]===ids[1]||ids.some(id=>typeof id!=='string'||!Object.hasOwn(players,id)))throw Error('Exactly two different supported goalkeepers required');return ids.map(id=>players[id]);}
return Object.freeze({VERSION:'gk-rules-v2-style',REFERENCE,MAX_LOGIT_SHIFT,STYLE,style,score,logitShift,afterMiss,distribute,sweep,claim,validateKeepers});
});
