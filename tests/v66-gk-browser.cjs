'use strict';const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),file=path.join(root,'v66-gk-e2e.html');
const src=fs.readFileSync(path.join(root,'draft.html'),'utf8'),test=fs.readFileSync(path.join(__dirname,'fixtures/v66-gk-browser.js'),'utf8');
fs.writeFileSync(file,src.replace('</body>','<script>'+test+'</script></body>'));
const profile=path.join(root,'chrome-v66-gk-'+process.pid);
try{
 const r=cp.spawnSync('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--disable-extensions','--user-data-dir='+profile,'--virtual-time-budget=18000','--dump-dom','http://127.0.0.1:51918/v66-gk-e2e.html'],{encoding:'utf8',timeout:35000,maxBuffer:25e6});
 const val=r.stdout?.match(/<pre id="v66-gk-browser-result">([\s\S]*?)<\/pre>/)?.[1]||'No result';
 console.log(val);assert(val.startsWith('V66_GK_BROWSER_PASS'),val+' '+(r.stderr||'').slice(-450));
}finally{fs.rmSync(file,{force:true});fs.rmSync(profile,{recursive:true,force:true,maxRetries:3});}
