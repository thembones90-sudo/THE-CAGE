// THE CAGE V6.7 goalkeeper card view. Presentation only; no picks, hints, or game RNG.
(function(root,factory){const api=factory();root.CageKeeperCards=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const STATS=Object.freeze([['reflexes','REF'],['positioning','POS'],['handling','HAN'],['oneOnOne','1V1'],['aerialControl','AIR'],['distribution','DIS'],['sweeping','SWP']]);
const ROLES=Object.freeze({'REFLEX MONSTER':'SHOT STOPPER','SWEEPER KEEPER':'HIGH LINE','COMMANDER':'PENALTY AREA LEADER','GUARDIAN':'SAFE HANDS','DISTRIBUTOR':'BUILD FROM THE BACK'});
function make(player,choose,doc){if(!player||typeof choose!=='function')throw Error('Goalkeeper card requires keeper and choose callback');
 const document_=doc||(typeof document!=='undefined'?document:null);if(!document_)throw Error('No document available to build GK card');
 const add=(parent,tag,cls,text)=>{const el=document_.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);parent.appendChild(el);return el;};
 const btn=document_.createElement('button');btn.type='button';btn.className='gk-choice';btn.dataset.tier=player.careerTier;btn.dataset.gkId=player.id;
 const head=add(btn,'span','gk-card-header');const identification=add(head,'span','gk-identification');
 add(identification,'span','gk-tier',player.careerTier);add(identification,'strong','gk-name',player.name);
 const rate=add(head,'span','gk-ovr',player.overall);rate.setAttribute('aria-label','Overall '+player.overall);
 add(btn,'span','gk-class',player.keeperClass);add(btn,'span','gk-specialty',ROLES[player.keeperClass]||'GOALKEEPER');
 const stat=add(btn,'span','gk-stats-grid');
 for(const [key,label] of STATS){const cell=add(stat,'span','gk-attribute');add(cell,'span','gk-label',label);add(cell,'span','gk-number',player.r[key]);}
 btn.setAttribute('aria-label',player.name+', '+player.careerTier+', '+player.keeperClass+', '+player.overall+' overall. '+STATS.map(([key,label])=>label+' '+player.r[key]).join(', ')+'. Select goalkeeper.');
 btn.addEventListener('click',()=>choose(player.id));return btn;
}
return Object.freeze({STATS,ROLES,make});
});
