import {sampleOrbit} from './orbit.js';
const uprightRotation=-sampleOrbit(5,0).angle;
export class FishFocus{
 constructor(){this.active=false;this.settled=false;this.rotation=0;}
 enter(rotation,reduced=false){
  const delta=((uprightRotation-rotation+180)%360+360)%360-180;
  this.from=rotation;this.target=rotation+delta;this.elapsed=0;
  this.active=true;this.settled=reduced||Math.abs(delta)<.001;
  this.rotation=this.settled?this.target:rotation;
 }
 tick(dt){
  if(!this.active||this.settled)return;
  this.elapsed+=Math.max(0,dt);const p=Math.min(1,this.elapsed/1.2);
  this.rotation=this.from+(this.target-this.from)*p*p*(3-2*p);
  this.settled=p===1;
 }
 leave(){this.active=false;this.settled=false;}
}
