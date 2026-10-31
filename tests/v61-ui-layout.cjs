'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),fixture=path.join(root,'v61-layout-e2e.html');
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const script=fs.readFileSync(path.join(__dirname,'fixtures/v61-layout.js'),'utf8');
const html=fs.readFileSync(path.join(root,'draft.html'),'utf8');
fs.writeFileSync(fixture,html.replace('</body>','<script>'+script+'</script></body>'));
try{
 for(const [width,height] of [[1650,950],[950,850],[390,840]]){
  const profile=path.join(root,'chrome-v61-'+width+'-'+process.pid);
  try{
   const result=cp.spawnSync(chrome,['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--disable-extensions','--user-data-dir='+profile,'--allow-file-access-from-files','--window-size='+width+','+height,'--virtual-time-budget=1500','--dump-dom',require('node:url').pathToFileURL(fixture).href],{encoding:'utf8',timeout:30000,maxBuffer:20e6});
   const output=result.stdout.match(/<pre id="v61-layout-output">([\s\S]*?)<\/pre>/)?.[1]||'No result';
   console.log(output);
   assert(output.startsWith('V61_LAYOUT_PASS'),output+' '+(result.stderr||'').slice(-400));
  }finally{fs.rmSync(profile,{recursive:true,force:true,maxRetries:2});}
 }
}finally{fs.rmSync(fixture,{force:true});}
