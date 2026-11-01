/* Frame = tier; artwork background = roster nationality; foreground = shirt. */
(()=>{'use strict';
const NS='http://www.w3.org/2000/svg',rootURL=new URL('../',document.currentScript.src),cache=new Map();let serial=0;
const WINDOWS=Object.freeze({
 ACE:{x:36,y:85,w:228,h:184,path:'M36 85H264V269H36Z'},
 STALWART:{x:41,y:89,w:218,h:179,path:'M41 89H259V268H41Z'},
 ELITE:{x:36,y:85,w:226,h:184,path:'M36 85H229L262 119V269H71L36 235Z'},
 LEGEND:{x:43,y:84,w:214,h:184,path:'M43 177Q43 84 150 84Q257 84 257 177V268H43Z'},
 TITAN:{x:47,y:86,w:206,h:172,path:'M150 86L227 106L253 148V224L227 258H73L47 224V148L73 106Z'}
});
const SEAL=Object.freeze({
 ACE:{bg:'#1d2924',edge:'#f4e7c4',ink:'#334a3e'},
 STALWART:{bg:'#3b2419',edge:'#f5c899',ink:'#432d24'},
 ELITE:{bg:'#112b3f',edge:'#dff8ff',ink:'#233e58'},
 LEGEND:{bg:'#3c2a0e',edge:'#ffe9a7',ink:'#5a411c'},
 TITAN:{bg:'#081926',edge:'#b8f2f4',ink:'#dff7f7'}
});
function text(path){const url=new URL(path,rootURL).href;if(!cache.has(url))cache.set(url,fetch(url,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Card artwork unavailable: '+path);return r.text();}).catch(e=>{cache.delete(url);throw e;}));return cache.get(url);}
function element(tag,attrs){const el=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs||{}))el.setAttribute(key,String(value));return el;}
function namespace(svg,prefix){
 const ids=new Map([...svg.querySelectorAll('[id]')].map(el=>[el.id,prefix+el.id]));
 for(const el of [svg,...svg.querySelectorAll('*')])for(const attr of [...el.attributes]){
  let value=attr.value;if(attr.name==='id')value=ids.get(value)||value;
  else if(attr.name==='aria-labelledby')value=value.split(' ').map(id=>ids.get(id)||id).join(' ');
  else value=value.replace(/url\(#([^)]+)\)/g,(all,id)=>'url(#'+(ids.get(id)||id)+')');
  el.setAttribute(attr.name,value);
 }
}
async function create({tier,player,nationality}={}){
 if(!Object.hasOwn(WINDOWS,tier))throw Error('Unknown tier model: '+tier);
 const flag=window.CageNationalFlags.resolve(player||nationality),xml=await text('design/tier-models/'+tier.toLowerCase()+'.svg');
 const parsed=new DOMParser().parseFromString(xml,'image/svg+xml');if(parsed.querySelector('parsererror'))throw Error('Invalid base card SVG');
 const svg=document.importNode(parsed.documentElement,true),prefix='tier-model-'+(++serial)+'-';namespace(svg,prefix);
 svg.dataset.tier=tier;svg.dataset.flag=flag?.code||'';svg.dataset.rosterNationality=flag?.rosterNationality||'';
 if(!flag){svg.dataset.flagStatus='unavailable';return svg;}
 const asset=await text(flag.asset),w=WINDOWS[tier],defs=svg.querySelector('defs'),ax=w.x,ay=w.y,aw=w.w,ah=w.h;
 const flagRoot=new DOMParser().parseFromString(asset,'image/svg+xml').documentElement;
 const viewBox=(flagRoot.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);
 const nativeWidth=viewBox.length===4?viewBox[2]:parseFloat(flagRoot.getAttribute('width'));
 const nativeHeight=viewBox.length===4?viewBox[3]:parseFloat(flagRoot.getAttribute('height'));
 if(!(nativeWidth>0&&nativeHeight>0))throw Error('Flag proportions unavailable: '+flag.code);
 const scale=Math.max(w.w/nativeWidth,w.h/nativeHeight),width=nativeWidth*scale,height=nativeHeight*scale; // Full-bleed background; the separate full-flag seal below preserves symbols.
 const clip=element('clipPath',{id:prefix+'flag-window'});clip.append(element('path',{d:w.path}));defs.append(clip);
 const layer=element('g',{'data-part':'national-flag','clip-path':'url(#'+prefix+'flag-window)','aria-label':flag.name+' flag'});
 const image=element('image',{x:w.x+(w.w-width)/2,y:w.y+(w.h-height)/2,width,height,preserveAspectRatio:'xMidYMid meet',href:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(asset),'data-flag-code':flag.code,'data-native-ratio':nativeWidth/nativeHeight});layer.append(image);
 const finish=element('g',{'data-part':'tier-finish','pointer-events':'none'});
 const pfx=name=>'url(#'+prefix+name+')';
 const rect=attrs=>({x:ax,y:ay,width:aw,height:ah,...attrs});
 const add=(tag,attrs)=>{const el=element(tag,attrs);finish.append(el);return el;};
 const gradient=(type,id,attrs,stops)=>{const g=element(type,{id,...attrs});for(const s of stops)g.append(element('stop',s));defs.append(g);return 'url(#'+id+')';};
 const pattern=(id,attrs,shapes)=>{const p=element('pattern',{id,patternUnits:'userSpaceOnUse',...attrs});for(const [tag,shape] of shapes)p.append(element(tag,shape));defs.append(p);return 'url(#'+id+')';};
 const cornerMarks=(color,opacity)=>{
  const d='M'+(ax+12)+' '+(ay+19)+'V'+(ay+9)+'H'+(ax+22)+'M'+(ax+aw-22)+' '+(ay+9)+'H'+(ax+aw-12)+'V'+(ay+19)+
   'M'+(ax+aw-12)+' '+(ay+ah-19)+'V'+(ay+ah-9)+'H'+(ax+aw-22)+'M'+(ax+22)+' '+(ay+ah-9)+'H'+(ax+12)+'V'+(ay+ah-19);
  add('path',{d,fill:'none',stroke:color,'stroke-width':'.7',opacity});
 };
 if(tier==='ACE'){
  const vignette=gradient('radialGradient',prefix+'ace-vignette',{cx:'.5',cy:'.42',r:'.76'},[{offset:'.52','stop-color':'#6a5630','stop-opacity':'0'},{offset:'1','stop-color':'#4b3b1f','stop-opacity':'.24'}]);
  add('rect',rect({fill:vignette}));
  add('rect',rect({fill:pfx('grain'),opacity:'.72'}));
  add('rect',rect({fill:pfx('halftone'),color:'#234536',opacity:'.8'}));
  add('path',{d:w.path,fill:'none',stroke:'#b45445','stroke-width':'.65',opacity:'.3',transform:'translate(1 .8)'});
  add('path',{d:w.path,fill:'none',stroke:'#3f8c99','stroke-width':'.65',opacity:'.28',transform:'translate(-1 -.8)'});
  add('path',{d:w.path,fill:'none',stroke:'#fff3cf','stroke-width':'1',opacity:'.52'});
  add('path',{d:'M'+(ax+aw-72)+' '+ay+'L'+(ax+aw)+' '+(ay+42)+'L'+(ax+aw)+' '+(ay+74)+'L'+(ax+aw-52)+' '+(ay+18)+'Z',fill:'#fffdf2',opacity:'.07'});
  add('path',{d:'M'+(ax+24)+' '+(ay+ah-22)+'L'+(ax+aw*.55)+' '+(ay+14),fill:'none',stroke:'#fff8e4','stroke-width':'.55',opacity:'.16'});
  add('g',{fill:'none',stroke:'#5d6553','stroke-width':'.55',opacity:'.45'});
  finish.lastChild.append(element('circle',{cx:ax+aw-32,cy:ay+30,r:10}),element('circle',{cx:ax+aw-32,cy:ay+30,r:4}));
  cornerMarks('#4c5d4d','.58');
 }else if(tier==='STALWART'){
  const vignette=gradient('radialGradient',prefix+'stale-vignette',{cx:'.5',cy:'.45',r:'.75'},[{offset:'.42','stop-color':'#2b170d','stop-opacity':'0'},{offset:'1','stop-color':'#1e0f08','stop-opacity':'.36'}]);
  add('rect',rect({fill:vignette}));
  add('rect',rect({fill:pfx('brush'),opacity:'.5'}));
  add('path',{d:w.path,fill:'none',stroke:'#1d0f08','stroke-width':'10',opacity:'.34'});
  add('path',{d:w.path,fill:'none',stroke:'#ffd9a8','stroke-width':'1',opacity:'.42'});
  const arcSets=[[ax+7,ay+7,1,1],[ax+aw-7,ay+7,-1,1],[ax+7,ay+ah-7,1,-1],[ax+aw-7,ay+ah-7,-1,-1]];
  for(const [cx,cy,sx,sy] of arcSets)for(const r of [15,27,39]){
   add('path',{d:'M'+cx+' '+(cy+sy*r)+'A'+r+' '+r+' 0 0 1 '+(cx+sx*r)+' '+cy,fill:'none',stroke:'#f4c99a','stroke-width':'.55',opacity:'.24'});
  }
  add('path',{d:'M'+(ax+6)+' '+(ay+64)+'L'+(ax+64)+' '+(ay+6)+'M'+(ax+aw-6)+' '+(ay+ah-64)+'L'+(ax+aw-64)+' '+(ay+ah-6),stroke:'#33190f','stroke-width':'6',opacity:'.18'});
  add('path',{d:'M'+(ax+6)+' '+(ay+64)+'L'+(ax+64)+' '+(ay+6)+'M'+(ax+aw-6)+' '+(ay+ah-64)+'L'+(ax+aw-64)+' '+(ay+ah-6),stroke:'#ffd7a7','stroke-width':'1.1',opacity:'.32'});
  add('g',{fill:'none'});
  for(const [cx,cy] of [[ax+11,ay+11],[ax+aw-11,ay+11],[ax+11,ay+ah-11],[ax+aw-11,ay+ah-11]]){
   finish.lastChild.append(element('circle',{cx,cy,r:3.4,fill:pfx('rivet'),stroke:'#3b241a','stroke-width':'.7'}));
  }
  for(const [cx,cy,r] of [[ax+2,ay+2,22],[ax+aw-2,ay+2,20],[ax+2,ay+ah-2,18],[ax+aw-2,ay+ah-2,23]])add('circle',{cx,cy,r,fill:pfx('patina')});
  cornerMarks('#ffd9ab','.45');
 }else if(tier==='ELITE'){
  const sheen=gradient('linearGradient',prefix+'elite-sheen',{x1:'0',y1:'0',x2:'1',y2:'1'},[{offset:'0','stop-color':'#fff','stop-opacity':'.03'},{offset:'.44','stop-color':'#fff','stop-opacity':'.3'},{offset:'.5','stop-color':'#dffcff','stop-opacity':'.05'},{offset:'1','stop-color':'#fff','stop-opacity':'.12'}]);
  add('rect',rect({fill:sheen}));
  const grid=pattern(prefix+'elite-grid',{width:12,height:12},[['path',{d:'M0 0H12M0 0V12',fill:'none',stroke:'#e8feff','stroke-width':'.4',opacity:'.5'}]]);
  add('rect',rect({fill:grid,opacity:'.4'}));
  const vignette=gradient('radialGradient',prefix+'elite-vignette',{cx:'.45',cy:'.38',r:'.8'},[{offset:'.5','stop-color':'#dff8ff','stop-opacity':'0'},{offset:'1','stop-color':'#31556f','stop-opacity':'.28'}]);
  add('rect',rect({fill:vignette}));
  const edge=gradient('linearGradient',prefix+'elite-edge',{x1:'0',y1:'0',x2:'1',y2:'1'},[{offset:'0','stop-color':'#7ee3ef'},{offset:'.48','stop-color':'#f5ffff'},{offset:'.72','stop-color':'#8e9fe8'},{offset:'1','stop-color':'#d8fbff'}]);
  add('path',{d:w.path,fill:'none',stroke:edge,'stroke-width':'1.5',opacity:'.8'});
  add('path',{d:w.path,fill:'none',stroke:'#fff','stroke-width':'1.2',opacity:'.22',transform:'translate(1 1)'});
  add('path',{d:w.path,fill:'none',stroke:'#63b6d0','stroke-width':'.7',opacity:'.24',transform:'translate(-1 -1)'});
  for(const [d] of [
   ['M'+ax+' '+(ay+54)+'L'+(ax+54)+' '+ay+'L'+(ax+20)+' '+ay+'L'+ax+' '+(ay+20)+'Z'],
   ['M'+(ax+aw)+' '+(ay+54)+'L'+(ax+aw-54)+' '+ay+'L'+(ax+aw-20)+' '+ay+'L'+(ax+aw)+' '+(ay+20)+'Z'],
   ['M'+ax+' '+(ay+ah-54)+'L'+(ax+54)+' '+(ay+ah)+'L'+(ax+20)+' '+(ay+ah)+'L'+ax+' '+(ay+ah-20)+'Z'],
   ['M'+(ax+aw)+' '+(ay+ah-54)+'L'+(ax+aw-54)+' '+(ay+ah)+'L'+(ax+aw-20)+' '+(ay+ah)+'L'+(ax+aw)+' '+(ay+ah-20)+'Z']
  ])add('path',{d,fill:'#eaffff',opacity:'.1',stroke:'#c8f8ff','stroke-width':'.5'});
  add('path',{d:'M150 '+(ay+18)+'L'+(ax+aw-14)+' '+(ay+ah/2)+'L150 '+(ay+ah-16)+'L'+(ax+14)+' '+(ay+ah/2)+'Z',fill:'none',stroke:'#dffcff','stroke-width':'.55',opacity:'.14'});
  add('g',{stroke:'#d8fbff','stroke-width':'.5',opacity:'.3'});
  for(let ty=ay+28;ty<ay+ah-10;ty+=26)finish.lastChild.append(element('path',{d:'M'+(ax+5)+' '+ty+'H'+(ax+12)+'M'+(ax+aw-12)+' '+ty+'H'+(ax+aw-5)}));
  cornerMarks('#c8f8ff','.5');
 }else if(tier==='LEGEND'){
  const rays=[];for(let i=0;i<28;i++){const a=Math.PI*2*i/28;rays.push('M150 84L'+(150+Math.cos(a)*360).toFixed(1)+' '+(84+Math.sin(a)*360).toFixed(1));}
  add('path',{d:rays.join(''),fill:'none',stroke:'#ffe9a1','stroke-width':'.55',opacity:'.12'});
  const vignette=gradient('radialGradient',prefix+'legend-vignette',{cx:'.5',cy:'.4',r:'.75'},[{offset:'.48','stop-color':'#ffe9a6','stop-opacity':'0'},{offset:'1','stop-color':'#5d430e','stop-opacity':'.24'}]);
  add('rect',rect({fill:vignette}));
  add('path',{d:w.path,fill:'none',stroke:'#ffe9a7','stroke-width':'1.4',opacity:'.75'});
  add('path',{d:w.path,fill:'none',stroke:'#7e5a18','stroke-width':'.55',opacity:'.45',transform:'translate(0 3)'});
  for(const [cx,cy,sx,sy] of [[ax+6,ay+6,1,1],[ax+aw-6,ay+6,-1,1],[ax+6,ay+ah-6,1,-1],[ax+aw-6,ay+ah-6,-1,-1]])for(const r of [14,26,38]){
   const x1=cx,y1=cy+sy*r,x2=cx+sx*r,y2=cy;add('path',{d:'M'+x1+' '+y1+'A'+r+' '+r+' 0 0 '+(sx*sy>0?1:0)+' '+x2+' '+y2,fill:'none',stroke:'#ffe8a3','stroke-width':'.5',opacity:'.25'});
  }
  add('g',{fill:'#ffe4a0',opacity:'.3'});
  for(let ly=ay+38;ly<ay+ah-20;ly+=26){
   finish.lastChild.append(element('path',{d:'M'+(ax+7)+' '+ly+'Q'+(ax+18)+' '+(ly-8)+' '+(ax+24)+' '+(ly+2)+'Q'+(ax+13)+' '+(ly+7)+' '+(ax+7)+' '+ly+'Z'}));
   finish.lastChild.append(element('path',{d:'M'+(ax+aw-7)+' '+ly+'Q'+(ax+aw-18)+' '+(ly-8)+' '+(ax+aw-24)+' '+(ly+2)+'Q'+(ax+aw-13)+' '+(ly+7)+' '+(ax+aw-7)+' '+ly+'Z'}));
  }
  add('g',{fill:'#fff2ba',stroke:'#9d752a','stroke-width':'.5'});
  for(const [cx,cy] of [[ax+13,ay+13],[ax+aw-13,ay+13],[ax+13,ay+ah-13],[ax+aw-13,ay+ah-13]])finish.lastChild.append(element('circle',{cx,cy,r:2.2}));
  cornerMarks('#ffe9a7','.52');
 }else{
  const vignette=gradient('radialGradient',prefix+'titan-vignette',{cx:'.5',cy:'.43',r:'.74'},[{offset:'.42','stop-color':'#1d4860','stop-opacity':'0'},{offset:'1','stop-color':'#04101c','stop-opacity':'.55'}]);
  add('rect',rect({fill:vignette}));
  const glow=gradient('radialGradient',prefix+'titan-glow',{cx:'.5',cy:'.88',r:'.72'},[{offset:'0','stop-color':'#89f0e7','stop-opacity':'.24'},{offset:'.58','stop-color':'#7598e5','stop-opacity':'.08'},{offset:'1','stop-color':'#0a1826','stop-opacity':'0'}]);
  add('rect',rect({fill:glow}));
  const lattice=pattern(prefix+'titan-lattice',{width:20,height:18},[['path',{d:'M10 0L20 9L10 18L0 9Z',fill:'none',stroke:'#a9eef1','stroke-width':'.4',opacity:'.4'}]]);
  add('rect',rect({fill:lattice,opacity:'.24'}));
  const scan=pattern(prefix+'titan-scan',{width:8,height:4},[['path',{d:'M0 1H8',stroke:'#c8fbff','stroke-width':'.35',opacity:'.35'}]]);
  add('rect',rect({fill:scan,opacity:'.16'}));
  const edge=gradient('linearGradient',prefix+'titan-edge',{x1:'0',y1:'0',x2:'1',y2:'1'},[{offset:'0','stop-color':'#8df0e5'},{offset:'.28','stop-color':'#8da5ed'},{offset:'.54','stop-color':'#f2d59a'},{offset:'.78','stop-color':'#d28ecf'},{offset:'1','stop-color':'#86e4ec'}]);
  add('path',{d:w.path,fill:'none',stroke:edge,'stroke-width':'1.8',opacity:'.9'});
  add('path',{d:w.path,fill:'none',stroke:'#65dce5','stroke-width':'.8',opacity:'.3',transform:'translate(1.4 .8)'});
  add('path',{d:w.path,fill:'none',stroke:'#c58ddd','stroke-width':'.8',opacity:'.3',transform:'translate(-1.2 -1)'});
  add('path',{d:'M'+(ax+4)+' '+(ay+66)+'L'+(ax+66)+' '+(ay+4)+'M'+(ax+aw-4)+' '+(ay+ah-66)+'L'+(ax+aw-66)+' '+(ay+ah-4),stroke:edge,'stroke-width':'1',opacity:'.25'});
  add('path',{d:'M'+(ax+22)+' '+ay+'L'+(ax+74)+' '+(ay+38)+'L'+(ax+42)+' '+(ay+74)+'L'+ax+' '+(ay+34)+'Z',fill:pfx('titanCrystal'),opacity:'.34'});
  add('path',{d:'M'+(ax+aw-22)+' '+ay+'L'+(ax+aw-74)+' '+(ay+38)+'L'+(ax+aw-42)+' '+(ay+74)+'L'+(ax+aw)+' '+(ay+34)+'Z',fill:pfx('titanCrystal'),opacity:'.28'});
  add('path',{d:'M'+(ax+18)+' '+(ay+ah)+'L'+(ax+56)+' '+(ay+ah-38)+'L'+(ax+88)+' '+(ay+ah)+'Z',fill:pfx('titanCrystal'),opacity:'.24'});
  add('path',{d:'M'+(ax+aw-18)+' '+(ay+ah)+'L'+(ax+aw-56)+' '+(ay+ah-38)+'L'+(ax+aw-88)+' '+(ay+ah)+'Z',fill:pfx('titanCrystal'),opacity:'.22'});
  add('g',{fill:'#d9fdff',opacity:'.7'});
  for(const [cx,cy] of [[ax+34,ay+46],[ax+aw-38,ay+62],[ax+44,ay+ah-40],[ax+aw-52,ay+ah-54],[150,ay+24]])finish.lastChild.append(element('circle',{cx,cy,r:1.1}));
  cornerMarks('#b9f3ef','.55');
 }
 layer.append(finish);
 svg.insertBefore(layer,svg.querySelector('[data-part="shirt"]'));
 const housing=element('g',{'data-part':'flag-housing','pointer-events':'none'});
 const housingEdge={ACE:'#f7f0d8',STALWART:'#ffd9ab',ELITE:'#d8fbff',LEGEND:'#ffe9a7',TITAN:'#b9f3ef'}[tier];
 housing.append(element('path',{d:w.path,fill:'none',stroke:housingEdge,'stroke-width':tier==='STALWART'||tier==='TITAN'?'1.3':'1',opacity:'.72'}));
 housing.append(element('path',{d:'M'+(ax+9)+' '+(ay+21)+'V'+(ay+9)+'H'+(ax+21)+'M'+(ax+aw-21)+' '+(ay+9)+'H'+(ax+aw-9)+'V'+(ay+21)+'M'+(ax+aw-9)+' '+(ay+ah-21)+'V'+(ay+ah-9)+'H'+(ax+aw-21)+'M'+(ax+21)+' '+(ay+ah-9)+'H'+(ax+9)+'V'+(ay+ah-21),fill:'none',stroke:housingEdge,'stroke-width':'1.4',opacity:'.8'}));
 svg.insertBefore(housing,svg.querySelector('[data-part="shirt"]'));
 const seal=element('g',{'data-part':'nationality-seal','aria-label':flag.name+' miniature flag','data-flag-code':flag.code});
 const sx=39,sy=393,sw=38,sh=24,ss=SEAL[tier];
 seal.append(element('rect',{x:sx-1,y:sy+2,width:sw+5,height:sh+5,rx:2,fill:'#06101a',opacity:'.35'}));
 seal.append(element('rect',{x:sx-2,y:sy-2,width:sw+4,height:sh+4,rx:2,fill:ss.bg,stroke:ss.edge,'stroke-width':'.9'}));
 seal.append(element('rect',{x:sx,y:sy,width:sw,height:sh,rx:1,fill:'#eef0e9'}));
 const contained=Math.min((sw-3)/nativeWidth,(sh-3)/nativeHeight),iw=nativeWidth*contained,ih=nativeHeight*contained;
 seal.append(element('image',{x:sx+(sw-iw)/2,y:sy+(sh-ih)/2,width:iw,height:ih,preserveAspectRatio:'xMidYMid meet',href:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(asset)}));
 seal.append(element('rect',{x:sx,y:sy,width:sw,height:sh,rx:1,fill:'none',stroke:ss.edge,'stroke-width':'.65'}));
 seal.append(element('path',{d:'M'+(sx-2)+' '+(sy+5)+'H'+(sx+3)+'M'+(sx+sw-3)+' '+(sy-2)+'H'+(sx+sw+2)+'M'+(sx-2)+' '+(sy+sh-5)+'H'+(sx+3)+'M'+(sx+sw-3)+' '+(sy+sh+2)+'H'+(sx+sw+2),fill:'none',stroke:ss.edge,'stroke-width':'.8',opacity:'.85'}));
 seal.append(element('path',{d:'M'+(sx+3)+' '+(sy+3)+'H'+(sx+10),stroke:'#fff','stroke-width':'.7',opacity:'.6'}));
 const sealLabel=element('text',{x:sx+sw/2,y:sy+sh+7.5,'text-anchor':'middle','font-family':'Arial, sans-serif','font-size':'4.7','font-weight':'700','letter-spacing':'1.3',fill:ss.ink,opacity:'.9'});sealLabel.textContent='NAT';seal.append(sealLabel);
 const shirt=svg.querySelector('[data-part="shirt"]');
 const shadow=element('g',{'data-part':'shirt-contact-shadow','pointer-events':'none'});
 shadow.append(element('ellipse',{cx:150,cy:257,rx:58,ry:5,fill:'#06101a',opacity:'.14'}));
 svg.insertBefore(shadow,shirt);
 const label=svg.querySelector('[data-field="nationality"]');
 label.parentNode.insertBefore(seal,label);label.textContent='POSITION · '+flag.name.toUpperCase();
 if(label.textContent.length>30){label.setAttribute('textLength','225');label.setAttribute('lengthAdjust','spacingAndGlyphs');}
 svg.querySelector('desc').textContent=tier+' base frame with '+flag.name+' flag, tier finish and the same neutral foreground shirt.';
 svg.dataset.flagStatus='ready';return svg;
}
window.CageTierModels=Object.freeze({create,TIERS:Object.freeze(Object.keys(WINDOWS))});
})();
