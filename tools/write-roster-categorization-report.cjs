// A complete human-readable classification register, regenerated from the tested browser roster.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const current=read('docs/roster-audit-178-current.json');
const before=read('docs/roster-audit-178.json');
const proposals=read('proposals/roster-178-classifications-v1.json');
if(current.total!==178||current.unclassified.length||current.errors.length)throw Error('Incomplete category audit');
const prev=new Map(before.players.map(p=>[p.id,p]));
const arr=current.players.slice();
const tierOrder=['TITAN','LEGEND','ELITE','STALWART','ACE'];
const badgeOrder=['STREET HERO','STREET VILLAIN','TALISMAN','UNDERDOG'];
const escape=s=>String(s??'').replace(/\|/g,'\\|');
const lines=[
 '# THE CAGE — complete 178-player classification register',
 '',
 '> **Status:** active roster metadata V1.3. 40 previously approved profiles preserved; 138 new editorial classifications and 61 provisional missing trait pairs applied. This report is for owner review, not a declaration of individual owner approval.',
 '',
 '## Completed coverage',
 '',
 '| Data field | Coverage |',
 '|---|---:|',
 '| Career tiers | 178 / 178 |',
 '| Folklore explicitly reviewed (including NONE) | 178 / 178 |',
 '| Primary and secondary traits | 178 / 178 |',
 '| Natural positions | 178 / 178 |',
 '| Core/extended ratings | 178 / 178 (17 each) |',
 '| T3 supplemental attributes | 178 / 178 (5 each; 115 remain provisional) |',
 '',
 '### Career tier distribution',
 '',
 '| Tier | Players |',
 '|---|---:|',
 ...tierOrder.map(t=>`| **${t}** | ${current.distribution.tier[t]||0} |`),
 '',
 '### Folklore distribution (badges can stack)',
 '',
 '| Folklore badge | Players |',
 '|---|---:|',
 ...badgeOrder.map(t=>`| ${t} | ${current.distribution.folklore[t]||0} |`),
 '',
 '### Historical review rules',
 '',
 '- **Career tier** measures lifetime stature, accomplishment, peak and influence. It is not a gameplay strength or a direct average of stats.',
 '- **STREET HERO:** defining creative style, cult/football-game reputation, or particularly iconic football performances. Not automatically awarded for being a top player.',
 '- **STREET VILLAIN:** sustained, memorable on-pitch antagonism, intimidation, or brash egotism; not every physical player.',
 '- **TALISMAN:** exceptional identification with a club; every award must include explicit club affiliation.',
 '- **UNDERDOG:** instrumental participation in a genuinely improbable success; not merely winning an important trophy.',
 '',
 '## All 178 footballers, grouped by career tier',
 '',
 'Previously approved = 40 existing records left unchanged. Editorial = new decision from this pass.',
 'Ratings have **not** been modified.',
 ''
];
for(const tier of tierOrder){
 lines.push('### '+tier+' ('+(current.distribution.tier[tier]||0)+')','','| Player | Natural position | Folklore | Primary / Secondary | Status |','|---|---|---|---|---|');
 for(const p of arr.filter(p=>p.careerTier===tier).sort((a,b)=>a.name.localeCompare(b.name,'en'))){
  const old=prev.get(p.id);
  const badge=p.folklore.length?p.folklore.join(', '):'None';
  lines.push(`| ${escape(p.name)} | ${escape(p.position)}${p.secondaryPositions?.length?' / '+p.secondaryPositions.join(', '):''} | ${badge} | ${p.traits.primary} / ${p.traits.secondary} | ${old?.careerTier?'Previously approved':'Editorial'} |`);
 }
 lines.push('');
}
lines.push('## TALISMAN affiliations', '', '| Player | Club(s) |', '|---|---|');
for(const row of current.talismans.sort((a,b)=>a.id.localeCompare(b.id))){
 const p=arr.find(v=>v.id===row.id);
 lines.push(`| ${escape(p.name)} | ${row.clubs.map(escape).join('; ')} |`);
}
lines.push('','## UNDERDOG documentary anchors','',
 '- **2002 Brazil World Cup** — Ronaldo Nazário: recovery and decisive comeback on the world stage (prior owner-approved).',
 '- **1996 Nigeria Olympic gold** — Jay-Jay Okocha, Nwankwo Kanu and Tijjani Babangida (the latter two previously approved).',
 '- **2000 Cameroon Olympic gold** — Patrick Mboma (previously approved).',
 '- **2002 South Korea World Cup semifinal** — Park Ji-sung (previously approved).',
 '- **2004 Deportivo–AC Milan comeback** — Alberto Luque (previously approved).',
 '- **2005 Liverpool Istanbul comeback** — Gerrard, Xabi Alonso, Carragher, Hyypiä, Baroš and Djibril Cissé; all contributed in the tournament/final, with some previously approved.',
 '- **2016 Leicester title** — Jamie Vardy, Riyad Mahrez and N’Golo Kanté.',
 '',
 'Primary historical references: [UEFA 2005 Liverpool final](https://www.uefa.com/uefachampionsleague/news/0253-0d7b89fe7b7f-c91716d11bdf-1000--2004-05-liverpool-belief-defies-milan/), [UEFA Istanbul team and player overview](https://www.uefa.com/uefachampionsleague/news/0251-0e98bc21c908-9de905297d1e-1000--snap-shot-gerrard-and-liverpool-s-istanbul-heroes/), [Premier League 2015/16 Leicester story](https://www.premierleague.com/en/news/4220354), [AC Milan historical legends](https://www.acmilan.com/en/club/legends/all-players).',
 '',
 '## Decisions worth discussing individually',
 '',
 '| Player or category | Current assignment | Why this is a discussion rather than a proven error |',
 '|---|---|---|',
 '| Neymar | TITAN | Global influence and prime technical greatness versus the demanding all-career threshold |',
 '| Fabio Cannavaro | TITAN | 2006 Ballon d’Or and World Cup leadership versus longer-run positional comparisons |',
 '| Andrea Pirlo | TITAN | Historic midfield influence versus the boundary with LEGEND |',
 '| Sergio Busquets | LEGEND | One of the most influential holding midfielders; a plausible TITAN promotion |',
 '| Gareth Bale | LEGEND | Champions League decisive moments could support TITAN |',
 '| Wayne Rooney | LEGEND | Longevity and Manchester United scoring records could support TITAN |',
 '| Son Heung-min | LEGEND + TALISMAN | Global icon and Tottenham symbol; career-tier boundary worth reviewing |',
 '| Yannick Bolasie | ACE + STREET HERO | Cult technique and gaming appeal outstrip his trophy collection, but STALWART is defensible |',
 '| STREET HERO density | '+current.distribution.folklore['STREET HERO']+' / 178 | The badge is common in this specially curated iconic-player roster; review strictness before considering the folklore system final |',
 '| TALISMAN density | '+current.distribution.folklore.TALISMAN+' / 178 | Every club association is recorded; overlapping legends at Chelsea, Barcelona and the Manchester clubs warrant owner review |',
 '',
 '## Gameplay safeguards',
 '',
 '- **No prime ratings changed.** All existing 17 core/extended values and five T3 supplemental attributes are untouched.',
 '- **No existing traits overwritten.** Only the exact 61 missing pairs were installed.',
 '- **Existing 40 classified dossiers preserved** byte-for-byte in their career tier, folklore and traits.',
 '- **T3 remains opt-in** through `?engine=t3`, and its decision-trait module remains opt-in during simulations. Classifications alone do not enable a new engine.',
 '- **Players not actually in the 178-player roster are not secretly added.** Diego Maradona, Eric Cantona and Raúl remain recruitment candidates.',
 '',
 '## Reproduction',
 '',
 '1. `node tools/create-roster-categorization.cjs` regenerates proposal and browser metadata from the immutable pre-classification audit.',
 '2. `node tools/build-t3.cjs` regenerates the T3 calibration and engine.',
 '3. `node tests/roster-178-categorization.cjs` checks all categories, previous owner-approved locks, retained ratings and deterministic trait-enabled T3 matches.',
 '4. `node tools/audit-roster.cjs` refreshes the current complete roster audit, never overwriting the historic pre-classification snapshot.'
 );
const out=path.join(root,'docs/ROSTER_CATEGORIZATION_178.md');fs.writeFileSync(out,lines.join('\n')+'\n','utf8');
console.log('Generated '+out+' ('+lines.length+' lines), 178 profiles, '+current.talismans.length+' talisman affiliations');
