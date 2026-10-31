'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),profile=path.join(root,'chrome-v62-visual-'+process.pid),port=9242;
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser=cp.spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--disable-extensions','--remote-debugging-port='+port,'--remote-allow-origins=*','--user-data-dir='+profile,'--window-size=1680,1050','about:blank'],{stdio:'ignore'});
const sleep=t=>new Promise(r=>setTimeout(r,t));
async function go(){
 let info;for(let i=0;i<70;i++){try{const a=await(await fetch('http://127.0.0.1:'+port+'/json')).json();info=a.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);if(info)break;}catch{}await sleep(100);}
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
 await sleep(500);
 if(process.env.CAGE_CAPTURE_ARENA==='1'){const pic=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(root,'visual-v62-arena.png'),Buffer.from(pic.data,'base64'));console.log('ARENA_SCREENSHOT_OK',Buffer.from(pic.data,'base64').length);}
 ws.close();
}
go().catch(e=>{console.error('V62_VISUAL_FAIL',e.stack);process.exitCode=1}).finally(async()=>{browser.kill();await sleep(250);try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch{}});
