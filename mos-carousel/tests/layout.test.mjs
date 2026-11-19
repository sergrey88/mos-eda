import assert from 'node:assert/strict';

export function runLayoutTests(calculateLayout) {
  const results = [];
  function test(name, run) {
    try { run(); results.push({ name, pass: true }); }
    catch (error) { results.push({ name, pass: false, error: error.message }); }
  }
  const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < .001, `${actual} != ${expected}`);
  test('1920×1080 fits below the header', () => {
    const l = calculateLayout(1920, 1080);
    near(l.heroHeight, 1003.2); near(l.pageHeight, 1080);
    assert.ok(l.sceneScale < l.headerScale);
  });
  test('1600×900 scales the whole composition to 836px', () => {
    const l = calculateLayout(1600, 900);
    near(l.heroHeight, 836); near(l.sceneScale, 836 / 917);
    near(l.contentScale * l.headerScale, l.sceneScale);
  });
  test('Short windows stop shrinking at 800px and scroll', () => {
    const l = calculateLayout(1600, 600);
    near(l.heroHeight, 800); near(l.sceneScale, 800 / 917); near(l.pageHeight, 864);
  });
  test('At the 800px boundary the header and scene fit exactly', () => {
    const l = calculateLayout(1600, 864);
    near(l.heroHeight, 800); near(l.pageHeight, 864);
  });
  test('Narrow windows retain the width constraint and 800px block', () => {
    const l = calculateLayout(800, 600);
    near(l.heroHeight, 800); near(l.sceneScale, .5);
    assert.ok(1600 * l.sceneScale <= 800);
  });
  test('Tall windows keep the original composition size', () => {
    const l = calculateLayout(1600, 1400);
    near(l.sceneScale, 1); near(l.heroHeight, 917);
  });
  return results;
}
