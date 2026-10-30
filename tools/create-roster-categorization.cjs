// THE CAGE historical classification V1.3. Fully editorial classifications, preserve 40 earlier approved dossiers.
// Output is a REVIEWABLE metadata overlay; never rewrite base player ratings or tactics.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const source=JSON.parse(read('docs/roster-audit-178.json'));
const traitProposals=JSON.parse(read('proposals/trait-pairs-missing-61.json')).traits;
const tierLists={"TITAN":"cristiano-ronaldo lionel-messi ronaldo-nazario paolo-maldini zinedine-zidane ronaldinho franz-beckenbauer xavi-hernandez andres-iniesta luka-modric sergio-ramos roberto-carlos cafu roberto-baggio thierry-henry neymar luis-suarez robert-lewandowski alessandro-del-piero karim-benzema rivaldo philipp-lahm andrea-pirlo zlatan-ibrahimovic toni-kroos samuel-etoo fabio-cannavaro","LEGEND":"roy-keane paul-scholes ryan-giggs frank-lampard claude-makelele kevin-de-bruyne rodri patrick-vieira xabi-alonso steven-gerrard ngolo-kante yaya-toure eden-hazard juan-roman-riquelme edgar-davids michael-ballack jay-jay-okocha nemanja-vidic gabriel-batistuta giorgio-chiellini rio-ferdinand michael-owen jaap-stam lilian-thuram daniele-de-rossi lucio marcel-desailly didier-drogba ruud-van-nistelrooy sergio-aguero hernan-crespo harry-kane kylian-mbappe erling-haaland fernando-torres alessandro-nesta carles-puyol john-terry vincent-kompany virgil-van-dijk sol-campbell gennaro-gattuso david-silva mesut-ozil clarence-seedorf bastian-schweinsteiger cesc-fabregas ilkay-gundogan sadio-mane son-heung-min mohamed-salah gareth-bale ashley-cole david-beckham francesco-totti kaka javier-zanetti sergio-busquets wayne-rooney","ELITE":"michael-essien bernardo-silva gilberto-silva robert-pires javier-mascherano ricardo-quaresma adriano alvaro-recoba sinisa-mihajlovic dimitar-berbatov pablo-aimar antonio-cassano andres-dalessandro djalminha ricardo-carvalho ledley-king mousa-dembele paul-pogba santi-cazorla bruno-fernandes christian-eriksen matt-le-tissier fernandinho declan-rice michael-carrick patrice-evra branislav-ivanovic gary-neville kyle-walker trent-alexander-arnold kolo-toure ruben-dias jamie-carragher marcelo-salas ivan-zamorano jamie-vardy riyad-mahrez andrew-robertson andrea-barzagli","STALWART":"thomas-gravesen nani obafemi-martins denilson steed-malbranque tugay-kerimoglu morten-gamst-pedersen nene adel-taarabt hatem-ben-arfa marouane-fellaini mario-balotelli","ACE":"yannick-bolasie"};
const badgeLists={"hero":"cristiano-ronaldo lionel-messi ronaldo-nazario zinedine-zidane ronaldinho roberto-baggio thierry-henry neymar luis-suarez alessandro-del-piero rivaldo zlatan-ibrahimovic roberto-carlos andrea-pirlo kaka francesco-totti ryan-giggs steven-gerrard yaya-toure eden-hazard juan-roman-riquelme edgar-davids adriano jay-jay-okocha gabriel-batistuta alvaro-recoba sinisa-mihajlovic nani dimitar-berbatov yannick-bolasie michael-owen denilson pablo-aimar antonio-cassano andres-dalessandro djalminha tugay-kerimoglu morten-gamst-pedersen nene adel-taarabt hatem-ben-arfa david-silva matt-le-tissier santi-cazorla mousa-dembele david-beckham gareth-bale son-heung-min mohamed-salah riyad-mahrez obafemi-martins mario-balotelli sergio-ramos trent-alexander-arnold wayne-rooney didier-drogba sergio-aguero ivan-zamorano marcelo-salas jamie-vardy ricardo-quaresma","villain":"cristiano-ronaldo roy-keane zlatan-ibrahimovic luis-suarez sergio-ramos mario-balotelli thomas-gravesen gennaro-gattuso antonio-cassano","underdog":"ronaldo-nazario jay-jay-okocha steven-gerrard xabi-alonso jamie-carragher ngolo-kante riyad-mahrez jamie-vardy"};
const talismanClubs={"paolo-maldini":["AC Milan"],"francesco-totti":["AS Roma"],"alessandro-del-piero":["Juventus"],"javier-zanetti":["Inter Milan"],"lionel-messi":["FC Barcelona"],"steven-gerrard":["Liverpool"],"ryan-giggs":["Manchester United"],"juan-roman-riquelme":["Boca Juniors"],"matt-le-tissier":["Southampton"],"daniele-de-rossi":["AS Roma"],"thierry-henry":["Arsenal"],"frank-lampard":["Chelsea"],"john-terry":["Chelsea"],"didier-drogba":["Chelsea"],"vincent-kompany":["Manchester City"],"sergio-aguero":["Manchester City"],"carles-puyol":["FC Barcelona"],"xavi-hernandez":["FC Barcelona"],"andres-iniesta":["FC Barcelona"],"philipp-lahm":["Bayern Munich"],"wayne-rooney":["Manchester United"],"mohamed-salah":["Liverpool"],"son-heung-min":["Tottenham Hotspur"],"gabriel-batistuta":["Fiorentina"]};
const byTier=new Map();for(const [tier,list] of Object.entries(tierLists))for(const id of list.trim().split(/\s+/).filter(Boolean)){if(byTier.has(id))throw Error('Double-assigned tier '+id);byTier.set(id,tier);}
const byBadge=Object.fromEntries(Object.entries(badgeLists).map(([key,list])=>[key,new Set(list.trim().split(/\s+/).filter(Boolean))]));
const valid=new Set(source.players.map(p=>p.id)),unclassified=source.players.filter(p=>!p.careerTier),missingTraits=source.players.filter(p=>!p.traits);
if(source.total!==178||byTier.size!==unclassified.length||byTier.size!==138)throw Error('Classifier source mismatch');
for(const p of unclassified)if(!byTier.has(p.id))throw Error('Missing player tier '+p.id);
for(const id of byTier.keys())if(!valid.has(id)||source.players.find(p=>p.id===id).careerTier)throw Error('Invalid or already-approved tier '+id);
if(Object.keys(traitProposals).length!==61||missingTraits.length!==61)throw Error('Trait proposal count mismatch');
for(const p of missingTraits)if(!traitProposals[p.id])throw Error('Missing trait pair '+p.id);
const badges={hero:'STREET HERO',villain:'STREET VILLAIN',underdog:'UNDERDOG'};
for(const [type,set] of Object.entries(byBadge))for(const id of set)if(!byTier.has(id))throw Error('Badge assigned to already-approved or unknown record '+type+':'+id);
for(const id of Object.keys(talismanClubs))if(!byTier.has(id))throw Error('Talisman club not in unclassified roster '+id);
const classifications={};for(const p of unclassified){
 const id=p.id;const folklore=[...['hero','villain','underdog'].filter(tag=>byBadge[tag].has(id)).map(tag=>badges[tag])];
 if(talismanClubs[id])folklore.push('TALISMAN');
 const row={careerTier:byTier.get(id),folklore,classificationStatus:'editorial-reviewed-v1.3'};
 if(talismanClubs[id])row.talismanClubs=talismanClubs[id];
 if(traitProposals[id]){row.traits=traitProposals[id];row.traitsStatus='editorial-reviewed-v1.3';}
 classifications[id]=row;
}
const out={version:'roster-classification-v1.3',status:'editorial-implemented-not-individually-owner-approved',rosterLength:178,previouslyClassified:40,classifiedNow:138,traitsAssignedNow:61,
 notes:'All previous 40 approved career tiers and folklore arrays remain unchanged. Existing traits and ratings remain unchanged.',classifications};
