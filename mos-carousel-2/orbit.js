// Coordinates are relative to the Figma scene at x0 / y61, 1600 × 840.
// A periodic spline preserves the art-directed silhouette of the reference.
const stops = [
  [717,238.5,140,93,0,-.8,.2], [827,188,120,80,0,-1,.3],
  [974.5,130,101,68,0,-.9,.2], [1132,120,140,94,0,-.6,.5],
  [1300,119.5,160,107,0,-.3,1], [1386,192,180,120,0,0,1],
  [1352,347.5,220,147,0,.35,1], [1207,505,290,194,0,.7,1],
  [995,633.5,310,207,0,.9,1], [684,695,350,234,0,1,1],
  [389,677,260,174,0,.8,1], [331,530,216,144,0,.5,1],
  [467,412,180,120,0,-.2,.5], [589,308,160,106,0,-.5,.4],
];
export const CARD_COUNT=stops.length;
// Keep the original 10-unit revolution: angular speed, drag and inertia are unchanged.
export const cardPhase=index=>index*10/CARD_COUNT;
const clamp = x => Math.max(0,Math.min(1,x));
const smooth = x => { x=clamp(x);return x*x*(3-2*x); };
const wrap = x => ((x%10)+10)%10;
export function sampleOrbit(slot) {
  const p=wrap(slot)*CARD_COUNT/10,i=Math.floor(p),t=p-i;
  const points=[-1,0,1,2].map(offset=>stops[(i+offset+CARD_COUNT)%CARD_COUNT]);
  const values=points[0].map((_,k)=>{
    const [a,b,c,d]=points.map(point=>point[k]);
    return .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
  });
  return Object.fromEntries(['x','y','w','h','r','z','a'].map((key,i)=>[key,values[i]]));
}

// Cubic-bezier(.22,1,.36,1), solved for x to keep the ONY entry cadence.
function formationEase(x) {
  x=clamp(x);let lo=0,hi=1,t=x;
  for(let i=0;i<20;i++){
    const bx=3*(1-t)*(1-t)*t*.22+3*(1-t)*t*t*.36+t*t*t;
    if(bx<x)lo=t;else hi=t;
    t=(lo+hi)/2;
  }
  return 1-(1-t)**3;
}
export function entrance(elapsed,index) {
  if(elapsed<.75)return {opacity:0,offset:11.43,expansion:1.75,yOffset:420};
  if(elapsed>=4.05)return {opacity:1,offset:0,expansion:1,yOffset:0};
  const travel=(1-formationEase((elapsed-.75)/3.3))*11.43;
  // Shift the reveal gate to the lower/front arc. The final orbit stays intact.
  const order=(cardPhase(index)+2)%10;
  const reveal=clamp((order+1.43-travel)/1.43);
  const progress=smooth(reveal);
  return {opacity:progress,offset:travel,expansion:1+.75*(1-progress),yOffset:420*(1-progress)};
}

export class OrbitMotion {
  constructor({reduced=false}={}) {
    this.phase=0;this.velocity=0;this.dragging=false;this.reduced=reduced;
  }
  tick(dt) {
    dt=Math.max(0,Math.min(dt,.05));
    if(this.dragging)return;
    const decay=Math.exp(-2.1*dt);
    this.phase+=this.velocity*(1-decay)/2.1;
    this.velocity*=decay;
    if(!this.reduced)this.phase+=(4.4/360*10)*dt;
    this.phase=wrap(this.phase);
  }
  begin(x,time) {
    this.dragging=true;this.velocity=0;this.lastX=x;this.lastTime=time;
  }
  move(x,time) {
    if(!this.dragging)return;
    // Increasing phase moves the front arc left: follow the gesture there.
    const delta=-(x-this.lastX)/510*1.15/(Math.PI*2)*10;
    this.phase+=delta;
    const dt=Math.max(.008,(time-this.lastTime)/1000);
    this.velocity=.5*this.velocity+.5*Math.max(-8,Math.min(8,delta/dt));
    this.lastX=x;this.lastTime=time;
  }
  end(time=this.lastTime) {
    if(time-this.lastTime>80)this.velocity=0;
    this.dragging=false;
  }
}
