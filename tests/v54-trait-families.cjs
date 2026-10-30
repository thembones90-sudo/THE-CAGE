'use strict';
const W=require('../tests/viewer/harness.cjs').loadEngine(),ps=W.THE_CAGE_PLAYERS;
const families={defense:['Wall','Enforcer','Anticipator','Tracker','Libero'],midfield:['Maestro','Architect','Destroyer','Engine','Surgeon'],attack:['Predator','Magician','Executioner','Phantom','Juggernaut']};
const family=x=>Object.keys(families).find(k=>families[k].includes(x));
const same=ps.filter(p=>family(p.traits.primary)===family(p.traits.secondary));
const count=Object.fromEntries(Object.keys(families).map(f=>[f,same.filter(p=>family(p.traits.primary)===f).length]));
console.log('V54_TRAIT_FAMILY_EDITORIAL_AUDIT '+JSON.stringify({roster:ps.length,sameFamily:same.length,crossFamily:ps.length-same.length,byFamily:count,examples:same.slice(0,12).map(p=>({name:p.name,primary:p.traits.primary,secondary:p.traits.secondary}))}));
