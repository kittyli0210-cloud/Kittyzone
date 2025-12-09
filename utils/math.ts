import * as THREE from 'three';

// Constants for the tree shape
const TREE_HEIGHT = 12;
const TREE_RADIUS_BASE = 5.5; // Reverted to 5.5
const SCATTER_RADIUS = 25;

/**
 * Generates a random position within a sphere (Scattered State)
 */
export const getScatterPosition = (): THREE.Vector3 => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = Math.cbrt(Math.random()) * SCATTER_RADIUS; // Uniform distribution in sphere

  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
};

/**
 * Generates a position on a cone volume (Tree State)
 */
export const getTreePosition = (yRatio: number, jitter: number = 0): THREE.Vector3 => {
  // yRatio is 0 (bottom) to 1 (top)
  const y = (yRatio * TREE_HEIGHT) - (TREE_HEIGHT / 2);
  
  // Radius decreases as we go up
  // Reverted to linear cone shape
  const currentRadius = TREE_RADIUS_BASE * (1 - yRatio);
  
  // Spiral distribution for better aesthetics + random jitter
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * currentRadius; // Uniform distribution in circle slice

  // Apply positions
  return new THREE.Vector3(
    r * Math.cos(angle) + (Math.random() - 0.5) * jitter,
    y + (Math.random() - 0.5) * jitter,
    r * Math.sin(angle) + (Math.random() - 0.5) * jitter
  );
};

export const Colors = {
  EmeraldDark: new THREE.Color('#013d29'),
  EmeraldLight: new THREE.Color('#0f6b4e'),
  Gold: new THREE.Color('#FFD700'),
  GoldMetallic: new THREE.Color('#C5A059'),
  DeepBackground: new THREE.Color('#021a0f'),
};