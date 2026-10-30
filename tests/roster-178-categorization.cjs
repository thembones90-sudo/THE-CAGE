// THE CAGE: all 178 editorial classifications; prior approved player metadata must remain byte-for-byte equivalent in values.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const pre=JSON.parse(read('docs/roster-audit-178.json'));
const definitions=JSON.parse(read('proposals/roster-178-classifications-v1.json'));
const traitProposals=JSON.parse(read('proposals/trait-pairs-missing-61.json')).traits;
const html=read('index.html');
const ctx={window:{location:{search:'?engine=t3'}}};vm.createContext(ctx);
for(const m of html.matchAll(new RegExp('<script src="(src/[^"]+)"></script>','g'))){if(m[1]==='src/cage-commentary.js')break;vm.runInContext(read(m[1]),ctx,{filename:m[1]});}
const w=ctx.window,players=w.THE_CAGE_PLAYERS,pmap=new Map(players.map(p=>[p.id,p]));
assert.equal(players.length,182);assert.equal(pmap.size,182);
assert.equal(pre.players.length,178);assert.equal(definitions.classifiedNow,138);assert.equal(definitions.traitsAssignedNow,61);
assert(html.includes('src/roster-classification.js'),'browser must load classifications');
assert(html.includes('0 used / 182 available'));
assert(w.CAGE_ROSTER_VERSION.includes('182'));
const tiers=new Set(['ACE','STALWART','ELITE','LEGEND','TITAN']),badges=new Set(['STREET HERO','STREET VILLAIN','TALISMAN','UNDERDOG']);
const traits=new Set(w.CageTraits.CATALOG);
let restored=0,approvedPreserved=0,newTraits=0;
for(const prior of pre.players){
 const p=pmap.get(prior.id);assert(p,'missing '+prior.id);
 assert(tiers.has(p.careerTier),'missing/invalid tier '+p.id);
 assert(Array.isArray(p.folklore),'unreviewed folklore '+p.id);
 assert.equal(new Set(p.folklore).size,p.folklore.length,'duplicate folklore '+p.id);
 for(const b of p.folklore)assert(badges.has(b),'invalid folklore '+p.id+': '+b);
 assert(p.traits&&traits.has(p.traits.primary)&&traits.has(p.traits.secondary)&&p.traits.primary!==p.traits.secondary,'traits '+p.id);
 assert.equal(Object.keys(p.r).length,17,'ratings '+p.id);assert.equal(Object.keys(p.attributes).length,5,'T3 ratings '+p.id);
 assert.equal(p.position,prior.position,'position changed '+p.id);
 assert.deepEqual(JSON.parse(JSON.stringify(p.r)),prior.r,'prime ratings changed '+p.id);
 assert.equal(!!p.attributesProvisional,prior.provisionalTactical,'tactical rating status changed '+p.id);
 if(prior.careerTier){
   approvedPreserved++;
   assert.equal(p.careerTier,prior.careerTier,'approved tier changed '+p.id);
   assert.deepEqual(Array.from(p.folklore),prior.folklore,'approved folklore changed '+p.id);
   assert.deepEqual(JSON.parse(JSON.stringify(p.traits)),prior.traits,'approved traits changed '+p.id);
 }else{
   restored++;
   assert(definitions.classifications[p.id],'not included in classification proposal '+p.id);
   assert(['editorial-reviewed-v1.3','editorial-refined-v1.4'].includes(p.classificationStatus),'editorial status missing '+p.id);
   if(prior.traits)assert.deepEqual(JSON.parse(JSON.stringify(p.traits)),prior.traits,'existing trait pair overwritten '+p.id);
   else{
     newTraits++;
     assert.deepEqual(JSON.parse(JSON.stringify(p.traits)),traitProposals[p.id],'wrong newly categorized traits '+p.id);
   }
 }
 if(p.folklore.includes('TALISMAN'))assert(p.talismanClubs?.length>0,'talisman club missing '+p.id);
}
assert.equal(approvedPreserved,40);assert.equal(restored,138);assert.equal(newTraits,61);
assert.equal(w.CageTraits.traits('roy-keane').length,2,'formerly traitless players should now be supported');
assert.equal(w.CageTraits.traits('jay-jay-okocha')[0][0],'Magician');
const expected={
 'cristiano-ronaldo':['TITAN',['STREET HERO','STREET VILLAIN']],
 'ronaldo-nazario':['TITAN',['STREET HERO','UNDERDOG']],
 'paolo-maldini':['TITAN',['TALISMAN']],
 'roy-keane':['LEGEND',['STREET VILLAIN']],
 'jay-jay-okocha':['LEGEND',['STREET HERO','UNDERDOG']],
 'nani':['STALWART',['STREET HERO']],
 'jamie-vardy':['ELITE',['STREET HERO','UNDERDOG']],
 'sami-hyypia':['ELITE',['UNDERDOG']],
 'patrick-mboma':['ELITE',['STREET HERO','UNDERDOG']],
 'alex-de-souza':['ELITE',['STREET HERO','TALISMAN']]
};
for(const [id,[tier,folklore]] of Object.entries(expected)){
 const p=pmap.get(id);assert.equal(p.careerTier,tier,id+' locked historical tier');assert.deepEqual(Array.from(p.folklore).sort(),folklore.sort(),id+' locked folklore');
}
const E=w.CageEngine;assert(E.VERSION.startsWith('cage-t3'));
const matchups=[
 [['roy-keane','ronaldo-nazario','jay-jay-okocha'],['paolo-maldini','cristiano-ronaldo','nani']],
 [['xabi-alonso','steven-gerrard','jamie-carragher'],['riquelme-does-not-exist','ruud-gullit','dennis-bergkamp']],
 [['mohamed-salah','sadio-mane','virgil-van-dijk'],['ronaldinho','xavi-hernandez','lionel-messi']]
];
matchups[1][1][0]='juan-roman-riquelme';
for(const [a,b] of matchups)for(const seed of [5,27,64]){
 const input={teams:[a,b],tactics:['balanced','press'],seed,mode:'ko',traits:{enabled:true}};
 const one=E.simulate(input),two=E.simulate(input);
 assert.deepEqual(JSON.parse(JSON.stringify(one)),JSON.parse(JSON.stringify(two)),'trait-enabled match determinism '+seed);
 assert([0,1].includes(one.winner));
}
console.log('PASS: 182/182 tiers, folklore, traits, positions, preserved ratings, 40 approved dossiers intact, 138 new classifications, 61 restored trait pairs, and 9 trait-enabled T3 matches.');
