// THE CAGE: Fellaini and Balotelli additions. Ratings provisional, traits inactive in simulation.
(()=>{'use strict';
const ps=window.THE_CAGE_PLAYERS;
const rows=[
{id:'marouane-fellaini',name:'Marouane Fellaini',country:'Belgium',role:'M',aliases:['fellaini'],r:{pace:55,tech:75,pass:72,finish:77,def:79,phys:97,first_touch:77,dribbling:69,passing:72,vision:70,finishing:77,shooting:80,stamina:84,physical:97,tackling:79,positioning:86,composure:77},traits:{primary:'Juggernaut',secondary:'Engine'}},
{id:'mario-balotelli',name:'Mario Balotelli',country:'Italy',role:'F',aliases:['balotelli','super mario'],r:{pace:79,tech:87,pass:75,finish:91,def:30,phys:92,first_touch:85,dribbling:84,passing:75,vision:77,finishing:91,shooting:95,stamina:69,physical:92,tackling:30,positioning:75,composure:80},traits:{primary:'Executioner',secondary:'Juggernaut'}}];
for(const p of rows){if(ps.some(x=>x.id===p.id))throw Error('Duplicate '+p.id);ps.push({...p,peak:'prime career',ratingType:'editorial-v0.6',ratingNote:'Provisional six-stat and supplemental editorial estimates; owner review pending.'});}
window.CAGE_ROSTER_VERSION='editorial-v0.6-103';
})();