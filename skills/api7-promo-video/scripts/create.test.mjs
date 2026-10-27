import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createProject,validateBrief,dimensions} from './create.mjs';
import {contactFrames} from '../assets/template/scripts/render.mjs';
import {loadContent} from '../assets/template/scripts/verify.mjs';

const skill=join(dirname(fileURLToPath(import.meta.url)),'..');
function fixture(){
  const dir=mkdtempSync(join(tmpdir(),'api7-promo-scaffold-test-'));
  const brief=JSON.parse(readFileSync(join(skill,'assets/template/brief.example.json'),'utf8'));
  writeFileSync(join(dir,'music.wav'),Buffer.from('test media bytes: no rendering in this fixture'));
  brief.music={file:'music.wav',source:'https://incompetech.com/music/',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',credit:'Fixture license record; no production audio.'};
  const file=join(dir,'brief.json');
  return {dir,brief,file,save(){writeFileSync(file,JSON.stringify(brief));}};
}
test('each supported aspect produces a local editable project with matching canvas and self-contained assets',()=>{
  const f=fixture();
  for(const [aspect,[width,height]] of Object.entries(dimensions)){
    f.brief.aspect=aspect;f.save();const out=join(f.dir,aspect);
    createProject(f.file,out);
    const content=JSON.parse(readFileSync(join(out,'content.json'),'utf8'));
    assert.deepEqual([content.width,content.height],[width,height]);
    assert.match(readFileSync(join(out,'index.html'),'utf8'),new RegExp(`data-width="${width}"`));
    assert.ok(existsSync(join(out,'assets/audio/music.wav')));
    assert.ok(existsSync(join(out,'assets/fonts/Inter-700.woff2')));
    assert.equal(content.scenes.reduce((sum,s)=>sum+s.duration,0),content.duration);
    assert.equal(JSON.parse(readFileSync(join(out,'package.json'),'utf8')).devDependencies.hyperframes,'0.8.200');
  }
});
test('creative copy is HTML-escaped without changing original brief content',()=>{
  const f=fixture();f.brief.copy.hook='Traffic <spikes> & "surges"';f.save();
  const out=join(f.dir,'escaped');createProject(f.file,out);
  const source=readFileSync(join(out,'compositions/hook.html'),'utf8');
  assert.ok(source.includes('Traffic &lt;spikes&gt; &amp; &quot;surges&quot;'));
  assert.ok(!source.includes('Traffic <spikes>'));
  assert.equal(JSON.parse(readFileSync(f.file,'utf8')).copy.hook,f.brief.copy.hook);
});
test('an existing project is preserved instead of overwritten',()=>{
  const f=fixture();f.save();const out=join(f.dir,'existing');createProject(f.file,out);
  const file=join(out,'index.html');writeFileSync(file,'user edits');
  assert.throws(()=>createProject(f.file,out),/already exists/);
  assert.equal(readFileSync(file,'utf8'),'user edits');
});
test('example music metadata and missing media cannot create an apparently valid delivery',()=>{
  const f=fixture();f.brief.music.source='https://example.com/track';f.save();
  const out=join(f.dir,'invalid');assert.throws(()=>createProject(f.file,out),/real source/);assert.equal(existsSync(out),false);
  f.brief.music.source='https://incompetech.com/music/';f.brief.music.file='absent.wav';
  assert.throws(()=>validateBrief(f.brief,f.dir),/must exist/);
});
test('the shortest supported film still leaves two seconds after CTA arrival',()=>{
  const f=fixture();f.brief.duration=15;f.save();const out=join(f.dir,'short');createProject(f.file,out);
  const c=JSON.parse(readFileSync(join(out,'content.json'),'utf8'));
  assert.ok(c.scenes.at(-1).duration-0.55>=2);
  assert.ok(Math.abs(c.scenes.reduce((sum,s)=>sum+s.duration,0)-15)<1e-9);
  const sampled=contactFrames(c);
  for(const s of c.scenes.slice(1)){
    const cut=Math.round(s.start*30);
    assert.ok(sampled.includes(cut-1)&&sampled.includes(cut+1),'decoded review must cover each actual generated cut');
  }
});
test('sample projects cannot be written into the skill source repository',()=>{
  const f=fixture();f.save();assert.throws(()=>createProject(f.file,join(skill,'forbidden-generated-project')),/outside/);
});

function authored(f,videoType,durations){
  f.brief.videoType=videoType;f.brief.duration=durations.reduce((a,b)=>a+b,0);
  f.brief.scenes=durations.map((duration,i)=>{
    const id=`step-${i+1}`,file=`${id}.html`;
    writeFileSync(join(f.dir,file),`<template><style>{{STYLE}}</style><div id="root" data-composition-id="${id}" data-width="{{WIDTH}}" data-height="{{HEIGHT}}"><h1>{{TITLE}}</h1></div><script>const tl=gsap.timeline({paused:true});window.__timelines['${id}']=tl;</script></template>`);
    return {id,duration,file,title:`Step ${i+1}`,action:`Show the verified action for step ${i+1}`};
  });
}

test('explicit durations support short announcements and long tutorials/demos with their authored scene counts',()=>{
  for(const [type,durations] of [
    ['announcement',[2,3,3]],['feature',[5,12,30,23,5]],
    ['tutorial',[12,18,40,40,35,30,5]],['demo',[8,24,45,8,5]],
  ]){
    const f=fixture();authored(f,type,durations);f.save();
    const out=join(f.dir,'authored');createProject(f.file,out);
    const c=loadContent(out);
    assert.equal(c.duration,f.brief.duration);assert.equal(c.videoType,type);
    assert.equal(c.scenes.length,durations.length);
    assert.deepEqual(c.scenes.map(s=>s.duration),durations);
    assert.equal(c.scenes.at(-1).start+c.scenes.at(-1).duration,c.duration);
    for(const scene of c.scenes.slice(1)){
      const cut=Math.round(scene.start*30);const frames=contactFrames(c);
      assert.ok(frames.includes(cut-1)&&frames.includes(cut+1));
    }
  }
});

test('missing duration, inconsistent budgets and missing authored scenes stop before output creation',()=>{
  const f=fixture(),out=join(f.dir,'invalid-duration');
  delete f.brief.duration;f.save();assert.throws(()=>createProject(f.file,out),/duration.*explicitly/);
  assert.equal(existsSync(out),false);
  f.brief.duration=180;f.brief.videoType='tutorial';f.save();
  assert.throws(()=>createProject(f.file,out),/authored scenes/);
  authored(f,'tutorial',[20,25,5]);f.brief.duration=180;f.save();
  assert.throws(()=>createProject(f.file,out),/target exactly/);
  assert.equal(existsSync(out),false);
});

test('authored AISIX media is copied with provenance and no implicit music or voice generation',()=>{
  const f=fixture();authored(f,'demo',[4,8,3]);f.brief.product='aisix';
  f.brief.music=null;f.brief.audioExpected=true;
  const bytes=Buffer.from('permitted source fixture; no render');writeFileSync(join(f.dir,'voice.wav'),bytes);
  f.brief.media=[{file:'voice.wav',path:'assets/media/voice.wav',source:'User-supplied test recording',rights:'Test fixture only'}];f.save();
  const out=join(f.dir,'with-voice');createProject(f.file,out);
  assert.deepEqual(readFileSync(join(out,'assets/media/voice.wav')),bytes);
  const c=loadContent(out);assert.equal(c.product,'aisix');assert.equal(c.audioExpected,true);assert.equal(c.music,null);
  assert.ok(!readFileSync(join(out,'index.html'),'utf8').includes('id="music"'));
  assert.equal(JSON.parse(readFileSync(join(out,'assets/ledger.json'),'utf8')).at(-1).rights,'Test fixture only');
  assert.ok(!JSON.stringify(c).includes(f.dir),'generated metadata should not contain source-machine paths');
  f.brief.media[0].path='assets/media/../../index.html';
  assert.throws(()=>validateBrief(f.brief,f.dir),/stay under assets\/media/);
});


test('authored output carries the reusable Inter profile and leaves the legacy flow layout intact',()=>{
  const f=fixture();authored(f,'announcement',[3,7,5]);f.brief.product='aisix';f.save();
  const out=join(f.dir,'profile');createProject(f.file,out);
  const scene=readFileSync(join(out,'compositions/step-1.html'),'utf8');
  assert.ok(scene.includes('--type-hero:96px')&&scene.includes('--type-body:56px'));
  assert.ok(scene.includes('--accent:#E31836'));
  assert.ok(!scene.includes('{{STYLE}}'));
  const flow=fixture();flow.save();const old=join(flow.dir,'flow');createProject(flow.file,old);
  assert.ok(readFileSync(join(old,'compositions/proof.html'),'utf8').includes('.proof-title'));
});

test('no-attribution music keeps provenance internally and omits public credit only with an explicit license record',()=>{
  for(const required of [false,true,undefined]){
    const f=fixture();f.brief.music.attributionRequired=required;f.save();
    const out=join(f.dir,'rights');createProject(f.file,out);
    const post=readFileSync(join(out,'PUBLISHING.md'),'utf8');
    assert.equal(post.includes(f.brief.music.credit),required!==false);
    const track=JSON.parse(readFileSync(join(out,'assets/ledger.json'),'utf8')).at(-1);
    assert.equal(track.credit,f.brief.music.credit);assert.equal(track.licenseUrl,f.brief.music.licenseUrl);
    assert.equal(post.split(f.brief.ctaUrl).length-1,1);
  }
});
