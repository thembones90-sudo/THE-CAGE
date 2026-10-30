const E=require('./engine'),C=require('./commentary');Object.assign(E.P,{k:22,clampLo:.12,clampHi:.88,foul:.01});
const id=s=>E.ROSTER.find(p=>p.name.includes(s)).id;const BMR=['Ballack','Maldini','Nazário'].map(id),OJV=['Okocha','Djalminha','Vidić'].map(id);
// pick a seed that produces a longer match, for a richer sample
let seed=+process.argv[2]||0;if(!seed){for(let s=1;s<400;s++){const r=E.simulate({teams:[BMR,OJV],tactics:['balanced','press'],seed:s});if(r.duration>150&&r.duration<260&&r.winner===1){seed=s;break}}}
const r=E.simulate({teams:[BMR,OJV],tactics:['balanced','press'],seed});
console.log('seed',seed,'score',r.score.join('-'),'duration',r.duration+'s','events',r.events.length);
for(const l of C.commentate(r,seed,['Ballack/Maldini/Ronaldo','Okocha/Djalminha/Vidić']))console.log(`${C.mmss(l.t)} ${'!'.repeat(l.imp).padEnd(3)} ${l.text}`);
const st=E.stats(r,[BMR,OJV]);console.log(JSON.stringify(st.map(s=>s.team)));
