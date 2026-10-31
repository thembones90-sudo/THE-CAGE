const {expectedRatings,expectedPosition,expectedAlternates,expectedStat}=require('./elite-v21-helpers.cjs');
// THE CAGE: thirteen owner-approved additions, 178-player tactical and identity integration.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const c={window:{location:{search:'?engine=t3'}}};vm.createContext(c);
const scripts=[...html.matchAll(new RegExp('<script src="(src/[^"]+)"></script>','g'))].map(m=>m[1]);
for(const f of scripts){if(f==='src/cage-commentary.js')break;vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c,{filename:f});}
const w=c.window,roster=w.THE_CAGE_PLAYERS,player=id=>roster.find(p=>p.id===id);
assert.equal(roster.length,184,'all 13 additions loaded');
assert.equal(new Set(roster.map(p=>p.id)).size,184,'no duplicate roster IDs');
assert(html.includes('src/roster-178.js'),'new roster script loaded');
assert(html.includes('0 used / 184 available'),'roster UI count');
assert(w.CAGE_ROSTER_VERSION.includes('184'),'roster version');
assert.equal(Object.keys(w.CAGE_ROSTER_EXTRA_RATINGS).length,45,'13 new plus 26 previous tactical supplements');
const expected=[["djibril-cisse","ELITE",["STREET HERO","UNDERDOG"],"ST",["RW"],"Phantom","Executioner","pace",97,"Djibril Cisse"],["dennis-bergkamp","TITAN",["STREET HERO"],"CF",["CAM"],"Magician","Surgeon","first_touch",100,"Bergkamp"],["pierre-van-hooijdonk","ELITE",["STREET HERO"],"ST",[],"Executioner","Juggernaut","shooting",97,"Pierre van Hooijdonk"],["shunsuke-nakamura","ELITE",["STREET HERO","TALISMAN"],"CAM",["RM","CM"],"Architect","Executioner","shooting",97,"Nakamura"],["alan-shearer","TITAN",["STREET HERO","TALISMAN"],"ST",[],"Executioner","Juggernaut","finish",99,"Shearer"],["alberto-luque","STALWART",["STREET HERO","UNDERDOG"],"LW",["ST"],"Phantom","Executioner","pace",89,"Luque"],["diego-tristan","ELITE",["STREET HERO"],"ST",["CF"],"Executioner","Magician","finishing",95,"Diego Tristan"],["ariel-ortega","ELITE",["STREET HERO","TALISMAN"],"CAM",["RW"],"Magician","Surgeon","dribbling",99,"Ortega"],["patrick-mboma","ELITE",["STREET HERO","UNDERDOG"],"ST",["CF"],"Juggernaut","Executioner","shooting",97,"Mboma"],["sami-hyypia","ELITE",["UNDERDOG"],"CB",[],"Wall","Anticipator","positioning",97,"Hyypia"],["milan-baros","ELITE",["STREET HERO","UNDERDOG"],"ST",["CF"],"Phantom","Predator","pace",91,"Baros"],["ruud-gullit","TITAN",["STREET HERO","TALISMAN"],"CAM",["CF","CM"],"Juggernaut","Maestro","phys",96,"Gullit"],["gianfranco-zola","LEGEND",["STREET HERO","TALISMAN"],"CF",["CAM"],"Magician","Surgeon","first_touch",99,"Zola"]];
for(const [id,tier,folklore,position,other,primary,secondary,stat,val,query] of expected){
 const p=player(id);assert(p,'missing '+id);
 assert.equal(p.careerTier,tier,id+' career tier');
 assert.deepEqual(Array.from(p.folklore),folklore,id+' folklore');
 assert.equal(p.position,position,id+' natural position');
 assert.deepEqual(Array.from(p.secondaryPositions),other,id+' secondary positions');
 assert.equal(p.traits.primary,primary,id+' primary');
 assert.equal(p.traits.secondary,secondary,id+' secondary');
 assert.equal(p.r[stat],expectedStat(id,stat,val),id+' signature rating');
 assert.equal(Object.keys(p.r).length,17,id+' core/extended ratings');
 assert.equal(Object.keys(p.attributes).length,5,id+' T3 supplemental ratings');
 assert.equal(p.attributesProvisional,true,id+' supplement provisional flag');
 assert.equal(w.CageTraits.traits(id)[0][0],primary,id+' trait engine integration');
 assert(w.CageIdentity.resolve(query).matches?.some(x=>x.id===id),id+' search alias: '+query);
 for(const value of [...Object.values(p.r),...Object.values(p.attributes)])assert(Number.isFinite(value)&&value>=0&&value<=100,id+' invalid rating');
}
const talismans={'shunsuke-nakamura':['Yokohama F. Marinos'],'alan-shearer':['Newcastle United'],'ariel-ortega':['River Plate'],'ruud-gullit':['AC Milan'],'gianfranco-zola':['Chelsea']};
for(const [id,clubs] of Object.entries(talismans))assert.deepEqual(Array.from(player(id).talismanClubs),clubs,id+' talisman clubs');
assert.equal(player('patrick-mboma').careerTier,'ELITE','owner corrected Mboma');
assert.equal(player('sami-hyypia').careerTier,'ELITE','owner corrected Hyypia');
assert.equal(player('robin-van-persie').careerTier,'LEGEND','existing Van Persie approval preserved');
assert.deepEqual(Array.from(player('robin-van-persie').folklore),['STREET HERO']);
const engine=w.CageEngine;assert(engine.VERSION.startsWith('cage-t3'),'T3 expected');
const matchups=[
 [['dennis-bergkamp','ruud-gullit','alan-shearer'],['gianfranco-zola','ariel-ortega','shunsuke-nakamura']],
 [['djibril-cisse','sami-hyypia','milan-baros'],['pierre-van-hooijdonk','alberto-luque','diego-tristan']],
 [['patrick-mboma','shunsuke-nakamura','gianfranco-zola'],['alberto-luque','ruud-gullit','sami-hyypia']]
];
for(const [team1,team2] of matchups)for(const seed of [7,88]){
 const input={teams:[team1,team2],tactics:['press','counter'],seed,mode:'ko'};
 const first=engine.simulate(input),second=engine.simulate(input);
 assert.deepEqual(JSON.parse(JSON.stringify(first)),JSON.parse(JSON.stringify(second)),'T3 match determinism');
 assert([0,1].includes(first.winner),'T3 match has a winner');
}
console.log('PASS: 184 distinct players; 13 new complete dossiers, corrected tiers, 5 talismans, 22 attributes each, aliases, traits and six deterministic T3 matches.');
