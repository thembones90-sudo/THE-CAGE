// THE CAGE: owner-approved Hidetoshi Nakata profile and identity (2026-10-30).
(()=>{'use strict';
const players=window.THE_CAGE_PLAYERS;
if(players.some(p=>p.id==='hidetoshi-nakata'||p.name==='Hidetoshi Nakata'))throw Error('Duplicate Hidetoshi Nakata');
players.push({
  id:'hidetoshi-nakata',name:'Hidetoshi Nakata',country:'Japan',role:'M',
  aliases:['nakata','h nakata','hidetoshi','nakata hidetoshi'],
  peak:'prime career (1998–2003)',ratingType:'editorial-user-approved-v1',
  ratingNote:'Owner-approved LEGEND and STREET HERO. Precise incisive passing, progressive runs and powerful long-distance shooting.',
  careerTier:'LEGEND',folklore:['STREET HERO'],
  traits:{primary:'Surgeon',secondary:'Engine'},
  r:{
    pace:83,tech:88,pass:92,finish:81,def:53,phys:76,
    first_touch:89,dribbling:86,passing:92,vision:95,finishing:81,
    shooting:90,stamina:85,physical:76,tackling:54,positioning:76,composure:88
  }
});
window.CAGE_ROSTER_EXTRA_RATINGS=Object.assign({},window.CAGE_ROSTER_EXTRA_RATINGS||{},{
  'hidetoshi-nakata':{work_rate:82,stamina:85,composure:88,agility:86,marking:53,
    rationale:'Provisional supplemental five-attribute estimates for Nakata; primary ratings, tier, traits and folklore owner-approved.'}
});
window.CAGE_ROSTER_VERSION='editorial-v0.9-141';
})();
