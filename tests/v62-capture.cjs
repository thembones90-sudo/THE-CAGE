'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),profile=path.join(root,'chrome-v62-visual-'+process.pid),port=0;
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser=cp.spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--disable-extensions','--remote-debugging-port='+port,'--remote-allow-origins=*','--user-data-dir='+profile,'--window-size=1680,1050','about:blank'],{stdio:'ignore'});
const sleep=t=>new Promise(r=>setTimeout(r,t));
async function go(){
 let info;for(let i=0;i<70;i++){try{const ownPort=Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split(/\r?\n/)[0]);if(!ownPort)throw Error('Chrome port not ready');const a=await(await fetch('http://127.0.0.1:'+ownPort+'/json')).json();info=a.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);if(info)break;}catch{}await sleep(100);}
 if(!info)throw Error('Chrome CDP not ready');
 const ws=new WebSocket(info.webSocketDebuggerUrl),pending=new Map();let seq=0;
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}};
 await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 await cmd('Page.enable');await cmd('Runtime.enable');
 await cmd('Page.navigate',{url:(process.env.CAGE_E2E_BASE||'http://127.0.0.1:51924')+'/draft.html'});
 for(let i=0;i<80;i++){const x=await cmd('Runtime.evaluate',{expression:"document.readyState==='complete'&&!!window.CageRandomDraft&&window.THE_CAGE_PLAYERS?.length===194",returnByValue:true});if(x.result?.value)break;if(i===79)throw Error('Cannot load game');await sleep(120);}
 const code=fs.readFileSync(path.join(__dirname,'fixtures/v62-visual.js'),'utf8');
 const result=await cmd('Runtime.evaluate',{expression:code,returnByValue:true,awaitPromise:true});
 if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
 const scene=result.result?.value;if(!scene||!scene.canvas||scene.scoreboardDisplay!=='grid'||scene.columns!==5||!scene.scoreAligned||scene.pitchWidth<scene.commentaryWidth*2||scene.actionKind!==scene.expectedActionKind)throw Error('V6.2 arena shell or recorded action failed: '+JSON.stringify(scene));console.log('V62_ARENA_UI_PASS '+JSON.stringify(scene));
 const poses=await cmd('Runtime.evaluate',{expression:"(()=>{const p=window.__v64Viewer;if(!p||p.timeline.ids.length!==6)throw Error('Six-player viewer not mounted');const before=JSON.stringify(window.CageRandomDraft.snapshot().pending);let n=0;for(let i=0;i<=220;i++){p.seek(p.timeline.total*i/220).render();n++}if(JSON.stringify(window.CageRandomDraft.snapshot().pending)!==before)throw Error('Renderer mutated match');return {frames:n,players:p.timeline.ids.length,preserved:true}})()",returnByValue:true});
 if(poses.exceptionDetails||poses.result?.value?.frames!==221||poses.result?.value?.players!==6)throw Error('V64 live browser motion frame regression '+JSON.stringify(poses.exceptionDetails||poses.result?.value));
 console.log('V64_CHROME_MOTION_PASS '+JSON.stringify(poses.result.value));
 await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await sleep(220);
 const mobile=await cmd('Runtime.evaluate',{expression:"(()=>{const s=document.querySelector('#draft-arena .cv-scoreboard'),p=document.querySelector('#draft-arena .cv-stage'),a=document.querySelector('#draft-arena .cv-action');return {viewport:innerWidth,columns:getComputedStyle(s).gridTemplateColumns.split(' ').filter(Boolean).length,pitchWidth:p.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth-innerWidth,actionFont:parseFloat(getComputedStyle(a).fontSize)}})()",returnByValue:true});
 const m=mobile.result?.value;if(!m||m.viewport!==390||m.columns!==2||m.pitchWidth>390||m.overflow>4||m.actionFont>10)throw Error('V62 mobile arena HUD regression '+JSON.stringify(m));
 await cmd('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 const reduced=await cmd('Runtime.evaluate',{expression:"(()=>({enabled:matchMedia('(prefers-reduced-motion: reduce)').matches,transition:getComputedStyle(document.querySelector('#draft-arena .cv-stage')).transitionDuration}))()",returnByValue:true});
 if(!reduced.result?.value?.enabled||!reduced.result?.value?.transition.split(',').every(x=>parseFloat(x)===0))throw Error('V62 reduced-motion HUD regression '+JSON.stringify(reduced.result?.value));
 console.log('V62_MOBILE_AND_REDUCED_PASS '+JSON.stringify(m));
 await cmd('Emulation.setDeviceMetricsOverride',{width:1650,height:970,deviceScaleFactor:1,mobile:false});
 await sleep(100);
 if(process.env.CAGE_CAPTURE_ARENA==='1'){const pic=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(root,'visual-v62-arena.png'),Buffer.from(pic.data,'base64'));console.log('ARENA_SCREENSHOT_OK',Buffer.from(pic.data,'base64').length);}
 ws.close();
}
go().catch(e=>{console.error('V62_VISUAL_FAIL',e.stack);process.exitCode=1}).finally(async()=>{browser.kill();await sleep(250);try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch{}});
