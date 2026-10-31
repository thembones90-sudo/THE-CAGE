// Owner-approved four-player recruitment and Ledley King folklore.
(()=>{'use strict';
const roster=window.THE_CAGE_PLAYERS;
if(roster.length!==190)throw Error('Expected 190-player recruitment baseline');
const data=[
['gianluca-zambrotta','Gianluca Zambrotta','Italy','D','RB',['LB'],'LEGEND',90,['Hunter','Anticipator'],[88,86,85,69,95,84],[86,83,85,82,69,78,91,84,92,90,89]],
['antonio-valencia','Antonio Valencia','Ecuador','F','RW',['RB'],'ELITE',87,['Engine','Hunter'],[96,83,94,75,66,88],[83,85,94,81,75,81,91,88,68,80,85]],
['claudio-marchisio','Claudio Marchisio','Italy','M','CM',['CDM'],'ELITE',88,['Engine','Architect'],[80,87,90,80,83,79],[89,85,90,88,80,83,91,79,84,87,89]],
['mauro-camoranesi','Mauro Camoranesi','Italy','M','RM',['RW'],'ELITE',88,['Maestro','Engine'],[86,91,95,74,67,74],[91,89,95,90,74,81,85,74,68,83,86]]
];
const ck=['pace','tech','pass','finish','def','phys'],dk=['first_touch','dribbling','passing','vision','finishing','shooting','stamina','physical','tackling','positioning','composure'];
const clubs={'antonio-valencia':'Manchester United','claudio-marchisio':'Juventus'};
for(const [id,name,country,role,position,secondaryPositions,careerTier,target,traits,core,detail] of data){
if(roster.some(p=>p.id===id))throw Error('Duplicate '+id);
const r=Object.fromEntries([...ck.map((k,i)=>[k,core[i]]),...dk.map((k,i)=>[k,detail[i]])]);
const p={id,name,country,role,position,secondaryPositions,aliases:[name.toLowerCase()],peak:'prime',careerTier,folklore:clubs[id]?['TALISMAN']:[],traits:{primary:traits[0],secondary:traits[1]},r,ratingType:'owner-approved-recruitment-v1'};
if(clubs[id])p.talismanClubs=[clubs[id]];
p.overall=window.CageOverall.raw(p);
if(p.overall!==target)throw Error(id+' target '+target+' actual '+p.overall+' score '+window.CageOverall.evaluate(p).score);
roster.push(p);
window.CAGE_ROSTER_EXTRA_RATINGS=Object.assign({},window.CAGE_ROSTER_EXTRA_RATINGS||{},{[id]:{work_rate:r.stamina,stamina:r.stamina,composure:r.composure,agility:r.dribbling,marking:r.tackling}});
}
const king=roster.find(p=>p.id==='ledley-king');
if(!king||king.careerTier!=='ELITE')throw Error('Ledley King missing or changed tier');
king.folklore=[...new Set([...(king.folklore||[]),'STREET HERO','TALISMAN'])];
king.talismanClubs=[...new Set([...(king.talismanClubs||[]),'Tottenham Hotspur'])];
// Normalize historic Tracker and cross-family secondary classes for every recruit.
for(const player of roster){for(const slot of ['primary','secondary'])if(player.traits?.[slot]==='Tracker')player.traits[slot]='Hunter';}
// Every secondary must come from a DIFFERENT family than primary (V5.4 rule).
const secondaryCorrections={'roy-makaay':'Engine','freddy-adu':'Maestro','federico-macheda':'Engine','andriy-shevchenko':'Engine','paolo-di-canio':'Maestro','gianluca-zambrotta':'Engine','claudio-marchisio':'Anticipator','mauro-camoranesi':'Hunter'};
for(const player of roster)if(secondaryCorrections[player.id])player.traits.secondary=secondaryCorrections[player.id];
const families={D:['Wall','Enforcer','Anticipator','Hunter','Libero'],M:['Maestro','Architect','Destroyer','Engine','Surgeon'],A:['Predator','Magician','Executioner','Phantom','Juggernaut']};
const familyOf=trait=>Object.keys(families).find(k=>families[k].includes(trait));
for(const player of roster){const a=familyOf(player.traits?.primary),b=familyOf(player.traits?.secondary);if(!a||!b||a===b)throw Error('Invalid cross-family traits for '+player.id);}
window.CAGE_ROSTER_VERSION+='-four-recruits-v1';
if(roster.length!==194)throw Error('Expected 194 players');
})();