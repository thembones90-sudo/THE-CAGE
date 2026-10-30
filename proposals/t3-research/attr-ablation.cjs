// Controlled attribute sensitivity: +B to one attribute for all three players of side A, same seeds. (Claude research probe)
const vm=require('vm'),fs=require('fs');const eng=process.argv[2]||'src/cage-engine.js',N=+(process.argv[3]||3000),B=+(process.argv[4]||8);
const w={};const c=vm.createContext({window:w,console,Object,Math,Array,JSON,Error,TypeError,RangeError,Number,String,Set,Map,WeakMap,Symbol,Boolean});
for(const f of [require('path').join(__dirname,'..','..','src','players.js'),require('path').join(__dirname,'roster-expansion-63.js'),eng])vm.runInContext(fs.readFileSync(f,'utf8'),c);
const E=w.CageEngine,ids=E.ROSTER.map(p=>p.id),read0=w.CageAttributes.read;let boost=null,boosted=new Set();
w.CageAttributes.read=p=>{const a=read0(p);if(boost&&boosted.has(p.id))a[boost]=Math.min(100,a[boost]+B);return a;};
let s=4242;const R=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};const games=[];
for(let k=0;k<N;k++){const t=new Set();while(t.size<6)t.add(ids[Math.floor(R()*ids.length)]);const p=[...t];games.push({A:p.slice(0,3),B:p.slice(3),seed:(k*2654435761+11)>>>0,tac:['balanced','press','counter','possession'][k%4]});}
function run(attr){boost=attr;let w0=0,n=0,dur=0;for(const g of games){boosted=new Set(g.A);for(const sw of [0,1]){let r;try{r=E.simulate({teams:sw?[g.B,g.A]:[g.A,g.B],tactics:['balanced',g.tac],seed:g.seed+sw,mode:'ko'});}catch(e){continue;}n++;dur+=r.duration;if(r.winner===(sw?1:0))w0++;}}return {win:w0/n,n,dur:dur/n};}
const base=run(null);console.log(`engine ${E.VERSION}; ${N} pairings x2 sides; boost +${B}; baseline A win ${(100*base.win).toFixed(1)}%`);
const out=[];for(const a of ['finish','tech','pass','pace','phys','def','wr','sta','com','agi','mrk']){const r=run(a);out.push([a,100*(r.win-base.win)]);}
console.log(E.VERSION+": "+out.sort((x,y)=>y[1]-x[1]).map(([a,d])=>a+' '+(d>=0?'+':'')+d.toFixed(1)).join('  '));
