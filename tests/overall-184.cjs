const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const roster=JSON.parse(read('docs/roster-audit-184-current.json')).players;
const prior=JSON.stringify(roster.map(p=>[p.id,p.r,p.careerTier,p.folklore,p.traits]));
const ctx={window:{THE_CAGE_PLAYERS:roster}};vm.createContext(ctx);
vm.runInContext(read('src/overall.js'),ctx,{filename:'src/overall.js'});
const api=ctx.window.CageOverall,ovr=new Map(roster.map(p=>[p.id,p.overall]));
assert.equal(api.loadedPlayers,184);assert.equal(ovr.size,184);
for(const p of roster){assert(Number.isInteger(p.overall)&&p.overall>=1&&p.overall<=99,p.id+' invalid OVR');assert.equal(api.compute(p),p.overall);assert.equal(api.read(p),p.overall);}
assert.equal(JSON.stringify(roster.map(p=>[p.id,p.r,p.careerTier,p.folklore,p.traits])),prior,'OVR changed original player data');
const a=roster[0],val=a.overall;
a.careerTier='TITAN';a.folklore=['STREET HERO'];a.traits={primary:'Magician',secondary:'Wall'};
assert.equal(api.compute(a),val,'overall illegally depends on tier/folklore/traits');
a.position='ST';assert.notEqual(api.compute(a),val,'overall should depend on natural position');
const cbBase=roster.find(p=>p.position==='CB'),stBase=roster.find(p=>p.position==='ST');
const fake={id:'cb-synthetic',position:'CB',r:{...cbBase.r,pace:70,tech:65,pass:65,finish:0,def:98,phys:95,tackling:98,positioning:98}},striker={id:'st-synthetic',position:'ST',r:{...stBase.r,pace:95,tech:90,pass:68,finish:98,def:0,phys:88,positioning:98,shooting:98,composure:95}};
assert(api.compute(fake)>=84,'elite CB penalized for finishing');assert(api.compute(striker)>=90,'elite ST penalized for defence');
const stats=[...ovr.entries()].map(([id,n])=>({id,name:roster.find(p=>p.id===id).name,n,position:roster.find(p=>p.id===id).position})).sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name));
const bins={};for(const o of stats){const k=o.n>=90?'90–99':o.n>=85?'85–89':o.n>=80?'80–84':o.n>=75?'75–79':'<75';bins[k]=(bins[k]||0)+1;}
console.log('OVR_VALIDATION_PASS 184/184, tier independent, positions specialized; distribution '+JSON.stringify(bins));
for(const id of ['lionel-messi','cristiano-ronaldo','ronaldo-nazario','paolo-maldini','gareth-bale','sergio-busquets','juan-carlos-valeron','roy-makaay','ailton','dennis-bergkamp','alessandro-nesta','juan-arango','steed-malbranque']){const v=stats.find(x=>x.id===id);console.log(v?.name+' | '+v?.position+' | '+v?.n);}
console.log('HIGHEST',JSON.stringify(stats.slice(0,12)));
console.log('LOWEST',JSON.stringify(stats.slice(-12)));
