// THE CAGE 2D viewer: coordinate frames. Pure, no DOM, no randomness, no clock.
// World cells: x 0..3 from Commander's goal (team 0 defends x=0) to the Opponent's goal; y 0..2 lanes.
// Normalised pitch: u 0..1 along x, v 0..1 along y. Pixels are only produced by toPixels().
(()=>{'use strict';
const COLS=4,ROWS=3,LANES={left:0,centre:1,right:2};
// Mirrors CageSpatial.world exactly: zone/from/to are in the acting (possessing) team's frame.
function world(zone,team){return {x:team===0?zone.x:3-zone.x,y:LANES[zone.lane]};}
// Which team's frame an event's zone is written in. press/foul/block are emitted by the
// defending team but their zone is the ball carrier's (possessing team's) zone.
const DEFENDER_EMITTED={press:1,foul:1,block:1};
function frameTeam(e){return DEFENDER_EMITTED[e.type]?1-e.team:e.team;}
function eventCell(e){return e&&e.zone&&Object.hasOwn(LANES,e.zone.lane)?world(e.zone,frameTeam(e)):null;}
function cellCenter(c){return {u:(c.x+.5)/COLS,v:(c.y+.5)/ROWS};}
// Cell-unit distance between two normalised points (x cells and y cells are different lengths).
function cellDist(a,b){return Math.hypot((a.u-b.u)*COLS,(a.v-b.v)*ROWS);}
// Goal mouth centre a team attacks. Team 0 attacks toward u=1.
function goalFor(team){return {u:team===0?1:0,v:.5};}
function attackDir(team){return team===0?1:-1;}
// Pitch rect inside a canvas, keeping the given aspect (length:width). DPR is applied by the caller's canvas size.
function fitPitch(w,h,aspect=1.8,pad=0.06){const pw=w*(1-2*pad),ph=h*(1-2*pad);let W=pw,H=pw/aspect;if(H>ph){H=ph;W=ph*aspect;}return {x:(w-W)/2,y:(h-H)/2,w:W,h:H};}
function toPixels(p,rect){return {x:rect.x+p.u*rect.w,y:rect.y+p.v*rect.h};}
function lerp(a,b,k){return {u:a.u+(b.u-a.u)*k,v:a.v+(b.v-a.v)*k};}
window.CageViewerCoords={COLS,ROWS,LANES,world,frameTeam,eventCell,cellCenter,cellDist,goalFor,attackDir,fitPitch,toPixels,lerp};
})();
