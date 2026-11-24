import {sampleOrbit,entrance,spinAt,entryStartAngle} from './orbit.js';
import {DragMotion,screenLayout} from './motion.js';
const hero=document.querySelector('.hero');
const motion=new DragMotion();
let scale=1,height=840,pointerId=null,lastClientX=0,ready=false,autoRotation=0,startAngle=-180;
const cards=[...document.querySelectorAll('.card-product')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const overlaps=cards.map(card=>{
 const copy=card.cloneNode(true);copy.className='card-overlap';card.after(copy);return copy;
});
let elapsed=reduced.matches?4.2:0,lastFrame=null;
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
  if(!reduced.matches&&!motion.dragging)autoRotation+=spinAt(elapsed)-spinAt(previous);
  motion.tick(dt);
  lastFrame=time;render();
  if(elapsed>=4.2)document.body.classList.add('is-settled');
 }else lastFrame=null;
 requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{
 lastFrame=null;document.body.classList.toggle('is-paused',document.hidden);
 if(document.hidden){release();motion.velocity=0;}
});
reduced.addEventListener('change',()=>{
 release();motion.velocity=0;
 elapsed=Math.max(elapsed,4.2);lastFrame=null;
 document.body.classList.toggle('is-reduced',reduced.matches);
 document.body.classList.add('is-settled');render();
});
function release(event){
 if(event&&event.pointerId!==pointerId)return;
 const captured=pointerId;pointerId=null;motion.end(event?.timeStamp);hero.classList.remove('is-dragging');
 if(captured!==null&&hero.hasPointerCapture(captured))hero.releasePointerCapture(captured);
}
hero.addEventListener('pointerdown',event=>{
 if(!ready||(!reduced.matches&&elapsed<4.2)||event.button!==0||pointerId!==null||event.target.closest('button,a,.intro'))return;
 pointerId=event.pointerId;lastClientX=event.clientX;motion.begin(event.clientX/scale,event.timeStamp);
 hero.setPointerCapture(pointerId);hero.classList.add('is-dragging');
});
hero.addEventListener('pointermove',event=>{if(event.pointerId===pointerId){lastClientX=event.clientX;motion.move(event.clientX/scale,event.timeStamp);}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])hero.addEventListener(event,release);
hero.addEventListener('dragstart',event=>event.preventDefault());
hero.addEventListener('keydown',event=>{
 if(event.target!==hero||!ready||(!reduced.matches&&elapsed<4.2)||!['ArrowLeft','ArrowRight'].includes(event.key))return;
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

