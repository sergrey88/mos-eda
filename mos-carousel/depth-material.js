import * as THREE from './vendor/three.module.js';

export function createDepthMaterial(map, pass) {
  const material = new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide, transparent: true, depthWrite: false });
  material.onBeforeCompile = shader => {
    shader.uniforms.uFrontPass = pass;
    shader.vertexShader = 'varying float vCardDepth;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvCardDepth = (modelMatrix * vec4(transformed, 1.0)).z;');
    shader.fragmentShader = 'uniform float uFrontPass;\nvarying float vCardDepth;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      // World depth is interpolated across the curved surface, not switched per card.
      float clarity = smoothstep(-220.0, 350.0, vCardDepth);
      vec2 spread = vec2(14.0 / 1536.0, 14.0 / 648.0) * (uFrontPass > 0.5 ? 1.0 - clarity : 0.0);
      vec4 sampledDiffuseColor = texture2D(map, vMapUv) * 0.25;
      sampledDiffuseColor += texture2D(map, vMapUv + vec2(spread.x, 0.0)) * 0.125;
      sampledDiffuseColor += texture2D(map, vMapUv - vec2(spread.x, 0.0)) * 0.125;
      sampledDiffuseColor += texture2D(map, vMapUv + vec2(0.0, spread.y)) * 0.125;
      sampledDiffuseColor += texture2D(map, vMapUv - vec2(0.0, spread.y)) * 0.125;
      sampledDiffuseColor += texture2D(map, vMapUv + spread) * 0.0625;
      sampledDiffuseColor += texture2D(map, vMapUv - spread) * 0.0625;
      sampledDiffuseColor += texture2D(map, vMapUv + vec2(spread.x, -spread.y)) * 0.0625;
      sampledDiffuseColor += texture2D(map, vMapUv + vec2(-spread.x, spread.y)) * 0.0625;
      diffuseColor *= sampledDiffuseColor;
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float opacity = mix(0.24, 1.0, clarity);
      float frontAlpha = opacity * clarity;
      // Compensate normal alpha blending so the two passes do not double-darken.
      float rearAlpha = opacity * (1.0 - clarity) / max(1.0 - frontAlpha, 0.0001);
      diffuseColor.a *= uFrontPass > 0.5 ? frontAlpha : rearAlpha;
      #include <opaque_fragment>
    `);
  };
  return material;
}
