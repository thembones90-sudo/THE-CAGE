'use strict';
(function () {
  const pitch = { width: 1200, height: 650 };
  const players = [
    {name:'MALDINI',short:'MAL',side:'blue',x:306,y:311,dx:17,dy:13,phase:0},
    {name:'BALLACK',short:'BAL',side:'blue',x:495,y:207,dx:23,dy:12,phase:1.3},
    {name:'RONALDO',short:'R9',side:'blue',x:661,y:394,dx:26,dy:20,phase:2.1},
    {name:'VIDIÄ†',short:'VID',side:'red',x:825,y:345,dx:24,dy:17,phase:1.9},
    {name:'STAM',short:'STA',side:'red',x:925,y:230,dx:17,dy:13,phase:0.9},
    {name:'GRAVESEN',short:'GRA',side:'red',x:700,y:170,dx:27,dy:20,phase:2.7}
  ];
  const layer = document.getElementById('demo-players');
  const ball = document.getElementById('gold-ball');
  if (!layer || !ball) return;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = {playing: !reduced, elapsed: 0, last: 0, speed: 1, variant: 'iron'};
  const art = document.getElementById("arena-art");
  const inspect = document.getElementById("inspect-btn");
  function point(el, x, y) {
    el.style.left = ((x / pitch.width) * 100) + '%';
    el.style.top = ((y / pitch.height) * 100) + '%';
  }
  const nodes = players.map(p => {
    const node = document.createElement('div');
    node.className = 'token ' + (p.side === 'red' ? 'red' : 'blue');
    node.setAttribute('aria-label', p.name + ' demonstration player');
    node.title = p.name;
    const disc = document.createElement('div'); disc.className = 'player-disc'; disc.textContent = p.short;
    const name = document.createElement('div'); name.className = 'player-name'; name.textContent = p.name;
    node.append(disc, name); layer.append(node);
    return node;
  });
  const route = [
    {x:494,y:201},{x:550,y:246},{x:661,y:389},{x:705,y:347},{x:622,y:310},{x:494,y:201}
  ];
  function loopRoute(t) {
    const u = ((t / 2.6) % route.length + route.length) % route.length;
    const n = Math.floor(u), a = u - n;
    const from = route[n], to = route[(n + 1) % route.length];
    const ease = a * a * (3 - 2 * a);
    return {x:from.x + (to.x-from.x)*ease, y:from.y + (to.y-from.y)*ease};
  }
  function draw() {
    const t = state.elapsed;
    players.forEach((p,i) => {
      const x = p.x + Math.sin(t * .78 + p.phase) * p.dx;
      const y = p.y + Math.cos(t * .64 + p.phase) * p.dy;
      point(nodes[i], x, y);
      nodes[i].classList.toggle('possessed',i === 1 && (t % 15.6) < 1.1);
    });
    const pos = loopRoute(t);
    point(ball,pos.x,pos.y);
  }
  function frame(now) {
    if (!state.last) state.last = now;
    if (state.playing) state.elapsed += Math.min((now - state.last)/1000,.07)*state.speed;
    state.last = now;
    draw();
    requestAnimationFrame(frame);
  }
  function setMotion(playing) {
    state.playing=playing;
    const b=document.getElementById('motion-btn');
    b.textContent = playing ? 'PAUSE MOTION' : 'RESUME MOTION';
    b.setAttribute('aria-pressed',String(playing));
    document.getElementById('motion-label').textContent='MOVEMENT / '+(playing?'ACTIVE':'PAUSED');
  }
  const iron=document.getElementById('iron-btn'), gold=document.getElementById('gold-btn');
  function setVariant(v) {
    state.variant=v;
    document.body.classList.toggle('golden',v==='gold');
    if (art) { art.src = v === 'gold' ? './arena-golden.svg' : './arena.svg'; art.alt = v === 'gold' ? 'The Golden Arena version with brass-trimmed gunmetal and warm spotlight reflections' : 'The Iron Pit version with blackout turf, heavy gunmetal and cold floodlights'; }
    iron.classList.toggle('active',v==='iron');
    gold.classList.toggle('active',v==='gold');
    iron.setAttribute('aria-pressed',String(v==='iron'));
    gold.setAttribute('aria-pressed',String(v==='gold'));
    document.getElementById('variant-label').textContent=v==='iron'?'THE IRON PIT':'THE GOLDEN ARENA';
  }
  iron.addEventListener('click',()=>setVariant('iron'));
  gold.addEventListener('click',()=>setVariant('gold'));
  document.getElementById('motion-btn').addEventListener('click',()=>setMotion(!state.playing));
  document.getElementById('speed').addEventListener('change',e=>{state.speed=Number(e.target.value)||1});
  if (inspect) inspect.addEventListener('click', () => {
    const pitchOnly = document.body.classList.toggle('pitch-only');
    inspect.setAttribute('aria-pressed',String(pitchOnly));
    inspect.textContent = pitchOnly ? 'SHOW MARKERS' : 'HIDE MARKERS';
  });
  const params = new URLSearchParams(window.location.search);
  setVariant(params.get('arena') === 'gold' ? 'gold' : 'iron');
  if (params.get('players') === 'hide' && inspect) inspect.click();
  setMotion(!reduced); draw(); requestAnimationFrame(frame);
})();
