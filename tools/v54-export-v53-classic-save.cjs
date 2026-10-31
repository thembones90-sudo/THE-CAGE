'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const oldRoot=process.argv[2];if(!oldRoot)throw Error('Pass clean V5.3 root');
const oldHtml=fs.readFileSync(path.join(oldRoot,'index.html'),'utf8');
const scripts=[...oldHtml.matchAll(/<script src="(src\/[^"]+)"/g)].map(m=>m[1]);
const context={window:{location:{search:''}}};vm.createContext(context);
for(const f of scripts){if(f==='src/showdown.js')break;vm.runInContext(fs.readFileSync(path.join(oldRoot,f),'utf8'),context,{filename:f});}
const E=context.window.CageEngine,R=context.window.CageRecords;
assert.equal(E.VERSION,'cage-0.4.0');
const lineups=[
 [['paolo-maldini','michael-ballack','ronaldo-nazario'],['nemanja-vidic','jay-jay-okocha','djalminha']],
 [['roy-keane','paul-scholes','ryan-giggs'],['claude-makelele','frank-lampard','michael-essien']],
 [['lionel-messi','luka-modric','zinedine-zidane'],['cristiano-ronaldo','sergio-ramos','andres-iniesta']]
];
const history=[],wins={A:0,B:0},used=[];
for(let r=0;r<3;r++){
 const config={teams:lineups[r],tactics:['balanced','counter'],seed:1044+r,mode:'ko'},result=E.simulate(config);
 const rec=R.make(config,result,r+1);
 R.reproduce(rec);
 wins[rec.result.winner===0?'A':'B']++;
 history.push(rec);
 for(const [i,side] of ['A','B'].entries())for(const id of config.teams[i])used.push([id,side]);
}
const final=lineups[2],save={schema:1,round:3,wins,used,
 claimed:{A:final[0],B:final[1]},locked:{A:true,B:true},
 drafts:{A:final[0],B:final[1]},tactics:{A:'balanced',B:'counter'},
 pace:'normal',roundFinished:true,history,pending:null,traitsMode:false};
R.validateSave(save);
const file=path.resolve(__dirname,'../tests/v54-classic-v53-3round.json');
fs.writeFileSync(file,JSON.stringify(save,null,2)+'\n');
console.log('V53_CLASSIC_THREE_ROUND_FIXTURE',file,'bytes',fs.statSync(file).size,'wins',JSON.stringify(wins),'replays',history.length);
