// THE CAGE natural positions. Broad role remains untouched for engine compatibility.
(()=>{
'use strict';
const groups={
CDM:'roy-keane claude-makelele rodri gilberto-silva xabi-alonso javier-mascherano edgar-davids thomas-gravesen daniele-de-rossi gennaro-gattuso tugay-kerimoglu sergio-busquets michael-carrick fernandinho declan-rice',
CM:'paul-scholes michael-essien frank-lampard patrick-vieira steven-gerrard ngolo-kante yaya-toure michael-ballack steed-malbranque xavi-hernandez andres-iniesta luka-modric toni-kroos andrea-pirlo cesc-fabregas bastian-schweinsteiger clarence-seedorf marouane-fellaini ilkay-gundogan santi-cazorla paul-pogba mousa-dembele dejan-stankovic vladimir-jugovic',
LM:'ryan-giggs robert-pires morten-gamst-pedersen nene park-ji-sung',
CAM:'kevin-de-bruyne bernardo-silva juan-roman-riquelme jay-jay-okocha pablo-aimar andres-dalessandro zinedine-zidane djalminha kaka mesut-ozil adel-taarabt david-silva bruno-fernandes christian-eriksen matt-le-tissier hidetoshi-nakata youri-djorkaeff dragan-stojkovic dejan-savicevic robert-prosinecki safet-susic josip-ilicic alex-de-souza shunsuke-nakamura ariel-ortega ruud-gullit marcelinho-hertha juan-arango juan-carlos-valeron',
LW:'eden-hazard yannick-bolasie denilson nani rivaldo ronaldinho neymar cristiano-ronaldo thierry-henry son-heung-min sadio-mane andrey-arshavin alberto-luque',
RW:'ricardo-quaresma hatem-ben-arfa lionel-messi mohamed-salah riyad-mahrez tijjani-babangida hulk aiden-mcgeady jefferson-farfan',
CF:'roberto-baggio francesco-totti alvaro-recoba alessandro-del-piero antonio-cassano wayne-rooney karim-benzema predrag-mijatovic nwankwo-kanu dennis-bergkamp gianfranco-zola',
ST:'adriano ronaldo-nazario gabriel-batistuta dimitar-berbatov obafemi-martins michael-owen zlatan-ibrahimovic kylian-mbappe luis-suarez robert-lewandowski didier-drogba samuel-etoo mario-balotelli sergio-aguero harry-kane robin-van-persie erling-haaland fernando-torres ruud-van-nistelrooy jamie-vardy hernan-crespo marcelo-salas ivan-zamorano filippo-inzaghi mark-viduka darko-pancev davor-suker alen-boksic savo-milosevic papiss-cisse peter-crouch ailton djibril-cisse pierre-van-hooijdonk alan-shearer diego-tristan patrick-mboma milan-baros roy-makaay',
LB:'paolo-maldini sinisa-mihajlovic roberto-carlos ashley-cole patrice-evra andrew-robertson',
RB:'javier-zanetti lilian-thuram philipp-lahm cafu gary-neville branislav-ivanovic kyle-walker trent-alexander-arnold',
CB:'nemanja-vidic giorgio-chiellini rio-ferdinand jaap-stam lucio marcel-desailly ricardo-carvalho ledley-king sergio-ramos alessandro-nesta fabio-cannavaro carles-puyol virgil-van-dijk john-terry franz-beckenbauer vincent-kompany sol-campbell jamie-carragher kolo-toure ruben-dias andrea-barzagli miodrag-belodedici sami-hyypia',
RM:'david-beckham',
};
const overrides={'gareth-bale':'RW','morten-gamst-pedersen':'LM','juan-roman-riquelme':'CAM','fernando-torres':'ST','robert-pires':'LM','bernardo-silva':'CAM','bruno-fernandes':'CAM'};
const positions=new Map();
for(const [position,ids] of Object.entries(groups))for(const id of ids.split(' ')){if(positions.has(id))throw Error('Duplicate natural position '+id);positions.set(id,position);}
for(const [id,pos] of Object.entries(overrides))positions.set(id,pos);
const alternate={
'roy-keane':['CM'],'ryan-giggs':['LW'],'claude-makelele':['CDM'],'rodri':['CM'],'gilberto-silva':['CB'],'robert-pires':['LW'],'javier-mascherano':['CB'],'javier-zanetti':['LB'],'paolo-maldini':['CB'],'francesco-totti':['CAM'],'lilian-thuram':['CB'],'nani':['RW'],'ronaldinho':['CAM'],'rivaldo':['CAM'],'cristiano-ronaldo':['ST'],'lionel-messi':['CF','CAM'],'gareth-bale':['LW'],'david-beckham':['RW'],'andres-iniesta':['CAM'],'kaka':['CAM'],'fernando-torres':['ST'],'sergio-ramos':['RB'],'carles-puyol':['RB'],'philipp-lahm':['LB','CDM'],'cafu':['RM'],'roberto-carlos':['LB'],'robert-lewandowski':['ST'],'thierry-henry':['ST'],'bernardo-silva':['RW'],'mohamed-salah':['RW'],'trent-alexander-arnold':['CM'],'matt-le-tissier':['CAM'],'david-silva':['CAM'],'mousa-dembele':['CM'],'ronaldo-nazario':['ST'],'pablo-aimar':['CAM'],'eden-hazard':['CAM'],'marcelo-salas':['ST'],'franz-beckenbauer':['CDM'],'steven-gerrard':['CAM'],'juan-roman-riquelme':['CAM'],'hidetoshi-nakata':['CM'],'park-ji-sung':['RM','CM'],'tijjani-babangida':['RM'],'mark-viduka':['CF'],'youri-djorkaeff':['CF'],'dejan-stankovic':['CAM','RM'],'predrag-mijatovic':['ST'],'dragan-stojkovic':['CM'],'dejan-savicevic':['CF'],'robert-prosinecki':['CM'],'davor-suker':['CF'],'alen-boksic':['CF'],'josip-ilicic':['RW'],'vladimir-jugovic':['CDM'],'nwankwo-kanu':['ST'],'andrey-arshavin':['CAM'],'hulk':['ST'],'aiden-mcgeady':['LW'],'djibril-cisse':['RW'],'dennis-bergkamp':['CAM'],'shunsuke-nakamura':['RM','CM'],'alberto-luque':['ST'],'diego-tristan':['CF'],'ariel-ortega':['RW'],'patrick-mboma':['CF'],'milan-baros':['CF'],'ruud-gullit':['CF','CM'],'gianfranco-zola':['CAM'],'marcelinho-hertha':['CM'],'juan-arango':['LM'],'jefferson-farfan':['ST'],'juan-carlos-valeron':['CM'],'roy-makaay':['CF']
};
const roster=window.THE_CAGE_PLAYERS;
for(const player of roster){const pos=positions.get(player.id);if(!pos)throw Error('Missing natural position: '+player.id);player.position=pos;player.secondaryPositions=[...new Set((alternate[player.id]||[]).filter(x=>x!==pos))];}
if(roster.length!==positions.size)throw Error('Natural position coverage: roster='+roster.length+' mappings='+positions.size);
})();
