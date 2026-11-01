const {CURRENT_ROSTER_SIZE,CURRENT_ENGINE,REPLAY_ENGINES,SNAPSHOT_184_STOP,SNAPSHOT_190_STOP}=require('./baseline-current.cjs');
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),c={window:{location:{search:'?engine=t3'}}};vm.createContext(c);
for(const m of html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)){if(m[1]==='src/cage-commentary.js')break;vm.runInContext(read(m[1]),c,{filename:m[1]});}
const ps=c.window.THE_CAGE_PLAYERS,engine=c.window.CageEngine,ratings=c.window.CageOverall;
assert.equal(ps.length,CURRENT_ROSTER_SIZE);
const scenarios=[
 {teams:[['lionel-messi','ronaldo-nazario','paolo-maldini'],['cristiano-ronaldo','zinedine-zidane','carles-puyol']],tactics:['possession','press'],seed:11,mode:'ko',traits:{enabled:true}},
 {teams:[['juan-carlos-valeron','roy-makaay','alan-shearer'],['sergio-busquets','gareth-bale','dennis-bergkamp']],tactics:['balanced','counter'],seed:44,mode:'ko',traits:{enabled:true}},
 {teams:[['ngolo-kante','trent-alexander-arnold','mohamed-salah'],['javier-zanetti','wayne-rooney','ronaldinho']],tactics:['press','balanced'],seed:103,mode:'ko',traits:{enabled:true}}
];
const after=scenarios.map(x=>JSON.stringify(engine.simulate(x)));
for(const p of ps)delete p.overall;
const before=scenarios.map(x=>JSON.stringify(engine.simulate(x)));
assert.deepEqual(before,after,'Adding OVR changed match outcomes');
assert.equal(ratings.apply(ps),CURRENT_ROSTER_SIZE);
assert(ps.every(x=>Number.isInteger(x.overall)));
console.log('OVERALL_ENGINE_INVARIANCE_PASS: '+CURRENT_ROSTER_SIZE+' ratings, three seeded tactical matches identical with and without OVR.');
