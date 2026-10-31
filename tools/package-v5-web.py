from pathlib import Path
import re,shutil,json,hashlib
root=Path(__file__).resolve().parents[1]
public=root/"public"
html=(root/"play.html").read_text(encoding="utf-8-sig")
main=(root/"index.html").read_text(encoding="utf-8-sig")
scripts=re.findall(r'<script\s+src="(src/[^"]+)"\s*></script>',html)
canonical=re.findall(r'<script\s+src="(src/[^"]+)"\s*></script>',main)
assert "src/showdown.js" in canonical and "src/showdown-v5.js" in scripts
canonical=canonical[:canonical.index("src/showdown.js")]
assert scripts[:len(canonical)]==canonical,"Playable scripts differ from canonical 182-player game. Run tools/sync-v53-game.py and review."
assert "src/roster-182.js" in scripts
styles=re.findall(r'<link\s+rel="stylesheet"\s+href="([^"]+)"',html)
assets={"play.html","manifest.webmanifest","assets/cage-icon.svg","sw.js",
 "design/qwen-30b/arena/arena.svg","design/qwen-30b/arena/arena-golden.svg",
 "design/qwen-30b/arena/relic-ball.svg"}
assets.update(scripts);assets.update(styles)
for rel in assets:
 assert (root/rel).is_file(),rel
# Hash ALL runtime application inputs, not just the cache worker. New versions
# automatically get a new content-addressed cache and cannot silently reuse a
# stale roster or engine when shipped alongside a new HTML page.
fingerprint=hashlib.sha256()
for rel in sorted(assets-{"sw.js"}):
 fingerprint.update(rel.encode()+b'\0'+(root/rel).read_bytes())
revision=fingerprint.hexdigest()[:12]
sw=root/"sw.js"
current=sw.read_text(encoding="utf-8-sig")
body=current[current.index("self.addEventListener('install'"):]
cache_files=sorted((assets-{"sw.js"})|{"index.html"})
worker=("/* THE CAGE V5.6: generated from the canonical playable dependency list. */\n"
        +"const CACHE='the-cage-full-v56-"+revision+"';\n"
        +"const STATIC="+json.dumps(["./"+x for x in cache_files],indent=2,ensure_ascii=False)+";\n"+body)
sw.write_text(worker,encoding="utf-8")
if public.exists():shutil.rmtree(public)
public.mkdir()
for rel in sorted(assets):
 dst=public/rel;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/rel,dst)
(public/"index.html").write_text(html,encoding="utf-8")
for rel in sorted(assets):
 assert (public/rel).read_bytes()==(root/rel).read_bytes(),rel
config={"version":2,"framework":None,"outputDirectory":"public",
 "headers":[{"source":"/sw.js","headers":[{"key":"Cache-Control","value":"no-cache"}]},
            {"source":"/play.html","headers":[{"key":"Cache-Control","value":"no-cache"}]},
            {"source":"/(.*)","headers":[{"key":"X-Content-Type-Options","value":"nosniff"},{"key":"Referrer-Policy","value":"strict-origin-when-cross-origin"}]}]}
(root/"vercel.json").write_text(json.dumps(config,indent=2)+"\n",encoding="utf-8")
print("V56_WEB_PACKAGE_PASS",len(assets)+1,"files","roster",182,"cache",revision,"bytes",sum(p.stat().st_size for p in public.rglob('*') if p.is_file()))
