(()=>{'use strict';
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’'`]/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const ambiguous=new Set(['ronaldo','keane','toure','ferdinand','alonso','martins','carvalho','king','pedersen','juninho','silva','denilson','thuram']);
const unsupported=new Set(['cristiano ronaldo','cr7','robbie keane','kolo toure','anton ferdinand','marcos alonso','juninho paulista','juninho pernambucano']);
function oneEdit(a,b){if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,n=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++n>1)return false;if(a.length>=b.length)i++;if(a.length<=b.length)j++;}return n+(i<a.length||j<b.length?1:0)===1;}
function resolve(q){const n=normalize(q);if(!n)return {kind:'empty',error:'Enter a remembered name.'};if(n.length>100)return {kind:'unknown',error:'Use a footballer name of at most 100 characters.'};if(ambiguous.has(n))return {kind:'ambiguous',error:'That name can identify more than one footballer. Enter the full name or a specific nickname.'};if(unsupported.has(n))return {kind:'unsupported',error:'Recognised identity, but not supported in this edition yet. No claim has been made.'};
const ps=window.THE_CAGE_PLAYERS,match=p=>[p.name,...p.aliases].map(normalize);const exact=ps.filter(p=>match(p).includes(n));if(exact.length)return {kind:exact.length>1?'disambiguate':'exact',matches:exact};
const near=n.length>=6?ps.filter(p=>match(p).some(a=>a.length>=6&&!ambiguous.has(a)&&oneEdit(n,a))):[];
if(near.length&&near.length<=2)return {kind:'correction',matches:near};return {kind:'unknown',error:'No supported identity matched. Check the spelling or try a full name; a valid footballer may not be supported yet.'};}
window.CageIdentity={normalize,resolve};
})();
