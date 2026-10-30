const fs=require('fs'),vm=require('vm');
const root='A:/THE CAGE/',read=p=>fs.readFileSync(root+p,'utf8');
const html=read('index.html'),ctx={window:{location:{search:'?engine=t3'}}};vm.createContext(ctx);
for(const m of html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)){
 if(m[1]==='src/cage-engine.js')break;
 vm.runInContext(read(m[1]),ctx,{filename:m[1]});
}
const data=JSON.parse(read('proposals/ratings-v1.json')),expansion=JSON.parse(read('proposals/ratings-expansion-36-provisional.json'));
for(const [id,attr] of Object.entries(expansion.players)){if(data.players[id])throw Error('duplicate '+id);data.players[id]=attr;}
ctx.window.CAGE_APPROVED_RATINGS=data;
vm.runInContext(read('src/engine/attributes.js'),ctx,{filename:'src/engine/attributes.js'});
const ps=ctx.window.THE_CAGE_PLAYERS.filter(p=>p.attributesProvisional).map(p=>({
 id:p.id,role:p.role,position:p.position,traits:p.traits,attribute:{...p.attributes},
 r:{stamina:p.r.stamina,composure:p.r.composure,pace:p.r.pace,dribbling:p.r.dribbling,tech:p.r.tech,def:p.r.def,tackling:p.r.tackling,positioning:p.r.positioning}
}));
fs.writeFileSync(root+'docs/provisional-115-baseline.json',JSON.stringify(ps,null,2)+'\n');
console.log('Wrote provisional baseline '+ps.length);
for(const p of ps){const a=p.attribute,r=p.r;console.log(p.id.padEnd(26),p.position.padEnd(4),'A '+[a.work_rate,a.stamina,a.composure,a.agility,a.marking].map(x=>String(x).padStart(2)).join(','),'R '+[r.stamina,r.composure,r.pace,r.dribbling,r.def,r.positioning].map(x=>String(x).padStart(2)).join(','));}
