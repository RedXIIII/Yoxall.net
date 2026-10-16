const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(__dirname+'/assets/meme-dancer.js','utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function node(){return {hidden:true,attrs:{},dataset:{},events:{},addEventListener(event,fn){(this.events[event]||=[]).push(fn);},emit(event){for(const fn of this.events[event]||[])fn();},getAttribute(key){return this.attrs[key]||null;},setAttribute(key,value){this.attrs[key]=value;},focus(){this.focused=true;}};}
function fixture({reduced=false,visualsOff=false,mode='allowed'}={}){
 const names=['release-audio','dancer-video','meme-dancer','dancer-panel','dancer-hide','dancer-show','visual-toggle'];
 const n=Object.fromEntries(names.map(id=>[id,node()])),a=n['release-audio'],v=n['dancer-video'];
 Object.assign(a,{paused:true,ended:false,error:null});a.play=a.pause=()=>{throw Error('Meme altered music playback');};
 Object.assign(v,{paused:true,calls:0,pauses:0,pending:[],mode});v.dataset.src='/assets/planner-fm-dancer.mp4';
 v.pause=function(){this.pauses++;this.paused=true;};v.play=function(){this.calls++;if(this.mode==='blocked')return Promise.reject(Error('blocked'));if(this.mode==='deferred')return new Promise((resolve,reject)=>this.pending.push({resolve,reject}));this.paused=false;return Promise.resolve();};
 const doc=node();doc.hidden=false;doc.getElementById=id=>n[id];let off=visualsOff;doc.body={classList:{contains:()=>off}};
 const media=node();media.matches=reduced;
 const box={document:doc,matchMedia:()=>media,Promise};if(!reduced)box.PlannerFMVisuals={};
 vm.runInNewContext(code,box);
 return {n,a,v,doc,media,off(value){off=value;n['visual-toggle'].emit('click');}};
}
(async()=>{
 const f=fixture();assert.equal(f.v.calls,0);assert.equal(f.v.getAttribute('src'),null);assert.equal(f.n['meme-dancer'].hidden,true);
 f.a.paused=false;f.a.emit('playing');await tick();assert.equal(f.n['meme-dancer'].hidden,false);assert.equal(f.n['dancer-panel'].hidden,false);assert.equal(f.v.getAttribute('src'),'/assets/planner-fm-dancer.mp4');assert.equal(f.v.muted,true);assert.equal(f.v.volume,0);assert.equal(f.v.loop,true);assert.equal(f.v.playsInline,true);
 f.n['dancer-hide'].emit('click');assert.equal(f.v.paused,true);assert.equal(f.n['dancer-panel'].hidden,true);assert.equal(f.n['dancer-show'].hidden,false);assert.equal(f.a.paused,false);
 f.a.emit('playing');assert.equal(f.n['dancer-panel'].hidden,true); // Track changes respect dismissal.
 f.n['dancer-show'].emit('click');await tick();assert.equal(f.v.paused,false);assert.equal(f.n['dancer-panel'].hidden,false);
 f.a.emit('waiting');assert.equal(f.v.paused,true);assert.equal(f.n['meme-dancer'].hidden,true);f.a.emit('playing');await tick();assert.equal(f.v.paused,false);
 f.off(true);assert.equal(f.v.paused,true);assert.equal(f.n['meme-dancer'].hidden,true);f.off(false);await tick();assert.equal(f.v.paused,false);
 f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.v.paused,true);assert.equal(f.n['meme-dancer'].hidden,true);f.doc.hidden=false;f.doc.emit('visibilitychange');await tick();assert.equal(f.v.paused,false);
 f.a.paused=true;f.a.emit('pause');assert.equal(f.v.paused,true);assert.equal(f.n['meme-dancer'].hidden,true);
 const low=fixture({reduced:true});low.a.paused=false;low.a.emit('playing');assert.equal(low.v.calls,0);
 const blocked=fixture({mode:'blocked'});blocked.a.paused=false;blocked.a.emit('playing');await tick();assert.equal(blocked.n['dancer-show'].hidden,false);assert.equal(blocked.n['dancer-panel'].hidden,true);assert.equal(blocked.a.paused,false);
 const race=fixture({mode:'deferred'});race.a.paused=false;race.a.emit('playing');race.a.paused=true;race.a.emit('pause');race.v.pending[0].reject(Error('interrupted'));await tick();assert.equal(race.n['meme-dancer'].hidden,true);assert.equal(race.v.paused,true);
 const broken=fixture();broken.a.paused=false;broken.a.emit('playing');broken.v.emit('error');assert.equal(broken.n['meme-dancer'].hidden,true);assert.equal(broken.a.paused,false);
 console.log('PASS: dancer loads only with actual music; silent looping playback; pause, buffering, hidden tabs, visuals-off and reduced motion stop it; hide/show survives track changes; blocked playback, video errors and stale promises never alter music.');
})().catch(error=>{console.error(error);process.exitCode=1;});
