// Midfield value beyond goals-per-possession: OLS of win, opponent shots/min and own possession share on
// z-scored team means of ATT/MID/DEF (own and opponent). Random teams, balanced tactics. (Claude research probe)
const vm=require('vm'),fs=require('fs');const eng=process.argv[2]||'src/cage-engine.js',N=+(process.argv[3]||8000);
const w={};const c=vm.createContext({window:w,console,Object,Math,Array,JSON,Error,TypeError,RangeError,Number,String,Set,Map,WeakMap,Symbol,Boolean});
for(const f of [require('path').join(__dirname,'..','..','src','players.js'),require('path').join(__dirname,'roster-expansion-63.js'),eng])vm.runInContext(fs.readFileSync(f,'utf8'),c);
const E=w.CageEngine,ids=E.ROSTER.map(p=>p.id);let s=99;const R=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};
const cm=id=>E.comp(E.BY_ID[id]),mean=(t,k)=>t.reduce((a,id)=>a+cm(id)[k],0)/3;const rows=[];
for(let k=0;k<N;k++){const t=new Set();while(t.size<6)t.add(ids[Math.floor(R()*ids.length)]);const p=[...t],A=p.slice(0,3),B=p.slice(3);let r;
 try{r=E.simulate({teams:[A,B],tactics:['balanced','balanced'],seed:(k*2654435761+7)>>>0,mode:'ko'});}catch(e){continue;}
 let oppShots=0,poss=[0,0],prev=0,cur=null;for(const e of r.events){if(cur!==null)poss[cur]+=e.t-prev;prev=e.t;if(['restart','turnover'].includes(e.type)||(e.type==='rebound'&&e.outcome==='defence_clears'))cur=e.team;if(e.type==='shot_attempt'&&e.team===1)oppShots++;}
 rows.push({x:[mean(A,'ATT'),mean(A,'MID'),mean(A,'DEF'),mean(B,'ATT'),mean(B,'MID'),mean(B,'DEF')],win:r.winner===0?1:0,oppSpm:oppShots/(r.duration/60),share:poss[0]/Math.max(1,poss[0]+poss[1])});}
const K=6,mu=[...Array(K)].map((_,j)=>rows.reduce((a,r)=>a+r.x[j],0)/rows.length),sd=[...Array(K)].map((_,j)=>Math.sqrt(rows.reduce((a,r)=>a+(r.x[j]-mu[j])**2,0)/rows.length));
function ols(y){const X=rows.map(r=>[1,...r.x.map((v,j)=>(v-mu[j])/sd[j])]),n=K+1,A=[...Array(n)].map(()=>Array(n).fill(0)),b=Array(n).fill(0);
 X.forEach((x,i)=>{for(let a=0;a<n;a++){b[a]+=x[a]*y[i];for(let c2=0;c2<n;c2++)A[a][c2]+=x[a]*x[c2];}});
 for(let i=0;i<n;i++){let m=i;for(let r=i+1;r<n;r++)if(Math.abs(A[r][i])>Math.abs(A[m][i]))m=r;[A[i],A[m]]=[A[m],A[i]];[b[i],b[m]]=[b[m],b[i]];for(let r=0;r<n;r++)if(r!==i){const f=A[r][i]/A[i][i];for(let c2=i;c2<n;c2++)A[r][c2]-=f*A[i][c2];b[r]-=f*b[i];}}
 return b.map((v,i)=>v/A[i][i]);}
const names=['ownATT','ownMID','ownDEF','oppATT','oppMID','oppDEF'];
for(const [lab,y,fmt] of [['win prob (pts per +1SD)',rows.map(r=>r.win),v=>(100*v).toFixed(1)],['opp shots/min',rows.map(r=>r.oppSpm),v=>v.toFixed(3)],['own possession share (pts)',rows.map(r=>r.share),v=>(100*v).toFixed(1)]]){const b=ols(y);console.log(lab.padEnd(28)+names.map((n,i)=>n+' '+fmt(b[i+1])).join('  ')+'   (intercept '+fmt(b[0])+')');}
console.log('n='+rows.length+'  engine '+E.VERSION);
