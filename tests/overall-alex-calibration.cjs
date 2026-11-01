// Alex is now formula-derived at 86, not a manual override.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const audit=JSON.parse(read('docs/roster-audit-184-current.json'));
const origin=JSON.parse(read('docs/roster-audit-182-current.json')).players.find(p=>p.id==='alex-de-souza');
const approved=JSON.parse(read('proposals/ELITE_OVR_67_APPROVED.json')).players.find(p=>p.id==='alex-de-souza');
const ctx={window:{THE_CAGE_PLAYERS:audit.players}};vm.createContext(ctx);vm.runInContext(read('src/overall.js'),ctx);
const api=ctx.window.CageOverall,alex=audit.players.find(p=>p.id==='alex-de-souza');
assert.equal(api.VERSION,'overall-v2.1-owner-approved');
assert.equal(api.loadedPlayers,184);
assert(!api.REVIEW_OVERRIDES['alex-de-souza'],'Alex remains formula-derived');
assert(origin&&alex&&approved);
assert.equal(alex.careerTier,'ELITE');
const source={...origin.r};for(const [key,vals] of Object.entries(approved.changes)){assert.equal(source[key],vals[0],key);source[key]=vals[1];}
assert.deepEqual(alex.r,source,'Alex underlying prime attributes must be visibly recalibrated');
assert.equal(api.raw(alex),86);assert.equal(alex.overall,86);assert.equal(api.compute(alex),86);
assert.equal(approved.previous,89);assert.equal(approved.approvedOVR,86);
for(const p of audit.players)assert.equal(api.compute(p),api.REVIEW_OVERRIDES[p.id]?.overall??api.raw(p),'Display OVR mismatch '+p.id);
console.log('PASS ALEX_V21: Alex remains raw/formula/display 86; reviewed player OVR corrections validated.');
