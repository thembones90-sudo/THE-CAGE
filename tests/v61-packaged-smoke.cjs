'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const url=process.env.CAGE_SMOKE_EXE_URL||'http://127.0.0.1:4191/draft.html';
const port=9239,profile=path.join(__dirname,'..','chrome-v61-packaged-smoke');
const browser=cp.spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-extensions','--no-first-run','--remote-debugging-port='+port,'--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
const sleep=t=>new Promise(r=>setTimeout(r,t));
async function main(){
 let info;
 for(let i=0;i<100;i++){
  try{const result=await fetch('http://127.0.0.1:'+port+'/json');const tabs=await result.json();info=tabs.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);if(info)break;}catch{}
  await sleep(100);
 }
 if(!info)throw Error('Chrome DevTools not available');
 const ws=new WebSocket(info.webSocketDebuggerUrl),pending=new Map();let seq=0;
 ws.addEventListener('message',event=>{const data=JSON.parse(event.data);if(!data.id)return;const r=pending.get(data.id);if(r){pending.delete(data.id);data.error?r.reject(Error(JSON.stringify(data.error))):r.resolve(data.result);}});
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Page.navigate',{url});
 for(let i=0;i<90;i++){
  const r=await cmd('Runtime.evaluate',{expression:"document.readyState==='complete' && !!window.CageRandomDraft && window.THE_CAGE_PLAYERS?.length===194",returnByValue:true});
  if(r.result?.value)break;
  if(i===89)throw Error('Packaged game did not bootstrap');
  await sleep(100);
 }
 const script=fs.readFileSync(path.join(__dirname,'fixtures/v61-packaged-smoke.js'),'utf8');
 const evalResult=await cmd('Runtime.evaluate',{expression:script,returnByValue:true,awaitPromise:true});
 if(evalResult.exceptionDetails)throw Error(evalResult.exceptionDetails.text+' '+evalResult.exceptionDetails.exception?.description);
 if(!evalResult.result?.value)throw Error('No game result: '+JSON.stringify(evalResult));
 console.log('V61_PACKAGED_EXE_SMOKE_PASS '+JSON.stringify(evalResult.result.value));
 ws.close();
}
main().catch(e=>{console.error('V61_PACKAGED_EXE_SMOKE_FAIL',e.stack||e.message);process.exitCode=1;}).finally(async()=>{browser.kill();await sleep(300);try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:200});}catch{}});
