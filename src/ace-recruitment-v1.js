// Owner-approved ACE recruitment and Baines ELITE. Applied after 184-player rating validation.
(()=>{'use strict';
const players=window.THE_CAGE_PLAYERS;
if(players.length!==184)throw Error('Expected 184-player baseline');
const rows=[
{id:'freddy-adu',name:'Freddy Adu',country:'United States',role:'M',position:'CAM',secondaryPositions:['RW'],peak:'2006–2008',tier:'ACE',folklore:['STREET HERO'],traits:['Magician','Phantom'],core:[83,85,70,67,27,49],detail:[85,87,70,78,67,69,72,49,27,57,68],extra:[62,72,72,90,28],target:75},
{id:'federico-macheda',name:'Federico Macheda',country:'Italy',role:'F',position:'ST',secondaryPositions:['CF'],peak:'2009–2011',tier:'ACE',folklore:['STREET HERO'],traits:['Predator','Phantom'],core:[75,75,61,78,25,76],detail:[76,70,61,60,78,80,72,76,25,76,73],extra:[69,72,73,72,26],target:76},
{id:'royston-drenthe',name:'Royston Drenthe',country:'Netherlands',role:'F',position:'LW',secondaryPositions:['LB'],peak:'2007–2012',tier:'ACE',folklore:['STREET HERO'],traits:['Hunter','Magician'],core:[92,82,71,72,60,82],detail:[80,84,71,74,72,78,83,82,61,68,70],extra:[75,83,70,85,63],target:79},
{id:'leighton-baines',name:'Leighton Baines',country:'England',role:'D',position:'LB',secondaryPositions:['LWB'],peak:'2010–2014',tier:'ELITE',folklore:['TALISMAN'],talismanClubs:['Everton'],traits:['Architect','Anticipator'],core:[79,86,94,73,87,72],detail:[85,79,94,92,73,85,89,72,87,86,86],extra:[90,89,86,82,85],target:87},
{id:'andriy-shevchenko',name:'Andriy Shevchenko',country:'Ukraine',role:'F',position:'ST',secondaryPositions:['CF'],peak:'1999–2006',tier:'LEGEND',folklore:['TALISMAN'],talismanClubs:['AC Milan'],traits:['Predator','Phantom'],core:[93,94,79,97,32,88],detail:[95,91,79,82,97,98,88,88,32,95,93],extra:[91,88,93,89,30],target:94}
];
const keyCore=['pace','tech','pass','finish','def','phys'],keyDetail=['first_touch','dribbling','passing','vision','finishing','shooting','stamina','physical','tackling','positioning','composure'];
const supplement=window.CAGE_ROSTER_EXTRA_RATINGS||{};
for(const x of rows){
if(players.some(p=>p.id===x.id))throw Error('Duplicate '+x.id);
const r=Object.fromEntries([...keyCore.map((k,i)=>[k,x.core[i]]),...keyDetail.map((k,i)=>[k,x.detail[i]])]);
const p={id:x.id,name:x.name,country:x.country,role:x.role,position:x.position,secondaryPositions:x.secondaryPositions,aliases:[x.name.toLowerCase()],peak:x.peak,careerTier:x.tier,folklore:x.folklore,traits:{primary:x.traits[0],secondary:x.traits[1]},r,ratingType:'owner-approved-ace-recruitment-v1'};
if(x.talismanClubs)p.talismanClubs=x.talismanClubs;
p.overall=window.CageOverall.raw(p);
if(p.overall!==x.target)(()=>{throw Error('OVR MISMATCH '+x.id+' target '+x.target+' got '+p.overall)})();
players.push(p);
supplement[x.id]=Object.fromEntries(['work_rate','stamina','composure','agility','marking'].map((k,i)=>[k,x.extra[i]]));
}
const gravesen=players.find(p=>p.id==='thomas-gravesen');
if(!gravesen||gravesen.careerTier!=='STALWART'||gravesen.overall!==81)throw Error('Gravesen baseline mismatch');
gravesen.careerTier='ACE';gravesen.folklore=[...new Set([...(gravesen.folklore||[]),'STREET VILLAIN'])];gravesen.traits={primary:'Enforcer',secondary:'Destroyer'};
gravesen.classificationStatus='owner-approved-ace-v1';
window.CAGE_ROSTER_EXTRA_RATINGS=supplement;
window.CAGE_ROSTER_VERSION+='-ace4-v1';
if(players.length!==189)throw Error('Expected 189 cards');
})();