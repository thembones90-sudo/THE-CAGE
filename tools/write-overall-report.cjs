// THE CAGE OVR register. Rebuild after any roster/ratings/formula change.
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const players=JSON.parse(read('docs/roster-audit-184-current.json')).players;
const c={window:{THE_CAGE_PLAYERS:players}};vm.createContext(c);vm.runInContext(read('src/overall.js'),c);
const listed=players.slice().sort((a,b)=>b.overall-a.overall||a.name.localeCompare(b.name,'en'));
const bins={};for(const p of listed){const tier=p.overall>=90?'90–99':p.overall>=85?'85–89':p.overall>=80?'80–84':p.overall>=75?'75–79':'1–74';bins[tier]=(bins[tier]||0)+1}
const lines=[
 '# THE CAGE: 184 Player Overall Ratings',
 '',
 '> **OVR V1.0 · position-aware editorial skill indicator.** Not a FIFA/EA FC rating, objective historical ranking, career tier, or match engine input.',
 '',
 '## Method',
 '',
 '- **Position-aware:** weighted combination of core and relevant extended prime ratings, rounded to nearest integer.',
 '- **No tier inflation:** TITAN, LEGEND, ELITE, folklore, traits, and provisional tactical attributes contribute zero to OVR.',
 '- **Position profiles:** CM supports a ball-winning profile; fullbacks support a playmaking profile. The higher relevant value applies without changing player position.',
 '- **Bounds:** integer 1–99. Calculated from immutable core stats, not from games won or drafted.',
 '- **Match impact:** none. OVR is for card display only; simulations use the existing engine and player inputs.',
 '- **Raw ratings remain untouched.** OVR is recomputed from the current rated player.',
 '',
 '## Distribution',
 '',
 '| OVR band | Players |',
 '|---|---:|',
 ...['90–99','85–89','80–84','75–79','1–74'].map(k=>'| '+k+' | '+(bins[k]||0)+' |'),
 '',
 '## Full roster',
 '',
 '| OVR | Player | Position | Career tier |',
 '|---:|---|---|---|',
 ...listed.map(p=>'| **'+p.overall+'** | '+p.name.replace(/\|/g,'\\|')+' | '+p.position+' | '+(p.careerTier||'')+' |'),
 '',
 '## Verification',
 '',
 '- Run node tests/overall-184.cjs to check all 184 ratings and invariants.',
 '- Run node tests/overall-match-invariance.cjs to verify T3 results are identical with and without OVR.',
 '- Run node tests/ui-regression.cjs to check claimed-tile OVR in headless Chrome.',
 '- Run node tests/random-draft.cjs to check all card badges and squad ratings.',
 '',
 '**Source:** src/overall.js. Main card UI: src/showdown.js. Draft card UI: src/random-draft.js.'
];
fs.writeFileSync(path.join(root,'docs/OVERALL_RATINGS_184.md'),lines.join('\n')+'\n');
console.log('Created 184-entry OVR register, distribution '+JSON.stringify(bins));
