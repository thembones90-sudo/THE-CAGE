'use strict';
// Canonical 182-player replay integrity test. Previous 64-player assumptions
// were obsolete after approved recruitment and identity expansion.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
vm.createContext(ctx);
const page=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...page.matchAll(/<script\s+src="(src\/[^"]+)"/g)].map(x=>x[1]);
assert(scripts.includes('src/roster-182.js')&&scripts.includes('src/replay/records.js'));
for(const f of scripts){if(f==='src/showdown.js')break;vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});}
const E=ctx.window.CageEngine,R=ctx.window.CageRecords,I=ctx.window.CageIdentity,ps=ctx.window.THE_CAGE_PLAYERS;
assert.equal(ps.length,182);assert.equal(E.VERSION,'cage-t3-6');
const config={teams:[['paolo-maldini','michael-ballack','ronaldo-nazario'],['nemanja-vidic','jay-jay-okocha','djalminha']],tactics:['balanced','press'],seed:42,mode:'ko'};
const result=E.simulate(config),record=R.make(config,result,1);
assert.equal(JSON.stringify(R.reproduce(record)),JSON.stringify(result));
assert(Object.isFrozen(result.events[0].zone));assert(Object.isFrozen(record));
const mutations=[r=>r.result.score[0]++,r=>r.result.events.at(-1).actor='jaap-stam',r=>r.result.events[0].t=-1,r=>r.config.seed=-1,r=>r.config.teams[0][0]='__proto__',r=>r.config.traits={enabled:false}];
for(const mutate of mutations){const bad=R.copy(record);mutate(bad);assert.throws(()=>R.validate(bad));}
for(const [key,value] of [['engineVersion','cage-t3-3'],['paramsVersion','t3-space-3'],['rosterFingerprint','fake-old-roster']]){
 const bad=R.copy(record);bad[key]=value;
 assert.throws(()=>R.reproduce(bad),/original engine|integrity|mismatch|Replay/,'incompatible record accepted: '+key);
}
const save={schema:1,round:1,wins:{A:result.winner===0?1:0,B:result.winner===1?1:0},used:config.teams.flatMap((ids,i)=>ids.map(id=>[id,i?'B':'A'])),claimed:{A:config.teams[0],B:config.teams[1]},locked:{A:true,B:true},drafts:{A:['','',''],B:['','','']},tactics:{A:'balanced',B:'press'},pace:'instant',roundFinished:true,history:[record],pending:null};
R.validateSave(save);
for(const mutate of [s=>s.wins.A++,s=>s.used.pop(),s=>s.claimed.A[0]=s.claimed.B[0],s=>s.round=6,s=>s.history.push(s.history[0])]){
 const bad=R.copy(save);mutate(bad);assert.throws(()=>R.validateSave(bad));
}
const tConfig={...config,traits:{enabled:true},seed:20265};
const tr=E.simulate(tConfig),trRecord=R.make(tConfig,tr,1);
assert.deepEqual(JSON.stringify(R.reproduce(trRecord)),JSON.stringify(tr),'enabled traits not replay reproducible');
const tri=R.copy(trRecord);tri.config.traits={enabled:false};assert.throws(()=>R.validate(tri),/trait-mode/);
assert.equal(I.resolve('R9').matches[0].id,'ronaldo-nazario');
assert.equal(I.resolve('CR7').matches[0].id,'cristiano-ronaldo');
assert.equal(I.resolve('Sinisa Mihajlovic').matches[0].id,'sinisa-mihajlovic');
assert.equal(I.resolve('Tugay Kerimoglu').matches[0].id,'tugay-kerimoglu');
assert.equal(I.resolve('Djalminh').kind,'completion');
assert.equal(I.resolve('zznotaplayer').kind,'unknown');
for(const q of ['Ronaldo','Keane','Toure','Ferdinand','Alonso','Martins','Carvalho','King']){const r=I.resolve(q);assert.equal(r.kind,'disambiguate',q);assert(r.matches.length>0);}
assert(I.resolve('micha').matches.length>=4,'expanded Michaels missing');
assert.equal(I.resolve('mart').matches[0].id,'obafemi-martins');
assert.equal(I.resolve('de bru').matches[0].id,'kevin-de-bruyne');
assert.equal(I.resolve('miha').matches[0].id,'sinisa-mihajlovic');
assert.equal(I.resolve('ro').kind,'short');
const originals={window:{}};vm.createContext(originals);
vm.runInContext(fs.readFileSync(path.join(root,'src/players.js'),'utf8'),originals);
for(const p of originals.window.THE_CAGE_PLAYERS){const actual=ps.find(q=>q.id===p.id);assert(actual,'original identity removed: '+p.id);assert.equal(JSON.stringify(actual.r),JSON.stringify(p.r),'approved original core rating changed: '+p.id);}
for(const p of ps)for(const v of Object.values(p.r))assert(Number.isFinite(v)&&v>=0&&v<=100);
for(const teams of [[],[config.teams[0]],[[...config.teams[0],config.teams[0][0]],config.teams[1]],[[config.teams[0][0],config.teams[0][0],config.teams[0][2]],config.teams[1]]])
 assert.throws(()=>E.simulate({...config,teams}));
console.log('V54_RECORDS_PASS canonical 182 roster, original core ratings, current and trait replay hashes, old-version refusal, corrupted save, identity recall');
