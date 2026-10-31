// Independent event-evidence checks used by replay imports and tactical tests.
(()=>{'use strict';const S=window.CageSpatial,allowed=new Set(['overload','help_defence','rest_defence_exposed','counter_press','direct_outlet']);
function validate(events,config){const ids=config.teams.flat();if(new Set(ids).size!==6)return true;const require_=(ok,message)=>{if(!ok)throw Error('Tactical evidence: '+message);};
const linkBySide=[null,null];let lastShot=null;

for(const e of events){
 require_(e.team===0||e.team===1,'invalid event team');
 if(e.type==='restart'||e.type==='turnover'||e.type==='rebound'||e.type==='foul'){linkBySide[0]=null;linkBySide[1]=null;}
 if(e.type==='pass'||e.type==='through_ball'){
   const v=e.calc?.creativeLink;
   if(v!==undefined)require_(Number.isFinite(v)&&v>=0&&v<=.22,'invalid creative pass bonus');
   if(v>0){
     require_(e.outcome==='complete'&&e.to&&e.zone&&e.to.x>=2&&e.to.x>e.zone.x,'creative link needs a completed forward attacking pass');
     require_(config.teams[e.team].includes(e.actor)&&config.teams[e.team].includes(e.target),'creative link actor or receiver is illegal');
     linkBySide[e.team]={passer:e.actor,receiver:e.target,bonus:v};
   }else linkBySide[e.team]=null;
 }
 if(e.type==='shot_attempt'){
   const link=linkBySide[e.team],hasLink=e.creator!==undefined||e.linkBoost!==undefined;
   if(hasLink){
     require_(e.kind!=='fk'&&link&&e.creator===link.passer&&e.actor===link.receiver&&Number.isFinite(e.linkBoost)&&Math.abs(e.linkBoost-link.bonus)<.00011,'shot creative link provenance mismatch');
   }
   lastShot={team:e.team,actor:e.actor,bonus:hasLink?e.linkBoost:0};
   linkBySide[e.team]=null;
 }
 if(['goal','gk_save','gk_parry'].includes(e.type)&&e.calc?.linkBoost!==undefined){
   require_(lastShot&&lastShot.actor===e.actor&&lastShot.team===e.team&&Math.abs(e.calc.linkBoost-lastShot.bonus)<.00011,'finished shot link evidence mismatch');
 }
 require_(e.positions&&Object.keys(e.positions).length===6,'six player positions required');for(const id of ids){const p=e.positions[id];require_(p&&Number.isInteger(p.x)&&p.x>=0&&p.x<=3&&Number.isInteger(p.y)&&p.y>=0&&p.y<=2,'invalid position '+id);}
const roles=e.roles;require_(roles&&Array.isArray(roles.support),'structured roles required');for(const id of [roles.carrier,roles.challenger,roles.helper,roles.receiver,roles.presser,roles.blocker,...roles.support].filter(Boolean))require_(ids.includes(id),'unknown role participant');
const side=config.teams.findIndex(t=>t.includes(roles.carrier)),availability=e.calc.availability;require_(side>=0&&availability,'missing carrier side/availability');const ball=e.positions[roles.carrier];
for(const id of roles.support)require_(config.teams[side].includes(id)&&id!==roles.carrier&&availability[id]===0&&S.dist(ball,e.positions[id])<=1,'support not near the carrier');require_(new Set(roles.support).size===roles.support.length,'duplicate support');
const defs=e.calc.defenderIds;require_(Array.isArray(defs)&&new Set(defs).size===defs.length,'invalid defending participants');
let path=[ball];if(['pass','through_ball'].includes(e.type)){require_(e.target&&e.to,'pass destination required');let p={...ball},to=e.positions[e.target];while(p.x!==to.x||p.y!==to.y){if(p.x!==to.x)p.x+=Math.sign(to.x-p.x);else p.y+=Math.sign(to.y-p.y);path.push({...p});}}
for(const id of defs)require_(config.teams[1-side].includes(id)&&availability[id]===0&&Math.min(...path.map(p=>S.dist(p,e.positions[id])))<=1,'defender not in the action area');
const expectedDef=config.teams[1-side].filter(id=>availability[id]===0&&Math.min(...path.map(p=>S.dist(p,e.positions[id])))<=1),expectedSup=config.teams[side].filter(id=>id!==roles.carrier&&availability[id]===0&&S.dist(ball,e.positions[id])<=1);
require_(expectedDef.length===defs.length&&expectedDef.every(id=>defs.includes(id)),'available defender omitted');require_(expectedSup.length===roles.support.length&&expectedSup.every(id=>roles.support.includes(id)),'available support omitted');
require_(e.numbers.attackers===roles.support.length+1&&e.numbers.defenders===defs.length,'numbers disagree with participants');require_(!roles.helper||defs.includes(roles.helper),'helper not counted');
for(const tag of e.tags){require_(allowed.has(tag),'unknown tag');if(tag==='overload')require_(roles.support.length>0&&e.numbers.defenders>0&&e.numbers.attackers>e.numbers.defenders,'false overload');if(tag==='help_defence')require_(roles.helper&&e.calc.helpQ>0,'false defensive help');
if(tag==='counter_press')require_(e.type==='press'&&e.calc.sinceRegain!==null&&e.calc.sinceRegain<=1&&e.calc.pressDistance<=1&&roles.presser===e.actor,'false counter press');
if(tag==='direct_outlet')require_(e.type==='through_ball'&&e.calc.wasTransition===true&&e.calc.forwardDistance>0&&e.to.x>e.zone.x&&roles.receiver===e.target,'false direct outlet');
if(tag==='rest_defence_exposed'){require_(e.type==='turnover'&&e.calc.lossZone>=2&&e.calc.caught.length>=2&&e.calc.goalSide.length<=1,'false exposed rest defence');for(const id of e.calc.caught)require_(config.teams[1-e.team].includes(id)&&e.calc.commitment[id]&&S.oriented(e.positions[id],1-e.team)>=e.calc.lossZone,'caught player not actually upfield');}}
}return true;}
window.CageEvidence={validate};})();
