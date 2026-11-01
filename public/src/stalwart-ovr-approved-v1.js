(()=>{'use strict';
const records=[{"id":"adel-taarabt","target":83,"changes":{"pass":[86,77],"composure":[78,69]}},{"id":"mario-balotelli","target":85,"changes":{"finish":[91,87]}},{"id":"nani","target":87,"changes":{"pass":[80,82]}},{"id":"obafemi-martins","target":84,"changes":{"finish":[87,82]}},{"id":"hatem-ben-arfa","target":85,"changes":{"pass":[76,71]}},{"id":"papiss-cisse","target":83,"changes":{"finish":[94,87]}},{"id":"alberto-luque","target":84,"changes":{"finish":[87,83]}},{"id":"yannick-bolasie","target":81,"changes":{"pass":[71,64],"composure":[81,80]}},{"id":"denilson","target":83,"changes":{}},{"id":"peter-crouch","target":84,"changes":{"finish":[86,88]}},{"id":"steed-malbranque","target":82,"changes":{}},{"id":"tijjani-babangida","target":81,"changes":{"finish":[79,75]}},{"id":"nene","target":84,"changes":{"pass":[86,94],"vision":[88,93]}},{"id":"tugay-kerimoglu","target":83,"changes":{"def":[65,69],"vision":[89,94],"composure":[79,90]}},{"id":"aiden-mcgeady","target":81,"changes":{"pass":[75,78]}},{"id":"morten-gamst-pedersen","target":82,"changes":{"first_touch":[82,87],"vision":[82,94],"composure":[78,88]}},{"id":"thomas-gravesen","target":81,"changes":{"pass":[74,77],"def":[82,94],"tackling":[82,89],"positioning":[78,80]}},{"id":"marouane-fellaini","target":84,"changes":{"def":[79,98],"stamina":[84,94],"tackling":[79,94],"positioning":[86,94]}}];
const players=window.THE_CAGE_PLAYERS,byId=new Map(players.map(p=>[p.id,p]));
const aliases={pass:"passing",finish:"finishing",phys:"physical"};
for(const row of records){
const p=byId.get(row.id);if(!p||(p.careerTier!=="STALWART"&&!(["nani","mario-balotelli","obafemi-martins","peter-crouch"].includes(row.id)&&p.careerTier==="ELITE")))throw Error("STALWART source missing "+row.id);
for(const [k,v] of Object.entries(row.changes)){if(p.r[k]!==v[0])throw Error("STALWART source mismatch "+row.id+" "+k);p.r[k]=v[1];if(aliases[k])p.r[aliases[k]]=v[1];}
p.ratingReviewStatus="owner-approved-stalwart-ovr-v1";
}
window.CAGE_STALWART_OVR_APPROVED=Object.freeze({targets:Object.freeze(Object.fromEntries(records.map(x=>[x.id,x.target]))),playerCount:18});
})();
