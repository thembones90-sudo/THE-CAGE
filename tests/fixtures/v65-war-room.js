(async()=>{const out=document.createElement('pre');out.id='v65-war-result';document.body.append(out);const $=id=>document.getElementById(id),check=(ok,msg)=>{if(!ok)throw Error(msg)};
try{
check(window.CageWarRoom.ATTRS.length===17,'17 scouting attributes missing');
check(!$('hints').checked,'matchup hints must be OFF');
$('begin').click();$('reveal').click();
let cards=$('pool').querySelectorAll('.draft-card-wrap'),picks=window.CageRandomDraft.snapshot().picks.length;
check(cards.length===15,'15 visible candidates required');
cards[0].querySelector('.war-scout-btn').click();cards[1].querySelector('.war-scout-btn').click();
check($('warRoom').querySelectorAll('.war-attributes tbody tr').length===17,'full 17-row comparison absent');
check(window.CageRandomDraft.snapshot().picks.length===picks,'scout button drafted without consent');
check($('warRoom').textContent.includes('YOUR TRIO'),'team composition not shown');
check(document.querySelector('#warRoom .war-compare-head')?.children.length===2,'two comparison slots missing');
check(document.documentElement.scrollWidth<=window.innerWidth+4,'war room horizontal overflow');
cards[0].querySelector('button.card').click();
check(window.CageRandomDraft.snapshot().picks.length===picks+1,'human draft failed');
check($('warRoom').querySelectorAll('.war-attributes tbody tr').length===0,'War Room comparison leaked across handoff');
out.textContent='V65_WAR_ROOM_PASS 17 attributes, two scouts, no accidental claims, optional hints OFF, handoff privacy, width '+window.innerWidth;
}catch(e){out.textContent='V65_WAR_ROOM_FAIL '+e.stack;}
})();
