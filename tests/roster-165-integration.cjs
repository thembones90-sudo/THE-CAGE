// THE CAGE: owner-approved sixteen-player roster addition regression.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const context={window:{location:{search:'?engine=t3'}}};vm.createContext(context);
const scripts=[...html.matchAll(new RegExp('<script src="(src/[^"]+)"></script>','g'))].map(m=>m[1]);
for(const file of scripts){if(file==='src/cage-commentary.js')break;vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});}
const w=context.window,players=w.THE_CAGE_PLAYERS,lookup=id=>players.find(p=>p.id===id);
assert.equal(players.length,182);
assert.equal(new Set(players.map(p=>p.id)).size,182);
assert.equal(Object.keys(w.CAGE_ROSTER_EXTRA_RATINGS).length,43,'16 roster-165 plus prior 10 plus new 13');
assert(w.CAGE_ROSTER_VERSION.includes('182'));
assert(html.includes('src/roster-165.js'));
assert(html.includes('0 used / 182 available'));
const expected=[["robert-prosinecki","LEGEND",["STREET HERO"],"CAM",["CM"],"Magician","Maestro","first_touch",98,"Prosinecki"],["darko-pancev","LEGEND",["STREET HERO"],"ST",[],"Predator","Executioner","finish",99,"Pancev"],["miodrag-belodedici","LEGEND",[],"CB",[],"Libero","Anticipator","positioning",98,"Belodedici"],["safet-susic","LEGEND",["STREET HERO","TALISMAN"],"CAM",[],"Magician","Surgeon","vision",99,"Safet Susic"],["davor-suker","LEGEND",["STREET HERO"],"ST",["CF"],"Executioner","Predator","finishing",98,"Davor Suker"],["alen-boksic","LEGEND",["STREET HERO"],"ST",["CF"],"Juggernaut","Phantom","pace",92,"Alen Boksic"],["savo-milosevic","ELITE",[],"ST",[],"Predator","Juggernaut","positioning",94,"Savo Milosevic"],["josip-ilicic","ELITE",["STREET HERO"],"CAM",["RW"],"Magician","Executioner","shooting",96,"Josip Ilicic"],["vladimir-jugovic","ELITE",[],"CM",["CDM"],"Engine","Architect","stamina",91,"Jugovic"],["nwankwo-kanu","LEGEND",["STREET HERO","UNDERDOG"],"CF",["ST"],"Magician","Predator","first_touch",96,"Kanu"],["alex-de-souza","ELITE",["STREET HERO","TALISMAN"],"CAM",[],"Maestro","Surgeon","vision",98,"Alex de Souza"],["andrey-arshavin","ELITE",["STREET HERO"],"LW",["CAM"],"Magician","Executioner","dribbling",94,"Arshavin"],["hulk","ELITE",["STREET HERO"],"RW",["ST"],"Juggernaut","Executioner","shooting",99,"Hulk"],["aiden-mcgeady","STALWART",["STREET HERO"],"RW",["LW"],"Magician","Phantom","dribbling",94,"McGeady"],["papiss-cisse","STALWART",["STREET HERO"],"ST",[],"Predator","Executioner","finishing",94,"Papiss Cisse"],["peter-crouch","STALWART",["STREET HERO"],"ST",[],"Juggernaut","Predator","positioning",92,"Crouch"]];
for(const [id,tier,folklore,pos,alternate,primary,secondary,stat,value,query] of expected){
 const p=lookup(id);assert(p,'missing '+id);
 assert.equal(p.careerTier,tier,id+' tier');
 assert.deepEqual(Array.from(p.folklore),folklore,id+' folklore');
 assert.equal(p.position,pos,id+' position');
 assert.deepEqual(Array.from(p.secondaryPositions),alternate,id+' alternatives');
 assert.equal(p.traits.primary,primary,id+' primary');
 assert.equal(p.traits.secondary,secondary,id+' secondary');
 assert.equal(p.r[stat],value,id+' signature rating');
 assert.equal(Object.keys(p.r).length,17,id+' full prime stats');
 assert.equal(Object.keys(p.attributes).length,5,id+' tactical stats');
 assert(p.attributesProvisional,id+' provisional tactical stats marker');
 assert.equal(w.CageTraits.traits(id)[0][0],primary,id+' trait engine');
 assert(w.CageIdentity.resolve(query).matches?.some(x=>x.id===id),'search failure: '+query);
 for(const v of [...Object.values(p.r),...Object.values(p.attributes)])assert(Number.isFinite(v)&&v>=0&&v<=100,id+' invalid rating');
}
assert.deepEqual(Array.from(lookup('safet-susic').talismanClubs),['Paris Saint-Germain']);
assert.deepEqual(Array.from(lookup('alex-de-souza').talismanClubs),['Fenerbahçe']);
assert.equal(lookup('alex-de-souza').careerTier,'ELITE','Alex must not become LEGEND');
assert.deepEqual(Array.from(lookup('nwankwo-kanu').folklore),['STREET HERO','UNDERDOG']);
const E=w.CageEngine;assert(E.VERSION.startsWith('cage-t3'));
for(const [sideA,sideB] of [
 [['robert-prosinecki','darko-pancev','miodrag-belodedici'],['safet-susic','davor-suker','alen-boksic']],
 [['savo-milosevic','josip-ilicic','vladimir-jugovic'],['nwankwo-kanu','alex-de-souza','andrey-arshavin']],
 [['hulk','aiden-mcgeady','papiss-cisse'],['peter-crouch','mark-viduka','filippo-inzaghi']]
]){
 for(const seed of [43,91]){
  const params={teams:[sideA,sideB],tactics:['balanced','counter'],seed,mode:'ko'};
  const a=E.simulate(params),b=E.simulate(params);
  assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),'T3 nondeterministic match');
  assert([0,1].includes(a.winner),'missing winner');
 }
}
console.log('PASS: all 16 approved additions, 182 unique IDs, positions, folklore, dual talismans, 22 attributes each, search, traits and 6 deterministic T3 matches.');
