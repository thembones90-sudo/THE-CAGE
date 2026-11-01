'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Names=require('../src/viewer-v4/label-layout.js'),FX=require('../src/viewer-v4/fx.js'),{loadViewer}=require('./viewer/harness.cjs');
for(const width of [260,420,960]){
 const bounds={x:0,y:0,w:width,h:Math.round(width*.53)},players=Array.from({length:8},(_,i)=>({id:'p'+i,name:'PLAYER '+i,x:width/2,y:bounds.h/2,width:65}));
 const before=JSON.stringify(players),boxes=Names.place(players,bounds,9,{height:17,gap:4,carrier:'p0'});
 assert.equal(boxes.length,8);assert.equal(JSON.stringify(players),before);
 for(const b of boxes){assert(b.x>=0&&b.y>=0&&b.x+b.w<=bounds.w&&b.y+b.h<=bounds.h);for(const other of boxes)if(b!==other)assert.equal(Names.intersect(b,other),0,'crowded labels overlap at width '+width);}
 assert.deepEqual(Names.place(players,bounds,9,{height:17,gap:4,carrier:'p0'}),boxes);
}
function context(calls){return new Proxy({measureText:text=>({width:String(text).length*6.5}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get(target,key){if(key in target)return target[key];return(...args)=>calls.push({kind:key,args,fill:target.fillStyle});}});}
function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
for(const width of [350,980])for(const reducedMotion of [false,true]){
 const calls=[],ctx=context(calls),canvas={width:0,height:0,getContext:()=>ctx,getBoundingClientRect:()=>({width,height:width*650/1200})},W=loadViewer();
 W.CageViewerV4FX=FX;W.CageLabelLayout=Names;W.devicePixelRatio=1;
 const sandbox={window:W,document:{createElement:()=>({getContext:()=>context([])})},Image:class{complete=false;naturalWidth=0;},console};vm.createContext(sandbox);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/viewer-v4/renderer.js'),'utf8'),sandbox);
 const players={},teamOf={},labels={},numbers={};for(let i=0;i<6;i++){players['p'+i]={u:.45+i*.01,v:.5};teamOf['p'+i]=i%2;labels['p'+i]='PLAYER '+i;numbers['p'+i]=1+Math.floor(i/2);}
 const frame=freeze({players,teamOf,labels,numbers,keepers:['g0','g1'],keeperLabels:{g0:'GK · LEFT',g1:'GK · RIGHT'},ball:{u:.45,v:.5,owner:'p0'},carrier:'p0',reducedMotion,tau:0});
 const before=JSON.stringify(frame),renderer=W.CageViewerRenderer.createRenderer(canvas);renderer.draw(frame);
 assert.equal(JSON.stringify(frame),before,'drawing changed recorded positions');
 const text=calls.filter(c=>c.kind==='fillText').map(c=>c.args[0]);for(const name of [...Object.values(labels),'GK · LEFT','GK · RIGHT'])assert(text.includes(name),'missing identity '+name);
 for(const number of ['A1','B1','A2','B2','A3','B3'])assert(text.includes(number),'missing team-number marker '+number);
 assert(calls.some(c=>c.kind==='roundRect'),'second team needs its distinct shape');
 assert(calls.some(c=>c.kind==='fill'&&c.fill==='#ffffff'),'football needs its high-contrast white fill');
}
console.log('VISUAL_READABILITY_PASS eight crowded labels at three sizes; all eight identities and six team numbers rendered at two widths, normal/reduced motion; frozen input unchanged');
