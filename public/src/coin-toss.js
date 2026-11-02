// THE CAGE: coin toss presentation. The toss result is drawn by the draft (crypto RNG) BEFORE this runs; this module
// only shows it: a 3D coin flip that lands on the winner's face, then who picks first and the six-pick order.
// It never decides anything. While it is on screen the CPU waits (after()); Skip / Enter / Esc / click continue.
(()=>{'use strict';
const reduce=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
// Automated browser runs (generated *-e2e pages, webdriver, or an explicit flag) skip the presentation.
const instant=()=>!!(navigator.webdriver||window.CAGE_INSTANT_TOSS||/e2e/i.test(location.pathname));
let el=null,state=null;
function face(side,name){return '<div class="ct-face ct-face-'+side.toLowerCase()+'"><div class="ct-rim"></div><div class="ct-crest"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 12l30 18v40L50 88 20 70V30z" fill="none" stroke="currentColor" stroke-width="5"/><path d="M50 30l16 10v20L50 70 34 60V40z" fill="currentColor" opacity=".85"/></svg></div><div class="ct-name">'+name+'</div><div class="ct-side">'+(side==='A'?'HEADS':'TAILS')+'</div></div>';}
function build(){el=document.createElement('div');el.className='ct-overlay';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','ct-title');el.hidden=true;
  el.innerHTML='<div class="ct-lights" aria-hidden="true"><i></i><i></i></div><div class="ct-panel"><div class="ct-kicker" data-ct="kicker"></div><h2 id="ct-title" data-ct="title">THE TOSS</h2>'+
  '<div class="ct-arena" aria-hidden="true"><div class="ct-shadow" data-ct="shadow"></div><div class="ct-coin" data-ct="coin"><div class="ct-edge"></div></div></div>'+
  '<div class="ct-result" data-ct="result" role="status" aria-live="assertive"></div><div class="ct-order" data-ct="order" aria-label="Pick order"></div>'+
  '<div class="ct-actions"><button type="button" class="ct-skip" data-ct="skip">SKIP</button><button type="button" class="ct-go intro-start" data-ct="go" hidden>START THE DRAFT <span aria-hidden="true">▸</span></button></div></div>';
  document.body.appendChild(el);
  el.addEventListener('click',e=>{const t=e.target.closest('[data-ct]');if(t&&t.dataset.ct==='skip')land(true);else if(t&&t.dataset.ct==='go')close();});
  document.addEventListener('keydown',e=>{if(!state||el.hidden)return;if(e.key==='Escape'||e.key==='Enter'||e.key===' '){e.preventDefault();state.landed?close():land(true);}},true);}
const q=k=>el.querySelector('[data-ct="'+k+'"]');
// show({winner:'A'|'B', round, names:{A,B}, order:['A','B',...]}) -> resolves when dismissed.
function show(o){if(instant()||typeof document==='undefined'||!document.body)return Promise.resolve();if(!el)build();if(state)close();
  return new Promise(res=>{state={o,res,landed:false,waits:[],anim:null,timer:null};
    const n=o.names||{A:'COMMANDER',B:'OPPONENT'};
    q('kicker').textContent='ROUND '+(o.round||1)+' · FIRST PICK';q('title').textContent='THE TOSS';
    const coin=q('coin');coin.querySelectorAll('.ct-face').forEach(f=>f.remove());coin.insertAdjacentHTML('beforeend',face('A',n.A)+face('B',n.B));
    q('result').textContent='';q('result').className='ct-result';q('order').innerHTML='';q('go').hidden=true;q('skip').hidden=false;
    el.hidden=false;el.dataset.winner=o.winner.toLowerCase();el.classList.remove('ct-done');document.documentElement.classList.add('ct-open');q('skip').focus({preventScroll:true});
    const end=(o.winner==='B'?180:0)+360*7,dur=reduce()?350:2600;coin.style.transform='';
    if(reduce()||typeof coin.animate!=='function'){coin.style.transform='rotateX('+end+'deg)';state.timer=setTimeout(()=>land(false),dur);return;}
    // Rise, spin end-over-end, fall, settle: the final angle shows the winner's face.
    state.anim=coin.animate([{transform:'translateY(0) rotateX(0deg) scale(1)',offset:0},{transform:'translateY(-150px) rotateX('+(end*.55)+'deg) scale(1.18)',offset:.45,easing:'ease-in'},
      {transform:'translateY(0) rotateX('+(end-12)+'deg) scale(1)',offset:.86,easing:'ease-out'},{transform:'translateY(-14px) rotateX('+(end+4)+'deg) scale(1.02)',offset:.93},{transform:'translateY(0) rotateX('+end+'deg) scale(1)',offset:1}],{duration:dur,easing:'cubic-bezier(.2,.65,.3,1)',fill:'forwards'});
    q('shadow').animate([{transform:'scale(1)',opacity:.55},{transform:'scale(.45)',opacity:.18,offset:.45},{transform:'scale(1)',opacity:.55,offset:.86},{transform:'scale(1)',opacity:.55}],{duration:dur,fill:'forwards'});
    state.anim.onfinish=()=>land(false);});}
function land(skipped){if(!state||state.landed)return;state.landed=true;const o=state.o,n=o.names||{A:'COMMANDER',B:'OPPONENT'},coin=q('coin');
  clearTimeout(state.timer);if(state.anim){state.anim.onfinish=null;state.anim.finish();}else coin.style.transform='rotateX('+(o.winner==='B'?180:0)+'deg)';
  el.classList.add('ct-done');q('title').textContent=(o.winner==='A'?'HEADS':'TAILS');
  const r=q('result');r.innerHTML='<b>'+n[o.winner]+'</b> WINS THE TOSS<small>'+n[o.winner]+' PICKS FIRST IN ROUNDS 1, 3, 5 · '+n[o.winner==='A'?'B':'A']+' IN ROUNDS 2, 4</small>';r.classList.add('ct-win-'+o.winner.toLowerCase());
  q('order').innerHTML=(o.order||[]).map((s,i)=>'<span class="ct-pip ct-pip-'+s.toLowerCase()+'" style="animation-delay:'+(reduce()?0:120*i)+'ms" title="Pick '+(i+1)+': '+n[s]+'">'+(i+1)+'</span>').join('');
  q('skip').hidden=true;const go=q('go');go.hidden=false;go.focus({preventScroll:true});
  state.timer=setTimeout(close,skipped?6000:4500);}
function close(){if(!state)return;const s=state;state=null;clearTimeout(s.timer);if(s.anim){s.anim.onfinish=null;s.anim.cancel();}el.hidden=true;document.documentElement.classList.remove('ct-open');s.waits.forEach(f=>{try{f();}catch(e){setTimeout(()=>{throw e;});}});s.res();}
// Run fn now, or as soon as the toss is dismissed.
function after(fn){if(state)state.waits.push(fn);else fn();}
window.CageCoinToss={show,after,close,get active(){return !!state;}};
})();
