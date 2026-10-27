#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync,cpSync,existsSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {VIDEO_TYPES,frameCount,inspectTimeline} from '../assets/template/scripts/story.mjs';

const skill=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const template=path.join(skill,'assets/template');
export const dimensions={square:[1080,1080],landscape:[1920,1080],portrait:[1080,1350]};
const names=['hook','reveal','proof','payoff','outro'];
const copyKeys=['hook','reveal','proof','payoff','cta','context','detail','leftLabel','gatewayLabel','rightLabel','acceptedLabel','rejectedLabel'];
const html=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=value=>{try{const parsed=new URL(value);return parsed.protocol==='https:'&&!parsed.username&&!parsed.password&&!['example.com','www.example.com'].includes(parsed.hostname);}catch{return false;}};
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
function ensure(ok,message){if(!ok)throw new Error(message);}
export function planScenes(b,base){
  const total=frameCount(b.duration);
  ensure(VIDEO_TYPES.includes(b.videoType),'videoType must be announcement, feature, tutorial or demo');
  if(b.scenes!==undefined){
    ensure(Array.isArray(b.scenes)&&b.scenes.length>0,'scenes must contain authored scene files');
    let start=0;const ids=new Set();
    const scenes=b.scenes.map((s,i)=>{
      ensure(/^[a-z][a-z0-9-]*$/.test(s.id??'')&&!['main','root','music'].includes(s.id)&&!ids.has(s.id),'scene ids must be unique, lowercase and distinct from main/root/music');
      ids.add(s.id);
      const frames=frameCount(s.duration,`scenes[${i}].duration`);
      ensure(nonempty(s.title)&&nonempty(s.action)&&nonempty(s.file),'each authored scene needs title, action and file');
      const file=path.resolve(base,s.file);
      ensure(path.extname(file)==='.html'&&existsSync(file)&&statSync(file).isFile(),'authored scene file must be an existing HTML file');
      const scene={...s,file,start:start/30,duration:frames/30};start+=frames;return scene;
    });
    inspectTimeline({duration:b.duration,scenes});
    ensure(scenes.at(-1).duration>=2.6,'reserve at least 2.6 seconds for the final CTA scene');
    return {kind:'authored',scenes};
  }
  ensure(b.videoType==='feature'&&b.product!=='aisix'&&b.duration>=15&&b.duration<=45,
    'Provide authored scenes for this type/length. The bundled five-beat traffic starter is only for 15–45-second APISIX/API7 feature explainers.');
  const frames=[Math.round(total*.15),Math.round(total*.15),0,Math.round(total*.2),Math.max(78,Math.round(total*.15))];
  frames[2]=total-frames.reduce((a,v)=>a+v,0);
  let start=0;
  const actions=['Requests increase','Gateway enters flow','Allowed path and rejected path separate','Controlled flow','Official mark and single CTA'];
  return {kind:'flow',scenes:names.map((id,i)=>{
    const scene={id,start:start/30,duration:frames[i]/30,title:b.copy?.[id==='outro'?'cta':id],action:actions[i]};start+=frames[i];return scene;
  })};
}
function mediaFiles(b,base){
  ensure(b.media===undefined||Array.isArray(b.media),'media must be an array');
  const used=new Set();
  return (b.media||[]).map(m=>{
    ensure(nonempty(m.path)&&/^assets\/media\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(m.path)&&!m.path.split('/').some(p=>!p||p==='.'||p==='..')&&!used.has(m.path),'media.path must be unique and stay under assets/media/');
    used.add(m.path);
    ensure(nonempty(m.file)&&nonempty(m.source)&&nonempty(m.rights),'media needs local file, source and rights records');
    const file=path.resolve(base,m.file);
    ensure(existsSync(file)&&statSync(file).isFile()&&statSync(file).size>0,'media file must exist and be nonempty');
    return {...m,file};
  });
}
export function validateBrief(b,base){
  ensure(['apisix','api7','aisix'].includes(b.product),'product must be apisix, api7 or aisix');
  ensure(Object.hasOwn(dimensions,b.aspect),'aspect must be square, landscape or portrait (4:5)');
  const plan=planScenes(b,base);
  ensure(nonempty(b.topic)&&/^[a-z]{2}(?:-[A-Za-z]{2})?$/.test(b.language??''),'topic and a language code are required');
  for(const k of plan.kind==='flow'?copyKeys:['cta'])ensure(nonempty(b.copy?.[k]),`copy.${k} is required`);
  mediaFiles(b,base);
  ensure(url(b.ctaUrl)&&nonempty(b.displayUrl),'a real HTTPS CTA and displayUrl are required');
  ensure(nonempty(b.post),'post is required');
  if(b.language==='en'){
    const words=b.post.trim().split(/\s+/).length;
    ensure(words>=40&&words<=70,`English post must have 40–70 words (got ${words})`);
  }
  ensure(Array.isArray(b.sources)&&b.sources.length>0&&b.sources.every(s=>url(s.url)&&nonempty(s.claim)),'sources must map claims to real HTTPS references');
  if(b.music===null){
    ensure(plan.kind==='authored'&&typeof b.audioExpected==='boolean','without a music bed, authored briefs must explicitly set audioExpected for embedded narration/capture audio or silence');
    return null;
  }
  ensure(nonempty(b.music?.file)&&nonempty(b.music?.credit)&&url(b.music?.source)&&url(b.music?.licenseUrl),'supply authorized local music with real source, credit and license URL, or music:null for an authored film');
  ensure(!/replace with|placeholder/i.test(b.music.credit),'replace example music credits with actual attribution');
  const music=path.resolve(base,b.music.file);
  ensure(existsSync(music)&&statSync(music).isFile()&&statSync(music).size>0,'music file must exist and be nonempty');
  ensure(['.wav','.mp3','.m4a','.aac','.ogg','.flac'].includes(path.extname(music).toLowerCase()),'unsupported music extension');
  return music;
}
export function createProject(briefPath,outPath){
  const briefFile=path.resolve(briefPath),out=path.resolve(outPath);
  ensure(!existsSync(out),'output directory already exists; choose a new directory');
  const rel=path.relative(skill,out);
  ensure(rel.startsWith('..'+path.sep)||path.isAbsolute(rel),'output must be outside the installed skill directory');
  let sourceRoot=skill;
  while(path.dirname(sourceRoot)!==sourceRoot&&!existsSync(path.join(sourceRoot,'.git')))sourceRoot=path.dirname(sourceRoot);
  if(existsSync(path.join(sourceRoot,'.git'))){
    const inRepo=path.relative(sourceRoot,out);
    ensure(inRepo.startsWith('..'+path.sep)||path.isAbsolute(inRepo),'generated projects must stay outside the skill source repository');
  }
  const b=JSON.parse(readFileSync(briefFile,'utf8'));
  const base=path.dirname(briefFile),music=validateBrief(b,base),plan=planScenes(b,base),media=mediaFiles(b,base);
  const [width,height]=dimensions[b.aspect];
  const brand=b.product==='apisix'?{name:'Apache APISIX',file:'apisix.svg',accent:'#E83F3C'}:{name:b.product==='aisix'?'AISIX AI Gateway':'API7',file:'api7.webp',accent:b.product==='aisix'?'#E31836':'#E8433E'};
  const musicFile=music?'music'+path.extname(music).toLowerCase():null;
  const vars=Object.entries({...Object.fromEntries(plan.scenes.map(s=>[s.id,s.title])),...b.copy,displayUrl:b.displayUrl}).map(([id,value])=>({id,type:'string',label:id,default:value}));
  const tokens={WIDTH:width,HEIGHT:height,TOTAL:b.duration,ASPECT:b.aspect,LANGUAGE:b.language,TOPIC:html(b.topic),ACCENT:brand.accent,BRAND_FILE:brand.file,BRAND_NAME:html(brand.name),MUSIC_FILE:musicFile,DISPLAYURL:html(b.displayUrl),VARIABLES:html(JSON.stringify(vars))};
  for(const [k,v] of Object.entries(b.copy))tokens[k.toUpperCase()]=html(v);
  tokens.AUDIO=music?`<audio id="music" src="assets/audio/${musicFile}" data-start="0" data-duration="${b.duration}" data-volume="1" data-fade-in="0.25" data-fade-out="0.8"></audio>`:'';
  const replace=(source,extra={})=>source.replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>{
    ensure(Object.hasOwn(extra,key)||Object.hasOwn(tokens,key),`unknown template key ${key}`);
    return String(Object.hasOwn(extra,key)?extra[key]:tokens[key]);
  });
  const style=replace(readFileSync(plan.kind==='authored'?path.join(skill,'assets/approved-feed.css'):path.join(template,'scene.css'),'utf8'));
  const hookPackets=Array.from({length:20},(_,i)=>`<rect x="${16+(i%10)*82}" y="${i<10?100:174}" width="42" height="42" rx="8" fill="${i<7?'#171A20':brand.accent}"/>`).join('\n');
  const flowPackets=Array.from({length:4},(_,i)=>[
    `<rect id="proof-in-${i}" class="packet proof-allowed" x="174" y="158" width="24" height="24" rx="5" style="opacity:0"/>`,
    `<rect id="proof-out-${i}" class="packet" x="554" y="158" width="24" height="24" rx="5" style="opacity:0"/>`,
    `<rect id="proof-block-${i}" class="rejected proof-blocked" x="174" y="158" width="24" height="24" rx="5" style="opacity:0"/>`,
    `<rect id="proof-down-${i}" class="rejected" x="420" y="268" width="24" height="24" rx="5" style="opacity:0"/>`
  ].join('\n')).join('\n');
  // Prepare every rendered source before creating the output directory.
  const scenes=plan.scenes.map(s=>({...s,html:replace(readFileSync(plan.kind==='authored'?s.file:path.join(template,'compositions',s.id+'.html'),'utf8'),{STYLE:style,DURATION:s.duration,TITLE:html(s.title),HOOK_PACKETS:hookPackets,FLOW_PACKETS:flowPackets,PACKET_INTERVAL:(plan.scenes[2]?.duration-2)/3})}));
  tokens.SCENES=scenes.map(s=>`<div id="${s.id}" class="clip" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${s.start}" data-duration="${s.duration}" data-width="${width}" data-height="${height}" data-track-index="1" data-track-kind="graphics"></div>`).join('\n');
  const root=replace(readFileSync(path.join(template,'index.html'),'utf8'));
  mkdirSync(out,{recursive:true});
  for(const dir of ['compositions','assets/brand','assets/fonts','assets/vendor','assets/audio','scripts'])mkdirSync(path.join(out,dir),{recursive:true});
  for(const file of ['package.json','package-lock.json'])cpSync(path.join(template,file),path.join(out,file));
  cpSync(path.join(template,'scripts'),path.join(out,'scripts'),{recursive:true});
  for(const dir of ['brand','fonts','vendor'])cpSync(path.join(skill,'assets',dir),path.join(out,'assets',dir),{recursive:true});
  if(music)cpSync(music,path.join(out,'assets/audio',musicFile));
  for(const m of media){mkdirSync(path.dirname(path.join(out,m.path)),{recursive:true});cpSync(m.file,path.join(out,m.path));}
  writeFileSync(path.join(out,'index.html'),root);
  for(const s of scenes)writeFileSync(path.join(out,'compositions',s.id+'.html'),s.html);
  const content={...b,width,height,audioExpected:music?true:b.audioExpected,music:music?{...b.music,file:'assets/audio/'+musicFile}:null,media:media.map(({file,...m})=>m),scenes:scenes.map(({id,start,duration,title,action})=>({id,start,duration,title,action}))};
  writeFileSync(path.join(out,'content.json'),JSON.stringify(content,null,2)+'\n');
  const ledger=JSON.parse(readFileSync(path.join(skill,'assets/ledger.json'),'utf8'));
  if(music)ledger.push({path:'assets/audio/'+musicFile,...b.music,file:undefined,sha256:createHash('sha256').update(readFileSync(music)).digest('hex')});
  for(const {file,...m} of media)ledger.push({...m,sha256:createHash('sha256').update(readFileSync(file)).digest('hex')});
  writeFileSync(path.join(out,'assets/ledger.json'),JSON.stringify(ledger,null,2)+'\n');
  writeFileSync(path.join(out,'SOURCES.md'),`# Sources\n\n${b.sources.map(s=>`- ${s.url}\n  ${s.claim}`).join('\n')}\n\nCTA: ${b.ctaUrl}\n\n${plan.kind==='flow'?'The flow is illustrative, not recorded product output or a benchmark.':'Authored scenes: record which visuals are captures and which are illustrations; the scaffold does not verify live operation.'}\n`);
  const credit=music&&b.music.attributionRequired!==false?`\n\n## Required music credit\n\n${b.music.credit}`:'';
  writeFileSync(path.join(out,'PUBLISHING.md'),`# LinkedIn post\n\n${b.post}\n\n${b.copy.cta} → ${b.ctaUrl}${credit}\n`);
  const look=plan.kind==='authored'
    ? `STYLE DEFAULTS: approved feed profile; #FAF9FC ground, #181C20 ink, ${brand.accent} accent. AISIX may use the approved low-opacity #6D49FF/#FF4646 pools.\nTYPE DEFAULTS: local Inter400/700; hero96, heading64, body56, metadata40px at1080px short edge; keep roles consistent.\nMOTION: author the approved reveal/card/sweep/outline/zoom sequence when it serves the brief; preserve action speed, budget holds for the chosen duration. Record actual timings and any brief-specific overrides. No animation is generated by the style CSS.`
    : `LOOK: #F7F8FA ground, #171A20 ink, ${brand.accent} accent, Inter400/700.\nTYPE: traffic-layout draft; recheck role consistency and effective text size at360px.\nMOTION: 0.35–0.55s power4.out arrivals; linear request paths; landed titles hold.`;
  writeFileSync(path.join(out,'SPEC.md'),`# Film specification\n\nGOAL: ${b.topic}; one visible result and one next action.\nVIDEO TYPE: ${b.videoType}; ${plan.kind} scenes.\nOUTPUT: ${width}×${height}, 30 fps, target ${b.duration}s (${frameCount(b.duration)} frames).\n${look}\nSOUND: ${b.sound|| (plan.kind==='flow'?'Authorized instrumental music; no voiceover.':'See authored scene media and brief; no voice generation is implied.')}\nCOPY: short frames carry the main promise, support and setup; detailed constraints/accounting stay in technical notes unless needed to qualify the promise. One matching CTA in the video and post.\nCTA: ${b.copy.cta} — ${b.ctaUrl}\nBANNED: dark void, glass, rainbow effects, particle fields, fake dashboard, invented metrics, corner watermark.\nQA: every scene, cut boundary ±0.1s, main action strip and360px view.\n`);
  writeFileSync(path.join(out,'STORYBOARD.md'),`# Storyboard\n\nType: ${b.videoType}. Target: ${b.duration}s.\n\n| Time | Copy | Action |\n|---|---|---|\n${scenes.map(s=>`| ${s.start.toFixed(2)}–${(s.start+s.duration).toFixed(2)}s | ${s.title} | ${s.action} |`).join('\n')}\n`);
  writeFileSync(path.join(out,'hyperframes.json'),JSON.stringify({skill:'api7-promo-video'},null,2)+'\n');
  writeFileSync(path.join(out,'.gitignore'),'node_modules/\n.hyperframes/\nrenders/\ncover.png\n');
  return {output:out,width,height,duration:b.duration,scenes:scenes.length};
}
function main(){
  const args=process.argv.slice(2);
  if(args.includes('--help')){console.log('node create.mjs --brief brief.json --out NEW_DIRECTORY');return;}
  ensure(args.length===4&&args[0]==='--brief'&&args[2]==='--out','usage: node create.mjs --brief brief.json --out NEW_DIRECTORY');
  console.log(JSON.stringify(createProject(args[1],args[3]),null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))try{main();}catch(e){console.error('Scaffold stopped:',e.message);process.exitCode=1;}
