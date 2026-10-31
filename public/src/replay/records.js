(()=>{'use strict';
const E=window.CageEngine,SCHEMA=1,CATALOG_ROUTER=window.CageGoalkeepers;
const copy=x=>JSON.parse(JSON.stringify(x));
// Frozen historic V5.3 trait identities for faithful Classic v0.4 fingerprints.
// They have NO influence on gameplay or the new 182-player live roster.
const LEGACY_V15_TRAITS=Object.freeze({"roy-keane":["Enforcer","Destroyer"],"paul-scholes":["Architect","Maestro"],"ryan-giggs":["Magician","Engine"],"michael-essien":["Engine","Destroyer"],"frank-lampard":["Executioner","Phantom"],"claude-makelele":["Anticipator","Wall"],"kevin-de-bruyne":["Surgeon","Architect"],"rodri":["Architect","Anticipator"],"bernardo-silva":["Magician","Engine"],"gilberto-silva":["Anticipator","Wall"],"patrick-vieira":["Enforcer","Engine"],"robert-pires":["Magician","Surgeon"],"xabi-alonso":["Architect","Anticipator"],"steven-gerrard":["Engine","Executioner"],"javier-mascherano":["Tracker","Destroyer"],"ngolo-kante":["Tracker","Engine"],"yaya-toure":["Juggernaut","Engine"],"eden-hazard":["Magician","Surgeon"],"juan-roman-riquelme":["Maestro","Surgeon"],"ricardo-quaresma":["Magician","Surgeon"],"edgar-davids":["Destroyer","Engine"],"roberto-baggio":["Magician","Executioner"],"adriano":["Juggernaut","Executioner"],"javier-zanetti":["Engine","Anticipator"],"michael-ballack":["Engine","Executioner"],"paolo-maldini":["Anticipator","Wall"],"ronaldo-nazario":["Predator","Magician"],"thomas-gravesen":["Enforcer","Destroyer"],"jay-jay-okocha":["Magician","Surgeon"],"nemanja-vidic":["Wall","Enforcer"],"gabriel-batistuta":["Executioner","Juggernaut"],"francesco-totti":["Maestro","Executioner"],"giorgio-chiellini":["Wall","Enforcer"],"alvaro-recoba":["Magician","Executioner"],"sinisa-mihajlovic":["Executioner","Enforcer"],"nani":["Magician","Executioner"],"dimitar-berbatov":["Magician","Surgeon"],"yannick-bolasie":["Magician","Phantom"],"rio-ferdinand":["Libero","Anticipator"],"obafemi-martins":["Phantom","Predator"],"michael-owen":["Phantom","Predator"],"jaap-stam":["Wall","Enforcer"],"lilian-thuram":["Wall","Tracker"],"denilson":["Magician","Phantom"],"alessandro-del-piero":["Magician","Executioner"],"pablo-aimar":["Magician","Surgeon"],"antonio-cassano":["Magician","Surgeon"],"daniele-de-rossi":["Destroyer","Architect"],"andres-dalessandro":["Magician","Surgeon"],"zlatan-ibrahimovic":["Juggernaut","Magician"],"lucio":["Libero","Enforcer"],"hatem-ben-arfa":["Magician","Phantom"],"rivaldo":["Magician","Executioner"],"marcel-desailly":["Wall","Anticipator"],"zinedine-zidane":["Maestro","Magician"],"ronaldinho":["Magician","Maestro"],"djalminha":["Magician","Surgeon"],"steed-malbranque":["Engine","Surgeon"],"ricardo-carvalho":["Anticipator","Wall"],"ledley-king":["Anticipator","Wall"],"tugay-kerimoglu":["Architect","Executioner"],"morten-gamst-pedersen":["Architect","Executioner"],"nene":["Magician","Executioner"],"gennaro-gattuso":["Destroyer","Enforcer"],"sergio-ramos":["Enforcer","Executioner"],"alessandro-nesta":["Wall","Anticipator"],"fabio-cannavaro":["Anticipator","Tracker"],"carles-puyol":["Enforcer","Wall"],"virgil-van-dijk":["Wall","Architect"],"john-terry":["Wall","Enforcer"],"philipp-lahm":["Anticipator","Maestro"],"cafu":["Engine","Tracker"],"roberto-carlos":["Tracker","Executioner"],"franz-beckenbauer":["Libero","Architect"],"vincent-kompany":["Enforcer","Wall"],"ashley-cole":["Tracker","Anticipator"],"xavi-hernandez":["Maestro","Architect"],"andres-iniesta":["Maestro","Phantom"],"luka-modric":["Maestro","Engine"],"toni-kroos":["Architect","Maestro"],"andrea-pirlo":["Architect","Maestro"],"sergio-busquets":["Anticipator","Maestro"],"kaka":["Predator","Surgeon"],"david-beckham":["Architect","Surgeon"],"cesc-fabregas":["Surgeon","Architect"],"bastian-schweinsteiger":["Engine","Architect"],"clarence-seedorf":["Engine","Juggernaut"],"mesut-ozil":["Surgeon","Phantom"],"lionel-messi":["Phantom","Surgeon"],"cristiano-ronaldo":["Executioner","Predator"],"neymar":["Magician","Surgeon"],"kylian-mbappe":["Predator","Phantom"],"thierry-henry":["Predator","Executioner"],"wayne-rooney":["Predator","Engine"],"luis-suarez":["Executioner","Predator"],"robert-lewandowski":["Executioner","Juggernaut"],"karim-benzema":["Maestro","Surgeon"],"didier-drogba":["Juggernaut","Executioner"],"samuel-etoo":["Predator","Tracker"],"mohamed-salah":["Phantom","Executioner"],"adel-taarabt":["Magician","Surgeon"],"marouane-fellaini":["Juggernaut","Engine"],"mario-balotelli":["Executioner","Juggernaut"],"sol-campbell":["Wall","Enforcer"],"gary-neville":["Anticipator","Engine"],"patrice-evra":["Tracker","Engine"],"jamie-carragher":["Wall","Anticipator"],"kolo-toure":["Tracker","Enforcer"],"branislav-ivanovic":["Enforcer","Wall"],"kyle-walker":["Tracker","Wall"],"trent-alexander-arnold":["Architect","Libero"],"andrew-robertson":["Engine","Tracker"],"ruben-dias":["Wall","Anticipator"],"david-silva":["Surgeon","Maestro"],"michael-carrick":["Architect","Anticipator"],"fernandinho":["Destroyer","Anticipator"],"ilkay-gundogan":["Engine","Phantom"],"santi-cazorla":["Magician","Architect"],"bruno-fernandes":["Surgeon","Executioner"],"christian-eriksen":["Architect","Surgeon"],"paul-pogba":["Juggernaut","Architect"],"mousa-dembele":["Magician","Juggernaut"],"declan-rice":["Destroyer","Engine"],"sergio-aguero":["Predator","Executioner"],"harry-kane":["Executioner","Surgeon"],"robin-van-persie":["Executioner","Magician"],"erling-haaland":["Predator","Juggernaut"],"fernando-torres":["Predator","Executioner"],"gareth-bale":["Predator","Executioner"],"son-heung-min":["Phantom","Executioner"],"sadio-mane":["Predator","Engine"],"ruud-van-nistelrooy":["Executioner","Predator"],"riyad-mahrez":["Magician","Phantom"],"jamie-vardy":["Predator","Executioner"],"andrea-barzagli":["Wall","Anticipator"],"matt-le-tissier":["Executioner","Magician"],"hernan-crespo":["Predator","Executioner"],"marcelo-salas":["Executioner","Magician"],"ivan-zamorano":["Juggernaut","Predator"],"filippo-inzaghi":["Predator","Phantom"],"hidetoshi-nakata":["Surgeon","Engine"],"park-ji-sung":["Engine","Tracker"],"tijjani-babangida":["Magician","Phantom"],"mark-viduka":["Juggernaut","Magician"],"youri-djorkaeff":["Surgeon","Executioner"],"dejan-stankovic":["Engine","Executioner"],"predrag-mijatovic":["Magician","Executioner"],"dragan-stojkovic":["Magician","Maestro"],"dejan-savicevic":["Magician","Surgeon"],"robert-prosinecki":["Magician","Maestro"],"darko-pancev":["Predator","Executioner"],"miodrag-belodedici":["Libero","Anticipator"],"safet-susic":["Magician","Surgeon"],"davor-suker":["Executioner","Predator"],"alen-boksic":["Juggernaut","Phantom"],"savo-milosevic":["Predator","Juggernaut"],"josip-ilicic":["Magician","Executioner"],"vladimir-jugovic":["Engine","Architect"],"nwankwo-kanu":["Magician","Predator"],"alex-de-souza":["Maestro","Surgeon"],"andrey-arshavin":["Magician","Executioner"],"hulk":["Juggernaut","Executioner"],"aiden-mcgeady":["Magician","Phantom"],"papiss-cisse":["Predator","Executioner"],"peter-crouch":["Juggernaut","Predator"],"djibril-cisse":["Phantom","Executioner"],"dennis-bergkamp":["Magician","Surgeon"],"pierre-van-hooijdonk":["Executioner","Juggernaut"],"shunsuke-nakamura":["Architect","Executioner"],"alan-shearer":["Executioner","Juggernaut"],"alberto-luque":["Phantom","Executioner"],"diego-tristan":["Executioner","Magician"],"ariel-ortega":["Magician","Surgeon"],"patrick-mboma":["Juggernaut","Executioner"],"sami-hyypia":["Wall","Anticipator"],"milan-baros":["Phantom","Predator"],"ruud-gullit":["Juggernaut","Maestro"],"gianfranco-zola":["Magician","Surgeon"],"ailton":["Predator","Phantom"],"marcelinho-hertha":["Magician","Surgeon"],"juan-arango":["Architect","Executioner"],"jefferson-farfan":["Phantom","Magician"]});
function fingerprint(value){let h=2166136261;for(const c of JSON.stringify(value))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h.toString(16).padStart(8,'0');}
function validResult(result,config){if(!result||!Array.isArray(result.events)||result.events.length>50000)throw Error('Invalid match history.');
let prev=-1;for(let i=0;i<result.events.length;i++){const e=result.events[i];if(e.i!==i||!Number.isFinite(e.t)||e.t<0||e.t<prev||e.n!==3||![0,1].includes(e.team))throw Error('Invalid event order.');prev=e.t;if(e.actor&&!config.teams[e.team].includes(e.actor))throw Error('Event actor outside squad.');if(e.target&&!config.teams[e.team].includes(e.target))throw Error('Pass target outside squad.');if(e.opp&&!config.teams[1-e.team].includes(e.opp))throw Error('Opponent outside squad.');}
const goals=result.events.filter(e=>e.type==='goal');
if(!Array.isArray(result.score)||result.score.length!==2||result.score.some(x=>!Number.isInteger(x)||x<0)||result.score[0]!==goals.filter(e=>e.team===0).length||result.score[1]!==goals.filter(e=>e.team===1).length||result.winner!==(result.score[0]>result.score[1]?0:result.score[1]>result.score[0]?1:-1))throw Error('Goal, winner and score do not agree.');
if(config.mode==='score'){
 if(!Number.isFinite(result.regulationSeconds)||result.regulationSeconds<=0||!Number.isFinite(result.regulationAt)||result.regulationAt<result.regulationSeconds||!Array.isArray(result.regulationScore)||result.regulationScore.length!==2||!['regulation','golden_goal'].includes(result.decidedBy)||result.winner===-1)throw Error('Invalid regulation result.');
 const opening=goals.filter(e=>e.t<=result.regulationAt);
 if(result.regulationScore.some((v,i)=>v!==opening.filter(g=>g.team===i).length))throw Error('Regulation score mismatch.');
 const overtime=result.events.filter(e=>e.type==='golden_goal_start'),golden=goals.filter(e=>e.golden===true);
 if(result.decidedBy==='regulation'){
  if(result.regulationScore[0]===result.regulationScore[1]||overtime.length||golden.length||result.score.some((x,i)=>x!==result.regulationScore[i]))throw Error('Invalid full-time result.');
 }else{
  if(result.regulationScore[0]!==result.regulationScore[1]||overtime.length!==1||golden.length!==1||golden[0]!==goals.at(-1)||result.events.at(-1)!==golden[0]||golden[0].team!==result.winner||golden[0].t<overtime[0].t)throw Error('Invalid Golden Goal overtime.');
 }
}else if(config.mode==='ko'){
 if(goals.length!==1||result.events.at(-1)!==goals[0]||result.winner!==goals[0].team||result.score[goals[0].team]!==1||result.score[1-goals[0].team]!==0||result.duration!==goals[0].t)throw Error('Invalid first-goal result.');
}
for(const g of goals)if(g.assist&&!config.teams[g.team].includes(g.assist))throw Error('Invalid assist.');
}
const HISTORIC_GK_RATINGS='gk30-v66-provisional-20261031';
function catalogFor(record){
 if(!record?.config?.keepers)return null;
 const version=record.keeperRatingsVersion||HISTORIC_GK_RATINGS;
 const live=CATALOG_ROUTER;
 if(!live?.catalog)throw Error('No versioned goalkeeper catalogs installed');
 return live.catalog(version);
}
function withCatalog(record,fn){
 const target=catalogFor(record);if(!target)return fn();
 const live=window.CageGoalkeepers;window.CageGoalkeepers=target;
 try{return fn();}finally{window.CageGoalkeepers=live;}
}
function validate(record){return withCatalog(record,()=>validateScoped(record));}
function validateScoped(record){if(!record||![SCHEMA,2].includes(record.schema)||!Number.isInteger(record.round)||record.round<1||record.round>5)throw Error('Unsupported replay record.');
const c=record.config;if(!c||!['ko','score'].includes(c.mode)||!Number.isInteger(c.seed)||c.seed<0||c.seed>0xffffffff||!Array.isArray(c.teams)||c.teams.length!==2||c.teams.some(t=>!Array.isArray(t)||t.length!==3||t.some(id=>typeof id!=='string'||!Object.hasOwn(E.BY_ID,id)))||new Set(c.teams.flat()).size!==6||!Array.isArray(c.tactics)||c.tactics.length!==2||c.tactics.some(t=>!Object.hasOwn(E.TACTICS,t)))throw Error('Invalid replay configuration.');
if(c.retryCount!==undefined&&(!Number.isInteger(c.retryCount)||c.retryCount<1||c.retryCount>4||!['cage-t3-8','cage-t3-9','cage-t3-10','cage-t3-11'].includes(record.engineVersion)||!c.keepers))throw Error('Invalid safety replay seed retry metadata.');
if(c.traits!==undefined&&(!c.traits||c.traits.enabled!==true||Object.keys(c.traits).length!==1||!String(record.engineVersion).startsWith('cage-t3')))throw Error('Unsupported trait-mode replay configuration.');
if(c.keepers===undefined){if(record.schema===2||record.result.keepers||record.result.keeperStats||record.result.events.some(e=>['gk_save','gk_parry','gk_sweep','gk_distribution'].includes(e.type)||e.gk))throw Error('Goalkeeper event in non-goalkeeper match.');}
if(c.keepers!==undefined){if(['cage-t3-9','cage-t3-10','cage-t3-11'].includes(record.engineVersion)&&record.keeperRatingsVersion!==window.CageGoalkeepers.RATINGS_VERSION)throw Error('Keeper ratings version mismatch. Historical roster required.');if(c.mode!=='score')throw Error('Keeper replay requires regulation scoring.');
 if(record.schema!==2||!['cage-t3-7','cage-t3-8','cage-t3-9','cage-t3-10','cage-t3-11'].includes(record.engineVersion))throw Error('Keeper replay requires GK schema 2 and T3-7.');
 window.CageGoalkeeperRules.validateKeepers(c.keepers,window.CageGoalkeepers.BY_ID);
 if(!Array.isArray(record.result.keepers)||JSON.stringify(record.result.keepers)!==JSON.stringify(c.keepers))throw Error('Keeper IDs disagree with replay config.');
 const acts=record.result.events.filter(e=>['gk_save','gk_parry'].includes(e.type));
 const distributions=record.result.events.filter(e=>e.type==='gk_distribution');
 const sweeps=record.result.events.filter(e=>e.type==='gk_sweep');
 if(['cage-t3-8','cage-t3-9','cage-t3-10','cage-t3-11'].includes(record.engineVersion)){
  for(const e of record.result.events.filter(e=>['shot_miss','gk_save','gk_parry'].includes(e.type)&&e.gk)){
   const g=window.CageGoalkeepers.BY_ID[e.gk];
   if(e.gk!==c.keepers[1-e.team]||!Number.isFinite(e.catRoll)||e.catRoll<0||e.catRoll>=1)throw Error('Missing or invalid recorded goalkeeper classification roll.');
   const expected=window.CageGoalkeeperRules.afterMiss(g,e.kind,e.catRoll);
   if(e.type!==expected.type||e.outcome!==expected.outcome||e.onTarget!==expected.onTarget||e.onTargetP!==expected.onTargetP||e.parryP!==expected.parryP)throw Error('Recorded goalkeeper save/parry classification disagrees with actual roll.');
  }
  const phases=record.result.events.filter(e=>e.type==='golden_goal_pressure');
  if(phases.length>1||phases.some(e=>e.reason!=='prolonged_overtime_risk'||e.t<E.P.timedSeconds+900||record.result.decidedBy!=='golden_goal'))throw Error('Invalid Golden Goal pressure phase.');
 }

 if(record.engineVersion==='cage-t3-7'&&(distributions.length||sweeps.length))throw Error('Archived T3-7 cannot contain goalkeeper dynamics.');
 for(const e of distributions){
  if(!['cage-t3-8','cage-t3-9','cage-t3-10','cage-t3-11'].includes(record.engineVersion)||e.p!==window.CageGoalkeeperRules.distribute(window.CageGoalkeepers.BY_ID[e.gk],E.TACTICS[c.tactics[1-e.team]].engageHigh,e.roll,e.kind==='long').p||e.gk!==c.keepers[e.team]||!c.teams[e.team].includes(e.actor)||!c.teams[e.team].includes(e.target)||!['complete','intercepted'].includes(e.outcome)||!Number.isFinite(e.p)||!Number.isFinite(e.roll)||e.outcome==='complete'!==(e.roll<e.p)||!e.to||![1,2].includes(e.to.x)||!['long','short'].includes(e.kind)||e.to.x!==(e.kind==='long'?2:1))throw Error('Invalid recorded goalkeeper distribution.');
  if(e.outcome==='intercepted'&&!c.teams[1-e.team].includes(e.opp))throw Error('Keeper intercepted release lacks opponent.');
 }
 for(const e of sweeps)if(!['cage-t3-8','cage-t3-9','cage-t3-10','cage-t3-11'].includes(record.engineVersion)||e.p!==window.CageGoalkeeperRules.sweep(window.CageGoalkeepers.BY_ID[e.gk],e.zone?.x,e.roll).p||e.gk!==c.keepers[1-e.team]||!c.teams[e.team].includes(e.actor)||!['cleared','beaten'].includes(e.outcome)||!Number.isFinite(e.p)||!Number.isFinite(e.roll)||e.outcome==='cleared'!==(e.roll<e.p))throw Error('Invalid recorded goalkeeper sweeping.');

 for(const e of acts)if(e.gk!==c.keepers[1-e.team]||!c.teams[e.team].includes(e.actor)||!Number.isFinite(e.p)||!Number.isFinite(e.roll))throw Error('Invalid recorded goalkeeper action.');
 for(const e of record.result.events.filter(e=>e.type==='goal'))if(e.gk!==c.keepers[1-e.team])throw Error('Goalkeeper goal mismatch.');
 if(!record.result.keeperStats||Object.keys(record.result.keeperStats).length!==2)throw Error('Missing goalkeeper statistics.');
 for(let side=0;side<2;side++){const id=c.keepers[side],st=record.result.keeperStats[id];
  if(!st||st.saves!==acts.filter(e=>e.type==='gk_save'&&e.gk===id).length||st.parries!==acts.filter(e=>e.type==='gk_parry'&&e.gk===id).length||st.conceded!==record.result.score[1-side])throw Error('Goalkeeper statistics disagree with logged events.');
  if(['cage-t3-8','cage-t3-9','cage-t3-10','cage-t3-11'].includes(record.engineVersion)&&(st.distributions!==distributions.filter(e=>e.gk===id).length||st.completedDistributions!==distributions.filter(e=>e.gk===id&&e.outcome==='complete').length||st.sweeps!==sweeps.filter(e=>e.gk===id&&e.outcome==='cleared').length))throw Error('Goalkeeper distributions/sweeps disagree with event log.');
 }
 }else if(record.schema===2)throw Error('GK schema must include keeper IDs.');
 validResult(record.result,c);const engine=window.CAGE_ENGINE_REGISTRY?.[record.engineVersion]||(record.engineVersion===E.VERSION?E:null);if(engine?.hashEvents){if(record.result.eventHash!==engine.hashEvents(record.result.events))throw Error('Replay tactical event hash mismatch.');engine.validateEvidence(record.result.events,c);}return record;}
function make(config,result,round){validResult(result,config);return E.freeze({schema:config.keepers?2:SCHEMA,...(config.keepers&&['cage-t3-9','cage-t3-10','cage-t3-11'].includes(E.VERSION)?{keeperRatingsVersion:window.CageGoalkeepers.RATINGS_VERSION}:{}),round,createdAt:new Date().toISOString(),engineVersion:E.VERSION,paramsVersion:E.PARAMS_VERSION,rosterVersion:E.VERSION==='cage-0.4.0'?'editorial-v0.4-63':window.CAGE_ROSTER_VERSION||'editorial-v0.3',rosterFingerprint:keeperFingerprint({engineVersion:E.VERSION,config}),config:copy(config),result:copy(result)});}
function replayRoster(record,historicClassic=false){
 return record.config.teams.map(ids=>ids.map(id=>{
  const p=copy(E.BY_ID[id]);
  if(record.engineVersion==='cage-0.4.0'){
   delete p.attributes;delete p.ratingsVersion;delete p.attributesProvisional;
   if(historicClassic){
    const old=LEGACY_V15_TRAITS[id];if(!old)throw Error('Unknown historical Classic trait identity: '+id);
    p.traits={primary:old[0],secondary:old[1]};
   }
  }
  return p;
 }));
}
function keeperFingerprint(record){const outfield=replayRoster(record);return record.config.keepers?fingerprint({outfield,keepers:record.config.keepers.map(id=>window.CageGoalkeepers.BY_ID[id])}):fingerprint(outfield);}
function matchesRosterFingerprint(record){
 const current=keeperFingerprint(record);
 if(record.rosterFingerprint===current)return true;
 // Only this exact immutable V5.3 182-player trait snapshot is allowed.
 // Other old roster/ratings versions fail closed rather than reconstructing
 // an invented player or accepting an arbitrary fingerprint.
 return record.engineVersion==='cage-0.4.0'&&record.rosterFingerprint===fingerprint(replayRoster(record,true));
}
function reproduce(record){return withCatalog(record,()=>{validate(record);const engine=window.CAGE_ENGINE_REGISTRY?.[record.engineVersion]||(record.engineVersion===E.VERSION?E:null);if(!engine||record.paramsVersion!==engine.PARAMS_VERSION||!matchesRosterFingerprint(record))throw Error('This replay needs its original engine and ratings version. Export it for review.');const result=engine.simulate(record.config);if(JSON.stringify(result)!==JSON.stringify(record.result))throw Error('Replay integrity mismatch: the event history did not reproduce.');return result;});}
function validateSave(s){if(!s||s.schema!==SCHEMA||!Number.isInteger(s.round)||s.round<1||s.round>5||!Array.isArray(s.history)||s.history.length>5||!Array.isArray(s.used)||s.used.length>30)throw Error('Unsupported saved showdown.');
const tally={A:0,B:0},exhausted=new Map();s.history.forEach((r,i)=>{validate(r);if(r.round!==i+1||tally.A===3||tally.B===3)throw Error('Invalid round history.');for(const [side,ids] of [['A',r.config.teams[0]],['B',r.config.teams[1]]])for(const id of ids){if(exhausted.has(id))throw Error('Recycled identity in history.');exhausted.set(id,side);}tally[r.result.winner===0?'A':'B']++;});
if(s.wins?.A!==tally.A||s.wins?.B!==tally.B||s.history.length!==s.round-(s.roundFinished?0:1))throw Error('Saved score mismatch.');
if(typeof s.roundFinished!=='boolean'||!s.claimed||!s.locked||!s.tactics||!s.drafts)throw Error('Invalid draft state.');
const current=new Set();for(const side of ['A','B']){const ids=s.claimed[side];if(!Array.isArray(ids)||ids.length!==3||ids.some(id=>id!==null&&(typeof id!=='string'||!Object.hasOwn(E.BY_ID,id)))||typeof s.locked[side]!=='boolean'||!Object.hasOwn(E.TACTICS,s.tactics[side])||!Array.isArray(s.drafts[side])||s.drafts[side].length!==3||s.drafts[side].some(t=>typeof t!=='string'||t.length>200))throw Error('Invalid saved draft.');for(const id of ids.filter(Boolean)){if(current.has(id))throw Error('Duplicate claim.');current.add(id);if(!s.roundFinished){if(exhausted.has(id))throw Error('Recycled current claim.');exhausted.set(id,side);}}if(s.locked[side]&&ids.some(id=>!id))throw Error('Incomplete locked trio.');}
const unique=new Map(s.used);if(unique.size!==s.used.length||unique.size!==exhausted.size||[...unique].some(([id,side])=>exhausted.get(id)!==side))throw Error('Saved used pool mismatch.');
const first=s.round%2===1?'A':'B',other=first==='A'?'B':'A',n=s.claimed[first].filter(Boolean).length,m=s.claimed[other].filter(Boolean).length;if(!(n===m||n===m+1))throw Error('Invalid alternating draft.');
if(s.roundFinished){const last=s.history.at(-1);if(JSON.stringify(last.config.teams)!==JSON.stringify([s.claimed.A,s.claimed.B]))throw Error('Completed squad mismatch.');}
if(s.traitsMode!==undefined&&typeof s.traitsMode!=='boolean')throw Error('Invalid class-mode saved preference.');
if(s.counterIndicators!==undefined&&typeof s.counterIndicators!=='boolean')throw Error('Invalid optional counter-indicators setting.');
const recordedTrait=s.history[0]?.config.traits?.enabled??s.pending?.config.traits?.enabled??null;
if(recordedTrait!==null){
  const expected=s.traitsMode??recordedTrait;
  for(const record of [...s.history,...(s.pending?[s.pending]:[])])
    if(Boolean(record.config.traits?.enabled)!==expected)throw Error('Saved showdown mixed incompatible trait modes.');
}else if(s.traitsMode===true&&!String(E.VERSION).startsWith('cage-t3'))throw Error('Class mode requires the experimental T3 engine.');
if(s.pending){validate(s.pending);if(s.roundFinished||!s.locked.A||!s.locked.B||s.pending.round!==s.round||JSON.stringify(s.pending.config.teams)!==JSON.stringify([s.claimed.A,s.claimed.B]))throw Error('Invalid interrupted match.');}
if(!['normal','fast','instant','dramatic'].includes(s.pace))throw Error('Invalid playback setting.');return s;}
window.CageRecords={SCHEMA,fingerprint,make,validate,reproduce,validateSave,copy};
})();
