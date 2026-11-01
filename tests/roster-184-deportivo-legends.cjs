const {expectedRatings,expectedPosition,expectedAlternates,expectedStat}=require('./elite-v21-helpers.cjs');
// THE CAGE: add Valeron and Makaay without touching the previous 182.
const {CURRENT_ROSTER_SIZE,RECRUITMENTS_AFTER_184}=require('./baseline-current.cjs');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),previous=JSON.parse(read('docs/roster-audit-182-current.json'));
const ownerElite=new Set(JSON.parse(read('proposals/owner-tier-revisions-10-v17.json')).players.map(p=>p.id));
const source=JSON.parse(read('proposals/deportivo-legends-2-approved.json'));
const c={window:{location:{search:'?engine=t3'}}};vm.createContext(c);
for(const m of html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)){if(m[1]==='src/cage-commentary.js')break;if(RECRUITMENTS_AFTER_184.includes(m[1]))continue;// historical snapshot: the 184-player roster
vm.runInContext(read(m[1]),c,{filename:m[1]});}
const w=c.window,ps=w.THE_CAGE_PLAYERS,byId=new Map(ps.map(p=>[p.id,p]));
assert.equal(ps.length,184,'new total');assert.equal(byId.size,184,'unique IDs');
assert.equal(source.players.length,2);
assert(html.includes('src/roster-184.js')&&html.includes('0 used / '+CURRENT_ROSTER_SIZE+' available'));
assert(w.CAGE_ROSTER_VERSION.includes('184'));
assert(w.CageEngine.VERSION.startsWith('cage-t3'));
assert.equal(Object.keys(w.CAGE_ROSTER_EXTRA_RATINGS).length,45);
// Approved V5.4.1 cross-family rule (src/roster-trait-family-v16.js) deliberately changed some secondaries
// and renamed the legacy Tracker class to Hunter after the 182-player audit. Those, and only those, are allowed.
const traitCorrections=JSON.parse(read('src/roster-trait-family-v16.js').match(/const corrections=(\{[^;]*\});/)[1]);
const stalwart=Object.fromEntries(JSON.parse(read('src/stalwart-ovr-approved-v1.js').match(/const records=(\[.*?\]);/s)[1]).map(x=>[x.id,x.changes]));
function sanctionedTraits(old){const t=JSON.parse(JSON.stringify(old.traits||null));if(!t)return t;
 for(const k of ['primary','secondary'])if(t[k]==='Tracker')t[k]='Hunter';
 const c=traitCorrections[old.id],norm=x=>x==='Tracker'?'Hunter':x;if(c&&t.primary===norm(c[0]))t.secondary=norm(c[2]);return t;}
for(const old of previous.players){
 const p=byId.get(old.id);assert(p,old.id+' disappeared');
 assert.equal(p.careerTier,ownerElite.has(p.id)?'ELITE':old.careerTier,old.id+' tier');
 assert.deepEqual(Array.from(p.folklore),old.folklore,old.id+' folklore');
 assert.deepEqual(JSON.parse(JSON.stringify(p.traits)),sanctionedTraits(old),old.id+' traits (only approved V5.4.1 cross-family corrections allowed)');
 if(stalwart[old.id]){for(const [k,[,to]] of Object.entries(stalwart[old.id]))assert.equal(p.r[k],to,old.id+' approved STALWART change '+k);}// owner-approved STALWART-18 recalibration (after the 182 audit)
 else assert.deepEqual(JSON.parse(JSON.stringify(p.r)),expectedRatings(old),old.id+' prime stats');
 assert.equal(p.position,expectedPosition(old),old.id+' natural position');
 assert.deepEqual(Array.from(p.secondaryPositions),expectedAlternates(old),old.id+' alternates');
 assert.equal(!!p.attributesProvisional,old.provisionalTactical,old.id+' provisional status');
}
const expectedPos={'juan-carlos-valeron':['CAM',['CM']],'roy-makaay':['ST',['CF']]};
const keys=['pace','tech','pass','finish','def','phys','first_touch','dribbling','passing','vision','finishing','shooting','stamina','physical','tackling','positioning','composure'];
for(const s of source.players){
 const p=byId.get(s.id);assert(p,'Missing new player: '+s.id);
 assert.equal(p.name,s.name);assert.equal(p.careerTier,s.tier);
 assert.deepEqual(Array.from(p.folklore),s.folklore);
 assert.deepEqual([p.traits.primary,p.traits.secondary],s.traits);
 assert.deepEqual([p.position,Array.from(p.secondaryPositions)],expectedPos[s.id]);
 assert.equal(p.ratingsVersion,'ratings-v1.1');
 assert.equal(p.attributesProvisional,true);
 assert.deepEqual(keys.map(k=>p.r[k]),[...s.core,...s.detail]);
 assert.deepEqual(Object.keys(p.r).length,17);
 assert.deepEqual(Object.values(p.attributes),s.extra);
 assert(w.CageIdentity.resolve(s.name).matches.some(m=>m.id===s.id),'name search: '+s.id);
 for(const alias of [s.aliases[0],s.aliases[1]]){
  assert(w.CageIdentity.resolve(alias).matches.some(m=>m.id===s.id),'alias: '+alias);
 }
 assert.equal(w.CageTraits.traits(s.id)[0][0],s.traits[0]);
}
assert.deepEqual(Array.from(byId.get('juan-carlos-valeron').talismanClubs),['Deportivo La Coruña']);
assert.equal(byId.get('sergio-busquets').careerTier,'LEGEND');
assert.equal(byId.get('gareth-bale').careerTier,'LEGEND');
for(const id of ['arjen-robben','franck-ribery','gerd-muller','thomas-muller','marco-reus','stefan-effenberg','edin-dzeko','grafite','diego-ribas','zvjezdan-misimovic'])
 assert(!byId.has(id),'Unapproved Bundesliga recruit added: '+id);
const games=[
 [['juan-carlos-valeron','roy-makaay','alberto-luque'],['diego-tristan','miodrag-belodedici','robin-van-persie']],
 [['roy-makaay','ruud-gullit','gianfranco-zola'],['juan-carlos-valeron','sami-hyypia','fernando-torres']]
];
for(const [team1,team2] of games)for(const seed of [10,37,88]){
 const opts={teams:[team1,team2],tactics:['balanced','press'],seed,mode:'ko',traits:{enabled:true}};
 const a=w.CageEngine.simulate(opts),b=w.CageEngine.simulate(opts);
 assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),'nondeterministic T3 seed '+seed);
 assert([0,1].includes(a.winner));
}
console.log('PASS: 184 unique players, Valeron ELITE + Makaay LEGEND dossiers, 17 core/extended ratings + 5 tactical stats, badges, traits, search, 182 existing players preserved, six deterministic T3 matches.');
