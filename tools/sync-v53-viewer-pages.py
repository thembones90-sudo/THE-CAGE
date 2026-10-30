from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
canonical=re.findall(r'<script\s+src="(src/[^"]+)"\s*></script>',(root/"index.html").read_text(encoding='utf-8-sig'))
canonical=canonical[:canonical.index('src/showdown.js')]
src=''.join('<script src="'+f+'"></script>' for f in canonical)
for fname in ('viewer.html','viewer-v4.html','viewer-v51.html','viewer-v52.html'):
 p=root/fname;s=p.read_text(encoding='utf-8-sig')
 scripts=list(re.finditer(r'<script\s+src="(src/[^"]+)"\s*></script>',s))
 start=next(m.start() for m in scripts if m.group(1)=='src/players.js')
 end=next(m.end() for m in scripts if m.group(1)=='src/replay/records.js')
 s=s[:start]+src+s[end:]
 p.write_text(s,encoding='utf-8')
 print(fname, 'canon182',s.count('src/roster-182.js')==1)
v53=root/'viewer-v53.html'
s=(root/'viewer-v52.html').read_text(encoding='utf-8')
s=s.replace('V5.2','V5.3').replace('V52','V53')
v53.write_text(s,encoding='utf-8')
print('V53_STANDALONE_VIEWER_CREATED')
