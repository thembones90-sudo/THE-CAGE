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
 const parry=clamp(.30-(g.r.handling-REFERENCE)*.004,.08,.44),normalized=roll/onTarget;
 const evidence={onTargetP:onTarget,parryP:parry};
 if(roll>=onTarget)return {type:'shot_miss',outcome:'wide',onTarget:false,...evidence};
 if(normalized<parry)return {type:'gk_parry',outcome:'parried',onTarget:true,...evidence};
 return {type:'gk_save',outcome:'held',onTarget:true,...evidence};
}
// A goalkeeper's distribution changes possession and field position, never an already resolved shot.
function distribute(g,oppositionPress=0,roll=0,long=false){
 if(!g?.r||!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid goalkeeper distribution.');
 const pressing=clamp(oppositionPress,0,1);
 const quality=g.r.distribution+(g.keeperClass==='DISTRIBUTOR'?5:0);
 const success=clamp(.82+(quality-85)*.007-pressing*.05-(long?.09:0),.53,.95);
 const longChance=clamp(.24+(quality-82)*.014+(g.keeperClass==='DISTRIBUTOR'?.08:0),.12,.62);
 return {p:success,successful:roll<success,longChance,quality};
}
// Through-ball sweeps apply only BEFORE a shot, so they never recheck a saved/allowed goal.
function sweep(g,threat=2,roll=0){
 if(!g?.r||!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid goalkeeper sweep.');
 const ability=.75*g.r.sweeping+.25*g.r.positioning+(g.keeperClass==='SWEEPER KEEPER'?5:0);
 const p=clamp(.15+(ability-80)*.012+(threat>=3?.09:0),.06,.49);
 return {p,cleared:roll<p,ability};
}
function validateKeepers(ids,players){if(!Array.isArray(ids)||ids.length!==2||ids[0]===ids[1]||ids.some(id=>typeof id!=='string'||!Object.hasOwn(players,id)))throw Error('Exactly two different supported goalkeepers required');return ids.map(id=>players[id]);}
return Object.freeze({REFERENCE,MAX_LOGIT_SHIFT,score,logitShift,afterMiss,distribute,sweep,validateKeepers});
});
