// David Luiz: owner approved 2026-11-01 (ELITE, Libero/Architect, peak 2014-2017, revised profile, OVR 84 from the unchanged formula).
// Source: proposals/david-luiz-recruitment-proposal.json. No per-player OVR override.
(()=>{'use strict';const ps=window.THE_CAGE_PLAYERS;if(ps.length!==216)throw Error('Expected 216-player roster before David Luiz');
const p={"id":"david-luiz","name":"David Luiz","country":"Brazil","role":"D","position":"CB","secondaryPositions":["CDM"],"aliases":["david luiz","luiz"],"peak":"2014-2017","careerTier":"ELITE","folklore":[],"talismanClubs":[],"traits":{"primary":"Libero","secondary":"Architect"},"r":{"pace":79,"tech":84,"pass":85,"finish":60,"def":89,"phys":86,"first_touch":84,"dribbling":82,"passing":85,"vision":84,"finishing":60,"shooting":84,"stamina":85,"physical":86,"tackling":89,"positioning":78,"composure":56},"ratingType":"owner-approved-david-luiz-v1","ratingsVersion":"owner-approved-2026-11-01","overall":84};
if(ps.some(x=>x.id===p.id||x.name===p.name))throw Error('Duplicate '+p.name);if(window.CageOverall.raw(p)!==p.overall)throw Error('OVR mismatch '+p.name);
ps.push(p);window.CAGE_ROSTER_EXTRA_RATINGS=window.CAGE_ROSTER_EXTRA_RATINGS||{};window.CAGE_ROSTER_EXTRA_RATINGS[p.id]={"work_rate":88,"stamina":85,"composure":74,"agility":82,"marking":78};
window.CAGE_ROSTER_VERSION+='-david-luiz-217';})();
