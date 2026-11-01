/* Collectible card presentation only. Player records and draft rules remain authoritative. */
(()=>{'use strict';
const DRAFT_TRAIT_ICONS=Object.freeze({"Wall":"M4 9h24v16H4z M4 15h24 M4 20h24 M12 9v6 M20 15v5 M12 20v5","Enforcer":"M7 18l4-8 5 3 4-7 5 4 3 9-5 7H11z M12 21h13","Anticipator":"M3 16c6-9 20-9 26 0-6 9-20 9-26 0z M16 11a5 5 0 1 0 0 10a5 5 0 0 0 0-10","Tracker":"M9 5l4 8-5 8-5-8z M23 11l4 8-5 8-5-8z","Libero":"M16 3l12 5v10c0 6-7 10-12 12C11 28 4 24 4 18V8z M9 18l6-6 7 7","Maestro":"M5 24l21-17 M9 9l15 17 M19 6l8 6","Architect":"M4 26h24L16 5z M12 20l4-7 4 7z","Destroyer":"M16 4l3 8 9-2-5 7 5 7-9-2-3 8-3-8-9 2 5-7-5-7 9 2z","Engine":"M13 4h6l2 5 5-1 3 6-5 4 2 5-5 5-5-4-5 4-5-5 2-5-5-4 3-6 5 1z M16 12a4 4 0 1 0 0 8a4 4 0 0 0 0-8","Surgeon":"M4 16h24 M16 4v24 M7 7l18 18 M25 7L7 25 M16 10a6 6 0 1 0 0 12a6 6 0 0 0 0-12","Predator":"M5 6l6 17 5-13 5 13 6-17 M7 25h20","Magician":"M16 2l3 10 10 4-10 4-3 10-4-10-10-4 10-4z","Executioner":"M16 3a13 13 0 1 0 0 26a13 13 0 0 0 0-26 M16 9a7 7 0 1 0 0 14a7 7 0 0 0 0-14 M16 2v28 M2 16h28","Phantom":"M8 27V12C8 2 24 2 24 12v15l-5-4-4 4-4-4z M12 14h2m5 0h2","Juggernaut":"M5 24l7-18 4 9 4-9 7 18-5 5H10z M11 24h10"});
function draftTraitIcon(trait){const path=DRAFT_TRAIT_ICONS[trait]||(trait==='Hunter'?DRAFT_TRAIT_ICONS.Tracker:null);if(!path)return null;
 const icon=document.createElement('span');icon.className='draft-trait-icon';
 icon.innerHTML='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="'+path+'"/></svg>';
 return icon;}

function create(p,actions={}){const id=p.id,card=document.createElement('button'),wrap=document.createElement('div');wrap.className='draft-card-wrap';const family=/^(D|DEF)/i.test(p.role||'')?'def':/^(M|MID)/i.test(p.role||'')?'mid':'att';wrap.dataset.family=family;wrap.classList.add('tier-'+String(p.careerTier||p.tier||'').toLowerCase().replace(/[^a-z]/g,''));card.className='card';card.type='button';const title=document.createElement('div');title.className='name';title.textContent=p.name;const meta=document.createElement('div');meta.className='meta';meta.textContent=[p.country,p.careerTier||p.tier].filter(Boolean).join(' • ');
const role=document.createElement('div');role.className='draft-role';role.textContent=p.position||p.role||'PLAYER';
const icons={
def:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 16h12l8 13h10l5 7H9l-6-7 8-7z" fill="#12435c" stroke="#67d2fc" stroke-width="2.5" stroke-linejoin="round"/><circle cx="37" cy="16" r="7" fill="none" stroke="#b3e8ff" stroke-width="2"/><path d="M33 10l8 12M31 20l11-7M28 25l-7 2" stroke="#67d2fc" stroke-width="2"/></svg>',
mid:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 7L6 37h36z" fill="#55410d" stroke="#f7d457" stroke-width="2.5"/><circle cx="24" cy="7" r="5" fill="#f7d457"/><circle cx="6" cy="37" r="5" fill="#f7d457"/><circle cx="42" cy="37" r="5" fill="#f7d457"/><path d="M16 27l6-9m9 13l7 2" stroke="#fff0a2" stroke-width="2.5"/></svg>',
att:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M25 7h20v32H25M29 7v32m8-32v32M25 18h20m-20 10h20" fill="none" stroke="#e2646c" stroke-width="2"/><path d="M4 38L24 18M7 25l13-7" stroke="#ff9992" stroke-width="3"/><circle cx="29" cy="14" r="6" fill="#f8b0a9" stroke="#e9474c" stroke-width="2"/></svg>'};
const icon=document.createElement('span');icon.className='draft-position-icon';icon.innerHTML=icons[family];role.prepend(icon);
const stats=document.createElement('div');stats.className='stats';const r=p.r||{};
for(const [key,label] of [['pace','PAC'],['tech','TEC'],['pass','PAS'],['finish','FIN'],['def','DEF'],['phys','PHY']]){
 const v=Number(r[key]||0),item=document.createElement('div');item.className='draft-stat';
 const labelEl=document.createElement('span');labelEl.textContent=label;
 const bar=document.createElement('span');bar.className='draft-stat-track';
 const fill=document.createElement('span');fill.className='draft-stat-fill';fill.style.width=Math.max(0,Math.min(100,v))+'%';bar.append(fill);
 const num=document.createElement('b');num.textContent=String(v);item.append(labelEl,bar,num);stats.append(item);
}
const heading=document.createElement('div');heading.className='card-head';const badge=document.createElement('div');badge.className='card-ovr';badge.setAttribute('aria-label','Overall rating '+window.CageOverall.read(p));badge.textContent=window.CageOverall.read(p);const small=document.createElement('small');small.textContent='OVR';badge.append(small);heading.append(title,badge);const tierTag=document.createElement('span');tierTag.className='draft-tier';tierTag.textContent=p.careerTier||p.tier||'UNRATED';card.append(heading,tierTag,role,meta,stats);
const folklore=Array.isArray(p.folklore)?p.folklore:[];
if(folklore.length){const specials=document.createElement('div');specials.className='draft-folklore';
 for(const raw of folklore){const tag=String(raw).trim(),chip=document.createElement('span');
 chip.className='draft-special special-'+tag.toLowerCase().replace(/[^a-z]+/g,'-');
 if(tag==='TALISMAN')chip.innerHTML='<svg viewBox="0 0 36 32" aria-hidden="true"><path d="M18 28L5 15C-1 8 7-1 15 6l3 3 3-3C29-1 37 8 31 15Z" fill="#e4b848" stroke="#f6d875" stroke-width="1.5"/><polyline points="5,16 11,16 14,11 17,21 20,14 23,16 31,16" stroke="#fff7c1" stroke-width="1.8" fill="none"/></svg>';
 if(tag==='UNDERDOG')chip.innerHTML='<svg viewBox="0 0 36 32" aria-hidden="true"><path d="M5 7l6 8 7-6 7 6 6-8-4 19H9Z" fill="none" stroke="#eec270" stroke-width="2"/><path d="M17 2l4 11-7 7 10 9" stroke="#f4df9c" stroke-width="2.5" fill="none"/></svg>';
 chip.append(document.createTextNode(tag.replace('STREET ','ST. ')));chip.title=tag;specials.append(chip);}
 card.append(specials);}
const traits=p.traits;if(traits){const t=document.createElement('div');t.className='draft-traits';for(const trait of [traits.primary,traits.secondary].filter(Boolean)){const chip=document.createElement('span');chip.textContent=trait;const glyph=draftTraitIcon(trait);if(glyph)chip.prepend(glyph);chip.classList.add(['Wall','Enforcer','Anticipator','Hunter','Tracker','Libero'].includes(trait)?'trait-def':['Maestro','Architect','Destroyer','Engine','Surgeon'].includes(trait)?'trait-mid':'trait-att');t.append(chip);}card.append(t);}const cls=p.playerClass||p.class||p.archetype;if(cls){const c=document.createElement('div');c.className='meta';c.textContent='CLASS: '+cls;card.append(c);}const more=document.createElement('details');more.className='draft-scout';const summary=document.createElement('summary');summary.textContent='Full scouting';const full=document.createElement('div');full.className='stats';full.textContent=Object.entries(r).map(([k,v])=>k.replaceAll('_',' ')+' '+v).join(' · ');more.append(summary,full);const strengths=p.strengths||p.weaknesses;if(strengths){const extra=document.createElement('p');extra.className='meta';extra.textContent=(p.strengths?'Strengths: '+String(p.strengths)+' ':'')+(p.weaknesses?'Weaknesses: '+String(p.weaknesses):'');more.append(extra);}card.setAttribute('aria-label','Draft '+p.name+', '+(p.position||p.role||'player')+', overall '+window.CageOverall.read(p));card.addEventListener('click',()=>actions.claim?.(id));const scout=document.createElement('button');scout.type='button';scout.className='war-scout-btn';scout.textContent='SCOUT / COMPARE';scout.setAttribute('aria-label','Scout '+p.name+' in War Room');scout.addEventListener('click',()=>actions.scout?.(p));wrap.append(card,more,scout);decorate(wrap,p);return wrap;}
function decorate(wrap,p){
 const card=wrap.querySelector('.card'),heading=card.querySelector('.card-head'),name=heading.querySelector('.name'),ovr=heading.querySelector('.card-ovr'),tier=card.querySelector('.draft-tier'),role=card.querySelector('.draft-role'),meta=card.querySelector('.meta');
 wrap.classList.add('sticker-card');wrap.dataset.player=p.id;wrap.dataset.tier=p.careerTier||p.tier||'UNRATED';wrap.dataset.style=p.traits?.primary||'Footballer';
 const mast=document.createElement('div');mast.className='sticker-mast';mast.append(tier,ovr);
 const art=document.createElement('div');art.className='sticker-art';art.setAttribute('aria-hidden','true');
 art.innerHTML='<svg class="sticker-shirt" viewBox="0 0 180 150" fill="none"><path class="shirt-shadow" d="M47 29L69 17Q90 29 111 17L133 29L162 58L140 79L126 64V138H54V64L40 79L18 58Z"/><path class="shirt-body" d="M47 22L69 10Q90 22 111 10L133 22L157 50L138 69L124 56V130H56V56L42 69L23 50Z"/><path class="shirt-panel" d="M77 19Q90 23 103 19V130H77Z"/><path class="shirt-seam" d="M69 10Q90 47 111 10M47 22L56 56M133 22L124 56M57 119H123M28 46L46 63M134 63L152 46"/></svg>';
 const emblem=document.createElement('span');emblem.className='sticker-emblem';const glyph=draftTraitIcon(p.traits?.primary);if(glyph)emblem.append(glyph);else emblem.textContent=p.position||p.role||'';art.append(emblem);
 const seal=document.createElement('span');seal.className='sticker-seal';seal.textContent='THE CAGE';art.append(seal);
 const identity=document.createElement('div');identity.className='sticker-identity';meta.textContent=p.country||'';identity.append(role,meta);
 const nameplate=document.createElement('div');nameplate.className='sticker-nameplate';nameplate.append(name);
 const style=document.createElement('span');style.className='sticker-style';style.textContent=p.traits?.primary||p.position||'FOOTBALLER';nameplate.append(style);
 heading.remove();card.prepend(mast,art,identity,nameplate);
 const footer=document.createElement('span');footer.className='sticker-pick';footer.textContent='DRAFT PLAYER';card.append(footer);
}
window.CageDraftCards=Object.freeze({create});
})();
