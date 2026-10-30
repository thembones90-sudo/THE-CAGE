const E=require('./engine');const id=s=>E.ROSTER.find(p=>p.name.includes(s)).id;const tri=a=>a.map(id);
const N=+process.argv[2]||3000;if(process.env.PP){const o=JSON.parse(process.env.PP);for(const k in o){if(typeof o[k]==='object')Object.assign(E.P[k],o[k]);else E.P[k]=o[k]}}
function run(a,b,ta='balanced',tb='balanced',n=N){let w=0,dur=[],gk={},sc={},esc2=0,esc1=0,coin=0,shots=0;for(let s=1;s<=n;s++){
 // swap sides on odd seeds to cancel kickoff bias
 const sw=s%2,r=E.simulate({teams:sw?[b,a]:[a,b],tactics:sw?[tb,ta]:[ta,tb],seed:(s*2654435761)>>>0});const aw=sw?r.winner===1:r.winner===0;if(aw)w++;dur.push(r.duration);
 for(const e of r.events){if(e.type==='goal'){gk[e.kind]=(gk[e.kind]||0)+1;sc[e.actor]=(sc[e.actor]||0)+1}if(e.type==='escalation'){e.to==='2v2'?esc2++:esc1++}if(e.type==='decider_xg')coin++;if(e.type==='shot_attempt')shots++}}
 dur.sort((x,y)=>x-y);return {win:(w/n*100).toFixed(1),medDur:dur[n>>1],p90:dur[Math.floor(n*.9)],to2v2:(esc2/n*100).toFixed(1),to1v1:(esc1/n*100).toFixed(1),coin:(coin/n*100).toFixed(2),shots:(shots/n).toFixed(1),gk,sc}}
const T={BMR:tri(['Ballack','Maldini','Nazário']),OJV:tri(['Okocha','Djalminha','Vidić']),FFF:tri(['Batistuta','Ibrahimović','Adriano']),R3:tri(['Ronaldinho','Zidane','Rivaldo']),KYH:tri(['Kanté','Yaya','Hazard']),MOS:tri(['Martins','Owen','Stam']),RQD:tri(['Riquelme','Quaresma','Davids']),DDD:tri(['Maldini','Chiellini','Thuram']),GRIT:tri(['Gravesen','Stam','Vidić']),ART:tri(['Okocha','Aimar','Denílson'])};
const mode=process.argv[3]||'main';
if(mode==='main'){
for(const [a,b,ta,tb] of [['BMR','OJV'],['BMR','FFF'],['BMR','BMR'],['R3','KYH'],['MOS','RQD','counter','balanced'],['MOS','RQD','possession','balanced'],['DDD','ART'],['GRIT','R3'],['FFF','DDD']]){const r=run(T[a],T[b],ta,tb);console.log(`${a}${ta?'('+ta+')':''} vs ${b}: A win ${r.win}% | median ${r.medDur}s p90 ${r.p90}s | 2v2 ${r.to2v2}% 1v1 ${r.to1v1}% coin ${r.coin}% | shots/match ${r.shots} | goals by kind ${JSON.stringify(r.gk)}`)}
const r=run(T.BMR,T.OJV);console.log('scorers BMR v OJV',JSON.stringify(r.sc));
}
if(mode==='tactics'){const K=Object.keys(E.TACTICS);for(const tm of ['BMR','OJV','FFF','RQD']){console.log('\n'+tm+' mirror, row tactic win%');console.log(''.padEnd(11)+K.map(k=>k.padStart(11)).join(''));for(const a of K)console.log(a.padEnd(11)+K.map(b=>run(T[tm],T[tm],a,b,N).win.padStart(11)).join(''))}}
if(mode==='det'){const a=E.simulate({teams:[T.BMR,T.OJV],tactics:['press','counter'],seed:99}),b=E.simulate({teams:[T.BMR,T.OJV],tactics:['press','counter'],seed:99});console.log('deterministic',JSON.stringify(a)===JSON.stringify(b),'events',a.events.length)}
