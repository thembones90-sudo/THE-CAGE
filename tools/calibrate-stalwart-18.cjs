const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const players=JSON.parse(read('docs/roster-audit-184-current.json')).players;
const targets={
'adel-taarabt':83,'mario-balotelli':85,'nani':87,'obafemi-martins':84,
'hatem-ben-arfa':85,'papiss-cisse':83,'alberto-luque':84,'yannick-bolasie':81,
'denilson':83,'peter-crouch':84,'steed-malbranque':82,'tijjani-babangida':81,
'nene':84,'tugay-kerimoglu':83,'aiden-mcgeady':81,'morten-gamst-pedersen':82,
'thomas-gravesen':81,'marouane-fellaini':84};
const focus={
'adel-taarabt':['pass','vision','composure','first_touch','tech'],
'mario-balotelli':['finish','composure','shooting','first_touch'],
'nani':['pass','vision','composure','first_touch'],
'obafemi-martins':['finish','first_touch','dribbling','composure'],
'hatem-ben-arfa':['pass','vision','composure','first_touch'],
'papiss-cisse':['finish','composure','shooting','first_touch'],
'alberto-luque':['finish','shooting','composure'],
'yannick-bolasie':['pass','vision','composure','first_touch'],
'denilson':[],
'peter-crouch':['finish','composure','first_touch','stamina'],
'steed-malbranque':[],
'tijjani-babangida':['finish','composure','first_touch'],
'nene':['pass','vision','composure','first_touch'],
'tugay-kerimoglu':['def','tackling','positioning','composure','stamina','vision'],
'aiden-mcgeady':['pass','vision','composure','first_touch'],
'morten-gamst-pedersen':['pass','vision','composure','first_touch','stamina'],
'thomas-gravesen':['def','tackling','positioning','pass','composure','stamina'],
'marouane-fellaini':['def','tackling','positioning','pass','vision','composure','stamina','first_touch','tech','pace']};
const protect={
'adel-taarabt':['dribbling','tech'],
'mario-balotelli':['phys','shooting'],
'nani':['pace','dribbling'],
'obafemi-martins':['pace'],
'hatem-ben-arfa':['dribbling','tech'],
'papiss-cisse':['positioning'],
'yannick-bolasie':['pace','dribbling'],
'denilson':['tech','dribbling'],
'peter-crouch':['phys','positioning'],
'tijjani-babangida':['pace'],
'nene':['tech'],
'tugay-kerimoglu':['pass'],
'aiden-mcgeady':['dribbling'],
'morten-gamst-pedersen':['pass'],
'thomas-gravesen':['phys'],
'marouane-fellaini':['phys','pace']};
const c={window:{THE_CAGE_PLAYERS:players}};vm.createContext(c);vm.runInContext(read('src/overall.js'),c);
const api=c.window.CageOverall,aliases={pass:'passing',finish:'finishing',phys:'physical'};
const keys=['pace','tech','pass','finish','def','phys','first_touch','dribbling','vision','shooting','stamina','tackling','positioning','composure'];
const out=[];
for(const [id,target] of Object.entries(targets)){
 const p=players.find(x=>x.id===id);if(!p||p.careerTier!=='STALWART')throw Error('Missing stalwart '+id);
 const before={...p.r},initial=p.overall,dir=Math.sign(target-initial);
 let count=0;
 while(api.raw(p)!==target && count++<1200){
  const score=api.evaluate(p).score;
  let best=null;
  for(const key of keys){
   if((protect[id]||[]).includes(key))continue;
   const f=focus[id]||[];
   if(f.length && !f.includes(key))continue;
   const current=p.r[key],original=before[key],maxChange=(id==='marouane-fellaini'||id==='thomas-gravesen')?22:16;
   if(current+dir<20||current+dir>98||Math.abs(current+dir-original)>maxChange)continue;
   p.r[key]=current+dir;const next=api.evaluate(p).score;p.r[key]=current;
   const improvement=dir*(next-score);
   if(improvement<=0.00001)continue;
   const change=Math.abs(current+dir-original);
   const penalty=1 + .045*change + (current+dir>=95?.45:0) + (current+dir<=45?.25:0);
   const value=improvement/penalty;
   if(!best||value>best.value)best={key,value};
  }
  if(!best)throw Error('Cannot calibrate '+id+' at '+api.raw(p)+' score '+api.evaluate(p).score.toFixed(2));
  p.r[best.key]+=dir;if(aliases[best.key])p.r[aliases[best.key]]=p.r[best.key];
 }
 if(api.raw(p)!==target)throw Error('Cannot converge '+id);
 const changes=Object.fromEntries(Object.keys(before).filter(k=>before[k]!==p.r[k]).map(k=>[k,[before[k],p.r[k]]]));
 out.push({id,name:p.name,previous:initial,target,position:p.position,score:api.evaluate(p).score,changes});
 console.log(p.name,initial+' -> '+api.raw(p),'score',api.evaluate(p).score,'changes',JSON.stringify(changes));
}
const data={version:'stalwart-ovr-v1-owner-approved',status:'OWNER-ACCEPTED',description:'18 STALWART prime attributes recalibrated to owner-approved formula OVR. No OVR overrides.',players:out};
fs.writeFileSync(path.join(root,'proposals/STALWART_OVR_18_APPROVED.json'),JSON.stringify(data,null,2)+'\n');
