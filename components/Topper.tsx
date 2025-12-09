import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getScatterPosition } from '../utils/math';

interface TopperProps {
  isTreeForm: boolean;
}

export const Topper: React.FC<TopperProps> = ({ isTreeForm }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Static Data
  const scatterPos = useMemo(() => getScatterPosition(), []);
  const treePos = useMemo(() => new THREE.Vector3(0, 6.2, 0), []);
  const progress = useRef(0);

  // Generate Star Geometry
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.6;
    const innerRadius = 0.3;
    
    // Fix: Start at PI/2 (90 degrees) to point UP. 
    // 0 rad is 3 o'clock, PI/2 is 12 o'clock.
    const angleOffset = Math.PI / 2; 

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points + angleOffset;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.05,
      bevelSegments: 3
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center(); // Center geometry for proper rotation
    return geo;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current || !glowRef.current) return;

    const target = isTreeForm ? 1 : 0;
    progress.current = THREE.MathUtils.damp(progress.current, target, 1.5, delta);
    
    const t = progress.current;
    
    // Cubic In-Out Easing
    const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Position Interpolation
    const currentPos = new THREE.Vector3().lerpVectors(scatterPos, treePos, easedT);
    meshRef.current.position.copy(currentPos);
    glowRef.current.position.copy(currentPos);

    // Scale
    const scale = THREE.MathUtils.lerp(0.1, 1, easedT);
    meshRef.current.scale.setScalar(scale);
    glowRef.current.scale.setScalar(scale * 1.4); // Glow is slightly larger

    // Rotation
    if (t < 0.95) {
      // Chaotic spin when scattering
      meshRef.current.rotation.x += delta * 2;
      meshRef.current.rotation.y += delta * 2;
      meshRef.current.rotation.z += delta * 2;
    } else {
      // Gentle majestic spin when formed
      // Force X and Z to 0 so it stands straight
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, delta * 4);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, delta * 4);
      
      // Continuous slow Y rotation (Spinning around vertical axis)
      meshRef.current.rotation.y += delta * 0.5;
    }
    
    // Sync glow rotation
    glowRef.current.rotation.copy(meshRef.current.rotation);
  });

  return (
    <group>
      {/* Main Gold Star */}
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color="#FFD700"
          emissive="#FDB931"
          emissiveIntensity={0.8}
          roughness={0.15}
          metalness={1.0}
        />
      </mesh>

      {/* Bloom Halo (Invisible geometry, used for bloom pass trigger) */}
      <mesh ref={glowRef} geometry={geometry}>
         <meshBasicMaterial 
            color="#FFFFAA" 
            transparent 
            opacity={0.4} 
            blending={THREE.AdditiveBlending} 
            depthWrite={false}
         />
      </mesh>
    </group>
  );
};