import assert from 'node:assert/strict';
import {DragMotion,sceneHeight} from '../motion.js';
assert.equal(sceneHeight(1600,1200),1136);
assert.equal(sceneHeight(1600,901),840);
assert.equal(sceneHeight(800,450),840);
const m=new DragMotion();m.begin(0,0);m.move(100,100);assert.ok(m.rotation>0);const r=m.rotation;m.tick(.02);assert.equal(m.rotation,r);m.end(100);m.tick(.02);assert.ok(m.rotation>r);const v=m.velocity;m.tick(.02);assert.ok(m.velocity<v);m.end(500);assert.equal(m.velocity,0);
console.log('PASS: scene height, dragging, inertia, stale release');
