// THE CAGE: owner-approved Filippo "Super Pippo" Inzaghi classification and prime ratings.
(()=>{'use strict';
const players=window.THE_CAGE_PLAYERS;
if(players.some(p=>p.id==='filippo-inzaghi'||p.name.toLowerCase()==='filippo inzaghi'))throw Error('Duplicate Filippo Inzaghi');
players.push({
  id:'filippo-inzaghi',name:'Filippo Inzaghi',country:'Italy',role:'F',
  aliases:['inzaghi','pippo','super pippo','superpippo'],
  peak:'prime career (1997–2007)',ratingType:'editorial-user-approved-v1',
  ratingNote:'Owner-approved LEGEND + STREET HERO. Penalty-area instincts, blind-side runs and finishing; less creative with the ball.',
  careerTier:'LEGEND',folklore:['STREET HERO'],
  traits:{primary:'Predator',secondary:'Phantom'},
  r:{
    pace:82,tech:70,pass:65,finish:98,def:25,phys:71,
    first_touch:75,dribbling:59,passing:65,vision:68,finishing:98,shooting:84,
    stamina:82,physical:71,tackling:25,positioning:100,composure:96
  }
});
window.CAGE_ROSTER_EXTRA_RATINGS=Object.assign({},window.CAGE_ROSTER_EXTRA_RATINGS||{},{
  'filippo-inzaghi':{work_rate:78,stamina:82,composure:96,agility:79,marking:25,
    rationale:'Provisional supplemental five-attribute estimates for Super Pippo; primary ratings, tier, traits and folklore owner-approved.'}
});
window.CAGE_ROSTER_VERSION='editorial-v0.8-140';
})();
