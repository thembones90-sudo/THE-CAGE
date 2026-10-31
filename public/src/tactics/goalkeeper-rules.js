// T3-7 keeper resolution. A reference goalkeeper adds exactly zero change to the existing shot logit.
(function(root,factory){const api=factory();root.CageGoalkeeperRules=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const REFERENCE=88,MAX_LOGIT_SHIFT=.35;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function score(g,context='box'){
 if(!g?.r)throw Error('Missing goalkeeper card');
 const r=g.r;let composite=r.reflexes*.34+r.positioning*.25+r.oneOnOne*.20+r.handling*.13+r.aerialControl*.08;
 if(context==='one_v_one')composite+=.07*(r.oneOnOne-r.handling);
 if(context==='fk')composite+=.05*(r.positioning-r.oneOnOne);
 if(g.keeperClass==='REFLEX MONSTER'&&context!=='fk')composite+=1.5;
 if(g.keeperClass==='GUARDIAN')composite+=1.2;
 if(g.keeperClass==='COMMANDER')composite+=.7;
 return composite;
}
function logitShift(g,context){const shift=(REFERENCE-score(g,context))*.021;return Math.abs(shift)<1e-12?0:clamp(shift,-MAX_LOGIT_SHIFT,MAX_LOGIT_SHIFT);}
function afterMiss(g,shotKind,roll){
 if(!g||!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid keeper shot context');
 // Categorize only an existing non-goal. The goal test is performed exactly once elsewhere.
 const onTarget=clamp(.46+(g.r.positioning-REFERENCE)*.001+(shotKind==='one_v_one'?.12:0),.3,.7);
 if(roll>=onTarget)return {type:'shot_miss',outcome:'wide',onTarget:false};
 const parry=clamp(.30-(g.r.handling-REFERENCE)*.004,.08,.44),normalized=roll/onTarget;
 if(normalized<parry)return {type:'gk_parry',outcome:'parried',onTarget:true};
 return {type:'gk_save',outcome:'held',onTarget:true};
}
function validateKeepers(ids,players){if(!Array.isArray(ids)||ids.length!==2||ids[0]===ids[1]||ids.some(id=>typeof id!=='string'||!Object.hasOwn(players,id)))throw Error('Exactly two different supported goalkeepers required');return ids.map(id=>players[id]);}
return Object.freeze({REFERENCE,MAX_LOGIT_SHIFT,score,logitShift,afterMiss,validateKeepers});
});
