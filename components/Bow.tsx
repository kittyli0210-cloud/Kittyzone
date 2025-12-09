import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getScatterPosition, getTreePosition } from '../utils/math';

// --- Assets (Geometry & Material) ---
// Reusable hook to prevent recreating heavy geometries for every bow
const useBowAssets = () => {
  return useMemo(() => {
    // Material: High quality white satin
    const material = new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      emissive: '#111111', 
      roughness: 0.45, 
      metalness: 0.1, 
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      side: THREE.DoubleSide
    });

    // KNOT: A slightly flattened sphere
    const knotGeo = new THREE.SphereGeometry(0.45, 32, 32);
    knotGeo.scale(1, 0.8, 0.7); 

    // LOOP (One side) - Angled Upwards for "X" Shape
    const loopCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),       
      new THREE.Vector3(0.6, 0.8, 0.3), // Start going diagonally up
      new THREE.Vector3(2.2, 2.0, 0),   // Top Tip (High and Wide)
      new THREE.Vector3(2.8, 0.5, 0),   // Wide outer edge
      new THREE.Vector3(2.0, -0.5, 0),  // Bottom return
      new THREE.Vector3(0.8, -0.2, 0.2),// Inner return
      new THREE.Vector3(0, 0, 0),       
    ], true);
    
    // Thicker tube radius (0.45) for plush look
    const loopGeo = new THREE.TubeGeometry(loopCurve, 64, 0.45, 20, true);

    // TAIL (One side) - Flowing Outwards for "X" Shape
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.8, -0.4, 0.3), // Start wide
      new THREE.Vector3(2.2, -1.5, 0.1), // Mid flow (Diagonal)
      new THREE.Vector3(3.5, -3.0, 0.4), // Wide flare at bottom tip (Much wider stance)
    ]);
    const tailGeo = new THREE.TubeGeometry(tailCurve, 64, 0.4, 20, false);

    return { material, knotGeo, loopGeo, tailGeo };
  }, []);
};

// --- Single Bow Mesh (Visual) ---
const BowMesh: React.FC<{ assets: any }> = ({ assets }) => {
  const { material, knotGeo, loopGeo, tailGeo } = assets;
  return (
    <group>
      {/* Center Knot */}
      <mesh geometry={knotGeo} material={material} />

      {/* Right Loop */}
      <mesh geometry={loopGeo} material={material} 
        position={[0.1, 0.1, 0]}
        rotation={[0.1, -0.1, 0.1]} // Slight tilt, geometry does the heavy lifting
        scale={[1, 1, 0.3]} 
      />

      {/* Left Loop (Mirrored) */}
      <mesh geometry={loopGeo} material={material} 
        position={[-0.1, 0.1, 0]}
        rotation={[0.1, 0.1, -0.1]} 
        scale={[-1, 1, 0.3]} 
      />

      {/* Right Tail */}
      <mesh geometry={tailGeo} material={material} 
        position={[0.2, -0.1, 0.1]} 
        rotation={[0.1, 0, 0.1]} // Slight outwards tilt
        scale={[1, 1, 0.25]} 
      />

      {/* Left Tail (Mirrored) */}
      <mesh geometry={tailGeo} material={material} 
        position={[-0.2, -0.1, 0.1]} 
        rotation={[0.1, 0, -0.1]} 
        scale={[-1, 1, 0.25]} 
      />
    </group>
  );
};

// --- Animated Wrapper ---
interface BowAnimatorProps {
  isTreeForm: boolean;
  scatterPos: THREE.Vector3;
  treePos: THREE.Vector3;
  targetScale: number;
  assets: any;
  delayOffset?: number;
}

const BowAnimator: React.FC<BowAnimatorProps> = ({ isTreeForm, scatterPos, treePos, targetScale, assets, delayOffset = 0 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const progress = useRef(0);

  // Pre-calculate random rotation offsets for scatter state
  const randomRotation = useMemo(() => ({
    x: Math.random() * Math.PI,
    y: Math.random() * Math.PI,
    z: Math.random() * Math.PI
  }), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const target = isTreeForm ? 1 : 0;
    progress.current = THREE.MathUtils.damp(progress.current, target, 1.5, delta);
    
    let t = progress.current;
    
    // Smooth easing
    const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Position Interpolation
    groupRef.current.position.lerpVectors(scatterPos, treePos, easedT);

    // Scale Logic
    const s = THREE.MathUtils.lerp(0.2, targetScale, easedT); 
    groupRef.current.scale.setScalar(s);

    // Rotation Logic
    if (t < 0.95) {
       // Spin loosely while moving
       groupRef.current.rotation.x = randomRotation.x + Math.sin(state.clock.elapsedTime + delayOffset) * (1 - t);
       groupRef.current.rotation.y = randomRotation.y + state.clock.elapsedTime * 0.5 * (1 - t);
       groupRef.current.rotation.z = randomRotation.z + Math.cos(state.clock.elapsedTime + delayOffset) * (1 - t);
    } else {
       // Lock orientation
       // Face outward from center
       const angle = Math.atan2(treePos.x, treePos.z);
       groupRef.current.rotation.set(0, angle, 0);
       
       // Gentle Bobbing
       groupRef.current.position.y = treePos.y + Math.sin(state.clock.elapsedTime * 1.5 + delayOffset) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <BowMesh assets={assets} />
    </group>
  );
};

// --- Main Exported Component ---
export const BowSystem: React.FC<{ isTreeForm: boolean }> = ({ isTreeForm }) => {
  const assets = useBowAssets();

  const bowsData = useMemo(() => {
    const items = [];

    // SCATTERED BODY BOWS
    const count = 12;
    for (let i = 0; i < count; i++) {
      const yRatio = 0.2 + Math.random() * 0.6; 
      const rawPos = getTreePosition(yRatio, 0.5);
      
      const radius = Math.sqrt(rawPos.x * rawPos.x + rawPos.z * rawPos.z);
      if (radius > 0) {
        const push = 1.25; // Push out a bit more so they float on tips
        rawPos.x *= push;
        rawPos.z *= push;
      }

      items.push({
        id: `bow-${i}`,
        scatterPos: getScatterPosition(),
        treePos: rawPos,
        scale: 0.18, 
        delay: Math.random() * 10
      });
    }

    return items;
  }, []);

  return (
    <group>
      {bowsData.map((data) => (
        <BowAnimator
          key={data.id}
          isTreeForm={isTreeForm}
          scatterPos={data.scatterPos}
          treePos={data.treePos}
          targetScale={data.scale}
          assets={assets}
          delayOffset={data.delay}
        />
      ))}
    </group>
  );
};
