import React, { useRef, useMemo, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getScatterPosition, getTreePosition, Colors } from '../utils/math';

interface OrnamentData {
  scatterPos: THREE.Vector3;
  treePos: THREE.Vector3;
  scale: number;
  rotationSpeed: THREE.Vector3;
  phase: number;
}

interface OrnamentsProps {
  isTreeForm: boolean;
  type: 'sphere' | 'box';
  count: number;
  color: THREE.Color;
  scaleBase: number;
}

export const Ornaments: React.FC<OrnamentsProps> = ({ isTreeForm, type, count, color, scaleBase }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  
  // Generate Data
  const data = useMemo(() => {
    const items: OrnamentData[] = [];
    for (let i = 0; i < count; i++) {
      const scatterPos = getScatterPosition();
      
      // Tree position logic varies slightly for ornaments (on surface vs inside)
      // We push them slightly outward to sit ON the needles
      const yRatio = Math.random(); 
      const treePos = getTreePosition(yRatio, 0.5);
      
      // Push outward based on center radius logic to sit on surface
      // Simple approximation: Normalize x/z and push out
      const radiusAtHeight = Math.sqrt(treePos.x * treePos.x + treePos.z * treePos.z);
      if (radiusAtHeight > 0.1) {
         const pushFactor = 1.1; 
         treePos.x *= pushFactor;
         treePos.z *= pushFactor;
      }

      items.push({
        scatterPos,
        treePos,
        scale: Math.random() * 0.5 + 0.5,
        rotationSpeed: new THREE.Vector3(
          Math.random() * 0.02,
          Math.random() * 0.02,
          Math.random() * 0.02
        ),
        phase: Math.random() * Math.PI * 2
      });
    }
    return items;
  }, [count]);

  // Current animation state (for manual lerping in JS)
  const currentProgress = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const target = isTreeForm ? 1 : 0;
    // Non-linear damp for smoother "heavy" feel
    currentProgress.current = THREE.MathUtils.damp(currentProgress.current, target, 2, delta);

    const t = currentProgress.current;
    // Cubic in-out easing
    const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    for (let i = 0; i < count; i++) {
      const d = data[i];

      // Interpolate Position
      tempObject.position.lerpVectors(d.scatterPos, d.treePos, easedT);

      // Add floating effect
      const floatY = Math.sin(state.clock.elapsedTime + d.phase) * (isTreeForm ? 0.05 : 0.5);
      tempObject.position.y += floatY;

      // Swirl effect during transition
      if (t > 0.05 && t < 0.95) {
         const swirl = Math.sin(t * Math.PI) * 10;
         const angle = swirl * (1.0 / (i * 0.01 + 1)); // Vary swirl by index
         const x = tempObject.position.x;
         const z = tempObject.position.z;
         tempObject.position.x = x * Math.cos(angle) - z * Math.sin(angle);
         tempObject.position.z = x * Math.sin(angle) + z * Math.cos(angle);
      }

      // Rotation
      tempObject.rotation.x += d.rotationSpeed.x + (isTreeForm ? 0 : 0.01);
      tempObject.rotation.y += d.rotationSpeed.y + (isTreeForm ? 0.01 : 0.01);
      tempObject.rotation.z += d.rotationSpeed.z;

      // Scale (Scale down slightly when scattered for perspective depth feeling)
      const scale = d.scale * scaleBase * (1 - (1-easedT) * 0.3);
      tempObject.scale.setScalar(scale);

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      {type === 'sphere' ? (
        <sphereGeometry args={[1, 32, 32]} />
      ) : (
        <boxGeometry args={[1, 1, 1]} />
      )}
      <meshStandardMaterial 
        color={color} 
        roughness={0.15} 
        metalness={0.9} 
        envMapIntensity={2}
      />
    </instancedMesh>
  );
};