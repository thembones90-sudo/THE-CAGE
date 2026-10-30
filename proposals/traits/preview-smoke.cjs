const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert').strict;
const root=path.resolve(__dirname,'../..'),ctx={window:{location:{search:'?engine=t3'}}};vm.createContext(ctx);
for(const f of ['src/players.js','src/roster-expansion.js','src/roster-100.js','src/roster-101.js','src/roster-103.js','src/roster-pl-134.js','src/roster-135.js','src/roster-136.js','src/roster-139.js','src/engine/legacy-v04.js','src/cage-engine.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const E=ctx.window.CageEngine,T=ctx.window.CageTraits,R=ctx.window.THE_CAGE_PLAYERS;
assert.equal(T.CATALOG.length,15);assert.equal(R.length,139);
for(const p of R.filter(p=>p.traits)){assert(T.CATALOG.includes(p.traits.primary));assert(T.CATALOG.includes(p.traits.secondary));assert.notEqual(p.traits.primary,p.traits.secondary);}
for(const name of T.CATALOG)assert(R.some(p=>p.traits?.primary===name||p.traits?.secondary===name),'No holder: '+name);
const pairs=[
[['sergio-ramos','luka-modric','thierry-henry'],['andrea-barzagli','david-silva','sergio-aguero']],
[['carles-puyol','andrea-pirlo','marcelo-salas'],['patrice-evra','frank-lampard','ivan-zamorano']],
[['virgil-van-dijk','santi-cazorla','robin-van-persie'],['kyle-walker','bruno-fernandes','erling-haaland']]
];
let changed=0,scenarios=0;
for(let seed=1;seed<=75;seed++){const config={teams:pairs[seed%3],tactics:['balanced','press'],seed,mode:'ko'},a=E.simulate(config),b=E.simulate({...config,traits:{enabled:true}}),c=E.simulate({...config,traits:{enabled:true}});
assert.deepEqual(JSON.parse(JSON.stringify(b)),JSON.parse(JSON.stringify(c)),'trait mode nondeterministic');assert([0,1].includes(b.winner),'bad winner');if(a.eventHash!==b.eventHash)changed++;scenarios++;}
assert(changed>0,'Trait mode never changed a decision');
assert.deepEqual(JSON.parse(JSON.stringify(T.weights('roy-keane',{shoot:1,pass:2},{x:3,engaged:true,transition:false,hasRunner:true,covered:false}).weights)),{shoot:1,pass:2});
assert.equal(T.engagement('roy-keane',1,{x:3}),1);
console.log('PASS: 15 recognized traits; 78 valid assignments; '+scenarios+' deterministic trait-mode matches, '+changed+' differing event streams from T3, no traits defaults intact.');