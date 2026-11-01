(()=>{'use strict';
const selector=document.getElementById('nationality'),status=document.getElementById('preview-status');let generation=0;
for(const country of Object.keys(CageNationalFlags.COUNTRIES).filter(name=>name!=='Ireland').sort()){
 const option=document.createElement('option');option.value=country;option.textContent=country;selector.append(option);
}
selector.value='Italy';
async function render(){
 const current=++generation,country=selector.value;status.textContent='Loading '+country+' flag…';
 try{
  const cards=await Promise.all(CageTierModels.TIERS.map(tier=>CageTierModels.create({tier,player:{country}})));
  if(current!==generation)return;
  document.querySelectorAll('.models figure').forEach((figure,i)=>{
   const existing=figure.querySelector('svg,img');existing.replaceWith(cards[i]);
  });
  status.textContent=country+' · same flag and generic shirt across all five base models';
 }catch(e){if(current===generation)status.textContent='Flag preview unavailable: '+e.message;}
}
selector.addEventListener('change',render);
document.getElementById('flag-only').addEventListener('click',function(){
 const on=document.body.classList.toggle('flag-only');this.setAttribute('aria-pressed',String(on));this.textContent=on?'SHOW SHIRT':'VIEW FLAG ONLY';
});
render();
})();
