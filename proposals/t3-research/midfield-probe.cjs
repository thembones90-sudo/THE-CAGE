// How does T3 progress the ball, and does passing quality show? (Claude research probe)
const vm=require('vm'),fs=require('fs'),path=require('path');const eng=process.argv[2]||'src/cage-engine.js';
const w={};const c=vm.createContext({window:w,console,Object,Math,Array,JSON,Error,TypeError,RangeError,Number,String,Set,Map,WeakMap,Symbol,Boolean});
for(const f of [require('path').join(__dirname,'..','..','src','players.js'),require('path').join(__dirname,'roster-expansion-63.js'),eng])vm.runInContext(fs.readFileSync(f,'utf8'),c);
const E=w.CageEngine,ids=E.ROSTER.map(p=>p.id);let s=1;const R=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};
const prog={carry:0,pass:0,through_ball:0,dribble_duel:0,wall_pass:0},att={carry:0,pass:0,through_ball:0,dribble_duel:0,wall_pass:0},lost={pass:0,through_ball:0,dribble_duel:0,wall_pass:0};
const byQ=[[0,0],[0,0],[0,0],[0,0]];let unengagedCarry=0;
for(let k=0;k<4000;k++){const pick=()=>{const t=new Set();while(t.size<6)t.add(ids[Math.floor(R()*ids.length)]);return [...t];};const p=pick();
const r=E.simulate({teams:[p.slice(0,3),p.slice(3)],tactics:['balanced','balanced'],seed:(k*2654435761)>>>0,mode:'ko'});
for(const e of r.events){if(!(e.type in att))continue;att[e.type]++;const from=e.zone?e.zone.x:0;
 if(e.type==='carry'){if(e.outcome!=='checked')prog.carry+=1;else lost.checked=(lost.checked||0)+1;continue;}
 if(e.type==='pass'||e.type==='through_ball'){if(e.outcome==='complete')prog[e.type]+=Math.max(0,e.to.x-from);else lost[e.type]++;
   if(e.type==='pass'&&e.opp){const pc=E.comp(E.BY_ID[e.actor]).pass;const q=pc<70?0:pc<78?1:pc<86?2:3;byQ[q][0]++;if(e.outcome==='complete')byQ[q][1]++;}}
 else{if(e.outcome==='attacker_wins')prog[e.type]+=from<3?1:0;else if(e.outcome==='defender_wins')lost[e.type]++;}}}
const totP=Object.values(prog).reduce((a,b)=>a+b,0);
console.log('share of forward progress (zones gained):',Object.entries(prog).map(([k,v])=>k+' '+(100*v/totP).toFixed(1)+'%').join(', '));
console.log('loss rate per attempt:',Object.entries(lost).map(([k,v])=>k+' '+(100*v/att[k]).toFixed(1)+'%').join(', '),'| carry 0% (never contested)');
console.log('zones gained per attempt:',Object.entries(prog).map(([k,v])=>k+' '+(v/att[k]).toFixed(2)).join(', '));
console.log('contested pass completion by passer pass composite <70/70-78/78-86/86+:',byQ.map(([n,o])=>n?(100*o/n).toFixed(1)+'% (n'+n+')':'—').join(' / '));
