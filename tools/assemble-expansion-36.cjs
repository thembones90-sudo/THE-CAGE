// Assemble unapproved supplemental attributes; never rewrite the approved 63-player rating source.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const base=JSON.parse(fs.readFileSync(path.join(root,'proposals/ratings-pl-31-provisional.json'),'utf8'));
if(Object.keys(base.players).length!==31)throw Error('Expected 31 Premier League player proposals');
const extras={
'andrea-barzagli':[80,85,90,70,96,'Calm, unusually reliable defensive reader; limited agility and attacking intent.'],
'matt-le-tissier':[53,73,94,74,35,'Unhurried but inventive technician, composure and flair with minimal defensive running.'],
'hernan-crespo':[76,85,90,82,33,'Excellent penalty-area anticipation and cool finishing; limited defensive reading.'],
'marcelo-salas':[77,83,88,88,31,'Sharp turning, strong left-foot finishing and clinical decisions.'],
'ivan-zamorano':[88,91,86,75,41,'Relentless runner and aerial finisher with high physical commitment.']
};
for(const [id,vals] of Object.entries(extras)){if(base.players[id])throw Error('Duplicate expansion rating '+id);const [work_rate,stamina,composure,agility,marking,reason]=vals;base.players[id]={work_rate,stamina,composure,agility,marking,rationale:'Provisional individual editorial assessment. '+reason};}
if(Object.keys(base.players).length!==36)throw Error('Expected exactly 36 provisional profiles');
base.version='ratings-expansion-36-proposal';base.status='UNAPPROVED: 36 supplemental player attribute records; 63 original approved records remain separate';base.method='Individual subjective editorial proposals anchored to existing rating scale; not formula-derived. No match outcomes consulted.';
fs.writeFileSync(path.join(root,'proposals/ratings-expansion-36-provisional.json'),JSON.stringify(base,null,2)+'\n');
console.log('Created separate 36-player provisional five-attribute ratings file');