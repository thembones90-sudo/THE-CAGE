'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const oldRoot=process.argv[2];if(!oldRoot)throw Error('Pass clean V5.3 worktree to generate immutable Classic parity baseline');
const oldW=require(path.resolve(oldRoot,'tests/viewer/harness.cjs')).loadEngine();
const E=oldW.CAGE_ENGINE_REGISTRY['cage-0.4.0'];assert(E);
const rosters=[
 [['paolo-maldini','michael-ballack','ronaldo-nazario'],['nemanja-vidic','jay-jay-okocha','djalminha']],
 [['roy-keane','paul-scholes','ryan-giggs'],['claude-makelele','frank-lampard','michael-essien']],
 [['lionel-messi','luka-modric','zinedine-zidane'],['cristiano-ronaldo','sergio-ramos','andres-iniesta']],
 [['gareth-bale','sergio-busquets','sami-hyypia'],['ruud-gullit','gianfranco-zola','alan-shearer']]
];

const records=[];
for(let i=0;i<150;i++){
 const cfg={teams:rosters[i%rosters.length],tactics:['balanced','counter','press','possession'].slice(i%2,i%2+2),seed:i*1093+39,mode:'ko'};
 const result=E.simulate(cfg);
 records.push({config:cfg,sha256:crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex'),winner:result.winner,score:result.score});
}
fs.writeFileSync(path.resolve(__dirname,'../tests/v54-classic-parity-fixtures.json'),JSON.stringify({source:'clean V5.3 c049502, Classic v0.4.0, 150 deterministic full-result JSON SHA256',records},null,2)+'\n');
console.log('CLASSIC_FIXTURE_EXPORT',records.length);
