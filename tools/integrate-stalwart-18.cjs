const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),file=p=>path.join(root,p),data=JSON.parse(fs.readFileSync(file('proposals/STALWART_OVR_18_APPROVED.json')));
if(data.players.length!==18)throw Error('Expected 18 STALWARTs');
const rows=data.players.map(p=>({id:p.id,target:p.target,changes:Object.fromEntries(Object.entries(p.changes).filter(([k])=>!['passing','finishing','physical'].includes(k)))}));
const code=[
// Apply owner-approved STALWART skill changes ahead of the shared OVR formula.
'(()=>{\'use strict\';',
'const records='+JSON.stringify(rows)+';',
'const players=window.THE_CAGE_PLAYERS,byId=new Map(players.map(p=>[p.id,p]));',
'const aliases={pass:"passing",finish:"finishing",phys:"physical"};',
'for(const row of records){',
'const p=byId.get(row.id);if(!p||p.careerTier!=="STALWART")throw Error("STALWART missing "+row.id);',
'for(const [k,v] of Object.entries(row.changes)){if(p.r[k]!==v[0])throw Error("STALWART source mismatch "+row.id+" "+k);p.r[k]=v[1];if(aliases[k])p.r[aliases[k]]=v[1];}',
'p.ratingReviewStatus="owner-approved-stalwart-ovr-v1";',
'}',
'window.CAGE_STALWART_OVR_APPROVED=Object.freeze({targets:Object.freeze(Object.fromEntries(records.map(x=>[x.id,x.target]))),playerCount:18});',
'})();',''].join('\n');
fs.writeFileSync(file('src/stalwart-ovr-approved-v1.js'),code);
for(const html of ['index.html','draft.html']){
 let s=fs.readFileSync(file(html),'utf8');
 const marker='<script src="src/overall.js"></script>';
 if(!s.includes('src/stalwart-ovr-approved-v1.js')){if(!s.includes(marker))throw Error('No overall script in '+html);s=s.replace(marker,'<script src="src/stalwart-ovr-approved-v1.js"></script>'+marker);fs.writeFileSync(file(html),s);}
}
let t=fs.readFileSync(file('tools/build-t3.cjs'),'utf8');
if(!t.includes("'src/stalwart-ovr-approved-v1.js'")){t=t.replace("'src/elite-ovr-approved-v21.js'])","'src/elite-ovr-approved-v21.js','src/stalwart-ovr-approved-v1.js'])");fs.writeFileSync(file('tools/build-t3.cjs'),t);}
console.log('Integrated 18 STALWART source adjustments ahead of overall.js');
