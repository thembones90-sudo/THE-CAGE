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
 '> **OVR V1.1 · provisional position-aware editorial indicator with explicitly documented calibration.** Not a FIFA/EA FC rating, objective historical ranking, career tier, or match engine input.',
 '',
 '## Method',
 '',
 '- **Position-aware:** weighted combination of core and relevant extended prime ratings, rounded to nearest integer.',
 '- **No tier inflation:** TITAN, LEGEND, ELITE, folklore, traits, and provisional tactical attributes contribute zero to OVR.',
 '- **Position profiles:** CM supports a ball-winning profile; fullbacks support a playmaking profile. The higher relevant value applies without changing player position.',
 '- **Bounds:** integer 1–99. The uncalibrated value uses prime ratings. Editorial exceptions are explicitly recorded and subject to individual review.',
 '- **Match impact:** none. OVR is for card display only; simulations use the existing engine and player inputs.',
 '- **Raw ratings remain untouched.** OVR is recomputed from the current rated player.',
 '',
 '## Provisional manual calibration',
 '',
 '- **Alex de Souza:** uncalibrated CAM score **95**; displayed OVR **89** pending owner review. His underlying 17 attributes, career tier and folklore remain unchanged.',
 '- **Reason:** the CAM weights heavily double-count correlated technique, passing, vision and first-touch attributes, leading to an implausibly high cross-position OVR.',
 '- **Limitation:** the broader positional OVR model remains an editorial draft. Other surprising ratings, especially midfield specialists, still need holistic review. No other overall value was changed in V1.1.',
 '- **Source of explicit calibration:** `CageOverall.CALIBRATIONS` in `src/overall.js`.',
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
 '- Run node tests/overall-alex-calibration.cjs to prove Alex 95 → 89 while other 183 remain identical.',
 '- Run node tests/overall-match-invariance.cjs to verify T3 results are identical with and without OVR.',
 '- Run node tests/ui-regression.cjs to check claimed-tile OVR in headless Chrome.',
 '- Run node tests/random-draft.cjs to check all card badges and squad ratings.',
 '',
 '**Source:** src/overall.js. Main card UI: src/showdown.js. Draft card UI: src/random-draft.js.'
];
fs.writeFileSync(path.join(root,'docs/OVERALL_RATINGS_184.md'),lines.join('\n')+'\n');
console.log('Created 184-entry OVR register, distribution '+JSON.stringify(bins));
