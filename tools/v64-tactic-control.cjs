'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const sources=[...read('play.html').matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(x=>x[1]),c={window:{location:{search:''}}};vm.createContext(c);
for(const f of sources){vm.runInContext(read(f),c,{filename:f});if(f==='src/cage-engine.js')break;}
const E=c.window.CageEngine,reportFile=path.join(root,'docs/V64_BALANCE_AUDIT.json'),report=JSON.parse(fs.readFileSync(reportFile,'utf8'));
const A=['paolo-maldini','michael-ballack','ronaldo-nazario'],B=['ledley-king','luka-modric','thierry-henry'],count=100;
const configs=[['balanced','balanced'],['press','possession'],['press','balanced'],['balanced','possession'],['possession','press']];
const rows=[];
for(const [ta,tb] of configs){let wins=0,caps=0;for(let n=0;n<count;n++)for(let x=0;x<2;x++){
 const cfg={teams:x?[B,A]:[A,B],tactics:x?[tb,ta]:[ta,tb],seed:780000+n,mode:'ko',traits:{enabled:true}};
 const r=E.simulate(cfg);if((x?r.winner===1:r.winner===0))wins++;
 if(r.score[0]+r.score[1]!==1)caps++;
}rows.push({commanderTactic:ta,opponentTactic:tb,matches:count*2,commanderWinsPct:wins/(count*2)*100,safetyCaps:caps});}
report.controlledTactics={explanation:'Same two fixed trios and paired seeds, with only tactics changed; side positions reversed to reduce side bias. Not a global conclusion about tactics.',teamA:A,teamB:B,rows};
fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
for(const row of rows)console.log('CONTROLLED_TACTIC',JSON.stringify(row));
console.log('V64_TACTIC_CONTROL_PASS',rows.reduce((a,b)=>a+b.matches,0),'matchups');
