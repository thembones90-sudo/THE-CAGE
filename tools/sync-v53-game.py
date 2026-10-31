from pathlib import Path
import re, hashlib
root=Path(__file__).resolve().parents[1]
current=(root/"index.html").read_text(encoding='utf-8-sig')
page=(root/"play.html").read_text(encoding='utf-8-sig')
main_scripts=re.findall(r'<script\s+src="(src/[^"]+)"\s*></script>',current)
assert "src/roster-182.js" in main_scripts and "src/showdown.js" in main_scripts,main_scripts
main_scripts=main_scripts[:main_scripts.index("src/showdown.js")]
v53_scripts=["src/viewer/coords.js","src/viewer/layout.js","src/viewer/timeline.js","src/viewer/clock.js",
             "src/viewer-v4/fx.js","src/viewer-v4/motion.js","src/viewer-v4/kinetics.js",
             "src/viewer-v4/label-layout.js","src/viewer-v4/renderer.js",
             "src/viewer-v4/goal-experience.js","src/viewer-v4/goal-audio.js","src/viewer-v4/viewer.js"]
start=page.index('<script src="src/players.js"></script>')
end=page.index('<script>window.CageViewerV4Variant',start)
new_scripts=main_scripts+v53_scripts
for f in new_scripts:
 assert (root/f).is_file(), f
page=page[:start]+''.join('<script src="'+s+'"></script>' for s in new_scripts)+'\n'+page[end:]
page=page.replace('0 used / 178 available','0 used / 182 available')
page=page.replace('<title>THE CAGE', '<title>THE CAGE',1)
page=page.replace('Complete Showdown V5.2','Complete Showdown V5.3')
# Clearly identify explicitly gated engine; reflect final engine selection after scripts have run.
page=page.replace('<script src="src/showdown-v5.js"></script>', '<script src="src/showdown-v5.js"></script>',1)
(root/"play.html").write_text(page,encoding='utf-8')
print('V53_SCRIPTS',len(new_scripts),'ROSTER182',new_scripts.index('src/roster-182.js'),
      'EXPLICIT_ENGINE_GATED',new_scripts.index('src/cage-engine.js'))
print('CANONICAL_SCRIPTS',*main_scripts,sep='\n')
