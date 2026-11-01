/* Nationality resolves artwork only. Never reads or modifies football ratings. */
(function(root,factory){const api=factory();root.CageNationalFlags=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof window==='undefined'?globalThis:window,function(){'use strict';
const COUNTRIES=Object.freeze({Algeria:'dz',Argentina:'ar',Australia:'au',Belgium:'be',Brazil:'br',Bulgaria:'bg',Cameroon:'cm',Chile:'cl',Colombia:'co','Costa Rica':'cr',Croatia:'hr','Czech Republic':'cz',Denmark:'dk','DR Congo':'cd',Ecuador:'ec',Egypt:'eg',England:'gb-eng',Finland:'fi',France:'fr',Germany:'de',Ghana:'gh',Ireland:'ie',Italy:'it','Ivory Coast':'ci',Japan:'jp',Liberia:'lr',Mexico:'mx',Montenegro:'me',Morocco:'ma',Netherlands:'nl',Nigeria:'ng','North Macedonia':'mk',Norway:'no',Paraguay:'py',Peru:'pe',Poland:'pl',Portugal:'pt','Republic of Ireland':'ie',Romania:'ro',Russia:'ru',Scotland:'gb-sct',Senegal:'sn',Serbia:'rs',Slovenia:'si','South Korea':'kr',Spain:'es',Sweden:'se',Switzerland:'ch','Trinidad and Tobago':'tt',Turkey:'tr',Ukraine:'ua','United States':'us',Uruguay:'uy',Venezuela:'ve',Wales:'gb-wls','Bosnia and Herzegovina':'ba'});
const ALIASES=Object.freeze({'cote d ivoire':'Ivory Coast','czechia':'Czech Republic','republic of korea':'South Korea','usa':'United States','united states of america':'United States','democratic republic of the congo':'DR Congo','democratic republic of congo':'DR Congo','turkiye':'Turkey'});
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
const LOOKUP=new Map(Object.entries(COUNTRIES).map(([name,code])=>[normalize(name),{name,code}]));
function resolve(playerOrNationality){
 const raw=typeof playerOrNationality==='string'?playerOrNationality:(playerOrNationality?.country||playerOrNationality?.nationality||'');
 // Roster explicitly records legacy Yugoslavia / modern national identity. Use its explicit suffix.
 const selected=String(raw).startsWith('Yugoslavia / ')?String(raw).split(' / ').at(-1):raw;
 const key=normalize(selected),entry=LOOKUP.get(key)||LOOKUP.get(normalize(ALIASES[key]));
 return entry?Object.freeze({...entry,rosterNationality:String(raw),asset:'assets/flags/'+entry.code+'.svg'}):null;
}
return Object.freeze({COUNTRIES,resolve});
});
