(()=>{'use strict';
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’'`]/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const ambiguous=new Set(['ronaldo','keane','toure','ferdinand','alonso','martins','carvalho','king','pedersen','juninho','silva','denilson','thuram']);
const unsupported=new Set(['cristiano ronaldo','cr7','robbie keane','kolo toure','anton ferdinand','marcos alonso','juninho paulista','juninho pernambucano']);
function oneEdit(a,b){if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,n=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++n>1)return false;if(a.length>=b.length)i++;if(a.length<=b.length)j++;}return n+(i<a.length||j<b.length?1:0)===1;}
function resolve(q){const n=normalize(q);if(!n)return {kind:'empty',error:'Enter a remembered name.'};if(n.length>100)return {kind:'unknown',error:'Use a footballer name of at most 100 characters.'};if(unsupported.has(n))return {kind:'unsupported',error:'Recognised identity, but not supported in this edition yet. No claim has been made.'};
const ps=window.THE_CAGE_PLAYERS,match=p=>[p.name,...p.aliases].map(normalize);const exact=ps.filter(p=>match(p).includes(n));
// Search is called only after deliberate submission. Complete meaningful token
// prefixes, never arbitrary substrings or an empty-input catalogue.
const parts=n.split(' '),fragment=words=>{const tokens=words.split(' ');return tokens.some((_,start)=>parts.every((part,i)=>i===parts.length-1?tokens[start+i]?.startsWith(part):tokens[start+i]===part));};
const partial=n.replace(/ /g,'').length>=4?ps.filter(p=>match(p).some(fragment)):[];
if(ambiguous.has(n)){const matches=ps.filter(p=>exact.includes(p)||partial.includes(p));return matches.length?{kind:'disambiguate',matches,message:'This name has multiple football identities. Confirm the full identity below; only supported matches are shown.'}:{kind:'ambiguous',error:'This name is shared by several footballers, but no matching identity is supported yet. Try a fuller name.'};}
if(exact.length)return {kind:exact.length>1?'disambiguate':'exact',matches:exact};
if(partial.length>4)return {kind:'broad',error:'Too many matching identities. Add more of the remembered name and search again.'};
if(partial.length)return {kind:'completion',matches:partial,message:'Matching full '+(partial.length===1?'identity':'identities')+' — confirm the footballer you meant.'};
if(n.replace(/ /g,'').length<4)return {kind:'short',error:'Enter at least four letters of a remembered name, or an exact nickname, then press Enter.'};
const near=n.length>=6?ps.filter(p=>match(p).some(a=>a.length>=6&&!ambiguous.has(a)&&oneEdit(n,a))):[];
if(near.length&&near.length<=2)return {kind:'correction',matches:near};return {kind:'unknown',error:'No match in the '+ps.length+' supported identities. Check the spelling or try a fuller name. A valid footballer may not be in this edition yet.'};}
window.CageIdentity={normalize,resolve};
})();
