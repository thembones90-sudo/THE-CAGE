// THE CAGE: Valeron and Makaay recruitment with agreed full stats (prime values editorial).
(()=>{'use strict';
const players=window.THE_CAGE_PLAYERS;
if(players.length!==182)throw Error('Baseline must contain 182 players');
const rows=[{"id":"juan-carlos-valeron","name":"Juan Carlos Valer\u00f3n","country":"Spain","role":"M","aliases":["valeron","valer\u00f3n","juan carlos valeron","juan carlos valer\u00f3n","el flaco","el mago valeron"],"peak":"2001\u20132005","tier":"ELITE","folklore":["STREET HERO","TALISMAN","UNDERDOG"],"talismanClubs":["Deportivo La Coru\u00f1a"],"traits":["Magician","Surgeon"],"core":[64,90,90,70,35,58],"detail":[92,87,90,92,70,72,75,58,35,80,87],"extra":[60,76,88,79,41],"note":"Deportivo's celebrated creative midfielder and long-serving club symbol. Historical prime editorial re-evaluation: excellent touch, vision and passing, but not an all-time elite creator on the scale of Xavi, Iniesta or Zidane. Previous inflated 98/99 attributes corrected at owner request; rating inputs are subject to later review.","statReview":{"version":"v2.1","status":"owner-challenged-historical-inflation;editorial-reassessment","reason":"Prime playmaking grades of 98 passing, 99 vision, 98 touch and 97 composure overvalued Valeron versus world-class midfield benchmarks; revised to a more credible specialist profile","originalCore":[67,97,98,72,35,59],"originalDetail":[98,92,98,99,72,73,76,59,35,85,97]},"tierReview":{"status":"owner-confirmed","previousTier":"LEGEND","correctTier":"ELITE","reason":"THE CAGE tiers reflect historical exceptionality. Valeron was a brilliant Deportivo cult playmaker, not a player of the sustained elite historical standing required for LEGEND or TITAN."}},{"id":"roy-makaay","name":"Roy Makaay","country":"Netherlands","role":"F","aliases":["makaay","roy makaay","the phantom makaay","das phantom","roy phantom"],"peak":"2000\u20132005","tier":"LEGEND","folklore":["STREET HERO","UNDERDOG"],"traits":["Predator","Phantom"],"core":[86,85,71,98,29,78],"detail":[86,81,71,76,98,96,86,78,29,99,97],"extra":[72,86,97,84,26],"note":"Deportivo's 1999/2000 title scorer, 2003 European Golden Shoe winner and Bayern Munich striker; record Champions League goal after 10.12 seconds in 2007."}];
const core=['pace','tech','pass','finish','def','phys'];
const detail=['first_touch','dribbling','passing','vision','finishing','shooting','stamina','physical','tackling','positioning','composure'];
const tactical=['work_rate','stamina','composure','agility','marking'];
const supplement={};
for(const v of rows){
if(players.some(p=>p.id===v.id||p.name===v.name))throw Error('Duplicate Deportivo recruit '+v.id);
if(v.core.length!==6||v.detail.length!==11||v.extra.length!==5)throw Error('Invalid stats '+v.id);
if(v.core[2]!==v.detail[2]||v.core[3]!==v.detail[4]||v.core[5]!==v.detail[7])throw Error('Inconsistent attributes '+v.id);
const r=Object.fromEntries([...core.map((k,i)=>[k,v.core[i]]),...detail.map((k,i)=>[k,v.detail[i]])]);
const player={id:v.id,name:v.name,country:v.country,role:v.role,aliases:v.aliases,peak:v.peak,careerTier:v.tier,folklore:[...v.folklore],traits:{primary:v.traits[0],secondary:v.traits[1]},ratingType:'editorial-recruit-v1.6',ratingNote:v.note,classificationStatus:'approved-recruitment-v1.6',r};
if(v.talismanClubs)player.talismanClubs=[...v.talismanClubs];
players.push(player);
supplement[v.id]={...Object.fromEntries(tactical.map((k,i)=>[k,v.extra[i]])),rationale:'Provisional editorial tactical estimates for Deportivo recruit. Core ratings owner agreed.'};
}
window.CAGE_ROSTER_EXTRA_RATINGS=Object.assign({},window.CAGE_ROSTER_EXTRA_RATINGS||{},supplement);
if(players.length!==184)throw Error('Expected 184 after recruitment');
window.CAGE_ROSTER_VERSION='editorial-v1.6-184';
})();
