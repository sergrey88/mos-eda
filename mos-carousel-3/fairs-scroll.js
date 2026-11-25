import {fairsLayout,fairsFrame} from './fairs-scroll-model.js';
const root=document.documentElement;
const cover=document.querySelector('.hero-cover');
const intro=document.querySelector('.market-intro');
const content=document.querySelector('.market-content');
let layout,pending=false;
function update(){
 pending=false;
 if(!layout)return;
 const frame=fairsFrame(scrollY,layout);
 root.style.setProperty('--content-scroll-offset',`${frame.contentOffset}px`);
 if(scrollY>=layout.revealAt)intro.classList.add('is-visible');
}
function measure(){
 const heroHeight=cover.getBoundingClientRect().height;
 const heroScale=Number(root.style.getPropertyValue('--scale'))||1;
 layout=fairsLayout(heroScale,heroHeight);
 const scale=layout.contentScale;
 root.style.setProperty('--content-scale',scale);
 root.style.setProperty('--market-left',`${(document.documentElement.clientWidth-1600*scale)/2}px`);
 root.style.setProperty('--backdrop-px',`${layout.backdropHeight}px`);
 root.style.setProperty('--backdrop-track-height',`${layout.backdropTrackHeight}px`);
 root.style.setProperty('--content-height',`${content.offsetHeight}px`);
 update();
}
function requestUpdate(){if(!pending){pending=true;requestAnimationFrame(update);}}
addEventListener('scroll',requestUpdate,{passive:true});
addEventListener('resize',measure);
new ResizeObserver(measure).observe(content);
addEventListener('hero:resize',measure);
function goToFairs(){
 scrollTo({top:layout.heroHeight,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
document.querySelector('.anchor-nav-item').addEventListener('click',goToFairs);
document.querySelector('.scroll-cue').addEventListener('click',goToFairs);
measure();
