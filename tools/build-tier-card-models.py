"""Five independent frame studies with identical neutral placeholder content."""
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'design' / 'tier-models'
OUT.mkdir(parents=True, exist_ok=True)

# The bootstrap below predates the hand-finished frames. Preserve those canonical
# assets on subsequent builds; layout refinements live in refine-tier-card-layout.py.
existing=[OUT/(tier+'.svg') for tier in ['ace','stalwart','elite','legend','titan']]
if all(p.is_file() and 'data-part="card-ornament"' in p.read_text(encoding='utf-8') for p in existing):
    for p in existing:
        ET.parse(p)
    print('TIER_BASE_MODELS_VALIDATED: five hand-finished frames preserved')
    raise SystemExit(0)

DEFS = '''<defs>
 <linearGradient id="paper" x2=".8" y2="1"><stop stop-color="#fff5d9"/><stop offset="1" stop-color="#d8cdb2"/></linearGradient>
 <linearGradient id="copper" x2="1" y2="1"><stop stop-color="#f1c39b"/><stop offset=".24" stop-color="#9c5734"/><stop offset=".5" stop-color="#e6b98b"/><stop offset=".8" stop-color="#75412c"/><stop offset="1" stop-color="#c68d60"/></linearGradient>
 <linearGradient id="silver" x2="1" y2=".8"><stop stop-color="#f4ffff"/><stop offset=".25" stop-color="#6c8ba4"/><stop offset=".5" stop-color="#e6f6ff"/><stop offset=".75" stop-color="#7692ad"/><stop offset="1" stop-color="#d8f2ff"/></linearGradient>
 <linearGradient id="gold" x2=".8" y2="1"><stop stop-color="#ffedb1"/><stop offset=".22" stop-color="#ae7c2b"/><stop offset=".45" stop-color="#f5d785"/><stop offset=".7" stop-color="#95651f"/><stop offset="1" stop-color="#e9c36e"/></linearGradient>
 <linearGradient id="foil" x2="1" y2="1"><stop stop-color="#a8f4ec"/><stop offset=".25" stop-color="#8d9ed9"/><stop offset=".48" stop-color="#f6dfb3"/><stop offset=".65" stop-color="#c39ece"/><stop offset=".82" stop-color="#6ab6cd"/><stop offset="1" stop-color="#d8f9eb"/></linearGradient>
 <radialGradient id="chamber"><stop stop-color="#476275"/><stop offset=".7" stop-color="#1b3045"/><stop offset="1" stop-color="#101d2b"/></radialGradient>
 <linearGradient id="shirt" x2=".8" y2="1"><stop stop-color="#f4f4e9"/><stop offset=".4" stop-color="#d4d8d3"/><stop offset="1" stop-color="#9ca9aa"/></linearGradient>
 <pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".45" fill="#504c39" opacity=".2"/><circle cx="4" cy="4" r=".3" fill="#504c39" opacity=".15"/></pattern>
 <pattern id="brush" width="40" height="4" patternUnits="userSpaceOnUse"><path d="M0 1H40" stroke="#fff2d0" stroke-width=".5" opacity=".18"/></pattern>
 <pattern id="halftone" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="currentColor" opacity=".13"/></pattern>
 </defs>'''

SHIRT = '''<g data-part="shirt" transform="translate(46 93) scale(1.16)">
 <path d="M47 31L69 19Q90 30 111 19L133 31L158 62L139 80L126 66V144H54V66L41 80L22 62Z" fill="#000" opacity=".18"/>
 <path d="M47 25L69 13Q90 24 111 13L133 25L158 56L139 74L126 60V138H54V60L41 74L22 56Z" fill="url(#shirt)" stroke="#354650" stroke-width="1.4"/>
 <path d="M78 23Q90 27 102 23V138H78Z" fill="#748990" opacity=".5"/>
 <path d="M111 13L133 25L126 60V138H109Q120 77 111 13Z" fill="#314956" opacity=".15"/>
 <path d="M69 13L90 37L111 13 M47 25L54 60 M133 25L126 60 M55 129H125 M27 51L44 68 M136 68L153 51" fill="none" stroke="#52636b" stroke-width="1.5"/>
 <path d="M107 49L114 53V61L107 66L100 61V53Z" fill="#dce2dc" stroke="#627780"/>
 </g>'''

