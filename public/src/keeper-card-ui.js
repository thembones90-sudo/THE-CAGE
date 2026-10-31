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
 const rank=(typeof window!=='undefined'?window.CageGoalkeepers?.RANK_BY_ID?.[player.id]:null);
 if(rank)add(btn,'span','gk-world-rank','GK ROSTER RANK #'+rank);
 const folklore=Array.isArray(player.folklore)?player.folklore:[];
 if(folklore.length){const group=add(btn,'span','gk-folklore');
   for(const tag of folklore){const chip=add(group,'span','gk-special special-'+tag.toLowerCase().replace(/[^a-z]+/g,'-'),tag.replace('STREET ','ST. '));
     chip.title=tag;
     if(tag==='TALISMAN'){
       const NS='http://www.w3.org/2000/svg',svg=document_.createElementNS(NS,'svg');
       svg.setAttribute('viewBox','0 0 36 32');svg.setAttribute('aria-hidden','true');
       const heart=document_.createElementNS(NS,'path');
       heart.setAttribute('d','M18 28L5 15C-1 8 7-1 15 6l3 3 3-3C29-1 37 8 31 15Z');heart.setAttribute('fill','#e4b848');heart.setAttribute('stroke','#f6d875');heart.setAttribute('stroke-width','1.5');
       const line=document_.createElementNS(NS,'polyline');
       line.setAttribute('points','5,16 11,16 14,11 17,21 20,14 23,16 31,16');line.setAttribute('stroke','#fff7c1');line.setAttribute('stroke-width','1.8');line.setAttribute('fill','none');
       svg.append(heart,line);chip.prepend(svg);
     }
   }
 }
 const stat=add(btn,'span','gk-stats-grid');
 for(const [key,label] of STATS){const cell=add(stat,'span','gk-attribute');add(cell,'span','gk-label',label);add(cell,'span','gk-number',player.r[key]);}
 btn.setAttribute('aria-label',player.name+', '+player.careerTier+', '+player.keeperClass+', '+player.overall+' overall. '+STATS.map(([key,label])=>label+' '+player.r[key]).join(', ')+(folklore.length?'. Special labels: '+folklore.join(', '):'')+'. Select goalkeeper.');
 btn.addEventListener('click',()=>choose(player.id));return btn;
}
return Object.freeze({STATS,ROLES,make});
});
