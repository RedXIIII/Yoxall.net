/* Validate editorial relationships and the public build, not narrative opinions. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=__dirname;
const records=JSON.parse(fs.readFileSync(path.join(root,'assets/story-records.json'),'utf8'));
const ids=new Set();
let claims=0,sources=0;
for(const story of records){
 assert.match(story.id,/^[a-z0-9-]+$/);assert(!ids.has(story.id),'duplicate story '+story.id);ids.add(story.id);
 for(const key of ['title','hook','theme','region','period'])assert.equal(typeof story[key],'string',story.id+' missing '+key);
 assert(story.opening.length>=2,story.id+' needs an opening');assert(story.chapters.length>=2,story.id+' needs a narrative');
 const sourceIds=new Set();
 for(const source of story.sources){assert(source.id&&source.label&&source.note,story.id+' source lacks context');assert(!sourceIds.has(source.id),story.id+' duplicate source');sourceIds.add(source.id);assert.equal(new URL(source.url).protocol,'https:');sources++;}
 assert(sourceIds.size>=3,story.id+' needs multiple sources');
 const paragraphs=[...story.opening,...story.chapters.flatMap(c=>c.paragraphs)];
 assert(paragraphs.join(' ').split(/\s+/).length>=250,story.id+' narrative is too short');
 for(const chapter of story.chapters){assert(chapter.title);assert(chapter.paragraphs.length);for(const sourceId of chapter.sourceIds||[])assert(sourceIds.has(sourceId),story.id+' unknown narrative source '+sourceId);}
 const evidence=story.evidence;
 assert(['documented','explained','open','mixed'].includes(evidence.verdictKey),story.id+' invalid verdict');
 assert(evidence.headline&&evidence.summary&&evidence.verdictLabel&&evidence.nextTest,story.id+' incomplete assessment');
 assert(evidence.claims.length>=4,story.id+' needs claim-level findings');
 for(const claim of evidence.claims){assert(claim.claim&&claim.finding);assert(['supported','unsupported','open','mixed'].includes(claim.status),story.id+' invalid claim status');assert(claim.sourceIds.length,story.id+' unsourced finding');for(const sourceId of claim.sourceIds)assert(sourceIds.has(sourceId),story.id+' unknown evidence source '+sourceId);claims++;}
 assert(evidence.remaining.length>=1,story.id+' needs remaining questions');
 const file=path.join(root,'stories',story.id+'.html');assert(fs.existsSync(file),story.id+' missing generated page');
 const html=fs.readFileSync(file,'utf8');
 assert(html.includes('https://yoxall.net/stories/'+story.id+'.html'),story.id+' missing canonical');
 assert(html.includes('<details'),story.id+' needs an accessible evidence reveal');
 const links=[...html.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);
 for(const anchor of links)assert(html.includes('id="'+anchor+'"'),story.id+' broken in-page link '+anchor);
 for(const paragraph of paragraphs)assert(!/[<>]/.test(paragraph),story.id+' unexpected markup in narrative');
}
assert.equal(records.length,12,'Unexpected launch collection size');
const index=fs.readFileSync(path.join(root,'stories.html'),'utf8');
for(const id of ids)assert(index.includes('/stories/'+id+'.html'),'Missing index story '+id);
console.log(JSON.stringify({stories:records.length,claims,sources,validated:'Source relationships, narrative completeness, assessments, canonical URLs and accessible evidence links'},null,2));
