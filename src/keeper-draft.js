// The keeper-only draft machine; completely separate from the 15-card outfield draft.
(function(root,factory){const api=factory();root.CageKeeperDraft=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const CLOCK_MS=10000,OFFER_COUNT=5;
function sample(all,excluded,rng){const eligible=all.filter(p=>!excluded.has(p.id));if(eligible.length<OFFER_COUNT)throw Error('Not enough fresh goalkeepers for a five-card offer');const cards=eligible.slice();for(let i=0;i<OFFER_COUNT;i++){const j=i+Math.floor(Math.min(.999999999,Math.max(0,rng()))*(cards.length-i));[cards[i],cards[j]]=[cards[j],cards[i]];}return cards.slice(0,OFFER_COUNT).map(x=>x.id);}
function create(players,usedIds=[],rng=Math.random){
 const ids=new Set(players.map(g=>g.id));if(ids.size!==players.length||players.length<18)throw Error('Goalkeeper pool requires at least 18 unique identities');
 const exhausted=new Set(usedIds);if([...exhausted].some(id=>!ids.has(id)))throw Error('Unknown exhausted keeper');
 let stage='pending',currentOffer=[],firstOffer=[],deadline=0,picks={A:null,B:null};
 function snapshot(){return {stage,offer:currentOffer.slice(),firstOffer:firstOffer.slice(),deadline,picks:{...picks}};}
 function restore(s){
  if(!s||!['pending','pickingA','handoffB','pickingB','complete'].includes(s.stage)||!Array.isArray(s.offer)||!Array.isArray(s.firstOffer)||!s.picks||!['A','B'].every(side=>s.picks[side]===null||ids.has(s.picks[side]))||!Number.isFinite(s.deadline)||s.deadline<0)throw Error('Invalid saved keeper draft');
  const unique=a=>new Set(a).size===a.length&&a.every(id=>ids.has(id));
  if(!unique(s.offer)||!unique(s.firstOffer))throw Error('Keeper offer has duplicates or unknown identities');
  const [a,b]=[s.picks.A,s.picks.B],offer=s.offer,first=s.firstOffer;
  if(a&&a===b)throw Error('Duplicate keeper picks in saved state');
  if(a&&!exhausted.has(a)||b&&!exhausted.has(b))throw Error('Selected keeper not in saved exhaustion pool');
  if(s.stage==='pending'&&!(offer.length===0&&first.length===0&&!a&&!b&&s.deadline===0))throw Error('Invalid pending keeper state');
  if(s.stage==='pickingA'&&!(offer.length===5&&first.length===5&&offer.every((id,i)=>id===first[i])&&!a&&!b&&s.deadline>0))throw Error('Invalid first keeper offer state');
  if(s.stage==='handoffB'&&!(offer.length===0&&first.length===5&&a&&first.includes(a)&&!b&&s.deadline===0))throw Error('Invalid GK handoff state');
  if(s.stage==='pickingB'&&!(offer.length===5&&first.length===5&&offer.every(id=>!first.includes(id))&&a&&first.includes(a)&&!b&&s.deadline>0))throw Error('Invalid second keeper offer state');
  if(s.stage==='complete'&&!(offer.length===0&&first.length===5&&a&&first.includes(a)&&b&&s.deadline===0))throw Error('Invalid completed keeper draft');
  if(offer.some(id=>exhausted.has(id))||first.some(id=>exhausted.has(id)&&id!==a))throw Error('GK offer reuses exhausted keeper');
  stage=s.stage;currentOffer=offer.slice();firstOffer=first.slice();deadline=s.deadline;picks={A:a,B:b};return snapshot();
 }
 function reveal(now=Date.now()){if(stage!=='pending'&&stage!=='handoffB')throw Error('GK handoff phase invalid');
  const side=stage==='pending'?'A':'B';const except=new Set([...exhausted,...(side==='B'?firstOffer:[])]);
  currentOffer=sample(players,except,rng);if(side==='A')firstOffer=currentOffer.slice();
  stage=side==='A'?'pickingA':'pickingB';deadline=now+CLOCK_MS;return {side,offer:currentOffer.slice(),deadline};}
 function pick(id,now=Date.now()){if(stage!=='pickingA'&&stage!=='pickingB')throw Error('GK phase has no active offer');
  const side=stage==='pickingA'?'A':'B';let automatic=false;
  if(now>=deadline){id=currentOffer[Math.floor(Math.min(.999999999,Math.max(0,rng()))*currentOffer.length)];automatic=true;}
  if(!currentOffer.includes(id)||exhausted.has(id))throw Error('Goalkeeper must come from this private five-card offer');
  picks[side]=id;exhausted.add(id);currentOffer=[];deadline=0;stage=side==='A'?'handoffB':'complete';
  return {side,id,automatic,complete:stage==='complete'};}
 return Object.freeze({get stage(){return stage;},get complete(){return stage==='complete';},get picks(){return {...picks};},get deadline(){return deadline;},get offer(){return currentOffer.slice();},snapshot,restore,reveal,pick});
}
return Object.freeze({CLOCK_MS,OFFER_COUNT,sample,create});
});
