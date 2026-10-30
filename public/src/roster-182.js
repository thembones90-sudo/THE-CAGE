// THE CAGE: approved four-player recruitment. Editorial stats remain provisional.
(()=>{'use strict';
const players=window.THE_CAGE_PLAYERS;
if(players.length!==178)throw Error('Baseline must contain 178 players');
const rows=[{"id":"ailton","name":"A\u00edlton","country":"Brazil","role":"F","aliases":["ailton","a\u00edlton","ailton goncalves da silva","kugelblitz"],"peak":"2002\u20132004","tier":"ELITE","folklore":["STREET HERO","UNDERDOG"],"traits":["Predator","Phantom"],"core":[90,81,65,95,30,86],"detail":[84,84,65,68,95,93,84,86,30,94,86],"extra":[77,84,86,86,33],"note":"Werder Bremen's Kugelblitz, 28 Bundesliga goals and 2003/04 league-and-cup double. Original editorial ratings; historically distinctive cult striker.","source":"https://www.bundesliga.com/en/bundesliga/news/iconic-bundesliga-teams-werder-bremen-s-double-2003-04-double-winners-24945"},{"id":"marcelinho-hertha","name":"Marcelinho","country":"Brazil","role":"M","aliases":["marcelinho","marcelinho hertha","marcelinho paraiba","marcelinho da silva","marcelo dos santos"],"peak":"2002\u20132006","tier":"ELITE","folklore":["STREET HERO"],"traits":["Magician","Surgeon"],"core":[82,96,93,84,34,65],"detail":[95,96,93,94,84,91,82,65,34,82,88],"extra":[70,82,88,94,39],"note":"Hertha Berlin's Brazilian No. 10, outrageous flair, playmaking, goals and set-piece prowess. Distinguished from unrelated footballers also known as Marcelinho.","source":"https://www.bundesliga.com/en/bundesliga/news/best-number-10s-robben-netzer-matthaus-24578"},{"id":"juan-arango","name":"Juan Arango","country":"Venezuela","role":"M","aliases":["arango","juan arango","juan fernando arango"],"peak":"2009\u20132014","tier":"ELITE","folklore":["STREET HERO"],"traits":["Architect","Executioner"],"core":[70,92,95,82,45,69],"detail":[93,87,95,95,82,96,82,69,45,82,91],"extra":[75,82,91,79,52],"note":"Borussia M\u00f6nchengladbach's celebrated Venezuelan playmaker with an extraordinary left foot and dangerous direct free-kicks.","source":"https://www.bundesliga.com/en/bundesliga/news/best-number-10s-robben-netzer-matthaus-24578"},{"id":"jefferson-farfan","name":"Jefferson Farf\u00e1n","country":"Peru","role":"F","aliases":["farfan","farf\u00e1n","jefferson farfan","jefferson farf\u00e1n","foquita"],"peak":"2008\u20132013","tier":"ELITE","folklore":["STREET HERO"],"traits":["Phantom","Magician"],"core":[94,87,82,85,40,76],"detail":[86,91,82,85,85,87,89,76,40,89,84],"extra":[84,89,84,92,45],"note":"Schalke 04's rapid Peruvian right winger, explosive carrying and goal threat; DFB-Pokal winner. Original editorial peak ratings.","source":"https://datencenter.dfb.de/en/data-center/people/jefferson-farfan/player"}];
const core=['pace','tech','pass','finish','def','phys'];
const detail=['first_touch','dribbling','passing','vision','finishing','shooting','stamina','physical','tackling','positioning','composure'];
const tactical=['work_rate','stamina','composure','agility','marking'];
const supplement={};
for(const v of rows){
if(players.some(p=>p.id===v.id||p.name===v.name))throw Error('Duplicate world recruit '+v.id);
if(v.core.length!==6||v.detail.length!==11||v.extra.length!==5)throw Error('Invalid stats '+v.id);
if(v.core[2]!==v.detail[2]||v.core[3]!==v.detail[4]||v.core[5]!==v.detail[7])throw Error('Inconsistent attributes '+v.id);
const r=Object.fromEntries([...core.map((k,i)=>[k,v.core[i]]),...detail.map((k,i)=>[k,v.detail[i]])]);
players.push({id:v.id,name:v.name,country:v.country,role:v.role,aliases:v.aliases,peak:v.peak,careerTier:v.tier,folklore:v.folklore,traits:{primary:v.traits[0],secondary:v.traits[1]},ratingType:'editorial-provisional-v1.5',ratingNote:v.note,classificationStatus:'approved-recruitment-provisional-ratings',r});
supplement[v.id]={...Object.fromEntries(tactical.map((k,i)=>[k,v.extra[i]])),rationale:'Provisional editorial tactical estimates. Ratings remain subject to owner review.'};
}
window.CAGE_ROSTER_EXTRA_RATINGS=Object.assign({},window.CAGE_ROSTER_EXTRA_RATINGS||{},supplement);
if(players.length!==182)throw Error('Expected 182 after recruitment');
window.CAGE_ROSTER_VERSION='editorial-v1.5-182';
})();
