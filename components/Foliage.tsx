import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getScatterPosition, getTreePosition, Colors } from '../utils/math';

const FOLIAGE_COUNT = 8500; // Reverted to 8500

// Vertex Shader: Interpolates between scatter and tree positions
const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform float uPixelRatio;

  attribute vec3 aPositionScatter;
  attribute vec3 aPositionTree;
  attribute float aRandom;
  attribute float aSize;

  varying vec2 vUv;
  varying float vRandom;
  varying float vAlpha;

  // Easing function: Cubic In-Out
  float cubicInOut(float t) {
    return t < 0.5
      ? 4.0 * t * t * t
      : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    vUv = uv;
    vRandom = aRandom;

    // Smooth transition
    float t = cubicInOut(uProgress);
    
    // Add some delay based on randomness for organic transition effect
    float delay = aRandom * 0.2;
    float localProgress = clamp((uProgress - delay) / (1.0 - 0.2), 0.0, 1.0);
    float localT = cubicInOut(localProgress);

    // Interpolate position
    vec3 pos = mix(aPositionScatter, aPositionTree, localT);

    // Add breathing/wind effect
    float breathe = sin(uTime * 1.5 + aRandom * 10.0) * 0.05;
    if (uProgress > 0.8) {
      pos.x += breathe;
      pos.z += breathe;
    }

    // Swirling effect during transition
    if (uProgress > 0.1 && uProgress < 0.9) {
      float swirlStrength = sin(uProgress * 3.14159) * 5.0 * (1.0 - aRandom);
      float angle = swirlStrength;
      float x = pos.x * cos(angle) - pos.z * sin(angle);
      float z = pos.x * sin(angle) + pos.z * cos(angle);
      pos.x = x;
      pos.z = z;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation
    gl_PointSize = (aSize * 40.0 * uPixelRatio) / -mvPosition.z;
    
    // Fade in/out size slightly
    gl_PointSize *= (0.8 + 0.2 * sin(uTime * 2.0 + aRandom * 100.0));

    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment Shader: Gold-rimmed emerald particles
const fragmentShader = `
  uniform vec3 uColorGreen;
  uniform vec3 uColorGold;

  varying float vRandom;

  void main() {
    // Circular particle
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Soft glow edge
    float glow = 1.0 - smoothstep(0.3, 0.5, dist);
    
    // Mix Gold Edge with Green Center
    // If vRandom is high, it's a "sparkle" particle (more gold)
    float goldMix = smoothstep(0.35, 0.5, dist); // Edge is gold
    
    vec3 finalColor = mix(uColorGreen, uColorGold, goldMix);
    
    // Add extra brightness for sparkle particles
    if (vRandom > 0.9) {
      finalColor = mix(finalColor, vec3(1.0), 0.5);
    }

    gl_FragColor = vec4(finalColor, 1.0);
    
    // Tonemapping fix (simple approximation)
    gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0/2.2)); 
  }
`;

interface FoliageProps {
  isTreeForm: boolean;
}

export const Foliage: React.FC<FoliageProps> = ({ isTreeForm }) => {
  const meshRef = useRef<THREE.Points>(null);
  
  // Geometry Data Generation
  const { positionsScatter, positionsTree, randoms, sizes } = useMemo(() => {
    const pScatter = new Float32Array(FOLIAGE_COUNT * 3);
    const pTree = new Float32Array(FOLIAGE_COUNT * 3);
    const rnd = new Float32Array(FOLIAGE_COUNT);
    const sz = new Float32Array(FOLIAGE_COUNT);

    for (let i = 0; i < FOLIAGE_COUNT; i++) {
      // Scatter
      const sc = getScatterPosition();
      pScatter[i * 3] = sc.x;
      pScatter[i * 3 + 1] = sc.y;
      pScatter[i * 3 + 2] = sc.z;

      // Tree (More density at bottom, tapered top)
      const yRatio = Math.pow(Math.random(), 0.8); // Bias slightly towards top for even visual distribution on volume
      const tr = getTreePosition(yRatio, 0.2);
      pTree[i * 3] = tr.x;
      pTree[i * 3 + 1] = tr.y;
      pTree[i * 3 + 2] = tr.z;

      // Attributes
      rnd[i] = Math.random();
      sz[i] = Math.random() * 0.5 + 0.5; // Size variation
    }

    return {
      positionsScatter: pScatter,
      positionsTree: pTree,
      randoms: rnd,
      sizes: sz
    };
  }, []);

  // Shader Uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uColorGreen: { value: Colors.EmeraldLight },
    uColorGold: { value: Colors.Gold }
  }), []);

  // Animation Loop
  useFrame((state, delta) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Smoothly interpolate progress
      const target = isTreeForm ? 1 : 0;
      material.uniforms.uProgress.value = THREE.MathUtils.lerp(
        material.uniforms.uProgress.value,
        target,
        delta * 1.5 // Transition speed
      );
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={FOLIAGE_COUNT}
          array={positionsScatter} // Initial fallback
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPositionScatter"
          count={FOLIAGE_COUNT}
          array={positionsScatter}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPositionTree"
          count={FOLIAGE_COUNT}
          array={positionsTree}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={FOLIAGE_COUNT}
          array={randoms}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={FOLIAGE_COUNT}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};