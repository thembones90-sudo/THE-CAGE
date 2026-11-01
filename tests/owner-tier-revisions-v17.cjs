// Owner tier correction regression: only ten explicit identities may change, Okocha remains LEGEND.
const {CURRENT_ROSTER_SIZE,CURRENT_ENGINE,REPLAY_ENGINES,SNAPSHOT_184_STOP,SNAPSHOT_190_STOP}=require('./baseline-current.cjs');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const plan=JSON.parse(read('proposals/owner-tier-revisions-10-v17.json')),html=read('index.html');
const ids=new Set(plan.players.map(x=>x.id));
assert.equal(ids.size,10);assert(!ids.has(plan.lockedLegend));assert.equal(plan.lockedLegend,'jay-jay-okocha');
const browser=[...html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]);
const draft=[...read('draft.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(m=>m[1]);
const overlay='src/owner-tier-decisions-v17.js';
for(const [route,scripts] of [['index.html',browser],['draft.html',draft]]){
 assert(scripts.includes(overlay),route+' missing corrections');
 assert(scripts.indexOf(overlay)>scripts.indexOf('src/roster-184.js'),'must run after roster-184');
 assert(scripts.indexOf(overlay)<scripts.indexOf('src/natural-positions.js'),'must run before card ratings');
}
assert(read('tools/build-t3.cjs').includes(overlay),'T3 builder must include corrections');
const c={window:{location:{search:'?engine=t3'}}};vm.createContext(c);
let pre=null,post=null;
for(const file of browser){
 if(file==='src/cage-commentary.js')break;
 if(file===SNAPSHOT_184_STOP)break;// historical snapshot: the 184-player roster the v1.7 decisions were made on
 if(file===overlay)pre=JSON.parse(JSON.stringify(c.window.THE_CAGE_PLAYERS));
 vm.runInContext(read(file),c,{filename:file});
 if(file===overlay)post=JSON.parse(JSON.stringify(c.window.THE_CAGE_PLAYERS));
}
const ps=c.window.THE_CAGE_PLAYERS,byId=new Map(ps.map(p=>[p.id,p])),before=new Map(pre.map(p=>[p.id,p]));
assert.equal(ps.length,184);assert.equal(byId.size,184);
assert.equal(c.window.CAGE_OWNER_TIER_DECISIONS.movedIds.length,10);
assert.equal(byId.get('jay-jay-okocha').careerTier,'LEGEND','Okocha must remain LEGEND');
assert.equal(byId.get('jay-jay-okocha').classificationStatus,before.get('jay-jay-okocha').classificationStatus);
// Later owner decisions (2026-11-01, classification only) are checked against the tier each player had before them.
const tierOf=p=>p.tierDecision&&p.tierDecision.version==='owner-tier-decisions-2026-11-01'?p.tierDecision.from:p.careerTier;
let changed=0;
for(const p of post){
 const original=before.get(p.id);assert(original,'missing player: '+p.id);
 if(ids.has(p.id)){
  changed++;assert.equal(original.careerTier,'LEGEND',p.id+' previous tier');
  assert.equal(tierOf(p),'ELITE',p.id+' not demoted');
  assert.equal(p.classificationStatus,'owner-confirmed-v1.7');
  assert.equal(p.tierDecision.version,plan.version);
 }else{
  assert.equal(tierOf(p),original.careerTier,p.id+' unauthorized tier change');
  if(tierOf(p)===p.careerTier)assert.equal(p.classificationStatus,original.classificationStatus,p.id+' unexpected status change');
 }
 for(const key of ['id','name','country','role','position','secondaryPositions','r','attributes','folklore','traits','peak','aliases','talismanClubs']){
  assert.deepEqual(JSON.parse(JSON.stringify(p[key]??null)),original[key]??null,p.id+' '+key+' unexpectedly modified');
 }
}
assert.equal(changed,10);
const beforeCounts=Object.fromEntries(['TITAN','LEGEND','ELITE','STALWART'].map(t=>[t,pre.filter(p=>p.careerTier===t).length]));
assert.deepEqual(beforeCounts,plan.baseline&&{TITAN:plan.baseline.titan,LEGEND:plan.baseline.legend,ELITE:plan.baseline.elite,STALWART:plan.baseline.stalwart});
for(const p of ps)assert.equal(p.overall,c.window.CageOverall.compute({...p,careerTier:before.get(p.id).careerTier}),'OVR depends on tier: '+p.id);
const tally=t=>ps.filter(x=>tierOf(x)===t).length;
for(const [key,n] of Object.entries({TITAN:30,LEGEND:69,ELITE:67,STALWART:18}))assert.equal(tally(key),n);
const r=JSON.parse(read('docs/roster-audit-184-current.json'));assert.equal(r.total,184);assert.deepEqual(r.errors,[]);assert.deepEqual(r.warnings,[]);
assert.equal(r.distribution.tier.LEGEND,69);assert.equal(r.distribution.tier.ELITE,67);
assert.equal(r.ownerTierDecisions.version,plan.version);assert.equal(r.ownerTierDecisions.lockedLegend,plan.lockedLegend);
assert.equal(byId.get('juan-carlos-valeron').careerTier,'ELITE');
assert.equal(byId.get('roy-makaay').careerTier,'LEGEND');
// The decisions must survive every later roster expansion unchanged.
{const f={window:{location:{search:'?engine=t3'}}};vm.createContext(f);for(const file of browser){if(file==='src/cage-commentary.js')break;vm.runInContext(read(file),f,{filename:file});}
 const cur=new Map(f.window.THE_CAGE_PLAYERS.map(p=>[p.id,p]));assert.equal(cur.size,CURRENT_ROSTER_SIZE);
 for(const id of ids)assert.equal(cur.get(id).careerTier,'ELITE',id+' v1.7 move lost in current roster');
 assert.equal(cur.get('jay-jay-okocha').careerTier,'LEGEND','Okocha must remain LEGEND in current roster');}
console.log('PASS owner-tier-v1.7: exactly 10 LEGEND->ELITE; Okocha remains LEGEND; 184 players, 69 LEGENDS, 67 ELITE; abilities/traits/folklore unchanged.');
