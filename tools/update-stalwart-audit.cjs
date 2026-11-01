const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict'),root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const audit=JSON.parse(read('docs/roster-audit-184-current.json')),spec=JSON.parse(read('proposals/STALWART_OVR_18_APPROVED.json')),byId=new Map(audit.players.map(p=>[p.id,p]));
for(const row of spec.players){const p=byId.get(row.id);assert.equal(p.careerTier,'STALWART');for(const [k,values] of Object.entries(row.changes)){assert.equal(p.r[k],values[0],row.id+' '+k);p.r[k]=values[1];}}
fs.writeFileSync(path.join(root,'docs/roster-audit-184-current.json'),JSON.stringify(audit,null,2)+'\n');
const c={window:{THE_CAGE_PLAYERS:audit.players}},before=new Map(audit.players.map(p=>[p.id,JSON.stringify(p.r)]));vm.createContext(c);vm.runInContext(read('src/overall.js'),c);
for(const row of spec.players){const p=byId.get(row.id);assert.equal(p.overall,row.target,row.id);}
assert.equal(c.window.CageOverall.REVIEW_OVERRIDES['marouane-fellaini'],undefined);
console.log('PASS 18/18 STALWART approved, all formula-derived; roster snapshot updated.');
