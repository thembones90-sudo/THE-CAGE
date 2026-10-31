from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
public=root/"public"
files=sorted(p.relative_to(public).as_posix() for p in public.rglob("*") if p.is_file())
assert "index.html" in files and "play.html" in files and "src/showdown-v5.js" in files
config={"main":"launcher-complete.js","output":"sea-complete.blob","disableExperimentalSEAWarning":True,"useCodeCache":False,
"assets":{f:"../public/"+f for f in files}}
(root/"build-exe/sea-complete.json").write_text(json.dumps(config,indent=2)+"\n",encoding="utf-8")
arr=json.dumps(files,ensure_ascii=True,indent=2)
launcher="""/* THE CAGE V6.0 Random Draft Showdown — Windows single executable. Bundled offline static site only. */
'use strict';
const http=require('node:http'),sea=require('node:sea'),{exec}=require('node:child_process');
const PORT=Number(process.env.CAGE_PORT||4184);
const ASSETS=__ASSETS__;
const allowed=new Set(ASSETS);
const extMime={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',png:'image/png',webmanifest:'application/manifest+json',json:'application/json'};
const server=http.createServer((req,res)=>{
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
 let path;
 try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\\/+/, '');}catch{res.writeHead(400);res.end();return;}
 if(path===''||path==='/')path='index.html';
 if(!allowed.has(path)){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');return;}
 const extension=path.split('.').at(-1);
 const headers={'Content-Type':extMime[extension]||'application/octet-stream','Cache-Control':path==='sw.js'?'no-cache':'no-store','X-Content-Type-Options':'nosniff'};
 try{const asset=Buffer.from(sea.getAsset(path));res.writeHead(200,headers);if(req.method==='HEAD')res.end();else res.end(asset);}
 catch(e){res.writeHead(500);res.end('Bundled asset unavailable: '+path);console.error(e.message);}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port '+PORT+' in use. Close the old THE CAGE or set CAGE_PORT to another port.':e.message);process.exitCode=1;});
server.listen(PORT,'127.0.0.1',()=>{
 const url='http://127.0.0.1:'+server.address().port+'/draft.html';
 console.log('THE CAGE V6.0 RANDOM SHOWDOWN: '+url);
 console.log('Close this window to end your local game server.');
 if(!process.env.CAGE_NO_BROWSER)exec('start "" "'+url+'"');
});
"""
(root/"build-exe/launcher-complete.js").write_text(launcher.replace("__ASSETS__",arr),encoding="utf-8")
print("SEA_COMPLETE_MANIFEST",len(files),"assets")
