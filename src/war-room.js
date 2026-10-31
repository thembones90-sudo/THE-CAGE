// THE CAGE V6.5 WAR ROOM. Read-only scouting. Never drafts, simulates, or reveals an opponent's private pool.
(function(root,factory){const api=factory();root.CageWarRoom=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const ATTRS=Object.freeze(['pace','tech','pass','finish','def','phys','first_touch','dribbling','passing','vision','finishing','shooting','stamina','physical','tackling','positioning','composure']);
const DEF=new Set(['D','CB','RB','LB','RWB','LWB','DEF']),MID=new Set(['M','CM','CDM','CAM','AM','RM','LM','MID']);
const kind=p=>{const v=String(p.role||p.position||'').toUpperCase();return DEF.has(v)||v.startsWith('DEF')?'DEF':MID.has(v)||v.startsWith('MID')?'MID':'ATT';};
const roleLabel={DEF:'DEFENCE',MID:'MIDFIELD',ATT:'ATTACK'};
function composition(players){const counts={DEF:0,MID:0,ATT:0};players.forEach(p=>counts[kind(p)]++);return {counts,missing:Object.keys(counts).filter(k=>!counts[k]),complete:Object.keys(counts).every(k=>counts[k]>0)};}
function fitness(p,selected=[]){const counts=composition(selected).counts,k=kind(p);return {kind:k,role:roleLabel[k],fillsGap:counts[k]===0,similarRoleCount:counts[k],note:counts[k]===0?'Adds a currently missing football role.':'Adds another '+roleLabel[k].toLowerCase()+' specialist.'};}
function compare(a,b){if(!a||!b||a.id===b.id)throw Error('Compare two distinct players');return {names:[a.name,b.name],overall:[Number(a.overall),Number(b.overall)],rows:ATTRS.map(k=>({key:k,label:k.replaceAll('_',' ').toUpperCase(),a:Number(a.r?.[k]||0),b:Number(b.r?.[k]||0)})),roles:[kind(a),kind(b)]};}
const el=(tag,cls,text)=>{const d=document.createElement(tag);if(cls)d.className=cls;if(text!==undefined)d.textContent=text;return d;};
function create(host){
 if(!host)throw Error('War Room host missing');
 let picks=[],pool=[],selected=[],availableIds=new Set();
 const top=el('div','war-head'),title=el('h3','','THE WAR ROOM'),sub=el('p','muted','Scout two candidates without locking a pick. The 20-second clock continues.');
 top.append(title,sub);
 const body=el('div','war-content');host.replaceChildren(top,body);
 const note=el('p','war-foot','Scouting shows recorded player attributes and positional composition, not an invented win probability.');host.append(note);
 function update(){
  const comp=composition(picks),topLine=el('div','war-composition');
  topLine.append(el('strong','','YOUR TRIO'),el('span','','DEF '+comp.counts.DEF+'  /  MID '+comp.counts.MID+'  /  ATT '+comp.counts.ATT));
  topLine.append(el('small','',comp.missing.length?'Roles not yet filled: '+comp.missing.map(k=>roleLabel[k]).join(', '):'All three football role families represented.'));
  body.replaceChildren(topLine);
  const picksRow=el('div','war-compare-head');
  for(let i=0;i<2;i++){const p=selected[i],slot=el('div','war-slot',p?p.name+' · '+p.overall+' OVR':'SCOUT SLOT '+(i+1));slot.setAttribute('aria-label','Comparison slot '+(i+1));picksRow.append(slot);}body.append(picksRow);
  if(selected.length<2){body.append(el('p','muted','Use the SCOUT buttons beneath any two visible cards to compare all 17 attributes.'));return;}
  const [a,b]=selected,t=compare(a,b),table=el('table','war-attributes'),thead=el('thead'),headrow=el('tr');
  for(const c of ['ATTRIBUTE',a.name,b.name])headrow.append(el('th','',c));thead.append(headrow);table.append(thead);
  const tb=el('tbody');for(const r of t.rows){const tr=el('tr');tr.append(el('th','',r.label));const c1=el('td',r.a>r.b?'war-better':'',String(r.a)),c2=el('td',r.b>r.a?'war-better':'',String(r.b));tr.append(c1,c2);tb.append(tr);}table.append(tb);body.append(table);
  const role=el('p','war-foot');
  role.textContent=a.name+': '+fitness(a,picks).note+' '+b.name+': '+fitness(b,picks).note;
  body.append(role);
 }
 function setContext(currentPicks,currentPool){picks=(currentPicks||[]).slice();pool=(currentPool||[]).slice();availableIds=new Set(pool.map(p=>p.id));selected=selected.filter(p=>availableIds.has(p.id));update();}
 function select(p){if(!p||!availableIds.has(p.id))return false;if(selected.some(x=>x.id===p.id))selected=selected.filter(x=>x.id!==p.id);else if(selected.length<2)selected.push(p);else selected=[selected[1],p];update();return true;}
 function clear(){selected=[];picks=[];pool=[];availableIds.clear();update();}
 update();return Object.freeze({setContext,select,clear,get selectedIds(){return selected.map(p=>p.id);}});
}
return Object.freeze({ATTRS,kind,composition,fitness,compare,create});
});
