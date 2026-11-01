"""Vendor native-proportion national flag SVGs at a recorded upstream revision."""
from pathlib import Path
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor
import json, subprocess, hashlib, xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'flags'
OUT.mkdir(parents=True,exist_ok=True)
def get(url):
    with urlopen(Request(url,headers={'User-Agent':'THE-CAGE-local-asset-builder'}),timeout=45) as response:
        return response.read()

revision=json.loads(get('https://api.github.com/repos/hampusborgos/country-flags/commits/main'))['sha']
codes=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify([...new Set(Object.values(require('./src/national-flags.js').COUNTRIES))]))"],cwd=ROOT,text=True))
def fetch(code):
    url=f'https://raw.githubusercontent.com/hampusborgos/country-flags/{revision}/svg/{code}.svg'
    data=get(url)
    svg=ET.fromstring(data)
    assert svg.tag.endswith('svg'),code
    for element in svg.iter():
        assert element.tag.rsplit('}',1)[-1].lower() not in ('script','foreignobject'),code
        for key,value in element.attrib.items():
            assert not key.lower().startswith('on'),code
            if key.endswith('href'):
                assert value.startswith(('#','data:')),code
    (OUT/f'{code}.svg').write_bytes(data)
    return code,{'sha256':hashlib.sha256(data).hexdigest(),'source':url,'viewBox':svg.get('viewBox'),'width':svg.get('width'),'height':svg.get('height')}

with ThreadPoolExecutor(max_workers=4) as pool:
    assets=dict(pool.map(fetch,sorted(codes)))
(OUT/'manifest.json').write_text(json.dumps({'upstream':'https://github.com/hampusborgos/country-flags','revision':revision,'assets':assets},indent=2)+'\n',encoding='utf-8')
(OUT/'ATTRIBUTION.md').write_text(f'''# National flag artwork

Source: https://github.com/hampusborgos/country-flags
Pinned revision: {revision}

Upstream describes these flags as public-domain flag designs sourced from Wikimedia Commons and checked against flag construction sources. Original SVG colours, viewBoxes, symbols and proportions are retained. Each downloaded asset has a source URL and SHA-256 in manifest.json.

Card rendering scales uniformly to cover the existing artwork window and clips at that window's original edge. It never stretches the flag. The shirt remains in the foreground. Tier finish is a separate light/texture overlay.

Roster aliases are explicit in src/national-flags.js. Historical labels of the form "Yugoslavia / modern nationality" use the explicitly recorded modern suffix. Unknown or ambiguous nationalities receive no invented flag.
''',encoding='utf-8')
print('NATIONAL_FLAGS_VENDORED',len(assets),'native-proportion assets; revision',revision)
