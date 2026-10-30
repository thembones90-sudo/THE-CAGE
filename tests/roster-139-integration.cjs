const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx={window:{location:{search:'?engine=t3'}}};
vm.createContext(ctx);
const files=['src/players.js','src/roster-expansion.js','src/roster-100.js','src/roster-101.js','src/roster-103.js','src/roster-pl-134.js','src/roster-135.js','src/roster-136.js','src/roster-139.js','src/identity/search.js','src/engine/legacy-v04.js','src/cage-engine.js'];
for(const file of files)vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const {THE_CAGE_PLAYERS:p,CageIdentity:search,CageEngine:E,CAGE_APPROVED_RATINGS:rating}=ctx.window;
assert.equal(p.length,139,'roster count');assert.equal(new Set(p.map(x=>x.id)).size,139,'unique IDs');
assert.equal(Object.keys(rating.players).length,139,'supplemental attribute count');
assert.equal(p.filter(x=>x.attributesProvisional).length,76,'provisional 40+36 players');
for(const x of p){assert(x.attributes,'missing supplemental attributes '+x.name);assert.equal(Object.keys(x.r).length,17,'missing legacy rating '+x.name);}
const queries=[['Cafu','cafu'],['Roberto Carlos','roberto-carlos'],['Barzagli','andrea-barzagli'],['Le Tissier','matt-le-tissier'],['Crespo','hernan-crespo'],['Salas','marcelo-salas'],['Zamorano','ivan-zamorano'],['Vardy','jamie-vardy'],['Kolo Toure','kolo-toure'],['CR7','cristiano-ronaldo']];
for(const [q,id] of queries){let r=search.resolve(q);assert(r.matches?.some(p=>p.id===id),'search failed '+q+': '+JSON.stringify(r));}
const left=['sol-campbell','david-silva','sergio-aguero'],right=['andrea-barzagli','matt-le-tissier','hernan-crespo'];
for(const seed of [7,42]){const input={teams:[left,right],tactics:['balanced','counter'],seed,mode:'ko'},a=E.simulate(input),b=E.simulate(input);assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),'match determinism');assert([0,1].includes(a.winner),'invalid winner');}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const f of files.filter(x=>x.startsWith('src/roster')))assert(html.includes(f),'missing script '+f);
console.log('PASS: 139 unique players; 76 provisional five-attribute profiles; 10 search cases; 2 deterministic complete T3 matches; all scripts linked.');