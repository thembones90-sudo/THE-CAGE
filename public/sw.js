/* THE CAGE V5.6: generated from the canonical playable dependency list. */
const CACHE='the-cage-full-v56-44fd8c983e4e';
const STATIC=[
  "./assets/cage-icon.svg",
  "./design/qwen-30b/arena/arena-golden.svg",
  "./design/qwen-30b/arena/arena.svg",
  "./design/qwen-30b/arena/relic-ball.svg",
  "./index.html",
  "./manifest.webmanifest",
  "./play.html",
  "./src/cage-commentary.js",
  "./src/cage-engine.js",
  "./src/cage-ui.css",
  "./src/engine/legacy-v04.js",
  "./src/full-cage.css",
  "./src/identity/search.js",
  "./src/natural-positions.js",
  "./src/players.js",
  "./src/replay/records.js",
  "./src/roster-100.js",
  "./src/roster-101.js",
  "./src/roster-103.js",
  "./src/roster-135.js",
  "./src/roster-136.js",
  "./src/roster-139.js",
  "./src/roster-140.js",
  "./src/roster-141.js",
  "./src/roster-149.js",
  "./src/roster-165.js",
  "./src/roster-178.js",
  "./src/roster-182.js",
  "./src/roster-classification.js",
  "./src/roster-expansion.js",
  "./src/roster-pl-134.js",
  "./src/roster-refinement.js",
  "./src/roster-trait-family-v16.js",
  "./src/showdown-v5.js",
  "./src/tactical-refinement.js",
  "./src/viewer-v4/fx.js",
  "./src/viewer-v4/goal-audio.js",
  "./src/viewer-v4/goal-experience.js",
  "./src/viewer-v4/kinetics.js",
  "./src/viewer-v4/label-layout.js",
  "./src/viewer-v4/motion.js",
  "./src/viewer-v4/renderer.js",
  "./src/viewer-v4/viewer-v4.css",
  "./src/viewer-v4/viewer.js",
  "./src/viewer/clock.js",
  "./src/viewer/coords.js",
  "./src/viewer/layout.js",
  "./src/viewer/timeline.js",
  "./src/viewer/viewer.css"
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('the-cage-full-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 const u=new URL(req.url);
 if(u.pathname.endsWith('/play.html')||u.pathname===new URL('./',self.registration.scope).pathname){
   event.respondWith(fetch(req).catch(()=>caches.match('./play.html')));
 }else{
   event.respondWith(caches.match(req,{ignoreSearch:true}).then(cached=>cached||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}return res;})));
 }
});
