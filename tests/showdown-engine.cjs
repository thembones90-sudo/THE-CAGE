const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root='A:/THE CAGE/';const ctx={window:{}};vm.createContext(ctx);
for(const file of ['src/players.js','src/roster-expansion.js','src/cage-engine.js','src/cage-commentary.js'])vm.runInContext(fs.readFileSync(root+file,'utf8'),ctx,{filename:file});
const E=ctx.window.CageEngine,C=ctx.window.CageCommentary,roster=ctx.window.THE_CAGE_PLAYERS;
assert.equal(roster.length,64);assert.equal(new Set(roster.map(p=>p.id)).size,64);
const a=['paolo-maldini','michael-ballack','ronaldo-nazario'],b=['jay-jay-okocha','djalminha','nemanja-vidic'];
for(let seed=1;seed<=100;seed++){const input={teams:[a,b],tactics:['balanced','press'],seed,mode:'ko'};const x=E.simulate(input),y=E.simulate(input);assert.equal(JSON.stringify(x),JSON.stringify(y));assert(x.winner===0||x.winner===1,'winner');const lines=C.commentate(x,seed,['Commander','Opponent']);assert(Array.isArray(lines));assert.equal(JSON.stringify(lines),JSON.stringify(C.commentate(x,seed,['Commander','Opponent'])));}
new vm.Script(fs.readFileSync(root+'src/showdown.js','utf8'));
const page=fs.readFileSync(root+'index.html','utf8');for(const name of ['players.js','roster-expansion.js','identity/search.js','cage-engine.js','cage-commentary.js','replay/records.js','showdown.js'])assert(page.includes(name));
console.log('PASS: 100 seed simulations and deterministic commentary; 64-player roster; canonical page and script references');
