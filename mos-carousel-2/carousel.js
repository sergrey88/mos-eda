import { sampleOrbit, entrance, OrbitMotion, cardPhase } from './orbit.js?v=7';
import { screenLayout } from './layout.js?v=8';

const hero=document.querySelector('.hero');
const cards=[...document.querySelectorAll('.card-product')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const motion=new OrbitMotion({reduced:reduced.matches});
let scale=1,ready=false,elapsed=reduced.matches?4.05:0,lastFrame=null,pointerId=null,lastClientX=0;

function resize(){
  const layout=screenLayout(document.documentElement.clientWidth,innerHeight);
  scale=layout.scale;
  document.documentElement.style.setProperty('--scale',scale);
  document.documentElement.style.setProperty('--board-left',`${layout.left}px`);
  document.documentElement.style.setProperty('--board-height',`${layout.height}px`);
  document.body.style.minHeight=`${layout.pageHeight}px`;
  // Rebase an active gesture so resizing cannot generate a rotation jump.
  if(motion.dragging)motion.lastX=lastClientX/scale;
}
resize();addEventListener('resize',resize);

function render(){
  cards.forEach((el,index)=>{
    const entry=motion.reduced?{opacity:1,offset:0,expansion:1,yOffset:0}:entrance(elapsed,index);
    const p=sampleOrbit(cardPhase(index)+motion.phase-entry.offset);
    const x=800+(p.x-800)*entry.expansion,y=360+(p.y-360)*entry.expansion+entry.yOffset;
    el.style.width=`${p.w.toFixed(3)}px`;
    el.style.height=`${p.h.toFixed(3)}px`;
    el.style.borderRadius=`${p.r.toFixed(3)}px`;
    el.style.transform=`translate3d(${(x-p.w/2).toFixed(3)}px,${(y-p.h/2).toFixed(3)}px,0)`;
    el.style.opacity=(entry.opacity*p.a).toFixed(4);
    el.style.visibility=entry.opacity>.001?'visible':'hidden';
    el.style.zIndex=p.z<0?Math.min(19,Math.round(20+p.z*10)):Math.max(41,Math.round(40+p.z*10));
  });
}

function frame(time){
  if(!document.hidden){
    const seconds=lastFrame===null?0:Math.max(0,(time-lastFrame)/1000);
    const dt=Math.min(.05,seconds);
    elapsed+=seconds;
    if(elapsed>=4.05)document.body.classList.add('is-settled');
    // Start spinning during formation and smoothly reach the reference speed.
    if(elapsed>=.75)motion.tick(dt*Math.min(1,(elapsed-.75)/3.3));
    render();lastFrame=time;
  }else lastFrame=null;
  requestAnimationFrame(frame);
}

function release(e){
  if(e.pointerId!==pointerId)return;
  const captured=pointerId;pointerId=null;
  motion.end(e.timeStamp);hero.classList.remove('is-dragging');
  if(hero.hasPointerCapture(captured))hero.releasePointerCapture(captured);
}
hero.addEventListener('pointerdown',e=>{
  if(!ready||(!motion.reduced&&elapsed<4.05)||e.button!==0||pointerId!==null||e.target.closest('button,a,.intro'))return;
  pointerId=e.pointerId;lastClientX=e.clientX;
  motion.begin(e.clientX/scale,e.timeStamp);
  hero.setPointerCapture(pointerId);hero.classList.add('is-dragging');
});
hero.addEventListener('pointermove',e=>{
  if(e.pointerId!==pointerId)return;
  lastClientX=e.clientX;motion.move(e.clientX/scale,e.timeStamp);
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])hero.addEventListener(event,release);
hero.addEventListener('dragstart',e=>e.preventDefault());
hero.addEventListener('keydown',e=>{
  if(e.target!==hero||!ready||(!motion.reduced&&elapsed<4.05)||!['ArrowLeft','ArrowRight'].includes(e.key))return;
  e.preventDefault();motion.phase+=e.key==='ArrowRight'?-1:1;motion.velocity=0;render();
});
document.addEventListener('visibilitychange',()=>{
  lastFrame=null;document.body.classList.toggle('is-paused',document.hidden);
  if(document.hidden){
    motion.end();motion.velocity=0;
    const captured=pointerId;pointerId=null;
    if(captured!==null&&hero.hasPointerCapture(captured))hero.releasePointerCapture(captured);
    hero.classList.remove('is-dragging');
  }
});
reduced.addEventListener('change',e=>{
  motion.reduced=e.matches;motion.velocity=0;
  if(e.matches){elapsed=Math.max(elapsed,4.05);document.body.classList.add('is-settled');}
  document.body.classList.toggle('is-reduced',e.matches);
  if(ready)render();
});

async function init(){
  const resources=await Promise.allSettled([
    document.fonts.load('600 280px "Roboto Flex"'),
    document.fonts.load('400 16px "Geologica"'),
    document.fonts.load('400 16px "Golos Text"'),
    ...[...document.querySelectorAll('#mos-header img, .hero img')].map(img=>img.decode()),
  ]);
  if(resources.some(result=>result.status==='rejected')){
    const error=document.querySelector('.error');
    error.textContent='Часть ресурсов не загрузилась. Проверь, что папка assets находится рядом с index.html.';
    error.hidden=false;
  }
  document.body.classList.toggle('is-reduced',motion.reduced);
  if(motion.reduced)document.body.classList.add('is-settled');
  document.body.classList.toggle('is-paused',document.hidden);
  ready=true;document.body.classList.add('is-ready');
  render();requestAnimationFrame(frame);
}
init();
