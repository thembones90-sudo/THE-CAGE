const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),ctx={window:{location:{search:'?engine=t3'}}};vm.createContext(ctx);
for(const f of ['src/players.js','src/roster-expansion.js','src/roster-100.js','src/roster-101.js','src/roster-103.js','src/roster-pl-134.js','src/roster-135.js','src/roster-136.js','src/roster-139.js','src/engine/legacy-v04.js','src/cage-engine.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const {CageEngine:E,CageTraits:Tr,THE_CAGE_PLAYERS:ro}=ctx.window;
const opts={shoot:1,pass:1,carry:1,through:1,wall:1,dribble:1,shield:1,outlet:1};
const states=[];for(const x of [1,2,3])for(const engaged of [false,true])states.push({x,engaged,transition:true,hasRunner:true,covered:true,support:1});
for(const trait of Tr.CATALOG){
const holder=ro.find(p=>p.traits?.primary===trait);assert(holder,'Missing primary holder '+trait);
let changed=false;for(const s of states){
const a=Tr.weights(holder.id,opts,s);if(a.active.includes(trait))changed=true;
for(const b of [0.2,0.5,0.8])if(Tr.engagement(holder.id,b,s)!==b)changed=true;
}
assert(changed,'Trait never changes a decision: '+trait);
assert(Tr.COUNTERPLAY[trait],'Missing counterplay: '+trait);
}
const untraited=ro.filter(p=>!p.traits),A=untraited.slice(0,3).map(p=>p.id),B=untraited.slice(3,6).map(p=>p.id);
for(let seed=1;seed<=100;seed++){const config={teams:[A,B],tactics:['balanced','possession'],seed,mode:'ko'};
const old=E.simulate(config),trial=E.simulate({...config,traits:{enabled:true}});
assert.equal(old.eventHash,trial.eventHash,'Untraited event parity seed '+seed);
assert.equal(old.draws,trial.draws,'Untraited draw parity seed '+seed);
}
const t=fs.readFileSync(path.join(root,'src/tactics/traits.js'),'utf8');
assert(!/Math\.random|Date\.now|\.r\b|\.role\b/.test(t),'Trait module reads legacy stats or is nondeterministic');
console.log('PASS: all 15 traits activate in a valid scenario and define counterplay; 100 untraited match event hashes and RNG counts identical; no legacy rating or random reads.');