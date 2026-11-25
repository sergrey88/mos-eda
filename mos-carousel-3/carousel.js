import {sampleOrbit,entrance,spinAt,entryStartAngle} from './orbit.js';
import {DragMotion,screenLayout} from './motion.js';
import {FishFocus} from './fish-focus.js';
const hero=document.querySelector('.hero');
const motion=new DragMotion();
let scale=1,height=840,pointerId=null,lastClientX=0,ready=false,autoRotation=0,startAngle=-180;
const cards=[...document.querySelectorAll('.card-product')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const overlaps=cards.map(card=>{
 const copy=card.cloneNode(true);copy.className='card-overlap';card.after(copy);return copy;
});
const fishAnchor=[...document.querySelectorAll('.anchor-nav-item')].find(e=>e.textContent.trim()==='Рыбные рынки');
const fishFocus=new FishFocus();
let fishPointer=false,fishKeyboard=false,videoPending=false,videoGeneration=0;
const fishVideos=[cards[5],overlaps[5]].map(card=>{
 card.dataset.fishCard='';
 const video=document.createElement('video');
 video.src='assets/video/fish.mp4';video.muted=true;video.defaultMuted=true;
 video.loop=true;video.playsInline=true;video.preload='metadata';
 video.setAttribute('aria-hidden','true');card.append(video);return video;
});
let elapsed=reduced.matches?4.2:0,lastFrame=null;
function fishRequested(){return fishPointer||fishKeyboard;}
function beginFishFocus(){
 release();motion.velocity=0;
 fishFocus.enter(autoRotation+motion.rotation,reduced.matches);
}
function stopFishVideo(reset=true){
 videoGeneration++;videoPending=false;hero.classList.remove('is-fish-playing');
 for(const video of fishVideos){video.pause();if(reset&&video.readyState>0)video.currentTime=0;}
}
async function playFishVideo(){
 if(videoPending||document.hidden)return;
 videoPending=true;const generation=++videoGeneration;
 try{
  fishVideos[1].currentTime=fishVideos[0].currentTime;
  await Promise.all(fishVideos.map(video=>video.play()));
  if(generation!==videoGeneration)return;
  if(fishRequested()&&fishFocus.active&&!document.hidden)hero.classList.add('is-fish-playing');
  else stopFishVideo();
 }catch{
  if(generation===videoGeneration){stopFishVideo(false);videoPending=true;}
  // Keep the original photo visible if playback is unavailable.
 }
}
function updateFishFocus(){
 if(!fishRequested()){fishFocus.leave();stopFishVideo();}
 else if(ready&&elapsed>=4.2&&!fishFocus.active)beginFishFocus();
}
fishAnchor.addEventListener('pointerenter',()=>{fishPointer=true;updateFishFocus();});
fishAnchor.addEventListener('pointerleave',()=>{fishPointer=false;updateFishFocus();});
fishAnchor.addEventListener('focus',()=>{fishKeyboard=fishAnchor.matches(':focus-visible');updateFishFocus();});
fishAnchor.addEventListener('blur',()=>{fishKeyboard=false;updateFishFocus();});
function resize(){
 const layout=screenLayout(innerWidth,innerHeight);
 scale=layout.scale;height=layout.height;
 document.documentElement.style.setProperty('--board-left',`${layout.left}px`);
 if(!ready)startAngle=entryStartAngle(Math.min(height,(innerHeight-64)/scale));
 document.documentElement.style.setProperty('--hero-height',`${height}px`);
 document.documentElement.style.setProperty('--board-height',`${height}px`);
 document.documentElement.style.setProperty('--scale',scale);
 if(motion.dragging)motion.lastX=lastClientX/scale;
 document.body.style.minHeight=`${layout.pageHeight}px`;
}
resize();addEventListener('resize',resize);
function render(){
 const rotation=autoRotation+motion.rotation;
 cards.forEach((card,i)=>{
  const entry=reduced.matches?{opacity:1,rotation:0}:entrance(elapsed,i,startAngle);
  const p=sampleOrbit(i,rotation+entry.rotation);
  card.style.width=`${p.w}px`;card.style.height=`${p.h}px`;
  card.style.transform=`translate3d(${p.x-p.w/2}px,${p.y-p.h/2}px,0) rotate(${p.angle}deg)`;
  card.style.opacity=entry.opacity;
  card.style.visibility=entry.opacity>0?'visible':'hidden';
  overlaps[i].style.cssText=card.style.cssText;
  const angle=p.angle*Math.PI/180;
  const top=p.y-(Math.abs(Math.sin(angle))*p.w+Math.abs(Math.cos(angle))*p.h)/2;
  // Reveal supporting content when the first photo actually enters the viewport.
  if(reduced.matches||(entry.opacity>.01&&top<Math.min(height,(innerHeight-64)/scale)))document.body.classList.add('is-cards-visible');
 });
}
function frame(time){
 if(!document.hidden){
  const dt=lastFrame===null?0:Math.max(0,(time-lastFrame)/1000);
  const previous=elapsed;elapsed+=dt;
  if(fishRequested()&&elapsed>=4.2&&!fishFocus.active)beginFishFocus();
  if(fishFocus.active){
   fishFocus.tick(dt);autoRotation=fishFocus.rotation-motion.rotation;
   if(fishFocus.settled&&!videoPending)playFishVideo();
   if(hero.classList.contains('is-fish-playing')&&Math.abs(fishVideos[1].currentTime-fishVideos[0].currentTime)>.05)fishVideos[1].currentTime=fishVideos[0].currentTime;
  }else{
   if(!reduced.matches&&!motion.dragging)autoRotation+=spinAt(elapsed)-spinAt(previous);
   motion.tick(dt);
  }
  lastFrame=time;render();
  if(elapsed>=4.2)document.body.classList.add('is-settled');
 }else lastFrame=null;
 requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{
 lastFrame=null;document.body.classList.toggle('is-paused',document.hidden);
 if(document.hidden){release();motion.velocity=0;stopFishVideo(false);}
});
reduced.addEventListener('change',()=>{
 release();motion.velocity=0;
 elapsed=Math.max(elapsed,4.2);lastFrame=null;
 document.body.classList.toggle('is-reduced',reduced.matches);
 document.body.classList.add('is-settled');
 if(fishFocus.active)fishFocus.enter(autoRotation+motion.rotation,reduced.matches);
 render();
});
function release(event){
 if(event&&event.pointerId!==pointerId)return;
 const captured=pointerId;pointerId=null;motion.end(event?.timeStamp);hero.classList.remove('is-dragging');
 if(captured!==null&&hero.hasPointerCapture(captured))hero.releasePointerCapture(captured);
}
hero.addEventListener('pointerdown',event=>{
 if(fishFocus.active||!ready||(!reduced.matches&&elapsed<4.2)||event.button!==0||pointerId!==null||event.target.closest('button,a,.intro'))return;
 pointerId=event.pointerId;lastClientX=event.clientX;motion.begin(event.clientX/scale,event.timeStamp);
 hero.setPointerCapture(pointerId);hero.classList.add('is-dragging');
});
hero.addEventListener('pointermove',event=>{if(event.pointerId===pointerId){lastClientX=event.clientX;motion.move(event.clientX/scale,event.timeStamp);}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])hero.addEventListener(event,release);
hero.addEventListener('dragstart',event=>event.preventDefault());
hero.addEventListener('keydown',event=>{
 if(fishFocus.active||event.target!==hero||!ready||(!reduced.matches&&elapsed<4.2)||!['ArrowLeft','ArrowRight'].includes(event.key))return;
 event.preventDefault();motion.rotation+=event.key==='ArrowRight'?12:-12;motion.velocity=0;render();
});
async function init(){
 const results=await Promise.allSettled([
  document.fonts.load('600 356px "Roboto Flex"'),
  document.fonts.load('400 16px "Geologica"'),
  document.fonts.load('400 16px "Golos Text"'),
  ...[...document.images].map(img=>img.decode()),
 ]);
 if(results.some(r=>r.status==='rejected')){
  const error=document.querySelector('.error');error.hidden=false;
  error.textContent='Часть ресурсов не загрузилась. Проверь папку assets.';
 }
 document.body.classList.toggle('is-reduced',reduced.matches);
 document.body.classList.toggle('is-paused',document.hidden);
 ready=true;document.body.classList.add('is-ready');render();requestAnimationFrame(frame);
}
init();

