import assert from 'node:assert/strict';
import {sampleOrbit, entrance, spinAt, CARD_COUNT} from '../orbit.js';
assert.equal(CARD_COUNT,11);
const near=(a,b)=>assert.ok(Math.abs(a-b)<.02,`${a} != ${b}`);
// Syrniki and mochi must occupy the art-directed top positions.
let p=sampleOrbit(2,0); near(p.x,676.978);near(p.y,490.0685);near(p.angle,-16.11);
p=sampleOrbit(3,0);near(p.x,926.988);near(p.y,486.432);near(p.angle,16.89);
for(let i=0;i<CARD_COUNT;i++){
 const start=entrance(0,i);assert.equal(start.opacity,0);
 const a=entrance(4.2-1e-5,i),b=entrance(4.2,i);assert.ok(Math.abs(a.rotation-b.rotation)<.001);near(b.opacity,1);
 const f=sampleOrbit(i,360),n=sampleOrbit(i,0);near(f.x,n.x);near(f.y,n.y);
}
const a=sampleOrbit(3,0),b=sampleOrbit(3,1);assert.ok(b.x>a.x,'Top arc travels clockwise');
near(spinAt(.9),0);assert.ok(spinAt(8)>spinAt(7));near(spinAt(5)-spinAt(4.2),4.4*.8);
console.log('PASS: 11 cards, Figma positions, clockwise, continuity, periodicity, speed');
