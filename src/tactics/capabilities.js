(()=>{'use strict';
const avg=a=>a.reduce((s,v)=>s+v,0)/a.length,desc=a=>a.slice().sort((a,b)=>b-a),lim=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
function comp(p){const a=window.CageAttributes.read(p),c={a,
dribble:.45*a.tech+.25*a.agi+.15*a.pace+.15*a.com,tackle:.45*a.def+.30*a.mrk+.15*a.phys+.10*a.agi,press:.45*a.wr+.25*a.pace+.15*a.agi+.15*a.mrk,escape:.40*a.tech+.25*a.com+.20*a.agi+.15*a.phys,pass:.65*a.pass+.20*a.tech+.15*a.com,intercept:.55*a.mrk+.25*a.wr+.20*a.pace,shot:.60*a.finish+.25*a.com+.15*a.tech,long:.55*a.finish+.25*a.phys+.20*a.tech,recover:.60*a.pace+.40*a.wr,rebound:.40*a.pace+.30*a.agi+.30*a.phys,vision:.6*a.pass+.4*a.tech,stamina:a.sta};
c.ATT=.30*a.finish+.25*c.dribble+.15*a.tech+.15*a.com+.15*a.pace;c.MID=.30*c.pass+.20*c.escape+.20*a.tech+.15*a.wr+.15*a.sta;c.DEF=.40*c.tackle+.30*a.mrk+.15*a.wr+.15*a.pace;return c;}
const keys=['AT','DS','MC','TE','PD','TA'];
function raw(ps){if(ps.length!==3)throw Error('Capabilities require three players.');const c=ps.map(comp),att=desc(c.map(x=>x.ATT)),def=desc(c.map(x=>x.DEF)),mid=desc(c.map(x=>x.MID)),ints=desc(c.map(x=>x.intercept));let outlet=0;for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(i!==j)outlet=Math.max(outlet,(c[i].pass+c[j].a.pace)/2);
return {AT:.45*att[0]+.30*att[1]+.25*att[2],DS:.35*def[0]+.35*def[1]+.30*def[2],MC:.40*mid[0]+.40*mid[1]+.20*Math.min(...c.map(x=>x.escape)),TE:.35*avg(ints.slice(0,2))+.35*outlet+.30*avg(c.map(x=>x.a.pace)),PD:avg(c.map(x=>.35*x.a.phys+.25*x.a.sta+.25*x.a.wr+.15*x.press)),TA:.50*avg(c.map(x=>desc([x.ATT,x.MID,x.DEF])[1]))+.50*Math.min(att[0],mid[0],def[0])};}
function grades(ps){const calibration=window.CAGE_TACTICAL_CALIBRATION;if(!calibration||calibration.rosterVersion!==window.CAGE_ROSTER_VERSION)throw Error('Roster calibration is missing or stale.');const values=raw(ps);return Object.fromEntries(keys.map(k=>[k,lim(Math.round(50+12*(values[k]-calibration.dimensions[k].mean)/calibration.dimensions[k].sd),5,99)]));}
function shape(ps){const c=ps.map(comp),perms=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];let best;for(const pm of perms){const v=[c[pm[0]].DEF,c[pm[1]].MID,c[pm[2]].ATT],score=v.reduce((s,x)=>s+x,0);if(!best||score>best.score)best={pm,score,v};}return {duty:best.pm,cover:best.v,phase:best.v};}
function phaseProfile(p){const c=comp(p),cal=window.CAGE_TACTICAL_CALIBRATION.phases,v=['ATT','MID','DEF'].map(k=>({phase:k,score:50+12*(c[k]-cal[k].mean)/cal[k].sd})).sort((a,b)=>b.score-a.score);return {phase:v[0].phase,twoWay:v[0].score-v[1].score<=6};}
window.CageCapabilities={comp,raw,grades,shape,phaseProfile,keys,avg,desc,lim};
})();
