'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(path.join(__dirname,'fixtures/v64-solo-draft.js'),'utf8');
const fixture=path.join(root,'v64-solo-e2e.html'),html=fs.readFileSync(path.join(root,'draft.html'),'utf8');
fs.writeFileSync(fixture,html.replace('</body>','<script>'+code+'</script></body>'));
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
try{
 for(const level of ['casual','competitive','ruthless']){
  const profile=path.join(root,'chrome-v64-'+level+'-'+process.pid);
  const url=require('node:url').pathToFileURL(fixture).href+'?level='+level;
  try{
   const r=cp.spawnSync(chrome,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--no-first-run','--disable-extensions','--user-data-dir='+profile,'--virtual-time-budget=13000','--dump-dom',url],{encoding:'utf8',timeout:40000,maxBuffer:25e6});
   const line=r.stdout?.match(/<pre id="v64-solo-result">([\s\S]*?)<\/pre>/)?.[1]||'No result';
   console.log(line);
   assert(line.startsWith('V64_SOLO_BROWSER_PASS'),line+' '+(r.stderr||'').slice(-400));
  }finally{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3});}
 }
}finally{fs.rmSync(fixture,{force:true});}
