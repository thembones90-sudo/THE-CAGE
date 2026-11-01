(()=>{'use strict';
const ROSTER=window.THE_CAGE_PLAYERS,BY_ID=Object.fromEntries(ROSTER.map(p=>[p.id,p])),C=window.CageCapabilities,S=window.CageSpatial,I=window.CageTacticalIntelligence,{P}=window.CageTacticalParams,TACTICS=Object.freeze({...window.CageTacticalParams.TACTICS,possession:Object.freeze({...window.CageTacticalParams.TACTICS.possession,tempo:1.13,risk:.97}),press:Object.freeze({...window.CageTacticalParams.TACTICS.press,engageHigh:.69,cp:1.3})}),Q=P.decisions,F=P.resolution,comp=C.comp,shape=C.shape;
const lim=C.lim,rounded=v=>Math.round(v*10000)/10000;
const imul=Math.imul,stringify=JSON.stringify,values=Object.values,isFrozen=Object.isFrozen,freezeObject=Object.freeze;
const logistic=x=>window.CAGE_SIGMOID_LUT[lim(Math.round(x*256)+3072,0,6144)]/1e6;
function freeze(v){if(v&&typeof v==='object'&&!isFrozen(v)){values(v).forEach(freeze);freezeObject(v);}return v;}
function hashEvents(events){let h=2166136261;const text=stringify(events);for(let i=0;i<text.length;i++)h=imul(h^text.charCodeAt(i),16777619)>>>0;return h.toString(16).padStart(8,'0');}
function probability(A,D,b,ctx=null,applySupport=true){const support=ctx&&applySupport?P.support*ctx.supportQ:0,help=ctx&&applySupport?P.help*ctx.helpQ:0,z=(A-D)/P.k+b+support-help;return {p:lim(logistic(z),P.clampLo,P.clampHi),calc:{A:rounded(A),D:rounded(D),bias:rounded(b),support:rounded(support),help:rounded(help),logit:rounded(z)}};}
function rng(seed){let s=seed>>>0;const sm=()=>{s=(s+0x9e3779b9)>>>0;let z=s;z=Math.imul(z^(z>>>16),0x85ebca6b)>>>0;z=Math.imul(z^(z>>>13),0xc2b2ae35)>>>0;return(z^(z>>>16))>>>0;};let a=sm(),b=sm(),c=sm(),d=sm(),n=0;const f=()=>{n++;a>>>=0;b>>>=0;c>>>=0;d>>>=0;let t=(a+b)|0;a=b^(b>>>9);b=(c+(c<<3))|0;c=(c<<21)|(c>>>11);d=(d+1)|0;t=(t+d)|0;c=(c+t)|0;return(t>>>0)/4294967296;};f.count=()=>n;return f;}
function simulate({teams,tactics,seed,mode='ko',traits:traitConfig,keepers}){
const traitOn=traitConfig?.enabled===true;
const trait=traitOn?window.CageTraits:null;if(traitOn&&!trait)throw Error('Trait decision module is unavailable.');
const GK=window.CageGoalkeepers,GKRules=window.CageGoalkeeperRulesV2,goalies=keepers===undefined?null:GKRules.validateKeepers(keepers,GK.BY_ID);
if(keepers!==undefined&&mode!=='score')throw Error('Goalkeepers currently require regulation scoring.');
if(!Array.isArray(teams)||teams.length!==2||teams.some(ids=>!Array.isArray(ids)||ids.length!==3||new Set(ids).size!==3||ids.some(id=>typeof id!=='string'||!Object.hasOwn(BY_ID,id))))throw Error('Each side requires three distinct supported identities.');
if(!Array.isArray(tactics)||tactics.length!==2||tactics.some(t=>typeof t!=='string'||!Object.hasOwn(TACTICS,t)))throw Error('Unknown tactic.');
if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Seed must be an unsigned 32-bit integer.');if(!['ko','timed','score'].includes(mode))throw Error('Unknown match mode.');
const R=rng(seed),events=[],score=[0,0],T=teams.map((ids,ti)=>{const ps=ids.map(id=>({id,c:comp(BY_ID[id]),twoWay:C.phaseProfile(BY_ID[id]).twoWay,fat:0,oop:0,ti})),sh=shape(ids.map(id=>BY_ID[id]));sh.duty.forEach((pi,i)=>ps[pi].duty=['anchor','link','spear'][i]);const team={ti,ps,tac:TACTICS[tactics[ti]],policy:window.CagePolicy.derive(ids.map(id=>BY_ID[id]),tactics[ti],P,TACTICS),shape:sh};S.initial(team);return team;});
let t=0,poss=0,carrier=null,x=0,lane=1,lastPasser=null,lastLink=null,transition=false,over=false,tick=0,lastRegain=null;
let pendingDecision=null;const DECISION_EVENTS=new Set(['carry','dribble_duel','wall_pass','press','pass','through_ball','shot_attempt']);let suddenDeath=false,regulationScore=null,regulationAt=null,goldenPressure=false,keeperExposed=null;
const zone=()=>({x,lane:['left','centre','right'][lane]}),context=()=>S.context(T,poss,carrier,zone());
const eff=(q,k)=>q.c[k]*(1-Math.min(1,q.fat/F.fatigueScale)*(['dribble','press','recover','rebound','tackle','intercept'].includes(k)?F.mobileLoss:F.otherLoss));
const tire=(q,kind)=>{q.fat+=P.fatigueCost[kind]*(F.fatigueBase-q.c.a.sta/100)*T[q.ti].tac.fat;};
function duel(A,D,b,ctx=null,applySupport=true){const resolved=probability(A,D,b,ctx,applySupport),roll=R();return {...resolved,roll,win:roll<resolved.p};}
function trace(ctx){return {carrier:carrier?.id||null,challenger:ctx.d?.id||null,helper:ctx.helper?.id||null,support:ctx.support.map(q=>q.id)};}
function emit(e,ctx=null,mechanic=false){ctx=ctx||context();const tags=e.tags?e.tags.slice():[];if(mechanic){if(ctx.support.length>0&&ctx.attackers>ctx.defenders&&ctx.defenders>0)tags.push('overload');if(ctx.helper&&ctx.helpQ>0)tags.push('help_defence');}
const out={...e,i:events.length,t,n:3,step:tick,targets:Object.fromEntries(T.flatMap(team=>team.ps.map(q=>[q.id,q.target?{x:q.target.x,y:q.target.y}:null]))),...(pendingDecision&&DECISION_EVENTS.has(e.type)?{decision:pendingDecision}:{}),roles:{...trace(ctx),...(e.roles||{})},positions:ctx.positions,tags:[...new Set(tags)],support:ctx.support.length,help:rounded(ctx.helpQ),numbers:{attackers:ctx.attackers,defenders:ctx.defenders},calc:{...(e.calc||{}),supportQ:rounded(ctx.supportQ),helpQ:rounded(ctx.helpQ),defenderIds:ctx.defenderIds,availability:ctx.availability,commitment:ctx.commitment}};if(out.decision)pendingDecision=null;events.push(out);return out;}
function restart(ti,reason){keeperExposed=null;lastLink=null;poss=ti;x=0;lane=1;transition=false;lastPasser=null;lastRegain=null;for(const team of T){S.commitment(team);team.ps.forEach(q=>q.oop=0);}carrier=T[ti].ps.find(q=>q.duty==='anchor')||T[ti].ps[0];carrier.pos=S.world(zone(),poss);t+=P.dt.restart;emit({type:'restart',team:poss,actor:carrier.id,reason,zone:zone()});}
function keeperRestart(ti,reason){
 restart(ti,reason);
 if(!goalies)return;
 const g=goalies[ti],opposing=T[1-ti],initial=carrier;
 const longRoll=R(),distributionRoll=R(),long=longRoll<GKRules.distribute(g,opposing.tac.engageHigh,distributionRoll).longChance,decision=GKRules.distribute(g,opposing.tac.engageHigh,distributionRoll,long);
 const choices=T[ti].ps.slice().sort((a,b)=>a.duty.localeCompare(b.duty));
 const target=T[ti].ps.find(q=>q.duty===(long?'spear':'link'))||choices[0];
 const to={x:long?2:1,lane:['left','centre','right'][target.pos.y]};
 const targetCell=S.world(to,ti),opponent=opposing.ps.slice().sort((a,b)=>S.dist(a.pos,targetCell)-S.dist(b.pos,targetCell)||a.id.localeCompare(b.id))[0];
 t+=2;
 emit({type:'gk_distribution',team:ti,actor:initial.id,gk:g.id,target:target.id,
   ...(decision.successful?{}:{opp:opponent.id}),p:decision.p,roll:distributionRoll,
   kind:long?'long':'short',outcome:decision.successful?'complete':'intercepted',zone:zone(),to,
   calc:{distribution:rounded(decision.quality),oppositionPress:rounded(opposing.tac.engageHigh)}});
 if(decision.successful){carrier=target;x=to.x;lane=target.pos.y;carrier.pos=S.world(zone(),poss);lastPasser=null;}
 else {x=1;turnover(opponent,'keeper_distribution','intercepted_release');}
}
function turnover(winner,how,reason){keeperExposed=null;lastLink=null;const old=poss,oldX=x,loser=carrier,ball=S.world(zone(),old);poss=1-poss;x=3-oldX;carrier=winner;carrier.pos={...ball};lastPasser=null;transition=oldX>=2||how==='press_win';
const caught=[];for(const q of T[old].ps){const notGoalSide=S.oriented(q.pos,old)>=oldX;if(q.committed&&notGoalSide){q.oop=2;caught.push(q.id);}}if(loser&&oldX>=1)loser.oop=Math.max(loser.oop,1);T[poss].ps.forEach(q=>q.oop=0);S.commitment(T[poss]);const goalSide=T[old].ps.filter(q=>S.oriented(q.pos,old)<oldX).map(q=>q.id);lastRegain={team:poss,tick};
emit({type:'turnover',team:poss,actor:winner.id,how,reason,zone:zone(),transition,tags:oldX>=2&&caught.length>=2&&goalSide.length<=1?['rest_defence_exposed']:[],calc:{caught,goalSide,lossZone:oldX}});}
function recover(){for(const q of T[1-poss].ps)if(q.oop>0){const r=duel(eff(q,'recover'),F.recoveryTarget,P.b.recover);q.oop--;if(r.win||q.oop<=0){q.oop=0;emit({type:'recovery_run',team:q.ti,actor:q.id,p:r.p,roll:r.roll,outcome:'back_in_shape',calc:r.calc});}}}
function shoot(kind){const sh=carrier,ctx=context(),link=kind!=='fk'&&lastLink&&lastLink.receiver===sh.id&&tick-lastLink.tick<=2?lastLink:null,exposed=!!(goalies&&keeperExposed&&keeperExposed.side===1-poss&&tick<=keeperExposed.until);keeperExposed=null;lastLink=null;emit({type:'shot_attempt',team:poss,actor:sh.id,zone:zone(),kind,pressure:ctx.d?.id||null,...(link?{creator:link.passer,linkBoost:rounded(link.bonus)}:{}),...(goalies?{keeperExposed:exposed}:{})},ctx,true);t+=P.dt.shot;
for(const bl of [ctx.d,ctx.helper].filter(Boolean)){const A=F.blockTackle*eff(bl,'tackle')+F.blockRead*eff(bl,'intercept'),b=(bl===ctx.d?P.block:P.blockCover)-P.support*ctx.supportQ+P.help*(bl===ctx.d?ctx.helpQ:0),r=duel(A,F.shotBlockTarget,b,null,false);if(r.win){emit({type:'block',team:1-poss,actor:bl.id,opp:sh.id,p:r.p,roll:r.roll,outcome:'blocked',roles:{blocker:bl.id},calc:r.calc},ctx,true);return loose('block');}}
const keeperMode=goalies&&kind==='one_v_one'?(R()<GKRules.style(goalies[1-poss]).rush?'rush':'stay'):null;const base=kind==='fk'?P.shot.fk:x===3?P.shot.box[lane===1?'C':'S']:P.shot.edge[lane===1?'C':'S'],quality=kind==='box'||kind==='one_v_one'?eff(sh,'shot'):eff(sh,'long'),z=base+(quality-F.shotReference)/P.shot.q+(transition?P.shot.transition:0)+(ctx.d?P.shot.pressure:0)+(kind==='one_v_one'?F.clearShot:0)+(link?link.bonus:0),p=lim(logistic(z+(goalies?GKRules.logitShift(goalies[1-poss],kind,keeperMode):0)+(exposed?.52:0)),F.shotMin,F.shotMax),roll=R();
if(roll<p){score[poss]++;emit({type:'goal',team:poss,actor:sh.id,p,roll,kind,zone:zone(),assist:lastPasser,transition,...(goalies?{gk:goalies[1-poss].id,keeperExposed:exposed}:{}),...(suddenDeath?{golden:true}:{}),calc:{quality:rounded(quality),logit:rounded(z),linkBoost:rounded(link?link.bonus:0),...(goalies?{exposureLogit:exposed?.52:0,keeperMode:keeperMode||undefined,style:goalies[1-poss].keeperClass}:{})}},ctx,true);over=mode==='ko'||(mode==='score'&&suddenDeath);if(!over)restart(1-poss,'kickoff');return;}
if(goalies){const keeper=goalies[1-poss],catRoll=R(),decision=GKRules.afterMiss(keeper,kind,catRoll);
  emit({type:decision.type,team:poss,actor:sh.id,gk:keeper.id,p,roll,kind,zone:zone(),outcome:decision.outcome,onTarget:decision.onTarget,catRoll,onTargetP:decision.onTargetP,parryP:decision.parryP,calc:{quality:rounded(quality),logit:rounded(z),linkBoost:rounded(link?link.bonus:0),gkShift:rounded(GKRules.logitShift(keeper,kind,keeperMode)),exposureLogit:exposed?.52:0,keeperMode:keeperMode||undefined,style:keeper.keeperClass}},ctx,true);
  if(decision.type==='gk_parry')return loose('goalkeeper');
  return keeperRestart(1-poss,decision.type==='gk_save'?'goalkeeper_distribution':'goal_kick');
}
emit({type:'shot_miss',team:poss,actor:sh.id,p,roll,kind,outcome:roll<p+(1-p)*F.nearMiss?'off_post_or_wide':'wide'},ctx);loose('wall');}
function loose(source){lastPasser=null;lastLink=null;const ball=S.world(zone(),poss),rank=team=>team.ps.slice().sort((a,b)=>S.dist(a.pos,ball)-S.dist(b.pos,ball)||b.c.rebound-a.c.rebound),att=rank(T[poss])[0],def=rank(T[1-poss])[0];if(goalies&&x===3){const keeper=goalies[1-poss],keeperStyle=GKRules.style(keeper),comeRoll=R();if(comeRoll<keeperStyle.claim){const cl=GKRules.claim(keeper,eff(att,'rebound')),cr=R(),won=cr<cl.p;emit({type:'gk_claim',team:poss,actor:att.id,gk:keeper.id,p:rounded(cl.p),roll:cr,source,outcome:won?'claimed':'beaten',calc:{claim:rounded(cl.ability),decision:'come',style:keeper.keeperClass,comeP:keeperStyle.claim,comeRoll}});if(won)return keeperRestart(1-poss,'goalkeeper_claim');carrier=att;x=3;lane=1;carrier.pos=S.world(zone(),poss);keeperExposed={side:1-poss,until:tick+2};return;}}const r=duel(eff(att,'rebound'),eff(def,'rebound')+F.reboundEdge,P.b.rebound),winner=r.win?att:def;emit({type:'rebound',team:winner.ti,actor:winner.id,opp:r.win?def.id:att.id,p:r.p,roll:r.roll,source,outcome:r.win?'attack_keeps':'defence_clears',calc:r.calc});
if(r.win){carrier=att;x=3;lane=1;carrier.pos=S.world(zone(),poss);}else turnover(def,'rebound','second_ball');}
function step(){tick++;
// A late, scoreless high-press surge is a tactical shape change, NOT a goal.
// It only affects eligible all-defender sides and is reflected in subsequent
// logged commitment/position snapshots, which remain deterministic.
for(const team of T){
 if(team.policy.latePressEligible&&!team.lateSurge&&t>=P.decisions.pressSurgeAfter){
  team.lateSurge=true;S.commitment(team);
 }
}
const rotations=S.update(T,poss,carrier,zone(),tick);recover();if(rotations.length)emit({type:'rotation',team:poss,actor:rotations[0],target:rotations[1],zone:zone(),outcome:'duties_swapped'});
const c=carrier,pol=T[poss].policy,dpol=T[1-poss].policy,ctx=context(),d=ctx.d,recentRegain=lastRegain&&lastRegain.team===poss&&tick-lastRegain.tick<=1,engage=I.engagement(x,dpol,recentRegain,P),engaged=!!d&&R()<(traitOn?trait.engagement(d.id,engage,{x,transition}):engage)*(goldenPressure?Math.max(.12,1-(t-(P.timedSeconds+900))/1450):1),mates=T[poss].ps.filter(q=>q!==c),U={};
if(x>=2)U.shoot=(x===3?Math.max(Q.boxMin,Q.boxBase+(c.c.shot-Q.boxReference)/Q.boxScale):(c.c.long-Q.edgeReference)/Q.edgeScale)*pol.riskAppetite*(engaged?Q.engagedShot:Q.openShot);if(!d&&x>=2)U.shoot=Q.clearShot;
if(engaged)U.dribble=(Q.dribbleBase+(c.c.dribble-d.c.tackle)/Q.dribbleScale+Q.dribbleSupport*ctx.support.length)*pol.riskAppetite;if(!engaged&&x<3)U.carry=Q.carry;
const safe=mates.filter(q=>S.dist(q.pos,ctx.ball)<=1&&S.oriented(q.pos,poss)<=x).length;U.pass=(Q.passBase+(c.c.pass-Q.passReference)/Q.passScale)*pol.tempo*(engaged?Q.engagedPass:1)*(1+Q.safeOutlet*safe);
const forward=mates.filter(q=>S.oriented(q.pos,poss)>x).sort((a,b)=>S.oriented(b.pos,poss)-S.oriented(a.pos,poss)||b.c.ATT-a.c.ATT),runner=I.forwardTarget(forward,c,poss,S,T);if(runner&&x>=1&&x<=2)U.through=(c.c.vision-Q.throughReference)/Q.throughScale*(transition?Q.transitionThrough:1)*pol.riskAppetite;
if(engaged&&x>=1)U.wall=(((c.c.dribble+c.c.pass)/2-Q.wallReference)/Q.wallScale+Q.wallSupport*ctx.support.length)*pol.riskAppetite;if(engaged&&x<=1)U.shield=(c.c.escape-Q.shieldReference)/Q.shieldScale;if(transition&&runner)U.outlet=I.outletWeight(transition,runner,pol,dpol,P);
const discipline=!c.committed?(x>=2?Q.boxDiscipline:Q.deepDiscipline):Q.committedDiscipline;for(const k of ['carry','dribble','shoot','wall'])if(U[k]!==undefined)U[k]*=discipline;if(!c.committed)U.pass*=Q.restPass;
if(traitOn){const covered=T[poss].ps.some(q=>q!==c&&!q.committed);const adjusted=trait.weights(c.id,U,{x,engaged,transition,hasRunner:!!runner,covered,support:ctx.support.length});Object.assign(U,adjusted.weights);}
if(goldenPressure){if(U.carry)U.carry*=4;if(U.shoot)U.shoot*=3;if(U.dribble)U.dribble*=1.5;if(U.pass)U.pass*=.55;if(U.shield)U.shield*=.65;}
const actions=Object.entries(U).map(([a,u])=>[a,Math.max(Q.floor,u)]),total=actions.reduce((s,a)=>s+a[1],0);let roll=R()*total,action=actions.at(-1)[0];for(const [a,u] of actions)if((roll-=u)<0){action=a;break;}
const zb=zone(),weights=Object.fromEntries(actions.map(([a,u])=>[a,rounded(u)]));
// T3-13 decision telemetry (PASSIVE: pure calculations, no RNG draws, no effect on the choice).
{const ball=S.world(zone(),poss),opp=T[1-poss].ps,ori=q=>S.oriented(q.pos,poss),freeCell=q=>!opp.some(o=>o.pos.x===q.pos.x&&o.pos.y===q.pos.y),
 space=q=>Math.min(2,...opp.filter(o=>o.oop===0).map(o=>S.dist(o.pos,q.pos))),
 ranked=mates.map(q=>({id:q.id,ahead:ori(q)-x,space:space(q),lane:S.passingDefenders(T,poss,c.pos,q.pos).length})).sort((a,b)=>(b.ahead+b.space-b.lane)-(a.ahead+a.space-a.lane)||(a.id<b.id?-1:1)),
 shotNow=x>=2?(()=>{const kind=!d?'one_v_one':x===3?'box':'edge',base=x===3?P.shot.box[lane===1?'C':'S']:P.shot.edge[lane===1?'C':'S'],quality=kind==='edge'?eff(c,'long'):eff(c,'shot'),link=lastLink&&lastLink.receiver===c.id&&tick-lastLink.tick<=2?lastLink.bonus:0,z=base+(quality-F.shotReference)/P.shot.q+(transition?P.shot.transition:0)+(d?P.shot.pressure:0)+(kind==='one_v_one'?F.clearShot:0)+link;return rounded(lim(logistic(z+(goalies?GKRules.logitShift(goalies[1-poss],kind):0)),F.shotMin,F.shotMax));})():null;
 const best=actions.reduce((m,a)=>a[1]>m[1]?a:m,actions[0]);
 pendingDecision={chosen:action,options:weights,chosenShare:rounded((U[action]===undefined?Q.floor:Math.max(Q.floor,U[action]))/total),mostLikely:best[0],engaged,committed:!!c.committed,x,
  situation:{shotNow,freeMatesAhead:mates.filter(q=>ori(q)>x&&freeCell(q)).map(q=>q.id),bestReceiver:ranked[0]?{...ranked[0]}:null,challenger:d?.id||null,scoreDiff:score[poss]-score[1-poss],clock:t}};}
if(action==='shoot')return shoot(!d?'one_v_one':x===3?'box':'edge');
if(action==='carry'){if(traitOn&&!c.committed&&T[poss].ps.some(q=>q!==c&&!q.committed)&&trait.traits(c.id).some(([name])=>name==='Libero'))c.committed=true;x=Math.min(3,x+1);lane=(lane+Math.floor(R()*3)+2)%3;t+=P.dt.dribble;tire(c,'sprint');c.pos=S.world(zone(),poss);emit({type:'carry',team:poss,actor:c.id,zone:zone(),from:zb,calc:{weights}});return;}
if(action==='dribble'||action==='wall'){const A=action==='wall'?(eff(c,'dribble')+eff(c,'pass'))/2:eff(c,'dribble'),r=duel(A,eff(d,'tackle'),P.b[action]+(transition?.3:0),ctx);t+=P.dt[action];tire(c,'duel');tire(d,'duel');const foulRoll=R(),foulP=r.win?P.foul*(1+T[1-poss].tac.engageHigh)*(1.25-d.c.tackle/100)*4:0,outcome=r.win&&foulRoll<foulP?'fouled':r.win?'attacker_wins':'defender_wins';emit({type:action==='wall'?'wall_pass':'dribble_duel',team:poss,actor:c.id,opp:d.id,p:r.p,roll:r.roll,zone:zb,outcome,calc:{...r.calc,weights}},ctx,true);
if(outcome==='fouled'){lastLink=null;emit({type:'foul',team:1-poss,actor:d.id,opp:c.id,zone:zb},ctx);if(x>=2){carrier=T[poss].ps.slice().sort((a,b)=>b.c.long-a.c.long)[0];carrier.pos=S.world(zone(),poss);emit({type:'free_kick',team:poss,actor:carrier.id,zone:zone()});shoot('fk');}return;}
if(r.win){d.oop=1;if(x<3)x++;c.pos=S.world(zone(),poss);return;}return turnover(d,'tackle','won_duel');}
if(action==='shield'){const r=duel(eff(d,'press'),eff(c,'escape'),P.b.press,null,false),counter=lastRegain&&lastRegain.team===poss&&tick-lastRegain.tick<=1&&S.dist(d.pos,c.pos)<=1;t+=P.dt.shield;tire(d,'press');emit({type:'press',team:1-poss,actor:d.id,opp:c.id,p:r.p,roll:r.roll,zone:zb,outcome:r.win?'ball_won':'press_beaten',tags:counter?['counter_press']:[],calc:{...r.calc,weights,sinceRegain:lastRegain?tick-lastRegain.tick:null,pressDistance:S.dist(d.pos,c.pos)},roles:{presser:d.id}},ctx);if(r.win)return turnover(d,'press_win','press');d.oop=1;return;}
if(['pass','through','outlet'].includes(action)){const passRoll=action==='pass'?R():null,receiver=action==='through'||action==='outlet'?runner:(traitOn?trait.receiver(c.id,mates,c,poss,S,T,passRoll):mates[Math.floor(passRoll*mates.length)]),to={x:S.oriented(receiver.pos,poss),lane:['left','centre','right'][receiver.pos.y]},pathDef=S.passingDefenders(T,poss,c.pos,receiver.pos),md=pathDef[0]||null,passCtx={...ctx,d:md,helper:pathDef[1]||null,defenders:pathDef.length,defenderIds:pathDef.map(q=>q.id),helpQ:pathDef[1]?Math.min(1,(pathDef[1].c.tackle+pathDef[1].c.intercept)/200*dpol.compactness):0};
const movement=(receiver.c.a.agi+receiver.c.a.pace)/2,pressure=engaged?Q.pressPenalty*lim(1-(c.c.escape-Q.pressEscapeReference)/Q.pressEscapeScale,0,1):0,bias=(action==='through'?P.b.through:action==='outlet'?P.b.pass+P.b.outlet-1.2:P.b.pass)+(to.x>x?Q.forwardPass:Q.recyclePass)+pressure,r=md?duel(.75*eff(c,'pass')+.25*movement,eff(md,'intercept'),bias,passCtx):{p:1,roll:R(),win:true,calc:{}};
t+=P.dt[action];tire(c,'pass');const crafted= r.win&&to.x>zb.x&&to.x>=2&&c.c.MID>=c.c.ATT-3&&c.c.MID>=c.c.DEF-3&&c.c.vision>=78?Math.min(.22,Math.max(0,(Math.min(c.c.vision,c.c.pass)-76)*.011)):0;emit({type:action==='through'||action==='outlet'?'through_ball':'pass',team:poss,actor:c.id,target:receiver.id,opp:md?.id||null,p:r.p,roll:r.roll,zone:zb,to,outcome:r.win?'complete':'intercepted',tags:action==='outlet'?['direct_outlet']:[],roles:{receiver:receiver.id},calc:{...r.calc,weights,wasTransition:transition,forwardDistance:to.x-x,creativeLink:rounded(crafted)}},passCtx,!!md);
if(r.win){lastPasser=c.id;lastLink=crafted>0?{passer:c.id,receiver:receiver.id,tick,bonus:crafted}:null;carrier=receiver;x=to.x;lane=receiver.pos.y;if(action!=='pass'&&md){const race=duel(.5*eff(receiver,'recover')+.5*receiver.c.dribble,eff(md,'recover'),.2);emit({type:'race',team:poss,actor:receiver.id,opp:md.id,p:race.p,roll:race.roll,outcome:race.win?'attacker_clear':'defender_recovers',calc:race.calc});if(race.win)md.oop=2;}
if(goalies&&(action==='through'||action==='outlet')&&x>=2){
 const keeper=goalies[1-poss],keeperStyle=GKRules.style(keeper),comeRoll=R(),come=comeRoll<keeperStyle.sweep;if(come){const roll=R(),sweep=GKRules.sweep(keeper,x,roll);
 emit({type:'gk_sweep',team:poss,actor:receiver.id,gk:keeper.id,zone:zone(),
   p:sweep.p,roll,outcome:sweep.cleared?'cleared':'beaten',
   calc:{sweeping:rounded(sweep.ability),decision:'come',style:keeper.keeperClass,comeP:keeperStyle.sweep,comeRoll}});
 if(sweep.cleared)return keeperRestart(1-poss,'keeper_sweep');
 keeperExposed={side:1-poss,until:tick+2};}
}
return;}return turnover(md,'interception','read_pass');}
}
restart(R()<.5?0:1,'kickoff');while(!over){
 if(mode==='timed'&&t>=P.timedSeconds)break;
 if(mode==='score'&&!regulationScore&&t>=P.timedSeconds){
   regulationScore=score.slice();regulationAt=t;
   if(score[0]!==score[1])break;
   suddenDeath=true;emit({type:'golden_goal_start',team:poss,actor:carrier.id,reason:'regulation_tied',score:score.slice(),zone:zone()});
   // Fair kickoff before Golden Goal: a team cannot carry an attack from regulation into sudden death.
   restart(R()<.5?0:1,'golden_kickoff');
 }
 if(suddenDeath&&!goldenPressure&&t>=P.timedSeconds+900){goldenPressure=true;emit({type:'golden_goal_pressure',team:poss,actor:carrier.id,reason:'prolonged_overtime_risk',zone:zone()});}
 step();if(t>P.maxSeconds&&!over)throw Error('Cage match safety limit: simulation exceeded 100 simulated minutes without a decision.');
}
const winner=score[0]>score[1]?0:score[1]>score[0]?1:-1;
return freeze({events,score,winner,duration:t,draws:R.count(),...(goalies?{keepers:keepers.slice(),keeperStats:Object.fromEntries(goalies.map(g=>[g.id,{saves:events.filter(e=>e.type==='gk_save'&&e.gk===g.id).length,parries:events.filter(e=>e.type==='gk_parry'&&e.gk===g.id).length,distributions:events.filter(e=>e.type==='gk_distribution'&&e.gk===g.id).length,completedDistributions:events.filter(e=>e.type==='gk_distribution'&&e.gk===g.id&&e.outcome==='complete').length,sweeps:events.filter(e=>e.type==='gk_sweep'&&e.gk===g.id&&e.outcome==='cleared').length,conceded:score[1-goalies.indexOf(g)]}]))}:{}),...(mode==='score'?{regulationSeconds:P.timedSeconds,regulationAt,regulationScore:regulationScore||score.slice(),decidedBy:suddenDeath?'golden_goal':'regulation'}:{}),shapes:T.map(team=>({duty:Object.fromEntries(team.ps.map(q=>[q.id,q.duty])),cover:team.shape.cover.map(rounded),policy:team.policy})),eventHash:hashEvents(events)});
}
function stats(res,teams){const s=teams.map(ids=>({team:{poss:0,shots:0,onTarget:0,passes:0,passesOk:0,dribblesOk:0,tackles:0,interceptions:0,blocks:0,goals:0},players:Object.fromEntries(ids.map(id=>[id,{shots:0,goals:0,passesOk:0,dribblesOk:0,tackles:0,interceptions:0,blocks:0,chancesCreated:0}]))}));let prev=0,poss=null;for(const e of res.events){if(poss!==null)s[poss].team.poss+=e.t-prev;prev=e.t;const t=s[e.team],p=t.players[e.actor];if(['restart','turnover','rebound'].includes(e.type))poss=e.team;if(['pass','through_ball'].includes(e.type)){t.team.passes++;if(e.outcome==='complete'){t.team.passesOk++;p.passesOk++;}else{s[1-e.team].team.interceptions++;s[1-e.team].players[e.opp].interceptions++;}}if(['dribble_duel','wall_pass'].includes(e.type)){if(e.outcome==='attacker_wins'){t.team.dribblesOk++;p.dribblesOk++;}else if(e.outcome==='defender_wins'){s[1-e.team].team.tackles++;s[1-e.team].players[e.opp].tackles++;}}if(e.type==='shot_attempt'){t.team.shots++;p.shots++;}if(['gk_save','gk_parry'].includes(e.type))t.team.onTarget++;if(e.type==='goal'){t.team.goals++;t.team.onTarget++;p.goals++;if(e.assist)t.players[e.assist].chancesCreated++;}if(e.type==='block'){t.team.blocks++;p.blocks++;}if(e.type==='press'&&e.outcome==='ball_won'){t.team.tackles++;p.tackles++;}}const total=s[0].team.poss+s[1].team.poss||1;s[0].team.poss=Math.round(100*s[0].team.poss/total);s[1].team.poss=100-s[0].team.poss;return s;}
window.CageEngine={VERSION:'cage-t3-13',PARAMS_VERSION:'t3-space-6',simulate,stats,ROSTER,BY_ID,comp,shape,TACTICS,P,freeze,hashEvents,probability,policy:(players,tactic)=>window.CagePolicy.derive(players,tactic,P,TACTICS),validateEvidence:window.CageEvidence.validate};
})();
