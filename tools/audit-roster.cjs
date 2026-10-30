// THE CAGE roster audit: descriptive inventory, not a reclassification.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),ctx={window:{location:{search:'?engine=t3'}}};
vm.createContext(ctx);
for(const match of html.matchAll(new RegExp('<script src="(src/[^"]+)"></script>','g'))){
  if(match[1]==='src/cage-commentary.js')break;
  vm.runInContext(read(match[1]),ctx,{filename:match[1]});
}
const ps=ctx.window.THE_CAGE_PLAYERS;
const expected=['pace','tech','pass','finish','def','phys','first_touch','dribbling','passing','vision','finishing','shooting','stamina','physical','tackling','positioning','composure'];
const ex=['work_rate','stamina','composure','agility','marking'];
const catalog=new Set(['Wall','Enforcer','Anticipator','Tracker','Libero','Maestro','Architect','Destroyer','Engine','Surgeon','Predator','Magician','Executioner','Phantom','Juggernaut']);
const family=n=>['Wall','Enforcer','Anticipator','Tracker','Libero'].includes(n)?'D':['Maestro','Architect','Destroyer','Engine','Surgeon'].includes(n)?'M':'F';
const categories=new Set(['ACE','STALWART','ELITE','LEGEND','TITAN']),badges=new Set(['STREET HERO','STREET VILLAIN','UNDERDOG','TALISMAN']);
const normalize=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const counts=(items)=>Object.fromEntries([...new Set(items)].sort().map(x=>[x,items.filter(y=>y===x).length]));
const problems=[],warnings=[],nameMap=new Map(),idMap=new Set(),aliases=new Map(),rstats={},traitPairs=[];
const failures=(kind,id,detail)=>problems.push({kind,id,detail});
for(const p of ps){
 if(idMap.has(p.id))failures('duplicate-id',p.id,p.name);idMap.add(p.id);
 const nk=normalize(p.name);if(nameMap.has(nk))failures('duplicate-name',p.id,nameMap.get(nk));else nameMap.set(nk,p.id);
 if(!p.name||p.name.includes('\uFFFD')||/[\u0000-\u001f]/.test(p.name))failures('damaged-name',p.id,p.name);
 if(!['D','M','F'].includes(p.role))failures('invalid-role',p.id,p.role);
 if(!p.position)failures('no-position',p.id,'');
 if(!Array.isArray(p.secondaryPositions))failures('no-alternates',p.id,'');
 const st=new Set([...Object.keys(p.r||{}),...expected]);
 for(const k of expected){if(!Number.isFinite(p.r?.[k])||p.r[k]<0||p.r[k]>100)failures('invalid-rating',p.id,k+':'+p.r?.[k]);}
 if(Object.keys(p.r||{}).length!==17)failures('rating-count',p.id,Object.keys(p.r||{}).length);
 for(const k of ex){if(!Number.isFinite(p.attributes?.[k])||p.attributes[k]<0||p.attributes[k]>100)failures('invalid-supplement',p.id,k);}
 if(p.r?.pass!==p.r?.passing||p.r?.finish!==p.r?.finishing||p.r?.phys!==p.r?.physical)warnings.push({kind:'core-extended-disagreement',id:p.id,detail:[p.r.pass,p.r.passing,p.r.finish,p.r.finishing,p.r.phys,p.r.physical]});
 if(!catalog.has(p.traits?.primary)||!catalog.has(p.traits?.secondary)||p.traits.primary===p.traits.secondary)failures('trait-pair-invalid',p.id,JSON.stringify(p.traits));
 traitPairs.push(p.traits?family(p.traits.primary)+'-'+family(p.traits.secondary):'UNASSIGNED');
 if(p.careerTier&&!categories.has(p.careerTier))failures('tier-invalid',p.id,p.careerTier);
 if(p.folklore){if(!Array.isArray(p.folklore)||p.folklore.some(b=>!badges.has(b)))failures('folklore-invalid',p.id,p.folklore);}
 if((p.folklore||[]).includes('TALISMAN')&&(!Array.isArray(p.talismanClubs)||!p.talismanClubs.length))warnings.push({kind:'talisman-no-club',id:p.id,detail:p.name});
 if(p.talismanClubs?.length&&!(p.folklore||[]).includes('TALISMAN'))warnings.push({kind:'club-without-talisman',id:p.id,detail:p.name});
 if(p.r?.pace>=95&&p.r?.stamina<=60)warnings.push({kind:'very-fast-low-stamina',id:p.id,detail:[p.r.pace,p.r.stamina]});
 for(const k of expected){if(!rstats[k])rstats[k]=[];rstats[k].push({id:p.id,v:p.r[k]});}
 const aliasArr=[p.name,...(p.aliases||[])];
 for(const a of aliasArr){const k=normalize(a);if(!k)continue;const set=aliases.get(k)||new Set();set.add(p.id);aliases.set(k,set);}
}
const collision=[...aliases.entries()].filter(([k,ids])=>ids.size>1).map(([alias,ids])=>({alias,players:[...ids]})).sort((a,b)=>a.alias.localeCompare(b.alias));
const distribution={
 tier:counts(ps.map(p=>p.careerTier||'UNCLASSIFIED')),
 folklore:counts(ps.flatMap(p=>p.folklore||[])),
 folkloreCombos:counts(ps.map(p=>(p.folklore||[]).slice().sort().join(' + ')||'NONE')),
 primary:counts(ps.map(p=>p.traits?.primary||'UNASSIGNED')),secondary:counts(ps.map(p=>p.traits?.secondary||'UNASSIGNED')),
 position:counts(ps.map(p=>p.position)),role:counts(ps.map(p=>p.role)),
 pairFamilies:counts(traitPairs),
 ratingType:counts(ps.map(p=>p.ratingType||'UNSPECIFIED')),
 provisionalTactical:counts(ps.map(p=>String(!!p.attributesProvisional)))
};
const unclassified=ps.filter(p=>!p.careerTier).map(p=>({id:p.id,name:p.name,ratingType:p.ratingType}));
const missingFolklore=ps.filter(p=>!p.folklore).map(p=>p.id);
const scoreTop=Object.fromEntries(Object.entries(rstats).map(([k,a])=>[k,[...a].sort((x,y)=>y.v-x.v).slice(0,6)]));
const scoreExtreme=Object.fromEntries(Object.entries(rstats).map(([k,a])=>[k,{min:Math.min(...a.map(x=>x.v)),max:Math.max(...a.map(x=>x.v)),mean:Math.round(a.reduce((sum,x)=>sum+x.v,0)/a.length*10)/10}]));
const out={total:ps.length,uniqueIds:idMap.size,errors:problems,warnings,distribution,
 players:ps.map(p=>({id:p.id,name:p.name,country:p.country,role:p.role,position:p.position,secondaryPositions:p.secondaryPositions,careerTier:p.careerTier||null,folklore:p.folklore||null,traits:p.traits||null,ratingType:p.ratingType,provisionalTactical:!!p.attributesProvisional,r:p.r})),
 aliasCollisions:collision,unclassified,missingFolklore:missingFolklore.length,
 talismans:ps.filter(p=>(p.folklore||[]).includes('TALISMAN')).map(p=>({id:p.id,clubs:p.talismanClubs||[]})),
 underdogs:ps.filter(p=>(p.folklore||[]).includes('UNDERDOG')).map(p=>p.id),
 villains:ps.filter(p=>(p.folklore||[]).includes('STREET VILLAIN')).map(p=>p.id),
 topScores:scoreTop,scoreSummary:scoreExtreme,rosterVersion:ctx.window.CAGE_ROSTER_VERSION,
 engineVersion:ctx.window.CageEngine?.VERSION};
const dir=path.join(root,'docs');fs.mkdirSync(dir,{recursive:true});const f=path.join(dir,'roster-audit-178.json');fs.writeFileSync(f,JSON.stringify(out,null,2)+'\n');
console.log('AUDIT OUTPUT '+f);
const {players:allPlayers,...summary}=out;console.log(JSON.stringify({...summary,unclassified:unclassified.slice(0,12),topScores:undefined,scoreSummary:undefined},null,2));
