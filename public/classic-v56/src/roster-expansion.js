// Identity references support names/countries/positions only. Numbers are original editorial estimates.
(()=>{'use strict';
const additions=[
['steed-malbranque','Steed Malbranque','France','M',['malbranque'],[76,86,85,73,53,61],'https://www.fff.fr/equipe-nationale/joueur/10119-malbranque-steed/fiche.html','Technical link player; moderate pace, limited defensive coverage.'],
['ricardo-carvalho','Ricardo Carvalho','Portugal','D',[],[73,68,76,30,94,80],'https://www.uefa.com/uefachampionsleague/news/019f-0e6af8dd6362-f3084643f318-1000--chelsea-get-ricardo-carvalho/','Defensive reader; strong tackling, modest attacking contribution.'],
['ledley-king','Ledley King','England','D',[],[79,72,73,32,93,86],'https://www.tottenhamhotspur.com/news/1022311/ledley-king','Mobile defensive anchor with composure on the ball.'],
['tugay-kerimoglu','Tugay Kerimoğlu','Turkey','M',['tugay'],[52,86,91,72,65,65],'https://www.rovers.co.uk/news/2019/july/club-connections/','Deep passing specialist; low recovery speed makes positioning costly.'],
['morten-gamst-pedersen','Morten Gamst Pedersen','Norway','M',['gamst pedersen','morten pedersen'],[75,80,84,76,56,72],'https://gamst.co.uk/no/about/','Left-sided creator with balanced physical contribution and moderate defence.'],
['nene','Nenê','Brazil','M',['anderson luis de carvalho'],[76,90,86,84,27,58],'https://www.asmonaco.com/en/news/nene-the-brilliant-brazilian-left-footer','Flair creator and finisher with weak defensive cover.'],
['gennaro-gattuso','Gennaro Gattuso','Italy','M',['gattuso','rino gattuso'],[75,75,77,56,95,96],'https://en.wikipedia.org/wiki/Gennaro_Gattuso','Ball-winning midfielder; strong tackling and physical commitment, limited finishing.']
];
for(const [id,name,country,role,aliases,base,source,rationale] of additions){const [pace,tech,pass,finish,def,phys]=base;window.THE_CAGE_PLAYERS.push({id,name,country,role,aliases,peak:'editorial prime-career abstraction',ratingType:'editorial-v0.4',identitySources:[source],ratingNote:rationale,r:{pace,tech,pass,finish,def,phys,first_touch:Math.round((tech+pass)/2),dribbling:tech,passing:pass,vision:Math.round((tech+pass)/2),finishing:finish,shooting:Math.round((finish+phys)/2),stamina:Math.round((pace+phys)/2),physical:phys,tackling:def,positioning:Math.round((def+pass)/2),composure:Math.round((tech+finish)/2)}});}
window.CAGE_ROSTER_VERSION='editorial-v0.4-64';
})();
