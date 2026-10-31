// THE CAGE V1.4: preserve prior approvals and verify all 115 provisional tactical reviews.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f));
const before=json('docs/roster-audit-178-current.json'),old=json('docs/roster-audit-178.json');
const baseline=json('docs/provisional-115-baseline.json'),review=json('proposals/tactical-115-reviewed-v1.4.json');
const change=json('proposals/roster-178-refinement-v1.4.json');
const ownerElite=new Set(JSON.parse(read('proposals/owner-tier-revisions-10-v17.json')).players.map(p=>p.id));
const html=read('index.html'),ctx={window:{location:{search:'?engine=t3'}}};vm.createContext(ctx);
for(const m of html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)){if(m[1]==='src/cage-commentary.js')break;vm.runInContext(read(m[1]),ctx,{filename:m[1]});}
const w=ctx.window,roster=w.THE_CAGE_PLAYERS,byId=new Map(roster.map(p=>[p.id,p]));
assert.equal(roster.length,184);assert.equal(byId.size,184);
assert(html.includes('src/roster-refinement.js')&&html.includes('src/tactical-refinement.js'));
assert(w.CAGE_ROSTER_VERSION.includes('184'));
const prior=new Map(before.players.map(p=>[p.id,p])),initial=new Map(old.players.map(p=>[p.id,p]));
const adjusted=new Set(Object.keys(json('proposals/tactical-refinement-overrides-v1.4.json').overrides));
const originalApproved=json('proposals/ratings-v1.json').players;
let owner=0,editorial=0,approvedProfiles=0;
for(const p of roster.filter(v=>prior.has(v.id))){
 const was=prior.get(p.id),locked=initial.get(p.id);
 assert(was&&locked,'not in prior roster '+p.id);
 assert.equal(p.position,was.position,'position modified '+p.id);
 assert.deepEqual(JSON.parse(JSON.stringify(p.r)),was.r,'prime ratings changed '+p.id);
 assert.deepEqual(JSON.parse(JSON.stringify(p.traits)),was.traits,'trait changed '+p.id);
 if(locked.careerTier){
  owner++;
  assert.equal(p.careerTier,ownerElite.has(p.id)?'ELITE':locked.careerTier,'approved tier overwritten without newer owner decision '+p.id);
  assert.deepEqual(Array.from(p.folklore),locked.folklore,'approved badge overwritten '+p.id);
 }else{
  editorial++;
  if(change.changes[p.id]){
   const ch=change.changes[p.id];
   assert.equal(p.classificationStatus,'editorial-refined-v1.4','refined status '+p.id);
   if(ch.careerTier)assert.equal(p.careerTier,ch.careerTier,'tier refinement '+p.id);
   if(ch.removeFolklore)for(const b of ch.removeFolklore)assert(!p.folklore.includes(b),'badge not removed '+p.id);
  }else{
   assert.equal(p.careerTier,ownerElite.has(p.id)?'ELITE':was.careerTier,'unrequested tier changed '+p.id);
   assert.deepEqual(Array.from(p.folklore),was.folklore,'unrequested badges changed '+p.id);
  }
 }
 if(!p.attributesProvisional){approvedProfiles++;assert(originalApproved[p.id],'approved attribute not in baseline '+p.id);
  const a=originalApproved[p.id];for(const k of ['work_rate','stamina','composure','agility','marking'])assert.equal(p.attributes[k],a[k],'approved attribute modified '+p.id+' '+k);
 }
}
assert.equal(owner,40);assert.equal(editorial,138);assert.equal(approvedProfiles,63);
assert.equal(baseline.length,115);assert.equal(review.profilesReviewed,115);assert.equal(review.profilesAdjusted,65);assert.equal(review.profilesRetained,50);
for(const p of baseline){
 const current=byId.get(p.id);assert(current.attributesProvisional,'provisional flag lost '+p.id);
 assert.deepEqual(JSON.parse(JSON.stringify(current.attributes)),review.players[p.id].refined,'invalid reviewed five: '+p.id);
 const oldAttrib=p.attribute;
 assert.equal(adjusted.has(p.id),review.players[p.id].changed,'review status mismatch '+p.id);
 if(!adjusted.has(p.id))assert.deepEqual(JSON.parse(JSON.stringify(current.attributes)),oldAttrib,'unexpected changed attributes '+p.id);
}
assert.equal(byId.get('sergio-busquets').careerTier,'LEGEND','owner correction: Busquets is LEGEND');
assert.equal(byId.get('gareth-bale').careerTier,'LEGEND','owner correction: Bale is LEGEND');
assert.equal(byId.get('wayne-rooney').careerTier,'TITAN');
assert.equal(byId.get('alessandro-del-piero').careerTier,'LEGEND');
assert.equal(byId.get('yannick-bolasie').careerTier,'STALWART');
assert.equal(byId.get('alessandro-nesta').attributes.composure,94);
assert.equal(byId.get('fabio-cannavaro').attributes.composure,92);
assert.equal(byId.get('mohamed-salah').attributes.work_rate,89);
assert.equal(byId.get('samuel-etoo').attributes.work_rate,91);
const E=w.CageEngine;assert(E.VERSION.startsWith('cage-t3'));
for(const seed of [6,21,46]){
 const input={teams:[['sergio-busquets','gareth-bale','wayne-rooney'],['mohamed-salah','alessandro-nesta','samuel-etoo']],tactics:['balanced','press'],seed,mode:'ko',traits:{enabled:true}};
 const a=E.simulate(input),b=E.simulate(input);
 assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),'deterministic T3 traits '+seed);
}
console.log('PASS V1.4: 184 tiers; 40 owner locks intact; 63 approved tactical profiles unchanged; 115 reviewed, 65 adjusted; 3 trait-enabled deterministic T3 games.');
