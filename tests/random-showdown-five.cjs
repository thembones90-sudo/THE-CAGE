'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),fixture=path.join(root,'draft-five-e2e.html');
const script=fs.readFileSync(path.join(__dirname,'fixtures/random-showdown-five.js'),'utf8');
const html=fs.readFileSync(path.join(root,'draft.html'),'utf8');
fs.writeFileSync(fixture,html.replace('</body>','<script>'+script+'</script></body>'));
const url=(process.env.CAGE_E2E_BASE||'http://127.0.0.1:51866')+'/draft-five-e2e.html';
const profile=path.join(root,'chrome-five-'+process.pid);
try{
const out=cp.spawnSync('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--disable-extensions','--user-data-dir='+profile,'--virtual-time-budget=25000','--dump-dom',url],{encoding:'utf8',timeout:65000,maxBuffer:20e6});
const message=out.stdout.match(/<pre id="five-test">([\s\S]*?)<\/pre>/)?.[1]||'No result';
console.log(message);assert(message.startsWith('FIVE_ROUND_TEST_PASS'),message+'\n'+(out.stderr||'').slice(-700));
}finally{try{fs.rmSync(fixture,{force:true});fs.rmSync(profile,{recursive:true,force:true,maxRetries:3});}catch{}}
