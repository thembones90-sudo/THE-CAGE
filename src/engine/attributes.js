(()=>{'use strict';
const data=window.CAGE_APPROVED_RATINGS;
if(data&&window.CAGE_ROSTER_EXTRA_RATINGS)for(const [id,extra] of Object.entries(window.CAGE_ROSTER_EXTRA_RATINGS)){if(data.players[id])throw Error('Duplicate supplemental ratings: '+id);data.players[id]=extra;}
if(!data||data.version!=='ratings-v1.1')throw Error('Approved ratings v1.1 are required.');
const keys=['work_rate','stamina','composure','agility','marking'];
// V1.4 editorial reassessment applies only to profiles already flagged provisional.
const refinements=window.CAGE_PROVISIONAL_REFINEMENTS||{};
if(Object.keys(refinements).length&&Object.keys(refinements).length!==115)throw Error('Expected 115 provisional reviews');
for(const [id,review] of Object.entries(refinements)){
 const previous=data.players[id];
 if(!previous||!String(previous.rationale||'').startsWith('Provisional'))throw Error('Refusing to overwrite approved tactical attributes: '+id);
 if(keys.some(k=>!Number.isInteger(review[k])||review[k]<0||review[k]>100)||Object.keys(review).length!==5)throw Error('Invalid V1.4 tactical review: '+id);
 data.players[id]={...previous,...review,rationale:'Provisional editorial reassessment v1.4; not individually owner-approved.'};
}
for(const p of window.THE_CAGE_PLAYERS){const a=data.players[p.id];if(!a||keys.some(k=>!Number.isFinite(a[k])||a[k]<0||a[k]>100))throw Error('Missing or invalid approved attributes for '+p.id);p.attributes=Object.freeze(Object.fromEntries(keys.map(k=>[k,a[k]])));p.ratingsVersion=data.version;p.attributesProvisional=String(a.rationale||'').startsWith('Provisional');}
window.CAGE_ROSTER_VERSION='editorial-v1.4-'+window.THE_CAGE_PLAYERS.length+'+ratings-v1.1-provisional';
function read(p){if(!p.attributes||p.ratingsVersion!==data.version)throw Error('Unapproved attributes for '+p.id);const r=p.r,a=p.attributes;return {pace:r.pace,tech:r.tech,pass:r.pass,finish:r.finish,def:r.def,phys:r.phys,wr:a.work_rate,sta:a.stamina,com:a.composure,agi:a.agility,mrk:a.marking};}
window.CageAttributes={read,version:data.version,registry:Object.freeze({work_rate:['press','intercept','policy.pressTrigger','policy.commitForward'],stamina:['fatigueCost','policy.pressTrigger'],composure:['escape','pass','shot','pressureCost'],agility:['dribble','tackle','movement'],marking:['intercept','helpDefence','shotBlock']})};
})();
