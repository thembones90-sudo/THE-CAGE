// THE CAGE approved Paolo Di Canio recruitment.
(()=>{'use strict';
const roster=window.THE_CAGE_PLAYERS;
if(roster.length!==189||roster.some(p=>p.id==='paolo-di-canio'))throw Error('Di Canio recruitment baseline mismatch');
const core=[78,94,84,88,28,73],detail=[95,93,84,88,88,91,74,73,28,84,83];
const r=Object.fromEntries([...['pace','tech','pass','finish','def','phys'].map((k,i)=>[k,core[i]]),...['first_touch','dribbling','passing','vision','finishing','shooting','stamina','physical','tackling','positioning','composure'].map((k,i)=>[k,detail[i]])]);
const p={id:'paolo-di-canio',name:'Paolo Di Canio',country:'Italy',role:'F',position:'CF',secondaryPositions:['ST','LW'],aliases:['di canio','paolo di canio'],peak:'1999-2003',careerTier:'ELITE',folklore:['STREET HERO','TALISMAN','STREET VILLAIN'],talismanClubs:['West Ham United'],traits:{primary:'Magician',secondary:'Predator'},r,ratingType:'owner-approved-di-canio-v1'};
p.overall=window.CageOverall.raw(p);
if(p.overall!==87)throw Error('Di Canio expected 87, formula gave '+p.overall+' ('+window.CageOverall.evaluate(p).score+')');
roster.push(p);
window.CAGE_ROSTER_EXTRA_RATINGS=Object.assign({},window.CAGE_ROSTER_EXTRA_RATINGS||{},{'paolo-di-canio':{work_rate:75,stamina:74,composure:83,agility:88,marking:28}});
window.CAGE_ROSTER_VERSION+='-di-canio-v1';
if(roster.length!==190)throw Error('Expected 190 players');
})();