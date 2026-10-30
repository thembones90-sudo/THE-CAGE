// Seeded diagnostics against the live engine; never tunes outcomes.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const f of ['players','cage-engine'])vm.runInContext(fs.readFileSync(path.join(root,'src',f+'.js'),'utf8'),ctx);
const E=ctx.window.CageEngine;
const squads={balanced:['paolo-maldini','michael-ballack','ronaldo-nazario'],creators:['nemanja-vidic','jay-jay-okocha','djalminha'],attackers:['ronaldo-nazario','ronaldinho','rivaldo'],twoForwards:['jaap-stam','dimitar-berbatov','obafemi-martins'],defenders:['paolo-maldini','giorgio-chiellini','lilian-thuram'],stoppers:['thomas-gravesen','jaap-stam','nemanja-vidic']};
const N=Number(process.env.CAGE_BALANCE_SEEDS||1000),rows=[];
function run(label,a,b,ta='balanced',tb='balanced',n=N){let wins=0,caps=0,kickWins=0,kickN=[0,0],sideWins=[0,0];const duration=[];
for(let seed=1;seed<=n;seed++){try{const r=E.simulate({teams:[a,b],tactics:[ta,tb],seed,mode:'ko'});assert.equal(r.events.filter(e=>e.type==='goal').length,1);assert.equal(r.events.at(-1).type,'goal');assert.equal(r.score[r.winner],1);assert(r.events.every(e=>e.n===3));wins+=r.winner===0;const kick=r.events[0].team;kickN[kick]++;sideWins[kick]+=r.winner===0;kickWins+=r.winner===kick;duration.push(r.duration);}catch(e){if(!e.message.includes('safety limit'))throw e;caps++;}}
duration.sort((a,b)=>a-b);const pct=q=>duration[Math.min(duration.length-1,Math.floor(duration.length*q))]||0;
const row={label,n,winsA:wins,winPct:+(100*wins/(n-caps)).toFixed(2),kickoffWinPct:+(100*kickWins/(n-caps)).toFixed(2),kickN,sideWins,caps,p50:pct(.5),p95:pct(.95),p99:pct(.99),max:pct(1)};rows.push(row);return row;}
for(const [a,b] of [['balanced','creators'],['balanced','attackers'],['balanced','twoForwards'],['creators','attackers'],['twoForwards','attackers'],['defenders','balanced']]){run(a+' vs '+b,squads[a],squads[b]);run(b+' vs '+a,squads[b],squads[a]);}
for(const ta of Object.keys(E.TACTICS))for(const tb of Object.keys(E.TACTICS))run('tactics '+ta+' / '+tb,squads.balanced,squads.creators,ta,tb);
run('balanced mirror',squads.balanced,squads.balanced);
run('defensive worst case',squads.defenders,squads.stoppers,'balanced','balanced',Math.max(10000,N));
run('defender mirror',squads.defenders,squads.defenders,'balanced','balanced',Math.max(10000,N));
const report='# Codex balance audit\n\nLive engine diagnostics; no ratings or parameters tuned. Ordinary rows use '+N+' seeds; worst-case rows use at least 10,000. Times are simulated seconds. Mirrors are diagnostic only. Sampling uncertainty is roughly ±3 percentage points at 1,000 seeds near 50%.\n\n| Matchup (A / B) | N | A win % | Kickoff win % | p50 | p95 | p99 | Max | Cap hits |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n'+rows.map(r=>'| '+[r.label,r.n,r.winPct,r.kickoffWinPct,r.p50,r.p95,r.p99,r.max,r.caps].join(' | ')+' |').join('\n')+'\n\nBalanced vs creators has a provisional 55–65% target, never an enforced outcome. Kickoff-conditioned counts are in the JSON. This checks one actual final goal and six players throughout, not universal balance.\n';
fs.writeFileSync(path.join(root,'CODEX_BALANCE_REPORT.md'),report);fs.writeFileSync(path.join(root,'tests','codex-balance-results.json'),JSON.stringify({engineVersion:E.VERSION,rows},null,2));
console.log(JSON.stringify({matches:rows.reduce((s,r)=>s+r.n,0),capHits:rows.reduce((s,r)=>s+r.caps,0),reference:rows[0],mirrors:rows.filter(r=>r.label.includes('mirror'))},null,2));
