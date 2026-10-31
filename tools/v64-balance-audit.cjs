'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const files=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(x=>x[1]),c={window:{location:{search:''}}};vm.createContext(c);
for(const f of files){vm.runInContext(read(f),c,{filename:f});if(f==='src/cage-engine.js')break;}
const E=c.window.CageEngine,ps=c.window.THE_CAGE_PLAYERS,count=Number(process.argv.find(x=>x.startsWith('--pairs='))?.split('=')[1]||100);
if(ps.length!==194||!Number.isInteger(count)||count<10)throw Error('Invalid roster/pairs');
const scenarios=[
 {label:'Prime creators vs elite all-round trio',A:['paolo-maldini','zinedine-zidane','ronaldo-nazario'],B:['ledley-king','claudio-marchisio','antonio-valencia'],tA:'balanced',tB:'balanced'},
 {label:'Three defenders vs conventional balance',A:['paolo-maldini','nemanja-vidic','jaap-stam'],B:['giorgio-chiellini','francesco-totti','gabriel-batistuta'],tA:'balanced',tB:'balanced'},
 {label:'Three forwards vs balanced high-end',A:['lionel-messi','cristiano-ronaldo','thierry-henry'],B:['ledley-king','claudio-marchisio','andriy-shevchenko'],tA:'balanced',tB:'balanced'},
 {label:'Three midfielders vs conventional balance',A:['luka-modric','andrea-pirlo','michael-ballack'],B:['paolo-maldini','francesco-totti','ronaldo-nazario'],tA:'balanced',tB:'balanced'},
 {label:'Press vs possession tactical differential',A:['paolo-maldini','michael-ballack','ronaldo-nazario'],B:['ledley-king','luka-modric','thierry-henry'],tA:'press',tB:'possession'}
];
const results=[];
for(let s=0;s<scenarios.length;s++){
 const z=scenarios[s],dur=[],starts=[0,0],winner=[0,0],timeouts=0,hashes=new Set();let n=0,goals=0;
 for(let i=0;i<count;i++)for(let swap=0;swap<2;swap++){
  const A=swap?z.B:z.A,B=swap?z.A:z.B,ta=swap?z.tB:z.tA,tb=swap?z.tA:z.tB;
  for(const id of [...A,...B])if(!E.BY_ID[id])throw Error('Unknown '+id);
  const cfg={teams:[A,B],tactics:[ta,tb],seed:940000+s*10000+i,mode:'ko',traits:{enabled:true}};
  const r=E.simulate(cfg);
  if(i===0){const repeat=E.simulate(cfg);if(r.eventHash!==repeat.eventHash)throw Error('Nondeterministic replay '+z.label);}
  const w=swap?1-r.winner:r.winner;winner[w]++;starts[swap]++;dur.push(r.duration);goals+=r.score[0]+r.score[1];
  if(r.score[0]+r.score[1]!==1)timeouts++;
  hashes.add(r.eventHash);n++;
 }
 dur.sort((a,b)=>a-b);
 const line={label:z.label,matches:n,pairedSeeds:count,sideAWinPct:+(100*winner[0]/n).toFixed(1),sideBWinPct:+(100*winner[1]/n).toFixed(1),safetyCaps:timeouts,p50Seconds:dur[Math.floor((dur.length-1)*.5)],p95Seconds:dur[Math.floor((dur.length-1)*.95)],uniqueEventHashes:hashes.size};
 console.log('BALANCE',JSON.stringify(line));results.push(line);
}
const tiers={};for(const p of ps){let k=p.careerTier||'UNKNOWN';(tiers[k]??=[]).push(Number(p.overall));}
const ranges=Object.fromEntries(Object.entries(tiers).map(([k,a])=>[k,{count:a.length,min:Math.min(...a),median:a.sort((x,y)=>x-y)[Math.floor(a.length/2)],max:Math.max(...a)}]));
const report={version:'V6.4 initial 194-player paired-seed audit',engine:E.VERSION,roster:ps.length,traitsEnabled:true,seedPairsPerScenario:count,totalMatches:results.reduce((n,x)=>n+x.matches,0),tierOverallRanges:ranges,scenarios:results,note:'Diagnostic, not a calibrated game-balance acceptance threshold; asymmetric squads vary in talent. Each seed is repeated with both sides reversed.'};
const dest=path.join(root,'docs/V64_BALANCE_AUDIT.json');fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
console.log('V64_BALANCE_AUDIT_COMPLETE',JSON.stringify({matches:report.totalMatches,scenarios:results.length,ranges}));
