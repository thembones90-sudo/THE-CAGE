const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const before=read('docs/roster-audit-178.json'),mid=read('docs/roster-audit-178-current.json');
const r=read('proposals/roster-178-refinement-v1.4.json');
const b=read('docs/provisional-115-baseline.json'),over=read('proposals/tactical-refinement-overrides-v1.4.json');
const keys=['work_rate','stamina','composure','agility','marking'];
if(mid.total!==178||before.total!==178||b.length!==115||r.version!=='roster-refinement-v1.4')throw Error('Version/size mismatch');
const prior=new Map(before.players.map(p=>[p.id,p])),players=new Map(mid.players.map(p=>[p.id,p]));
for(const [id,change] of Object.entries(r.changes)){
 const p=players.get(id);if(!p||prior.get(id).careerTier)throw Error('Cannot refine owner-approved/unknown '+id);
 if(change.careerTier&&!['ACE','STALWART','ELITE','LEGEND','TITAN'].includes(change.careerTier))throw Error('Bad tier '+id);
 for(const badge of change.removeFolklore||[])if(!p.folklore.includes(badge))throw Error('Badge absent '+id+' '+badge);
}
const baselineIds=new Set(b.map(x=>x.id));
for(const id of Object.keys(over.overrides))if(!baselineIds.has(id))throw Error('Cannot modify approved tactical player '+id);
const outputs={},meta={};
for(const p of b){
 const patch=over.overrides[p.id]||{},old=p.attribute;
 if(Object.keys(old).length!==5)throw Error('Invalid base attributes '+p.id);
 const updated={...old,...patch};
 for(const [key,val] of Object.entries(patch))if(!keys.includes(key)||!Number.isInteger(val)||val<0||val>100)throw Error('Bad patch '+p.id+':'+key);
 outputs[p.id]=updated;
 meta[p.id]={previous:old,refined:updated,changed:Object.keys(patch).length>0};
}
const sorted=Object.keys(outputs).sort(),reviews={};
for(const id of sorted)reviews[id]=meta[id];
fs.writeFileSync(path.join(root,'proposals/tactical-115-reviewed-v1.4.json'),JSON.stringify({version:'tactical-115-v1.4',status:'editorial-reassessed-still-provisional',originalApprovedProfilesUntouched:63,profilesReviewed:115,profilesAdjusted:Object.keys(over.overrides).length,profilesRetained:115-Object.keys(over.overrides).length,players:reviews},null,2)+'\n');
const enc=x=>JSON.stringify(x).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
const classModule=[
'// THE CAGE V1.4: editorial refinement to unapproved career classifications only.',
'(()=>{\'use strict\';',
'const changes='+enc(r.changes)+';',
'const map=new Map(window.THE_CAGE_PLAYERS.map(p=>[p.id,p]));',
'for(const [id,c] of Object.entries(changes)){',
' const p=map.get(id);if(!p||p.classificationStatus!==\'editorial-reviewed-v1.3\')throw Error(\'Refusing to revise owner-approved player \'+id);',
' if(c.careerTier)p.careerTier=c.careerTier;',
' for(const badge of c.removeFolklore||[]){if(!p.folklore.includes(badge))throw Error(\'Missing folklore badge \'+id);p.folklore=p.folklore.filter(b=>b!==badge);}',
' p.classificationStatus=\'editorial-refined-v1.4\';',
'}',
'window.CAGE_ROSTER_VERSION=\'editorial-v1.4-178\';',
'})();'
].join('\n')+'\n';
const tacticalModule=[
'// THE CAGE V1.4: 115 reviewed tactical supplements. Still editorial/provisional; never touches approved 63.',
'window.CAGE_PROVISIONAL_REFINEMENTS='+enc(outputs)+';'
].join('\n')+'\n';
fs.writeFileSync(path.join(root,'src/roster-refinement.js'),classModule);
fs.writeFileSync(path.join(root,'src/tactical-refinement.js'),tacticalModule);
console.log('CREATED V1.4: '+Object.keys(r.changes).length+' metadata refinements; '+sorted.length+' provisional tactical profiles reviewed; '+Object.keys(over.overrides).length+' adjusted; 63 approved protected.');
