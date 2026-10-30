// THE CAGE: four owner-approved cult footballers, 184-player roster, all 178 previous locks intact, after Valeron/Makaay.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),prior=JSON.parse(read('docs/roster-audit-178-refined.json'));
const source=JSON.parse(read('proposals/world-street-heroes-4.json'));
const ctx={window:{location:{search:'?engine=t3'}}};vm.createContext(ctx);
for(const m of html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)){if(m[1]==='src/cage-commentary.js')break;vm.runInContext(read(m[1]),ctx,{filename:m[1]});}
const w=ctx.window,players=w.THE_CAGE_PLAYERS,byId=new Map(players.map(p=>[p.id,p])),previous=new Map(prior.players.map(p=>[p.id,p]));
assert.equal(players.length,184);assert.equal(byId.size,184);assert.equal(source.players.length,4);
assert(html.includes('src/roster-184.js')&&html.includes('0 used / 184 available'));
assert(w.CAGE_ROSTER_VERSION.includes('184'));assert(w.CageEngine.VERSION.startsWith('cage-t3'));
assert.equal(Object.keys(w.CAGE_ROSTER_EXTRA_RATINGS).length,45);
for(const former of prior.players){
 const p=byId.get(former.id);assert(p,'missing historical roster player '+former.id);
 assert.equal(p.careerTier,former.careerTier,'tier accidentally changed '+p.id);
 assert.deepEqual(Array.from(p.folklore),former.folklore,'badge accidentally changed '+p.id);
 assert.deepEqual(JSON.parse(JSON.stringify(p.traits)),former.traits,'trait accidentally changed '+p.id);
 assert.deepEqual(JSON.parse(JSON.stringify(p.r)),former.r,'ratings accidentally changed '+p.id);
 assert.equal(p.position,former.position,'natural position changed '+p.id);
 assert.equal(!!p.attributesProvisional,former.provisionalTactical,'tactical approval state changed '+p.id);
}
const positions={ailton:['ST',[]],'marcelinho-hertha':['CAM',['CM']],'juan-arango':['CAM',['LM']],'jefferson-farfan':['RW',['ST']]};
for(const proposed of source.players){
 const p=byId.get(proposed.id);assert(p,'missing recruit '+proposed.id);
 assert.equal(p.name,proposed.name);
 assert.equal(p.careerTier,'ELITE');
 assert.deepEqual(Array.from(p.folklore),proposed.folklore);
 assert.deepEqual([p.traits.primary,p.traits.secondary],proposed.traits);
 assert.equal(p.position,positions[p.id][0]);
 assert.deepEqual(Array.from(p.secondaryPositions),positions[p.id][1]);
 assert.equal(p.ratingType,'editorial-provisional-v1.5');
 const checks={pace:proposed.core[0],tech:proposed.core[1],pass:proposed.core[2],finish:proposed.core[3],def:proposed.core[4],phys:proposed.core[5],first_touch:proposed.detail[0],dribbling:proposed.detail[1],passing:proposed.detail[2],vision:proposed.detail[3],finishing:proposed.detail[4],shooting:proposed.detail[5],stamina:proposed.detail[6],physical:proposed.detail[7],tackling:proposed.detail[8],positioning:proposed.detail[9],composure:proposed.detail[10]};
 assert.deepEqual(JSON.parse(JSON.stringify(p.r)),checks,p.id+' 17 prime ratings');
 assert.equal(Object.keys(p.attributes).length,5,p.id+' five T3 ratings');
 assert.equal(p.attributesProvisional,true,p.id+' must remain provisional');
 assert.equal(w.CageTraits.traits(p.id)[0][0],proposed.traits[0]);
 assert(w.CageIdentity.resolve(proposed.name).matches.some(x=>x.id===p.id),'search failed '+p.id);
}
for(const id of ['arjen-robben','franck-ribery','gerd-muller','thomas-muller','marco-reus','stefan-effenberg','edin-dzeko','grafite','diego-ribas','zvjezdan-misimovic'])
 assert(!byId.has(id),'Unapproved Bundesliga recruit accidentally playable: '+id);
assert.equal(byId.get('sergio-busquets').careerTier,'LEGEND','owner-corrected Busquets');
assert.equal(byId.get('gareth-bale').careerTier,'LEGEND','owner-corrected Bale');
const matches=[
 [['ailton','marcelinho-hertha','juan-arango'],['jefferson-farfan','dennis-bergkamp','sami-hyypia']],
 [['juan-arango','jefferson-farfan','ruud-gullit'],['ailton','gianfranco-zola','marcelinho-hertha']]
];
for(const [a,b] of matches)for(const seed of [11,67,131]){
 const input={teams:[a,b],tactics:['balanced','press'],seed,mode:'ko',traits:{enabled:true}};
 const x=w.CageEngine.simulate(input),y=w.CageEngine.simulate(input);
 assert.deepEqual(JSON.parse(JSON.stringify(x)),JSON.parse(JSON.stringify(y)),'T3 nondeterministic at seed '+seed);
 assert([0,1].includes(x.winner));
}
console.log('PASS: 184 unique players; 4 ELITE street recruits, 17+5 ratings, positions, folklore, aliases, full historical roster preserved, 10 pending unadded, 6 deterministic T3 matches.');
