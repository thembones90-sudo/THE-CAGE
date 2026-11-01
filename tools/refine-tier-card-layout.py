"""Refine the five existing assets in place without regenerating their frames."""
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
NS='http://www.w3.org/2000/svg'
ET.register_namespace('',NS)
def el(tag,attrs=None,text=None):
    node=ET.Element('{'+NS+'}'+tag,attrs or {})
    node.text=text
    return node
def parse(markup):
    return ET.fromstring('<g xmlns="'+NS+'">'+markup+'</g>')
OUTLINE='M47 25L69 13Q90 24 111 13L133 25L158 56L139 74L126 60V138H54V60L41 74L22 56Z'
MATERIALS={
 'ace':('#f2e9d0','#7b896e','Arial, sans-serif','20.5','.5'),
 'stalwart':('#d5a983','#7b4e33','Arial Narrow, Arial, sans-serif','21','.7'),
 'elite':('#dceaf0','#7798b1','Arial, sans-serif','20.5','1'),
 'legend':('#efe0b2','#b08b42','Georgia, serif','20.5','.3'),
 'titan':('#152d3d','#8bbdcb','Arial Black, Arial, sans-serif','20','.6')
}
for tier,(paper,edge,font,size,tracking) in MATERIALS.items():
    path=ROOT/'design/tier-models'/f'{tier}.svg'
    root=ET.fromstring(path.read_text(encoding='utf-8'))
    frame=root.find('.//*[@data-part="frame"]')
    frame_before=ET.tostring(frame)
    defs=root.find('{'+NS+'}defs')
    for identifier in ['shirt-cut','shirt-fabric','shirt-volume']:
        for node in list(defs):
            if node.get('id')==identifier:defs.remove(node)
    clip=el('clipPath',{'id':'shirt-cut'});clip.append(el('path',{'d':OUTLINE}));defs.append(clip)
    pattern=el('pattern',{'id':'shirt-fabric','width':'2.5','height':'2.5','patternUnits':'userSpaceOnUse'})
    pattern.append(el('path',{'d':'M0 .6H2.5M.6 0V2.5','stroke':'#4b6570','stroke-width':'.3','opacity':'.12'}));defs.append(pattern)
    gradient=el('linearGradient',{'id':'shirt-volume','x1':'0','y1':'0','x2':'1','y2':'.7'})
    for offset,color,opacity in [('0','#fff','0.42'),('.28','#fff','0.05'),('.72','#17313c','0.03'),('1','#17313c','0.23')]:
        gradient.append(el('stop',{'offset':offset,'stop-color':color,'stop-opacity':opacity}))
    defs.append(gradient)
    shirt=root.find('.//*[@data-part="shirt"]')
    shirt.clear();shirt.attrib.update({'data-part':'shirt','transform':'translate(46 93) scale(1.16)'})
    art=parse('''<path d="M47 31L69 19Q90 30 111 19L133 31L158 62L139 80L126 66V144H54V66L41 80L22 62Z" fill="#081b25" opacity=".22"/>
    <path d="'''+OUTLINE+'''" fill="url(#shirt)" stroke="#4b6069" stroke-width="1.2"/>
    <g clip-path="url(#shirt-cut)">
      <path d="M78 23Q90 27 102 23V138H78Z" fill="#72868d" opacity=".48"/>
      <path d="M111 13L133 25L126 60V138H110Q119 79 111 13Z" fill="#243f4b" opacity=".12"/>
      <path d="M48 27L62 23L60 137H55V60L42 73L34 65Z" fill="#fff" opacity=".15"/>
      <rect x="20" y="10" width="140" height="130" fill="url(#shirt-fabric)"/>
      <path d="'''+OUTLINE+'''" fill="url(#shirt-volume)"/>
      <path d="M60 70Q67 95 62 117M121 71Q114 98 120 119M67 124Q90 120 115 125" fill="none" stroke="#607681" stroke-width="1" opacity=".34"/>
      <path d="M63 73Q70 95 66 113M117 76Q112 97 116 115" fill="none" stroke="#fff" stroke-width="1.1" opacity=".3"/>
    </g>
    <path d="M69 13L90 37L111 13L107 14L90 30L73 14Z" fill="#e7edeb" stroke="#5f747c" stroke-width=".9"/>
    <path d="M47 25L54 60M133 25L126 60" fill="none" stroke="#5e737b" stroke-width="1.1"/>
    <path d="M56 131H124M28 53L43 67M137 67L152 53" fill="none" stroke="#ebf1ed" stroke-width="1.8" opacity=".7"/>
    <path d="M56 134H124M30 56L42 68M138 68L150 56" fill="none" stroke="#71858c" stroke-width=".65" stroke-dasharray="1.4 1.5"/>
    <path d="M107 49L114 53V61L107 66L100 61V53Z" fill="#dce2dc" stroke="#627780" stroke-width=".8"/>
    <path d="M104 54L107 52L110 54V60L107 62L104 60Z" fill="none" stroke="#9fadb0" stroke-width=".6"/>''')
    shirt.extend(list(art))
    identity=next(node for node in list(root) if node.tag=='{'+NS+'}g' and node.get('font-family'))
    # Preserve the existing tier and OVR header positions and every frame ornament.
    header=[node for node in identity if node.tag=='{'+NS+'}text'][:3]
    ink=identity.get('fill');attrs=dict(identity.attrib)
    identity.clear();identity.attrib.update(attrs);identity.set('data-part','identity')
    identity.extend(header)
    identity.append(el('text',{'data-field':'name','x':'150','y':'302','text-anchor':'middle','font-family':font,'font-size':size,'font-weight':'900','letter-spacing':tracking},'PLAYER NAME'))
    identity.append(el('rect',{'data-part':'nationality-plate','x':'43','y':'314','width':'214','height':'20','rx':'2','fill':paper,'opacity':'.96'}))
    identity.append(el('text',{'data-field':'nationality','x':'150','y':'328','text-anchor':'middle','font-size':'10.4','letter-spacing':'.7','font-weight':'600'},'POSITION · COUNTRY'))
    identity.append(el('path',{'d':'M43 342H257','stroke':edge,'stroke-width':'.65','opacity':'.65'}))
    primary=el('g',{'data-part':'primary-style-slot'})
    primary.append(el('rect',{'x':'76','y':'349','width':'148','height':'27','rx':'2','fill':paper,'stroke':edge,'stroke-width':'.65','fill-opacity':'.65'}))
    primary.append(el('path',{'d':'M89 356L96 360V367L89 371L82 367V360Z','fill':'none','stroke':ink,'stroke-width':'1'}))
    primary.append(el('text',{'x':'157','y':'367','text-anchor':'middle','font-size':'10.1','letter-spacing':'.5','font-weight':'800'},'PRIMARY TRAIT'))
    identity.append(primary)
    secondary=el('g',{'data-part':'secondary-style-slot'})
    secondary.append(el('circle',{'cx':'102','cy':'389','r':'3.3','fill':'none','stroke':edge,'stroke-width':'.8'}))
    secondary.append(el('text',{'x':'159','y':'392','text-anchor':'middle','font-size':'8.8','letter-spacing':'.6','font-weight':'600','opacity':'.86'},'SECONDARY TRAIT'))
    identity.append(secondary)
    identity.append(el('text',{'x':'150','y':'425','text-anchor':'middle','font-size':'7','letter-spacing':'3','font-weight':'600'},'T H E  C A G E'))
    assert ET.tostring(frame)==frame_before,'Frame architecture changed'
    path.write_text(ET.tostring(root,encoding='unicode')+'\n',encoding='utf-8')
print('TIER_LAYOUT_REFINED: five existing frames preserved; one shared fabric shirt; clearer identity and trait hierarchy')
