'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),fixture=path.join(root,'v64-five-e2e.html'),testScript=fs.readFileSync(path.join(__dirname,'fixtures/v64-five-rounds.js'),'utf8');
const html=fs.readFileSync(path.join(root,'draft.html'),'utf8');
fs.writeFileSync(fixture,html.replace('</body>','<script>'+testScript+'</script></body>'));
const profile=path.join(root,'chrome-v64-five-'+process.pid),url=(process.env.CAGE_E2E_BASE||'http://127.0.0.1:51914')+'/v64-five-e2e.html';
try{
 const out=cp.spawnSync('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--disable-extensions','--user-data-dir='+profile,'--virtual-time-budget=40000','--dump-dom',url],{encoding:'utf8',timeout:90000,maxBuffer:20e6});
 const result=out.stdout?.match(/<pre id="v64-five-result">([\s\S]*?)<\/pre>/)?.[1]||'No result';
 console.log(result);assert(result.startsWith('V64_CPU_FIVE_PASS'),result+' '+(out.stderr||'').slice(-700));
}finally{fs.rmSync(fixture,{force:true});fs.rmSync(profile,{recursive:true,force:true,maxRetries:3});}
