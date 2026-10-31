'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const h=read('play.html'),files=[...h.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map(x=>x[1]),c={window:{location:{search:''}}};vm.createContext(c);
for(const f of files){vm.runInContext(read(f),c,{filename:f});if(f==='src/viewer/clock.js')break;}
const E=c.window.CageEngine,R=c.window.CageRecords,T=c.window.CageViewerTimeline,C=c.window.CageViewerClock;
let min=1e9,max=0,total=0,n=0;
for(let seed=260;seed<285;seed++){
 const config={teams:[['paolo-maldini','michael-ballack','ronaldo-nazario'],['ledley-king','claudio-marchisio','antonio-valencia']],tactics:['balanced','press'],seed,mode:'score',traits:{enabled:true},keepers:['gianluigi-buffon','manuel-neuer']};
 const result=E.simulate(config),record=R.make(config,result,1),timeline=T.buildTimeline(record);
 const dynamic=C.createPlayback(timeline,{speed:'dynamic'}).estimate();
 const dramatic=C.createPlayback(timeline,{speed:'dramatic'}).estimate();
 assert(Number.isFinite(dynamic)&&dynamic>20&&dynamic<65,'Viewer duration not condensed: '+dynamic);
 for(const e of result.events.filter(x=>['gk_save','gk_parry'].includes(x.type)))assert(['left','centre','right'].includes(e.zone?.lane),'GK reaction missing recorded target lane');
 n++;min=Math.min(min,dynamic);max=Math.max(max,dynamic);total+=dynamic;
 if(seed===260)console.log('V66_VIEW_TIMING_SAMPLE',JSON.stringify({simulatedSeconds:result.duration,viewerTimelineSeconds:timeline.total,dynamicSeconds:dynamic,dramaticSeconds:dramatic}));
}
console.log('V66_VIEW_TIMING_PASS',n,'GK matches, dynamic min',min.toFixed(1),'mean',(total/n).toFixed(1),'max',max.toFixed(1));
