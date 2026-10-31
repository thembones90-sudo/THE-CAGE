'use strict';const assert=require('node:assert/strict'),D=require('../src/keeper-draft.js'),G=require('../src/goalkeepers.js');let x=0;const rng=()=>{x=(x+.17)%1;return x;},used=new Set(),offers=[];
for(let round=0;round<5;round++){const m=D.create(G.players,used,rng);const a=m.reveal(100),saved=m.snapshot();assert.equal(a.offer.length,5);assert.equal(a.deadline,10100);assert.equal(m.restore(saved).stage,'pickingA');const p=m.pick(a.offer[0],200);used.add(p.id);assert.equal(m.stage,'handoffB');
const b=m.reveal(300);assert.equal(new Set([...a.offer,...b.offer]).size,10,'blind keeper offers must be disjoint within the same round');
assert.equal(b.offer.length,5);const q=m.pick(b.offer[0],400);used.add(q.id);assert(m.complete);assert.equal(m.picks.A,p.id);assert.equal(m.picks.B,q.id);
offers.push([a.offer,b.offer]);}
assert.equal(used.size,10);assert(offers.length===5);
const m=D.create(G.players,used,()=>.5),v=m.reveal(1000);assert.equal(m.pick(v.offer[0],11000).automatic,true,'expiry must auto pick without a timer reset');
assert.throws(()=>m.pick(v.offer[1]),/no active offer/);
assert.throws(()=>D.create(G.players,used,()=>.5).restore({stage:'pickingA',offer:['invalid'],picks:{A:null,B:null},firstOffer:[],deadline:12}));
const restoreBase=D.create(G.players,[],()=>.31);const first=restoreBase.reveal(100);const picked=restoreBase.pick(first.offer[0],200);const handoff=restoreBase.snapshot();
const invalidHandoff={...handoff,firstOffer:[]};
assert.throws(()=>D.create(G.players,[picked.id],()=>.5).restore(invalidHandoff),/Invalid GK handoff/);
const validB=D.create(G.players,[picked.id],()=>.5);validB.restore(handoff);validB.reveal(300);const invalidSecond={...validB.snapshot(),offer:validB.offer.slice()};invalidSecond.offer[0]=first.offer[1];assert.throws(()=>D.create(G.players,[picked.id],()=>.5).restore(invalidSecond),/Invalid second keeper offer/);
console.log('V66_KEEPER_DRAFT_PASS 5 full 10-keeper showdown rounds, blind disjoint 5-card GK offers, 10s clock, exhaustion, persistence, expiry auto-pick');
