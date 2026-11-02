// THE CAGE 2D viewer: key moments and highlight windows. Pure function of the timeline (no record writes, no
// randomness): goals, saves, misses and blocks become markers on the time bar, and each one gets a playback
// window covering its build-up so Highlights can play only those stretches. Nothing here changes a result.
(()=>{'use strict';
const KINDS={goal:{kind:'goal',imp:3,label:'Goal'},golden_goal_start:{kind:'golden',imp:3,label:'Golden Goal overtime'},
  gk_save:{kind:'save',imp:2,label:'Save'},gk_parry:{kind:'save',imp:2,label:'Parried save'},shot_miss:{kind:'miss',imp:1,label:'Shot wide'},block:{kind:'block',imp:1,label:'Shot blocked'}};
const LEAD_MAX=14,LEAD_MIN=3,TAIL=2,GOAL_TAIL=7; // match seconds of build-up / aftermath around each moment
function build(tl){
  const segs=tl.segments,rate=tl.total/Math.max(1,tl.duration),moments=[];
  segs.forEach((s,i)=>{const k=KINDS[s.type];if(!k)return;
    const g=s.type==='goal'?tl.goals.find(x=>x.i===s.i):null,tau=g?g.tau:Math.min(s.tau1,s.tau0+(s.move||0));
    // Build-up starts where this attack began (kick-off or turnover), capped so a long spell stays a highlight.
    let from=s.possStart!=null&&segs[s.possStart]?segs[s.possStart].tau0:s.tau0;
    for(let j=i;j>=0;j--){const t=segs[j].type;if(t==='restart'||t==='turnover'){from=segs[j].tau0;break;}}
    if(s.type==='golden_goal_start')from=s.tau0;
    from=Math.max(0,Math.min(tau-LEAD_MIN*rate,Math.max(from,tau-LEAD_MAX*rate)));
    let to=Math.max(s.tau1,tau+TAIL*rate);
    if(g){const next=segs.find(x=>x.i>s.i&&x.type==='restart');to=Math.min(next?Math.max(next.tau0,s.tau1):tl.total,tau+GOAL_TAIL*rate);to=Math.max(to,s.tau1);}
    moments.push({i:s.i,type:s.type,kind:k.kind,imp:k.imp,label:k.label,team:s.team,actor:segs[i].carrier||null,t:s.t1,tau,from,to:Math.min(tl.total,to)});});
  return moments;}
// Merged, sorted [from,to] playback windows; every goal tau lies inside one.
function windows(tl,moments){const ws=(moments||build(tl)).map(m=>[m.from,m.to]).sort((a,b)=>a[0]-b[0]),out=[];
  for(const w of ws){const l=out[out.length-1];if(l&&w[0]<=l[1]+1e-9)l[1]=Math.max(l[1],w[1]);else out.push(w.slice());}return out;}
window.CageKeyMoments={build,windows};
})();
