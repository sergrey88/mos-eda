// Fit the 1600 x 840 composition uniformly into the space below the native header.
export function screenLayout(width,viewportHeight){
 const pageHeight=Math.max(800,viewportHeight),available=pageHeight-64;
 const scale=Math.min(width/1600,available/840);
 return {scale,height:available/scale,left:(width-1600*scale)/2,pageHeight};
}
export const sceneHeight=(width,height,headerHeight=64)=>Math.max(840,(height-headerHeight)/(width/1600));
export class DragMotion{
 constructor(){this.rotation=0;this.velocity=0;this.dragging=false;}
 begin(x,time){this.dragging=true;this.velocity=0;this.lastX=x;this.lastTime=time;}
 move(x,time){
  if(!this.dragging)return;
  const delta=(x-this.lastX)*.12,dt=Math.max(.008,(time-this.lastTime)/1000);
  this.rotation+=delta;this.velocity=.5*this.velocity+.5*Math.max(-240,Math.min(240,delta/dt));
  this.lastX=x;this.lastTime=time;
 }
 end(time=this.lastTime){if(time-this.lastTime>80)this.velocity=0;this.dragging=false;}
 tick(dt){if(this.dragging)return;dt=Math.min(.05,Math.max(0,dt));const decay=Math.exp(-2.1*dt);this.rotation+=this.velocity*(1-decay)/2.1;this.velocity*=decay;}
}