def common(tier, ink, line, centred=False):
    header = (f'<text x="150" y="55" text-anchor="middle" font-size="15" letter-spacing="3">{tier}</text>'
              if centred else f'<text x="36" y="55" font-size="14" letter-spacing="2.5">{tier}</text>')
    rating_y = 91 if centred else 58
    return f'''<g font-family="Arial, sans-serif" fill="{ink}" font-weight="800">
      {header}
      <text x="257" y="{rating_y}" text-anchor="middle" font-size="27">—</text>
      <text x="257" y="{rating_y+13}" text-anchor="middle" font-size="7" letter-spacing="1.5">OVR</text>
      <text x="150" y="302" text-anchor="middle" font-size="21" letter-spacing=".5">PLAYER NAME</text>
      <text data-field="nationality" x="150" y="323" text-anchor="middle" font-size="9" letter-spacing="1.5" font-weight="500">POSITION · COUNTRY</text>
      <path d="M40 340H260" stroke="{line}" stroke-width=".7"/>
      <text x="150" y="361" text-anchor="middle" font-size="8" letter-spacing="1.3">PRIMARY TRAIT / SECONDARY</text>
      <g fill="none" stroke="{line}" stroke-width="1.2" opacity=".65">
        <circle cx="121" cy="389" r="11"/><path d="M121 382V396M114 389H128"/>
        <path d="M171 378L181 383V393L171 400L161 393V383Z"/>
      </g>
      <text x="150" y="424" text-anchor="middle" font-size="7" letter-spacing="3" font-weight="600">T H E  C A G E</text>
    </g>'''

