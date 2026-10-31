(()=>{
 const o=document.createElement('pre');o.id='v61-layout-output';document.body.append(o);
 const $=id=>document.getElementById(id),check=(x,m)=>{if(!x)throw Error(m);};
 try {
  const viewport=window.innerWidth;
  const layout=getComputedStyle(document.querySelector('.intro-stage')).gridTemplateColumns.split(' ').filter(Boolean).length;
  check(viewport<=760?layout===1:layout===2,'intro breakpoint grid '+viewport+' '+layout);
  check(document.documentElement.scrollWidth<=viewport+3,'intro horizontal overflow: '+document.documentElement.scrollWidth+' > '+viewport);
  $('begin').click();$('reveal').click();
  const pool=$('pool'),cards=pool.querySelectorAll('.draft-card-wrap');
  check(cards.length===15,'missing full 15-player offer');
  const cols=getComputedStyle(pool).gridTemplateColumns.split(' ').filter(Boolean).length;
  const expected=viewport<=420?1:viewport<=760?2:viewport<=1020?3:viewport<=1370?4:5;
  check(cols===expected,'pool columns '+cols+' expected '+expected+' at '+viewport);
  check(document.documentElement.scrollWidth<=viewport+3,'draft horizontal overflow '+document.documentElement.scrollWidth+' at '+viewport);
  const fullHeight=cards[0].getBoundingClientRect().height;
  const before=window.CageRandomDraft.snapshot().pool.join(',');
  $('viewToggle').click();
  const quickHeight=cards[0].getBoundingClientRect().height;
  check(quickHeight<fullHeight*.75,'quick view not meaningfully smaller '+fullHeight+' to '+quickHeight);
  check(window.CageRandomDraft.snapshot().pool.join(',')===before,'view toggle changed offered players');
  check(document.documentElement.scrollWidth<=viewport+3,'quick view overflow');
  o.textContent='V61_LAYOUT_PASS viewport='+viewport+' cols='+cols+' fullHeight='+Math.round(fullHeight)+' quickHeight='+Math.round(quickHeight);
 }catch(e){o.textContent='V61_LAYOUT_FAIL '+e.stack;}
})();