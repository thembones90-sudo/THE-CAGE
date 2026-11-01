// Owner acceptance: all 67 ELITE OVRs must be derived from adjusted prime stats.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const spec=JSON.parse(read('proposals/ELITE_OVR_67_APPROVED.json'));
const draft=JSON.parse(read('proposals/ELITE_OVR_67_REVIEW_DRAFT.json'));
assert.equal(spec.status,'OWNER-ACCEPTED');
assert.equal(spec.players.length,67);assert.equal(draft.ratings.length,67);
const expected=new Map(spec.players.map(p=>[p.id,p]));
assert.equal(expected.size,67);
const html=read('index.html');
const scripts=[...html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]);
const overlay='src/elite-ovr-approved-v21.js';
assert(scripts.indexOf(overlay)>scripts.indexOf('src/natural-positions.js'));
assert(scripts.indexOf(overlay)<scripts.indexOf('src/overall.js'));
assert(read('draft.html').includes(overlay));
assert(read('tools/build-t3.cjs').includes(overlay));
const ctx={window:{location:{search:'?engine=t3'}}};vm.createContext(ctx);
let baseline=null,postOverlay=null;
for(const file of scripts){
 if(file==='src/ace-recruitment-v1.js'||file==='src/cage-engine.js'||file==='src/cage-commentary.js')break;
 if(file===overlay)baseline=JSON.parse(JSON.stringify(ctx.window.THE_CAGE_PLAYERS));
 vm.runInContext(read(file),ctx,{filename:file});
 if(file===overlay)postOverlay=JSON.parse(JSON.stringify(ctx.window.THE_CAGE_PLAYERS));
}
const result=ctx.window.THE_CAGE_PLAYERS,byId=new Map(result.map(p=>[p.id,p])),original=new Map(baseline.map(p=>[p.id,p])),ovr=ctx.window.CageOverall;
assert.equal(result.length,184);assert.equal(byId.size,184);
assert.equal(ovr.VERSION,'overall-v2.1-owner-approved');
// Owner decisions 2026-11-01: display-only OVR corrections for 16 TITAN/LEGEND players; never an approved ELITE value.
for(const id of Object.keys(ovr.REVIEW_OVERRIDES))assert(byId.has(id)&&!spec.players?.some?.(x=>x.id===id),id+' display override must not touch an approved ELITE OVR');
assert(Object.keys(ovr.REVIEW_OVERRIDES).length<=16,'only the 16 owner-reviewed display corrections');
assert.equal(ctx.window.CAGE_ELITE_OVR_APPROVED.playerCount,67);
assert.equal(Object.values(ovr.PROFILES).reduce((s,x)=>s+x.length,0),27);
// Tier promotions of 2026-11-01 are later owner decisions (classification only): check the ELITE-67 overlay against each player's tier before them.
const tierOf=p=>p.tierDecision&&p.tierDecision.version==='owner-tier-decisions-2026-11-01'?p.tierDecision.from:p.careerTier;
let changed=0;
for(const p of postOverlay){
 const prev=original.get(p.id),row=expected.get(p.id),final=byId.get(p.id);
 assert(prev,'missing prior '+p.id);
 for(const key of ['careerTier','folklore','traits','name','role','country','aliases','attributes','attributesProvisional','talismanClubs']){
  assert.deepEqual(JSON.parse(JSON.stringify(p[key]??null)),prev[key]??null,p.id+' unexpected edit '+key);
 }
 if(row){
  changed++;assert.equal(tierOf(p),'ELITE',p.id+' tier');
  assert.equal(final.overall,row.approvedOVR,p.id+' approved OVR');
  assert.equal(ovr.raw(final),row.approvedOVR,p.id+' not formula-derived');
  assert.equal(p.ratingReviewStatus,'owner-approved-elite-ovr-v2.1');
  const expectedPrime={...prev.r};
  for(const [key,ab] of Object.entries(row.changes)){
   assert.equal(expectedPrime[key],ab[0],p.id+' source mismatch '+key);
   expectedPrime[key]=ab[1];
  }
  assert.deepEqual(JSON.parse(JSON.stringify(p.r)),expectedPrime,p.id+' unauthorized ratings changes');
  if(p.id==='sinisa-mihajlovic'){
   assert.equal(prev.position,'LB');assert.equal(p.position,'CB');
   assert.deepEqual(Array.from(p.secondaryPositions),['LB','CDM']);
  }else{
   assert.equal(p.position,prev.position,p.id+' natural position changed');
   assert.deepEqual(Array.from(p.secondaryPositions),prev.secondaryPositions,p.id+' secondary position changed');
  }
 }else{
  assert.deepEqual(JSON.parse(JSON.stringify(p.r)),prev.r,p.id+' non-ELITE ratings modified');
  assert.equal(p.position,prev.position,p.id+' non-ELITE position changed');
  assert.deepEqual(Array.from(p.secondaryPositions),prev.secondaryPositions,p.id+' non-ELITE secondary changed');
  if(tierOf(p)!=='STALWART'&&!ovr.REVIEW_OVERRIDES[p.id])assert.equal(final.overall,ovr.compute({...final,r:prev.r,position:prev.position}),p.id+' non-ELITE/non-STALWART OVR changed');
 }
}
assert.equal(changed,67);
assert.equal(byId.get('jay-jay-okocha').careerTier,'LEGEND');
assert.equal(byId.get('juan-carlos-valeron').overall,87);
assert.equal(byId.get('alex-de-souza').overall,86);
assert.equal(byId.get('sinisa-mihajlovic').overall,85);
assert.equal(byId.get('trent-alexander-arnold').overall,88);
for(const [tier,num] of Object.entries({TITAN:30,LEGEND:69,ELITE:67,STALWART:18}))assert.equal(result.filter(x=>tierOf(x)===tier).length,num);
console.log('PASS ELITE-67 OWNER-APPROVED: 67/67 exact formula OVR, unchanged 117 players, 27 archetypes, only the 16 owner-reviewed display corrections (no ELITE); Okocha LEGEND, tiers intact.');
