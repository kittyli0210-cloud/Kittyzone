import React, { Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { BowSystem } from './Bow';
import { Topper } from './Topper';
import { Colors } from '../utils/math';

interface ExperienceProps {
  isTreeForm: boolean;
}

const SceneContent: React.FC<ExperienceProps> = ({ isTreeForm }) => {
  return (
    <>
      <ambientLight intensity={0.5} color="#001100" />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={2} 
        color="#fffaed" 
        castShadow 
      />
      {/* Moved point light up to match new tree position */}
      <pointLight position={[-10, 2, -5]} intensity={1} color={Colors.Gold} />
      
      {/* Dynamic Environment for Reflections */}
      <Environment preset="city" />

      {/* Adjusted Group Position: Lowered from 0.5 to -0.5 to balance top/bottom spacing */}
      <group position={[0, -0.5, 0]}>
        {/* The Needle Particles */}
        <Foliage isTreeForm={isTreeForm} />

        {/* Ornaments: Gold Spheres */}
        <Ornaments 
          isTreeForm={isTreeForm} 
          type="sphere" 
          count={200} 
          color={Colors.GoldMetallic} 
          scaleBase={0.35} 
        />

        {/* Ornaments: Red/Dark Boxes (Gifts) */}
        <Ornaments 
          isTreeForm={isTreeForm} 
          type="box" 
          count={40} 
          color={new THREE.Color('#4a0404')} 
          scaleBase={0.6} 
        />

         {/* Ornaments: Pure Light Orbs (Small white/gold glowing dots) */}
         <Ornaments 
          isTreeForm={isTreeForm} 
          type="sphere" 
          count={150} 
          color={new THREE.Color('#fffdd0')} 
          scaleBase={0.1} 
        />

        {/* Scattered ribbons */}
        <BowSystem isTreeForm={isTreeForm} />

        {/* Star Topper */}
        <Topper isTreeForm={isTreeForm} />
      </group>

      {/* Floor Shadows - Positioned at the visual bottom of the tree (-0.5 - 6 = -6.5) */}
      <ContactShadows position={[0, -6.5, 0]} opacity={0.5} scale={40} blur={2} far={10} resolution={256} color="#000000" />
      
      {/* Background Ambience */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </>
  );
};

export const Experience: React.FC<ExperienceProps> = ({ isTreeForm }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 25], fov: 45 }}
      gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      shadows
    >
      <color attach="background" args={[Colors.DeepBackground.r, Colors.DeepBackground.g, Colors.DeepBackground.b]} />
      
      <Suspense fallback={null}>
        <SceneContent isTreeForm={isTreeForm} />
      </Suspense>

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={40}
        autoRotate={isTreeForm} // Rotate only when formed
        autoRotateSpeed={0.5}
      />

      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0.6} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.6} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </Canvas>
  );
};