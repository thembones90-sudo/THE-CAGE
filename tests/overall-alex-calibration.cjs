const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const original=JSON.parse(read('docs/roster-audit-184-current.json')).players;
const c={window:{THE_CAGE_PLAYERS:original}};vm.createContext(c);vm.runInContext(read('src/overall.js'),c);
const o=c.window.CageOverall;
assert.equal(o.VERSION,'overall-v1.1');
assert.equal(o.loadedPlayers,184);
assert.deepEqual(Object.keys(o.CALIBRATIONS),['alex-de-souza']);
const alex=original.find(p=>p.id==='alex-de-souza');
assert(alex);assert.equal(alex.careerTier,'ELITE');
assert.equal(o.raw(alex),95,'The historical problem must be reproducible');
assert.equal(alex.overall,89,'Explicit, pending editorial correction');
assert.equal(o.read(alex),89);
for(const p of original){if(p.id!=='alex-de-souza')assert.equal(o.raw(p),p.overall,'Unapproved OVR change for '+p.id);}
assert(o.CALIBRATIONS['alex-de-souza'].reason.includes('overcounts'));
assert(!o.CALIBRATIONS['alex-de-souza'].status.includes('approved'));
console.log('PASS overall-v1.1: Alex 95 -> provisional 89; other 183 OVRs identical to v1.0; no underlying rating edits.');
