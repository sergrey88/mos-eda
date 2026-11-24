import assert from 'node:assert/strict';
import {entrance,sampleOrbit,entryStartAngle} from '../orbit.js';
for(const height of [700,840,1080,1800,2200]){
 const angle=entryStartAngle(height);
 assert.equal(entrance(.89,0,angle).opacity,0,'No cards before title finishes');
 const e=entrance(.94,0,angle),p=sampleOrbit(0,e.rotation);
 const rad=p.angle*Math.PI/180;
 const top=p.y-(Math.abs(Math.sin(rad))*p.w+Math.abs(Math.cos(rad))*p.h)/2;
 assert.ok(e.opacity>.1&&top<height-32,`First card must be visibly entering immediately after heading at height ${height}: top=${top}`);
}
console.log('PASS: no idle gap after heading across short and tall viewports');
