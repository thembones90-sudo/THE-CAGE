// GENERATED from proposals/owner-tier-revisions-10-v17.json by tools/build-owner-tier-overlay.cjs.
// These owner tier corrections intentionally supersede historical editorial and approved decisions.
(()=>{'use strict';
const ids=Object.freeze(["hidetoshi-nakata","shunsuke-nakamura","ariel-ortega","robert-prosinecki","darko-pancev","alen-boksic","ilkay-gundogan","miodrag-belodedici","safet-susic","nwankwo-kanu"]);
const roster=window.THE_CAGE_PLAYERS;
if(!Array.isArray(roster)||roster.length!==184)throw Error('Owner-tier overlay requires roster of 184');
const byId=new Map(roster.map(p=>[p.id,p]));
if(byId.size!==184||byId.get('jay-jay-okocha')?.careerTier!=='LEGEND')throw Error('Okocha owner-locked LEGEND status was changed');
for(const id of ids){const p=byId.get(id);if(!p||p.careerTier!=='LEGEND')throw Error('Expected prior LEGEND tier for '+id);p.careerTier='ELITE';p.classificationStatus='owner-confirmed-v1.7';p.tierDecision={from:'LEGEND',to:'ELITE',version:'owner-tier-decisions-v1.7'};}
const count=tier=>roster.filter(p=>p.careerTier===tier).length;
if(count('TITAN')!==30||count('LEGEND')!==69||count('ELITE')!==67||count('STALWART')!==18)throw Error('Unexpected post-decision tier distribution');
window.CAGE_OWNER_TIER_DECISIONS=Object.freeze({version:'owner-tier-decisions-v1.7',movedIds:ids,lockedLegend:'jay-jay-okocha'});
window.CAGE_ROSTER_VERSION=String(window.CAGE_ROSTER_VERSION||'editorial-184')+'+owner-tiers-v1.7';
})();
