// THE CAGE V6.6. Provisional historical goalkeeper roster, pending owner ratings review.
// Role-specific overall is derived from exactly seven goalkeeper attributes.
(function(root,factory){const api=factory();root.CageGoalkeepers=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const RATINGS_VERSION='gk50-v68-owner-chilavert-20261031',HISTORIC_VERSION='gk30-v66-provisional-20261031';
const ATTRS=Object.freeze(['reflexes','positioning','handling','oneOnOne','aerialControl','distribution','sweeping']);
const CLASSES=Object.freeze(['REFLEX MONSTER','SWEEPER KEEPER','COMMANDER','GUARDIAN','DISTRIBUTOR']);
const TIERS=Object.freeze(['TITAN','LEGEND','ELITE','STALWART','ACE']);
const WEIGHTS=Object.freeze({reflexes:24,positioning:20,handling:14,oneOnOne:16,aerialControl:9,distribution:9,sweeping:8});
const entries=[
// ID | name | nationality | tier | class | reflexes, positioning, handling, 1v1, aerial, distribution, sweeping
['lev-yashin','Lev Yashin','USSR','TITAN','REFLEX MONSTER',95,96,93,94,91,87,89],
['gianluigi-buffon','Gianluigi Buffon','Italy','TITAN','GUARDIAN',95,96,94,95,92,84,87],
['manuel-neuer','Manuel Neuer','Germany','TITAN','SWEEPER KEEPER',95,94,92,96,92,94,99],
['iker-casillas','Iker Casillas','Spain','TITAN','REFLEX MONSTER',97,94,90,97,82,79,86],
['oliver-kahn','Oliver Kahn','Germany','LEGEND','COMMANDER',94,94,92,95,92,76,82],
['peter-schmeichel','Peter Schmeichel','Denmark','LEGEND','COMMANDER',95,92,94,94,96,80,83],
['petr-cech','Petr Cech','Czech Republic','LEGEND','GUARDIAN',93,95,95,91,94,79,79],
['edwin-van-der-sar','Edwin van der Sar','Netherlands','LEGEND','GUARDIAN',91,93,93,91,92,92,86],
['dino-zoff','Dino Zoff','Italy','LEGEND','GUARDIAN',92,95,95,89,91,78,78],
['gordon-banks','Gordon Banks','England','LEGEND','REFLEX MONSTER',96,91,92,93,88,75,78],
['sepp-maier','Sepp Maier','Germany','LEGEND','REFLEX MONSTER',93,92,89,91,88,78,80],
['thibaut-courtois','Thibaut Courtois','Belgium','LEGEND','GUARDIAN',92,94,91,95,94,74,78],
['jan-oblak','Jan Oblak','Slovenia','ELITE','GUARDIAN',93,94,94,93,88,72,76],
['alisson-becker','Alisson Becker','Brazil','LEGEND','SWEEPER KEEPER',93,93,90,95,89,91,94],
['ederson-moraes','Ederson Moraes','Brazil','ELITE','DISTRIBUTOR',89,86,88,91,84,99,94],
['marc-andre-ter-stegen','Marc-Andre ter Stegen','Germany','ELITE','DISTRIBUTOR',91,90,87,90,83,92,92],
['victor-valdes','Victor Valdes','Spain','ELITE','DISTRIBUTOR',89,89,85,89,84,92,88],
['keylor-navas','Keylor Navas','Costa Rica','ELITE','REFLEX MONSTER',95,89,86,94,82,78,81],
['dida','Dida','Brazil','ELITE','GUARDIAN',91,90,90,93,90,78,79],
['julio-cesar','Julio Cesar','Brazil','ELITE','REFLEX MONSTER',94,90,88,92,87,77,81],
['gianluigi-donnarumma','Gianluigi Donnarumma','Italy','ELITE','REFLEX MONSTER',94,91,89,94,91,76,82],
['fabien-barthez','Fabien Barthez','France','ELITE','SWEEPER KEEPER',90,86,82,91,77,88,92],
['pepe-reina','Pepe Reina','Spain','ELITE','DISTRIBUTOR',87,89,86,89,86,89,87],
['santiago-canizares','Santiago Canizares','Spain','ELITE','GUARDIAN',92,91,91,91,88,75,77],
['francesco-toldo','Francesco Toldo','Italy','ELITE','REFLEX MONSTER',92,91,90,91,89,74,76],
['rene-higuita','Rene Higuita','Colombia','STALWART','SWEEPER KEEPER',86,77,71,89,70,89,97],
['jose-luis-chilavert','Jose Luis Chilavert','Paraguay','LEGEND','DISTRIBUTOR',92,90,87,91,90,95,79],
['jorge-campos','Jorge Campos','Mexico','STALWART','SWEEPER KEEPER',91,77,74,90,65,90,95],
['samir-handanovic','Samir Handanovic','Slovenia','ELITE','GUARDIAN',92,90,91,91,88,75,77],
['yann-sommer','Yann Sommer','Switzerland','ELITE','REFLEX MONSTER',93,86,88,93,75,86,87],
// V6.8 goalkeeper expansion. Editorial grades pending owner review.
// The tier is historical standing; the seven stats describe prime playing style.
['peter-shilton','Peter Shilton','England','LEGEND','GUARDIAN',93,95,93,91,94,74,71],
['ricardo-zamora','Ricardo Zamora','Spain','LEGEND','REFLEX MONSTER',94,93,91,93,89,76,74],
['frantisek-planicka','Frantisek Planicka','Czechoslovakia','LEGEND','REFLEX MONSTER',94,92,90,91,86,78,76],
['gilmar','Gilmar','Brazil','LEGEND','GUARDIAN',92,93,93,91,90,79,77],
['ubaldo-fillol','Ubaldo Fillol','Argentina','LEGEND','REFLEX MONSTER',95,92,90,93,86,74,78],
['walter-zenga','Walter Zenga','Italy','ELITE','COMMANDER',94,92,90,92,88,76,79],
['michel-preudhomme','Michel Preudhomme','Belgium','LEGEND','GUARDIAN',95,93,92,94,87,78,79],
['rinat-dasayev','Rinat Dasayev','USSR','LEGEND','REFLEX MONSTER',94,92,90,94,87,80,82],
['jean-marie-pfaff','Jean-Marie Pfaff','Belgium','ELITE','REFLEX MONSTER',92,90,87,92,87,76,78],
['hugo-lloris','Hugo Lloris','France','ELITE','REFLEX MONSTER',93,91,88,93,86,78,86],
['andoni-zubizarreta','Andoni Zubizarreta','Spain','ELITE','GUARDIAN',89,93,92,89,89,84,82],
['claudio-taffarel','Claudio Taffarel','Brazil','ELITE','GUARDIAN',92,92,91,93,88,79,79],
['rogerio-ceni','Rogerio Ceni','Brazil','ELITE','DISTRIBUTOR',87,86,85,86,84,92,82],
['jens-lehmann','Jens Lehmann','Germany','ELITE','SWEEPER KEEPER',90,88,84,90,87,85,92],
['david-seaman','David Seaman','England','ELITE','GUARDIAN',92,91,92,90,91,77,75],
['gianluca-pagliuca','Gianluca Pagliuca','Italy','ELITE','REFLEX MONSTER',93,90,90,92,85,77,79],
['angelo-peruzzi','Angelo Peruzzi','Italy','ELITE','GUARDIAN',92,92,93,91,90,75,74],
['emiliano-martinez','Emiliano Martinez','Argentina','ELITE','COMMANDER',94,90,87,95,87,79,83],
['vitor-baia','Vitor Baia','Portugal','ELITE','GUARDIAN',89,89,87,89,86,78,78],
['sergio-goycochea','Sergio Goycochea','Argentina','STALWART','REFLEX MONSTER',90,86,83,92,82,72,75]
];
function rawOverall(p){if(!p||!p.r)throw Error('Goalkeeper attributes missing');let sum=0;for(const k of ATTRS){const n=p.r[k];if(!Number.isInteger(n)||n<0||n>100)throw Error('Invalid goalkeeper attribute '+k);sum+=n*WEIGHTS[k];}return Math.round(sum/100);}
const players=Object.freeze(entries.map(([id,name,country,tier,keeperClass,...attrs])=>{const r=Object.freeze(Object.fromEntries(ATTRS.map((k,i)=>[k,attrs[i]])));const p={id,name,country,careerTier:tier,keeperClass,r,overall:rawOverall({r})};if(id==='jose-luis-chilavert'){p.folklore=Object.freeze(['STREET HERO','STREET VILLAIN','TALISMAN']);p.talismanClubs=Object.freeze(['Velez Sarsfield']);p.ownerApprovedTier=true;}return Object.freeze(p);}));
const BY_ID=Object.freeze(Object.fromEntries(players.map(p=>[p.id,p])));
function validate(){if(players.length!==50||Object.keys(BY_ID).length!==50)throw Error('Expected 50 unique goalkeeper cards');for(const p of players){if(!TIERS.includes(p.careerTier)||!CLASSES.includes(p.keeperClass)||p.overall!==rawOverall(p))throw Error('Invalid goalkeeper metadata: '+p.id);if(Object.keys(p.r).length!==7)throw Error('Goalkeeper must have seven attributes');}return true;}
validate();const ORDER=Object.freeze(Object.fromEntries(TIERS.map((tier,i)=>[tier,i])));
const RANKED=Object.freeze(players.slice().sort((a,b)=>ORDER[a.careerTier]-ORDER[b.careerTier]||b.overall-a.overall||a.name.localeCompare(b.name)));
const RANK_BY_ID=Object.freeze(Object.fromEntries(RANKED.map((p,i)=>[p.id,i+1])));
const api={RATINGS_VERSION,HISTORIC_VERSION,players,BY_ID,ATTRS,CLASSES,TIERS,WEIGHTS,RANKED,RANK_BY_ID,rawOverall,validate};
api.catalog=function(version){if(version===RATINGS_VERSION)return api;if(version===HISTORIC_VERSION){const frozen=(typeof window!=='undefined'?window:globalThis).CageGoalkeepersGK30;if(!frozen)throw Error('Original GK30 catalog not loaded');return frozen;}throw Error('Unknown goalkeeper ratings catalog '+version);};
return Object.freeze(api);
});
