// Shared explicit exception list for the latest owner-approved ELITE skill revisions.
const path=require('path'),root=path.resolve(__dirname,'..');
const source=require(path.join(root,'proposals/ELITE_OVR_67_APPROVED.json'));
const changes=new Map(source.players.map(p=>[p.id,p]));
function expectedRatings(p){
 const n={...p.r},entry=changes.get(p.id);
 if(entry)for(const [k,pair] of Object.entries(entry.changes)){if(n[k]!==pair[0])throw Error('Historical ELITE source changed '+p.id+' '+k);n[k]=pair[1];}
 return n;
}
function expectedPosition(p){return p.id==='sinisa-mihajlovic'?'CB':p.position;}
function expectedAlternates(p){return p.id==='sinisa-mihajlovic'?['LB','CDM']:p.secondaryPositions;}
function expectedStat(id,key,old){const change=changes.get(id)?.changes?.[key];return change?change[1]:old;}
module.exports={source,changes,expectedRatings,expectedPosition,expectedAlternates,expectedStat};