fs.writeFileSync(path.join(root,'proposals/roster-178-classifications-v1.json'),JSON.stringify(out,null,2)+'\n');
const serialized=JSON.stringify(classifications);
const js=['// Generated by tools/create-roster-categorization.cjs. Classification-only metadata overlay.','(()=>{\'use strict\';',
 'const roster=window.THE_CAGE_PLAYERS;',
 'const classifications='+serialized+';',
 'if(roster.length!==178)throw Error(\'Classification source expects 178 players\');',
 'let added=0,traitsAdded=0;',
 'for(const p of roster){const m=classifications[p.id];if(!m){if(!p.careerTier||!Array.isArray(p.folklore))throw Error(\'Previously approved classification missing: \'+p.id);continue;}',
 'if(p.careerTier||p.folklore)throw Error(\'Refusing to overwrite prior classification: \'+p.id);',
 'p.careerTier=m.careerTier;p.folklore=[...m.folklore];p.classificationStatus=m.classificationStatus;',
 'if(m.talismanClubs)p.talismanClubs=[...m.talismanClubs];',
 'if(m.traits){if(p.traits)throw Error(\'Refusing to overwrite existing traits: \'+p.id);p.traits={...m.traits};p.traitsStatus=m.traitsStatus;traitsAdded++;}',
 'added++;}',
 'if(added!==138||traitsAdded!==61)throw Error(\'Classification coverage failure: \'+added+\'/\'+traitsAdded);',
 'window.CAGE_ROSTER_VERSION=\'editorial-v1.3-178\';','})();'].join('\n')+'\n';
fs.writeFileSync(path.join(root,'src/roster-classification.js'),js);
console.log('Generated metadata for '+Object.keys(classifications).length+' previously unclassified players and '+Object.values(classifications).filter(x=>x.traits).length+' missing trait pairs');
