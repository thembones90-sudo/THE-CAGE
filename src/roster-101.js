// THE CAGE: Adel Taarabt addition and existing Ben Arfa trait identity.
(()=>{'use strict';
const all=window.THE_CAGE_PLAYERS;
if(all.some(p=>p.id==='adel-taarabt'))throw Error('Duplicate Adel Taarabt');
const r={pace:83,tech:97,pass:86,finish:78,def:32,phys:72,first_touch:96,dribbling:97,passing:86,vision:91,finishing:78,shooting:80,stamina:73,physical:72,tackling:32,positioning:57,composure:78};
all.push({id:'adel-taarabt',name:'Adel Taarabt',country:'Morocco',role:'M',aliases:['taarabt','adel'],peak:'QPR prime-career',ratingType:'editorial-v0.6',ratingNote:'Provisional editorial estimates; flair, close control and chance creation.',traits:{primary:'Magician',secondary:'Surgeon'},r});
const ben=all.find(p=>p.id==='hatem-ben-arfa');if(!ben)throw Error('Ben Arfa missing');ben.traits={primary:'Magician',secondary:'Phantom'};
window.CAGE_ROSTER_VERSION='editorial-v0.6-101';
})();