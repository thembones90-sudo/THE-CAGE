// THE CAGE: full eight-player, folklore, identities, and engine regression.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ctx={window:{location:{search:'?engine=t3'}}};vm.createContext(ctx);
const scripts=[...html.matchAll(new RegExp('<script src="(src/[^"]+)"></script>','g'))].map(m=>m[1]);
for(const file of scripts){if(file==='src/cage-commentary.js')break;vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});}
const ps=ctx.window.THE_CAGE_PLAYERS,lookup=id=>ps.find(p=>p.id===id);
assert.equal(ps.length,149,'roster should contain 149 players');
assert.equal(new Set(ps.map(p=>p.id)).size,149,'roster ID uniqueness');
assert.equal(ctx.window.CAGE_ROSTER_VERSION.includes('149'),true,'roster version');
assert.equal(Object.keys(ctx.window.CAGE_ROSTER_EXTRA_RATINGS).length,10,'8 new + Nakata and Pippo');
const expected=[["park-ji-sung","LEGEND",["STREET HERO","UNDERDOG"],"LM",["RM","CM"],"Engine","Tracker",["Ji Sung Park","Park Jisung","Three Lung Park"],"stamina",100],["tijjani-babangida","STALWART",["STREET HERO","UNDERDOG"],"RW",["RM"],"Magician","Phantom",["Tijjani Babangida","Babangida"],"pace",99],["mark-viduka","ELITE",["STREET HERO"],"ST",["CF"],"Juggernaut","Magician",["Mark Viduka","Viduka"],"phys",94],["youri-djorkaeff","LEGEND",["STREET HERO"],"CAM",["CF"],"Surgeon","Executioner",["Youri Djorkaeff","Djorkaeff"],"vision",94],["dejan-stankovic","LEGEND",["STREET HERO"],"CM",["CAM","RM"],"Engine","Executioner",["Dejan Stanković","Deki"],"shooting",97],["predrag-mijatovic","LEGEND",["STREET HERO"],"CF",["ST"],"Magician","Executioner",["Predrag Mijatović","Peđa"],"composure",96],["dragan-stojkovic","LEGEND",["STREET HERO","TALISMAN"],"CAM",["CM"],"Magician","Maestro",["Dragan Stojković","Piksi"],"tech",98],["dejan-savicevic","LEGEND",["STREET HERO","TALISMAN"],"CAM",["CF"],"Magician","Surgeon",["Dejan Savićević","Il Genio"],"dribbling",99]];
for(const [id,tier,folklore,pos,alternates,primary,secondary,queries,key,value] of expected){
  const p=lookup(id);assert(p,'missing '+id);
  assert.equal(p.careerTier,tier,id+' tier');
  assert.deepEqual(Array.from(p.folklore),folklore,id+' folklore');
  assert.equal(p.position,pos,id+' natural position');
  assert.deepEqual(Array.from(p.secondaryPositions),alternates,id+' alternate positions');
  assert.equal(p.traits.primary,primary,id+' primary');
  assert.equal(p.traits.secondary,secondary,id+' secondary');
  assert.equal(p.r[key],value,id+' signature rating');
  assert.equal(Object.keys(p.r).length,17,id+' 17 ratings');
  assert.equal(Object.keys(p.attributes).length,5,id+' 5 tactical ratings');
  assert.equal(p.attributesProvisional,true,id+' supplemental estimates are provisional');
  assert.equal(ctx.window.CageTraits.traits(id)[0][0],primary,id+' trait wiring');
  for(const query of queries){
    const result=ctx.window.CageIdentity.resolve(query);
    assert(result.matches?.some(x=>x.id===id),'search failed for '+id+': '+query);
  }
}
assert.deepEqual(Array.from(lookup('dejan-savicevic').talismanClubs),['Red Star Belgrade','AC Milan']);
assert.deepEqual(Array.from(lookup('dragan-stojkovic').talismanClubs),['Red Star Belgrade','Nagoya Grampus']);
const E=ctx.window.CageEngine;assert(E.VERSION.startsWith('cage-t3'));
for(const seed of [11,52,177]){
  const input={teams:[['park-ji-sung','tijjani-babangida','mark-viduka'],['dragan-stojkovic','dejan-savicevic','dejan-stankovic']],tactics:['press','counter'],seed,mode:'ko'};
  const a=E.simulate(input),b=E.simulate(input);
  assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),'match nondeterminism seed '+seed);
  assert([0,1].includes(a.winner),'no winner seed '+seed);
}
assert(html.includes('src/roster-149.js'), 'new roster not included in browser');
assert(html.includes('0 used / 149 available'), 'initial UI pool count stale');
console.log('PASS: 149 unique players, eight approved dossiers, 16 folklore assignments, two dual-club talismans, 22 attributes each, search, traits and three deterministic tactical matches.');
