export function calculateLayout(width, height) {
  const headerScale = width / 1600;
  const heroHeight = Math.max(800, Math.min(917 * headerScale, height - 64 * headerScale));
  const sceneScale = Math.min(headerScale, heroHeight / 917);
  return {
    headerScale,
    heroHeight,
    sceneScale,
    contentScale: sceneScale / headerScale,
    heroLocalHeight: heroHeight / headerScale,
    boardLocalHeight: 64 + heroHeight / headerScale,
    pageHeight: 64 * headerScale + heroHeight,
  };
}
