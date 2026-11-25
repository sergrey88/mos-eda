import assert from 'node:assert/strict';
import {FishFocus} from '../fish-focus.js';
import {sampleOrbit} from '../orbit.js';
for(const rotation of [-1500,-181,0,170,900]){
 const f=new FishFocus();f.enter(rotation);assert.ok(Math.abs(f.target-rotation)<=180);
 f.tick(.325);const halfway=f.rotation;assert.ok(!f.settled);f.tick(.325);assert.ok(f.settled);
 const p=sampleOrbit(5,f.rotation);assert.ok(Math.abs(((p.angle%360)+360)%360)<.001||Math.abs(((p.angle%360)+360)%360-360)<.001);
 assert.ok(Math.abs(p.x-800)<2&&p.y<500);
 f.tick(2);assert.equal(f.rotation,f.target);f.leave();assert.equal(f.active,false);
 f.enter(halfway);assert.equal(f.rotation,halfway);f.tick(1.2);assert.ok(f.settled);
}
const reduced=new FishFocus();reduced.enter(27,true);assert.ok(reduced.settled);assert.equal(reduced.rotation,reduced.target);
console.log('PASS: nearest fish alignment, smooth focus, stationary hold, leave/re-enter, reduced motion');
