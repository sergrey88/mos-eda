import assert from 'node:assert/strict';
import {fairsLayout,fairsFrame} from '../fairs-scroll-model.js';
import {screenLayout} from '../motion.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<.01,`${a} != ${b}`);
const layout=fairsLayout(1,840);
near(layout.contentTop,1517);near(layout.backdropHeight,1013);near(layout.backdropTrackHeight,1853);
near(fairsFrame(0,layout).heroBottom,904);
near(fairsFrame(450,layout).heroBottom,454);
near(fairsFrame(780,layout).contentTop,776);
near(fairsFrame(840,layout).contentTop,677);
near(fairsFrame(0,layout).backdropTop,64);near(fairsFrame(780,layout).backdropTop,64);
near(fairsFrame(940,layout).backdropTop,-36);
for(const y of [0,450,780,840,1100,780,450,0]){
 const f=fairsFrame(y,layout);assert.ok(Object.values(f).every(Number.isFinite));near(f.heroBottom,904-y);
}
const small=fairsLayout(.5,736);near(small.contentScale,.5);near(small.contentTop,1106.5);
for(const [width,height] of [[1920,800],[1600,904],[1024,1000],[1920,600]]){
 const hero=screenLayout(width,height);
 const fairs=fairsLayout(hero.scale,hero.pageHeight-64);
 near((width-1440*fairs.contentScale)/2,hero.left+80*hero.scale);
 near(fairs.backdropHeight,1013*hero.scale);
 near(fairs.contentTop,hero.pageHeight+613*hero.scale);
}
console.log('PASS: storyboard positions, pinned backdrop, overlapping content, reversible scroll, scaling');
