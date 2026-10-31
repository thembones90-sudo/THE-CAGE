// THE CAGE V1.4: editorial refinement to unapproved career classifications only.
(()=>{'use strict';
const changes={"wayne-rooney":{"careerTier":"TITAN","reason":"Manchester United record scoring, five league titles and sustained elite all-round impact"},"alessandro-del-piero":{"careerTier":"LEGEND","reason":"An iconic Juventus talisman and World Cup winner but on the stringent TITAN/LEGEND boundary"},"yannick-bolasie":{"careerTier":"STALWART","reason":"Sustained top-flight career; ACE undervalues his established Premier League stature"},"yaya-toure":{"removeFolklore":["STREET HERO"],"badgeReason":"Physical and technical dominance are already fully represented by ratings and traits; no singular street-legend identity required."},"michael-owen":{"removeFolklore":["STREET HERO"],"badgeReason":"High-level scoring brilliance and Ballon d'Or recognition alone do not automatically qualify for STREET HERO."},"sergio-ramos":{"removeFolklore":["STREET HERO"],"badgeReason":"His confrontational persona is represented by STREET VILLAIN; not enough separate street-skill identity."},"trent-alexander-arnold":{"removeFolklore":["STREET HERO"],"badgeReason":"World-class passing delivery does not on its own make a street-cult footballer."}};
const map=new Map(window.THE_CAGE_PLAYERS.map(p=>[p.id,p]));
for(const [id,c] of Object.entries(changes)){
 const p=map.get(id);if(!p||p.classificationStatus!=='editorial-reviewed-v1.3')throw Error('Refusing to revise owner-approved player '+id);
 if(c.careerTier)p.careerTier=c.careerTier;
 for(const badge of c.removeFolklore||[]){if(!p.folklore.includes(badge))throw Error('Missing folklore badge '+id);p.folklore=p.folklore.filter(b=>b!==badge);}
 p.classificationStatus='editorial-refined-v1.4';
}
window.CAGE_ROSTER_VERSION='editorial-v1.4-178';
})();