FRAMES = {
 'ACE': '''<path d="M9 7H276L291 23V442H9Z" fill="url(#paper)"/>
  <path d="M9 7H276L291 23V442H9Z" fill="url(#grain)"/>
  <path d="M276 7V23H291" fill="#fff8e7" stroke="#b8ac91" stroke-width=".7"/>
  <path d="M17 15H270M283 30V434H17V15" fill="none" stroke="#65725e" stroke-width=".8"/>
  <path d="M24 24H262M275 35V427H24V24" fill="none" stroke="#65725e" stroke-width=".4"/>
  <path d="M29 78H271V276H29Z" fill="#d1d8c7" stroke="#6c7766" stroke-width="1"/>
  <path d="M29 78H271V276H29Z" fill="url(#halftone)" color="#304c3d"/>
  <path d="M36 85H264V269H36Z" fill="none" stroke="#f6f3dd" stroke-width="3"/>
  <text x="41" y="96" font-family="Arial" font-size="6" letter-spacing="2" fill="#52664f">ORIGINAL EDITION</text>''',
 'STALWART': '''<path d="M20 4H280L296 20V430L280 446H20L4 430V20Z" fill="#503629"/>
  <path d="M22 9H278L290 22V428L278 440H22L10 428V22Z" fill="url(#copper)" stroke="#d7aa7b"/>
  <path d="M22 9H278L290 22V428L278 440H22L10 428V22Z" fill="url(#brush)"/>
  <path d="M25 25H275V425H25Z" fill="#d6ac82" stroke="#5c3d2e" stroke-width="2"/>
  <path d="M32 80H268V277H32Z" fill="#604535" stroke="#f5cf9f"/>
  <path d="M40 88H260V269H40Z" fill="#9b7b5d" stroke="#322e28" stroke-width="2"/>
  <path d="M45 93H255V263H45Z" fill="url(#brush)"/>
  <path d="M36 69H264M36 282H264M22 333H28M272 333H278" stroke="#704c35" stroke-width="2"/>
  <g fill="#c58e5f" stroke="#422f27" stroke-width="1.5"><circle cx="18" cy="20" r="5"/><circle cx="282" cy="20" r="5"/><circle cx="18" cy="430" r="5"/><circle cx="282" cy="430" r="5"/></g>
  <path d="M15 20H21M279 20H285M15 430H21M279 430H285" stroke="#513a2e" stroke-width="1.5"/>
  <path d="M33 373H45V401H33M267 373H255V401H267" stroke="#745038" fill="none"/>''',
 'ELITE': '''<path d="M4 4H247L296 53V444H49L4 399Z" fill="url(#silver)"/>
  <path d="M13 14H242L286 58V434H55L13 394Z" fill="#dae9ee" stroke="#324f69"/>
  <path d="M4 4H247L223 28H28L4 53Z" fill="#effaff"/>
  <path d="M247 4L296 53L271 70L223 28Z" fill="#7c9cb9"/>
  <path d="M296 53V444L277 422V71Z" fill="#b8d2e0"/>
  <path d="M4 399L49 444H92L57 415L24 380Z" fill="#6688a3"/>
  <path d="M31 80H232L269 117V274H68L31 237Z" fill="#8daabe" stroke="#f1fdff" stroke-width="1.3"/>
  <path d="M36 85H229L262 119V269H71L36 235Z" fill="#b9cfdb"/>
  <path d="M36 235L229 85H249L56 255Z" fill="#effaff" opacity=".36"/>
  <path d="M38 113L208 270M74 80L269 241M32 207L201 80" stroke="#edfaff" stroke-width=".6" opacity=".5"/>
  <path d="M26 284H251L272 306H49Z" fill="#a8c0d2" opacity=".45"/>
  <path d="M29 371L43 357M257 404L271 390 M38 418H165" stroke="#577d9c" fill="none"/>''',
 'LEGEND': '''<path d="M4 80Q4 4 150 4Q296 4 296 80V443H4Z" fill="url(#gold)"/>
  <path d="M14 84Q14 15 150 15Q286 15 286 84V433H14Z" fill="#f0dfad" stroke="#79551f"/>
  <path d="M21 87Q21 23 150 23Q279 23 279 87V426H21Z" fill="none" stroke="#a47c33"/>
  <path d="M36 177Q36 77 150 77Q264 77 264 177V275H36Z" fill="#b58a3c" stroke="#866124" stroke-width="2"/>
  <path d="M43 177Q43 84 150 84Q257 84 257 177V268H43Z" fill="#d5b866" stroke="#fff1bd"/>
  <path d="M150 90V269M86 107L167 269M214 107L133 269M47 182L257 253M253 182L43 253" stroke="#ffe9a7" opacity=".25"/>
  <path d="M49 260Q19 198 53 144M251 260Q281 198 247 144" stroke="#f7df93" stroke-width="2" fill="none"/>
  <g fill="#f8e3a5"><path d="M43 246Q24 237 34 223Q48 229 43 246Z M38 220Q22 208 35 197Q48 206 38 220Z M41 192Q28 178 43 170Q53 181 41 192Z M257 246Q276 237 266 223Q252 229 257 246Z M262 220Q278 208 265 197Q252 206 262 220Z M259 192Q272 178 257 170Q247 181 259 192Z"/></g>
  <path d="M55 291Q150 274 245 291M55 309Q150 328 245 309" fill="none" stroke="#ae8435" stroke-width=".8"/>
  <path d="M36 371L46 381L36 391L26 381Z M264 371L274 381L264 391L254 381Z" fill="none" stroke="#aa8032"/>
  <path d="M137 32L143 39L150 27L157 39L163 32L160 44H140Z" fill="#a57b2d"/>''',
 'TITAN': '''<path d="M150 1L219 16L277 41L298 83V370L279 412L225 434L150 449L75 434L21 412L2 370V83L23 41L81 16Z" fill="url(#foil)"/>
  <path d="M150 13L217 27L267 49L286 87V367L270 402L220 423L150 437L80 423L30 402L14 367V87L33 49L83 27Z" fill="#142536"/>
  <path d="M150 22L214 36L259 56L277 91V364L262 395L216 414L150 428L84 414L38 395L23 364V91L41 56L86 36Z" fill="url(#chamber)" stroke="#7aa0b4" stroke-width=".7"/>
  <path d="M2 83L23 41L81 16L70 36L38 58L29 103Z" fill="#c6e9dc" opacity=".7"/>
  <path d="M219 16L277 41L298 83L274 99L263 59L221 39Z" fill="#b8a6d5"/>
  <path d="M2 173L24 199V326L2 370Z" fill="#729fae"/>
  <path d="M298 123L277 148V306L298 278Z" fill="#d0b5c9"/>
  <path d="M21 412L75 434L150 449L135 429L80 416L38 393Z" fill="#a5d7cb"/>
  <path d="M225 434L279 412L298 370L275 364L261 395L218 416L164 431L150 449Z" fill="#969dd1"/>
  <path d="M150 76L235 96L265 143V229L233 269H67L35 229V143L65 96Z" fill="#122439" stroke="url(#foil)" stroke-width="1.6"/>
  <path d="M150 86L227 106L253 148V224L227 258H73L47 224V148L73 106Z" fill="url(#chamber)" stroke="#92baca" stroke-width=".5"/>
  <path d="M150 86V258M47 148L227 258M253 148L73 258M73 106L227 258M227 106L73 258" stroke="#b1b5e7" opacity=".17"/>
  <path d="M31 331L23 339V374L39 392M269 331L277 339V374L261 392" stroke="#b7a4ce" fill="none"/>
  <path d="M130 31L150 22L170 31L150 40Z" fill="url(#foil)"/>'''
}

for tier, frame in FRAMES.items():
    ink = {'ACE':'#334a3e', 'STALWART':'#432d24', 'ELITE':'#233e58', 'LEGEND':'#5a411c', 'TITAN':'#e9f4f4'}[tier]
    line = {'ACE':'#72816b', 'STALWART':'#6f4a32', 'ELITE':'#7095b0', 'LEGEND':'#b08b42', 'TITAN':'#92b5c8'}[tier]
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450" role="img" aria-labelledby="title desc">
    <title id="title">THE CAGE — {tier} base model</title><desc id="desc">Reusable {tier} frame with neutral placeholder shirt and identity slots. No real player data.</desc>
    {DEFS}<g data-part="frame">{frame}</g>{SHIRT}{common(tier,ink,line,tier=='LEGEND')}</svg>'''
    (OUT / f'{tier.lower()}.svg').write_text(svg, encoding='utf-8')

print('TIER_BASE_MODELS_BUILT: five frames, identical neutral content, no runtime game changes')
