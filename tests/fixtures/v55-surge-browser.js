(()=>{
const out=document.createElement('pre');out.id='v55-surge-result';document.body.append(out);
const check=(x,m)=>{if(!x)throw Error(m)};
try{
const config={teams:[['paolo-maldini','nemanja-vidic','jaap-stam'],['alessandro-nesta','john-terry','fabio-cannavaro']],tactics:['press','possession'],seed:30001,mode:'ko'};
const result=window.CageEngine.simulate(config);
check(result.duration>1900,'fixture too short for tactical surge');
const record=window.CageRecords.make(config,result,1);
const anchor=document.createElement('div');anchor.id='surge-match-fixture';anchor.style.width='900px';document.body.append(anchor);
const viewer=window.CageViewer.mount(anchor,record,{speed:'full',mode:'replay',teamNames:['Press Test','Possession Test']});
const start=viewer.timeline.segments.find(x=>x.t0<150&&x.t1>100);
check(start,'no early segment');viewer.seek(start.tau0+0.03).render();
const signal=anchor.querySelector('[data-k=surge]');
check(signal&&signal.hidden,'surge visible before 1500 seconds');
const idx=result.events.findIndex(e=>e.t>=1600&&config.teams[0].filter(id=>e.calc?.commitment?.[id]===true).length===2);
check(idx>0,'no recorded tactical escalation after 1500 seconds');
viewer.seek(viewer.timeline.segments[idx].tau0+0.03).render();
check(!signal.hidden&&signal.textContent.includes('Press Test'),'actual surge not surfaced in viewer');
check(anchor.querySelector('[data-k=tactics]').textContent.includes('RECORDED TACTICS'),'initial tactical metadata absent');
viewer.seek(start.tau0+0.03).render();
check(signal.hidden,'surge badge not cleared after rewind');
check(window.CageRecords.reproduce(record).eventHash===result.eventHash,'view changed replay record');
out.textContent='V55_SURGE_VIEWER_PASS authentic late high-press commitment, rewind hides badge, correct recorded tactic labels, replay immutable';
viewer.destroy();
}catch(e){out.textContent='V55_SURGE_VIEWER_FAIL '+e.stack;}
})();
