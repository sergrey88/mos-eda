// Exact bounding boxes and rotations from Figma 539:24482, ordered clockwise.
const boxes=[
 [0,427.3,389.742,288.739,-81.66],
 [87.65,140.85,429.502,411.491,-51.11],
 [346.27,4.5,329.416,411.137,-16.11],
 [594.41,0,333.156,412.864,16.89],
 [755.67,136.45,427.662,416.192,48.89],
 [878.86,428.66,389.009,287.47,81.89],
 [828.22,647.66,426.031,367.47,114.75],
 [674.02,801.32,400.975,431.207,145.3],
 [515.33,908.94,241.075,360.071,180.3],
 [196.53,806.21,396.948,431.265,213.3],
 [21,646.8,425.983,367.308,245.3],
];
export const CARD_COUNT=boxes.length;
const center={x:799.933,y:914.5075};
export function sampleOrbit(index,rotation=0){
 const [left,top,w,h,angle]=boxes[index];
 const x=166+left+w/2-center.x,y=280+top+h/2-center.y;
 const rad=rotation*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad);
 return {x:center.x+x*c-y*s,y:center.y+x*s+y*c,w:239.228,h:358.843,angle:angle+rotation};
}
const clamp=x=>Math.max(0,Math.min(1,x));
// Match the reference's quick travel and long, soft landing.
function formationEase(x){
 x=clamp(x);let lo=0,hi=1,t=x;
 for(let i=0;i<20;i++){
  const bx=3*(1-t)**2*t*.22+3*(1-t)*t*t*.36+t**3;
  if(bx<x)lo=t;else hi=t;t=(lo+hi)/2;
 }
 return 1-(1-t)**3;
}
// Start the reveal at the viewport edge, rather than spending visible time
// travelling through the offscreen lower arc after the heading has finished.
export function entryStartAngle(viewportHeight){
 const target=viewportHeight-64;
 let lo=-180,hi=0;
 for(let i=0;i<24;i++){
  const angle=(lo+hi)/2,p=sampleOrbit(0,angle-boxes[0][4]);
  const rad=p.angle*Math.PI/180;
  const top=p.y-(Math.abs(Math.sin(rad))*p.w+Math.abs(Math.cos(rad))*p.h)/2;
  if(top>target)lo=angle;else hi=angle;
 }
 return (lo+hi)/2;
}
export function entrance(elapsed,index,startAngle=entryStartAngle(840)){
 const progress=clamp((elapsed-.9-index*.09)/2.4);
 return {opacity:clamp(progress/.1),rotation:(startAngle-(startAngle>boxes[index][4]?360:0)-boxes[index][4])*(1-formationEase(progress))};
}
// Integral of the reference's linear speed ramp. No speed discontinuity at settling.
export function spinAt(elapsed){
 const t=Math.max(0,elapsed-.9),ramp=3.3;
 return 4.4*(t<ramp?t*t/(2*ramp):t-ramp/2);
}
