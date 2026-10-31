// THE CAGE: experimental decision-only trait layer. Opt-in via simulate({traits:{enabled:true}}).
// No strength, stamina, duel/shot probability, or outcome modifiers.
(()=>{'use strict';
const CATALOG=Object.freeze(['Wall','Enforcer','Anticipator','Hunter','Libero','Maestro','Architect','Destroyer','Engine','Surgeon','Predator','Magician','Executioner','Phantom','Juggernaut']);
const COUNTERPLAY=Object.freeze({
Wall:'Recycle or pass around a defender who holds the box instead of chasing',
Enforcer:'Use quick passes to exploit front-foot challenges and foul risk',
Anticipator:'Change passing lanes; bait the read before releasing',
Hunter:'Switch play or use wall passes behind an active pursuer',
Libero:'Counter into space vacated by a defender advancing with cover',
Maestro:'Press short passing lanes or force low-value recycling',
Architect:'Screen progressive passes and close the forward outlet',
Destroyer:'Evade the high challenge and exploit space behind the ball-winner',
Engine:'Make the runner work through repeated changes of direction',
Surgeon:'Close the passing channel to the free or advanced teammate',
Predator:'Drop deeper, deny the run and make them receive to feet',
Magician:'Double up without diving into isolated dribbles',
Executioner:'Keep them away from the highest-value shooting position',
Phantom:'Mark the blind-side receiving lane, not just the ball carrier',
Juggernaut:'Deny a direct physical route; channel play sideways'
});
const roster=new Map(window.THE_CAGE_PLAYERS.map(p=>[p.id,p]));
const traits=id=>{const t=roster.get(id)?.traits;if(!t)return [];return [[t.primary,1],[t.secondary,.5]].filter(([name])=>CATALOG.includes(name));};
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function weights(id,original,s){
const U={...original},active=[];const mult=(name,action,factor)=>{if(Object.hasOwn(U,action)&&Number.isFinite(U[action])){U[action]*=factor;active.push(name);}};
for(const [name,strength] of traits(id)){
const boost=(action,n=.32)=>mult(name,action,1+strength*n);
const soften=(action,n=.24)=>mult(name,action,1-strength*n);
switch(name){
case 'Libero': if(!s.engaged&&s.x<2&&s.covered){boost('carry',.46);boost('pass',.12);}break;
case 'Maestro': if(s.x<=2){boost('pass',.45);soften('shoot',.26);}else if(s.engaged)boost('pass',.28);break;
case 'Architect': if(s.hasRunner&&s.x>=1){boost('through',.56);boost('outlet',.35);}else boost('pass',.25);break;
case 'Engine': if(!s.engaged&&s.x<3)boost('carry',.44);else if(s.engaged)boost('pass',.2);break;
case 'Surgeon': if(s.hasRunner&&s.x>=1){boost('through',.5);boost('wall',.17);}else if(s.engaged)boost('pass',.2);break;
case 'Predator': if(s.x===3)boost('shoot',.38);else if(s.hasRunner)boost('through',.3);break;
case 'Magician': if(s.engaged){boost('dribble',.56);boost('wall',.29);}else boost('carry',.22);break;
case 'Executioner': if(s.x===3){boost('shoot',.55);soften('pass',.15);}else if(s.x===2&&!s.engaged)boost('shoot',.22);break;
case 'Phantom': if(!s.engaged&&s.x<3)boost('carry',.33);else if(s.engaged)boost('wall',.24);break;
case 'Juggernaut': if(s.engaged){boost('shield',.48);boost('wall',.18);}else if(s.transition)boost('carry',.32);break;
case 'Enforcer': case 'Anticipator': case 'Hunter': case 'Wall': case 'Destroyer':break;
}}
return {weights:U,active:[...new Set(active)]};
}
// An engagement is a tactical choice. Winning the resulting duel is still determined solely by base abilities.
function engagement(id,base,s){
let amount=base;
for(const [name,strength] of traits(id)){
switch(name){
case 'Wall': if(s.x===2)amount-=.16*strength;break;
case 'Enforcer': if(s.x>=1)amount+=.18*strength;break;
case 'Anticipator': if(s.x>=1&&s.x<=2)amount-=.13*strength;break;
case 'Hunter': if(s.transition||s.x>=1)amount+=.14*strength;break;
case 'Destroyer': if(s.x<=2)amount+=.22*strength;break;
case 'Engine': if(s.x<=2)amount+=.07*strength;break;
}}
return clamp(amount,0,s.x===3?1:.95);
}
// A different recipient is a decision, not a guaranteed pass or higher pass probability.
function receiver(actorId,mates,actor,side,spatial,teams,u){
const creator=traits(actorId),wantsChannel=creator.some(([n])=>['Surgeon','Architect','Maestro'].includes(n));
const available=mates.map((q,i)=>{
const ahead=spatial.oriented(q.pos,side)-spatial.oriented(actor.pos,side);
const covered=spatial.passingDefenders(teams,side,actor.pos,q.pos).length;
const target=traits(q.id),phantom=target.some(([n])=>n==='Phantom'),predator=target.some(([n])=>n==='Predator');
let score=0;
if(wantsChannel)score+=Math.max(-2,ahead)*1.5-covered*2.5;
if(phantom)score+=covered===0?3:-1;
if(predator)score+=ahead>0?2:-1;
return {q,i,score};
});
if(!wantsChannel&&!available.some(q=>q.score!==0))return mates[Math.floor(u*mates.length)];
// The original single receiver draw is reused; target weights only remap the same draw.
const weights=available.map(q=>Math.max(.3,1+q.score*.35)),total=weights.reduce((a,b)=>a+b,0);let roll=u*total;
for(let i=0;i<available.length;i++)if((roll-=weights[i])<0)return available[i].q;
return available.at(-1).q;
}
window.CageTraits=Object.freeze({VERSION:'traits-preview-0.2',CATALOG,COUNTERPLAY,traits,weights,engagement,receiver});
})();
