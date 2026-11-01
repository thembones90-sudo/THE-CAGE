const fs=require('fs'),vm=require('vm'),path=require('path');
const root='A:/THE CAGE',file=path.join(root,'proposals/ELITE_OVR_67_REVIEW_DRAFT.json');
const draft=JSON.parse(fs.readFileSync(file,'utf8'));
const audit=JSON.parse(fs.readFileSync(path.join(root,'docs/roster-audit-184-current.json'),'utf8'));
const ctx={window:{THE_CAGE_PLAYERS:audit.players}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'src/overall.js'),'utf8'),ctx);
const elite=audit.players.filter(x=>x.careerTier==='ELITE'),lookup=new Map(elite.map(x=>[x.name,x])),seen=new Set();
for(const t of draft.ratings){
 const p=lookup.get(t.name);
 if(!p||seen.has(t.name))throw Error('Missing or repeated ELITE '+t.name);
 seen.add(t.name);t.id=p.id;t.position=p.position;t.current=p.overall;t.change=t.target-p.overall;
}
if(draft.ratings.length!==67||elite.length!==67||seen.size!==67)throw Error('Not all ELITEs reviewed');
draft.snapshot={date:'2026-10-31',rosterTotal:audit.total,eliteCount:elite.length,current90plus:elite.filter(x=>x.overall>=90).length,proposed90plus:draft.ratings.filter(x=>x.target>=90).length,raised:draft.ratings.filter(x=>x.change>0).length,lowered:draft.ratings.filter(x=>x.change<0).length,unchanged:draft.ratings.filter(x=>x.change===0).length};
fs.writeFileSync(file,JSON.stringify(draft,null,2)+'\n','utf8');
console.log('67-person draft validated and snapshotted:',JSON.stringify(draft.snapshot));
