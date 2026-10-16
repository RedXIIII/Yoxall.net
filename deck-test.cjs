const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync(__dirname + '/assets/deck-visualizer.js', 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function target() {
  const values = {}, events = {};
  return {hidden: false, dataset: {}, events, attrs: {}, style: {setProperty(key,value) {values[key] = value;}, values},
    addEventListener(event,fn) {(events[event] ||= []).push(fn);},
    emit(event) {for (const fn of events[event] || []) fn();},
    setAttribute(key,value) {this.attrs[key] = value;}};
}
function fixture({reduced = false, supported = true, resumeFails = false, analyserFails = false, canvasMissing = false} = {}) {
  const names = ['release-audio','signal-canvas','deck-visuals','visual-toggle','visual-state','meter-sub','meter-mid','meter-high'];
  const n = Object.fromEntries(names.map(id => [id,target()]));
  const a = n['release-audio']; Object.assign(a,{paused:true,ended:false,muted:false});
  a.pause = a.play = () => {throw Error('The visualizer changed playback');};
  const classes = new Set(), doc = target();
  Object.assign(doc,{hidden:false,getElementById:id=>n[id],body:{classList:{toggle(key,value) {value ? classes.add(key) : classes.delete(key);}}}});
  const queries = target(); queries.matches = reduced;
  const frames = new Map(); let serial = 0, bars = 0;
  const painting = {clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},setTransform(){},fillRect() {bars++;},createLinearGradient() {return {addColorStop(){}};}};
  n['signal-canvas'].getContext=()=>canvasMissing?null:painting;
  n['signal-canvas'].getBoundingClientRect=()=>({width:240,height:90});
  let intersection;
  class Intersection {constructor(fn){intersection=fn;}observe(){}}
  const contexts = []; let sources = 0, analysers = 0;
  class Context {
    constructor() {this.state='suspended'; this.sampleRate=48000; this.destination={type:'output'};this.connections=[];this.resumes=0;contexts.push(this);}
    async resume() {this.resumes++;if(resumeFails)throw Error('gesture unavailable');this.state='running';}
    createMediaElementSource(audio) {assert.equal(audio,a);sources++;return {connect:node=>this.connections.push(node)};}
    createAnalyser() {if(analyserFails)throw Error('unavailable');analysers++;return {frequencyBinCount:512,fftSize:1024,getByteFrequencyData(buffer){buffer.fill(180);},getByteTimeDomainData(buffer){buffer.fill(160);}};}
  }
  const win = target(); Object.assign(win,{devicePixelRatio:2,AudioContext:supported?Context:undefined});
  const navigator = {userActivation:{isActive:false}};
  const sandbox = {document:doc,window:win,navigator,matchMedia:()=>queries,requestAnimationFrame:fn=>{const id=++serial;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),Uint8Array,Promise,IntersectionObserver:Intersection};
  vm.runInNewContext(code,sandbox);
  return {n,a,doc,queries,classes,frames,contexts,navigator,api:sandbox.PlannerFMVisuals, get sources(){return sources;},get analysers(){return analysers;},get bars(){return bars;},visible(value){intersection([{isIntersecting:value}]);},frame(time=100){const saved=[...frames.values()];frames.clear();saved.forEach(fn=>fn(time));}};
}
(async()=>{
  const f=fixture();assert.equal(f.contexts.length,0);assert.equal(f.frames.size,0);
  f.api.unlock();assert.equal(f.contexts.length,0); // No graph or blocked context before a gesture.
  f.navigator.userActivation.isActive=true;f.api.unlock();await tick();
  assert.equal(f.sources,1);assert.equal(f.analysers,1);
  assert.equal(f.contexts[0].connections.filter(n=>n===f.contexts[0].destination).length,1);
  f.a.paused=false;f.a.emit('playing');f.frame();
  assert.equal(f.n['signal-canvas'].dataset.signal,'live');assert(f.bars>0);
  assert(Number(f.n['meter-sub'].style.values['--level'])>0);
  f.a.paused=true;f.a.emit('pause');assert.equal(f.frames.size,0);assert.equal(f.n['meter-sub'].style.values['--level'],'0');
  f.a.paused=false;f.a.emit('playing');f.frame(200);assert.equal(f.sources,1);assert.equal(f.contexts.length,1);
  f.n['visual-toggle'].emit('click');assert.equal(f.n['visual-toggle'].attrs['aria-pressed'],'false');assert.equal(f.frames.size,0);assert.equal(f.a.paused,false);assert(f.classes.has('visuals-off'));
  f.n['visual-toggle'].emit('click');assert.equal(f.n['visual-toggle'].attrs['aria-pressed'],'true');assert.equal(f.sources,1);f.frame(300);
  f.a.muted=true;f.a.emit('volumechange');assert.equal(f.frames.size,0);assert.equal(f.n['visual-state'].textContent,'SOUND OFF');
  f.a.muted=false;f.a.emit('volumechange');assert.equal(f.frames.size,1);
  f.visible(false);assert.equal(f.frames.size,0);f.visible(true);assert.equal(f.frames.size,1);
  f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.frames.size,0);
  f.doc.hidden=false;f.doc.emit('visibilitychange');assert.equal(f.frames.size,1);
  f.queries.matches=true;f.queries.emit('change');assert.equal(f.frames.size,0);assert(f.classes.has('visuals-off'));
  const low=fixture({reduced:true});low.a.paused=false;low.a.emit('playing');assert.equal(low.contexts.length,0);assert.equal(low.frames.size,0);assert.equal(low.n['visual-toggle'].attrs['aria-pressed'],'false');
  const old=fixture({supported:false});old.a.paused=false;old.a.emit('playing');assert.equal(old.n['visual-state'].textContent,'VINYL ONLY');assert.equal(old.frames.size,0);
  const blocked=fixture({resumeFails:true});blocked.navigator.userActivation.isActive=true;blocked.api.unlock();await tick();assert.equal(blocked.sources,0);assert.equal(blocked.frames.size,0);
  const broken=fixture({analyserFails:true});broken.navigator.userActivation.isActive=true;broken.api.unlock();await tick();assert.equal(broken.sources,1);assert.equal(broken.contexts[0].connections[0],broken.contexts[0].destination);assert.equal(broken.frames.size,0);
  const noCanvas=fixture({canvasMissing:true});assert.equal(noCanvas.n['visual-toggle'].hidden,true);assert.equal(noCanvas.contexts.length,0);
  console.log('PASS: real frequency and waveform data drives drawing/meters; no graph before activation; one source and direct audio output across tracks; pause/mute/hidden/off stop frames; reduced-motion default; unsupported canvas/Web Audio, blocked resume and analyser failure retain playback.');
})().catch(error=>{console.error(error);process.exitCode=1;});
